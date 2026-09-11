/**
 * Re-derives genre / era / difficulty from the raw fields already stored in
 * src/data/catalogue.json, so heuristics can be tuned without refetching.
 *
 *   npm run normalize:catalogue
 */
import { readFileSync, writeFileSync } from "node:fs";
import { difficultyFor, eraForYear, normalizeGenre, type CatalogueTrack } from "../src/lib/catalogue-shared";

const FILE = "src/data/catalogue.json";
const json = JSON.parse(readFileSync(FILE, "utf8")) as { generatedAt: string; tracks: CatalogueTrack[] };
for (const t of json.tracks) {
  t.genre = normalizeGenre(t.rawGenre);
  t.era = eraForYear(t.year);
  t.difficulty = difficultyFor(t.tier, t.rank);
}
writeFileSync(FILE, JSON.stringify(json));
const count = (k: keyof CatalogueTrack) =>
  Object.entries(json.tracks.reduce<Record<string, number>>((a, t) => ((a[String(t[k])] = (a[String(t[k])] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1]);
console.log(json.tracks.length, "tracks");
console.log("difficulty", count("difficulty"));
console.log("era", count("era"));
console.log("genre", count("genre"));
