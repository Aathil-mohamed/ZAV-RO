"use client";

import Image from "next/image";
import { useStage } from "@/store/stage";

export default function ThumbRail() {
  const { garments, index, go } = useStage();
  const n = garments.length;

  if (n < 3) return null;

  // Show 2 cards each side on desktop if 5+ garments, else 1 card each side
  const offsets = n >= 5 ? [-2, -1, 1, 2] : [-1, 1];

  const renderCard = (o: number) => {
    const i = (index + o + n) % n;
    const g = garments[i];
    const isNearby = Math.abs(o) === 1;

    return (
      <button
        key={o}
        onClick={() => go(i)}
        className={`group relative flex flex-col items-center rounded-2xl bg-white/70 dark:bg-neutral-900/70 p-2.5 shadow-lg backdrop-blur-md border border-white/40 dark:border-neutral-800 transition-all duration-200 hover:scale-105 hover:bg-white dark:hover:bg-neutral-800 ${
          isNearby ? "w-28 opacity-95" : "w-22 opacity-65"
        }`}
      >
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-neutral-200/50 dark:bg-neutral-800/50">
          <Image
            src={g.thumb}
            alt={g.name}
            fill
            sizes="112px"
            className="object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <p className="mt-1.5 w-full truncate text-center text-[11px] font-semibold text-neutral-800 dark:text-neutral-200">
          {g.name}
        </p>
        <p className="text-[10px] font-medium text-neutral-500 dark:text-neutral-400">
          ${(g.priceCents / 100).toFixed(2)}
        </p>
      </button>
    );
  };

  return (
    <>
      {/* Left thumbnail rail */}
      <div className="absolute left-8 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex">
        {offsets.filter((o) => o < 0).map(renderCard)}
      </div>

      {/* Right thumbnail rail */}
      <div className="absolute right-8 top-1/2 z-10 hidden -translate-y-1/2 flex-col items-center gap-3 lg:flex">
        {offsets.filter((o) => o > 0).map(renderCard)}
      </div>
    </>
  );
}
