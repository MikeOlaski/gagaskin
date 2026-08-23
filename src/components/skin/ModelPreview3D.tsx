import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

import { Button } from "@/components/ui/button";
import { getFace, SKIN_SIZE, type BodyPart } from "@/domain/skin/faceRegistry";
import { useSkinCanvas } from "@/hooks/useSkinCanvas";
import { useEditorStore } from "@/store/editorStore";

/**
 * BoxGeometry material/face order is +X, -X, +Y, -Y, +Z, -Z.
 * The character faces +Z, so +X is the character's LEFT side and -X its RIGHT.
 * The -Y (bottom) face is flipped vertically, matching Minecraft's convention.
 */
function applyUVs(geometry: THREE.BoxGeometry, part: BodyPart) {
  const uv = geometry.attributes["uv"] as THREE.BufferAttribute;
  const order: Array<{ face: "LEFT" | "RIGHT" | "TOP" | "BOTTOM" | "FRONT" | "BACK"; flipV: boolean }> = [
    { face: "LEFT", flipV: false }, // +X
    { face: "RIGHT", flipV: false }, // -X
    { face: "TOP", flipV: false }, // +Y
    { face: "BOTTOM", flipV: true }, // -Y
    { face: "FRONT", flipV: false }, // +Z
    { face: "BACK", flipV: false }, // -Z
  ];

  order.forEach((entry, i) => {
    const { atlas } = getFace(part, entry.face);
    const u0 = atlas.x / SKIN_SIZE;
    const u1 = (atlas.x + atlas.w) / SKIN_SIZE;
    let vTop = 1 - atlas.y / SKIN_SIZE;
    let vBottom = 1 - (atlas.y + atlas.h) / SKIN_SIZE;
    if (entry.flipV) [vTop, vBottom] = [vBottom, vTop];
    const base = i * 4;
    uv.setXY(base + 0, u0, vTop);
    uv.setXY(base + 1, u1, vTop);
    uv.setXY(base + 2, u0, vBottom);
    uv.setXY(base + 3, u1, vBottom);
  });
  uv.needsUpdate = true;
}

interface PartProps {
  part: BodyPart;
  size: [number, number, number];
  position: [number, number, number];
  material: THREE.Material;
}

function BodyCuboid({ part, size, position, material }: PartProps) {
  const geometry = useMemo(() => {
    const g = new THREE.BoxGeometry(size[0], size[1], size[2]);
    applyUVs(g, part);
    return g;
  }, [part, size]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  return <mesh geometry={geometry} material={material} position={position} />;
}

const PARTS: Array<Omit<PartProps, "material">> = [
  { part: "HEAD", size: [8, 8, 8], position: [0, 28, 0] },
  { part: "TORSO", size: [8, 12, 4], position: [0, 18, 0] },
  { part: "RIGHT_ARM", size: [4, 12, 4], position: [-6, 18, 0] },
  { part: "LEFT_ARM", size: [4, 12, 4], position: [6, 18, 0] },
  { part: "RIGHT_LEG", size: [4, 12, 4], position: [-2, 6, 0] },
  { part: "LEFT_LEG", size: [4, 12, 4], position: [2, 6, 0] },
];

function PlayerModel({ canvas, version }: { canvas: HTMLCanvasElement; version: number }) {
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);

  const material = useMemo(
    () =>
      new THREE.MeshLambertMaterial({
        map: texture,
        transparent: true,
        alphaTest: 0.05,
        side: THREE.FrontSide,
      }),
    [texture],
  );

  useEffect(() => {
    texture.needsUpdate = true;
  }, [texture, version]);

  useEffect(
    () => () => {
      texture.dispose();
      material.dispose();
    },
    [texture, material],
  );

  return (
    <group position={[0, -17, 0]}>
      {PARTS.map((p) => (
        <BodyCuboid key={p.part} {...p} material={material} />
      ))}
    </group>
  );
}

export default function ModelPreview3D() {
  const canvas = useSkinCanvas();
  const version = useEditorStore((s) => s.version);
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <header className="flex items-center gap-2 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">3D preview</h2>
        <span className="text-xs text-muted-foreground">drag to orbit · scroll to zoom</span>
        <Button
          className="ml-auto"
          variant="outline"
          size="sm"
          onClick={() => controls.current?.reset()}
        >
          <RotateCcw className="mr-1 size-3.5" />
          Reset
        </Button>
      </header>
      <div className="h-[340px] w-full">
        <Canvas
          camera={{ position: [0, 6, 48], fov: 45 }}
          gl={{ alpha: true, antialias: true }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.85} />
          <directionalLight position={[16, 24, 20]} intensity={0.9} />
          <directionalLight position={[-16, 10, -20]} intensity={0.5} />
          {canvas ? <PlayerModel canvas={canvas} version={version} /> : null}
          <OrbitControls
            ref={controls}
            autoRotate={false}
            enablePan={false}
            minDistance={20}
            maxDistance={110}
            target={[0, 1, 0]}
          />
        </Canvas>
      </div>
    </section>
  );
}
