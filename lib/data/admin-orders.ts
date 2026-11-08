import type { OrderRow } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

const ORDER_SELECT =
  "id, listing_id, product_id, buyer_id, seller_id, buyer_name, seller_name, product_name, unit, requested_quantity, unit_price, estimated_total, buyer_message, seller_message, status, proposed_quantity, proposed_unit_price, confirmed_at, created_at, updated_at";
const PAGE_SIZE = 1000;

export async function getAllConfirmedOrders(
  supabase: SupabaseClient<Database>,
): Promise<OrderRow[]> {
  const orders: OrderRow[] = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("orders")
      .select(ORDER_SELECT)
      .in("status", ["accepted", "ready_for_collection", "completed"])
      .order("confirmed_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Could not load confirmed transactions: ${error.message}`);
    }

    orders.push(...data);
    if (data.length < PAGE_SIZE) return orders;
  }
}
