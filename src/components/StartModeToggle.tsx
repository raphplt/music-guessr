"use client";

import { useSettingsStore } from "@/store/settingsStore";
import clsx from "clsx";

export function StartModeToggle() {
  const startMode = useSettingsStore((s) => s.startMode);
  const setStartMode = useSettingsStore((s) => s.setStartMode);
  const isRandom = startMode === "random";

  return (
    <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
      <div>
        <div className="font-semibold">Point de depart de l&apos;extrait</div>
        <div className="text-xs text-zinc-500">
          {isRandom
            ? "L'extrait commence a un moment aleatoire du morceau"
            : "L'extrait commence toujours au debut du morceau"}
        </div>
      </div>
      <button
        onClick={() => setStartMode(isRandom ? "beginning" : "random")}
        className={clsx(
          "relative h-8 w-16 rounded-full transition",
          isRandom ? "bg-cyan-500" : "bg-zinc-700"
        )}
        aria-pressed={isRandom}
      >
        <span
          className={clsx(
            "absolute top-1 h-6 w-6 rounded-full bg-white transition-transform",
            isRandom ? "translate-x-9" : "translate-x-1"
          )}
        />
      </button>
    </div>
  );
}
