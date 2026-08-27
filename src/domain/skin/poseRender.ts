import * as THREE from "three";

import { getFace, SKIN_SIZE, type BodyPart } from "./faceRegistry";
import { writeSkinToCanvas, type SkinBuffer } from "./skinBuffer";

/**
 * Offscreen posed renders of the canonical 64×64 texture. The gallery shows
 * these — never the editor canvas — so grids, labels and selection chrome can
 * never reach a published image.
 */
export type GalleryView = "iso" | "quad" | "duo";

export const GALLERY_VIEW_LABEL: Record<GalleryView, string> = {
  iso: "Iso",
  quad: "4 up",
  duo: "2 up",
};

/** Every gallery image is portrait 9:16 so cards never jump height. */
export const GALLERY_WIDTH = 576;
export const GALLERY_HEIGHT = 1024;

type Direction = [number, number, number];

const DIR_FRONT: Direction = [0, 0, 1];
const DIR_BACK: Direction = [0, 0, -1];
const DIR_RIGHT: Direction = [-1, 0, 0]; // character's right is -X
const DIR_LEFT: Direction = [1, 0, 0];
const DIR_ISO: Direction = [0.85, 0.55, 1];

const VIEW_DIRECTIONS: Record<GalleryView, Direction[]> = {
  iso: [DIR_ISO],
  quad: [DIR_FRONT, DIR_RIGHT, DIR_BACK, DIR_LEFT],
  duo: [DIR_FRONT, DIR_BACK],
};

/** BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z. */
function applyUVs(geometry: THREE.BoxGeometry, part: BodyPart) {
  const uv = geometry.attributes["uv"] as THREE.BufferAttribute;
  const order: Array<{ face: "LEFT" | "RIGHT" | "TOP" | "BOTTOM" | "FRONT" | "BACK"; flipV: boolean }> = [
    { face: "LEFT", flipV: false },
    { face: "RIGHT", flipV: false },
    { face: "TOP", flipV: false },
    { face: "BOTTOM", flipV: true },
    { face: "FRONT", flipV: false },
    { face: "BACK", flipV: false },
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

interface Limb {
  part: BodyPart;
  size: [number, number, number];
  /** Pivot position: the joint the limb swings from, or the box centre. */
  pivot: [number, number, number];
  /** Offset of the box centre from the pivot. */
  centreOffset: [number, number, number];
  rotationX: number;
}

/** A relaxed mid-stride pose reads as a character rather than a T-shaped mannequin. */
const LIMBS: Limb[] = [
  { part: "HEAD", size: [8, 8, 8], pivot: [0, 28, 0], centreOffset: [0, 0, 0], rotationX: 0 },
  { part: "TORSO", size: [8, 12, 4], pivot: [0, 18, 0], centreOffset: [0, 0, 0], rotationX: 0 },
  { part: "RIGHT_ARM", size: [4, 12, 4], pivot: [-6, 24, 0], centreOffset: [0, -6, 0], rotationX: -0.45 },
  { part: "LEFT_ARM", size: [4, 12, 4], pivot: [6, 24, 0], centreOffset: [0, -6, 0], rotationX: 0.35 },
  { part: "RIGHT_LEG", size: [4, 12, 4], pivot: [-2, 12, 0], centreOffset: [0, -6, 0], rotationX: 0.3 },
  { part: "LEFT_LEG", size: [4, 12, 4], pivot: [2, 12, 0], centreOffset: [0, -6, 0], rotationX: -0.22 },
];

const CENTRE = new THREE.Vector3(0, 17, 0);
/** Breathing room around the model, in skin texels (1 world unit = 1 texel). */
const PADDING = 5;
const MODEL_HEIGHT = 44 + PADDING * 2; // world units the posed model needs vertically
const MODEL_WIDTH = 24 + PADDING * 2; // ...and horizontally, arms swung out

function buildScene(texture: THREE.Texture) {
  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 0.85);
  key.position.set(16, 24, 20);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.45);
  fill.position.set(-18, 12, -20);
  scene.add(fill);

  const material = new THREE.MeshLambertMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.05,
    side: THREE.FrontSide,
  });

  const disposables: Array<{ dispose: () => void }> = [material];
  for (const limb of LIMBS) {
    const geometry = new THREE.BoxGeometry(limb.size[0], limb.size[1], limb.size[2]);
    applyUVs(geometry, limb.part);
    geometry.translate(limb.centreOffset[0], limb.centreOffset[1], limb.centreOffset[2]);
    disposables.push(geometry);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(limb.pivot[0], limb.pivot[1], limb.pivot[2]);
    mesh.rotation.x = limb.rotationX;
    scene.add(mesh);
  }
  return { scene, disposables };
}

function makeCamera(dir: Direction, aspect: number) {
  // Fit both axes: a narrow cell zooms out rather than clipping the model.
  const height = Math.max(MODEL_HEIGHT, MODEL_WIDTH / aspect);
  const width = height * aspect;
  const camera = new THREE.OrthographicCamera(-width / 2, width / 2, height / 2, -height / 2, 0.1, 500);
  const v = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize().multiplyScalar(120);
  camera.position.copy(CENTRE).add(v);
  camera.up.set(0, 1, 0);
  camera.lookAt(CENTRE);
  return camera;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode PNG."))), "image/png");
  });
}

/** Renders one 9:16 PNG of the posed model in the requested view. */
export async function renderGalleryView(skin: SkinBuffer, view: GalleryView): Promise<Blob> {
  const source = document.createElement("canvas");
  writeSkinToCanvas(skin, source);

  const texture = new THREE.CanvasTexture(source);
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;

  const canvas = document.createElement("canvas");
  canvas.width = GALLERY_WIDTH;
  canvas.height = GALLERY_HEIGHT;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(GALLERY_WIDTH, GALLERY_HEIGHT, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearAlpha(0);

  const { scene, disposables } = buildScene(texture);

  try {
    const dirs = VIEW_DIRECTIONS[view];
    // 2 up stacks front over back; 4 up is a 2×2 sheet.
    const columns = dirs.length >= 4 ? 2 : 1;
    const rows = Math.ceil(dirs.length / columns);
    const cellW = Math.floor(GALLERY_WIDTH / columns);
    const cellH = Math.floor(GALLERY_HEIGHT / rows);

    renderer.setScissorTest(true);
    renderer.clear();
    dirs.forEach((dir, i) => {
      const col = i % columns;
      const row = Math.floor(i / columns);
      // WebGL viewport origin is bottom-left; rows read top-to-bottom.
      const x = col * cellW;
      const y = GALLERY_HEIGHT - (row + 1) * cellH;
      renderer.setViewport(x, y, cellW, cellH);
      renderer.setScissor(x, y, cellW, cellH);
      renderer.render(scene, makeCamera(dir, cellW / cellH));
    });

    return await canvasToBlob(canvas);
  } finally {
    for (const d of disposables) d.dispose();
    texture.dispose();
    renderer.dispose();
  }
}

export async function renderAllGalleryViews(
  skin: SkinBuffer,
): Promise<Record<GalleryView, Blob>> {
  return {
    iso: await renderGalleryView(skin, "iso"),
    quad: await renderGalleryView(skin, "quad"),
    duo: await renderGalleryView(skin, "duo"),
  };
}
