"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AdminTransactionStats, isConfirmedOrder } from "@/components/admin/admin-transaction-stats";
import type { CatalogueProductRow, OrderRow, Profile } from "@/lib/supabase/database.types";

const fieldClass =
  "h-11 w-full rounded-xl border border-[#dfe6dc] bg-white px-3 text-sm text-[#2d4532] outline-none focus:border-[#8eaa83] focus:ring-4 focus:ring-[#e9f0e5]";

function statusStyle(status: OrderRow["status"]) {
  if (status === "completed") return "bg-[#edf4e9] text-[#315c3b]";
  if (status === "accepted" || status === "ready_for_collection") return "bg-blue-50 text-blue-800";
  return "bg-[#f3f6f0] text-[#667468]";
}

function summarizeActivity(orders: OrderRow[], participantKey: "seller_id" | "buyer_id") {
  const summaries = new Map<string, {
    id: string;
    name: string;
    orderCount: number;
    totalValue: number;
    products: Set<string>;
    quantities: Map<string, number>;
  }>();

  for (const order of orders) {
    const id = order[participantKey];
    let summary = summaries.get(id);
    if (!summary) {
      summary = {
        id,
        name: participantKey === "seller_id" ? order.seller_name : order.buyer_name,
        orderCount: 0,
        totalValue: 0,
        products: new Set<string>(),
        quantities: new Map<string, number>(),
      };
      summaries.set(id, summary);
    }
    summary.orderCount += 1;
    summary.totalValue += order.estimated_total;
    summary.products.add(order.product_name);
    summary.quantities.set(
      order.unit,
      (summary.quantities.get(order.unit) ?? 0) + order.requested_quantity,
    );
  }

  return [...summaries.values()].sort((a, b) => b.totalValue - a.totalValue);
}

function formatQuantities(quantities: Map<string, number>) {
  return [...quantities.entries()]
    .map(([unit, quantity]) => `${quantity.toLocaleString("en-KE")} ${unit}${quantity === 1 ? "" : "s"}`)
    .join(" · ");
}

export function AdminOrdersReport({
  orders,
  products,
  profiles,
  initialSellerId = "",
  initialBuyerId = "",
}: {
  orders: OrderRow[];
  products: CatalogueProductRow[];
  profiles: Profile[];
  initialSellerId?: string;
  initialBuyerId?: string;
}) {
  const [search, setSearch] = useState("");
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState("");
  const [sellerId, setSellerId] = useState(initialSellerId);
  const [buyerId, setBuyerId] = useState(initialBuyerId);
  const [dateFrom, setDateFrom] = useState("");
  const [dateUntil, setDateUntil] = useState("");
  const confirmedOrders = useMemo(() => orders.filter(isConfirmedOrder), [orders]);
  const productsById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );
  const sellersById = useMemo(
    () => new Map(profiles.filter((profile) => profile.role === "seller").map((profile) => [profile.id, profile])),
    [profiles],
  );
  const buyersById = useMemo(
    () => new Map(profiles.filter((profile) => profile.role === "buyer").map((profile) => [profile.id, profile])),
    [profiles],
  );

  const sellers = useMemo(
    () => [...new Map(confirmedOrders.map((order) => [order.seller_id, order.seller_name])).entries()]
      .sort((a, b) => a[1].localeCompare(b[1])),
    [confirmedOrders],
  );
  const buyers = useMemo(
    () => [...new Map(confirmedOrders.map((order) => [order.buyer_id, order.buyer_name])).entries()]
      .sort((a, b) => a[1].localeCompare(b[1])),
    [confirmedOrders],
  );
  const sellerActivity = useMemo(() => summarizeActivity(confirmedOrders, "seller_id"), [confirmedOrders]);
  const buyerActivity = useMemo(() => summarizeActivity(confirmedOrders, "buyer_id"), [confirmedOrders]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return confirmedOrders.filter((order) => {
      const product = productsById.get(order.product_id);
      const matchesSearch =
        !query ||
        order.id.toLocaleLowerCase().includes(query) ||
        order.buyer_name.toLocaleLowerCase().includes(query) ||
        order.seller_name.toLocaleLowerCase().includes(query);
      const confirmationDate = order.confirmed_at?.slice(0, 10) ?? "";
      return (
        matchesSearch &&
        (!productId || order.product_id === productId) &&
        (!status || order.status === status) &&
        (!sellerId || order.seller_id === sellerId) &&
        (!buyerId || order.buyer_id === buyerId) &&
        (!dateFrom || confirmationDate >= dateFrom) &&
        (!dateUntil || confirmationDate <= dateUntil) &&
        Boolean(product)
      );
    });
  }, [buyerId, confirmedOrders, dateFrom, dateUntil, productsById, productId, search, sellerId, status]);

  function clearFilters() {
    setSearch("");
    setProductId("");
    setStatus("");
    setSellerId("");
    setBuyerId("");
    setDateFrom("");
    setDateUntil("");
  }

  return (
    <div className="space-y-8">
      <AdminTransactionStats orders={confirmedOrders} profiles={profiles} />
      <section aria-label="Filter confirmed orders" className="rounded-2xl border border-[#e4e9e1] bg-white p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="text-xs font-semibold text-[#667468] sm:col-span-2">
            Search order ID, buyer, or seller
            <input className={`${fieldClass} mt-1.5`} onChange={(event) => setSearch(event.target.value)} placeholder="Search confirmed orders" type="search" value={search} />
          </label>
          <label className="text-xs font-semibold text-[#667468]">
            Product / waste type
            <select className={`${fieldClass} mt-1.5`} onChange={(event) => setProductId(event.target.value)} value={productId}>
              <option value="">All products</option>
              {products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.category}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-[#667468]">
            Order status
            <select className={`${fieldClass} mt-1.5`} onChange={(event) => setStatus(event.target.value)} value={status}>
              <option value="">All confirmed statuses</option>
              <option value="accepted">Accepted</option>
              <option value="ready_for_collection">Ready for collection</option>
              <option value="completed">Completed</option>
            </select>
          </label>
          <label className="text-xs font-semibold text-[#667468]">
            Seller
            <select className={`${fieldClass} mt-1.5`} onChange={(event) => setSellerId(event.target.value)} value={sellerId}>
              <option value="">All sellers</option>
              {sellers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-[#667468]">
            Buyer
            <select className={`${fieldClass} mt-1.5`} onChange={(event) => setBuyerId(event.target.value)} value={buyerId}>
              <option value="">All buyers</option>
              {buyers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold text-[#667468]">
            Confirmed from
            <input className={`${fieldClass} mt-1.5`} onChange={(event) => setDateFrom(event.target.value)} type="date" value={dateFrom} />
          </label>
          <label className="text-xs font-semibold text-[#667468]">
            Confirmed through
            <input className={`${fieldClass} mt-1.5`} onChange={(event) => setDateUntil(event.target.value)} type="date" value={dateUntil} />
          </label>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-sm text-[#778278]">
            Showing <span className="font-semibold text-[#405847]">{filteredOrders.length}</span> of {confirmedOrders.length} confirmed orders
          </p>
          <button className="text-sm font-semibold text-[#315c3b] underline underline-offset-4" onClick={clearFilters} type="button">Clear filters</button>
        </div>
      </section>

      <section aria-label="Confirmed orders" className="overflow-x-auto rounded-2xl border border-[#e4e9e1] bg-white">
        <table className="w-full min-w-262.5 text-left text-sm">
          <thead className="bg-[#f7f8f3] text-xs uppercase tracking-wide text-[#778278]">
            <tr>
              <th className="px-4 py-3 font-semibold">Order ID</th>
              <th className="px-4 py-3 font-semibold">Product / waste type</th>
              <th className="px-4 py-3 font-semibold">Quantity</th>
              <th className="px-4 py-3 font-semibold">Unit price</th>
              <th className="px-4 py-3 font-semibold">Total value</th>
              <th className="px-4 py-3 font-semibold">Seller</th>
              <th className="px-4 py-3 font-semibold">Buyer</th>
              <th className="px-4 py-3 font-semibold">Confirmed</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf0ea]">
            {filteredOrders.map((order) => {
              const seller = sellersById.get(order.seller_id);
              const buyer = buyersById.get(order.buyer_id);
              const product = productsById.get(order.product_id);
              return (
                <tr key={order.id}>
                  <td className="px-4 py-4">
                    <Link className="font-mono text-xs font-semibold text-[#315c3b] underline underline-offset-4" href={`/admin/orders/${order.id}`}>{order.id.slice(0, 8)}…</Link>
                  </td>
                  <td className="px-4 py-4">
                    <span className="block font-medium text-[#344a38]">{order.product_name}</span>
                    <span className="text-xs text-[#778278]">{product?.category ?? "Product"}</span>
                  </td>
                  <td className="px-4 py-4 text-[#667468]">{order.requested_quantity.toLocaleString("en-KE")} {order.unit}</td>
                  <td className="px-4 py-4 text-[#667468]">KSh {order.unit_price.toLocaleString("en-KE")}</td>
                  <td className="px-4 py-4 font-medium text-[#344a38]">KSh {order.estimated_total.toLocaleString("en-KE")}</td>
                  <td className="px-4 py-4">
                    <Link className="text-[#315c3b] underline underline-offset-4" href={`/admin/users/${order.seller_id}`}>{seller?.display_name ?? order.seller_name}</Link>
                  </td>
                  <td className="px-4 py-4">
                    <Link className="text-[#315c3b] underline underline-offset-4" href={`/admin/users/${order.buyer_id}`}>{buyer?.display_name ?? order.buyer_name}</Link>
                  </td>
                  <td className="px-4 py-4 text-[#667468]">
                    {order.confirmed_at ? new Date(order.confirmed_at).toLocaleDateString("en-KE", { dateStyle: "medium" }) : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle(order.status)}`}>{order.status.replaceAll("_", " ")}</span>
                  </td>
                </tr>
              );
            })}
            {filteredOrders.length === 0 && (
              <tr><td className="px-5 py-10 text-center text-[#778278]" colSpan={9}>No confirmed orders match these filters.</td></tr>
            )}
          </tbody>
        </table>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-[#2d4532]">Seller sales activity</h2>
            <p className="mt-1 text-sm text-[#778278]">Confirmed sales, quantities, and transaction value by seller.</p>
          </div>
          <ActivityTable activity={sellerActivity} role="seller" />
        </section>
        <section>
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-[#2d4532]">Buyer purchase activity</h2>
            <p className="mt-1 text-sm text-[#778278]">Confirmed orders, quantities, and transaction value by buyer.</p>
          </div>
          <ActivityTable activity={buyerActivity} role="buyer" />
        </section>
      </div>
    </div>
  );
}

function ActivityTable({
  activity,
  role,
}: {
  activity: ReturnType<typeof summarizeActivity>;
  role: "buyer" | "seller";
}) {
  if (activity.length === 0) {
    return <p className="rounded-2xl border border-dashed border-[#d8e1d4] bg-white/70 px-4 py-8 text-center text-sm text-[#778278]">No confirmed activity yet.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-[#e4e9e1] bg-white">
      <table className="w-full min-w-140 text-left text-sm">
        <thead className="bg-[#f7f8f3] text-xs uppercase tracking-wide text-[#778278]">
          <tr>
            <th className="px-4 py-3 font-semibold">{role === "seller" ? "Seller" : "Buyer"}</th>
            <th className="px-4 py-3 font-semibold">Orders</th>
            <th className="px-4 py-3 font-semibold">Products / quantity</th>
            <th className="px-4 py-3 font-semibold">Transaction value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf0ea]">
          {activity.map((account) => (
            <tr key={account.id}>
              <td className="px-4 py-4">
                <Link className="font-semibold text-[#315c3b] underline underline-offset-4" href={`/admin/users/${account.id}`}>{account.name}</Link>
              </td>
              <td className="px-4 py-4 text-[#667468]">{account.orderCount}</td>
              <td className="px-4 py-4 text-[#667468]">
                <span className="block">{[...account.products].join(", ")}</span>
                <span className="mt-1 block text-xs text-[#89948a]">{formatQuantities(account.quantities)}</span>
              </td>
              <td className="px-4 py-4 font-medium text-[#344a38]">KSh {account.totalValue.toLocaleString("en-KE", { maximumFractionDigits: 2 })}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
