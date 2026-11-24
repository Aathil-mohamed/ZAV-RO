import { describe, it, expect, beforeEach } from "vitest";
import { useStage, type Garment } from "./stage";

const mockGarments: Garment[] = [
  {
    id: 1,
    name: "Hoodie",
    priceCents: 12000,
    thumb: "/thumb1.webp",
    customizable: true,
    garmentSlug: "hoodie",
    variants: [
      { id: 101, color: "Black", hex: "#000000", modelImage: "/img1.webp", inStock: true },
      { id: 102, color: "Grey", hex: "#888888", modelImage: "/img2.webp", inStock: true },
    ],
  },
  {
    id: 2,
    name: "T-Shirt",
    priceCents: 5000,
    thumb: "/thumb2.webp",
    customizable: false,
    garmentSlug: "tshirt",
    variants: [
      { id: 201, color: "White", hex: "#ffffff", modelImage: "/img3.webp", inStock: true },
    ],
  },
  {
    id: 3,
    name: "Pants",
    priceCents: 8000,
    thumb: "/thumb3.webp",
    customizable: false,
    garmentSlug: "pants",
    variants: [
      { id: 301, color: "Navy", hex: "#000080", modelImage: "/img4.webp", inStock: true },
    ],
  },
];

describe("useStage Store", () => {
  beforeEach(() => {
    useStage.getState().hydrate("men", mockGarments);
  });

  it("next() advances index and wraps around at both ends", () => {
    expect(useStage.getState().index).toBe(0);

    useStage.getState().next();
    expect(useStage.getState().index).toBe(1);

    useStage.getState().next();
    expect(useStage.getState().index).toBe(2);

    // Wraps around from last back to 0
    useStage.getState().next();
    expect(useStage.getState().index).toBe(0);
  });

  it("prev() goes backward and wraps around from 0 to last", () => {
    expect(useStage.getState().index).toBe(0);

    // Wraps backward to 2
    useStage.getState().prev();
    expect(useStage.getState().index).toBe(2);

    useStage.getState().prev();
    expect(useStage.getState().index).toBe(1);
  });

  it("go() resets zoom and variantIndex", () => {
    useStage.getState().setVariant(1);
    useStage.getState().zoomIn();
    useStage.getState().zoomIn();
    useStage.getState().setPan(50, 50);

    expect(useStage.getState().variantIndex).toBe(1);
    expect(useStage.getState().zoom).toBe(1.5);
    expect(useStage.getState().pan).toEqual({ x: 50, y: 50 });

    useStage.getState().go(2);

    expect(useStage.getState().index).toBe(2);
    expect(useStage.getState().variantIndex).toBe(0);
    expect(useStage.getState().zoom).toBe(1);
    expect(useStage.getState().pan).toEqual({ x: 0, y: 0 });
  });

  it("zoom controls scale between 1 and 2 in 0.25 steps", () => {
    expect(useStage.getState().zoom).toBe(1);

    useStage.getState().zoomIn();
    expect(useStage.getState().zoom).toBe(1.25);

    useStage.getState().zoomIn();
    useStage.getState().zoomIn();
    useStage.getState().zoomIn();
    useStage.getState().zoomIn();
    // Maximum 2
    expect(useStage.getState().zoom).toBe(2);

    useStage.getState().zoomOut();
    expect(useStage.getState().zoom).toBe(1.75);

    useStage.getState().zoomOut();
    useStage.getState().zoomOut();
    useStage.getState().zoomOut();
    useStage.getState().zoomOut();
    // Minimum 1
    expect(useStage.getState().zoom).toBe(1);
  });
});
