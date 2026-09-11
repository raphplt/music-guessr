export type Difficulty = "easy" | "medium" | "hard" | "expert";

export type StartMode = "beginning" | "random";

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  previewUrl: string;
  previewDuration: number;
  genre: string;
  releaseYear: number;
}

export interface GameFilters {
  genres: string[];
  decades: number[];
  artists: string[];
}

export interface GameSettings {
  difficulty: Difficulty;
  startMode: StartMode;
  roundLength: number;
  filters: GameFilters;
}

export interface GuessAttempt {
  guess: string;
  correct: boolean;
  skipped: boolean;
}

export interface RoundResult {
  song: Song;
  attempts: GuessAttempt[];
  won: boolean;
  pointsEarned: number;
}
