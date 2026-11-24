import Link from "next/link";
import Image from "next/image";
import StageClient from "@/components/StageClient";
import type { Garment } from "@/store/stage";

async function getCatalog(gender: "men" | "women"): Promise<Garment[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
  try {
    const res = await fetch(`${apiUrl}/api/catalog/${gender}`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) {
      console.error(`Catalog fetch failed with status ${res.status}`);
      return [];
    }
    return res.json();
  } catch (err) {
    console.error("Error fetching catalog from API:", err);
    return [];
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams?: { gender?: string };
}) {
  const gender = searchParams?.gender === "women" ? "women" : "men";
  const garments = await getCatalog(gender);

  return (
    <main className="relative min-h-[100svh] w-full overflow-hidden bg-neutral-950">
      {/* Top Navigation Bar */}
      <header className="fixed top-4 left-0 right-0 z-30 flex items-center justify-between px-6 pointer-events-none">
        {/* Brand Logo */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="relative size-8">
            <Image
              src="/branding/zavero-icon-512.png"
              alt="ZAVÉRO"
              fill
              className="object-contain"
              priority
            />
          </div>
          <span className="text-sm font-bold tracking-widest text-white uppercase drop-shadow-md">
            ZAVÉRO
          </span>
        </div>

        {/* Gender Toggle Pill */}
        <nav className="flex gap-1 rounded-full bg-neutral-900/80 p-1 backdrop-blur-md border border-neutral-700/50 shadow-lg pointer-events-auto">
          {(["men", "women"] as const).map((g) => (
            <Link
              key={g}
              href={`/?gender=${g}`}
              scroll={false}
              className={`rounded-full px-5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-all ${
                g === gender
                  ? "bg-white text-black shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {g === "men" ? "Men" : "Women"}
            </Link>
          ))}
        </nav>

        {/* Right spacing placeholder */}
        <div className="w-20 hidden md:block" />
      </header>

      {/* Main Interactive Stage & Bag Drawer */}
      <StageClient gender={gender} garments={garments} />
    </main>
  );
}
