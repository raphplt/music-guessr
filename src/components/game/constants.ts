import type { Difficulty } from "@/lib/client-api";

/** Per-difficulty palette — copied from songspot.co. */
export type Theme = {
  id: Difficulty;
  accent: string;
  accentText: string;
  accentOn: string;
  rgb: string;
  page: string;
  stage: string;
  surface: string;
  surfaceSoft: string;
  timeline: string;
};

export const THEMES: Record<Difficulty, Theme> = {
  easy: { id: "easy", accent: "#19df70", accentText: "#39e887", accentOn: "#04160b", rgb: "25, 223, 112", page: "#030704", stage: "#0c110d", surface: "#151b16", surfaceSoft: "#1f2721", timeline: "#232924" },
  medium: { id: "medium", accent: "#ffca12", accentText: "#ffd234", accentOn: "#171200", rgb: "255, 202, 18", page: "#070803", stage: "#15160b", surface: "#1b1c10", surfaceSoft: "#272817", timeline: "#2e2e21" },
  hard: { id: "hard", accent: "#ff7517", accentText: "#ff8631", accentOn: "#190900", rgb: "255, 117, 23", page: "#080503", stage: "#171009", surface: "#1d150f", surfaceSoft: "#2a1e15", timeline: "#302820" },
  expert: { id: "expert", accent: "#f04444", accentText: "#f66464", accentOn: "#1b0505", rgb: "240, 68, 68", page: "#070304", stage: "#160c0c", surface: "#1c1111", surfaceSoft: "#281919", timeline: "#2e2323" },
  impossible: { id: "impossible", accent: "#9748dd", accentText: "#ae67ed", accentOn: "#14061e", rgb: "151, 72, 221", page: "#050307", stage: "#140c16", surface: "#1a111d", surfaceSoft: "#25182a", timeline: "#29232e" },
};

export const DIFFICULTY_OPTIONS: { id: Difficulty; label: string }[] = [
  { id: "easy", label: "Easy" },
  { id: "medium", label: "Medium" },
  { id: "hard", label: "Hard" },
  { id: "expert", label: "Expert" },
  { id: "impossible", label: "Impossible" },
];

export const STAGE_LABELS = ["0.1s", "0.5s", "2s", "8s", "15s"] as const;
export const STAGE_SECONDS = [0.1, 0.5, 2, 8, 15] as const;
/** flex weights of the timeline segments (differences between stages). */
export const STAGE_WEIGHTS = [0.1, 0.4, 1.5, 6, 7] as const;
/** marker position (percent) under the timeline for each stage. */
export const STAGE_MARKERS = [0, 3, 13, 53, 98] as const;

export const ERA_OPTIONS = [
  { value: "any", label: "Any era" },
  { value: "classic", label: "Classic" },
  { value: "1980s", label: "1980s" },
  { value: "1990s", label: "1990s" },
  { value: "2000s", label: "2000s" },
  { value: "2010s", label: "2010s" },
  { value: "2020s", label: "2020s" },
];

export const SEEN_STORAGE_KEY = "songspot.seen-rounds.v1";
export const SETTINGS_STORAGE_KEY = "songspot.settings.v1";

export function formatSeconds(s: number) {
  return `${s}s`;
}
