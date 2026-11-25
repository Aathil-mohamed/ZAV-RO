"use client";
import { useState } from "react";
import { useDesigner } from "@/store/designer";
import { estimatePriceCents } from "@/lib/garments";
import { viewerApi } from "@/lib/viewerApi";
import { api } from "@/lib/api";
import { useCart } from "@/store/cart";
import { formatMoney } from "@/lib/money";
import TryOnDialog from "./TryOnDialog";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
type Size = (typeof SIZES)[number];

function categoryForSlug(slug: string): "upper" | "lower" | "dress" {
  if (slug.includes("dress") || slug.includes("gown") || slug.includes("jumpsuit")) return "dress";
  if (slug.includes("trouser") || slug.includes("skirt") || slug.includes("shorts")) return "lower";
  return "upper";
}

export default function ActionBar() {
  const { garment, panels, variants, resetAll } = useDesigner();
  const addToCart = useCart((s) => s.add);
  const [size, setSize] = useState<Size>("M");
  const [busy, setBusy] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [tryOnOpen, setTryOnOpen] = useState(false);
  const [tryOnGarmentUrl, setTryOnGarmentUrl] = useState<string | undefined>(undefined);

  const displayPrice = estimatePriceCents(garment, panels, variants);

  const saveAndAdd = async () => {
    setBusy(true);
    try {
      const preview = viewerApi.capture?.(false) ?? null;
      const saved = await api<{ id: number; priceCents: number; shareToken: string; previewUrl: string | null }>("/api/designs", {
        method: "POST",
        body: JSON.stringify({ garment_slug: garment.slug, size, design: { panels, variants }, preview_png: preview }),
      });
      setShareUrl(`${window.location.origin}/designer?d=${saved.shareToken}`);
      addToCart({
        name: `Custom ${garment.name}`,
        image: saved.previewUrl ?? "/branding/zavero-icon-192.png",
        priceCents: saved.priceCents,
        customDesignId: saved.id,
        size,
      });
    } catch (err) {
      alert("Could not save design. Is the API running?");
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const downloadPreview = () => {
    const url = viewerApi.capture?.(true);
    if (!url) return;
    const a = document.createElement("a"); a.href = url; a.download = `${garment.slug}-preview.png`; a.click();
  };

  const copyShare = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    alert("Share link copied!");
  };

  const startTryOn = async () => {
    const dataUrl = viewerApi.capture?.(true);
    if (!dataUrl) {
      alert("3D preview is still loading.");
      return;
    }
    setBusy(true);
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const fd = new FormData();
      fd.append("file", new File([blob], `${garment.slug}.png`, { type: "image/png" }));
      const { url } = await api<{ url: string }>("/api/uploads", { method: "POST", body: fd });
      setTryOnGarmentUrl(url);
      setTryOnOpen(true);
    } catch (err) {
      alert("Could not prepare garment preview for try-on.");
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="fixed bottom-0 inset-x-0 z-20 flex flex-wrap items-center gap-3 border-t bg-white px-4 py-3 shadow-lg md:static md:border-0 md:shadow-none md:bg-transparent">
        <div className="text-lg font-bold">{formatMoney(displayPrice)}<span className="ml-1 text-xs font-normal text-neutral-500">(estimate)</span></div>

        <label className="flex items-center gap-1 text-sm">
          Size
          <select value={size} onChange={(e) => setSize(e.target.value as Size)} className="ml-1 rounded border px-2 py-1" aria-label="Size">
            {SIZES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>

        <button onClick={saveAndAdd} disabled={busy}
          className="rounded bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-black">
          {busy ? "Saving…" : "Add to bag"}
        </button>

        {shareUrl && (
          <button onClick={copyShare} className="rounded border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-black">
            Copy share link
          </button>
        )}
        {!shareUrl && (
          <button onClick={saveAndAdd} disabled={busy}
            className="rounded border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-black">
            Save design
          </button>
        )}

        <button onClick={downloadPreview} className="rounded border px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-black">
          Download PNG
        </button>

        <button onClick={startTryOn} disabled={busy}
          className="rounded border border-black px-3 py-2 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-black">
          Try on me
        </button>

        <button onClick={resetAll} className="ml-auto text-xs text-neutral-500 underline focus:outline-none focus-visible:ring-2 focus-visible:ring-black">
          Reset all
        </button>
      </div>

      <TryOnDialog
        open={tryOnOpen}
        onClose={() => setTryOnOpen(false)}
        mode="single"
        garmentName={`Custom ${garment.name}`}
        garmentUrl={tryOnGarmentUrl}
        category={categoryForSlug(garment.slug)}
        onAddToBag={saveAndAdd}
      />
    </>
  );
}
