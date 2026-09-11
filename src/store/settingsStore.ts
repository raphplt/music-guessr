"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Difficulty, GameFilters, StartMode } from "@/lib/types";
import { DEFAULT_ARTIST_POOL } from "@/lib/itunesClient";

interface SettingsState {
  difficulty: Difficulty;
  startMode: StartMode;
  roundLength: number;
  filters: GameFilters;
  spotifyConnected: boolean;
  spotifyGenres: string[];
  spotifyArtists: string[];
  setDifficulty: (d: Difficulty) => void;
  setStartMode: (m: StartMode) => void;
  setRoundLength: (n: number) => void;
  toggleGenre: (genre: string) => void;
  toggleDecade: (decade: number) => void;
  toggleArtist: (artist: string) => void;
  setSpotifyTaste: (artists: string[], genres: string[]) => void;
  resetFilters: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      difficulty: "medium",
      startMode: "beginning",
      roundLength: 5,
      filters: {
        genres: [],
        decades: [],
        artists: DEFAULT_ARTIST_POOL,
      },
      spotifyConnected: false,
      spotifyGenres: [],
      spotifyArtists: [],
      setDifficulty: (difficulty) => set({ difficulty }),
      setStartMode: (startMode) => set({ startMode }),
      setRoundLength: (roundLength) => set({ roundLength }),
      toggleGenre: (genre) =>
        set((state) => ({
          filters: {
            ...state.filters,
            genres: state.filters.genres.includes(genre)
              ? state.filters.genres.filter((g) => g !== genre)
              : [...state.filters.genres, genre],
          },
        })),
      toggleDecade: (decade) =>
        set((state) => ({
          filters: {
            ...state.filters,
            decades: state.filters.decades.includes(decade)
              ? state.filters.decades.filter((d) => d !== decade)
              : [...state.filters.decades, decade],
          },
        })),
      toggleArtist: (artist) =>
        set((state) => ({
          filters: {
            ...state.filters,
            artists: state.filters.artists.includes(artist)
              ? state.filters.artists.filter((a) => a !== artist)
              : [...state.filters.artists, artist],
          },
        })),
      setSpotifyTaste: (artists, genres) =>
        set((state) => ({
          spotifyConnected: true,
          spotifyArtists: artists,
          spotifyGenres: genres,
          filters: {
            ...state.filters,
            artists: [...new Set([...artists, ...state.filters.artists])].slice(0, 20),
          },
        })),
      resetFilters: () =>
        set({ filters: { genres: [], decades: [], artists: DEFAULT_ARTIST_POOL } }),
    }),
    { name: "music-guessr-settings" }
  )
);
