"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Stage, Layer as KLayer, Image as KImage, Text as KText, Transformer } from "react-konva";
import useImage from "use-image";
import type Konva from "konva";
import { useDesigner, type ImageLayer, type TextLayer, type Layer } from "@/store/designer";
import { renderPanel } from "@/lib/renderPanel";

const VIEW_W = 560;

function ImgNode({ l, W, H, selected, onSelect, onChange }: { l: ImageLayer; W: number; H: number; selected: boolean; onSelect: () => void; onChange: (p: Partial<ImageLayer>) => void }) {
  const [img] = useImage(l.src, "anonymous");
  const ref = useRef<Konva.Image>(null); const tr = useRef<Konva.Transformer>(null);
  useEffect(() => { if (selected && tr.current && ref.current) { tr.current.nodes([ref.current]); tr.current.getLayer()?.batchDraw(); } }, [selected, img]);
  if (!img) return null;
  const w = l.w * W, h = w * (img.height / img.width);
  return (
    <>
      <KImage ref={ref} image={img} x={l.x * W} y={l.y * H} width={w} height={h} offsetX={w / 2} offsetY={h / 2}
        rotation={l.rotation} opacity={l.opacity} draggable onClick={onSelect} onTap={onSelect}
        onDragEnd={(e) => onChange({ x: e.target.x() / W, y: e.target.y() / H })}
        onTransformEnd={(e) => { const n = e.target; const sx = n.scaleX(); n.scaleX(1); n.scaleY(1);
          onChange({ x: n.x() / W, y: n.y() / H, w: (n.width() * sx) / W, rotation: n.rotation() }); }} />
      {selected && <Transformer ref={tr} keepRatio enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]} />}
    </>
  );
}

function TxtNode({ l, W, H, selected, onSelect, onChange }: { l: TextLayer; W: number; H: number; selected: boolean; onSelect: () => void; onChange: (p: Partial<TextLayer>) => void }) {
  const ref = useRef<Konva.Text>(null); const tr = useRef<Konva.Transformer>(null);
  useLayoutEffect(() => { const n = ref.current; if (n) { n.offsetX(n.width() / 2); n.offsetY(n.height() / 2); } }, [l.text, l.size, l.font]);
  useEffect(() => { if (selected && tr.current && ref.current) { tr.current.nodes([ref.current]); tr.current.getLayer()?.batchDraw(); } }, [selected]);
  return (
    <>
      <KText ref={ref} text={l.text} fontFamily={l.font} fontSize={l.size * H} fill={l.color} x={l.x * W} y={l.y * H} rotation={l.rotation}
        draggable onClick={onSelect} onTap={onSelect}
        onDragEnd={(e) => onChange({ x: e.target.x() / W, y: e.target.y() / H })}
        onTransformEnd={(e) => { const n = e.target; const sx = n.scaleX(); n.scaleX(1); n.scaleY(1);
          onChange({ x: n.x() / W, y: n.y() / H, size: l.size * sx, rotation: n.rotation() }); }} />
      {selected && <Transformer ref={tr} keepRatio rotateEnabled enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right"]} />}
    </>
  );
}

export default function PanelEditor() {
  const { garment, selectedPanel, panels, updatePanel } = useDesigner();
  const panel = garment.panels.find((p) => p.id === selectedPanel)!;
  const design = panels[selectedPanel];
  const [selId, setSelId] = useState<string | null>(null);
  const W = VIEW_W, H = Math.round((VIEW_W * panel.size[1]) / panel.size[0]);
  const base = useMemo(() => document.createElement("canvas"), []);
  const [outline] = useImage(panel.outline, "anonymous");
  const bg = useRef<Konva.Layer>(null);

  useEffect(() => { setSelId(null); }, [selectedPanel]);
  useEffect(() => { // repaint base when fill/fabric/pattern layers change
    renderPanel(base, panel, design, { scale: W / panel.size[0], skip: ["image", "text"] }).then(() => bg.current?.batchDraw());
  }, [base, panel, design, W]);

  const patch = (id: string, p: Partial<Layer>) =>
    updatePanel(selectedPanel, { layers: design.layers.map((l) => (l.id === id ? ({ ...l, ...p } as Layer) : l)) });

  return (
    <Stage width={W} height={H} onMouseDown={(e) => { if (e.target === e.target.getStage()) setSelId(null); }} className="max-w-full touch-none rounded border bg-neutral-100">
      <KLayer ref={bg} listening={false}>
        <KImage image={base as unknown as HTMLImageElement} width={W} height={H} />
        {outline && <KImage image={outline} width={W} height={H} opacity={0.55} />}
      </KLayer>
      <KLayer>
        {design.layers.map((l) => l.type === "image"
          ? <ImgNode key={l.id} l={l} W={W} H={H} selected={selId === l.id} onSelect={() => setSelId(l.id)} onChange={(p) => patch(l.id, p)} />
          : l.type === "text"
          ? <TxtNode key={l.id} l={l} W={W} H={H} selected={selId === l.id} onSelect={() => setSelId(l.id)} onChange={(p) => patch(l.id, p)} />
          : null)}
      </KLayer>
    </Stage>
  );
}
