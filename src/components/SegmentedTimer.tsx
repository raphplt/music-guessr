"use client";

import clsx from "clsx";

interface SegmentedTimerProps {
  presets: number[];
  attemptIndex: number;
  currentDuration: number;
  elapsed: number;
}

export function SegmentedTimer({
  presets,
  attemptIndex,
  currentDuration,
  elapsed,
}: SegmentedTimerProps) {
  const total = presets[presets.length - 1];

  return (
    <div className="space-y-2">
      <div className="flex h-3 gap-1 overflow-hidden rounded-full bg-zinc-900">
        {presets.map((duration, i) => {
          const segmentStart = i === 0 ? 0 : presets[i - 1];
          const segmentWidth = ((duration - segmentStart) / total) * 100;
          const isPast = i < attemptIndex;
          const isCurrent = i === attemptIndex;
          const fillRatio = isPast
            ? 1
            : isCurrent
              ? Math.min(elapsed / currentDuration, 1)
              : 0;

          return (
            <div
              key={i}
              style={{ width: `${segmentWidth}%` }}
              className="relative h-full bg-zinc-800"
            >
              <div
                className={clsx(
                  "absolute inset-y-0 left-0 transition-[width]",
                  isPast ? "bg-zinc-600" : "bg-cyan-400"
                )}
                style={{ width: `${fillRatio * 100}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>Extrait : {currentDuration.toFixed(1)}s</span>
        <span className="tabular-nums">{elapsed.toFixed(1)}s</span>
      </div>
    </div>
  );
}
