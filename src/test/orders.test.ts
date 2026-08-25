import { describe, expect, it } from "vitest";

import { nextStatus } from "@/lib/orders";

describe("order status transitions", () => {
  it("lets the guardian release a submitted order", () => {
    expect(nextStatus("submitted", "guardian")).toBe("released");
  });

  it("does not let the creator touch a submitted order", () => {
    expect(nextStatus("submitted", "creator")).toBeNull();
  });

  it("lets the creator start a released order", () => {
    expect(nextStatus("released", "creator")).toBe("in_progress");
  });

  it("lets the creator deliver an order in progress", () => {
    expect(nextStatus("in_progress", "creator")).toBe("delivered");
  });

  it("ends at delivered", () => {
    expect(nextStatus("delivered", "creator")).toBeNull();
    expect(nextStatus("delivered", "guardian")).toBeNull();
  });

  it("gives a customer no transitions at all", () => {
    expect(nextStatus("submitted", "customer")).toBeNull();
    expect(nextStatus("released", "customer")).toBeNull();
    expect(nextStatus("in_progress", "customer")).toBeNull();
  });
});
