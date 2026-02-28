"use client";

import dynamic from "next/dynamic";

const RunPageNext = dynamic(() => import("../../components/RunPageNext"), {
  ssr: false,
});

export default function RunOnlyClient({ slug }: { slug?: string }) {
  return <RunPageNext slug={slug} />;
}