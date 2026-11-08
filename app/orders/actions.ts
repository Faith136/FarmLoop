"use server";

import { revalidatePath } from "next/cache";
import { requireRole, requireUser } from "@/lib/auth/server";

export interface OrderActionResult {
  error?: string;
  success?: string;
}

function formValue(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function orderId(formData: FormData) {
  return formValue(formData, "orderId");
}

function revalidateOrderViews() {
  revalidatePath("/orders");
  revalidatePath("/seller");
  revalidatePath("/buyer");
  revalidatePath("/messages");
  revalidatePath("/notifications");
  revalidatePath("/marketplace");
}

export async function createOrderRequest(formData: FormData): Promise<OrderActionResult> {
  const { supabase } = await requireRole("buyer");
  const listingId = formValue(formData, "listingId");
  const quantity = Number(formData.get("quantity"));
  const message = formValue(formData, "message");

  if (!listingId || !Number.isFinite(quantity) || quantity <= 0) {
    return { error: "Enter a quantity greater than zero." };
  }
  if (message.length > 1000) {
    return { error: "Your message must be 1000 characters or fewer." };
  }

  const { error } = await supabase.rpc("create_order_request", {
    p_listing_id: listingId,
    p_quantity: quantity,
    p_message: message || null,
  });
  if (error) {
    return { error: `Could not send your order request: ${error.message}` };
  }

  revalidateOrderViews();
  return { success: "Your request was sent. The seller will respond in your orders." };
}

export async function acceptOrderRequest(formData: FormData): Promise<OrderActionResult> {
  const { supabase } = await requireRole("seller");
  const id = orderId(formData);
  if (!id) return { error: "Choose an order request to accept." };

  const { error } = await supabase.rpc("accept_order_request", { p_order_id: id });
  if (error) return { error: `Could not accept this order request: ${error.message}` };

  revalidateOrderViews();
  return { success: "Order accepted and quantity reserved." };
}

export async function rejectOrderRequest(formData: FormData): Promise<OrderActionResult> {
  const { supabase } = await requireRole("seller");
  const id = orderId(formData);
  const explanation = formValue(formData, "explanation");
  if (!id) return { error: "Choose an order request to decline." };
  if (explanation.length > 1000) {
    return { error: "The explanation must be 1000 characters or fewer." };
  }

  const { error } = await supabase.rpc("reject_order_request", {
    p_order_id: id,
    p_explanation: explanation || null,
  });
  if (error) return { error: `Could not decline this order request: ${error.message}` };

  revalidateOrderViews();
  return { success: "Order request declined." };
}

export async function proposeOrderChange(formData: FormData): Promise<OrderActionResult> {
  const { supabase } = await requireRole("seller");
  const id = orderId(formData);
  const quantity = Number(formData.get("quantity"));
  const unitPrice = Number(formData.get("unitPrice"));
  const message = formValue(formData, "message");
  if (!id || !Number.isFinite(quantity) || quantity <= 0) {
    return { error: "Enter a proposed quantity greater than zero." };
  }
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    return { error: "Enter a valid proposed price." };
  }
  if (message.length > 1000) {
    return { error: "The message must be 1000 characters or fewer." };
  }

  const { error } = await supabase.rpc("propose_order_change", {
    p_order_id: id,
    p_quantity: quantity,
    p_unit_price: unitPrice,
    p_message: message || null,
  });
  if (error) return { error: `Could not propose a change: ${error.message}` };

  revalidateOrderViews();
  return { success: "Your proposal was sent to the buyer." };
}

export async function respondToOrderProposal(
  formData: FormData,
): Promise<OrderActionResult> {
  const { supabase } = await requireRole("buyer");
  const id = orderId(formData);
  const accept = formValue(formData, "accept") === "true";
  if (!id) return { error: "Choose an order proposal to respond to." };

  const { error } = await supabase.rpc("respond_to_order_proposal", {
    p_order_id: id,
    p_accept: accept,
  });
  if (error) {
    return { error: `Could not respond to the seller's proposal: ${error.message}` };
  }

  revalidateOrderViews();
  return {
    success: accept
      ? "Proposal accepted. The agreed quantity is reserved."
      : "Proposal declined.",
  };
}

export async function updateOrderFulfillmentStatus(
  formData: FormData,
): Promise<OrderActionResult> {
  const { supabase } = await requireRole("seller");
  const id = orderId(formData);
  const status = formValue(formData, "status");
  if (!id || (status !== "ready_for_collection" && status !== "completed")) {
    return { error: "Choose a valid order and fulfillment status." };
  }

  const { error } = await supabase.rpc("set_order_fulfillment_status", {
    p_order_id: id,
    p_status: status,
  });
  if (error) return { error: `Could not update the order: ${error.message}` };

  revalidateOrderViews();
  return { success: "Order status updated and the buyer was notified." };
}

export async function markNotificationRead(
  notificationId: string,
): Promise<OrderActionResult> {
  const { supabase, user } = await requireUser();
  if (!notificationId) return { error: "Choose a notification." };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("user_id", user.id);
  if (error) return { error: `Could not mark the notification as read: ${error.message}` };

  revalidatePath("/notifications");
  return { success: "Notification marked as read." };
}
