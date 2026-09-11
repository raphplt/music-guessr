"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { signIn, signOut, useSession } from "next-auth/react";
import { useSettingsStore } from "@/store/settingsStore";

// Apple Music necessite un compte Apple Developer Program (payant) non disponible
// pour le moment : le bloc reste implemente mais masque tant que ce n'est pas configure.
const SHOW_APPLE_MUSIC = false;

export function ConnectPanel() {
  const { data: session } = useSession();
  const setSpotifyTaste = useSettingsStore((s) => s.setSpotifyTaste);
  const spotifyConnected = useSettingsStore((s) => s.spotifyConnected);
  const spotifyArtists = useSettingsStore((s) => s.spotifyArtists);

  const [appleStatus, setAppleStatus] = useState<
    "idle" | "loading" | "connected" | "error" | "unavailable"
  >("idle");
  const [appleArtists, setAppleArtists] = useState<string[]>([]);
  const [musicKitReady, setMusicKitReady] = useState(false);

  useEffect(() => {
    if (!session?.accessToken || spotifyConnected) return;
    fetch("/api/spotify/taste")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSpotifyTaste(data.artists ?? [], data.genres ?? []);
      });
  }, [session?.accessToken, spotifyConnected, setSpotifyTaste]);

  async function connectAppleMusic() {
    if (!musicKitReady || !window.MusicKit) {
      setAppleStatus("unavailable");
      return;
    }
    setAppleStatus("loading");
    try {
      const tokenRes = await fetch("/api/apple/token");
      if (!tokenRes.ok) {
        setAppleStatus("unavailable");
        return;
      }
      const { token } = await tokenRes.json();
      const music = window.MusicKit.configure({
        developerToken: token,
        app: { name: "Vinyl", build: "1.0.0" },
      });
      const musicUserToken = await music.authorize();

      const tasteRes = await fetch("/api/apple/taste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ musicUserToken }),
      });
      if (!tasteRes.ok) {
        setAppleStatus("error");
        return;
      }
      const taste = await tasteRes.json();
      setAppleArtists(taste.artists ?? []);
      setAppleStatus("connected");
    } catch {
      setAppleStatus("error");
    }
  }

  return (
    <div className="space-y-3">
      {SHOW_APPLE_MUSIC && (
        <Script
          src="https://js-cdn.music.apple.com/musickit/v3/musickit.js"
          strategy="afterInteractive"
          onLoad={() => setMusicKitReady(true)}
        />
      )}

      <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
        <div>
          <div className="font-semibold">Spotify</div>
          <div className="text-xs text-zinc-500">
            {spotifyConnected
              ? `Connecte - ${spotifyArtists.length} artistes importes`
              : "Importe tes artistes favoris pour personnaliser le jeu"}
          </div>
        </div>
        {session ? (
          <button
            onClick={() => signOut()}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:border-zinc-600"
          >
            Deconnecter
          </button>
        ) : (
          <button
            onClick={() => signIn("spotify")}
            className="rounded-lg bg-[#1db954] px-3 py-1.5 text-sm font-semibold text-black hover:brightness-110"
          >
            Se connecter
          </button>
        )}
      </div>

      {SHOW_APPLE_MUSIC && (
        <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
          <div>
            <div className="font-semibold">Apple Music</div>
            <div className="text-xs text-zinc-500">
              {appleStatus === "connected" && `Connecte - ${appleArtists.length} artistes importes`}
              {appleStatus === "unavailable" &&
                "Non configure (APPLE_TEAM_ID / APPLE_KEY_ID / APPLE_MUSICKIT_PRIVATE_KEY manquants)"}
              {appleStatus === "error" && "Connexion echouee, reessaie"}
              {(appleStatus === "idle" || appleStatus === "loading") &&
                "Importe tes artistes favoris depuis Apple Music"}
            </div>
          </div>
          <button
            onClick={connectAppleMusic}
            disabled={appleStatus === "loading"}
            className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-300 hover:border-zinc-600 disabled:opacity-50"
          >
            {appleStatus === "loading" ? "..." : "Se connecter"}
          </button>
        </div>
      )}
    </div>
  );
}
