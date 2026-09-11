import type { Difficulty, Song } from "./types";

/**
 * Chaque valeur est la durée cumulée (en secondes) du snippet jouable
 * à la tentative correspondante. Inspiré de la progression Heardle
 * (1, 2, 4, 7, 11, 16s) mais avec un point de départ par difficulté,
 * jusqu'à une précision de 0.1s pour le mode expert.
 */
export const DIFFICULTY_PRESETS: Record<Difficulty, number[]> = {
  easy: [1, 2, 4, 7, 11, 16],
  medium: [0.5, 1, 2, 4, 7, 11],
  hard: [0.2, 0.5, 1, 2, 4, 7],
  expert: [0.1, 0.2, 0.5, 1, 2, 4],
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Facile",
  medium: "Moyen",
  hard: "Difficile",
  expert: "Expert",
};

export const MAX_ATTEMPTS = DIFFICULTY_PRESETS.easy.length;

export const FULL_REVEAL_DURATION = 30;

export function snippetDurationForAttempt(
  difficulty: Difficulty,
  attemptIndex: number,
  previewDuration: number
): number {
  const preset = DIFFICULTY_PRESETS[difficulty];
  const raw = preset[Math.min(attemptIndex, preset.length - 1)];
  return Math.min(raw, previewDuration);
}

export function scoreForAttempt(attemptIndex: number): number {
  const base = 100;
  const penalty = attemptIndex * 15;
  return Math.max(base - penalty, 10);
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/feat\.?.*$/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function isCorrectGuess(guess: string, song: Song): boolean {
  const normalizedGuess = normalize(guess);
  if (!normalizedGuess) return false;
  const normalizedTitle = normalize(song.title);
  const normalizedArtist = normalize(song.artist);
  return (
    normalizedGuess === normalizedTitle ||
    normalizedGuess === `${normalizedArtist} ${normalizedTitle}` ||
    normalizedGuess === `${normalizedTitle} ${normalizedArtist}` ||
    (normalizedGuess.length > 3 && normalizedTitle.includes(normalizedGuess))
  );
}

export function randomStartOffset(
  previewDuration: number,
  maxSnippetDuration: number
): number {
  const usable = Math.max(previewDuration - maxSnippetDuration, 0);
  if (usable <= 0) return 0;
  return Math.round(Math.random() * usable * 10) / 10;
}

export function pickRound(pool: Song[], roundLength: number): Song[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(roundLength, shuffled.length));
}
