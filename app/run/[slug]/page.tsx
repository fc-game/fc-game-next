"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { loadRomBySlug } from "@/lib/loadRom";
import Emulator from "@/components/Emulator";

export default function RunPage() {
  const { slug } = useParams<{ slug: string }>();
  const [romData, setRomData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    let cancelled = false;

    loadRomBySlug(slug)
      .then((data: any) => {
        if (!cancelled) setRomData(data);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (error) {
    return <div className="error">Failed to load ROM: {error}</div>;
  }

  if (!romData) {
    return <div className="loading">Loading ROM...</div>;
  }

  return <Emulator romData={romData} />;
}
