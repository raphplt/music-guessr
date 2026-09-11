"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { ApiError, getJson, postJson } from "@/lib/client-api";
import type { Difficulty, Era, FilterOption, FiltersData, Outcome, PlaybackMode, Reveal, RoundPublic, Source, Suggestion, TransitionResult } from "@/lib/client-api";
import { useClipPlayer } from "@/hooks/useClipPlayer";
import { useSpotify } from "@/components/site/SpotifyProvider";
import { ControlPanel } from "./ControlPanel";
import { DifficultySidebar } from "./DifficultySidebar";
import { FilterReel } from "./FilterReel";
import { RevealCard } from "./RevealCard";
import { ShareTicket, type TicketResult } from "./ShareTicket";
import { Suggestions } from "./Suggestions";
import { DIFFICULTY_OPTIONS, ERA_OPTIONS, SEEN_STORAGE_KEY, SETTINGS_STORAGE_KEY, STAGE_MARKERS, STAGE_WEIGHTS, THEMES, formatSeconds } from "./constants";
import { PauseIcon, PlayIcon, SearchIcon, SkipIcon } from "./icons";

export type CollectionInfo = { slug: string; label: string; kind: "genre" | "decade" | "artist"; total: number };

type Props = {
  collection?: CollectionInfo | null;
  mode?: "practice" | "daily";
  initialFilters?: FiltersData | null;
  headingLevel?: 1 | 2;
};

type Status =
  | "preparing"
  | "ready"
  | "playing"
  | "submitting"
  | "incorrect"
  | "correct"
  | "failed"
  | "audio-blocked"
  | "network-error";

const STATUS_LABEL: Record<Status, string> = {
  preparing: "Preparing track",
  ready: "Ready",
  playing: "Playing",
  submitting: "Checking guess",
  incorrect: "Incorrect",
  correct: "Correct",
  failed: "Failed",
  "audio-blocked": "Audio blocked",
  "network-error": "Network error",
};

type Settings = { difficulty: Difficulty; playback: PlaybackMode; source: Source; volume: number };

function readSettings(): Partial<Settings> {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) ?? "{}") as Partial<Settings>;
  } catch {
    return {};
  }
}

function focusPlayKey() {
  requestAnimationFrame(() => {
    const root = document.getElementById("songspot-game");
    const target = root?.querySelector<HTMLElement>(".songspot-play-key:not(:disabled), .songspot-next:not(:disabled), .songspot-reveal") ?? root;
    target?.focus({ preventScroll: true });
  });
}

export function SongspotGame({ collection = null, mode = "practice", initialFilters = null, headingLevel = 1 }: Props) {
  const spotify = useSpotify();
  const seenKey = collection ? `${SEEN_STORAGE_KEY}:${collection.slug}` : mode === "daily" ? `${SEEN_STORAGE_KEY}:daily` : SEEN_STORAGE_KEY;

  /* ---------------- settings & filters ---------------- */
  const [hydrated, setHydrated] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [era, setEra] = useState<Era | "any">("any");
  const [genre, setGenre] = useState("any");
  const [artist, setArtist] = useState("any");
  const [playback, setPlayback] = useState<PlaybackMode>("start");
  const [source, setSource] = useState<Source>("catalogue");
  const [volume, setVolume] = useState(25);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);

  /** Bumping `serial` requests a fresh round with the current filters. */
  const [request, setRequest] = useState({ difficulty: "easy" as Difficulty, era: "any" as Era | "any", genre: "any", artist: "any", playback: "start" as PlaybackMode, source: "catalogue" as Source, serial: 0 });

  /* ---------------- round state ---------------- */
  const [round, setRound] = useState<RoundPublic | null>(null);
  const [roundError, setRoundError] = useState<string | null>(null);
  const [reveal, setReveal] = useState<Reveal | undefined>();
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [incorrectLabel, setIncorrectLabel] = useState("");
  const [flash, setFlash] = useState<"incorrect" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [ticket, setTicket] = useState<TicketResult | null>(null);

  /* ---------------- search ---------------- */
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const [filters, setFilters] = useState<FiltersData | null>(initialFilters);

  /* ---------------- hydration: restore settings + seen list ---------------- */
  useEffect(() => {
    const s = readSettings();
    const d = s.difficulty && DIFFICULTY_OPTIONS.some((o) => o.id === s.difficulty) ? s.difficulty : "easy";
    const p = s.playback === "random" ? "random" : "start";
    const src: Source = s.source === "spotify" ? "spotify" : "catalogue";
    setDifficulty(d);
    setPlayback(p);
    setSource(collection || mode === "daily" ? "catalogue" : src);
    if (typeof s.volume === "number") setVolume(Math.min(100, Math.max(0, s.volume)));
    try {
      const list = JSON.parse(sessionStorage.getItem(seenKey) ?? "[]");
      if (Array.isArray(list)) setSeen(list.filter((x) => typeof x === "string").slice(-100));
    } catch {
      /* ignore */
    }
    setRequest((r) => ({ ...r, difficulty: d, playback: p, source: collection || mode === "daily" ? "catalogue" : src }));
    setHydrated(true);
  }, [seenKey, collection, mode]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ difficulty, playback, source, volume } satisfies Settings));
    } catch {
      /* ignore */
    }
  }, [hydrated, difficulty, playback, source, volume]);

  // A Spotify session that disappeared falls back to the catalogue.
  useEffect(() => {
    if (!spotify.loading && !spotify.connected && source === "spotify") {
      setSource("catalogue");
      setRequest((r) => ({ ...r, source: "catalogue", serial: r.serial + 1 }));
    }
  }, [spotify.loading, spotify.connected, source]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---------------- filters (genre counts depend on the era) ---------------- */
  useEffect(() => {
    if (collection) return;
    let cancelled = false;
    getJson<FiltersData>(`/api/filters?${new URLSearchParams({ era, artist })}`)
      .then((d) => {
        if (!cancelled) setFilters(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [era, artist, collection]);

  const genreOptions = useMemo<FilterOption[]>(() => {
    const list = (filters?.genres ?? []).map((g) => ({ ...g }));
    if (genre !== "any" && !list.some((g) => g.value === genre)) list.push({ value: genre, label: genre, count: 0 });
    return [{ value: "any", label: "Any genre" }, ...list];
  }, [filters?.genres, genre]);

  const artistOptions = useMemo<FilterOption[]>(() => {
    const base = filters?.artists ?? [];
    const mine = spotify.me?.connected ? spotify.me.artists : [];
    const merged = [...mine, ...base.filter((b) => !mine.some((m) => m.label.toLowerCase() === b.label.toLowerCase()))];
    return [{ value: "any", label: "Any artist" }, ...merged];
  }, [filters?.artists, spotify.me]);

  /* ---------------- round fetching ---------------- */
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    setRoundError(null);
    const params = new URLSearchParams({
      difficulty: request.difficulty,
      era: collection ? "any" : request.era,
      genre: collection ? "any" : request.genre,
      artist: collection ? "any" : request.artist,
      playback: request.playback,
      source: request.source,
    });
    if (mode === "daily") params.set("mode", "daily");
    if (collection) params.set("collection", collection.slug);
    if (seen.length) params.set("exclude", seen.join(","));
    getJson<RoundPublic>(`/api/round?${params}`)
      .then((r) => {
        if (cancelled) return;
        setRound(r);
        setReveal(undefined);
        setOutcome(null);
        setIncorrectLabel("");
        setFlash(null);
        setSubmitError(null);
        setQuery("");
        setSeen((prev) => {
          if (prev.includes(r.roundKey)) return prev;
          const next = [...prev, r.roundKey].slice(-100);
          try {
            sessionStorage.setItem(seenKey, JSON.stringify(next));
          } catch {
            /* ignore */
          }
          return next;
        });
        if (request.serial > 0) focusPlayKey();
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setRound(null);
        setRoundError(e instanceof Error ? e.message : "Network error");
      });
    return () => {
      cancelled = true;
    };
    // `seen` is intentionally excluded: it changes as a *result* of a fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, request, collection?.slug, mode]);

  const player = useClipPlayer({ roundKey: round?.roundKey ?? null, roundToken: round?.roundToken ?? null, volume });

  useEffect(() => {
    if (["playing", "paused", "blocked", "muted", "network-error", "decode-error"].includes(player.state)) setStarting(false);
  }, [player.state]);

  /* ---------------- search ---------------- */
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 220);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!round || reveal || !debounced) {
      setSuggestions([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const params = new URLSearchParams({ q: debounced, limit: "8" });
    const scope = collection?.slug ?? (artist !== "any" && !artist.startsWith("spotify:") ? undefined : undefined);
    if (scope) params.set("collection", scope);
    if (artist.startsWith("spotify:")) params.set("collection", artist);
    if (round.source === "spotify") params.set("source", "spotify");
    getJson<Suggestion[]>(`/api/search?${params}`)
      .then((list) => {
        if (!cancelled) setSuggestions(list);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, round, reveal, collection?.slug, artist]);

  useEffect(() => {
    setActiveIndex(suggestions.length > 0 ? 0 : -1);
  }, [suggestions]);

  /* ---------------- transitions ---------------- */
  const applyResult = useCallback(
    (result: TransitionResult, guessed?: Suggestion) => {
      player.stop();
      setSubmitError(null);
      if (result.outcome === "active") {
        setRound((r) => r && { ...r, roundToken: result.roundToken, stage: result.stage, clipSeconds: result.clipSeconds, mistakes: result.mistakes });
        if (guessed) {
          setIncorrectLabel(`${guessed.title} — ${guessed.artistName}`);
          setFlash("incorrect");
        } else {
          setFlash(null);
        }
        setQuery("");
        setFocused(false);
        focusPlayKey();
        return;
      }
      setReveal(result.reveal);
      setOutcome(result.outcome);
      setFlash(null);
      setFocused(false);
    },
    [player],
  );

  const submitGuess = useCallback(
    async (s: Suggestion) => {
      if (!round || reveal || submitting) return;
      setQuery(s.title);
      setFocused(false);
      setSubmitting(true);
      try {
        const result = await postJson<TransitionResult>("/api/guess", { roundToken: round.roundToken, candidateTrackId: s.id });
        applyResult(result, s);
      } catch (e) {
        setSubmitError(e instanceof ApiError ? e.message : "Network error");
      } finally {
        setSubmitting(false);
      }
    },
    [round, reveal, submitting, applyResult],
  );

  const skip = useCallback(async () => {
    if (!round || reveal || submitting) return;
    setSubmitting(true);
    try {
      const result = await postJson<TransitionResult>("/api/skip", { roundToken: round.roundToken });
      applyResult(result);
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }, [round, reveal, submitting, applyResult]);

  const newRound = useCallback(
    (patch: Partial<Omit<typeof request, "serial">> = {}) => {
      player.stop();
      setRound(null);
      setReveal(undefined);
      setOutcome(null);
      setFlash(null);
      setSubmitError(null);
      setQuery("");
      setRequest((r) => ({ ...r, ...patch, serial: r.serial + 1 }));
    },
    [player],
  );

  const next = () => newRound({ difficulty, era, genre, artist, playback, source });
  const reroll = () => {
    setEra("any");
    setGenre("any");
    setArtist("any");
    newRound({ difficulty, era: "any", genre: "any", artist: "any", playback, source });
  };
  const pickDifficulty = (d: Difficulty) => {
    if (d === difficulty) return;
    setDifficulty(d);
    newRound({ difficulty: d, era, genre, artist, playback, source });
  };
  const pickEra = (v: string) => {
    const e = v as Era | "any";
    if (e === era) return;
    setEra(e);
    newRound({ difficulty, era: e, genre, artist, playback, source });
  };
  const pickGenre = (g: string) => {
    if (g === genre) return;
    setGenre(g);
    newRound({ difficulty, era, genre: g, artist, playback, source });
  };
  const pickArtist = (a: string) => {
    if (a === artist) return;
    setArtist(a);
    newRound({ difficulty, era, genre, artist: a, playback, source });
  };
  const pickPlayback = (p: PlaybackMode) => {
    if (p === playback) return;
    setPlayback(p);
    // applies to the next round; an in-progress round keeps its start point
    if (!round || reveal) newRound({ difficulty, era, genre, artist, playback: p, source });
    else setRequest((r) => ({ ...r, playback: p }));
  };
  const pickSource = (s: Source) => {
    if (s === source) return;
    setSource(s);
    if (s === "spotify") void spotify.refresh(true);
    newRound({ difficulty, era, genre, artist, playback, source: s });
  };

  const togglePlay = async () => {
    if (!round || reveal) return;
    if (player.state === "playing") return void (await player.pause().catch(() => {}));
    if (player.state === "paused") return void (await player.resume().catch(() => {}));
    if (starting) return;
    setFlash(null);
    setSubmitError(null);
    setStarting(true);
    try {
      await player.play(round.clipSeconds, round.offsetSeconds);
    } catch {
      /* state already reflects the failure */
    } finally {
      setStarting(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(suggestions.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const s = suggestions[activeIndex] ?? suggestions[0];
      if (s) void submitGuess(s);
    } else if (e.key === "Escape") {
      setFocused(false);
    }
  };

  /* ---------------- derived view state ---------------- */
  const status: Status =
    roundError || submitError
      ? "network-error"
      : outcome === "correct"
        ? "correct"
        : outcome === "failed"
          ? "failed"
          : submitting
            ? "submitting"
            : player.state === "blocked" || player.state === "muted"
              ? "audio-blocked"
              : player.state === "network-error" || player.state === "decode-error"
                ? "network-error"
                : player.state === "playing"
                  ? "playing"
                  : flash === "incorrect"
                    ? "incorrect"
                    : round
                      ? "ready"
                      : "preparing";

  const noTracks = !!roundError && /No unseen tracks|No more tracks|Connect Spotify|Unknown collection/i.test(roundError);
  const noPreview = player.error?.includes("No audio preview") ?? false;
  const statusText = noTracks
    ? roundError
    : noPreview
      ? "No audio preview"
      : status === "network-error" && (roundError || submitError)
        ? (roundError ?? submitError)
        : STATUS_LABEL[status];
  const recoverable = status === "network-error" || status === "audio-blocked";

  const recover = () => {
    if (noTracks) {
      setSeen([]);
      try {
        sessionStorage.removeItem(seenKey);
      } catch {
        /* ignore */
      }
      if (roundError?.includes("Spotify")) {
        setSource("catalogue");
        newRound({ difficulty, era, genre, artist, playback, source: "catalogue" });
      } else reroll();
    } else if (noPreview || roundError) next();
    else if (player.state === "blocked" || player.state === "muted") void togglePlay();
    else if (player.state === "network-error" || player.state === "decode-error") void player.retry();
    else setSubmitError(null);
  };

  const theme = THEMES[difficulty];
  const stage = round?.stage ?? 0;
  const clipLabel = formatSeconds(round?.clipSeconds ?? 0.1);
  const totalWeight = STAGE_WEIGHTS.reduce((a, b) => a + b, 0);
  const playbackProgress = (STAGE_WEIGHTS.slice(0, stage + 1).reduce((a, b) => a + b, 0) / totalWeight) * player.progress;
  const playDisabled = !round || !!reveal || starting || submitting;
  const suggestionsOpen = focused && query.trim().length > 0 && !!round && !reveal;
  const revealed = !!(reveal && outcome);

  const rankLabel =
    mode === "daily" ? `Daily challenge · ${round?.date ?? ""}` : round?.source === "spotify" ? "Your Spotify taste · not ranked" : "Practice round · not ranked";

  const openTicket = () => {
    if (!reveal || !outcome) return;
    const url = new URL(window.location.href);
    url.hash = "";
    if (!collection && mode === "practice") {
      url.search = new URLSearchParams({ difficulty, ...(era !== "any" ? { era } : {}), ...(genre !== "any" ? { genre } : {}), ...(artist !== "any" && !artist.startsWith("spotify:") ? { artist } : {}) }).toString();
    }
    setTicket({
      title: collection ? `${collection.label} · Songspot` : mode === "daily" ? "Songspot Daily" : "Songspot",
      won: outcome === "correct",
      reveal,
      url: url.toString(),
      rankLabel,
    });
  };

  const style = {
    "--song-accent": theme.accent,
    "--song-accent-text": theme.accentText,
    "--song-accent-on": theme.accentOn,
    "--song-accent-rgb": theme.rgb,
    "--song-page": theme.page,
    "--song-stage": theme.stage,
    "--song-surface": theme.surface,
    "--song-surface-soft": theme.surfaceSoft,
    "--song-timeline": theme.timeline,
    "--timeline-position": `${STAGE_MARKERS[stage]}%`,
  } as React.CSSProperties;

  const Heading = headingLevel === 2 ? "h2" : "h1";
  const spotifyName = spotify.me?.connected ? spotify.me.profile.displayName : null;
  const spotifyAvatar = spotify.me?.connected ? spotify.me.profile.image : null;

  const controlPanel = (
    <ControlPanel
      unlockedStage={stage}
      volume={volume}
      onVolumeChange={setVolume}
      playback={playback}
      onPlaybackChange={pickPlayback}
      source={source}
      onSourceChange={pickSource}
      spotifyConnected={spotify.connected}
      spotifyConfigured={spotify.configured}
      spotifyName={spotifyName}
      onSpotifyLogin={spotify.login}
      hideLibrary={!!collection || mode === "daily"}
    />
  );

  return (
    <section
      id="songspot-game"
      tabIndex={-1}
      className="songspot-shell"
      style={style}
      aria-labelledby="songspot-heading"
      data-collection-key={round?.collectionKey ?? "general"}
      data-selected-artist={artist}
      data-source={source}
    >
      <Heading id="songspot-heading" className="songspot-sr-only">
        {collection ? `${collection.label} music quiz: guess the song from a 0.1-second clip` : "songspot: guess the song from a 0.1-second clip"}
      </Heading>
      <svg className="songspot-spotlight" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true">
        <polygon className="songspot-cone" points="292,0 708,0 836,1000 164,1000" />
        <line x1="292" y1="0" x2="164" y2="1000" />
        <line x1="708" y1="0" x2="836" y2="1000" />
      </svg>
      <div className="songspot-stage">
        <button type="button" className="songspot-mobile-menu-button" aria-label="Open menu" aria-expanded={mobileOpen} onClick={() => setMobileOpen(true)}>
          <SlidersHorizontal aria-hidden="true" />
        </button>
        <a className="songspot-faq" href="#faq">
          FAQ
        </a>
        <div className="songspot-difficulty-rail">
          <DifficultySidebar activeId={difficulty} onSelect={pickDifficulty} onReroll={reroll} />
        </div>

        <section className="songspot-board">
          <div className="songspot-wordmark-slot">
            {collection ? (
              <h2 className="songspot-collection-title">{collection.label}</h2>
            ) : mode === "daily" ? (
              <h2 className="songspot-collection-title">Daily Challenge</h2>
            ) : (
              <div className="songspot-wordmark">songspot</div>
            )}
          </div>
          <div className="songspot-board-content">
            <div className="songspot-game-controls" data-revealed={revealed ? "true" : undefined}>
              {!collection && mode !== "daily" && (
                <div className="songspot-filter-stack">
                  <FilterReel label="Genres" options={genreOptions} value={genre} onSelect={pickGenre} />
                  <FilterReel label="Eras" options={ERA_OPTIONS} value={era} onSelect={pickEra} />
                  <FilterReel label="Artists" options={artistOptions} value={artist} onSelect={pickArtist} />
                </div>
              )}
              <div className="songspot-difficulty-tabs">
                {DIFFICULTY_OPTIONS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className="songspot-difficulty-tab"
                    aria-pressed={difficulty === d.id}
                    style={{ "--tab-color": THEMES[d.id].accent, "--tab-text": THEMES[d.id].accentText, "--tab-on": THEMES[d.id].accentOn } as React.CSSProperties}
                    onClick={() => pickDifficulty(d.id)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <div className="songspot-timeline-wrap">
                <div
                  className="songspot-progress-track"
                  role="progressbar"
                  aria-label="Playback"
                  aria-valuemin={0}
                  aria-valuemax={round?.clipSeconds ?? 0.1}
                  aria-valuenow={Math.round(player.progress * (round?.clipSeconds ?? 0.1) * 10) / 10}
                  data-playback-progress={Math.round(player.progress * 100)}
                  style={{ "--playback-progress": playbackProgress } as React.CSSProperties}
                >
                  {STAGE_WEIGHTS.map((w, i) => (
                    <span key={w} className={i <= stage ? "songspot-progress-segment is-active" : "songspot-progress-segment"} style={{ flex: w }} />
                  ))}
                  <span className="songspot-playback-progress" aria-hidden="true" />
                </div>
                <span className="songspot-timeline-marker" aria-hidden="true" />
                <span className="songspot-timeline-label">{clipLabel}</span>
              </div>

              {revealed && reveal && outcome ? (
                <RevealCard reveal={reveal} outcome={outcome} rankLabel={rankLabel} onNext={next} onShare={openTicket} />
              ) : (
                <>
                  <div className="songspot-play-area">
                    <button
                      type="button"
                      className="songspot-play-key"
                      aria-label={`${player.state === "playing" ? "Pause" : "Play"} ${clipLabel}`}
                      aria-pressed={player.state === "playing"}
                      aria-busy={starting}
                      data-audio-state={player.state}
                      data-play-starting={starting ? "true" : "false"}
                      data-playback-measured-ms={player.lastPlayback ? Math.round(player.lastPlayback.measuredSeconds * 1000) : undefined}
                      data-playback-scheduled-ms={player.lastPlayback ? Math.round(player.lastPlayback.scheduledSeconds * 1000) : undefined}
                      disabled={playDisabled}
                      onClick={togglePlay}
                    >
                      <span className="songspot-play-ripple" aria-hidden="true" />
                      {starting ? <span className="songspot-loader" /> : player.state === "playing" ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    <span className="songspot-play-stage">{clipLabel}</span>
                    <div className={`songspot-game-status is-${status}`} role="status">
                      <span>
                        {statusText}
                        {status === "incorrect" && incorrectLabel ? ` · ${incorrectLabel}` : ""}
                      </span>
                      {recoverable ? (
                        <button type="button" className="songspot-recovery" onClick={recover}>
                          {noTracks ? "Reroll all" : noPreview || roundError ? "Next" : "Retry"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <div className="songspot-search-bar">
                    <label className="songspot-search-field">
                      <SearchIcon />
                      <input
                        ref={inputRef}
                        value={query}
                        placeholder="Name that track"
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded={suggestionsOpen}
                        aria-controls="songspot-suggestions"
                        aria-activedescendant={suggestionsOpen && suggestions[activeIndex] ? `songspot-suggestion-${suggestions[activeIndex].id}` : undefined}
                        disabled={!round || submitting}
                        autoComplete="off"
                        spellCheck={false}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        onKeyDown={onKeyDown}
                      />
                    </label>
                    <button type="button" className="songspot-search-action" disabled={!round || submitting} onClick={() => void skip()}>
                      <SkipIcon />
                      Skip
                    </button>
                    {suggestionsOpen ? (
                      <div id="songspot-suggestions">
                        <Suggestions suggestions={suggestions} activeIndex={activeIndex} loading={searching && suggestions.length === 0} emptyLabel="No matching tracks" loadingLabel="Searching suggestions" onSelect={(s) => void submitGuess(s)} />
                      </div>
                    ) : null}
                  </div>
                  {source === "spotify" && spotify.me?.connected && !collection && (
                    <div className="songspot-taste-banner">
                      {spotifyAvatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={spotifyAvatar} alt="" />
                      ) : null}
                      <span>Playing {spotifyName}&apos;s Spotify taste</span>
                      {spotify.me.poolSize ? <small>{spotify.me.poolSize} songs</small> : null}
                    </div>
                  )}
                  {mode === "daily" && round?.date ? <p className="songspot-daily-note">Same song for everyone · {round.date}</p> : null}
                </>
              )}
            </div>
          </div>
        </section>

        <div className="songspot-control-rail">{controlPanel}</div>
      </div>

      {mobileOpen ? (
        <div className="songspot-mobile-layer" role="dialog" aria-modal="true">
          <button type="button" className="songspot-mobile-backdrop" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
          <div className="songspot-mobile-sheet">
            <button type="button" className="songspot-mobile-close" aria-label="Close menu" onClick={() => setMobileOpen(false)}>
              ×
            </button>
            <DifficultySidebar activeId={difficulty} onSelect={pickDifficulty} onReroll={reroll} />
            {controlPanel}
          </div>
        </div>
      ) : null}

      <ShareTicket result={ticket} onClose={() => setTicket(null)} />
    </section>
  );
}
