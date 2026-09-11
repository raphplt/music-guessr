"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, Link2, Share2, X } from "lucide-react";
import type { Reveal } from "@/lib/client-api";
import { STAGE_SECONDS } from "./constants";

export type TicketResult = {
  title: string;
  won: boolean;
  reveal: Reveal;
  url: string;
  rankLabel: string;
};

function shareText(r: TicketResult) {
  const squares = STAGE_SECONDS.map((_, i) =>
    r.won ? (i === r.reveal.guessedStage ? "🟩" : i < (r.reveal.guessedStage ?? 0) ? "⬛" : "⬜") : "⬛",
  ).join("");
  const line = r.won ? `I got it in ${r.reveal.clipSeconds}s. How little do you need?` : `This one got me. Can you do better?`;
  return `${r.title} — ${line}\n${squares}\n${r.url}`;
}

/** The "Challenge your friend" ticket dialog (native <dialog>, styled like the original). */
export function ShareTicket({ result, onClose }: { result: TicketResult | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (result && !d.open) d.showModal();
    if (!result && d.open) d.close();
  }, [result]);

  useEffect(() => {
    setStatus("");
  }, [result]);

  if (!result) return <dialog ref={ref} className="sst-dialog" onClose={onClose} />;

  const text = shareText(result);
  const stages = STAGE_SECONDS.map((s, i) => ({
    label: `${s}s`,
    state: i === result.reveal.guessedStage && result.won ? "match" : result.won && i <= (result.reveal.guessedStage ?? 0) ? "miss" : result.won ? "close" : "miss",
  }));

  const copy = async (value: string, done: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setStatus(done);
    } catch {
      setStatus("Copy failed — select the text below.");
    }
  };

  const share = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: result.title, text, url: result.url });
        setStatus("Handed off to your share sheet.");
        return;
      } catch {
        /* cancelled */
      }
    }
    await copy(text, "Result copied — paste it anywhere.");
  };

  return (
    <dialog ref={ref} className="sst-dialog" onClose={onClose} aria-labelledby="sst-title">
      <div className="sst-dialog-inner">
        <div className="sst-dialog-header">
          <h2 id="sst-title">Challenge your friend</h2>
          <button type="button" className="sst-close" aria-label="Close" onClick={onClose}>
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="sst-export">
          <div className="sst-ticket">
            <div className="sst-paper">
              <div className="sst-brand-row">
                <span className="sst-brand">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="" width={24} height={24} />
                  <b>songspot</b>
                </span>
                <span className="sst-kicker">0.1-second challenge</span>
              </div>
              <p className="sst-game-title">{result.title}</p>
              <p className="sst-headline">{result.won ? `I got it in\n${result.reveal.clipSeconds}s.` : `This one\ngot me.`}</p>
              <div className="sst-score-row">
                <div className="sst-score">
                  <strong>{result.won ? result.reveal.clipSeconds : "X"}</strong>
                  <span>{result.won ? "s" : ""}</span>
                </div>
                <p className="sst-detail">{result.won ? `Score ${result.reveal.score.toLocaleString()} · solved on stage ${(result.reveal.guessedStage ?? 0) + 1}` : "No points this round."}</p>
              </div>
              <ol className="sst-stages">
                {stages.map((s) => (
                  <li key={s.label}>
                    <span className="sst-stage-mark" data-match={s.state} />
                    {s.label}
                  </li>
                ))}
              </ol>
            </div>
            <div className="sst-perforation" aria-hidden="true">
              <div className="sst-perforation-line" />
            </div>
            <div className="sst-stub">
              <div className="sst-stub-copy">
                <p>{result.won ? "How little do you need?" : "Can you do better?"}</p>
                <div className="sst-signoff">
                  <strong>{result.reveal.title}</strong>
                  <span>{result.reveal.artistName}</span>
                </div>
              </div>
              <div className="sst-stub-note">
                <span>{result.rankLabel}</span>
                <span>Play free at {typeof window !== "undefined" ? window.location.host : "songspot"}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="sst-actions">
          <button type="button" className="sst-primary" onClick={share}>
            <Share2 size={18} aria-hidden="true" />
            Share result
          </button>
          <div className="sst-secondary-row">
            <button type="button" onClick={() => copy(text, "Result copied — paste it anywhere.")}>
              <Copy size={16} aria-hidden="true" />
              <span>
                Copy result
                <small>Emoji grid + link, no spoilers</small>
              </span>
            </button>
            <button type="button" onClick={() => copy(result.url, "Link copied.")}>
              <Link2 size={16} aria-hidden="true" />
              <span>
                Copy link
                <small>Same filters &amp; difficulty</small>
              </span>
            </button>
          </div>
          <p className="sst-status" aria-live="polite">
            {status}
          </p>
          <p className="sst-round-note">The song title is never included in the shared text.</p>
        </div>
      </div>
    </dialog>
  );
}
