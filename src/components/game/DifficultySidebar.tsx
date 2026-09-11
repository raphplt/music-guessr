"use client";

import type { Difficulty } from "@/lib/client-api";
import { DIFFICULTY_OPTIONS, THEMES } from "./constants";
import { RerollIcon } from "./icons";

export function DifficultySidebar({
  activeId,
  onSelect,
  onReroll,
}: {
  activeId: Difficulty;
  onSelect: (d: Difficulty) => void;
  onReroll: () => void;
}) {
  return (
    <aside className="songspot-difficulty-sidebar">
      <div className="songspot-rail-heading">Difficulty</div>
      <div className="songspot-difficulty-list">
        {DIFFICULTY_OPTIONS.map((d) => (
          <button
            key={d.id}
            type="button"
            className="songspot-difficulty-row"
            aria-pressed={activeId === d.id}
            style={{ "--row-color": THEMES[d.id].accentText } as React.CSSProperties}
            onClick={() => onSelect(d.id)}
          >
            {d.label}
          </button>
        ))}
      </div>
      <div className="songspot-rail-divider" />
      <button type="button" className="songspot-reroll" onClick={onReroll}>
        <RerollIcon />
        Reroll all
      </button>
    </aside>
  );
}
