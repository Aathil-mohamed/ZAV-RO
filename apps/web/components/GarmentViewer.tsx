"use client";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useDesigner } from "@/store/designer";
import { renderPanel } from "@/lib/renderPanel";
import { FABRICS } from "@/lib/garments";
import { viewerApi } from "@/lib/viewerApi";

function Garment() {
  const garment = useDesigner((s) => s.garment);
  const panels = useDesigner((s) => s.panels);
  const variants = useDesigner((s) => s.variants);
  const selected = useDesigner((s) => s.selectedPanel);
  const gltf = useGLTF(garment.model);
  const scene = useMemo(() => gltf.scene.clone(true), [gltf.scene]); // never mutate the cached original
  const invalidate = useThree((s) => s.invalidate);
  const mats = useRef<Record<string, THREE.MeshStandardMaterial>>({});
  const last = useRef<Record<string, string>>({});

  // bind one material (with a CanvasTexture) per piece, matched by the GLB material NAME == piece id
  useLayoutEffect(() => {
    last.current = {};
    const made: Record<string, THREE.MeshStandardMaterial> = {};
    garment.panels.forEach((p) => {
      const c = document.createElement("canvas"); c.width = c.height = 2;
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false; tex.anisotropy = 8; // flipY=false matches glTF UVs
      made[p.id] = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9, name: p.id });
    });
    mats.current = made;
    const missing = new Set(Object.keys(made));
    scene.traverse((o) => {
      const m = o as THREE.Mesh; if (!m.isMesh) return;
      const orig = Array.isArray(m.material) ? m.material[0] : m.material;
      if (orig && (orig as THREE.Material).name && made[(orig as THREE.Material).name]) {
        m.material = made[(orig as THREE.Material).name];
        missing.delete((orig as THREE.Material).name);
      }
    });
    if (missing.size) console.warn(`[${garment.slug}] pieces with no matching GLB material:`, Array.from(missing));
    return () => Object.values(made).forEach((m) => { m.map?.dispose(); m.dispose(); });
  }, [garment, scene]);

  // repaint only the pieces whose design changed
  useEffect(() => {
    garment.panels.forEach(async (p) => {
      const design = panels[p.id]; if (!design) return;
      const json = JSON.stringify(design);
      if (last.current[p.id] === json) return;
      last.current[p.id] = json;
      const mat = mats.current[p.id]; if (!mat?.map) return;
      const tex = mat.map as THREE.CanvasTexture;
      const ok = await renderPanel(tex.image as HTMLCanvasElement, p, design);
      if (ok) { tex.needsUpdate = true; mat.roughness = FABRICS[design.fabric]?.roughness ?? 0.9; invalidate(); }
    });
  }, [panels, garment, invalidate]);

  // structural variants: node name is  var__{key}__{optionId}
  useEffect(() => {
    garment.variants.forEach((g) => {
      const active = variants[g.key] ?? g.options[0].id;
      g.options.forEach((o) => { const n = scene.getObjectByName(`var__${g.key}__${o.id}`); if (n) n.visible = o.id === active; });
    });
    invalidate();
  }, [variants, garment, scene, invalidate]);

  // subtle highlight of the selected piece (respects prefers-reduced-motion by being static, not animated)
  useEffect(() => {
    Object.entries(mats.current).forEach(([id, m]) => m.emissive.set(id === selected ? 0x2a2a2a : 0x000000));
    invalidate();
  }, [selected, garment, scene, invalidate]);

  return <primitive object={scene} />;
}

function Capture() {
  const { gl, scene, camera, controls } = useThree();
  useEffect(() => {
    viewerApi.capture = (front = false) => {
      const pos = camera.position.clone(), quat = camera.quaternion.clone();
      if (front) { camera.position.set(0, 0, 2.4); camera.lookAt(0, 0, 0); }
      gl.render(scene, camera);
      const url = gl.domElement.toDataURL("image/png");
      camera.position.copy(pos); camera.quaternion.copy(quat);
      return url;
    };
    const onReset = () => {
      const ctrl = controls as unknown as { reset?: () => void } | null;
      ctrl?.reset?.();
    };
    window.addEventListener("zavero:resetview", onReset);
    return () => {
      delete viewerApi.capture;
      window.removeEventListener("zavero:resetview", onReset);
    };
  }, [gl, scene, camera, controls]);
  return null;
}

export default function GarmentViewer() {
  return (
    <Canvas frameloop="demand" camera={{ position: [0, 0, 2.4], fov: 35 }} dpr={[1, 2]} gl={{ alpha: true }}>
      <Environment preset="studio" />
      <ambientLight intensity={0.3} />
      <Garment />
      <ContactShadows position={[0, -0.7, 0]} opacity={0.35} blur={2.5} />
      <OrbitControls makeDefault enablePan={false} minDistance={1.2} maxDistance={3.5} />
      <Capture />
    </Canvas>
  );
}
