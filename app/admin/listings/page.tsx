import type { Metadata } from "next";
import { Suspense } from "react";
import { ListingStatusControl } from "@/components/admin/listing-status-control";
import { AdminLayout } from "@/app/admin/admin-layout";
import { requireRole } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Marketplace listings | FarmLoop",
  description: "Review and moderate seller marketplace listings.",
};

async function ListingsTable() {
  const { supabase } = await requireRole("admin");
  const [listingsResult, productsResult] = await Promise.all([
    supabase
      .from("seller_listings")
      .select("id, seller_id, seller_name, product_id, quantity_available, unit, price_per_unit, location, condition, available_from, available_until, status, created_at, updated_at")
      .order("created_at", { ascending: false }),
    supabase.from("catalogue_products").select("id, name"),
  ]);

  if (listingsResult.error) {
    throw new Error(`Could not load seller listings: ${listingsResult.error.message}`);
  }
  if (productsResult.error) {
    throw new Error(`Could not load catalogue products: ${productsResult.error.message}`);
  }

  const productNames = new Map(
    productsResult.data.map((product) => [product.id, product.name]),
  );

  return (
    <section aria-label="Seller listings" className="overflow-x-auto rounded-2xl border border-[#e4e9e1] bg-white">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-[#f7f8f3] text-xs uppercase tracking-wide text-[#778278]">
          <tr>
            <th className="px-5 py-3 font-semibold">Product</th>
            <th className="px-5 py-3 font-semibold">Seller</th>
            <th className="px-5 py-3 font-semibold">Quantity</th>
            <th className="px-5 py-3 font-semibold">Location</th>
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 font-semibold">Moderate listing</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf0ea]">
          {listingsResult.data.map((listing) => (
            <tr key={listing.id}>
              <td className="px-5 py-4 font-medium text-[#344a38]">
                {productNames.get(listing.product_id) ?? "Unknown product"}
              </td>
              <td className="px-5 py-4 text-[#667468]">
                <span className="block font-medium text-[#344a38]">{listing.seller_name}</span>
              </td>
              <td className="px-5 py-4 text-[#667468]">
                {listing.quantity_available} {listing.unit}
              </td>
              <td className="px-5 py-4 text-[#667468]">{listing.location}</td>
              <td className="px-5 py-4 capitalize text-[#667468]">{listing.status.replace("_", " ")}</td>
              <td className="px-5 py-4">
                <ListingStatusControl id={listing.id} status={listing.status} />
              </td>
            </tr>
          ))}
          {listingsResult.data.length === 0 && (
            <tr>
              <td className="px-5 py-10 text-center text-[#778278]" colSpan={6}>
                No seller listings yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

export default function AdminListingsPage() {
  return (
    <AdminLayout
      description="Review marketplace listings and moderate individual listings independently of seller accounts."
      title="Marketplace listings"
    >
      <Suspense fallback={<p className="text-sm text-[#778278]">Loading listings…</p>}>
        <ListingsTable />
      </Suspense>
    </AdminLayout>
  );
}
