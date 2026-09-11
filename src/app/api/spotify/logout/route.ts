import { clearSession } from "@/lib/spotify";
import { ok } from "../../_shared";

export async function POST() {
  await clearSession();
  return ok({ connected: false });
}
