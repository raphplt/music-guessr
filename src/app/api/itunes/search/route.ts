import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const term = request.nextUrl.searchParams.get("term");
  const limit = request.nextUrl.searchParams.get("limit") ?? "25";

  if (!term) {
    return NextResponse.json({ error: "Missing term" }, { status: 400 });
  }

  const params = new URLSearchParams({
    term,
    media: "music",
    entity: "song",
    limit,
  });

  const res = await fetch(`https://itunes.apple.com/search?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "iTunes lookup failed" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
