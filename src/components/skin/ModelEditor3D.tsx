import { OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Brush, Minus, Move3d, Plus, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  ARM_PARTS,
  faceAtAtlas,
  getFace,
  PART_LABELS,
  SKIN_SIZE,
  slimAtlas,
  type BodyPart,
  type FaceName,
} from "@/domain/skin/faceRegistry";
import { useSkinCanvas } from "@/hooks/useSkinCanvas";
import { useEditorStore, useSelectedFace, type Tool } from "@/store/editorStore";

const CAMERA = { position: [0, 4, 38] as [number, number, number], fov: 45 };

const PAINT_TOOLS: Tool[] = ["pencil", "eraser", "fill", "eyedropper"];

/** BoxGeometry face order is +X, -X, +Y, -Y, +Z, -Z; the character faces +Z. */
function applyUVs(geometry: THREE.BoxGeometry, part: BodyPart, slim: boolean) {
  const uv = geometry.attributes["uv"] as THREE.BufferAttribute;
  const order: Array<{
    face: "LEFT" | "RIGHT" | "TOP" | "BOTTOM" | "FRONT" | "BACK";
    flipV: boolean;
  }> = [
    { face: "LEFT", flipV: false },
    { face: "RIGHT", flipV: false },
    { face: "TOP", flipV: false },
    { face: "BOTTOM", flipV: true },
    { face: "FRONT", flipV: false },
    { face: "BACK", flipV: false },
  ];

  order.forEach((entry, i) => {
    const skinFace = getFace(part, entry.face);
    const atlas = slim ? slimAtlas(skinFace) : skinFace.atlas;
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

const PARTS: Array<{ part: BodyPart; size: [number, number, number]; position: [number, number, number] }> = [
  { part: "HEAD", size: [8, 8, 8], position: [0, 28, 0] },
  { part: "TORSO", size: [8, 12, 4], position: [0, 18, 0] },
  { part: "RIGHT_ARM", size: [4, 12, 4], position: [-6, 18, 0] },
  { part: "LEFT_ARM", size: [4, 12, 4], position: [6, 18, 0] },
  { part: "RIGHT_LEG", size: [4, 12, 4], position: [-2, 6, 0] },
  { part: "LEFT_LEG", size: [4, 12, 4], position: [2, 6, 0] },
];

interface HitInfo {
  part: BodyPart;
  faceLabel: string;
  atlasX: number;
  atlasY: number;
}

/** Where a quad sits, just outside a given box surface, to outline it. */
function faceQuad(
  face: FaceName,
  size: [number, number, number],
): { position: [number, number, number]; rotation: [number, number, number]; plane: [number, number] } {
  const [w, h, d] = size;
  const gap = 0.08;
  switch (face) {
    case "FRONT":
      return { position: [0, 0, d / 2 + gap], rotation: [0, 0, 0], plane: [w, h] };
    case "BACK":
      return { position: [0, 0, -d / 2 - gap], rotation: [0, Math.PI, 0], plane: [w, h] };
    case "LEFT":
      return { position: [w / 2 + gap, 0, 0], rotation: [0, Math.PI / 2, 0], plane: [d, h] };
    case "RIGHT":
      return { position: [-w / 2 - gap, 0, 0], rotation: [0, -Math.PI / 2, 0], plane: [d, h] };
    case "TOP":
      return { position: [0, h / 2 + gap, 0], rotation: [-Math.PI / 2, 0, 0], plane: [w, d] };
    default:
      return { position: [0, -h / 2 - gap, 0], rotation: [Math.PI / 2, 0, 0], plane: [w, d] };
  }
}

function PaintablePart({
  part,
  size,
  position,
  material,
  slim,
  selectedFace,
  onHit,
  onHover,
}: {
  part: BodyPart;
  size: [number, number, number];
  position: [number, number, number];
  material: THREE.Material;
  slim: boolean;
  selectedFace: FaceName | null;
  onHit: (e: ThreeEvent<PointerEvent>, part: BodyPart, kind: "down" | "move") => void;
  onHover: (info: HitInfo | null) => void;
}) {
  const geometry = useMemo(() => {
    const g = new THREE.BoxGeometry(size[0], size[1], size[2]);
    applyUVs(g, part, slim);
    return g;
  }, [part, size, slim]);

  // Wireframe edges make each cube (and so each paintable surface) readable.
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  useEffect(
    () => () => {
      geometry.dispose();
      edges.dispose();
    },
    [geometry, edges],
  );

  const quad = selectedFace ? faceQuad(selectedFace, size) : null;

  return (
    <group position={position}>
      <mesh
        geometry={geometry}
        material={material}
        onPointerDown={(e) => onHit(e, part, "down")}
        onPointerMove={(e) => onHit(e, part, "move")}
        onPointerOut={() => onHover(null)}
      />
      <lineSegments geometry={edges} raycast={() => null} renderOrder={2}>
        <lineBasicMaterial color="#1f2937" transparent opacity={0.45} depthTest={false} />
      </lineSegments>
      {quad ? (
        <mesh position={quad.position} rotation={quad.rotation} raycast={() => null}>
          <planeGeometry args={quad.plane} />
          <meshBasicMaterial color="#f97316" transparent opacity={0.28} depthWrite={false} />
        </mesh>
      ) : null}
    </group>
  );
}

export const MIN_DISTANCE = 14;
export const MAX_DISTANCE = 120;

export interface ZoomApi {
  setDistance: (distance: number) => void;
}

/**
 * Bridges the toolbar zoom control to the live camera and reports the current
 * distance back, so wheel zoom and the slider always agree.
 */
function ZoomBridge({
  api,
  controlsRef,
  onDistance,
}: {
  api: React.RefObject<ZoomApi | null>;
  controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
  onDistance: (distance: number) => void;
}) {
  const camera = useThree((s) => s.camera);
  const last = useRef(0);

  useEffect(() => {
    api.current = {
      setDistance: (distance) => {
        const controls = controlsRef.current;
        const target = controls ? controls.target.clone() : new THREE.Vector3(0, 1, 0);
        const offset = camera.position.clone().sub(target);
        const clamped = Math.min(MAX_DISTANCE, Math.max(MIN_DISTANCE, distance));
        camera.position.copy(target).add(offset.setLength(clamped));
        controls?.update();
      },
    };
    return () => {
      api.current = null;
    };
  }, [api, camera, controlsRef]);

  useFrame(() => {
    const controls = controlsRef.current;
    const target = controls ? controls.target : new THREE.Vector3(0, 1, 0);
    const distance = Math.round(camera.position.distanceTo(target));
    if (distance !== last.current) {
      last.current = distance;
      onDistance(distance);
    }
  });

  return null;
}

function EditorScene({
  canvas,
  version,
  controlsRef,
  zoomApi,
  paintMode,
  onDistance,
  onHover,
}: {
  canvas: HTMLCanvasElement | null;
  version: number;
  controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null>;
  zoomApi: React.RefObject<ZoomApi | null>;
  paintMode: boolean;
  onDistance: (distance: number) => void;
  onHover: (info: HitInfo | null) => void;
}) {
  const tool = useEditorStore((s) => s.tool);
  const visibleParts = useEditorStore((s) => s.visibleParts);
  const slimArms = useEditorStore((s) => s.slimArms);
  const selected = useSelectedFace();
  const painting = useRef(false);

  const texture = useMemo(() => {
    if (!canvas) return null;
    const t = new THREE.CanvasTexture(canvas);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    t.generateMipmaps = false;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, [canvas]);

  const material = useMemo(
    () =>
      texture
        ? new THREE.MeshLambertMaterial({
            map: texture,
            transparent: true,
            alphaTest: 0.05,
            side: THREE.FrontSide,
          })
        : null,
    [texture],
  );

  useEffect(() => {
    if (texture) texture.needsUpdate = true;
  }, [texture, version]);

  useEffect(
    () => () => {
      texture?.dispose();
      material?.dispose();
    },
    [texture, material],
  );

  useEffect(() => {
    const end = () => {
      painting.current = false;
    };
    window.addEventListener("pointerup", end);
    return () => window.removeEventListener("pointerup", end);
  }, []);

  const handleHit = useCallback(
    (e: ThreeEvent<PointerEvent>, part: BodyPart, kind: "down" | "move") => {
      const uv = e.uv;
      if (!uv) return;
      const atlasX = Math.min(SKIN_SIZE - 1, Math.max(0, Math.floor(uv.x * SKIN_SIZE)));
      const atlasY = Math.min(SKIN_SIZE - 1, Math.max(0, Math.floor((1 - uv.y) * SKIN_SIZE)));
      const found = faceAtAtlas(atlasX, atlasY);
      if (!found) return;

      onHover({
        part,
        faceLabel: found.face.face.toLowerCase(),
        atlasX,
        atlasY,
      });

      const store = useEditorStore.getState();
      const isPaintTool = paintMode && PAINT_TOOLS.includes(store.tool);

      if (kind === "down") {
        // In navigate mode the drag belongs to the camera, not the brush.
        if (!paintMode && !e.nativeEvent.shiftKey) return;
        e.stopPropagation();
        store.selectFace(found.face.id);
        // Shift-click treats the whole cube surface as one selectable polygon.
        if (e.nativeEvent.shiftKey && (store.tool === "fill" || store.tool === "select")) {
          store.fillSelectedFace();
          return;
        }
        if (!isPaintTool) return;
        painting.current = true;
        if (store.tool !== "eyedropper") store.beginStroke();
        store.applyToolAt(found.face.id, found.localX, found.localY);
        return;
      }

      if (!painting.current || !isPaintTool || store.tool === "eyedropper") return;
      if (store.tool === "fill") return;
      store.applyToolAt(found.face.id, found.localX, found.localY);
    },
    [onHover, paintMode],
  );

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[16, 24, 20]} intensity={0.85} />
      <directionalLight position={[-16, 10, -20]} intensity={0.5} />
      {material ? (
        <group position={[0, -17, 0]}>
          {PARTS.filter((p) => visibleParts[p.part]).map((p) => {
            const slimPart = slimArms && ARM_PARTS.includes(p.part);
            const size: [number, number, number] = slimPart ? [3, p.size[1], p.size[2]] : p.size;
            return (
              <PaintablePart
                key={p.part}
                part={p.part}
                size={size}
                position={p.position}
                material={material}
                slim={slimPart}
                selectedFace={selected?.part === p.part ? selected.face : null}
                onHit={handleHit}
                onHover={onHover}
              />
            );
          })}
        </group>
      ) : null}
      <ZoomBridge api={zoomApi} />
      <OrbitControls
        ref={controlsRef}
        enablePan={!paintMode}
        zoomSpeed={0.8}
        minDistance={14}
        maxDistance={120}
        target={[0, 1, 0]}
        mouseButtons={
          paintMode
            ? { MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE }
            : { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE }
        }
      />
    </>
  );
}

/**
 * 3D edit mode: the flat exploded layout folded up into the player model, painted
 * directly on its surfaces. Ray hits carry the atlas UV, so every stroke lands on
 * the exact texel the flat editor would have hit — the canonical 64×64 buffer
 * stays the single source of truth.
 */
export default function ModelEditor3D() {
  const canvas = useSkinCanvas();
  const version = useEditorStore((s) => s.version);
  const tool = useEditorStore((s) => s.tool);
  const controls = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const zoomApi = useRef<((factor: number) => void) | null>(null);
  const [hover, setHover] = useState<HitInfo | null>(null);

  const paintMode = PAINT_TOOLS.includes(tool);

  return (
    <section className="flex h-full min-h-[calc(100vh-9rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <header className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">3D edit mode</h2>
        <span className="text-xs text-muted-foreground">
          {paintMode
            ? "drag to paint · shift-click fills a whole surface · right-drag to orbit · scroll to zoom"
            : "drag to orbit · shift-click fills a whole surface · pick a paint tool to draw"}
        </span>
        <span className="ml-auto font-mono text-xs text-muted-foreground">
          {hover
            ? `${PART_LABELS[hover.part]} · ${hover.faceLabel} · ${hover.atlasX},${hover.atlasY}`
            : "—"}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            title="Zoom out"
            aria-label="Zoom out"
            onClick={() => zoomApi.current?.(1.25)}
          >
            <Minus className="size-3.5" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            title="Zoom in"
            aria-label="Zoom in"
            onClick={() => zoomApi.current?.(0.8)}
          >
            <Plus className="size-3.5" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => controls.current?.reset()}>
            <RotateCcw className="mr-1 size-3.5" />
            Reset view
          </Button>
        </div>
      </header>
      <div
        className="min-h-0 flex-1"
        style={{ cursor: paintMode ? "crosshair" : "grab", touchAction: "none" }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Canvas camera={CAMERA} gl={{ alpha: true, antialias: true }} dpr={[1, 2]}>
          <EditorScene
            canvas={canvas}
            version={version}
            controlsRef={controls}
            zoomApi={zoomApi}
            onHover={setHover}
          />
        </Canvas>
      </div>
    </section>
  );
}
