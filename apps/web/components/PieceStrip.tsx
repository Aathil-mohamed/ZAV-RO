"use client";
import { useEffect, useRef } from "react";
import { useDesigner } from "@/store/designer";
import { renderPanel } from "@/lib/renderPanel";
import type { Panel } from "@/lib/garments";
import type { PanelDesign } from "@/store/designer";

function Thumb({ p, design, active, onSelect }: { p: Panel; design: PanelDesign; active: boolean; onSelect: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (ref.current) renderPanel(ref.current, p, design, { scale: 96 / p.size[0] }); }, [design, p]);
  return (
    <button role="option" aria-selected={active} onClick={onSelect}
      className={`shrink-0 rounded border p-1 text-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-black ${active ? "ring-2 ring-black" : ""}`}>
      <canvas ref={ref} className="block h-24 w-auto max-w-[120px]" aria-hidden="true" />
      <span className="block pt-1">{p.label.replace(" (left)", "")}</span>
    </button>
  );
}

export default function PieceStrip() {
  const { garment, panels, selectedPanel, selectPanel } = useDesigner();
  return (
    <div className="flex gap-3 overflow-x-auto p-2" role="listbox" aria-label="Garment pieces">
      {garment.panels.filter((p) => !p.mirrorOf).map((p) => (
        <Thumb key={p.id} p={p} design={panels[p.id]} active={p.id === selectedPanel} onSelect={() => selectPanel(p.id)} />
      ))}
    </div>
  );
}
