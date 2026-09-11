import type { Song } from "./types";

interface ItunesRawResult {
  trackId: number;
  trackName: string;
  artistName: string;
  collectionName: string;
  artworkUrl100: string;
  previewUrl?: string;
  primaryGenreName: string;
  releaseDate: string;
  trackTimeMillis?: number;
}

function toSong(raw: ItunesRawResult): Song | null {
  if (!raw.previewUrl) return null;
  return {
    id: String(raw.trackId),
    title: raw.trackName,
    artist: raw.artistName,
    album: raw.collectionName,
    artworkUrl: raw.artworkUrl100?.replace("100x100", "600x600"),
    previewUrl: raw.previewUrl,
    previewDuration: 30,
    genre: raw.primaryGenreName,
    releaseYear: raw.releaseDate ? new Date(raw.releaseDate).getFullYear() : 0,
  };
}

export async function searchSongs(
  term: string,
  opts: { limit?: number; genre?: string } = {}
): Promise<Song[]> {
  const params = new URLSearchParams({
    term,
    limit: String(opts.limit ?? 25),
  });
  const res = await fetch(`/api/itunes/search?${params.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  const results: ItunesRawResult[] = data.results ?? [];
  return results
    .map(toSong)
    .filter((s): s is Song => s !== null)
    .filter((s) => !opts.genre || s.genre === opts.genre);
}

export async function fetchSongsForArtists(
  artists: string[],
  perArtist = 8
): Promise<Song[]> {
  const batches = await Promise.all(
    artists.map((artist) => searchSongs(artist, { limit: perArtist }))
  );
  const seen = new Set<string>();
  const merged: Song[] = [];
  for (const batch of batches) {
    for (const song of batch) {
      if (!seen.has(song.id)) {
        seen.add(song.id);
        merged.push(song);
      }
    }
  }
  return merged;
}

export const GENRE_OPTIONS = [
  "Pop",
  "Hip-Hop/Rap",
  "Rock",
  "Alternative",
  "R&B/Soul",
  "Electronic",
  "Dance",
  "Country",
  "Latin",
  "Reggae",
  "Jazz",
  "Classical",
  "French Pop",
  "K-Pop",
];

export const DECADE_OPTIONS = [1960, 1970, 1980, 1990, 2000, 2010, 2020];

export const DEFAULT_ARTIST_POOL = [
  "Daft Punk",
  "Stromae",
  "The Weeknd",
  "Dua Lipa",
  "Queen",
  "Michael Jackson",
  "Beyonce",
  "Drake",
  "Adele",
  "Coldplay",
  "Kendrick Lamar",
  "Billie Eilish",
  "Ed Sheeran",
  "Rihanna",
  "David Bowie",
];
