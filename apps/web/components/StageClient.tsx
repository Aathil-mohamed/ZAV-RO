"use client";

import { useEffect } from "react";
import { useStage, type Garment } from "@/store/stage";
import Stage from "./Stage";
import BagDrawer from "./BagDrawer";

export default function StageClient({
  gender,
  garments,
}: {
  gender: "men" | "women";
  garments: Garment[];
}) {
  const hydrate = useStage((s) => s.hydrate);

  useEffect(() => {
    hydrate(gender, garments);
  }, [gender, garments, hydrate]);

  return (
    <>
      <Stage />
      <BagDrawer />
    </>
  );
}
