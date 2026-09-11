"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface PlayOptions {
  startOffset: number;
  duration: number;
}

export function useAudioSnippet() {
  const contextRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const loadedUrlRef = useRef<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const getContext = useCallback(() => {
    if (!contextRef.current) {
      contextRef.current = new AudioContext();
    }
    return contextRef.current;
  }, []);

  const load = useCallback(
    async (previewUrl: string) => {
      if (loadedUrlRef.current === previewUrl && bufferRef.current) return;
      setIsLoading(true);
      setError(null);
      try {
        const ctx = getContext();
        const res = await fetch(`/api/preview?url=${encodeURIComponent(previewUrl)}`);
        if (!res.ok) throw new Error("Impossible de charger l'extrait audio");
        const arrayBuffer = await res.arrayBuffer();
        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        bufferRef.current = audioBuffer;
        loadedUrlRef.current = previewUrl;
      } catch {
        setError("Impossible de charger l'extrait audio");
        bufferRef.current = null;
        loadedUrlRef.current = null;
      } finally {
        setIsLoading(false);
      }
    },
    [getContext]
  );

  const stop = useCallback(() => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch {
        // already stopped
      }
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const play = useCallback(
    async ({ startOffset, duration }: PlayOptions) => {
      const ctx = getContext();
      if (ctx.state === "suspended") await ctx.resume();
      if (!bufferRef.current) return;

      stop();

      const source = ctx.createBufferSource();
      source.buffer = bufferRef.current;
      source.connect(ctx.destination);
      source.start(0, startOffset, duration);
      sourceRef.current = source;
      setIsPlaying(true);
      setElapsed(0);

      const playStart = ctx.currentTime;
      const tick = () => {
        const progress = ctx.currentTime - playStart;
        if (progress >= duration) {
          setElapsed(duration);
          setIsPlaying(false);
          rafRef.current = null;
          return;
        }
        setElapsed(progress);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);

      source.onended = () => {
        setIsPlaying(false);
      };
    },
    [getContext, stop]
  );

  useEffect(() => {
    return () => {
      stop();
      contextRef.current?.close();
    };
  }, [stop]);

  return { load, play, stop, isLoading, isPlaying, elapsed, error };
}
