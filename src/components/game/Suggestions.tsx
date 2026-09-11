"use client";

import type { Suggestion } from "@/lib/client-api";

export function Suggestions({
  suggestions,
  activeIndex,
  loading,
  emptyLabel,
  loadingLabel,
  onSelect,
}: {
  suggestions: Suggestion[];
  activeIndex: number;
  loading: boolean;
  emptyLabel: string;
  loadingLabel: string;
  onSelect: (s: Suggestion) => void;
}) {
  return (
    <div className="songspot-suggestions" role="listbox">
      {loading ? <div className="songspot-suggestion-empty">{loadingLabel}</div> : null}
      {!loading && suggestions.length === 0 ? <div className="songspot-suggestion-empty">{emptyLabel}</div> : null}
      {loading
        ? null
        : suggestions.map((s, i) => (
            <button
              key={s.id}
              id={`songspot-suggestion-${s.id}`}
              type="button"
              className="songspot-suggestion"
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => onSelect(s)}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.artworkUrl} alt="" width={34} height={34} loading="lazy" />
              <span>
                <strong>{s.title}</strong>
                <small>{s.artistName}</small>
              </span>
            </button>
          ))}
    </div>
  );
}
