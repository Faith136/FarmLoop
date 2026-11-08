import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { AdminDashboard } from "@/app/admin/admin-dashboard";
import { AdminLayout } from "@/app/admin/admin-layout";
import { requireRole } from "@/lib/auth/server";
import { getAllConfirmedOrders } from "@/lib/data/admin-orders";

export const metadata: Metadata = {
  title: "Admin dashboard | FarmLoop",
  description: "Marketplace statistics and administrator activity.",
};

async function AdminOverview() {
  await connection();
  const { supabase } = await requireRole("admin");
  const [profilesResult, productsResult, listingsResult, actionsResult, orders] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name, email, role, is_suspended, last_login_at, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("catalogue_products")
        .select("id, name, category, description, icon, is_active, created_at")
        .order("name"),
      supabase
        .from("seller_listings")
        .select("id, seller_id, seller_name, product_id, quantity_available, unit, price_per_unit, location, condition, available_from, available_until, status, created_at, updated_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("admin_action_log")
        .select("id, actor_id, action, target_type, target_id, occurred_at")
        .order("occurred_at", { ascending: false })
        .limit(12),
      getAllConfirmedOrders(supabase),
    ]);

  if (profilesResult.error) {
    throw new Error(`Could not load account activity: ${profilesResult.error.message}`);
  }
  if (productsResult.error) {
    throw new Error(`Could not load the product catalogue: ${productsResult.error.message}`);
  }
  if (listingsResult.error) {
    throw new Error(`Could not load seller listings: ${listingsResult.error.message}`);
  }
  if (actionsResult.error) {
    throw new Error(`Could not load admin action history: ${actionsResult.error.message}`);
  }
  return (
    <AdminDashboard
      adminActions={actionsResult.data}
      listings={listingsResult.data}
      orders={orders}
      products={productsResult.data}
      profiles={profilesResult.data}
    />
  );
}

export default function AdminDashboardPage() {
  return (
    <AdminLayout
      description="Monitor marketplace activity and recent administrator actions."
      title="Marketplace overview"
    >
      <Suspense fallback={<p className="text-sm text-[#778278]">Loading marketplace activity…</p>}>
        <AdminOverview />
      </Suspense>
    </AdminLayout>
  );
}
