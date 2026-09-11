import { applySkip, openRound } from "@/lib/game";
import { ok, fail } from "../_shared";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { roundToken?: string } | null;
  const round = openRound(body?.roundToken);
  if (!round) return fail("This round has expired or is no longer active", 410);
  const result = applySkip(round);
  if ("error" in result) return fail(result.error, 410);
  return ok(result);
}
