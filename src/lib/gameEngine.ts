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

/** Distance d'edition (Levenshtein) - permet de tolerer les fautes de frappe. */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previousRow = Array.from({ length: b.length + 1 }, (_, i) => i);

  for (let i = 0; i < a.length; i++) {
    const currentRow = [i + 1];
    for (let j = 0; j < b.length; j++) {
      const insertCost = currentRow[j] + 1;
      const deleteCost = previousRow[j + 1] + 1;
      const substituteCost = previousRow[j] + (a[i] === b[j] ? 0 : 1);
      currentRow.push(Math.min(insertCost, deleteCost, substituteCost));
    }
    previousRow = currentRow;
  }

  return previousRow[b.length];
}

/**
 * Tolere 1 faute de frappe sur les mots courts, 2 au maximum sur les titres
 * longs - jamais plus, pour eviter qu'une reponse trop differente passe
 * quand meme (ex: "Blinding Lite" ne doit pas valider "Blinding Lights").
 */
function fuzzyEquals(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen <= 3) return false;
  const tolerance = Math.min(2, Math.max(1, Math.floor(maxLen * 0.15)));
  return levenshteinDistance(a, b) <= tolerance;
}

export function isCorrectGuess(guess: string, song: Song): boolean {
  const normalizedGuess = normalize(guess);
  if (!normalizedGuess) return false;
  const normalizedTitle = normalize(song.title);
  const normalizedArtist = normalize(song.artist);
  const combinedArtistTitle = `${normalizedArtist} ${normalizedTitle}`;
  const combinedTitleArtist = `${normalizedTitle} ${normalizedArtist}`;

  return (
    fuzzyEquals(normalizedGuess, normalizedTitle) ||
    fuzzyEquals(normalizedGuess, combinedArtistTitle) ||
    fuzzyEquals(normalizedGuess, combinedTitleArtist) ||
    (normalizedGuess.length > 3 && normalizedTitle.includes(normalizedGuess))
  );
}

/** Match garanti quand la reponse vient de la selection d'une suggestion (meme identifiant iTunes). */
export function isExactSongMatch(candidateId: string, song: Song): boolean {
  return candidateId === song.id;
}

export function randomStartOffset(
  previewDuration: number,
  maxSnippetDuration: number
): number {
  const usable = Math.max(previewDuration - maxSnippetDuration, 0);
  if (usable <= 0) return 0;
  return Math.round(Math.random() * usable * 10) / 10;
}

/** Hash simple et deterministe (FNV-like) pour deriver un index/ratio stable d'une chaine. */
export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/** Offset deterministe (meme resultat pour tout le monde) a partir d'une graine textuelle. */
export function seededStartOffset(
  seed: string,
  previewDuration: number,
  maxSnippetDuration: number
): number {
  const usable = Math.max(previewDuration - maxSnippetDuration, 0);
  if (usable <= 0) return 0;
  const ratio = (hashString(seed) % 1000) / 1000;
  return Math.round(ratio * usable * 10) / 10;
}

export function pickRound(pool: Song[], roundLength: number): Song[] {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(roundLength, shuffled.length));
}
