import { describe, expect, it } from "vitest";

import { OFFERS, getOffer, isOfferId, type OfferId } from "@/lib/offers";

describe("offer registry", () => {
  it("holds exactly the three offers", () => {
    expect(OFFERS.map((o) => o.id)).toEqual(["ai-helper", "custom", "build"]);
  });

  it("gives every offer a unique route", () => {
    const routes = OFFERS.map((o) => o.route);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("uses the approved offer names", () => {
    expect(OFFERS.map((o) => o.name)).toEqual([
      "AI Helper",
      "Human Creator Custom Orders",
      "Awesome Editor",
    ]);
  });

  it("never spells genius wrong", () => {
    expect(JSON.stringify(OFFERS)).not.toMatch(/genious/i);
  });

  it("sends the two editor offers to the editor and custom orders elsewhere", () => {
    expect(getOffer("ai-helper").editorStart).toBe("ai-helper");
    expect(getOffer("build").editorStart).toBe("build");
    expect(getOffer("custom").editorStart).toBeNull();
  });

  it("recognises only real offer ids", () => {
    expect(isOfferId("ai-helper")).toBe(true);
    expect(isOfferId("build")).toBe(true);
    expect(isOfferId("custom")).toBe(true);
    expect(isOfferId("personal")).toBe(false);
    expect(isOfferId("")).toBe(false);
    expect(isOfferId("../../etc/passwd")).toBe(false);
  });

  it("keeps OfferId assignable from the registry", () => {
    const id: OfferId = OFFERS[0]!.id;
    expect(id).toBe("ai-helper");
  });
});
