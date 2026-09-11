"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DEFAULT_ARTIST_POOL, fetchSongsForArtists } from "@/lib/itunesClient";
import {
  DIFFICULTY_PRESETS,
  MAX_ATTEMPTS,
  hashString,
  seededStartOffset,
  snippetDurationForAttempt,
} from "@/lib/gameEngine";
import { DAILY_DIFFICULTY, dailyChallengeNumber, getDailyDateKey } from "@/lib/dailyChallenge";
import { buildShareText } from "@/lib/shareResult";
import { useDailyStore } from "@/store/dailyStore";
import { useHistoryStore } from "@/store/historyStore";
import type { Song } from "@/lib/types";
import { useAudioSnippet } from "@/hooks/useAudioSnippet";
import { useSongAttempts } from "@/hooks/useSongAttempts";
import { SegmentedTimer } from "@/components/SegmentedTimer";
import { GuessAutocomplete } from "@/components/GuessAutocomplete";

type LoadState = "loading" | "ready" | "error";

export function DailyBoard() {
  const dateKey = useMemo(() => getDailyDateKey(), []);
  const challengeNumber = useMemo(() => dailyChallengeNumber(dateKey), [dateKey]);
  const lastResult = useDailyStore((s) => s.lastResult);
  const setResult = useDailyStore((s) => s.setResult);
  const addHistoryEntry = useHistoryStore((s) => s.addEntry);

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [song, setSong] = useState<Song | null>(null);
  const [copied, setCopied] = useState(false);

  const audio = useAudioSnippet();
  const presets = DIFFICULTY_PRESETS[DAILY_DIFFICULTY];
  const alreadyPlayedToday = lastResult?.dateKey === dateKey;

  const { attemptIndex, attempts, revealed, guess, skip } = useSongAttempts({
    song: alreadyPlayedToday ? undefined : (song ?? undefined),
    onFinish: ({ won, attempts: finalAttempts, points }) => {
      if (!song) return;
      audio.stop();
      setResult({
        dateKey,
        won,
        attempts: finalAttempts,
        points,
        songTitle: song.title,
        songArtist: song.artist,
      });
      addHistoryEntry(
        {
          date: new Date().toISOString(),
          songTitle: song.title,
          songArtist: song.artist,
          won,
          attempts: finalAttempts.length,
          points,
        },
        `daily-${dateKey}`
      );
    },
  });

  useEffect(() => {
    let cancelled = false;
    async function loadDailySong() {
      setLoadState("loading");
      try {
        const pool = await fetchSongsForArtists(DEFAULT_ARTIST_POOL, 6);
        if (cancelled) return;
        if (pool.length === 0) {
          setLoadState("error");
          return;
        }
        const sorted = [...pool].sort((a, b) => a.id.localeCompare(b.id));
        const index = hashString(dateKey) % sorted.length;
        setSong(sorted[index]);
        setLoadState("ready");
      } catch {
        if (!cancelled) setLoadState("error");
      }
    }
    loadDailySong();
    return () => {
      cancelled = true;
    };
  }, [dateKey]);

  useEffect(() => {
    if (!song || alreadyPlayedToday) return;
    audio.load(song.previewUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song, alreadyPlayedToday]);

  const startOffset = useMemo(() => {
    if (!song) return 0;
    const maxDuration = presets[presets.length - 1];
    return seededStartOffset(`${dateKey}-${song.id}`, song.previewDuration, maxDuration);
  }, [song, dateKey, presets]);

  const currentDuration = useMemo(
    () => (song ? snippetDurationForAttempt(DAILY_DIFFICULTY, attemptIndex, song.previewDuration) : 0),
    [song, attemptIndex]
  );

  function playSnippet() {
    if (!song) return;
    audio.play({ startOffset, duration: currentDuration });
  }

  async function copyResult() {
    const result = alreadyPlayedToday ? lastResult : null;
    if (!result) return;
    const text = buildShareText(result, challengeNumber);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (loadState === "loading") {
    return <p className="text-center text-zinc-400">Chargement du defi du jour...</p>;
  }

  if (loadState === "error") {
    return (
      <div className="space-y-4 text-center text-zinc-400">
        <p>Impossible de charger le defi du jour pour le moment.</p>
        <Link href="/" className="text-cyan-400 underline">
          Retour a l&apos;accueil
        </Link>
      </div>
    );
  }

  if (alreadyPlayedToday && lastResult) {
    return (
      <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">
        <h2 className="text-xl font-bold">Defi #{challengeNumber} deja joue</h2>
        <p className="text-zinc-400">
          {lastResult.won
            ? `Trouve en ${lastResult.attempts.length} essai(s) - ${lastResult.songTitle} (${lastResult.songArtist})`
            : `Perdu - c'etait ${lastResult.songTitle} (${lastResult.songArtist})`}
        </p>
        <div className="text-2xl">
          {lastResult.attempts.map((a, i) => (
            <span key={i}>{a.correct ? "\u{1F7E9}" : "\u{1F7E5}"}</span>
          ))}
        </div>
        <button
          onClick={copyResult}
          className="w-full rounded-xl bg-cyan-400 py-3 font-semibold text-zinc-950 hover:bg-cyan-300"
        >
          {copied ? "Copie !" : "Copier le resultat"}
        </button>
        <p className="text-xs text-zinc-500">Reviens demain pour un nouveau defi.</p>
      </div>
    );
  }

  if (!song) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-lg font-bold">Defi du jour #{challengeNumber}</h2>
        <p className="text-xs text-zinc-500">Le meme morceau pour tout le monde aujourd&apos;hui</p>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>Difficulte : Moyen</span>
        <span>
          Tentative {attemptIndex + 1} / {MAX_ATTEMPTS}
        </span>
      </div>

      <SegmentedTimer
        presets={presets}
        attemptIndex={attemptIndex}
        currentDuration={currentDuration}
        elapsed={audio.elapsed}
      />

      <div className="flex justify-center">
        <button
          onClick={playSnippet}
          disabled={audio.isLoading || revealed}
          aria-label={audio.isPlaying ? "Extrait en cours de lecture" : "Lire l'extrait"}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-400 text-zinc-950 shadow-lg transition hover:bg-cyan-300 disabled:opacity-50"
        >
          {audio.isPlaying ? (
            <span aria-hidden className="text-2xl">&#10073;&#10073;</span>
          ) : (
            <span aria-hidden className="ml-1 text-2xl">&#9654;</span>
          )}
        </button>
      </div>

      {!revealed && (
        <div className="space-y-3">
          <GuessAutocomplete onGuess={guess} />
          <button
            onClick={skip}
            className="w-full rounded-xl border border-zinc-800 py-2 text-sm text-zinc-400 hover:border-zinc-700"
          >
            Passer
          </button>
        </div>
      )}

      <ul aria-live="polite" className="space-y-1 text-sm text-zinc-500">
        {attempts.map((a, i) => (
          <li key={i} className={a.correct ? "text-emerald-400" : "text-zinc-500"}>
            {i + 1}. {a.guess || "(passe)"}
          </li>
        ))}
      </ul>
    </div>
  );
}
