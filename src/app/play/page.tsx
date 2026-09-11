"use client";

import Link from "next/link";
import { GameBoard } from "@/components/GameBoard";

export default function PlayPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
        &larr; Reglages
      </Link>
      <GameBoard />
    </main>
  );
}
