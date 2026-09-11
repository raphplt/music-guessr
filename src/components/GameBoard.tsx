"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSettingsStore } from "@/store/settingsStore";
import { fetchSongsForArtists, searchSongs } from "@/lib/itunesClient";
import {
  DIFFICULTY_PRESETS,
  MAX_ATTEMPTS,
  isCorrectGuess,
  pickRound,
  randomStartOffset,
  scoreForAttempt,
  snippetDurationForAttempt,
} from "@/lib/gameEngine";
import type { GuessAttempt, RoundResult, Song } from "@/lib/types";
import { useAudioSnippet } from "@/hooks/useAudioSnippet";
import { SegmentedTimer } from "@/components/SegmentedTimer";
import { GuessAutocomplete } from "@/components/GuessAutocomplete";
import { RevealCard } from "@/components/RevealCard";

type LoadState = "loading" | "ready" | "empty" | "error";

export function GameBoard() {
  const difficulty = useSettingsStore((s) => s.difficulty);
  const startMode = useSettingsStore((s) => s.startMode);
  const roundLength = useSettingsStore((s) => s.roundLength);
  const filters = useSettingsStore((s) => s.filters);

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [round, setRound] = useState<Song[]>([]);
  const [songIndex, setSongIndex] = useState(0);
  const [attemptIndex, setAttemptIndex] = useState(0);
  const [attempts, setAttempts] = useState<GuessAttempt[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [results, setResults] = useState<RoundResult[]>([]);

  const audio = useAudioSnippet();
  const presets = DIFFICULTY_PRESETS[difficulty];
  const currentSong = round[songIndex];

  useEffect(() => {
    let cancelled = false;
    async function buildPool() {
      setLoadState("loading");
      const [byArtist, byGenre] = await Promise.all([
        filters.artists.length ? fetchSongsForArtists(filters.artists) : Promise.resolve([]),
        Promise.all(filters.genres.map((g) => searchSongs(g, { limit: 15, genre: g }))).then(
          (batches) => batches.flat()
        ),
      ]);
      const merged = new Map<string, Song>();
      for (const song of [...byArtist, ...byGenre]) merged.set(song.id, song);
      let pool = [...merged.values()];
      if (filters.decades.length > 0) {
        pool = pool.filter((song) =>
          filters.decades.some((decade) => song.releaseYear >= decade && song.releaseYear < decade + 10)
        );
      }
      if (cancelled) return;
      if (pool.length === 0) {
        setLoadState("empty");
        return;
      }
      setRound(pickRound(pool, roundLength));
      setLoadState("ready");
    }
    buildPool().catch(() => !cancelled && setLoadState("error"));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!currentSong) return;
    audio.load(currentSong.previewUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong]);

  const startOffset = useMemo(() => {
    if (!currentSong) return 0;
    if (startMode !== "random") return 0;
    const maxDuration = presets[presets.length - 1];
    return randomStartOffset(currentSong.previewDuration, maxDuration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong, startMode]);

  const currentDuration = useMemo(
    () =>
      currentSong
        ? snippetDurationForAttempt(difficulty, attemptIndex, currentSong.previewDuration)
        : 0,
    [currentSong, difficulty, attemptIndex]
  );

  function playCurrentSnippet() {
    if (!currentSong) return;
    audio.play({ startOffset, duration: currentDuration });
  }

  function finishSong(won: boolean, finalAttempts: GuessAttempt[]) {
    audio.stop();
    setResults((prev) => [
      ...prev,
      {
        song: currentSong,
        attempts: finalAttempts,
        won,
        pointsEarned: won ? scoreForAttempt(attemptIndex) : 0,
      },
    ]);
    setRevealed(true);
  }

  function handleGuess(label: string) {
    if (!currentSong || revealed) return;
    const correct = isCorrectGuess(label, currentSong);
    const nextAttempts = [...attempts, { guess: label, correct, skipped: false }];
    setAttempts(nextAttempts);

    if (correct) {
      finishSong(true, nextAttempts);
      return;
    }

    if (attemptIndex + 1 >= MAX_ATTEMPTS) {
      finishSong(false, nextAttempts);
      return;
    }

    setAttemptIndex((i) => i + 1);
  }

  function handleSkip() {
    handleGuess("");
  }

  function nextSong() {
    audio.stop();
    setAttemptIndex(0);
    setAttempts([]);
    setRevealed(false);
    setSongIndex((i) => i + 1);
  }

  if (loadState === "loading") {
    return <p className="text-center text-zinc-400">Chargement des morceaux...</p>;
  }

  if (loadState === "empty" || loadState === "error") {
    return (
      <div className="space-y-4 text-center text-zinc-400">
        <p>
          Impossible de trouver assez de morceaux avec ces filtres. Essaie d&apos;ajouter des
          artistes ou des genres.
        </p>
        <Link href="/" className="text-cyan-400 underline">
          Retour aux reglages
        </Link>
      </div>
    );
  }

  const isLastSong = songIndex === round.length - 1;

  if (songIndex >= round.length) {
    const total = results.reduce((sum, r) => sum + r.pointsEarned, 0);
    const wins = results.filter((r) => r.won).length;
    return (
      <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">
        <h2 className="text-2xl font-bold">Partie terminee</h2>
        <p className="text-zinc-400">
          {wins} / {results.length} morceaux trouves
        </p>
        <p className="text-4xl font-black text-cyan-400">{total} pts</p>
        <Link
          href="/"
          className="inline-block rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-zinc-950 hover:bg-cyan-300"
        >
          Rejouer
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span>
          Morceau {songIndex + 1} / {round.length}
        </span>
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
          onClick={playCurrentSnippet}
          disabled={audio.isLoading || revealed}
          className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-400 text-zinc-950 shadow-lg transition hover:bg-cyan-300 disabled:opacity-50"
        >
          {audio.isPlaying ? (
            <span className="text-2xl">&#10073;&#10073;</span>
          ) : (
            <span className="ml-1 text-2xl">&#9654;</span>
          )}
        </button>
      </div>

      {!revealed && (
        <div className="space-y-3">
          <GuessAutocomplete onGuess={handleGuess} />
          <button
            onClick={handleSkip}
            className="w-full rounded-xl border border-zinc-800 py-2 text-sm text-zinc-400 hover:border-zinc-700"
          >
            Passer
          </button>
        </div>
      )}

      <ul className="space-y-1 text-sm text-zinc-500">
        {attempts.map((a, i) => (
          <li key={i} className={a.correct ? "text-emerald-400" : "text-zinc-500"}>
            {i + 1}. {a.guess || "(passe)"}
          </li>
        ))}
      </ul>

      {revealed && currentSong && (
        <RevealCard
          song={currentSong}
          won={results[results.length - 1]?.won ?? false}
          points={results[results.length - 1]?.pointsEarned ?? 0}
          isLastSong={isLastSong}
          onNext={nextSong}
        />
      )}
    </div>
  );
}
