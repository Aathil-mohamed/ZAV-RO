"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";

interface PingResponse {
  ok: boolean;
  message?: string;
}

export default function Home() {
  const [apiStatus, setApiStatus] = useState<string>("checking...");
  const [isOk, setIsOk] = useState<boolean | null>(null);

  useEffect(() => {
    api<PingResponse>("/api/ping")
      .then((data) => {
        if (data.ok) {
          setApiStatus("Connected to Laravel API (GET /api/ping -> ok: true)");
          setIsOk(true);
        } else {
          setApiStatus("API returned non-ok status");
          setIsOk(false);
        }
      })
      .catch((err) => {
        setApiStatus(`Error connecting to API: ${err.message}`);
        setIsOk(false);
      });
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-neutral-950 text-neutral-100 font-sans">
      <div className="max-w-xl w-full p-8 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl flex flex-col items-center text-center">
        <div className="relative w-24 h-24 mb-4">
          <Image
            src="/branding/zavero-icon-512.png"
            alt="ZAVÉRO Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">ZAVÉRO Store</h1>
        <p className="text-sm text-neutral-400 mb-6">
          Phase 0: Architecture & Infrastructure Setup
        </p>

        <div className="w-full p-4 rounded-xl bg-neutral-950 border border-neutral-800 text-left mb-6">
          <div className="text-xs uppercase tracking-wider text-neutral-500 font-semibold mb-2">
            API Health Check
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-block w-3 h-3 rounded-full ${
                isOk === true
                  ? "bg-emerald-500 animate-pulse"
                  : isOk === false
                  ? "bg-rose-500"
                  : "bg-amber-500 animate-ping"
              }`}
            />
            <span className="text-sm font-mono text-neutral-200">
              {apiStatus}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full text-xs text-neutral-400">
          <div className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-800 text-left">
            <div className="font-semibold text-neutral-200">Web App</div>
            <div>Next.js 14.2 (App Router)</div>
          </div>
          <div className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-800 text-left">
            <div className="font-semibold text-neutral-200">Backend API</div>
            <div>Laravel 11 + Sanctum</div>
          </div>
          <div className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-800 text-left">
            <div className="font-semibold text-neutral-200">Try-On Service</div>
            <div>FastAPI (Python 3.14)</div>
          </div>
          <div className="p-3 rounded-lg bg-neutral-800/50 border border-neutral-800 text-left">
            <div className="font-semibold text-neutral-200">Storage & Cache</div>
            <div>MinIO S3 + Redis</div>
          </div>
        </div>
      </div>
    </main>
  );
}
