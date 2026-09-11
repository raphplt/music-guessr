"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ChevronDown, LogOut, Menu, X } from "lucide-react";
import { useSpotify } from "./SpotifyProvider";
import { SpotifyIcon } from "@/components/game/icons";

export type QuizLink = { href: string; label: string };
export type QuizGroups = { genres: QuizLink[]; decades: QuizLink[]; artists: QuizLink[] };

const NAV = [
  { href: "/", label: "Play" },
  { href: "/music-quizzes", label: "Music Quizzes", menu: true },
  { href: "/daily", label: "Daily Challenge" },
];

function SpotifyAccount({ className }: { className?: string }) {
  const spotify = useSpotify();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!spotify.configured && !spotify.loading) {
    return (
      <button type="button" className={`songspot-language-trigger songspot-header-locale ${className ?? ""}`} title="Add SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET to .env.local" aria-disabled="true">
        <span className="songspot-spotify-glyph">
          <SpotifyIcon />
        </span>
        <span>Spotify</span>
      </button>
    );
  }

  if (!spotify.me?.connected) {
    return (
      <button type="button" className={`songspot-language-trigger songspot-header-locale ${className ?? ""}`} onClick={spotify.login} aria-label="Connect Spotify">
        <span className="songspot-spotify-glyph">
          <SpotifyIcon />
        </span>
        <span>Connect Spotify</span>
      </button>
    );
  }

  const { profile } = spotify.me;
  return (
    <div className={`songspot-site-account ${className ?? ""}`} ref={ref}>
      <button
        type="button"
        className="songspot-language-trigger songspot-header-locale"
        data-connected="true"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Spotify account"
        onClick={() => setOpen((o) => !o)}
      >
        {profile.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="songspot-account-avatar" src={profile.image} alt="" />
        ) : (
          <span className="songspot-spotify-glyph">
            <SpotifyIcon />
          </span>
        )}
        <span>{profile.displayName}</span>
        <ChevronDown className="songspot-language-chevron" size={16} aria-hidden="true" />
      </button>
      {open ? (
        <div className="songspot-language-menu songspot-account-menu" role="menu">
          <p className="songspot-language-heading">Connected to Spotify</p>
          <div className="songspot-language-option" role="presentation">
            {profile.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.image} alt="" />
            ) : null}
            <span>
              {profile.displayName}
              <small>
                {spotify.me.artists.length} top artists imported{profile.product ? ` · ${profile.product}` : ""}
              </small>
            </span>
          </div>
          <button
            type="button"
            className="songspot-language-option"
            role="menuitem"
            onClick={async () => {
              await spotify.disconnect();
              setOpen(false);
            }}
          >
            <LogOut size={16} aria-hidden="true" />
            Disconnect
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function SiteHeader({ quizGroups, overlay = true }: { quizGroups: QuizGroups; overlay?: boolean }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        setDrawerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const isCurrent = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const groups = (
    <>
      <div>
        <p>Genres</p>
        {quizGroups.genres.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
      </div>
      <div>
        <p>Decades</p>
        {quizGroups.decades.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
      </div>
      <div>
        <p>Artists</p>
        {quizGroups.artists.map((l) => (
          <Link key={l.href} href={l.href}>
            {l.label}
          </Link>
        ))}
      </div>
    </>
  );

  return (
    <header className="songspot-site-header" data-overlay={overlay ? "true" : "false"} data-scrolled={scrolled ? "true" : "false"}>
      <div className="songspot-site-header-inner">
        <Link aria-label="Songspot — Play" className="songspot-site-brand" href="/" aria-current={pathname === "/" ? "page" : undefined}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" width={32} height={32} />
          <span>Songspot</span>
        </Link>
        <nav className="songspot-site-desktop-nav" aria-label="Songspot navigation">
          {NAV.map((item) =>
            item.menu ? (
              <div key={item.href} className="songspot-site-quiz-menu" data-open={menuOpen ? "true" : "false"} ref={menuRef}>
                <div className="songspot-site-quiz-trigger">
                  <Link href={item.href} className="songspot-site-nav-link" aria-current={isCurrent(item.href) ? "page" : undefined}>
                    {item.label}
                  </Link>
                  <button type="button" aria-label="Open music quiz menu" aria-expanded={menuOpen} aria-controls="songspot-quiz-menu" onClick={() => setMenuOpen((o) => !o)}>
                    <ChevronDown aria-hidden="true" />
                  </button>
                </div>
                <div id="songspot-quiz-menu" className="songspot-site-quiz-panel" data-mode="clips" data-open={menuOpen ? "true" : "false"} aria-hidden={!menuOpen} inert={!menuOpen}>
                  <div className="songspot-menu-mode">
                    <span className="songspot-menu-mode-badge">CLIP CHALLENGE</span>
                    <p className="songspot-menu-mode-title">Name that song.</p>
                    <p className="songspot-menu-mode-description">
                      <span>Start with 0.1 seconds.</span>
                      <span>Search the title to answer.</span>
                    </p>
                    <div className="songspot-menu-demo" aria-hidden="true">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img className="songspot-menu-waveform" src="/images/navigation/clip-waveform.png" alt="" width={300} height={60} loading="lazy" />
                      <div className="songspot-menu-stages">
                        {["0.1s", "0.5s", "2s", "8s", "15s"].map((s, i) => (
                          <span key={s} data-selected={i === 0 ? "true" : undefined}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Link href="/#songspot-game" className="songspot-menu-play" onClick={() => setMenuOpen(false)}>
                      <span>Back to game</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  </div>
                  <div className="songspot-site-quiz-directory">
                    <div className="songspot-site-quiz-groups">{groups}</div>
                    <Link href="/music-quizzes" className="songspot-site-browse-all">
                      Browse all clip quizzes
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <Link key={item.href} href={item.href} className="songspot-site-nav-link" aria-current={isCurrent(item.href) ? "page" : undefined}>
                {item.label}
              </Link>
            ),
          )}
        </nav>
        <div className="songspot-site-header-actions">
          <div className="songspot-site-locale songspot-site-account-desktop">
            <SpotifyAccount />
          </div>
          <button type="button" className="songspot-site-mobile-trigger" aria-label={drawerOpen ? "Close navigation menu" : "Open navigation menu"} aria-expanded={drawerOpen} aria-controls="songspot-mobile-navigation" onClick={() => setDrawerOpen((o) => !o)}>
            {drawerOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>
      <button type="button" className="songspot-site-mobile-backdrop" data-open={drawerOpen ? "true" : "false"} aria-label="Close navigation menu" tabIndex={-1} onClick={() => setDrawerOpen(false)} />
      <div id="songspot-mobile-navigation" className="songspot-site-mobile-drawer" data-open={drawerOpen ? "true" : "false"} aria-hidden={!drawerOpen} inert={!drawerOpen}>
        <nav aria-label="Songspot navigation">
          <div className="songspot-site-mobile-primary">
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} aria-current={isCurrent(item.href) ? "page" : undefined}>
                {item.label}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            ))}
          </div>
          <details className="songspot-site-mobile-topics" data-mode="clips">
            <summary>
              Music quiz topics
              <ChevronDown size={18} aria-hidden="true" />
            </summary>
            <div className="songspot-site-mobile-quiz-groups">
              <div>
                <p>Genres</p>
                <div>
                  {quizGroups.genres.map((l) => (
                    <Link key={l.href} href={l.href}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p>Decades</p>
                <div>
                  {quizGroups.decades.map((l) => (
                    <Link key={l.href} href={l.href}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div>
                <p>Artists</p>
                <div>
                  {quizGroups.artists.map((l) => (
                    <Link key={l.href} href={l.href}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link href="/music-quizzes" className="songspot-site-browse-all">
              Browse all clip quizzes
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </details>
          <Link className="songspot-site-mobile-how" href="/#how-to-play">
            How to play
          </Link>
        </nav>
        <div className="songspot-site-mobile-locale songspot-site-mobile-account">
          <SpotifyAccount />
        </div>
      </div>
    </header>
  );
}
