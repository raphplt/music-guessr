"use client";

import dynamic from "next/dynamic";
import { PageLoading } from "@/components/PageLoading";

const HistoryContent = dynamic(
  () => import("@/components/HistoryContent").then((m) => m.HistoryContent),
  { ssr: false, loading: () => <PageLoading /> }
);

export default function HistoryPage() {
  return <HistoryContent />;
}
