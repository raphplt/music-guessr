"use client";

import { useState } from "react";
import type { FilterOption } from "@/lib/client-api";
import { TriangleIndicator } from "./icons";

const OFFSETS = [-2, -1, 0, 1, 2] as const;

/**
 * The "slot machine" filter reel: five visible values, the selected one in the
 * middle; clicking a neighbour rolls the reel toward it.
 */
export function FilterReel({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: FilterOption[];
  value: string;
  onSelect: (value: string) => void;
}) {
  const [rolling, setRolling] = useState<"forward" | "backward" | null>(null);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  return (
    <section className="songspot-filter-row" aria-label={label}>
      <span className="songspot-filter-label">{label}</span>
      <div
        className={`songspot-filter-values${rolling ? ` is-rolling-${rolling}` : ""}`}
        onAnimationEnd={(e) => {
          if (e.animationName.startsWith("songspot-filter-roll-")) setRolling(null);
        }}
      >
        <TriangleIndicator />
        {OFFSETS.map((offset) => {
          if (options.length === 0 || (options.length === 1 && offset !== 0)) {
            return <span key={offset} data-offset={offset} />;
          }
          const option = options[(index + offset + options.length * 3) % options.length];
          const selected = offset === 0;
          return (
            <button
              key={`${offset}:${option.value}`}
              type="button"
              data-offset={offset}
              aria-pressed={selected}
              aria-label={`${label}: ${option.label}`}
              title={option.count ? `${option.label} (${option.count})` : option.label}
              onClick={() => {
                if (selected || rolling) return;
                setRolling(offset > 0 ? "forward" : "backward");
                onSelect(option.value);
              }}
            >
              <span>{option.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
