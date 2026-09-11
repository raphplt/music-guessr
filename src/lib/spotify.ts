interface SpotifyArtist {
  name: string;
  genres: string[];
}

interface SpotifyTopArtistsResponse {
  items: SpotifyArtist[];
}

export interface SpotifyTaste {
  artists: string[];
  genres: string[];
}

export async function fetchSpotifyTaste(accessToken: string): Promise<SpotifyTaste> {
  const res = await fetch(
    "https://api.spotify.com/v1/me/top/artists?limit=20&time_range=medium_term",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!res.ok) {
    throw new Error(`Spotify API error: ${res.status}`);
  }

  const data: SpotifyTopArtistsResponse = await res.json();
  const artists = data.items.map((item) => item.name);
  const genreCounts = new Map<string, number>();
  for (const item of data.items) {
    for (const genre of item.genres) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    }
  }
  const genres = [...genreCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([genre]) => genre)
    .slice(0, 10);

  return { artists, genres };
}
