import { NextRequest, NextResponse } from "next/server";

const ALLOWED_HOSTS = [/\.mzstatic\.com$/, /\.apple\.com$/, /\.itunes\.com$/];

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 });
  }

  const hostAllowed = ALLOWED_HOSTS.some((pattern) => pattern.test(parsed.hostname));
  if (parsed.protocol !== "https:" || !hostAllowed) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 403 });
  }

  const upstream = await fetch(parsed.toString());
  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 502 });
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": upstream.headers.get("content-type") ?? "audio/mpeg",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
