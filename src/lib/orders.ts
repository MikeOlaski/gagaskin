import { table } from "@/lib/db";
import type { Platform } from "@/lib/gate";

export type OrderStatus = "submitted" | "released" | "in_progress" | "delivered";
export type Actor = "customer" | "guardian" | "creator";

export interface SkinOrder {
  id: string;
  customerId: string;
  brief: string;
  referencePath: string | null;
  platform: Platform;
  priceIntent: string;
  status: OrderStatus;
  creatorId: string | null;
  deliveredProjectId: string | null;
  createdAt: string;
}

/** Who may move an order where. A submitted order is invisible to the creator
 *  until the guardian releases it; RLS enforces the same rule server-side and
 *  this is its client-side mirror. */
export function nextStatus(current: OrderStatus, actor: Actor): OrderStatus | null {
  if (actor === "guardian") return current === "submitted" ? "released" : null;
  if (actor === "creator") {
    if (current === "released") return "in_progress";
    if (current === "in_progress") return "delivered";
  }
  return null;
}

function fromRow(row: Record<string, unknown>): SkinOrder {
  return {
    id: row["id"] as string,
    customerId: row["customer_id"] as string,
    brief: row["brief"] as string,
    referencePath: (row["reference_path"] as string | null) ?? null,
    platform: row["platform"] as Platform,
    priceIntent: row["price_intent"] as string,
    status: row["status"] as OrderStatus,
    creatorId: (row["creator_id"] as string | null) ?? null,
    deliveredProjectId: (row["delivered_project_id"] as string | null) ?? null,
    createdAt: row["created_at"] as string,
  };
}

export async function submitOrder(input: {
  customerId: string;
  brief: string;
  referencePath: string | null;
  platform: Platform;
  priceIntent: string;
}): Promise<void> {
  const { error } = await table("skin_orders").insert({
    customer_id: input.customerId,
    brief: input.brief,
    reference_path: input.referencePath,
    platform: input.platform,
    price_intent: input.priceIntent,
  });
  if (error) throw new Error(error.message);
}

/** RLS decides what comes back: customers see their own, the guardian sees all,
 *  the creator sees only what was released to her. No client-side filter needed. */
export async function fetchOrders(): Promise<SkinOrder[]> {
  const { data, error } = await table("skin_orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(fromRow);
}

export async function releaseOrder(orderId: string, creatorId: string, guardianId: string) {
  const { error } = await table("skin_orders")
    .update({
      status: "released",
      creator_id: creatorId,
      released_at: new Date().toISOString(),
      released_by: guardianId,
    })
    .eq("id", orderId);
  if (error) throw new Error(error.message);
}

export async function setOrderStatus(orderId: string, status: OrderStatus) {
  const { error } = await table("skin_orders").update({ status }).eq("id", orderId);
  if (error) throw new Error(error.message);
}

export async function deliverOrder(orderId: string, projectId: string) {
  const { error } = await table("skin_orders")
    .update({ status: "delivered", delivered_project_id: projectId })
    .eq("id", orderId);
  if (error) throw new Error(error.message);
}
