import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

function signDeveloperToken(): string | null {
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_MUSICKIT_PRIVATE_KEY;
  if (!teamId || !keyId || !privateKey) return null;

  return jwt.sign({}, privateKey.replace(/\\n/g, "\n"), {
    algorithm: "ES256",
    expiresIn: "1h",
    issuer: teamId,
    header: { alg: "ES256", kid: keyId },
  });
}

interface AppleHeavyRotationItem {
  attributes?: {
    name?: string;
    artistName?: string;
    genreNames?: string[];
  };
}

export async function POST(request: NextRequest) {
  const developerToken = signDeveloperToken();
  if (!developerToken) {
    return NextResponse.json(
      { error: "Apple Music non configure sur ce serveur" },
      { status: 503 }
    );
  }

  const { musicUserToken } = await request.json();
  if (!musicUserToken) {
    return NextResponse.json({ error: "Music user token manquant" }, { status: 400 });
  }

  const res = await fetch(
    "https://api.music.apple.com/v1/me/history/heavy-rotation?limit=20",
    {
      headers: {
        Authorization: `Bearer ${developerToken}`,
        "Music-User-Token": musicUserToken,
      },
    }
  );

  if (!res.ok) {
    return NextResponse.json({ error: "Requete Apple Music echouee" }, { status: 502 });
  }

  const data: { data: AppleHeavyRotationItem[] } = await res.json();
  const artists = new Set<string>();
  const genres = new Set<string>();
  for (const item of data.data ?? []) {
    if (item.attributes?.artistName) artists.add(item.attributes.artistName);
    for (const genre of item.attributes?.genreNames ?? []) genres.add(genre);
  }

  return NextResponse.json({
    artists: [...artists],
    genres: [...genres],
  });
}
