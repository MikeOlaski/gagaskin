import { beforeEach, describe, expect, it } from "vitest";

import { getFace } from "@/domain/skin/faceRegistry";
import { createBlankSkin, cloneSkin, getPixel } from "@/domain/skin/skinBuffer";
import { useEditorStore } from "@/store/editorStore";

const store = useEditorStore;

describe("undo / redo transactions", () => {
  beforeEach(() => {
    store.setState({
      skin: createBlankSkin(),
      undoStack: [],
      redoStack: [],
      selectedFaceId: "torso.front",
      tool: "pencil",
      color: "#ff0000",
      alpha: 1,
      version: 0,
    });
  });

  it("groups a drag stroke into one undo transaction", () => {
    const original = cloneSkin(store.getState().skin);
    store.getState().beginStroke();
    for (let y = 0; y < 5; y++) store.getState().applyToolAt("torso.front", 0, y);

    expect(store.getState().undoStack).toHaveLength(1);
    expect(getPixel(store.getState().skin, 20, 24)).toEqual({ r: 255, g: 0, b: 0, a: 255 });

    store.getState().undo();
    expect([...store.getState().skin]).toEqual([...original]);

    store.getState().redo();
    expect(getPixel(store.getState().skin, 20, 24).r).toBe(255);
    expect(store.getState().undoStack).toHaveLength(1);
  });

  it("treats fill as a single transaction", () => {
    store.setState({ tool: "fill" });
    store.getState().beginStroke();
    store.getState().applyToolAt("torso.front", 2, 2);
    expect(store.getState().undoStack).toHaveLength(1);
    const rect = getFace("TORSO", "FRONT").atlas;
    expect(getPixel(store.getState().skin, rect.x + 7, rect.y + 11).r).toBe(255);
    store.getState().undo();
    expect(getPixel(store.getState().skin, rect.x + 7, rect.y + 11).a).toBe(0);
  });

  it("erases a texel to alpha 0", () => {
    store.getState().beginStroke();
    store.getState().applyToolAt("torso.front", 1, 1);
    expect(getPixel(store.getState().skin, 21, 21).a).toBe(255);
    store.setState({ tool: "eraser" });
    store.getState().beginStroke();
    store.getState().applyToolAt("torso.front", 1, 1);
    expect(getPixel(store.getState().skin, 21, 21).a).toBe(0);
  });

  it("samples the canonical color with the eyedropper", () => {
    store.setState({ color: "#00ff00" });
    store.getState().beginStroke();
    store.getState().applyToolAt("torso.front", 3, 3);
    store.setState({ tool: "eyedropper", color: "#000000" });
    store.getState().applyToolAt("torso.front", 3, 3);
    expect(store.getState().color).toBe("#00ff00");
    expect(store.getState().alpha).toBe(1);
  });

  it("ignores out-of-face coordinates", () => {
    store.getState().beginStroke();
    store.getState().applyToolAt("torso.front", 99, 99);
    expect([...store.getState().skin].every((v) => v === 0)).toBe(true);
  });

  it("copies to the opposite limb but never for head or torso", () => {
    store.setState({ selectedFaceId: "torso.front" });
    const before = cloneSkin(store.getState().skin);
    store.getState().copyToOppositeLimb();
    expect([...store.getState().skin]).toEqual([...before]);

    store.setState({ selectedFaceId: "leftArm.front", tool: "pencil" });
    store.getState().beginStroke();
    store.getState().applyToolAt("leftArm.front", 0, 0);
    store.getState().copyToOppositeLimb();
    const right = getFace("RIGHT_ARM", "FRONT").atlas;
    expect(getPixel(store.getState().skin, right.x, right.y).r).toBe(255);
  });
});
