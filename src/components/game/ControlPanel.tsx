"use client";

import type { PlaybackMode, Source } from "@/lib/client-api";
import { STAGE_LABELS } from "./constants";
import { FromStartIcon, LibraryIcon, ShuffleIcon, SpotifyIcon } from "./icons";

export function ControlPanel({
  unlockedStage,
  volume,
  onVolumeChange,
  playback,
  onPlaybackChange,
  source,
  onSourceChange,
  spotifyConnected,
  spotifyConfigured,
  spotifyName,
  onSpotifyLogin,
  hideLibrary = false,
}: {
  unlockedStage: number;
  volume: number;
  onVolumeChange: (v: number) => void;
  playback: PlaybackMode;
  onPlaybackChange: (p: PlaybackMode) => void;
  source: Source;
  onSourceChange: (s: Source) => void;
  spotifyConnected: boolean;
  spotifyConfigured: boolean;
  spotifyName?: string | null;
  onSpotifyLogin: () => void;
  hideLibrary?: boolean;
}) {
  return (
    <aside className="songspot-control-panel">
      <section className="songspot-control-section">
        <div className="songspot-rail-heading">Playback</div>
        <button type="button" className="songspot-control-key" aria-pressed={playback === "start"} onClick={() => onPlaybackChange("start")}>
          <FromStartIcon />
          From the start
        </button>
        <button type="button" className="songspot-control-key" aria-pressed={playback === "random"} onClick={() => onPlaybackChange("random")}>
          <ShuffleIcon />
          Random moment
        </button>
      </section>
      {!hideLibrary && (
        <>
          <div className="songspot-rail-divider" />
          <section className="songspot-control-section">
            <div className="songspot-rail-heading">Library</div>
            <button type="button" className="songspot-control-key" aria-pressed={source === "catalogue"} onClick={() => onSourceChange("catalogue")}>
              <LibraryIcon />
              Full catalogue
            </button>
            <button
              type="button"
              className={`songspot-control-key${!spotifyConfigured ? " songspot-control-disabled" : ""}`}
              aria-pressed={source === "spotify"}
              aria-disabled={!spotifyConfigured}
              title={
                !spotifyConfigured
                  ? "Add Spotify credentials to .env.local to enable"
                  : spotifyConnected
                    ? `Songs from ${spotifyName ?? "your"} Spotify top artists`
                    : "Connect Spotify to play your own taste"
              }
              onClick={() => {
                if (!spotifyConfigured) return;
                if (!spotifyConnected) onSpotifyLogin();
                else onSourceChange("spotify");
              }}
            >
              <span className="songspot-spotify">
                <SpotifyIcon />
              </span>
              {spotifyConnected ? "My Spotify" : "Connect Spotify"}
              {!spotifyConfigured && <span className="songspot-coming">Coming soon</span>}
            </button>
          </section>
        </>
      )}
      <div className="songspot-rail-divider" />
      <section className="songspot-control-section">
        <div className="songspot-rail-heading">Guess after</div>
        <div className="songspot-chip-grid">
          {STAGE_LABELS.map((label, i) => (
            <button key={label} type="button" className="songspot-control-chip" aria-pressed={i <= unlockedStage} disabled={i > unlockedStage}>
              {label}
            </button>
          ))}
        </div>
      </section>
      <div className="songspot-rail-divider" />
      <section className="songspot-control-section">
        <div className="songspot-rail-heading">Volume</div>
        <input
          className="songspot-slider"
          type="range"
          min={0}
          max={100}
          value={volume}
          aria-label="Volume"
          style={{ "--fill": `${volume}%` } as React.CSSProperties}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
        />
      </section>
    </aside>
  );
}
