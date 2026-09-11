"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getJson, postJson, type SpotifyMe } from "@/lib/client-api";

type Ctx = {
  me: SpotifyMe | null;
  loading: boolean;
  connected: boolean;
  configured: boolean;
  refresh: (withPool?: boolean) => Promise<void>;
  disconnect: () => Promise<void>;
  login: () => void;
};

const SpotifyContext = createContext<Ctx>({
  me: null,
  loading: true,
  connected: false,
  configured: false,
  refresh: async () => {},
  disconnect: async () => {},
  login: () => {},
});

export function SpotifyProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<SpotifyMe | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async (withPool = false) => {
    try {
      const data = await getJson<SpotifyMe>(`/api/spotify/me${withPool ? "?pool=1" : ""}`);
      setMe(data);
    } catch {
      setMe({ configured: false, connected: false });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const disconnect = useCallback(async () => {
    await postJson("/api/spotify/logout", {});
    setMe((m) => ({ configured: m?.configured ?? false, connected: false }));
  }, []);

  const login = useCallback(() => {
    // Route handler (OAuth redirect), not a Next.js page.
    window.location.assign(new URL("/api/spotify/login", window.location.origin).toString());
  }, []);

  const value = useMemo<Ctx>(
    () => ({ me, loading, connected: !!me?.connected, configured: !!me?.configured, refresh, disconnect, login }),
    [me, loading, refresh, disconnect, login],
  );
  return <SpotifyContext.Provider value={value}>{children}</SpotifyContext.Provider>;
}

export function useSpotify() {
  return useContext(SpotifyContext);
}
