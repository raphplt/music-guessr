"use client";

import type { Song } from "@/lib/types";
import clsx from "clsx";

interface RevealCardProps {
  song: Song;
  won: boolean;
  points: number;
  isLastSong: boolean;
  onNext: () => void;
}

export function RevealCard({ song, won, points, isLastSong, onNext }: RevealCardProps) {
  return (
    <div className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={song.artworkUrl}
        alt={song.album}
        className="mx-auto h-32 w-32 rounded-xl shadow-lg"
      />
      <div>
        <div className="text-xl font-bold">{song.title}</div>
        <div className="text-zinc-400">{song.artist}</div>
      </div>
      <div
        className={clsx(
          "inline-block rounded-full px-4 py-1 text-sm font-semibold",
          won ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"
        )}
      >
        {won ? `Trouve ! +${points} points` : "Perdu"}
      </div>
      <button
        onClick={onNext}
        className="w-full rounded-xl bg-cyan-400 py-3 font-semibold text-zinc-950 hover:bg-cyan-300"
      >
        {isLastSong ? "Voir le score final" : "Morceau suivant"}
      </button>
    </div>
  );
}
