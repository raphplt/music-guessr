/** Types and pure helpers shared by the build script and the app. */

export const DIFFICULTIES = ["easy", "medium", "hard", "expert", "impossible"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const ERAS = ["classic", "1980s", "1990s", "2000s", "2010s", "2020s"] as const;
export type Era = (typeof ERAS)[number];

export type CatalogueTrack = {
  id: string;
  title: string;
  artist: string;
  artistSlug: string;
  album: string;
  artworkUrl: string;
  previewUrl: string;
  trackUrl: string;
  year: number;
  era: Era;
  genre: string;
  rawGenre: string;
  difficulty: Difficulty;
  tier: 1 | 2 | 3 | 4;
  /** Popularity rank inside the artist's discography (0 = biggest hit). Deezer top-list position when matched, else 60 + iTunes order. */
  rank: number;
  /** Original position in the iTunes search results (kept for reruns of the enrichment). */
  itunesRank?: number;
  durationMs: number;
};

export function eraForYear(year: number): Era {
  if (year < 1980) return "classic";
  if (year < 1990) return "1980s";
  if (year < 2000) return "1990s";
  if (year < 2010) return "2000s";
  if (year < 2020) return "2010s";
  return "2020s";
}

const GENRE_MAP: Record<string, string> = {
  "hip-hop/rap": "hip-hop",
  "hip-hop": "hip-hop",
  rap: "hip-hop",
  "french rap": "hip-hop",
  "r&b/soul": "r-and-b",
  soul: "r-and-b",
  "contemporary r&b": "r-and-b",
  "neo-soul": "r-and-b",
  pop: "pop",
  "pop/rock": "pop",
  "french pop": "pop",
  "pop latino": "latin",
  "latin urban": "latin",
  latin: "latin",
  reggaeton: "latin",
  "latin pop": "latin",
  "urbano latino": "latin",
  "k-pop": "k-pop",
  rock: "rock",
  "hard rock": "rock",
  "alternative": "alternative",
  "indie rock": "alternative",
  "indie pop": "alternative",
  punk: "rock",
  "pop punk": "rock",
  metal: "metal",
  "heavy metal": "metal",
  "nu-metal": "metal",
  grunge: "rock",
  "classic rock": "rock",
  "adult alternative": "alternative",
  "singer/songwriter": "singer-songwriter",
  "adult contemporary": "pop",
  dance: "dance",
  electronic: "electronic",
  house: "dance",
  techno: "electronic",
  "electronica": "electronic",
  "dubstep": "electronic",
  "trance": "dance",
  "downtempo": "electronic",
  "ambient": "electronic",
  country: "country",
  "contemporary country": "country",
  reggae: "reggae",
  dancehall: "reggae",
  "afro-pop": "afrobeats",
  afrobeats: "afrobeats",
  "afro pop": "afrobeats",
  "world": "world",
  soundtrack: "soundtrack",
  "soundtracks": "soundtrack",
  jazz: "jazz",
  "vocal jazz": "jazz",
  vocal: "vocal",
  "teen pop": "teen-pop",
  "disco": "disco",
  funk: "funk",
  blues: "blues",
  "chanson française": "chanson",
  "chanson": "chanson",
  "variété française": "chanson",
  "musique française": "chanson",
  classical: "classical",
  "new age": "classical",
  christmas: "holiday",
  holiday: "holiday",
  "easy listening": "vocal",
  "hard bop": "jazz",
  "big band": "jazz",
  "rock & roll": "rock",
  "rock 'n' roll": "rock",
  "electro": "electronic",
  "house music": "dance",
  "urban": "hip-hop",
  "alternative rap": "hip-hop",
  "gangsta rap": "hip-hop",
  "east coast rap": "hip-hop",
  "west coast rap": "hip-hop",
  "southern rap": "hip-hop",
  "underground rap": "hip-hop",
  "musique du monde": "world",
  "french": "chanson",
  "pop française": "pop",
  "musique de film": "soundtrack",
  "bande originale": "soundtrack",
  "original score": "soundtrack",
  musicals: "soundtrack",
  "variete francaise": "chanson",
  "chanson francaise": "chanson",
  "rap francais": "hip-hop",
  "pop francaise": "pop",
  "rock francais": "rock",
  electronique: "electronic",
  danse: "dance",
  alternatif: "alternative",
  "musiques du monde": "world",
  worldwide: "world",
  african: "afrobeats",
  "afro-fusion": "afrobeats",
  alte: "afrobeats",
  "musica tropical": "latin",
  "musica mexicana": "latin",
  "urban latin": "latin",
  "rock y alternativo": "latin",
  brazilian: "latin",
  "new wave": "rock",
  britpop: "rock",
  "soft rock": "rock",
  "folk-rock": "folk",
  folk: "folk",
  "contemporary folk": "folk",
  americana: "country",
  bluegrass: "country",
  "traditional country": "country",
  motown: "r-and-b",
  "classical crossover": "classical",
  "j-pop": "j-pop",
  japanime: "j-pop",
  christian: "other",
  "children's music": "other",
  "fitness & workout": "other",
  breakbeat: "electronic",
  bop: "jazz",
  "musique classique": "classical",
  "folk traditionnel": "folk",
  "folk-traditionnel": "folk",
  "roots reggae": "reggae",
  afrobeat: "afrobeats",
  arabe: "world",
  "afrique du nord": "world",
  "jungle/drum'n'bass": "electronic",
  "drum & bass": "electronic",
  "drum'n'bass": "electronic",
};

export function normalizeGenre(raw: string): string {
  const key = raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  if (GENRE_MAP[key]) return GENRE_MAP[key];
  if (key.includes("rap") || key.includes("hip")) return "hip-hop";
  if (key.includes("r&b")) return "r-and-b";
  if (key.includes("latin")) return "latin";
  if (key.includes("rock")) return "rock";
  if (key.includes("metal")) return "metal";
  if (key.includes("electro") || key.includes("techno")) return "electronic";
  if (key.includes("dance") || key.includes("house")) return "dance";
  if (key.includes("pop")) return "pop";
  if (key.includes("jazz")) return "jazz";
  if (key.includes("country")) return "country";
  if (key.includes("soul")) return "r-and-b";
  if (key.startsWith("christmas")) return "holiday";
  if (key.includes("fran")) return "chanson";
  return key ? key.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : "other";
}

export const GENRE_LABELS: Record<string, string> = {
  pop: "Pop",
  rock: "Rock",
  "hip-hop": "Hip-Hop",
  "r-and-b": "R&B",
  "k-pop": "K-Pop",
  alternative: "Alternative",
  metal: "Metal",
  dance: "Dance",
  electronic: "Electronic",
  country: "Country",
  latin: "Latin",
  reggae: "Reggae",
  afrobeats: "Afrobeats",
  soundtrack: "Soundtrack",
  jazz: "Jazz",
  vocal: "Vocal",
  "teen-pop": "Teen Pop",
  disco: "Disco",
  funk: "Funk",
  blues: "Blues",
  chanson: "Chanson",
  classical: "Classical",
  holiday: "Holiday",
  "singer-songwriter": "Singer/Songwriter",
  folk: "Folk",
  "j-pop": "J-Pop",
  world: "World",
  other: "Other",
};

export function genreLabel(value: string): string {
  return (
    GENRE_LABELS[value] ??
    value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export const ERA_LABELS: Record<Era, string> = {
  classic: "Classic",
  "1980s": "1980s",
  "1990s": "1990s",
  "2000s": "2000s",
  "2010s": "2010s",
  "2020s": "2020s",
};

/**
 * Difficulty heuristic: how famous is this track? Combines the artist tier with
 * the track's rank inside the artist's iTunes results (popularity-ordered).
 */
export function difficultyFor(tier: 1 | 2 | 3 | 4, rank: number): Difficulty {
  const fame = rank + (tier - 1) * 6;
  if (fame < 8) return "easy";
  if (fame < 16) return "medium";
  if (fame < 28) return "hard";
  if (fame < 45) return "expert";
  return "impossible";
}
