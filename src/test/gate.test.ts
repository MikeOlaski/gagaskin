import { describe, expect, it } from "vitest";

import {
  parseOfferParam,
  parsePlatform,
  resolveGateMode,
  signupMetadata,
} from "@/lib/gate";

describe("gate mode", () => {
  it("opens registration when capacity remains", () => {
    expect(resolveGateMode(true)).toBe("register");
  });

  it("falls back to the waitlist when full", () => {
    expect(resolveGateMode(false)).toBe("waitlist");
  });

  it("falls back to the waitlist when capacity is unknown", () => {
    expect(resolveGateMode(null)).toBe("waitlist");
  });
});

describe("offer attribution", () => {
  it("keeps a real offer id", () => {
    expect(parseOfferParam("custom")).toBe("custom");
  });

  it("degrades anything else to unknown rather than throwing", () => {
    expect(parseOfferParam("personal")).toBe("unknown");
    expect(parseOfferParam(undefined)).toBe("unknown");
    expect(parseOfferParam("")).toBe("unknown");
    expect(parseOfferParam("<script>")).toBe("unknown");
  });
});

describe("platform", () => {
  it("accepts the three known values", () => {
    expect(parsePlatform("java")).toBe("java");
    expect(parsePlatform("bedrock")).toBe("bedrock");
    expect(parsePlatform("unsure")).toBe("unsure");
  });

  it("degrades anything else to unsure", () => {
    expect(parsePlatform("switch")).toBe("unsure");
    expect(parsePlatform(null)).toBe("unsure");
  });
});

describe("signup metadata", () => {
  it("carries offer and platform through to the auth trigger", () => {
    expect(signupMetadata("build", "java")).toEqual({
      source_offer: "build",
      platform: "java",
    });
  });

  it("never emits keys the profiles CHECK constraint would reject", () => {
    const meta = signupMetadata("nonsense" as never, "nonsense" as never);
    expect(meta.source_offer).toBe("unknown");
    expect(meta.platform).toBe("unsure");
  });
});
