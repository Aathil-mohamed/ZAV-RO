"use client";
import { create } from "zustand";
import { api } from "@/lib/api";

export type MyModelResult = {
  variantId?: number | null;
  customDesignId?: number | null;
  status: "queued" | "processing" | "done" | "failed";
  url: string | null;
};

type MyModelState = {
  on: boolean;
  hasPhoto: boolean;
  expiresAt: string | null;
  remaining: number | null;
  results: Record<number, MyModelResult>;
  pending: Set<number>;
  setOn: (on: boolean) => void;
  refresh: () => Promise<void>;
  uploadPhoto: (photo: File, keepDays: 1 | 30) => Promise<void>;
  destroyAll: () => Promise<void>;
  want: (variantIds: number[]) => Promise<void>;
};

let poller: ReturnType<typeof setTimeout> | undefined;

export const useMyModel = create<MyModelState>((set, get) => ({
  on: false,
  hasPhoto: false,
  expiresAt: null,
  remaining: null,
  results: {},
  pending: new Set(),
  setOn: (on) => set({ on }),
  refresh: async () => {
    const r = await api<{ hasPhoto: boolean; expiresAt: string | null; remainingToday: number }>("/api/my-model");
    set({ hasPhoto: r.hasPhoto, expiresAt: r.expiresAt, remaining: r.remainingToday });
  },
  uploadPhoto: async (photo, keepDays) => {
    const fd = new FormData();
    fd.append("photo", photo);
    fd.append("consent", "1");
    fd.append("keep_days", String(keepDays));
    const r = await api<{ hasPhoto: boolean; expiresAt: string; remainingToday: number }>("/api/my-model", {
      method: "POST",
      body: fd,
    });
    set({ hasPhoto: r.hasPhoto, expiresAt: r.expiresAt, remaining: r.remainingToday, results: {}, pending: new Set() });
  },
  destroyAll: async () => {
    clearTimeout(poller);
    await api<void>("/api/my-model", { method: "DELETE" });
    set({ on: false, hasPhoto: false, expiresAt: null, results: {}, pending: new Set() });
  },
  want: async (ids) => {
    const uniqueIds = Array.from(new Set(ids.filter((id) => Number.isFinite(id))));
    const need = uniqueIds
      .filter((id) => get().results[id]?.status !== "done" && !get().pending.has(id))
      .slice(0, 3);
    if (!need.length) return;

    need.forEach((id) => get().pending.add(id));
    try {
      const r = await api<{ results: MyModelResult[]; remaining: number }>("/api/my-model/results", {
        method: "POST",
        body: JSON.stringify({ variant_ids: need }),
      });
      set((s) => ({
        remaining: r.remaining,
        results: {
          ...s.results,
          ...Object.fromEntries(r.results.filter((x) => x.variantId != null).map((x) => [x.variantId as number, x])),
        },
      }));
    } catch {
      /* 429 quota or offline: keep showing cached results */
    }

    const poll = async () => {
      const open = Object.entries(get().results)
        .filter(([, v]) => v.status === "queued" || v.status === "processing")
        .map(([k]) => k);
      if (!open.length) {
        need.forEach((id) => get().pending.delete(id));
        return;
      }
      try {
        const r = await api<MyModelResult[]>(`/api/my-model/results?variant_ids=${open.join(",")}`);
        set((s) => ({
          results: {
            ...s.results,
            ...Object.fromEntries(r.filter((x) => x.variantId != null).map((x) => [x.variantId as number, x])),
          },
        }));
      } catch {
        need.forEach((id) => get().pending.delete(id));
        return;
      }
      poller = setTimeout(poll, 2000);
    };
    clearTimeout(poller);
    poller = setTimeout(poll, 1500);
  },
}));
