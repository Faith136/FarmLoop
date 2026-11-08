import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { AdminLayout } from "@/app/admin/admin-layout";
import { AdminOrdersReport } from "@/components/admin/admin-orders-report";
import { requireRole } from "@/lib/auth/server";
import { getAllConfirmedOrders } from "@/lib/data/admin-orders";

export const metadata: Metadata = {
  title: "Orders & transactions | FarmLoop",
  description: "Read-only monitoring of confirmed FarmLoop orders and marketplace sales.",
};

interface AdminOrdersPageProps {
  searchParams: Promise<{ seller?: string; buyer?: string }>;
}

async function OrdersReport({ searchParams }: AdminOrdersPageProps) {
  await connection();
  const params = await searchParams;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const initialSellerId = params.seller && uuidPattern.test(params.seller) ? params.seller : "";
  const initialBuyerId = params.buyer && uuidPattern.test(params.buyer) ? params.buyer : "";
  const { supabase } = await requireRole("admin");
  const [orders, productsResult, profilesResult] = await Promise.all([
    getAllConfirmedOrders(supabase),
    supabase
      .from("catalogue_products")
      .select("id, name, category, description, icon, is_active, created_at")
      .order("name"),
    supabase
      .from("profiles")
      .select("id, display_name, email, role, is_suspended, last_login_at, created_at")
      .in("role", ["buyer", "seller"])
      .order("display_name"),
  ]);
  if (productsResult.error) throw new Error(`Could not load product details: ${productsResult.error.message}`);
  if (profilesResult.error) throw new Error(`Could not load buyer and seller profiles: ${profilesResult.error.message}`);

  return (
    <>
      <AdminOrdersReport
        initialBuyerId={initialBuyerId}
        initialSellerId={initialSellerId}
        orders={orders}
        products={productsResult.data}
        profiles={profilesResult.data}
      />
      <p className="mt-6 text-xs leading-5 text-[#89948a]">
        This report is read-only. Confirmed orders include accepted, ready for collection, and completed orders. Rejected and pending requests are excluded.
      </p>
    </>
  );
}

export default function AdminOrdersPage(props: AdminOrdersPageProps) {
  return (
    <AdminLayout
      activeSection="transactions"
      description="Monitor confirmed orders, seller sales, buyer purchases, and transaction value. This report does not modify order records."
      title="Orders & transactions"
    >
      <Suspense fallback={<p className="text-sm text-[#778278]">Loading transaction report…</p>}>
        <OrdersReport searchParams={props.searchParams} />
      </Suspense>
    </AdminLayout>
  );
}
