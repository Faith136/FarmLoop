import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminDashboard } from "@/app/admin/admin-dashboard";
import { AdminLayout } from "@/app/admin/admin-layout";
import { requireRole } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Product catalogue | FarmLoop",
  description: "Manage the shared FarmLoop product catalogue.",
};

async function CatalogueManager() {
  const { supabase } = await requireRole("admin");
  const { data: products, error } = await supabase
    .from("catalogue_products")
    .select("id, name, category, description, icon, is_active, created_at")
    .order("name");

  if (error) {
    throw new Error(`Could not load the product catalogue: ${error.message}`);
  }

  return (
    <AdminDashboard
      adminActions={[]}
      catalogueOnly
      listings={[]}
      products={products}
      profiles={[]}
    />
  );
}

export default function AdminCataloguePage() {
  return (
    <AdminLayout
      description="Add, edit, and control products in the shared marketplace catalogue."
      title="Product catalogue"
    >
      <Suspense fallback={<p className="text-sm text-[#778278]">Loading catalogue…</p>}>
        <CatalogueManager />
      </Suspense>
    </AdminLayout>
  );
}
