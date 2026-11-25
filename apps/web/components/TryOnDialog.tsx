"use client";
import { useEffect, useState } from "react";
import { useTryOn } from "@/hooks/useTryOn";
import { useMyModel } from "@/store/myModel";
import { useAuth } from "@/store/auth";
import { api } from "@/lib/api";
import AuthDialog from "./AuthDialog";

type TryOnDialogProps = {
  open: boolean;
  onClose: () => void;
  mode: "single" | "my-model";
  garmentName?: string;
  garmentUrl?: string;
  category?: "upper" | "lower" | "dress";
  onAddToBag?: () => void;
};

export default function TryOnDialog({
  open,
  onClose,
  mode,
  garmentName = "Garment",
  garmentUrl,
  category = "upper",
  onAddToBag,
}: TryOnDialogProps) {
  const { user, checked, fetchUser } = useAuth();
  const { status, resultUrl, error, start, cancel } = useTryOn();
  const myModel = useMyModel();

  const [authOpen, setAuthOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [keep30Days, setKeep30Days] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [uploadingModel, setUploadingModel] = useState(false);

  useEffect(() => {
    if (open && !checked) {
      fetchUser();
    }
  }, [open, checked, fetchUser]);

  useEffect(() => {
    if (!file) {
      setPreviewSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!open) return null;

  const handleClose = () => {
    cancel();
    setLocalError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if (!file || !consent) return;
    setLocalError(null);

    if (mode === "my-model") {
      setUploadingModel(true);
      try {
        await myModel.uploadPhoto(file, keep30Days ? 30 : 1);
        myModel.setOn(true);
        handleClose();
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : "Could not upload photo.");
      } finally {
        setUploadingModel(false);
      }
      return;
    }

    if (!garmentUrl) {
      setLocalError("Missing garment image.");
      return;
    }
    await start(file, garmentUrl, category);
  };

  const handleDeleteMyPhotos = async () => {
    if (mode === "my-model") {
      await myModel.destroyAll();
    } else {
      await api<void>("/api/tryon", { method: "DELETE" });
    }
    setFile(null);
    cancel();
    onClose();
  };

  const isBusy = status === "uploading" || status === "processing" || uploadingModel;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label={mode === "my-model" ? "Set your model photo" : `Try on ${garmentName}`}
      >
        <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 dark:text-neutral-100 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">
              {mode === "my-model" ? "My Model Photo" : `Try on: ${garmentName}`}
            </h2>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close try-on dialog"
              className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              ✕
            </button>
          </div>

          {!user ? (
            <div className="space-y-4 text-sm">
              <p className="text-neutral-600 dark:text-neutral-400">
                Sign in or create an account to try garments on your photo. Your photos are stored privately and can be deleted anytime.
              </p>
              <button
                type="button"
                onClick={() => setAuthOpen(true)}
                className="w-full rounded-lg bg-black py-2.5 text-xs font-semibold uppercase tracking-wide text-white dark:bg-white dark:text-black"
              >
                Sign in / Register
              </button>
            </div>
          ) : status === "done" && resultUrl ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {garmentUrl && (
                  <div className="rounded-xl border p-2 dark:border-neutral-800">
                    <p className="mb-1 text-[11px] font-medium text-neutral-500">Garment</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={garmentUrl} alt={garmentName} className="h-64 w-full object-contain rounded" />
                  </div>
                )}
                <div className="rounded-xl border p-2 dark:border-neutral-800">
                  <p className="mb-1 text-[11px] font-medium text-neutral-500">AI Preview</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={resultUrl} alt={`AI preview wearing ${garmentName}`} className="h-64 w-full object-contain rounded" />
                </div>
              </div>

              <p className="text-xs text-neutral-500">
                AI preview. Fit and color may differ slightly from the real product.
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    cancel();
                    setFile(null);
                  }}
                  className="rounded-lg border px-3 py-2 text-xs font-semibold dark:border-neutral-700"
                >
                  Try another
                </button>
                {onAddToBag && (
                  <button
                    type="button"
                    onClick={() => {
                      onAddToBag();
                      handleClose();
                    }}
                    className="rounded-lg bg-black px-4 py-2 text-xs font-semibold text-white dark:bg-white dark:text-black"
                  >
                    Add to bag
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDeleteMyPhotos}
                  className="ml-auto text-xs text-rose-600 underline"
                >
                  Delete my photos
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="rounded-xl bg-neutral-50 p-3 text-xs text-neutral-600 dark:bg-neutral-800/70 dark:text-neutral-300">
                <p className="font-semibold mb-1">Photo tips for best results:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Full-body, front-facing photo (JPG, PNG, or WebP, max 10 MB, min 400×600 px)</li>
                  <li>Good lighting and a plain background</li>
                  <li>Arms slightly away from the body</li>
                </ul>
              </div>

              <label className="block cursor-pointer rounded-xl border-2 border-dashed border-neutral-300 p-4 text-center hover:border-neutral-400 dark:border-neutral-700">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  hidden
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                {previewSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={previewSrc} alt="Selected full-body preview" className="mx-auto max-h-56 rounded-lg object-contain" />
                ) : (
                  <span className="text-xs text-neutral-500">Click to choose a full-body photo</span>
                )}
              </label>

              {isBusy && (
                <div className="rounded-xl border p-4 text-center animate-pulse dark:border-neutral-800">
                  <p className="text-xs font-medium">
                    {status === "uploading" ? "Uploading photo securely…" : "Generating your AI preview…"}
                  </p>
                </div>
              )}

              <label className="flex items-start gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  I consent to uploading my photo solely to generate this try-on preview. Photos are stored privately and deleted automatically within {mode === "my-model" && keep30Days ? "30 days" : "24 hours"}.
                </span>
              </label>

              {mode === "my-model" && (
                <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
                  <input
                    type="checkbox"
                    checked={keep30Days}
                    onChange={(e) => setKeep30Days(e.target.checked)}
                  />
                  <span>Keep my photo for 30 days (uncheck for 24 hours)</span>
                </label>
              )}

              {(error || localError) && (
                <p className="text-xs text-rose-600 dark:text-rose-400">{error ?? localError}</p>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!file || !consent || isBusy}
                  className="flex-1 rounded-lg bg-black py-2.5 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-40 dark:bg-white dark:text-black"
                >
                  {isBusy ? "Working…" : mode === "my-model" ? "Use as my model" : "Generate preview"}
                </button>
                <button
                  type="button"
                  onClick={handleDeleteMyPhotos}
                  className="rounded-lg border px-3 py-2.5 text-xs text-rose-600 dark:border-neutral-700"
                >
                  Delete my photos
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
