"use client";

import Link from "next/link";
import { DifficultyPicker } from "@/components/DifficultyPicker";
import { StartModeToggle } from "@/components/StartModeToggle";
import { FilterPanel } from "@/components/FilterPanel";
import { ConnectPanel } from "@/components/ConnectPanel";
import { useSettingsStore } from "@/store/settingsStore";

export function HomeContent() {
  const roundLength = useSettingsStore((s) => s.roundLength);
  const setRoundLength = useSettingsStore((s) => s.setRoundLength);
  const filters = useSettingsStore((s) => s.filters);

  const canPlay = filters.artists.length > 0 || filters.genres.length > 0;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-4 py-10 sm:py-16">
      <header className="text-center">
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
          Vinyl<span className="text-cyan-400">.</span>
        </h1>
        <p className="mt-2 text-zinc-400">
          Devine le morceau a partir d&apos;un extrait de plus en plus long.
        </p>
        <div className="mt-4 flex justify-center gap-3 text-sm">
          <Link
            href="/daily"
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:border-cyan-500 hover:text-cyan-300"
          >
            Defi du jour
          </Link>
          <Link
            href="/history"
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:border-cyan-500 hover:text-cyan-300"
          >
            Mes stats
          </Link>
        </div>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Difficulte
        </h2>
        <DifficultyPicker />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Lecture
        </h2>
        <StartModeToggle />
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
          <div>
            <div className="font-semibold">Nombre de morceaux</div>
            <div className="text-xs text-zinc-500">Longueur de la partie</div>
          </div>
          <div className="flex items-center gap-3">
            {[3, 5, 10].map((n) => (
              <button
                key={n}
                onClick={() => setRoundLength(n)}
                className={
                  "h-9 w-9 rounded-lg border text-sm font-semibold " +
                  (roundLength === n
                    ? "border-cyan-400 bg-cyan-950/40 text-cyan-300"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-700")
                }
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Comptes connectes
        </h2>
        <ConnectPanel />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Filtres (artistes, genres, periodes)
        </h2>
        <FilterPanel />
      </section>

      <Link
        href={canPlay ? "/play" : "#"}
        aria-disabled={!canPlay}
        className={
          "mt-4 rounded-2xl px-6 py-4 text-center text-lg font-bold transition " +
          (canPlay
            ? "bg-cyan-400 text-zinc-950 hover:bg-cyan-300"
            : "cursor-not-allowed bg-zinc-800 text-zinc-500")
        }
      >
        Jouer
      </Link>
      {!canPlay && (
        <p className="-mt-4 text-center text-xs text-zinc-500">
          Selectionne au moins un artiste ou un genre pour commencer.
        </p>
      )}
    </main>
  );
}
