import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AccountStatusControl } from "@/components/admin/account-status-control";
import { AdminLayout } from "@/app/admin/admin-layout";
import { requireRole } from "@/lib/auth/server";
import type { SellerListingRow } from "@/lib/supabase/database.types";

export const metadata: Metadata = {
  title: "Account details | FarmLoop",
  description: "Review account details and activity.",
};

interface AdminUserPageProps {
  params: Promise<{ id: string }>;
}

function formatDate(value: string | null) {
  return value
    ? new Date(value).toLocaleString("en", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Never";
}

async function AccountDetails({ id }: { id: string }) {
  const { supabase } = await requireRole("admin");
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, email, role, is_suspended, last_login_at, created_at")
    .eq("id", id)
    .in("role", ["buyer", "seller"])
    .maybeSingle();

  if (profileError) {
    throw new Error(`Could not load the account: ${profileError.message}`);
  }
  if (!profile) {
    notFound();
  }

  const { data: activity, error: activityError } = await supabase
    .from("account_activity")
    .select("id, profile_id, actor_id, event_type, occurred_at")
    .eq("profile_id", profile.id)
    .order("occurred_at", { ascending: false })
    .limit(50);

  if (activityError) {
    throw new Error(`Could not load account activity: ${activityError.message}`);
  }

  const actorIds = [
    ...new Set(
      activity
        .map((event) => event.actor_id)
        .filter((actorId): actorId is string => actorId !== null),
    ),
  ];
  let actorNames = new Map<string, string>();

  if (actorIds.length > 0) {
    const { data: actors, error: actorsError } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", actorIds);

    if (actorsError) {
      throw new Error(`Could not load account activity actors: ${actorsError.message}`);
    }

    actorNames = new Map(actors.map((actor) => [actor.id, actor.display_name]));
  }

  let listings: SellerListingRow[] = [];
  let productNames = new Map<string, string>();

  if (profile.role === "seller") {
    const { data, error } = await supabase
      .from("seller_listings")
      .select("id, seller_id, seller_name, seller_email, product_id, quantity_available, unit, price_per_unit, location, condition, available_from, available_until, status, created_at, updated_at")
      .eq("seller_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Could not load the seller's listings: ${error.message}`);
    }

    listings = data;
    const productIds = [...new Set(listings.map((listing) => listing.product_id))];

    if (productIds.length > 0) {
      const { data: products, error: productsError } = await supabase
        .from("catalogue_products")
        .select("id, name")
        .in("id", productIds);

      if (productsError) {
        throw new Error(`Could not load listing product names: ${productsError.message}`);
      }

      productNames = new Map(products.map((product) => [product.id, product.name]));
    }
  }

  const account = profile;
  const accountActivity = activity;

  return (
    <div className="space-y-8">
      <section aria-label="Account details" className="rounded-3xl border border-[#e3e9df] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#778278]">Account holder</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#213d2b]">{account.display_name}</h2>
            <p className="mt-1 break-all text-sm text-[#68766b]">{account.email ?? "Email unavailable"}</p>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-sm font-semibold ${account.is_suspended ? "bg-red-50 text-[#934b42]" : "bg-[#edf4e9] text-[#315c3b]"}`}>
            {account.is_suspended ? "Suspended" : "Active"}
          </span>
        </div>
        <dl className="mt-6 grid gap-5 border-t border-[#edf0ea] pt-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[#778278]">Account type</dt>
            <dd className="mt-1 capitalize text-sm text-[#213d2b]">{account.role}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[#778278]">Joined</dt>
            <dd className="mt-1 text-sm text-[#213d2b]">{formatDate(account.created_at)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-[0.1em] text-[#778278]">Last sign-in</dt>
            <dd className="mt-1 text-sm text-[#213d2b]">{formatDate(account.last_login_at)}</dd>
          </div>
        </dl>
        <div className="mt-6 border-t border-[#edf0ea] pt-6">
          <AccountStatusControl id={account.id} isSuspended={account.is_suspended} />
        </div>
      </section>

      {account.role === "seller" ? (
        <section>
          <h2 className="text-xl font-semibold text-[#2d4532]">Seller listings</h2>
          <div className="mt-4 overflow-x-auto rounded-2xl border border-[#e4e9e1] bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-[#f7f8f3] text-xs uppercase tracking-wide text-[#778278]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Product</th>
                  <th className="px-5 py-3 font-semibold">Quantity</th>
                  <th className="px-5 py-3 font-semibold">Location</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf0ea]">
                {listings.map((listing) => (
                  <tr key={listing.id}>
                    <td className="px-5 py-4 font-medium text-[#344a38]">
                      {productNames.get(listing.product_id) ?? "Unknown product"}
                    </td>
                    <td className="px-5 py-4 text-[#667468]">{listing.quantity_available} {listing.unit}</td>
                    <td className="px-5 py-4 text-[#667468]">{listing.location}</td>
                    <td className="px-5 py-4 capitalize text-[#667468]">{listing.status.replace("_", " ")}</td>
                  </tr>
                ))}
                {listings.length === 0 && (
                  <tr><td className="px-5 py-8 text-center text-[#778278]" colSpan={4}>This seller has no listings.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-[#d8e1d4] bg-white/70 p-6">
          <h2 className="text-lg font-semibold text-[#2d4532]">Buyer orders</h2>
          <p className="mt-2 text-sm leading-6 text-[#778278]">
            Orders are not available yet. FarmLoop does not currently have checkout or order storage, so there are no buyer orders to display.
          </p>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold text-[#2d4532]">Account activity</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[#e4e9e1] bg-white">
          <ul className="divide-y divide-[#edf0ea]">
            {accountActivity.map((event) => (
              <li className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" key={event.id}>
                <span className="text-sm font-medium capitalize text-[#344a38]">
                  {event.event_type.replaceAll("_", " ")}
                  {(event.event_type === "suspended" || event.event_type === "reactivated") &&
                    event.actor_id &&
                    ` by ${actorNames.get(event.actor_id) ?? "an administrator"}`}
                </span>
                <time className="text-sm text-[#667468]" dateTime={event.occurred_at}>{formatDate(event.occurred_at)}</time>
              </li>
            ))}
            {accountActivity.length === 0 && (
              <li className="px-5 py-8 text-center text-sm text-[#778278]">No account activity has been recorded.</li>
            )}
          </ul>
        </div>
      </section>

      <Link
        className="inline-flex min-h-10 items-center text-sm font-semibold text-[#315c3b] underline underline-offset-4"
        href="/admin/users"
      >
        Back to accounts
      </Link>
    </div>
  );
}

async function AdminUserDetailsContent({
  params,
}: AdminUserPageProps) {
  const { id } = await params;

  return (
    <AdminLayout
      description="Review account information, activity, and seller listings. Account status is managed separately from individual listings."
      title="Account details"
    >
      <AccountDetails id={id} />
    </AdminLayout>
  );
}

export default function AdminUserDetailsPage(props: AdminUserPageProps) {
  return (
    <Suspense fallback={<p className="px-6 py-10 text-sm text-[#778278]">Loading account details…</p>}>
      <AdminUserDetailsContent params={props.params} />
    </Suspense>
  );
}
