import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { SiteHeader } from "@/components/site-header";
import { requireRole } from "@/lib/auth/server";
import { SellerDashboard } from "@/app/seller/seller-dashboard";

export const metadata: Metadata = {
  title: "Seller | FarmLoop",
  description: "Seller workspace for the FarmLoop marketplace.",
};

async function SellerWorkspace() {
  await connection();
  const { supabase, user, profile } = await requireRole("seller");
  const [productsResult, listingsResult] = await Promise.all([
    supabase
      .from("catalogue_products")
      .select("id, name, category, description, icon, is_active, created_at")
      .order("name"),
    (profile.role === "admin"
      ? supabase
          .from("seller_listings")
          .select("id, seller_id, seller_name, seller_email, product_id, quantity_available, unit, price_per_unit, location, condition, available_from, available_until, status, created_at, updated_at")
      : supabase
      .from("seller_listings")
      .select("id, seller_id, seller_name, seller_email, product_id, quantity_available, unit, price_per_unit, location, condition, available_from, available_until, status, created_at, updated_at")
      .eq("seller_id", user.id))
      .order("created_at", { ascending: false }),
  ]);

  if (productsResult.error) {
    throw new Error(`Could not load the product catalogue: ${productsResult.error.message}`);
  }
  if (listingsResult.error) {
    throw new Error(`Could not load your listings: ${listingsResult.error.message}`);
  }

  return (
    <SellerDashboard
      isAdmin={profile.role === "admin"}
      listings={listingsResult.data}
      products={productsResult.data}
    />
  );
}

export default function SellerPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#78916c]">Seller workspace</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#213d2b] sm:text-5xl">Your products, in one place.</h1>
        <p className="mt-4 max-w-2xl leading-7 text-[#68766b]">
          Publish products from the shared catalogue, manage availability, and reach buyers in the marketplace.
        </p>
        <div className="mt-8">
          <Suspense fallback={<p className="text-sm text-[#778278]">Loading your seller workspace…</p>}>
            <SellerWorkspace />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
