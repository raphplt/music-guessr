"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Sample-accurate clip player built on the Web Audio API.
 *
 * The whole 30-second preview is fetched once per round (through /api/audio,
 * authenticated by the sealed round token), decoded into an AudioBuffer and
 * played with `source.start(when, offset, duration)` so a 0.1-second clue is
 * really 0.1 seconds — HTMLAudioElement can't guarantee that.
 */

export type PlayerState =
  | "idle"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "blocked"
  | "muted"
  | "network-error"
  | "decode-error";

export type Playback = { scheduledSeconds: number; measuredSeconds: number };

const bufferCache = new Map<string, ArrayBuffer>();
const inflight = new Map<string, Promise<ArrayBuffer>>();
const CACHE_MAX = 8;
let sharedContext: AudioContext | null = null;

function context() {
  if (sharedContext) return sharedContext;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) throw new Error("AudioContext unavailable");
  sharedContext = new Ctor();
  return sharedContext;
}

function remember(key: string, bytes: ArrayBuffer) {
  bufferCache.delete(key);
  bufferCache.set(key, bytes);
  if (bufferCache.size > CACHE_MAX) bufferCache.delete(bufferCache.keys().next().value!);
}

async function download(key: string, url: string, token: string | null) {
  const hit = bufferCache.get(key);
  if (hit) return hit;
  const running = inflight.get(key);
  if (running) return running;
  const task = fetch(url, { cache: "no-store", headers: token ? { "x-songspot-round-token": token } : undefined })
    .then(async (res) => {
      if (!res.ok) {
        let msg = `Audio request failed (${res.status})`;
        try {
          const j = (await res.json()) as { message?: string };
          if (j.message) msg = j.message;
        } catch {
          /* ignore */
        }
        throw new Error(msg);
      }
      return res.arrayBuffer();
    })
    .then((bytes) => {
      remember(key, bytes);
      return bytes;
    })
    .finally(() => inflight.delete(key));
  inflight.set(key, task);
  return task;
}

export function useClipPlayer(opts: { roundKey: string | null; roundToken: string | null; volume: number; audioUrl?: string }) {
  const audioUrl = opts.audioUrl ?? "/api/audio";
  const cacheKey = opts.roundKey ? `${audioUrl}::${opts.roundKey}` : null;
  const initial = cacheKey ? bufferCache.get(cacheKey) ?? null : null;

  const [state, setState] = useState<PlayerState>(initial ? "ready" : "idle");
  const [error, setError] = useState<string | null>(null);
  const [lastPlayback, setLastPlayback] = useState<Playback | null>(null);
  const [progress, setProgress] = useState(0);

  const bytes = useRef<ArrayBuffer | null>(initial);
  const decoded = useRef<AudioBuffer | null>(null);
  const source = useRef<AudioBufferSourceNode | null>(null);
  const gain = useRef<GainNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const startedAt = useRef<number | null>(null);
  const scheduled = useRef(0);
  const resolver = useRef<((p: Playback) => void) | null>(null);
  const raf = useRef<number | null>(null);
  const generation = useRef(0);
  const tokenRef = useRef(opts.roundToken);
  tokenRef.current = opts.roundToken;
  const volumeRef = useRef(opts.volume);
  volumeRef.current = opts.volume;

  const cancelRaf = useCallback(() => {
    if (raf.current !== null) {
      window.cancelAnimationFrame(raf.current);
      raf.current = null;
    }
  }, []);

  const elapsed = useCallback(() => {
    const ctx = ctxRef.current;
    const t0 = startedAt.current;
    if (!ctx || t0 === null) return 0;
    return Math.min(scheduled.current, Math.max(0, ctx.currentTime - t0));
  }, []);

  const teardown = useCallback(() => {
    cancelRaf();
    const s = source.current;
    source.current = null;
    if (s) {
      s.onended = null;
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
      s.disconnect();
    }
    gain.current?.disconnect();
    gain.current = null;
  }, [cancelRaf]);

  const stop = useCallback(
    (resetState: boolean) => {
      const sched = scheduled.current;
      const measured = elapsed();
      teardown();
      ctxRef.current = null;
      startedAt.current = null;
      scheduled.current = 0;
      const r = resolver.current;
      resolver.current = null;
      r?.({ scheduledSeconds: sched, measuredSeconds: measured });
      if (resetState) {
        setProgress(0);
        setState(bytes.current ? "ready" : "idle");
      }
    },
    [elapsed, teardown],
  );

  const tick = useCallback(() => {
    cancelRaf();
    const loop = () => {
      const total = scheduled.current;
      const done = elapsed();
      setProgress(total > 0 ? Math.min(1, done / total) : 0);
      raf.current = source.current && done < total ? window.requestAnimationFrame(loop) : null;
    };
    raf.current = window.requestAnimationFrame(loop);
  }, [cancelRaf, elapsed]);

  const load = useCallback(async () => {
    const token = tokenRef.current;
    if (!cacheKey || (!token && !opts.audioUrl)) {
      setState("idle");
      return;
    }
    const gen = generation.current;
    setState("loading");
    setError(null);
    try {
      const b = await download(cacheKey, audioUrl, token);
      if (gen !== generation.current) return;
      bytes.current = b;
      decoded.current = null;
      setState("ready");
    } catch (e) {
      if (gen !== generation.current) return;
      setError(e instanceof Error ? e.message : "Audio request failed");
      setState("network-error");
    }
  }, [cacheKey, audioUrl, opts.audioUrl]);

  useEffect(() => {
    generation.current += 1;
    stop(false);
    const cached = cacheKey ? bufferCache.get(cacheKey) ?? null : null;
    bytes.current = cached;
    decoded.current = null;
    setLastPlayback(null);
    setProgress(0);
    setError(null);
    if (cached) setState("ready");
    else void load();
    return () => {
      generation.current += 1;
      stop(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  const play = useCallback(
    async (seconds: number, offsetSeconds = 0, force = false) => {
      if (force) stop(false);
      if (!force && (source.current || state === "playing" || state === "paused")) throw new Error("Audio is already playing");
      if (volumeRef.current <= 0) {
        setState("muted");
        throw new Error("Audio is muted");
      }
      if (!bytes.current) {
        await load();
        if (!bytes.current) throw new Error("Audio is not ready");
      }
      setState("loading");
      let ctx: AudioContext;
      try {
        ctx = context();
        if (ctx.state === "suspended") await ctx.resume();
        if (ctx.state !== "running") throw new Error("AudioContext blocked");
      } catch (e) {
        setError(e instanceof Error ? e.message : "Audio blocked");
        setState("blocked");
        throw e;
      }
      try {
        decoded.current ||= await ctx.decodeAudioData(bytes.current.slice(0));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Audio decode failed");
        setState("decode-error");
        throw e;
      }
      const buffer = decoded.current;
      const offset = Math.min(Math.max(0, offsetSeconds), Math.max(0, buffer.duration - 0.5));
      const duration = Math.min(seconds, Math.max(0.05, buffer.duration - offset));
      const node = ctx.createBufferSource();
      const g = ctx.createGain();
      g.gain.setValueAtTime(Math.min(1, Math.max(0, volumeRef.current / 100)), ctx.currentTime);
      node.buffer = buffer;
      node.connect(g);
      g.connect(ctx.destination);
      source.current = node;
      gain.current = g;
      const when = ctx.currentTime;
      ctxRef.current = ctx;
      startedAt.current = when;
      scheduled.current = duration;
      setProgress(0);
      setState("playing");
      setError(null);
      tick();
      return new Promise<Playback>((resolve) => {
        resolver.current = resolve;
        node.onended = () => {
          if (source.current !== node) return;
          const measured = Math.max(0, ctx.currentTime - when);
          cancelRaf();
          source.current = null;
          gain.current = null;
          node.disconnect();
          g.disconnect();
          ctxRef.current = null;
          startedAt.current = null;
          scheduled.current = 0;
          resolver.current = null;
          setProgress(1);
          setState("ready");
          const p = { scheduledSeconds: duration, measuredSeconds: measured };
          setLastPlayback(p);
          resolve(p);
        };
        node.start(when, offset, duration);
        node.stop(when + duration);
      });
    },
    [cancelRaf, load, state, stop, tick],
  );

  const pause = useCallback(async () => {
    if (state !== "playing") return;
    const ctx = ctxRef.current;
    const node = source.current;
    if (!ctx || !node) return;
    cancelRaf();
    try {
      await ctx.suspend();
      if (source.current !== node) return;
      const total = scheduled.current;
      setProgress(total > 0 ? Math.min(1, elapsed() / total) : 0);
      setState("paused");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audio blocked");
      setState("blocked");
      throw e;
    }
  }, [cancelRaf, elapsed, state]);

  const resume = useCallback(async () => {
    if (state !== "paused") return;
    const ctx = ctxRef.current;
    if (!ctx || !source.current) return;
    try {
      await ctx.resume();
      if (ctx.state !== "running") throw new Error("AudioContext blocked");
      setError(null);
      setState("playing");
      tick();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Audio blocked");
      setState("blocked");
      throw e;
    }
  }, [state, tick]);

  useEffect(() => {
    // live volume changes while a clip plays
    const g = gain.current;
    const ctx = ctxRef.current;
    if (g && ctx) g.gain.setValueAtTime(Math.min(1, Math.max(0, opts.volume / 100)), ctx.currentTime);
  }, [opts.volume]);

  const unlock = useCallback(async () => {
    const ctx = context();
    if (ctx.state === "suspended") await ctx.resume();
    if (ctx.state !== "running") throw new Error("Audio blocked");
  }, []);

  return {
    state,
    error,
    lastPlayback,
    progress,
    play,
    pause,
    resume,
    unlock,
    retry: load,
    stop: useCallback(() => stop(true), [stop]),
  };
}
