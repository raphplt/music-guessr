import { buildAuthorizeUrl, requestOrigin, setPkceCookie, spotifyConfigured } from "@/lib/spotify";

export async function GET(req: Request) {
  if (!spotifyConfigured()) {
    return new Response("Spotify is not configured. Set SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET in .env.local", { status: 503 });
  }
  const { url, pkce } = buildAuthorizeUrl(requestOrigin(req));
  await setPkceCookie(pkce);
  return Response.redirect(url, 302);
}
