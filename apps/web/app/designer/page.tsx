"use client";
import dynamic from "next/dynamic";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDesigner } from "@/store/designer";
import { GARMENTS } from "@/lib/garments";
import { api } from "@/lib/api";
import Link from "next/link";
import Image from "next/image";
import PieceStrip from "@/components/PieceStrip";
import VariantPicker from "@/components/VariantPicker";
import SettingsPanel from "@/components/SettingsPanel";
import ActionBar from "@/components/ActionBar";

// 3D viewer and 2D editor are client-only (they use DOM APIs)
const GarmentViewer = dynamic(() => import("@/components/GarmentViewer"), { ssr: false });
const PanelEditor = dynamic(() => import("@/components/PanelEditor"), { ssr: false });

function DesignerShell() {
  const params = useSearchParams();
  const { garment, setGarment, load, resetAll } = useDesigner();
  const router = useRouter();

  // On mount: load garment from ?g= and optionally a saved design from ?d=
  useEffect(() => {
    const slug = params.get("g") ?? GARMENTS[0].slug;
    setGarment(slug);
    const shareToken = params.get("d");
    if (shareToken) {
      api<{ garmentSlug: string; design: { panels: Record<string, { fill: string; fabric: string; layers: unknown[] }>; variants: Record<string, string> }; priceCents: number }>(`/api/designs/${shareToken}`)
        .then((res) => load(res.garmentSlug, res.design as Parameters<typeof load>[1]))
        .catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const menGarments = GARMENTS.filter((g) => g.gender === "men");
  const womenGarments = GARMENTS.filter((g) => g.gender === "women");

  const handleGarmentChange = (slug: string) => {
    setGarment(slug);
    router.replace(`/designer?g=${slug}`);
  };

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50">
      {/* Top bar */}
      <header className="flex flex-wrap items-center gap-3 border-b bg-white px-4 py-2 shadow-sm">
        <Link href="/" className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-black">
          <div className="relative size-7">
            <Image src="/branding/zavero-icon-512.png" alt="ZAVÉRO" fill className="object-contain" />
          </div>
          <span className="text-sm font-bold tracking-widest uppercase">ZAVÉRO</span>
        </Link>

        <span className="text-neutral-300">|</span>

        {/* Gender + garment selector */}
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="garment-select">Select garment</label>
          <select
            id="garment-select"
            value={garment.slug}
            onChange={(e) => handleGarmentChange(e.target.value)}
            className="rounded border px-2 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >
            <optgroup label="Men">
              {menGarments.map((g) => <option key={g.slug} value={g.slug}>{g.name}</option>)}
            </optgroup>
            <optgroup label="Women">
              {womenGarments.map((g) => <option key={g.slug} value={g.slug}>{g.name}</option>)}
            </optgroup>
          </select>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button onClick={() => resetAll()} className="rounded border px-2 py-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-black">Reset all</button>
          <button
            onClick={() => {
              // Access the OrbitControls via the makeDefault ref stored by R3F
              // We use a custom event since the controls live inside the Canvas subtree
              window.dispatchEvent(new CustomEvent("zavero:resetview"));
            }}
            className="rounded border px-2 py-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
          >Reset view</button>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden">
        {/* Left: 3D viewer + piece strip + 2D editor */}
        <main className="flex flex-1 flex-col min-w-0">
          {/* 3D viewer */}
          <div className="relative h-[55vh] md:h-[55%] bg-neutral-100">
            <GarmentViewer />
          </div>

          {/* Piece strip */}
          <div className="border-t bg-white">
            <PieceStrip />
          </div>

          {/* 2D flat editor */}
          <div className="flex-1 overflow-auto p-4 border-t bg-neutral-50">
            <PanelEditor />
          </div>
        </main>

        {/* Right sidebar: variant picker + settings */}
        <aside className="w-full md:w-80 border-t md:border-t-0 md:border-l bg-white overflow-y-auto p-4 space-y-6 pb-24 md:pb-6">
          <section aria-label="Style options">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Style options</h2>
            <VariantPicker />
          </section>
          <section aria-label="Piece settings">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">Piece settings</h2>
            <SettingsPanel />
          </section>
        </aside>
      </div>

      {/* Fixed action bar */}
      <ActionBar />
    </div>
  );
}

export default function DesignerPage() {
  return (
    <DesignerShell />
  );
}
