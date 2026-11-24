import { create } from "zustand";

export type Variant = {
  id: number;
  color: string;
  hex: string;
  modelImage: string;
  inStock: boolean;
};

export type Garment = {
  id: number;
  name: string;
  priceCents: number;
  thumb: string;
  customizable: boolean;
  garmentSlug: string | null;
  variants: Variant[];
};

export type StageState = {
  gender: "men" | "women";
  garments: Garment[];
  index: number;
  variantIndex: number;
  zoom: number;
  pan: { x: number; y: number };
  hydrate: (gender: "men" | "women", garments: Garment[]) => void;
  next: () => void;
  prev: () => void;
  go: (i: number) => void;
  setVariant: (i: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  setPan: (x: number, y: number) => void;
};

const reset = { variantIndex: 0, zoom: 1, pan: { x: 0, y: 0 } };

export const useStage = create<StageState>((set, get) => ({
  gender: "men",
  garments: [],
  index: 0,
  ...reset,
  hydrate: (gender, garments) => set({ gender, garments, index: 0, ...reset }),
  next: () => {
    const { index, garments } = get();
    if (garments.length) set({ index: (index + 1) % garments.length, ...reset });
  },
  prev: () => {
    const { index, garments } = get();
    if (garments.length) set({ index: (index - 1 + garments.length) % garments.length, ...reset });
  },
  go: (i) => set({ index: i, ...reset }),
  setVariant: (variantIndex) => set({ variantIndex }),
  zoomIn: () => set((s) => ({ zoom: Math.min(2, s.zoom + 0.25) })),
  zoomOut: () =>
    set((s) => {
      const zoom = Math.max(1, s.zoom - 0.25);
      return { zoom, pan: zoom === 1 ? { x: 0, y: 0 } : s.pan };
    }),
  setPan: (x, y) => set({ pan: { x, y } }),
}));
