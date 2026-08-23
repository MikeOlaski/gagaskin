import { create } from "zustand";

import { createDemoSkin, createDiagnosticSkin } from "@/domain/skin/demoSkin";
import { FACE_BY_ID, oppositeFace, type SkinFace } from "@/domain/skin/faceRegistry";
import { fitImageToFace, type FitMode } from "@/domain/skin/imageMapping";
import {
  cloneSkin,
  createBlankSkin,
  fillRect,
  floodFillFace,
  getFacePixels,
  getPixel,
  hexToRgba,
  putFacePixels,
  rgbaToHex,
  setPixel,
  TRANSPARENT,
  type RGBA,
  type SkinBuffer,
} from "@/domain/skin/skinBuffer";

export type Tool = "pencil" | "eraser" | "fill" | "eyedropper";

export const MIN_CELL = 6;
export const MAX_CELL = 22;
export const DEFAULT_CELL = 12;
const MAX_HISTORY = 100;

export interface ReferenceImage {
  url: string;
  width: number;
  height: number;
  element: HTMLImageElement;
}

interface EditorState {
  skin: SkinBuffer;
  /** bumped on every canonical-texture mutation; drives all derived renders */
  version: number;
  selectedFaceId: string | null;
  tool: Tool;
  color: string;
  alpha: number;
  cellSize: number;
  showCoords: boolean;
  reference: ReferenceImage | null;
  palette: string[];
  fitMode: FitMode;
  undoStack: SkinBuffer[];
  redoStack: SkinBuffer[];

  selectFace: (id: string | null) => void;
  setTool: (tool: Tool) => void;
  setColor: (color: string) => void;
  setAlpha: (alpha: number) => void;
  setCellSize: (cell: number) => void;
  toggleCoords: () => void;
  setFitMode: (mode: FitMode) => void;

  beginStroke: () => void;
  paintAtlasPixel: (atlasX: number, atlasY: number) => void;
  applyToolAt: (faceId: string, localX: number, localY: number) => void;

  clearSelectedFace: () => void;
  copyToOppositeLimb: () => void;
  fitReferenceToSelectedFace: () => void;

  setReference: (ref: ReferenceImage | null) => void;
  setPalette: (palette: string[]) => void;

  loadSkin: (skin: SkinBuffer) => void;
  newBlankSkin: () => void;
  loadDemoSkin: () => void;
  loadDiagnosticSkin: () => void;

  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

function activeColor(state: { color: string; alpha: number }): RGBA {
  return hexToRgba(state.color, Math.round(state.alpha * 255));
}

export const useEditorStore = create<EditorState>((set, get) => {
  /** Push an undo snapshot of the current buffer. */
  const snapshot = () => {
    const { skin, undoStack } = get();
    const next = [...undoStack, cloneSkin(skin)];
    if (next.length > MAX_HISTORY) next.shift();
    set({ undoStack: next, redoStack: [] });
  };

  /** Mutate the canonical buffer in a fresh copy so consumers see a new ref. */
  const mutate = (fn: (skin: SkinBuffer) => void) => {
    const skin = cloneSkin(get().skin);
    fn(skin);
    set({ skin, version: get().version + 1 });
  };

  return {
    skin: createDemoSkin(),
    version: 0,
    selectedFaceId: "head.front",
    tool: "pencil",
    color: "#3b82f6",
    alpha: 1,
    cellSize: DEFAULT_CELL,
    showCoords: true,
    reference: null,
    palette: [],
    fitMode: "cover",
    undoStack: [],
    redoStack: [],

    selectFace: (id) => set({ selectedFaceId: id }),
    setTool: (tool) => set({ tool }),
    setColor: (color) => set({ color }),
    setAlpha: (alpha) => set({ alpha: Math.min(1, Math.max(0, alpha)) }),
    setCellSize: (cell) =>
      set({ cellSize: Math.min(MAX_CELL, Math.max(MIN_CELL, Math.round(cell))) }),
    toggleCoords: () => set({ showCoords: !get().showCoords }),
    setFitMode: (fitMode) => set({ fitMode }),

    beginStroke: snapshot,

    paintAtlasPixel: (atlasX, atlasY) => {
      const state = get();
      mutate((skin) => setPixel(skin, atlasX, atlasY, activeColor(state)));
    },

    applyToolAt: (faceId, localX, localY) => {
      const state = get();
      const face = FACE_BY_ID[faceId];
      if (!face) return;
      if (localX < 0 || localY < 0 || localX >= face.atlas.w || localY >= face.atlas.h) return;
      const ax = face.atlas.x + localX;
      const ay = face.atlas.y + localY;

      switch (state.tool) {
        case "pencil":
          mutate((skin) => setPixel(skin, ax, ay, activeColor(state)));
          break;
        case "eraser":
          mutate((skin) => setPixel(skin, ax, ay, TRANSPARENT));
          break;
        case "fill":
          mutate((skin) => floodFillFace(skin, face.atlas, localX, localY, activeColor(state)));
          break;
        case "eyedropper": {
          const px = getPixel(state.skin, ax, ay);
          if (px.a === 0) {
            set({ alpha: 0 });
          } else {
            set({ color: rgbaToHex(px), alpha: px.a / 255 });
          }
          break;
        }
      }
    },

    clearSelectedFace: () => {
      const face = selectedFace(get());
      if (!face) return;
      snapshot();
      mutate((skin) => fillRect(skin, face.atlas, TRANSPARENT));
    },

    copyToOppositeLimb: () => {
      const face = selectedFace(get());
      if (!face) return;
      const target = oppositeFace(face);
      if (!target) return;
      const pixels = getFacePixels(get().skin, face.atlas);
      snapshot();
      mutate((skin) => putFacePixels(skin, target.atlas, pixels));
    },

    fitReferenceToSelectedFace: () => {
      const state = get();
      const face = selectedFace(state);
      if (!face || !state.reference) return;
      snapshot();
      mutate((skin) =>
        fitImageToFace(
          skin,
          face.atlas,
          state.reference!.element,
          state.reference!.width,
          state.reference!.height,
          state.fitMode,
        ),
      );
    },

    setReference: (reference) => {
      const prev = get().reference;
      if (prev && prev.url !== reference?.url) URL.revokeObjectURL(prev.url);
      set({ reference });
    },
    setPalette: (palette) => set({ palette }),

    loadSkin: (skin) => {
      snapshot();
      set({ skin: cloneSkin(skin), version: get().version + 1 });
    },
    newBlankSkin: () => get().loadSkin(createBlankSkin()),
    loadDemoSkin: () => get().loadSkin(createDemoSkin()),
    loadDiagnosticSkin: () => get().loadSkin(createDiagnosticSkin()),

    undo: () => {
      const { undoStack, redoStack, skin, version } = get();
      const prev = undoStack[undoStack.length - 1];
      if (!prev) return;
      set({
        skin: prev,
        undoStack: undoStack.slice(0, -1),
        redoStack: [...redoStack, cloneSkin(skin)],
        version: version + 1,
      });
    },

    redo: () => {
      const { undoStack, redoStack, skin, version } = get();
      const next = redoStack[redoStack.length - 1];
      if (!next) return;
      set({
        skin: next,
        redoStack: redoStack.slice(0, -1),
        undoStack: [...undoStack, cloneSkin(skin)],
        version: version + 1,
      });
    },

    canUndo: () => get().undoStack.length > 0,
    canRedo: () => get().redoStack.length > 0,
  };
});

function selectedFace(state: { selectedFaceId: string | null }): SkinFace | null {
  return state.selectedFaceId ? FACE_BY_ID[state.selectedFaceId] ?? null : null;
}

export function useSelectedFace(): SkinFace | null {
  return useEditorStore((s) => (s.selectedFaceId ? FACE_BY_ID[s.selectedFaceId] ?? null : null));
}
