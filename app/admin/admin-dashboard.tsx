"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createCatalogueProduct,
  setCatalogueProductActive,
  updateCatalogueProduct,
  type AdminActionResult,
} from "@/app/admin/actions";
import { MARKETPLACE_CATEGORIES } from "@/lib/domain/marketplace";
import type {
  AdminActionLogRow,
  CatalogueProductRow,
  Profile,
  SellerListingRow,
} from "@/lib/supabase/database.types";

interface AdminDashboardProps {
  profiles: Profile[];
  products: CatalogueProductRow[];
  listings: SellerListingRow[];
  adminActions: AdminActionLogRow[];
  catalogueOnly?: boolean;
}

const fieldClass =
  "mt-1.5 h-10 w-full rounded-lg border border-[#dfe6dc] bg-white px-3 text-sm text-[#2d4532] outline-none focus:border-[#8eaa83] focus:ring-4 focus:ring-[#e9f0e5]";

function formatLastLogin(value: string | null) {
  return value
    ? new Date(value).toLocaleDateString("en", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Never";
}

export function AdminDashboard({
  profiles,
  products,
  listings,
  adminActions,
  catalogueOnly = false,
}: AdminDashboardProps) {
  const router = useRouter();
  const [notice, setNotice] = useState<AdminActionResult>({});
  const [isPending, startTransition] = useTransition();
  const buyers = profiles.filter((profile) => profile.role === "buyer");
  const sellers = profiles.filter((profile) => profile.role === "seller");
  const signedInBuyers = buyers.filter((profile) => profile.last_login_at !== null);
  const suspendedAccounts = profiles.filter(
    (profile) => profile.is_suspended && profile.role !== "admin",
  );
  const activeListings = listings.filter((listing) => listing.status === "active");
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));
  const productsById = new Map(products.map((product) => [product.id, product]));
  const listingsById = new Map(listings.map((listing) => [listing.id, listing]));
  const listingsBySeller = new Map<string, number>();

  for (const listing of listings) {
    listingsBySeller.set(
      listing.seller_id,
      (listingsBySeller.get(listing.seller_id) ?? 0) + 1,
    );
  }

  function run(action: (formData: FormData) => Promise<AdminActionResult>, formData: FormData) {
    setNotice({});
    startTransition(async () => {
      const result = await action(formData);
      setNotice(result);
      if (result.success) router.refresh();
    });
  }

  function submit(
    event: React.FormEvent<HTMLFormElement>,
    action: (formData: FormData) => Promise<AdminActionResult>,
  ) {
    event.preventDefault();
    run(action, new FormData(event.currentTarget));
  }

  return (
    <div className="space-y-10">
      {notice.error && (
        <p aria-live="polite" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{notice.error}</p>
      )}
      {notice.success && (
        <p aria-live="polite" className="rounded-xl bg-[#edf4e9] px-4 py-3 text-sm text-[#315c3b]">{notice.success}</p>
      )}

      {!catalogueOnly && (
        <section aria-label="Marketplace statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[
            { label: "Registered buyers", value: buyers.length },
            { label: "Buyers signed in", value: signedInBuyers.length },
            { label: "Registered sellers", value: sellers.length },
            { label: "Seller listings", value: listings.length },
            { label: "Listings marked active", value: activeListings.length },
            { label: "Suspended accounts", value: suspendedAccounts.length },
          ].map((stat) => (
            <article className="rounded-2xl border border-[#e4e9e1] bg-white p-5" key={stat.label}>
              <p className="text-sm font-medium text-[#778278]">{stat.label}</p>
              <p className="mt-2 text-3xl font-semibold tabular-nums text-[#315c3b]">{stat.value}</p>
            </article>
          ))}
        </section>
      )}

      {!catalogueOnly && <section>
        <h2 className="text-xl font-semibold text-[#2d4532]">Seller activity</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[#e4e9e1] bg-white">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="bg-[#f7f8f3] text-xs uppercase tracking-wide text-[#778278]">
              <tr><th className="px-5 py-3 font-semibold">Seller</th><th className="px-5 py-3 font-semibold">Listings</th><th className="px-5 py-3 font-semibold">Last sign-in</th></tr>
            </thead>
            <tbody className="divide-y divide-[#edf0ea]">
              {sellers.map((seller) => (
                <tr key={seller.id}>
                  <td className="px-5 py-4 font-medium text-[#344a38]">{seller.display_name}</td>
                  <td className="px-5 py-4 text-[#667468]">{listingsBySeller.get(seller.id) ?? 0}</td>
                  <td className="px-5 py-4 text-[#667468]">{formatLastLogin(seller.last_login_at)}</td>
                </tr>
              ))}
              {sellers.length === 0 && (
                <tr><td className="px-5 py-8 text-center text-[#778278]" colSpan={3}>No seller accounts yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>}

      {catalogueOnly && <section>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[#2d4532]">Product catalogue</h2>
            <p className="mt-1 text-sm text-[#778278]">Manage products available to sellers and buyers.</p>
          </div>
          <span className="rounded-full bg-white px-3 py-1.5 text-sm font-medium text-[#59695d] ring-1 ring-[#e3e9df]">{products.length} products</span>
        </div>

        <form className="mt-4 grid gap-3 rounded-2xl border border-[#dfe6dc] bg-[#f7f8f3] p-4 sm:grid-cols-2 lg:grid-cols-5" onSubmit={(event) => submit(event, createCatalogueProduct)}>
          <input aria-label="New product name" className={fieldClass} maxLength={120} name="name" placeholder="Product name" required />
          <select aria-label="New product category" className={fieldClass} defaultValue="" name="category" required>
            <option disabled value="">Choose category</option>
            {MARKETPLACE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
          <input aria-label="New product description" className={fieldClass} maxLength={500} minLength={5} name="description" placeholder="Description" required />
          <input aria-label="New product icon" className={fieldClass} maxLength={8} name="icon" placeholder="Icon (optional)" />
          <button className="min-h-10 rounded-lg bg-[#315c3b] px-4 text-sm font-semibold text-white hover:bg-[#24492e] disabled:opacity-60" disabled={isPending} type="submit">
            Add product
          </button>
        </form>

        <div className="mt-4 space-y-3">
          {products.map((product) => (
            <article className="rounded-2xl border border-[#e4e9e1] bg-white p-4 sm:p-5" key={product.id}>
              <form className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(120px,1fr)_minmax(180px,1.2fr)_minmax(180px,2fr)_72px_auto]" onSubmit={(event) => submit(event, updateCatalogueProduct)}>
                <input name="id" type="hidden" value={product.id} />
                <label className="text-xs font-medium text-[#778278]">Name<input className={fieldClass} defaultValue={product.name} maxLength={120} name="name" required /></label>
                <label className="text-xs font-medium text-[#778278]">Category<select className={fieldClass} defaultValue={product.category} name="category">{MARKETPLACE_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
                <label className="text-xs font-medium text-[#778278]">Description<input className={fieldClass} defaultValue={product.description} maxLength={500} minLength={5} name="description" required /></label>
                <label className="text-xs font-medium text-[#778278]">Icon<input className={fieldClass} defaultValue={product.icon} maxLength={8} name="icon" /></label>
                <div className="flex gap-2">
                  <button className="min-h-10 rounded-lg bg-[#315c3b] px-4 text-sm font-semibold text-white hover:bg-[#24492e] disabled:opacity-60" disabled={isPending} type="submit">Save</button>
                  <button
                    className={`min-h-10 rounded-lg border px-3 text-sm font-medium disabled:opacity-60 ${product.is_active ? "border-[#ead8d5] text-[#934b42] hover:bg-red-50" : "border-[#d6dfd1] text-[#315c3b] hover:bg-[#f0f4ed]"}`}
                    disabled={isPending}
                    onClick={() => {
                      const formData = new FormData();
                      formData.set("id", product.id);
                      formData.set("isActive", String(!product.is_active));
                      run(setCatalogueProductActive, formData);
                    }}
                    type="button"
                  >
                    {product.is_active ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              </form>
              {!product.is_active && (
                <p className="mt-3 text-xs font-medium text-[#934b42]">Inactive — hidden from sellers and the marketplace.</p>
              )}
            </article>
          ))}
          {products.length === 0 && <p className="rounded-2xl border border-dashed border-[#d8e1d4] bg-white/70 px-6 py-10 text-center text-sm text-[#778278]">No catalogue products yet. Add one above.</p>}
        </div>
      </section>}

      {!catalogueOnly && (
        <section>
          <h2 className="text-xl font-semibold text-[#2d4532]">Recent admin actions</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#e4e9e1] bg-white">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-[#f7f8f3] text-xs uppercase tracking-wide text-[#778278]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Action</th>
                  <th className="px-5 py-3 font-semibold">Administrator</th>
                  <th className="px-5 py-3 font-semibold">Target</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0ea]">
                {adminActions.map((action) => (
                  <tr key={action.id}>
                    <td className="px-5 py-4 font-medium text-[#344a38]">
                      {action.action.replaceAll("_", " ")}
                    </td>
                    <td className="px-5 py-4 text-[#667468]">
                      {profilesById.get(action.actor_id)?.display_name ?? "Administrator"}
                    </td>
                    <td className="px-5 py-4 text-[#667468]">
                      {action.target_type === "account"
                        ? profilesById.get(action.target_id ?? "")?.display_name ?? "Account"
                        : action.target_type === "catalogue"
                          ? productsById.get(action.target_id ?? "")?.name ?? "Catalogue product"
                          : listingsById.get(action.target_id ?? "")?.seller_name ?? "Seller listing"}
                    </td>
                    <td className="px-5 py-4 text-[#667468]">
                      {new Date(action.occurred_at).toLocaleString("en", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </td>
                  </tr>
                ))}
                {adminActions.length === 0 && (
                  <tr>
                    <td className="px-5 py-8 text-center text-[#778278]" colSpan={4}>
                      No admin actions have been recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
