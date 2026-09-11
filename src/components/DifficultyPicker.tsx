"use client";

import { useSettingsStore } from "@/store/settingsStore";
import { DIFFICULTY_LABELS, DIFFICULTY_PRESETS } from "@/lib/gameEngine";
import type { Difficulty } from "@/lib/types";
import clsx from "clsx";

const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "expert"];

export function DifficultyPicker() {
  const difficulty = useSettingsStore((s) => s.difficulty);
  const setDifficulty = useSettingsStore((s) => s.setDifficulty);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {DIFFICULTIES.map((d) => (
        <button
          key={d}
          onClick={() => setDifficulty(d)}
          className={clsx(
            "rounded-xl border px-4 py-3 text-left transition",
            difficulty === d
              ? "border-cyan-400 bg-cyan-950/40 text-cyan-300"
              : "border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700"
          )}
        >
          <div className="font-semibold">{DIFFICULTY_LABELS[d]}</div>
          <div className="text-xs text-zinc-500">
            Depart : {DIFFICULTY_PRESETS[d][0]}s
          </div>
        </button>
      ))}
    </div>
  );
}
