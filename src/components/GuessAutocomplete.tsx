"use client";

import { useEffect, useRef, useState } from "react";
import { searchSongs } from "@/lib/itunesClient";
import type { Song } from "@/lib/types";

interface GuessAutocompleteProps {
  disabled?: boolean;
  onGuess: (label: string) => void;
}

export function GuessAutocomplete({ disabled, onGuess }: GuessAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const songs = await searchSongs(query, { limit: 6 });
      setResults(songs);
      setOpen(true);
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const visibleResults = query.trim().length < 2 ? [] : results;

  function selectSong(song: Song) {
    onGuess(`${song.title} ${song.artist}`);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="relative">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) onGuess(query.trim());
          setQuery("");
          setOpen(false);
        }}
        className="flex gap-2"
      >
        <input
          value={query}
          disabled={disabled}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => visibleResults.length > 0 && setOpen(true)}
          placeholder="Titre ou artiste..."
          className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3 outline-none focus:border-cyan-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled}
          className="rounded-xl bg-cyan-400 px-5 font-semibold text-zinc-950 hover:bg-cyan-300 disabled:opacity-50"
        >
          Valider
        </button>
      </form>

      {open && visibleResults.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900 shadow-xl">
          {visibleResults.map((song) => (
            <li key={song.id}>
              <button
                onClick={() => selectSong(song)}
                className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-zinc-800"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={song.artworkUrl} alt="" className="h-8 w-8 rounded" />
                <span>
                  <span className="font-medium">{song.title}</span>
                  <span className="ml-2 text-sm text-zinc-500">{song.artist}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
