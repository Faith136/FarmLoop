import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  OrderRow,
  OrderStatus,
} from "@/lib/supabase/database.types";

type ChatRole = "buyer" | "seller" | "admin";
type SupabaseServerClient = SupabaseClient<Database>;

const ORDER_SELECT =
  "id, listing_id, product_id, buyer_id, seller_id, buyer_name, seller_name, product_name, unit, requested_quantity, unit_price, estimated_total, buyer_message, seller_message, status, proposed_quantity, proposed_unit_price, confirmed_at, created_at, updated_at";

export type GetMyOrdersArguments = {
  status?: OrderStatus;
  limit?: number;
};

export type GetOrderDetailsArguments = {
  order_id: string;
};

export type CreateOrderRequestArguments = {
  listing_id: string;
  quantity: number;
  message?: string;
};

export type CancelOrderRequestArguments = {
  order_id: string;
};

export type RejectOrderRequestArguments = {
  order_id: string;
  reason?: string;
};

function parseObject(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    throw new Error("Invalid tool parameters.");
  }
  return value as Record<string, unknown>;
}

function parseId(value: unknown, field: "order_id" | "listing_id"): string {
  const args = parseObject(value);
  if (
    typeof args[field] !== "string" ||
    !args[field].trim()
  ) {
    throw new Error(`Invalid ${field.replace("_", " ")}.`);
  }
  return (args[field] as string).trim();
}

function parseLimit(value: unknown): number {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= 100
  ) {
    return value;
  }
  return 20;
}

export const getMyOrdersTool = {
  type: "function" as const,
  name: "get_my_orders",
  description:
    "View the authenticated buyer's or seller's orders. Buyers see their requests; sellers see orders involving their listings.",
  parameters: {
    type: "object" as const,
    properties: {
      status: {
        type: "string",
        enum: [
          "pending",
          "countered",
          "accepted",
          "rejected",
          "cancelled",
          "ready_for_collection",
          "completed",
        ],
        description: "Optional order status filter.",
      },
      limit: {
        type: "number",
        description: "Maximum orders to return, from 1 to 100.",
      },
    },
  },
};

export const getOrderDetailsTool = {
  type: "function" as const,
  name: "get_order_details",
  description:
    "Get verified details for one order that the user is allowed to view.",
  parameters: {
    type: "object" as const,
    properties: {
      order_id: {
        type: "string",
        description: "The order UUID.",
      },
    },
    required: ["order_id"],
  },
};

export const createOrderRequestTool = {
  type: "function" as const,
  name: "create_order_request",
  description:
    "Create a buyer order request for an active listing. This does not reserve stock or complete a purchase until the seller confirms it.",
  parameters: {
    type: "object" as const,
    properties: {
      listing_id: {
        type: "string",
        description: "The UUID of the active listing.",
      },
      quantity: {
        type: "number",
        description: "Requested quantity in the listing's unit.",
      },
      message: {
        type: "string",
        description: "Optional message to the seller, up to 1000 characters.",
      },
    },
    required: ["listing_id", "quantity"],
  },
};

export const cancelOrderRequestTool = {
  type: "function" as const,
  name: "cancel_order_request",
  description:
    "Cancel the buyer's eligible pending or countered order request.",
  parameters: {
    type: "object" as const,
    properties: {
      order_id: {
        type: "string",
        description: "The UUID of the order request.",
      },
    },
    required: ["order_id"],
  },
};

export const confirmOrderRequestTool = {
  type: "function" as const,
  name: "confirm_order_request",
  description:
    "Confirm a pending order request and reserve the requested quantity.",
  parameters: {
    type: "object" as const,
    properties: {
      order_id: {
        type: "string",
        description: "The UUID of the pending order.",
      },
    },
    required: ["order_id"],
  },
};

export const rejectOrderRequestTool = {
  type: "function" as const,
  name: "reject_order_request",
  description:
    "Reject a pending seller order request, optionally with a reason.",
  parameters: {
    type: "object" as const,
    properties: {
      order_id: {
        type: "string",
        description: "The UUID of the pending order.",
      },
      reason: {
        type: "string",
        description: "Optional rejection reason, up to 1000 characters.",
      },
    },
    required: ["order_id"],
  },
};

export const getAllOrdersTool = {
  type: "function" as const,
  name: "get_all_orders",
  description:
    "View platform orders. Admin access only.",
  parameters: {
    type: "object" as const,
    properties: {
      status: {
        type: "string",
        enum: [
          "pending",
          "countered",
          "accepted",
          "rejected",
          "cancelled",
          "ready_for_collection",
          "completed",
        ],
        description: "Optional order status filter.",
      },
      limit: {
        type: "number",
        description: "Maximum orders to return, from 1 to 100.",
      },
    },
  },
};

export const getOrderStatisticsTool = {
  type: "function" as const,
  name: "get_order_statistics",
  description:
    "View order totals and status counts across the platform. Admin access only.",
  parameters: {
    type: "object" as const,
    properties: {},
  },
};

export function getBuyerOrderTools() {
  return [
    getMyOrdersTool,
    getOrderDetailsTool,
    createOrderRequestTool,
    cancelOrderRequestTool,
  ];
}

export function getSellerOrderTools() {
  return [
    getMyOrdersTool,
    getOrderDetailsTool,
    confirmOrderRequestTool,
    rejectOrderRequestTool,
  ];
}

export function getAdminOrderTools() {
  return [
    getAllOrdersTool,
    getOrderDetailsTool,
    getOrderStatisticsTool,
  ];
}

function parseMyOrdersArguments(value: unknown): GetMyOrdersArguments {
  const args = parseObject(value);
  const validStatuses: OrderStatus[] = [
    "pending",
    "countered",
    "accepted",
    "rejected",
    "cancelled",
    "ready_for_collection",
    "completed",
  ];
  return {
    status:
      typeof args.status === "string" &&
      validStatuses.includes(args.status as OrderStatus)
        ? (args.status as OrderStatus)
        : undefined,
    limit: parseLimit(args.limit),
  };
}

export async function getMyOrders(
  supabase: SupabaseServerClient,
  userId: string,
  role: "buyer" | "seller",
  args: unknown
): Promise<OrderRow[]> {
  const parsed = parseMyOrdersArguments(args);
  let query = supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false })
    .limit(parsed.limit ?? 20);

  query =
    role === "buyer"
      ? query.eq("buyer_id", userId)
      : query.eq("seller_id", userId);
  if (parsed.status) query = query.eq("status", parsed.status);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load orders: ${error.message}`);
  return (data ?? []) as unknown as OrderRow[];
}

export async function getAllOrders(
  supabase: SupabaseServerClient,
  args: unknown
): Promise<OrderRow[]> {
  const parsed = parseMyOrdersArguments(args);
  let query = supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false })
    .limit(parsed.limit ?? 20);
  if (parsed.status) query = query.eq("status", parsed.status);

  const { data, error } = await query;
  if (error) throw new Error(`Could not load platform orders: ${error.message}`);
  return (data ?? []) as unknown as OrderRow[];
}

export async function getOrderDetails(
  supabase: SupabaseServerClient,
  userId: string,
  role: ChatRole,
  args: unknown
): Promise<unknown> {
  const orderId = parseId(args, "order_id");
  let query = supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", orderId);

  if (role === "buyer") query = query.eq("buyer_id", userId);
  if (role === "seller") query = query.eq("seller_id", userId);

  const { data: order, error } = await query.maybeSingle();
  if (error) throw new Error(`Could not load order: ${error.message}`);
  if (!order) return null;

  const { data: timeline, error: timelineError } = await supabase
    .from("order_timeline")
    .select("event_type, note, occurred_at")
    .eq("order_id", orderId)
    .order("occurred_at");
  if (timelineError) {
    throw new Error(`Could not load order timeline: ${timelineError.message}`);
  }

  return {
    ...(order as unknown as OrderRow),
    timeline: timeline ?? [],
  };
}

export async function getOrderStatistics(
  supabase: SupabaseServerClient
): Promise<unknown> {
  const { data, error } = await supabase
    .from("orders")
    .select("status, estimated_total");
  if (error) throw new Error(`Could not load order statistics: ${error.message}`);

  const rows = data ?? [];
  const counts: Record<string, number> = {};
  let estimatedTotal = 0;
  for (const row of rows) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
    estimatedTotal += Number(row.estimated_total) || 0;
  }
  return {
    total_orders: rows.length,
    estimated_total: estimatedTotal,
    counts_by_status: counts,
  };
}

export async function createOrderRequest(
  supabase: SupabaseServerClient,
  args: unknown
): Promise<{ order_id: string }> {
  const parsedArgs = parseObject(args);
  const listingId = parseId(args, "listing_id");
  const quantity = parsedArgs.quantity;
  const message =
    typeof parsedArgs.message === "string"
      ? parsedArgs.message.trim().slice(0, 1000)
      : null;

  if (
    typeof quantity !== "number" ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    throw new Error("Quantity must be greater than zero.");
  }

  const { data, error } = await supabase.rpc("create_order_request", {
    p_listing_id: listingId,
    p_quantity: quantity,
    p_message: message,
  });
  if (error) throw new Error(error.message);
  return { order_id: data };
}

export async function cancelOrderRequest(
  supabase: SupabaseServerClient,
  args: unknown
): Promise<{ order_id: string }> {
  const orderId = parseId(args, "order_id");
  const { data, error } = await supabase.rpc("cancel_order_request", {
    p_order_id: orderId,
  });
  if (error) throw new Error(error.message);
  return { order_id: data };
}

export async function confirmOrderRequest(
  supabase: SupabaseServerClient,
  args: unknown
): Promise<{ order_id: string }> {
  const orderId = parseId(args, "order_id");
  const { data, error } = await supabase.rpc("accept_order_request", {
    p_order_id: orderId,
  });
  if (error) throw new Error(error.message);
  return { order_id: data };
}

export async function rejectOrderRequest(
  supabase: SupabaseServerClient,
  args: unknown
): Promise<{ order_id: string }> {
  const orderId = parseId(args, "order_id");
  const parsed = parseObject(args);
  const reason =
    typeof parsed.reason === "string"
      ? parsed.reason.trim().slice(0, 1000)
      : null;
  const { data, error } = await supabase.rpc("reject_order_request", {
    p_order_id: orderId,
    p_explanation: reason,
  });
  if (error) throw new Error(error.message);
  return { order_id: data };
}
