import { applyGuess, openRound } from "@/lib/game";
import { ok, fail } from "../_shared";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { roundToken?: string; candidateTrackId?: string } | null;
  const round = openRound(body?.roundToken);
  if (!round) return fail("This round has expired or is no longer active", 410);
  if (!body?.candidateTrackId) return fail("Missing candidate");
  const result = applyGuess(round, String(body.candidateTrackId));
  if ("error" in result) return fail(result.error, 410);
  return ok(result);
}
