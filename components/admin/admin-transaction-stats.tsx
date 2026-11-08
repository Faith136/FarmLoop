import Link from "next/link";
import type { OrderRow, Profile } from "@/lib/supabase/database.types";

export function isConfirmedOrder(order: Pick<OrderRow, "status">) {
  return (
    order.status === "accepted" ||
    order.status === "ready_for_collection" ||
    order.status === "completed"
  );
}

export function AdminTransactionStats({
  orders,
  profiles,
}: {
  orders: OrderRow[];
  profiles: Profile[];
}) {
  const confirmedOrders = orders.filter(isConfirmedOrder);
  const completedOrders = confirmedOrders.filter((order) => order.status === "completed");
  const quantityByUnit = new Map<string, number>();
  const activeSellerIds = new Set(
    profiles
      .filter((profile) => profile.role === "seller" && !profile.is_suspended)
      .map((profile) => profile.id),
  );
  const sellerIds = new Set<string>();
  const buyerIds = new Set<string>();
  let totalValue = 0;

  for (const order of confirmedOrders) {
    quantityByUnit.set(
      order.unit,
      (quantityByUnit.get(order.unit) ?? 0) + order.requested_quantity,
    );
    if (activeSellerIds.has(order.seller_id)) sellerIds.add(order.seller_id);
    buyerIds.add(order.buyer_id);
    totalValue += order.estimated_total;
  }

  const quantities = [...quantityByUnit.entries()]
    .map(([unit, quantity]) => `${quantity.toLocaleString("en-KE")} ${unit}${quantity === 1 ? "" : "s"}`)
    .join(" · ") || "0";
  const stats = [
    { label: "Confirmed orders", value: confirmedOrders.length.toLocaleString("en-KE") },
    { label: "Completed transactions", value: completedOrders.length.toLocaleString("en-KE") },
    { label: "Quantity traded", value: quantities },
    { label: "Sellers with sales", value: sellerIds.size.toLocaleString("en-KE") },
    { label: "Buyers with orders", value: buyerIds.size.toLocaleString("en-KE") },
    { label: "Confirmed transaction value", value: `KSh ${totalValue.toLocaleString("en-KE", { maximumFractionDigits: 2 })}` },
  ];

  return (
    <section aria-label="Orders and transactions" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#2d4532]">Orders & transactions</h2>
          <p className="mt-1 text-sm text-[#778278]">Read-only overview of confirmed marketplace activity.</p>
        </div>
        <Link className="text-sm font-semibold text-[#315c3b] underline underline-offset-4" href="/admin/orders">
          View transaction report
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <article className="min-w-0 rounded-2xl border border-[#e4e9e1] bg-white p-4 sm:p-5" key={stat.label}>
            <p className="text-sm font-medium text-[#778278]">{stat.label}</p>
            <p className="mt-2 wrap-break-word text-2xl font-semibold tabular-nums text-[#315c3b]">{stat.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
