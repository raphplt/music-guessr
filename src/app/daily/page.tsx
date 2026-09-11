"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { PageLoading } from "@/components/PageLoading";

const DailyBoard = dynamic(() => import("@/components/DailyBoard").then((m) => m.DailyBoard), {
  ssr: false,
  loading: () => <PageLoading />,
});

export default function DailyPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-10">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-300">
        &larr; Accueil
      </Link>
      <DailyBoard />
    </main>
  );
}
