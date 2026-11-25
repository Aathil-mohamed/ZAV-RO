// apps/web/store/designer.ts
import { create } from "zustand";
import { GARMENTS, type GarmentDef } from "@/lib/garments";

// All layer coordinates are NORMALIZED (0..1 of the piece's width/height) so the design is resolution-independent.
export type PatternLayer = { id: string; type: "pattern"; patternId: string; tile: number /* tile width as fraction of piece width */; rotation: number; x: number; y: number };
export type ImageLayer = { id: string; type: "image"; src: string; x: number; y: number; w: number /* width as fraction of piece width */; rotation: number; opacity: number };
export type TextLayer = { id: string; type: "text"; text: string; font: string; size: number /* fraction of piece height */; color: string; x: number; y: number; rotation: number };
export type Layer = PatternLayer | ImageLayer | TextLayer;
export type PanelDesign = { fill: string; fabric: string; layers: Layer[] };

type Snapshot = { panels: Record<string, PanelDesign>; variants: Record<string, string> };
type State = Snapshot & {
  garment: GarmentDef;
  selectedPanel: string;
  history: string[]; future: string[]; lastPush: number;
  setGarment: (slug: string) => void;
  load: (slug: string, s: Snapshot) => void;
  selectPanel: (id: string) => void;
  updatePanel: (id: string, patch: Partial<PanelDesign>) => void;
  applyToAll: (patch: Partial<Pick<PanelDesign, "fill" | "fabric">>) => void;
  resetPanel: (id: string) => void;
  resetAll: () => void;
  setVariant: (key: string, optionId: string) => void;
  undo: () => void; redo: () => void;
};

export const blank = (): PanelDesign => ({ fill: "#ffffff", fabric: "cotton", layers: [] });
const blanks = (g: GarmentDef) => Object.fromEntries(g.panels.map((p) => [p.id, blank()]));
const snap = (s: Snapshot) => JSON.stringify({ panels: s.panels, variants: s.variants });
const first = GARMENTS[0];

export const useDesigner = create<State>((set, get) => {
  // push an undo snapshot; rapid changes (slider drags) within 500 ms share one snapshot
  const push = () => {
    const s = get(); const now = Date.now();
    if (now - s.lastPush < 500) return {};
    return { history: [...s.history.slice(-49), snap(s)], future: [] as string[], lastPush: now };
  };
  // keep mirrored pieces identical to their source
  const withMirrors = (g: GarmentDef, panels: Record<string, PanelDesign>) => {
    const out = { ...panels };
    g.panels.forEach((p) => { if (p.mirrorOf) out[p.id] = out[p.mirrorOf]; });
    return out;
  };
  return {
    garment: first, selectedPanel: first.panels[0].id, panels: blanks(first), variants: {},
    history: [], future: [], lastPush: 0,
    setGarment: (slug) => { const g = GARMENTS.find((x) => x.slug === slug)!;
      set({ garment: g, selectedPanel: g.panels[0].id, panels: blanks(g), variants: {}, history: [], future: [], lastPush: 0 }); },
    load: (slug, s) => { const g = GARMENTS.find((x) => x.slug === slug)!;
      set({ garment: g, selectedPanel: g.panels[0].id, panels: withMirrors(g, s.panels), variants: s.variants, history: [], future: [], lastPush: 0 }); },
    selectPanel: (selectedPanel) => set((s) => ({ selectedPanel: s.garment.panels.find((p) => p.id === selectedPanel)?.mirrorOf ?? selectedPanel })),
    updatePanel: (id, patch) => set((s) => ({ ...push(), panels: withMirrors(s.garment, { ...s.panels, [id]: { ...s.panels[id], ...patch } }), lastPush: Date.now() })),
    applyToAll: (patch) => set((s) => ({ ...push(), lastPush: 0,
      panels: withMirrors(s.garment, Object.fromEntries(Object.entries(s.panels).map(([k, v]) => [k, { ...v, ...patch }]))) })),
    resetPanel: (id) => set((s) => ({ ...push(), lastPush: 0, panels: withMirrors(s.garment, { ...s.panels, [id]: blank() }) })),
    resetAll: () => set((s) => ({ ...push(), lastPush: 0, panels: blanks(s.garment), variants: {} })),
    setVariant: (key, optionId) => set((s) => ({ ...push(), lastPush: 0, variants: { ...s.variants, [key]: optionId } })),
    undo: () => { const s = get(); const last = s.history.at(-1); if (!last) return;
      set({ ...JSON.parse(last) as Snapshot, history: s.history.slice(0, -1), future: [snap(s), ...s.future], lastPush: 0 }); },
    redo: () => { const s = get(); const nxt = s.future[0]; if (!nxt) return;
      set({ ...JSON.parse(nxt) as Snapshot, future: s.future.slice(1), history: [...s.history, snap(s)], lastPush: 0 }); },
  };
});
