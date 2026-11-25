"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";

type SizeChartRow = { size: string; chest_cm: number | null; waist_cm: number | null; hip_cm: number | null };

export default function SizeFinder({
  productId,
  gender,
  group = "upper",
  onApplySize,
}: {
  productId: number;
  gender: "men" | "women";
  group?: "upper" | "lower" | "dress";
  onApplySize: (size: string) => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [recommended, setRecommended] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [chart, setChart] = useState<SizeChartRow[]>([]);
  const [height, setHeight] = useState("172");
  const [chest, setChest] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) {
      setRecommended(null);
      return;
    }
    api<{ size: string | null; reason: string }>(`/api/size-recommendation?product_id=${productId}`)
      .then((r) => {
        setRecommended(r.size);
        setReason(r.reason);
      })
      .catch(() => {});
  }, [user, productId]);

  useEffect(() => {
    if (!open) return;
    api<SizeChartRow[]>(`/api/size-chart?gender=${gender}&group=${group}`)
      .then(setChart)
      .catch(() => {});
  }, [open, gender, group]);

  const saveMeasurements = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent || !user) return;
    setBusy(true);
    try {
      await api("/api/measurements", {
        method: "POST",
        body: JSON.stringify({
          height_cm: Number(height),
          chest_cm: chest ? Number(chest) : null,
          waist_cm: waist ? Number(waist) : null,
          hip_cm: hip ? Number(hip) : null,
          consent: true,
        }),
      });
      const r = await api<{ size: string | null; reason: string }>(`/api/size-recommendation?product_id=${productId}`);
      setRecommended(r.size);
      setReason(r.reason);
      if (r.size) onApplySize(r.size);
    } finally {
      setBusy(false);
    }
  };

  const deleteMeasurements = async () => {
    await api("/api/measurements", { method: "DELETE" });
    setRecommended(null);
    setReason("Measurements deleted.");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-2.5 py-1.5 text-[11px] font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        {recommended ? `Recommended: ${recommended}` : "Find my size"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Size recommendation and chart"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 dark:text-neutral-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">Find my size (optional)</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Close size finder" className="p-1 text-neutral-500">
                ✕
              </button>
            </div>

            {recommended && (
              <div className="mb-4 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200">
                <strong>Recommended size (estimate): {recommended}</strong>
                {reason && <p className="mt-0.5">{reason}</p>}
              </div>
            )}

            {user ? (
              <form onSubmit={saveMeasurements} className="space-y-3 text-xs mb-5">
                <p className="text-neutral-500">
                  Measure around the fullest part of your chest, natural waist, and hips in cm. Optional—delete anytime.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <label>
                    Height (cm) *
                    <input type="number" required min={120} max={230} value={height} onChange={(e) => setHeight(e.target.value)} className="mt-1 w-full rounded border px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800" />
                  </label>
                  <label>
                    Chest (cm)
                    <input type="number" min={60} max={160} value={chest} onChange={(e) => setChest(e.target.value)} className="mt-1 w-full rounded border px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800" />
                  </label>
                  <label>
                    Waist (cm)
                    <input type="number" min={50} max={150} value={waist} onChange={(e) => setWaist(e.target.value)} className="mt-1 w-full rounded border px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800" />
                  </label>
                  <label>
                    Hips (cm)
                    <input type="number" min={60} max={165} value={hip} onChange={(e) => setHip(e.target.value)} className="mt-1 w-full rounded border px-2 py-1.5 dark:border-neutral-700 dark:bg-neutral-800" />
                  </label>
                </div>
                <label className="flex items-start gap-2">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5" />
                  <span>I consent to saving my measurements for size recommendations.</span>
                </label>
                <div className="flex gap-2">
                  <button type="submit" disabled={!consent || busy} className="rounded-lg bg-black px-3 py-2 font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-black">
                    {busy ? "Saving…" : "Calculate size"}
                  </button>
                  <button type="button" onClick={deleteMeasurements} className="ml-auto text-rose-600 underline">
                    Delete measurements
                  </button>
                </div>
              </form>
            ) : (
              <p className="mb-4 text-xs text-neutral-500">Sign in to save measurements and get a personalized size recommendation.</p>
            )}

            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Size chart ({gender} · {group})
            </h3>
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b dark:border-neutral-800">
                  <th className="py-1">Size</th>
                  <th className="py-1">Chest (cm)</th>
                  <th className="py-1">Waist (cm)</th>
                  <th className="py-1">Hips (cm)</th>
                </tr>
              </thead>
              <tbody>
                {chart.map((r) => (
                  <tr key={r.size} className="border-b dark:border-neutral-800/60">
                    <td className="py-1 font-semibold">{r.size}</td>
                    <td className="py-1">{r.chest_cm ?? "—"}</td>
                    <td className="py-1">{r.waist_cm ?? "—"}</td>
                    <td className="py-1">{r.hip_cm ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
