import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { SiteHeader } from "@/components/site-header";
import { OrderList } from "@/components/orders/order-list";
import { requireRole } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Buyer workspace | FarmLoop",
  description: "Track order requests, seller proposals, and accepted orders.",
};

async function BuyerWorkspace() {
  await connection();
  const { supabase, user, profile } = await requireRole("buyer");
  const [ordersResult, notificationsResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id, listing_id, product_id, buyer_id, seller_id, buyer_name, seller_name, product_name, unit, requested_quantity, unit_price, estimated_total, buyer_message, seller_message, status, proposed_quantity, proposed_unit_price, confirmed_at, created_at, updated_at")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null),
  ]);
  if (ordersResult.error) throw new Error(`Could not load your order requests: ${ordersResult.error.message}`);
  if (notificationsResult.error) throw new Error(`Could not load your notifications: ${notificationsResult.error.message}`);

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <Link className="rounded-2xl border border-[#e4e9e1] bg-white p-4 transition hover:border-[#cbd8c5]" href="/marketplace">
          <p className="text-sm font-semibold text-[#315c3b]">Browse marketplace</p>
          <p className="mt-1 text-xs text-[#778278]">Find available farm products.</p>
        </Link>
        <Link className="rounded-2xl border border-[#e4e9e1] bg-white p-4 transition hover:border-[#cbd8c5]" href="/messages">
          <p className="text-sm font-semibold text-[#315c3b]">Messages</p>
          <p className="mt-1 text-xs text-[#778278]">Chat privately about accepted orders.</p>
        </Link>
        <Link className="rounded-2xl border border-[#e4e9e1] bg-white p-4 transition hover:border-[#cbd8c5]" href="/notifications">
          <p className="text-sm font-semibold text-[#315c3b]">Notifications</p>
          <p className="mt-1 text-xs text-[#778278]">{notificationsResult.count ?? 0} unread updates.</p>
        </Link>
      </div>

      <section aria-labelledby="buyer-orders">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[#2d4532]" id="buyer-orders">My order requests</h2>
            <p className="mt-1 text-sm text-[#778278]">Review seller responses, agree proposals, and track collection.</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-[#59695d] ring-1 ring-[#e3e9df]">{ordersResult.data.length} total</span>
        </div>
        <OrderList
          emptyMessage="You haven’t requested an order yet. Browse the marketplace to find a product."
          orders={ordersResult.data}
          viewerRole="buyer"
        />
      </section>
      <p className="text-xs text-[#89948a]">Signed in as {profile.display_name}. Order requests are not purchases until the seller accepts.</p>
    </div>
  );
}

export default function BuyerPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-7 sm:py-10 lg:px-12">
        <header className="mb-8 border-b border-[#e3e9df] pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#78916c]">Buyer workspace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#213d2b] sm:text-4xl">Your orders and conversations</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#68766b] sm:text-base">Track your order requests and coordinate accepted orders directly with sellers.</p>
        </header>
        <Suspense fallback={<p className="text-sm text-[#778278]">Loading your buyer workspace…</p>}>
          <BuyerWorkspace />
        </Suspense>
      </main>
    </div>
  );
}
