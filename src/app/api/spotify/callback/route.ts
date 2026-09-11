import { exchangeCode, getTaste, readPkce, requestOrigin, writeSession } from "@/lib/spotify";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const origin = requestOrigin(req);
  const code = u.searchParams.get("code");
  const state = u.searchParams.get("state");
  const error = u.searchParams.get("error");
  const back = (q: string) => Response.redirect(`${origin}/?${q}`, 302);
  if (error) return back(`spotify=${encodeURIComponent(error)}`);
  const pkce = await readPkce();
  if (!code || !pkce || pkce.state !== state) return back("spotify=state_mismatch");
  try {
    const session = await exchangeCode(code, pkce.verifier, origin);
    const taste = await getTaste(session);
    await writeSession({ ...session, userId: taste.profile.id });
    return back("spotify=connected");
  } catch (e) {
    console.error(e);
    return back("spotify=exchange_failed");
  }
}
