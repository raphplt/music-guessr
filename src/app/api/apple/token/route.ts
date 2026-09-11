import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET() {
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_MUSICKIT_PRIVATE_KEY;

  if (!teamId || !keyId || !privateKey) {
    return NextResponse.json(
      { error: "Apple Music non configure sur ce serveur" },
      { status: 503 }
    );
  }

  const token = jwt.sign({}, privateKey.replace(/\\n/g, "\n"), {
    algorithm: "ES256",
    expiresIn: "12h",
    issuer: teamId,
    header: { alg: "ES256", kid: keyId },
  });

  return NextResponse.json({ token });
}
