"use client";

import { useState } from "react";
import { MAX_ATTEMPTS, isCorrectGuess, isExactSongMatch, scoreForAttempt } from "@/lib/gameEngine";
import type { GuessAttempt, Song } from "@/lib/types";
import type { GuessPayload } from "@/components/GuessAutocomplete";

export interface AttemptOutcome {
  won: boolean;
  attempts: GuessAttempt[];
  points: number;
}

interface UseSongAttemptsOptions {
  song: Song | undefined;
  onFinish: (outcome: AttemptOutcome) => void;
}

/** Machine a etats partagee par le mode "partie" et le mode "defi du jour" pour une chanson. */
export function useSongAttempts({ song, onFinish }: UseSongAttemptsOptions) {
  const [attemptIndex, setAttemptIndex] = useState(0);
  const [attempts, setAttempts] = useState<GuessAttempt[]>([]);
  const [revealed, setRevealed] = useState(false);

  function reset() {
    setAttemptIndex(0);
    setAttempts([]);
    setRevealed(false);
  }

  function guess({ label, song: candidate }: GuessPayload) {
    if (!song || revealed) return;
    const correct = candidate
      ? isExactSongMatch(candidate.id, song)
      : isCorrectGuess(label, song);
    const nextAttempts = [...attempts, { guess: label, correct, skipped: false }];
    setAttempts(nextAttempts);

    if (correct) {
      const points = scoreForAttempt(attemptIndex);
      setRevealed(true);
      onFinish({ won: true, attempts: nextAttempts, points });
      return;
    }

    if (attemptIndex + 1 >= MAX_ATTEMPTS) {
      setRevealed(true);
      onFinish({ won: false, attempts: nextAttempts, points: 0 });
      return;
    }

    setAttemptIndex((i) => i + 1);
  }

  function skip() {
    guess({ label: "" });
  }

  return { attemptIndex, attempts, revealed, guess, skip, reset };
}
