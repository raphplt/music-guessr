"use client";

import dynamic from "next/dynamic";
import { PageLoading } from "@/components/PageLoading";

const HomeContent = dynamic(
  () => import("@/components/HomeContent").then((m) => m.HomeContent),
  { ssr: false, loading: () => <PageLoading /> }
);

export default function Page() {
  return <HomeContent />;
}
