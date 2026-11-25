"use client";
import { useRef, useState } from "react";
import { api } from "@/lib/api";

export type TryOnStatus = "idle" | "uploading" | "processing" | "done" | "failed";

export function useTryOn() {
  const [status, setStatus] = useState<TryOnStatus>("idle");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  async function start(photo: File, garmentUrl: string, category: "upper" | "lower" | "dress") {
    clearTimeout(timer.current);
    setStatus("uploading");
    setError(null);
    setResultUrl(null);
    try {
      const fd = new FormData();
      fd.append("photo", photo);
      fd.append("garment_url", garmentUrl);
      fd.append("category", category);
      fd.append("consent", "1");

      const { id } = await api<{ id: number }>("/api/tryon", { method: "POST", body: fd });
      setStatus("processing");
      const t0 = Date.now();

      const poll = async () => {
        try {
          const r = await api<{ status: string; resultUrl: string | null; error: string | null }>(`/api/tryon/${id}`);
          if (r.status === "done") {
            setResultUrl(r.resultUrl);
            setStatus("done");
            return;
          }
          if (r.status === "failed" || Date.now() - t0 > 90_000) {
            setError(r.error ?? "This is taking too long. Please try again.");
            setStatus("failed");
            return;
          }
          timer.current = setTimeout(poll, 1500);
        } catch {
          setError("Could not check try-on status. Please try again.");
          setStatus("failed");
        }
      };
      poll();
    } catch {
      setError("Upload failed. Check the photo and try again.");
      setStatus("failed");
    }
  }

  const cancel = () => {
    clearTimeout(timer.current);
    setStatus("idle");
    setError(null);
  };

  return { status, resultUrl, error, start, cancel };
}
