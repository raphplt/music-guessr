import type { DailyResult } from "@/store/dailyStore";

export function buildShareText(result: DailyResult, challengeNumber: number): string {
  const squares = result.attempts
    .map((a) => (a.correct ? "\u{1F7E9}" : "\u{1F7E5}"))
    .join("");
  const score = result.won ? `${result.attempts.length}/6` : "X/6";
  return `Vinyl - Defi #${challengeNumber}\n${squares}\n${score}`;
}
