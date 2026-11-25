"use client";
import { useDesigner, type Layer, type PatternLayer } from "@/store/designer";
import { FABRICS, PATTERNS } from "@/lib/garments";
import { api } from "@/lib/api";

const uid = () => Math.random().toString(36).slice(2, 9);
const FONTS = ["Inter, sans-serif", "Georgia, serif", "'Courier New', monospace", "Impact, sans-serif"];

export default function SettingsPanel() {
  const { garment, selectedPanel, panels, updatePanel, applyToAll, resetPanel, undo, redo } = useDesigner();
  const def = garment.panels.find((p) => p.id === selectedPanel)!;
  const d = panels[selectedPanel];
  const set = (layers: Layer[]) => updatePanel(selectedPanel, { layers });
  const pattern = d.layers.find((l): l is PatternLayer => l.type === "pattern");

  const setPattern = (p: Partial<PatternLayer> | null) => {
    const rest = d.layers.filter((l) => l.type !== "pattern");
    if (p === null) return set(rest);
    const base: PatternLayer = pattern ?? { id: uid(), type: "pattern", patternId: "stripes", tile: 0.25, rotation: 0, x: 0, y: 0 };
    set([{ ...base, ...p }, ...rest]); // the print always sits at the bottom of the stack
  };

  const upload = async (file: File) => {
    const fd = new FormData(); fd.append("file", file);
    const { url } = await api<{ url: string }>("/api/uploads", { method: "POST", body: fd });
    set([...d.layers, { id: uid(), type: "image", src: url, x: 0.5, y: 0.5, w: 0.4, rotation: 0, opacity: 1 }]);
  };

  return (
    <div className="space-y-5 text-sm">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">{def.label}</h3>
        <button onClick={undo} className="ml-auto rounded border px-2 py-1" aria-label="Undo">Undo</button>
        <button onClick={redo} className="rounded border px-2 py-1" aria-label="Redo">Redo</button>
      </div>

      <label className="block">Fill color
        <input type="color" value={d.fill} onChange={(e) => updatePanel(selectedPanel, { fill: e.target.value })} className="ml-2 h-8 w-12 align-middle" aria-label="Fill color" />
      </label>

      <label className="block">Fabric
        <select value={d.fabric} onChange={(e) => updatePanel(selectedPanel, { fabric: e.target.value })} className="ml-2 rounded border px-2 py-1" aria-label="Fabric">
          {Object.entries(FABRICS).map(([id, f]) => <option key={id} value={id}>{f.label}{f.priceDeltaCents ? ` (+$${(f.priceDeltaCents / 100).toFixed(0)})` : ""}</option>)}
        </select>
      </label>

      <button onClick={() => applyToAll({ fill: d.fill, fabric: d.fabric })} className="rounded border px-2 py-1">Apply color + fabric to all pieces</button>

      {def.allowPrint && (
        <>
          <fieldset className="space-y-2">
            <legend className="font-medium">Print pattern</legend>
            <select value={pattern?.patternId ?? ""} onChange={(e) => setPattern(e.target.value ? { patternId: e.target.value } : null)} className="rounded border px-2 py-1" aria-label="Pattern">
              <option value="">None</option>{PATTERNS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
            {pattern && (<>
              <label className="block">Size <input type="range" min={0.05} max={1} step={0.01} value={pattern.tile} onChange={(e) => setPattern({ tile: +e.target.value })} aria-label="Pattern size" /></label>
              <label className="block">Rotation <input type="range" min={0} max={360} value={pattern.rotation} onChange={(e) => setPattern({ rotation: +e.target.value })} aria-label="Pattern rotation" /></label>
              <label className="block">Offset X <input type="range" min={0} max={1} step={0.01} value={pattern.x} onChange={(e) => setPattern({ x: +e.target.value })} aria-label="Pattern offset X" /></label>
              <label className="block">Offset Y <input type="range" min={0} max={1} step={0.01} value={pattern.y} onChange={(e) => setPattern({ y: +e.target.value })} aria-label="Pattern offset Y" /></label>
            </>)}
          </fieldset>

          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer rounded border px-2 py-1">Upload image
              <input type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} aria-label="Upload image" />
            </label>
            <button className="rounded border px-2 py-1"
              onClick={() => set([...d.layers, { id: uid(), type: "text", text: "Your text", font: FONTS[0], size: 0.08, color: "#000000", x: 0.5, y: 0.5, rotation: 0 }])}>Add text</button>
          </div>
        </>
      )}

      <ul className="space-y-1" aria-label="Layers">
        {d.layers.map((l, i) => (
          <li key={l.id} className="flex items-center gap-2 rounded border px-2 py-1">
            <span className="flex-1 truncate">{l.type === "text" ? `Text: ${l.text}` : l.type === "image" ? "Image" : "Pattern"}</span>
            {l.type === "text" && (<>
              <input value={l.text} onChange={(e) => set(d.layers.map((x) => (x.id === l.id ? { ...l, text: e.target.value } : x)))} className="w-24 rounded border px-1" aria-label="Text content" />
              <input type="color" value={l.color} onChange={(e) => set(d.layers.map((x) => (x.id === l.id ? { ...l, color: e.target.value } : x)))} aria-label="Text color" />
              <select value={l.font} onChange={(e) => set(d.layers.map((x) => (x.id === l.id ? { ...l, font: e.target.value } : x)))} aria-label="Font">{FONTS.map((f) => <option key={f}>{f}</option>)}</select>
            </>)}
            {l.type === "image" && <input type="range" min={0.1} max={1} step={0.05} value={l.opacity} aria-label="Opacity" onChange={(e) => set(d.layers.map((x) => (x.id === l.id ? { ...l, opacity: +e.target.value } : x)))} />}
            <button aria-label="Move up" disabled={i === d.layers.length - 1} onClick={() => { const a = [...d.layers]; [a[i], a[i + 1]] = [a[i + 1], a[i]]; set(a); }}>↑</button>
            <button aria-label="Delete layer" onClick={() => set(d.layers.filter((x) => x.id !== l.id))}>✕</button>
          </li>
        ))}
      </ul>
      <button onClick={() => resetPanel(selectedPanel)} className="text-xs underline">Reset this piece</button>
    </div>
  );
}
