"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GuessAttempt } from "@/lib/types";

export interface DailyResult {
  dateKey: string;
  won: boolean;
  attempts: GuessAttempt[];
  points: number;
  songTitle: string;
  songArtist: string;
}

interface DailyState {
  lastResult: DailyResult | null;
  setResult: (result: DailyResult) => void;
}

export const useDailyStore = create<DailyState>()(
  persist(
    (set) => ({
      lastResult: null,
      setResult: (result) => set({ lastResult: result }),
    }),
    { name: "music-guessr-daily" }
  )
);
