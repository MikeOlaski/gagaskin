import { describe, expect, it } from "vitest";

import { sortGallery, type GallerySkin } from "@/lib/gallery";

function skin(over: Partial<GallerySkin>): GallerySkin {
  return {
    id: "a",
    title: "t",
    inspirationPath: "i.png",
    ingamePath: "g.png",
    skinPngPath: null,
    renderIsoPath: null,
    renderQuadPath: null,
    renderDuoPath: null,
    madeWith: "custom",
    authorHandle: null,
    published: true,
    featured: false,
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00Z",
    ...over,
  };
}

describe("gallery ordering", () => {
  it("puts lower sort_order first", () => {
    const out = sortGallery([skin({ id: "b", sortOrder: 2 }), skin({ id: "a", sortOrder: 1 })]);
    expect(out.map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("breaks ties with newest first", () => {
    const out = sortGallery([
      skin({ id: "old", sortOrder: 0, createdAt: "2026-01-01T00:00:00Z" }),
      skin({ id: "new", sortOrder: 0, createdAt: "2026-06-01T00:00:00Z" }),
    ]);
    expect(out.map((s) => s.id)).toEqual(["new", "old"]);
  });

  it("does not mutate its input", () => {
    const input = [skin({ id: "b", sortOrder: 2 }), skin({ id: "a", sortOrder: 1 })];
    sortGallery(input);
    expect(input.map((s) => s.id)).toEqual(["b", "a"]);
  });
});
