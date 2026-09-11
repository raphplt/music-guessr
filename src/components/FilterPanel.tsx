"use client";

import { useState } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { GENRE_OPTIONS, DECADE_OPTIONS } from "@/lib/itunesClient";
import clsx from "clsx";

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "rounded-full border px-3 py-1.5 text-sm transition",
        active
          ? "border-cyan-400 bg-cyan-950/50 text-cyan-300"
          : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700"
      )}
    >
      {children}
    </button>
  );
}

export function FilterPanel() {
  const filters = useSettingsStore((s) => s.filters);
  const toggleGenre = useSettingsStore((s) => s.toggleGenre);
  const toggleDecade = useSettingsStore((s) => s.toggleDecade);
  const toggleArtist = useSettingsStore((s) => s.toggleArtist);
  const [artistInput, setArtistInput] = useState("");

  return (
    <div className="space-y-5">
      <div>
        <div className="mb-2 text-sm font-semibold text-zinc-400">Genres</div>
        <div className="flex flex-wrap gap-2">
          {GENRE_OPTIONS.map((genre) => (
            <Chip
              key={genre}
              active={filters.genres.includes(genre)}
              onClick={() => toggleGenre(genre)}
            >
              {genre}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold text-zinc-400">Periodes</div>
        <div className="flex flex-wrap gap-2">
          {DECADE_OPTIONS.map((decade) => (
            <Chip
              key={decade}
              active={filters.decades.includes(decade)}
              onClick={() => toggleDecade(decade)}
            >
              {decade}s
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-2 text-sm font-semibold text-zinc-400">
          Artistes ({filters.artists.length})
        </div>
        <form
          className="mb-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const name = artistInput.trim();
            if (name) {
              toggleArtist(name);
              setArtistInput("");
            }
          }}
        >
          <input
            value={artistInput}
            onChange={(e) => setArtistInput(e.target.value)}
            placeholder="Ajouter un artiste..."
            className="flex-1 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-sm outline-none focus:border-cyan-500"
          />
          <button
            type="submit"
            className="rounded-lg border border-zinc-800 px-3 py-1.5 text-sm text-zinc-300 hover:border-zinc-700"
          >
            Ajouter
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {filters.artists.map((artist) => (
            <Chip key={artist} active onClick={() => toggleArtist(artist)}>
              {artist} &times;
            </Chip>
          ))}
        </div>
      </div>
    </div>
  );
}
