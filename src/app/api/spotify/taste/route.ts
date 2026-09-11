import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchSpotifyTaste } from "@/lib/spotify";

export async function GET() {
  const session = await auth();

  if (!session?.accessToken) {
    return NextResponse.json({ error: "Not connected to Spotify" }, { status: 401 });
  }

  try {
    const taste = await fetchSpotifyTaste(session.accessToken);
    return NextResponse.json(taste);
  } catch {
    return NextResponse.json({ error: "Spotify request failed" }, { status: 502 });
  }
}
