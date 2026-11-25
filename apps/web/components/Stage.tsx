"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useStage } from "@/store/stage";
import { useCart } from "@/store/cart";
import ThumbRail from "./ThumbRail";

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"];

export default function Stage() {
  const {
    garments,
    index,
    variantIndex,
    zoom,
    pan,
    next,
    prev,
    setVariant,
    zoomIn,
    zoomOut,
    setPan,
  } = useStage();

  const { add, toggle, count } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const bagCount = mounted ? count() : 0;
  const [size, setSize] = useState("M");
  const touch = useRef<{ x: number; y: number } | null>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const n = garments.length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  if (!n) {
    return (
      <div className="flex h-[100svh] w-full items-center justify-center text-neutral-400">
        Loading catalog...
      </div>
    );
  }

  const garment = garments[index];
  const variant = garment.variants[variantIndex] || garment.variants[0];

  // Window of 3 garments mounted and decoded so swapping is only an opacity change (150ms)
  const window3 = [-1, 0, 1]
    .map((o) => ({ o, g: garments[(index + o + n) % n] }))
    .filter((x, i, a) => a.findIndex((y) => y.g.id === x.g.id) === i);

  return (
    <section
      className="relative h-[100svh] w-full select-none overflow-hidden bg-[url('/room.webp')] bg-cover bg-center"
      onTouchStart={(e) => {
        touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }}
      onTouchEnd={(e) => {
        const s = touch.current;
        if (!s || zoom > 1) return;
        const dx = e.changedTouches[0].clientX - s.x;
        const dy = e.changedTouches[0].clientY - s.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
          (dx < 0 ? next : prev)();
        }
      }}
    >
      {/* Desktop Floating Garment Thumbnails */}
      <ThumbRail />

      {/* Left Navigation Arrow */}
      <button
        aria-label="Previous garment"
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex size-12 items-center justify-center rounded-full bg-white/70 hover:bg-white text-neutral-900 shadow-xl backdrop-blur transition-all active:scale-95"
      >
        <span className="text-2xl font-light leading-none">‹</span>
      </button>

      {/* Right Navigation Arrow */}
      <button
        aria-label="Next garment"
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex size-12 items-center justify-center rounded-full bg-white/70 hover:bg-white text-neutral-900 shadow-xl backdrop-blur transition-all active:scale-95"
      >
        <span className="text-2xl font-light leading-none">›</span>
      </button>

      {/* Centered Model Viewport */}
      <div className="absolute inset-0 flex items-end justify-center pb-24">
        <div
          className={`relative h-[82%] aspect-[1/2] ${zoom > 1 ? "cursor-grab active:cursor-grabbing" : ""}`}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: drag.current ? "none" : "transform 200ms ease",
          }}
          onPointerDown={(e) => {
            if (zoom > 1) {
              drag.current = {
                x: e.clientX,
                y: e.clientY,
                px: pan.x,
                py: pan.y,
              };
              e.currentTarget.setPointerCapture(e.pointerId);
            }
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (d) setPan(d.px + e.clientX - d.x, d.py + e.clientY - d.y);
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
        >
          {window3.map(({ o, g }) =>
            g.variants.map((v, vi) => {
              const active = o === 0 && vi === variantIndex;
              return (
                <Image
                  key={`${g.id}-${v.id}`}
                  src={v.modelImage}
                  alt={active ? `${g.name} in ${v.color}` : ""}
                  aria-hidden={!active}
                  fill
                  sizes="(max-width:768px) 80vw, 40vw"
                  priority={o === 0 && vi === 0}
                  draggable={false}
                  className={`pointer-events-none object-contain transition-opacity duration-150 motion-reduce:transition-none ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                />
              );
            })
          )}
        </div>
      </div>

      {/* Top Right Controls (Zoom + / -, Bag Drawer Button) */}
      <div className="absolute right-4 top-20 z-20 flex flex-col items-center gap-2">
        <button
          onClick={zoomIn}
          aria-label="Zoom in"
          className="flex size-10 items-center justify-center rounded-full bg-white/80 hover:bg-white text-neutral-900 shadow-md backdrop-blur transition-all active:scale-95 font-semibold text-lg"
        >
          +
        </button>
        <button
          onClick={zoomOut}
          aria-label="Zoom out"
          className="flex size-10 items-center justify-center rounded-full bg-white/80 hover:bg-white text-neutral-900 shadow-md backdrop-blur transition-all active:scale-95 font-semibold text-lg"
        >
          −
        </button>
        <button
          onClick={() => toggle(true)}
          aria-label={`Open bag, ${bagCount} items`}
          className="relative mt-2 flex size-11 items-center justify-center rounded-full bg-neutral-900 hover:bg-black text-white shadow-xl transition-all active:scale-95"
        >
          <svg
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.75}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
          {bagCount > 0 && (
            <span className="absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow">
              {bagCount}
            </span>
          )}
        </button>
      </div>

      {/* Bottom Floating Control Bar */}
      <div className="absolute bottom-5 left-1/2 z-20 flex w-[min(94vw,740px)] -translate-x-1/2 flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/90 px-5 py-3 shadow-2xl backdrop-blur-md border border-neutral-200/60 dark:bg-neutral-900/90 dark:border-neutral-800">
        {/* Garment Title & Price */}
        <div className="min-w-0 mr-auto">
          <p className="truncate text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {garment.name}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            ${(garment.priceCents / 100).toFixed(2)} · {variant.color}
          </p>
        </div>

        {/* Color Dots */}
        <div className="flex items-center gap-2" role="radiogroup" aria-label="Color">
          {garment.variants.map((v, i) => (
            <button
              key={v.id}
              role="radio"
              aria-checked={i === variantIndex}
              aria-label={`${v.color}${v.inStock ? "" : " (out of stock)"}`}
              onClick={() => setVariant(i)}
              style={{ background: v.hex }}
              className={`relative size-7 rounded-full border border-neutral-300 dark:border-neutral-700 transition-all ${
                i === variantIndex
                  ? "ring-2 ring-black dark:ring-white ring-offset-2 scale-110 shadow"
                  : "hover:scale-105"
              } ${v.inStock ? "" : "opacity-40"}`}
            >
              {!v.inStock && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-full h-0.5 bg-rose-600 rotate-45 transform" />
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Size Selector Dropdown */}
        <select
          aria-label="Size"
          value={size}
          onChange={(e) => setSize(e.target.value)}
          className="rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-3 py-1.5 text-xs font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
        >
          {SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Add to Bag Button */}
        <button
          disabled={!variant.inStock}
          onClick={() =>
            add({
              name: `${garment.name} (${variant.color})`,
              image: variant.modelImage,
              priceCents: garment.priceCents,
              size,
              variantId: variant.id,
            })
          }
          className="rounded-lg bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 text-white px-5 py-2 text-xs font-semibold tracking-wide uppercase transition-all shadow-md active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {variant.inStock ? "Add to bag" : "Sold out"}
        </button>
      </div>
    </section>
  );
}
