# music-guessr

A from-scratch reproduction of the **songspot.co** "guess the song from a 0.1-second clip" game — same mechanics, same layout, same five difficulty tiers — plus two things the original doesn't have:

- **Spotify sign-in** that imports your top artists/tracks and lets you play rounds built from your own taste (your favourite artists also show up in the Artists reel).
- A **playback toggle**: start every clue from the beginning of the track (like the original) or from a random moment.

Personal, non-commercial project.

## How the game works

| Stage | Clip length | Points if solved |
| ----- | ----------- | ---------------- |
| 1     | 0.1 s       | 1000             |
| 2     | 0.5 s       | 800              |
| 3     | 2 s         | 600              |
| 4     | 8 s         | 400              |
| 5     | 15 s        | 200              |

Press **Play** to hear the current clue, type a title and pick it from the suggestions. A wrong answer or **Skip** unlocks the next, longer clip. After the 15-second clip the track is revealed. Filters (genre / era / artist), difficulty and the "Reroll all" button work exactly like the original; changed filters apply to the next round.

**Difficulty** is derived from how famous a track is: a curated artist tier (1 = megastar … 4 = niche) combined with the track's position in the artist's Deezer top-tracks list.

## Audio: which player and why

Clues are cut from the official **30-second previews of the iTunes Search API** (free, no key, ~10k tracks in the shipped catalogue) and played through the **Web Audio API**: the preview is decoded once into an `AudioBuffer` and scheduled with `source.start(when, offset, duration)`, which is sample-accurate — an `<audio>` element cannot reliably stop after 100 ms. The preview is streamed through `/api/audio`, authenticated by a sealed round token, so the answer never reaches the browser before the reveal.

Spotify itself is not used for audio: its Web API no longer returns preview URLs for new apps (since Nov 2024) and its Web Playback SDK requires Premium. Spotify is used for *identity and taste* only.

## Getting started

```bash
npm install
cp .env.example .env.local   # then edit
npm run dev                  # http://127.0.0.1:3000
```

`.env.local`:

```
APP_SECRET=<any long random string>        # seals round tokens + session cookie
SPOTIFY_CLIENT_ID=...                       # optional — enables "Connect Spotify"
SPOTIFY_CLIENT_SECRET=...
```

To enable Spotify: create an app on <https://developer.spotify.com/dashboard>, add the redirect URI `http://127.0.0.1:3000/api/spotify/callback` (Spotify no longer accepts `localhost`), and open the site through `127.0.0.1`, not `localhost`. Without credentials the game runs on the full catalogue and the Spotify buttons are shown disabled.

## Catalogue

`src/data/catalogue.json` is generated — it ships in the repo so the game works out of the box.

```bash
npm run build:catalogue      # fetch ~600 artists from the iTunes Search API (10-20 min, rate-limited)
npm run build:catalogue -- --resume   # keep artists already fetched
npm run enrich:catalogue     # re-rank tracks with Deezer top-tracks popularity → better difficulty tiers
npm run normalize:catalogue  # re-derive genre / era / difficulty after tweaking the heuristics
```

The artist roster (with tiers and the artists featured in the in-game reel) lives in `src/data/artists.ts`.

## Routes

- `/` — the game + landing sections
- `/daily` — one deterministic track per UTC day, the same for everyone
- `/music-quizzes` and `/music-quizzes/<slug>` — focused rounds by genre, decade or artist
- `/api/round`, `/api/guess`, `/api/skip`, `/api/search`, `/api/audio`, `/api/filters` — game API
- `/api/spotify/login|callback|logout|me` — OAuth (Authorization Code + PKCE) and taste import

## Stack

Next.js 16 (App Router, route handlers), React 19, TypeScript, plain CSS ported from the original stylesheet, `lucide-react` icons, no database (rounds are AES-GCM sealed tokens; "seen" tracks live in `sessionStorage`).

## Scripts

`npm run dev` · `npm run build` · `npm run start` · `npm run lint` · `npm run typecheck`
