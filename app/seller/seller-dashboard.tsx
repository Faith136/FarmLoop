"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createSellerListing,
  deleteSellerListing,
  updateSellerListingStatus,
  type SellerActionResult,
} from "@/app/seller/actions";
import { MARKETPLACE_CATEGORIES } from "@/lib/domain/marketplace";
import type {
  CatalogueProductRow,
  OrderRow,
  SellerListingRow,
} from "@/lib/supabase/database.types";
import { OrderList } from "@/components/orders/order-list";

interface SellerDashboardProps {
  isAdmin: boolean;
  products: CatalogueProductRow[];
  listings: SellerListingRow[];
  orders: OrderRow[];
};

const fieldClass =
  "mt-1.5 h-11 w-full rounded-xl border border-[#dfe6dc] bg-white px-3 text-sm text-[#2d4532] outline-none focus:border-[#8eaa83] focus:ring-4 focus:ring-[#e9f0e5]";

export function SellerDashboard({ isAdmin, products, listings, orders }: SellerDashboardProps) {
  const router = useRouter();
  const [notice, setNotice] = useState<SellerActionResult>({});
  const [isPending, startTransition] = useTransition();
  const productsById = new Map(products.map((product) => [product.id, product]));
  const activeProducts = products.filter((product) => product.is_active);

  function run(action: (formData: FormData) => Promise<SellerActionResult>, formData: FormData) {
    setNotice({});
    startTransition(async () => {
      const result = await action(formData);
      setNotice(result);
      if (result.success) router.refresh();
    });
  }

  function submit(
    event: React.FormEvent<HTMLFormElement>,
    action: (formData: FormData) => Promise<SellerActionResult>,
  ) {
    event.preventDefault();
    run(action, new FormData(event.currentTarget));
  }

  return (
    <div className="space-y-8">
      {notice.error && (
        <p aria-live="polite" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{notice.error}</p>
      )}
      {notice.success && (
        <p aria-live="polite" className="rounded-xl bg-[#edf4e9] px-4 py-3 text-sm text-[#315c3b]">{notice.success}</p>
      )}

      {!isAdmin && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Link className="rounded-2xl border border-[#e4e9e1] bg-white p-4 transition hover:border-[#cbd8c5]" href="/messages">
            <p className="text-sm font-semibold text-[#315c3b]">Messages</p>
            <p className="mt-1 text-xs text-[#778278]">Open private conversations with buyers.</p>
          </Link>
          <Link className="rounded-2xl border border-[#e4e9e1] bg-white p-4 transition hover:border-[#cbd8c5]" href="/notifications">
            <p className="text-sm font-semibold text-[#315c3b]">Notifications</p>
            <p className="mt-1 text-xs text-[#778278]">See new order requests and messages.</p>
          </Link>
        </div>
      )}

      {!isAdmin && (
        <section aria-labelledby="seller-order-requests">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[#2d4532]" id="seller-order-requests">Order requests</h2>
              <p className="mt-1 text-sm text-[#778278]">Accept, decline, or propose a change. Stock is reserved only after acceptance.</p>
            </div>
            <span className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-[#59695d] ring-1 ring-[#e3e9df]">{orders.length} total</span>
          </div>
          <OrderList emptyMessage="New buyer requests will appear here." orders={orders} viewerRole="seller" />
        </section>
      )}

      {!isAdmin && <section className="rounded-2xl border border-[#e4e9e1] bg-white p-5 sm:p-7">
        <h2 className="text-xl font-semibold text-[#2d4532]">Add a product listing</h2>
        <p className="mt-1 text-sm leading-6 text-[#778278]">
          Choose a product from the shared catalogue. Published listings appear in the marketplace.
        </p>
        {activeProducts.length === 0 ? (
          <p className="mt-5 rounded-xl bg-[#f7f8f3] p-4 text-sm text-[#667468]">
            The product catalogue is empty. An administrator needs to add products before you can list an item.
          </p>
        ) : (
          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={(event) => submit(event, createSellerListing)}>
            <label className="text-sm font-medium text-[#405847] sm:col-span-2">
              Catalogue product
              <select className={fieldClass} name="productId" required>
                <option value="">Select a product</option>
                {activeProducts.map((product) => (
                  <option key={product.id} value={product.id}>{product.name} · {product.category}</option>
                ))}
              </select>
            </label>
            <label className="text-sm font-medium text-[#405847]">
              Quantity
              <input className={fieldClass} min="0.01" name="quantity" required step="any" type="number" />
            </label>
            <label className="text-sm font-medium text-[#405847]">
              Unit
              <select className={fieldClass} defaultValue="kg" name="unit">
                <option value="kg">Kilograms</option>
                <option value="tonne">Tonnes</option>
                <option value="bag">Bags</option>
              </select>
            </label>
            <label className="text-sm font-medium text-[#405847]">
              Price per unit (KSh)
              <input className={fieldClass} min="0" name="price" required step="0.01" type="number" />
            </label>
            <label className="text-sm font-medium text-[#405847]">
              Location
              <input className={fieldClass} maxLength={120} name="location" required />
            </label>
            <label className="text-sm font-medium text-[#405847] sm:col-span-2">
              Condition
              <input className={fieldClass} maxLength={240} name="condition" required />
            </label>
            <label className="text-sm font-medium text-[#405847]">
              Available from
              <input className={fieldClass} name="availableFrom" required type="date" />
            </label>
            <label className="text-sm font-medium text-[#405847]">
              Available until
              <input className={fieldClass} name="availableUntil" required type="date" />
            </label>
            <button className="min-h-11 rounded-full bg-[#315c3b] px-5 text-sm font-semibold text-white hover:bg-[#24492e] disabled:opacity-60 sm:col-span-2 sm:justify-self-start" disabled={isPending} type="submit">
              {isPending ? "Saving…" : "Publish listing"}
            </button>
          </form>
        )}
      </section>}

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#2d4532]">
              {isAdmin ? "All seller listings" : "Your listings"}
            </h2>
            <p className="mt-1 text-sm text-[#778278]">
              {isAdmin
                ? "Review and manage listings across seller accounts."
                : "Manage your offers and their marketplace visibility."}
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-[#59695d] ring-1 ring-[#e3e9df]">
            {listings.length} total
          </span>
        </div>
        {listings.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-[#d8e1d4] bg-white/70 px-6 py-10 text-center text-sm text-[#778278]">
            {isAdmin ? "There are no seller listings yet." : "You haven’t published any listings yet."}
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {listings.map((listing) => {
              const product = productsById.get(listing.product_id);
              return (
                <article className="flex flex-col gap-4 rounded-2xl border border-[#e4e9e1] bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5" key={listing.id}>
                  <div>
                    <h3 className="font-semibold text-[#2d4532]">{product?.name ?? "Catalogue product"}</h3>
                    <p className="mt-1 text-sm text-[#778278]">
                      {listing.quantity_available.toLocaleString()} {listing.unit} · KSh {listing.price_per_unit.toLocaleString()} / {listing.unit} · {listing.location}
                    </p>
                    {isAdmin && (
                      <p className="mt-1 text-xs text-[#778278]">Seller: {listing.seller_name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      aria-label={`Status for ${product?.name ?? "listing"}`}
                      className="h-10 rounded-xl border border-[#dfe6dc] bg-white px-3 text-sm capitalize text-[#405847]"
                      disabled={isPending}
                      onChange={(event) => {
                        const formData = new FormData();
                        formData.set("listingId", listing.id);
                        formData.set("status", event.target.value);
                        run(updateSellerListingStatus, formData);
                      }}
                      value={listing.status}
                    >
                      {(["active", "paused", "sold_out"] as const).map((status) => (
                        <option key={status} value={status}>{status.replace("_", " ")}</option>
                      ))}
                    </select>
                    <button
                      className="min-h-10 rounded-xl border border-[#ead8d5] px-3 text-sm font-medium text-[#934b42] hover:bg-red-50 disabled:opacity-60"
                      disabled={isPending}
                      onClick={() => {
                        const formData = new FormData();
                        formData.set("listingId", listing.id);
                        run(deleteSellerListing, formData);
                      }}
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <p className="text-xs text-[#89948a]">
        Categories available: {MARKETPLACE_CATEGORIES.join(", ")}.
      </p>
    </div>
  );
}
