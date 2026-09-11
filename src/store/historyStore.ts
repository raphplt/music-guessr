"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface HistoryEntry {
  date: string;
  songTitle: string;
  songArtist: string;
  won: boolean;
  attempts: number;
  points: number;
}

export interface HistoryStats {
  gamesPlayed: number;
  wins: number;
  winRate: number;
  averageAttempts: number;
  currentStreak: number;
  bestStreak: number;
}

interface HistoryState {
  entries: HistoryEntry[];
  playedSongIds: string[];
  addEntry: (entry: HistoryEntry, songId: string) => void;
  hasPlayed: (songId: string) => boolean;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set, get) => ({
      entries: [],
      playedSongIds: [],
      addEntry: (entry, songId) =>
        set((state) => ({
          entries: [entry, ...state.entries].slice(0, 200),
          playedSongIds: [...new Set([...state.playedSongIds, songId])].slice(-500),
        })),
      hasPlayed: (songId) => get().playedSongIds.includes(songId),
      clear: () => set({ entries: [], playedSongIds: [] }),
    }),
    { name: "music-guessr-history" }
  )
);

/**
 * Fonction pure (pas une methode du store) : a utiliser via useMemo cote
 * composant pour eviter de recalculer un nouvel objet a chaque rendu, ce qui
 * casserait la comparaison par reference de zustand et boucle les rendus.
 */
export function computeHistoryStats(entries: HistoryEntry[]): HistoryStats {
  const gamesPlayed = entries.length;
  const wins = entries.filter((e) => e.won).length;
  const winAttempts = entries.filter((e) => e.won).map((e) => e.attempts);
  const averageAttempts = winAttempts.length
    ? winAttempts.reduce((a, b) => a + b, 0) / winAttempts.length
    : 0;

  let currentStreak = 0;
  for (const entry of entries) {
    if (entry.won) currentStreak++;
    else break;
  }

  let bestStreak = 0;
  let running = 0;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].won) {
      running++;
      bestStreak = Math.max(bestStreak, running);
    } else {
      running = 0;
    }
  }

  return {
    gamesPlayed,
    wins,
    winRate: gamesPlayed ? wins / gamesPlayed : 0,
    averageAttempts,
    currentStreak,
    bestStreak,
  };
}
