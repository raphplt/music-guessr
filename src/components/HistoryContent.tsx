"use client";

import { useMemo } from "react";
import Link from "next/link";
import { computeHistoryStats, useHistoryStore } from "@/store/historyStore";

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-center">
      <div className="text-2xl font-black text-cyan-400">{value}</div>
      <div className="text-xs text-zinc-500">{label}</div>
    </div>
  );
}

export function HistoryContent() {
  const entries = useHistoryStore((s) => s.entries);
  const clear = useHistoryStore((s) => s.clear);
  const stats = useMemo(() => computeHistoryStats(entries), [entries]);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
        &larr; Accueil
      </Link>

      <h1 className="text-2xl font-bold">Statistiques</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="Parties jouees" value={String(stats.gamesPlayed)} />
        <StatTile label="Taux de reussite" value={`${Math.round(stats.winRate * 100)}%`} />
        <StatTile label="Serie actuelle" value={String(stats.currentStreak)} />
        <StatTile label="Meilleure serie" value={String(stats.bestStreak)} />
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Historique recent
          </h2>
          {entries.length > 0 && (
            <button onClick={clear} className="text-xs text-zinc-500 underline hover:text-zinc-300">
              Effacer
            </button>
          )}
        </div>

        {entries.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Aucune partie enregistree pour le moment. Joue une partie pour voir tes stats ici.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.slice(0, 30).map((entry, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-sm"
              >
                <div>
                  <div className="font-medium">{entry.songTitle}</div>
                  <div className="text-xs text-zinc-500">{entry.songArtist}</div>
                </div>
                <div className={entry.won ? "text-emerald-400" : "text-red-400"}>
                  {entry.won ? `+${entry.points} pts` : "Perdu"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
