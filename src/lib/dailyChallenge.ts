import type { Difficulty } from "./types";

export const DAILY_DIFFICULTY: Difficulty = "medium";

/** Date UTC au format YYYY-MM-DD : meme defi pour tout le monde, quel que soit le fuseau. */
export function getDailyDateKey(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function dailyChallengeNumber(dateKey: string): number {
  const epoch = new Date("2026-01-01T00:00:00Z").getTime();
  const current = new Date(`${dateKey}T00:00:00Z`).getTime();
  return Math.max(1, Math.round((current - epoch) / 86_400_000) + 1);
}
