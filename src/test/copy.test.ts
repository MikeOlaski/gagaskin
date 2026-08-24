import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PUBLIC_ROUTES = ["index.tsx", "skins.tsx", "ai-helper.tsx", "build.tsx", "custom.tsx", "join.tsx"];
const SITE_DIR = "src/components/site";

function publicSource(): string {
  const routes = PUBLIC_ROUTES.map((f) => {
    try {
      return readFileSync(join("src/routes", f), "utf8");
    } catch {
      return "";
    }
  });
  let components: string[] = [];
  try {
    components = readdirSync(SITE_DIR)
      .filter((f) => f.endsWith(".tsx"))
      .map((f) => readFileSync(join(SITE_DIR, f), "utf8"));
  } catch {
    components = [];
  }
  return [...routes, ...components].join("\n");
}

describe("public copy compliance", () => {
  const source = publicSource();

  it("never positions the product as an AI skin generator", () => {
    expect(source).not.toMatch(/ai (skin )?generator/i);
    expect(source).not.toMatch(/generate your skin/i);
  });

  it("never misspells genius", () => {
    expect(source).not.toMatch(/genious/i);
  });

  it("makes no turnaround promise", () => {
    expect(source).not.toMatch(/\b(24|48|72)[- ]hour/i);
    expect(source).not.toMatch(/same[- ]day|next[- ]day|delivered in \d/i);
  });

  it("claims no user counts or ratings", () => {
    expect(source).not.toMatch(/\d[\d,.]*\+? (users|creators|customers|players) /i);
    expect(source).not.toMatch(/\d(\.\d)? out of 5|★|⭐/);
  });

  it("carries no testimonials", () => {
    expect(source).not.toMatch(/testimonial/i);
  });

  it("claims no likeness fidelity", () => {
    expect(source).not.toMatch(/exact likeness|photo[- ]realistic|guaranteed likeness/i);
  });
});
