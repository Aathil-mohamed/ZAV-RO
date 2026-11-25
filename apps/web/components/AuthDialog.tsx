"use client";
import { useState } from "react";
import { useAuth } from "@/store/auth";

export default function AuthDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { login, register, forgotPassword } = useAuth();
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === "forgot") {
        await forgotPassword(email);
        setInfo("If that email exists, a reset link has been sent.");
        return;
      }
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Reset password"}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-neutral-900 dark:text-neutral-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            {mode === "login" ? "Sign in to ZAVÉRO" : mode === "register" ? "Create account" : "Reset password"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3 text-sm">
          {mode === "register" && (
            <label className="block">
              <span className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
              />
            </label>
          )}
          <label className="block">
            <span className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
            />
          </label>
          {mode !== "forgot" && (
            <label className="block">
              <span className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">Password</span>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
              />
            </label>
          )}

          {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
          {info && <p className="text-xs text-emerald-600 dark:text-emerald-400">{info}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-black py-2.5 text-xs font-semibold uppercase tracking-wide text-white disabled:opacity-50 dark:bg-white dark:text-black"
          >
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : mode === "register" ? "Create account" : "Send reset link"}
          </button>
        </form>

        <div className="mt-4 flex flex-col gap-1 text-center text-xs text-neutral-500">
          {mode === "login" && (
            <button
              type="button"
              onClick={() => { setMode("forgot"); setError(null); setInfo(null); }}
              className="underline hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              Forgot password?
            </button>
          )}
          <p>
            {mode === "login" ? "New to ZAVÉRO? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError(null);
                setInfo(null);
              }}
              className="font-semibold underline text-neutral-900 dark:text-neutral-100"
            >
              {mode === "login" ? "Create account" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
