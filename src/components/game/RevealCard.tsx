"use client";

import { Share2, SkipForward } from "lucide-react";
import type { Outcome, Reveal } from "@/lib/client-api";

export function RevealCard({
  reveal,
  outcome,
  rankLabel,
  onNext,
  onShare,
}: {
  reveal: Reveal;
  outcome: Outcome;
  rankLabel: string;
  onNext: () => void;
  onShare: () => void;
}) {
  const correct = outcome === "correct";
  return (
    <section className="songspot-reveal" data-outcome={outcome} tabIndex={-1} aria-live="polite">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="songspot-reveal-cover" src={reveal.artworkUrl} alt={`${reveal.title} cover art`} width={148} height={148} />
      <span className="songspot-reveal-kicker">{correct ? "YOU GOT IT_" : "IT WAS_"}</span>
      <div className="songspot-reveal-title">
        <h2>{reveal.title}</h2>
        <strong className="songspot-reveal-stamp">{correct ? "NICE!" : "LOST!"}</strong>
      </div>
      <p className="songspot-reveal-meta">
        {reveal.artistName}
        {reveal.albumName ? ` · ${reveal.albumName}` : ""}
      </p>
      {reveal.trackUrl ? (
        <a className="songspot-reveal-source" href={reveal.trackUrl} target="_blank" rel="noreferrer">
          Listen on Apple Music
        </a>
      ) : null}
      <p className="songspot-reveal-rank">{rankLabel}</p>
      <div className="songspot-reveal-actions">
        <button type="button" className="songspot-challenge" onClick={onShare}>
          <Share2 aria-hidden="true" size={18} />
          <span>Challenge your friend</span>
        </button>
        <button type="button" className="songspot-next" onClick={onNext}>
          <span>Next</span>
          <SkipForward aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
