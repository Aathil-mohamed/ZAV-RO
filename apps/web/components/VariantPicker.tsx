"use client";
import { useDesigner } from "@/store/designer";

export default function VariantPicker() {
  const { garment, variants, setVariant } = useDesigner();
  return (
    <div className="space-y-3">
      {garment.variants.map((g) => (
        <div key={g.key}>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-neutral-500">{g.label}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={g.label}>
            {g.options.map((o) => {
              const on = (variants[g.key] ?? g.options[0].id) === o.id;
              return (<button key={o.id} role="radio" aria-checked={on} onClick={() => setVariant(g.key, o.id)}
                className={`rounded-full border px-3 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${on ? "bg-black text-white" : ""}`}>
                {o.label}{o.priceDeltaCents ? ` +$${(o.priceDeltaCents / 100).toFixed(0)}` : ""}</button>);
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
