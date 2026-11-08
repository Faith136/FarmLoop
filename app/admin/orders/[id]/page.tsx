import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { AdminLayout } from "@/app/admin/admin-layout";
import { requireRole } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Transaction details | FarmLoop",
  description: "Read-only transaction record and status history.",
};

interface AdminOrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

async function AdminOrderDetails({ params }: AdminOrderDetailsPageProps) {
  await connection();
  const { id } = await params;
  const { supabase } = await requireRole("admin");
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, listing_id, product_id, buyer_id, seller_id, buyer_name, seller_name, product_name, unit, requested_quantity, unit_price, estimated_total, buyer_message, seller_message, status, proposed_quantity, proposed_unit_price, confirmed_at, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (orderError) throw new Error(`Could not load the transaction: ${orderError.message}`);
  if (!order) notFound();

  const [profilesResult, productResult, timelineResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, email, role, is_suspended, last_login_at, created_at")
      .in("id", [order.buyer_id, order.seller_id]),
    supabase
      .from("catalogue_products")
      .select("id, name, category, description, icon, is_active, created_at")
      .eq("id", order.product_id)
      .maybeSingle(),
    supabase
      .from("order_timeline")
      .select("id, order_id, actor_id, event_type, note, occurred_at")
      .eq("order_id", order.id)
      .order("occurred_at"),
  ]);
  if (profilesResult.error) throw new Error(`Could not load transaction participants: ${profilesResult.error.message}`);
  if (productResult.error) throw new Error(`Could not load transaction product details: ${productResult.error.message}`);
  if (timelineResult.error) throw new Error(`Could not load transaction history: ${timelineResult.error.message}`);

  const profilesById = new Map(profilesResult.data.map((profile) => [profile.id, profile]));
  const buyer = profilesById.get(order.buyer_id);
  const seller = profilesById.get(order.seller_id);
  if (!buyer || !seller) throw new Error("Could not resolve transaction participants.");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link className="text-sm font-semibold text-[#315c3b] underline underline-offset-4" href="/admin/orders">← Orders & transactions</Link>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-[#78916c]">Read-only transaction record</p>
          <h2 className="mt-2 break-all font-mono text-2xl font-semibold tracking-tight text-[#213d2b] sm:text-3xl">{order.id}</h2>
        </div>
        <span className="rounded-full bg-[#edf4e9] px-3 py-1.5 text-sm font-semibold capitalize text-[#315c3b]">{order.status.replaceAll("_", " ")}</span>
      </div>

      <section aria-label="Transaction summary" className="rounded-2xl border border-[#e4e9e1] bg-white p-5 sm:p-7">
        <h3 className="text-lg font-semibold text-[#2d4532]">Transaction summary</h3>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl bg-[#f7f8f3] p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#778278]">Product / waste type</dt>
            <dd className="mt-1 font-semibold text-[#344a38]">{order.product_name}</dd>
            {productResult.data && <dd className="mt-1 text-sm text-[#778278]">{productResult.data.category}</dd>}
            {productResult.data && <dd className="mt-2 text-xs leading-5 text-[#778278]">{productResult.data.description}</dd>}
          </div>
          <div className="rounded-xl bg-[#f7f8f3] p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#778278]">Quantity confirmed</dt>
            <dd className="mt-1 font-semibold text-[#344a38]">{order.requested_quantity.toLocaleString("en-KE")} {order.unit}</dd>
          </div>
          <div className="rounded-xl bg-[#f7f8f3] p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#778278]">Agreed unit price</dt>
            <dd className="mt-1 font-semibold text-[#344a38]">KSh {order.unit_price.toLocaleString("en-KE", { maximumFractionDigits: 2 })} / {order.unit}</dd>
          </div>
          <div className="rounded-xl bg-[#f7f8f3] p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#778278]">Total transaction value</dt>
            <dd className="mt-1 font-semibold text-[#344a38]">KSh {order.estimated_total.toLocaleString("en-KE", { maximumFractionDigits: 2 })}</dd>
          </div>
          <div className="rounded-xl bg-[#f7f8f3] p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#778278]">Order creation date</dt>
            <dd className="mt-1 font-semibold text-[#344a38]">{new Date(order.created_at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}</dd>
          </div>
          <div className="rounded-xl bg-[#edf4e9] p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-[#667468]">Seller confirmation date</dt>
            <dd className="mt-1 font-semibold text-[#315c3b]">
              {order.confirmed_at
                ? new Date(order.confirmed_at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })
                : "Not confirmed"}
            </dd>
          </div>
        </dl>
      </section>

      <section aria-label="Buyer and seller information" className="grid gap-4 md:grid-cols-2">
        {[{ label: "Buyer", profile: buyer }, { label: "Seller", profile: seller }].map(({ label, profile }) => (
          <article className="rounded-2xl border border-[#e4e9e1] bg-white p-5" key={label}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#778278]">{label}</p>
                <h3 className="mt-1 text-lg font-semibold text-[#2d4532]">{profile.display_name}</h3>
                <p className="mt-1 break-all text-sm text-[#667468]">{profile.email ?? "Email unavailable"}</p>
                <p className="mt-1 text-xs capitalize text-[#89948a]">{profile.role} · {profile.is_suspended ? "Suspended" : "Active"}</p>
              </div>
              <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8efe3] text-sm font-bold text-[#315c3b]">{profile.display_name.slice(0, 1).toUpperCase()}</span>
            </div>
            <Link className="mt-4 inline-flex text-sm font-semibold text-[#315c3b] underline underline-offset-4" href={`/admin/users/${profile.id}`}>
              Open {label.toLocaleLowerCase()} profile
            </Link>
          </article>
        ))}
      </section>

      <section aria-label="Transaction notes" className="rounded-2xl border border-[#e4e9e1] bg-white p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-[#2d4532]">Related transaction notes</h3>
        {order.buyer_message || order.seller_message ? (
          <div className="mt-4 space-y-3">
            {order.buyer_message && <p className="rounded-xl bg-[#f7f8f3] p-4 text-sm leading-6 text-[#667468]"><span className="font-semibold text-[#405847]">Buyer note: </span>{order.buyer_message}</p>}
            {order.seller_message && <p className="rounded-xl bg-[#f7f8f3] p-4 text-sm leading-6 text-[#667468]"><span className="font-semibold text-[#405847]">Seller note: </span>{order.seller_message}</p>}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[#778278]">No buyer or seller notes were added.</p>
        )}
      </section>

      <section aria-label="Transaction status history" className="rounded-2xl border border-[#e4e9e1] bg-white p-5 sm:p-6">
        <h3 className="text-lg font-semibold text-[#2d4532]">Status history</h3>
        {timelineResult.data.length === 0 ? (
          <p className="mt-3 text-sm text-[#778278]">No status history is available for this transaction.</p>
        ) : (
          <ol className="mt-5 space-y-4">
            {timelineResult.data.map((event) => (
              <li className="relative border-l border-[#dfe6dc] pb-1 pl-5 last:border-transparent" key={event.id}>
                <span aria-hidden="true" className="absolute -left-1.25 top-1 h-2.5 w-2.5 rounded-full bg-[#78916c]" />
                <p className="text-sm font-semibold capitalize text-[#344a38]">{event.event_type.replaceAll("_", " ")}</p>
                <p className="mt-1 text-sm leading-6 text-[#667468]">{event.note}</p>
                <time className="mt-1 block text-xs text-[#89948a]" dateTime={event.occurred_at}>{new Date(event.occurred_at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}</time>
              </li>
            ))}
          </ol>
        )}
      </section>
      <p className="text-xs leading-5 text-[#89948a]">Administrators can review this record but cannot edit transaction fields from this dashboard.</p>
    </div>
  );
}

async function AdminOrderDetailsContent({ params }: AdminOrderDetailsPageProps) {
  return (
    <AdminLayout
      activeSection="transactions"
      description="Review transaction participants, product details, confirmation, and status history."
      title="Transaction details"
    >
      <AdminOrderDetails params={params} />
    </AdminLayout>
  );
}

export default function AdminOrderDetailsPage(props: AdminOrderDetailsPageProps) {
  return (
    <Suspense fallback={<p className="px-6 py-10 text-sm text-[#778278]">Loading transaction details…</p>}>
      <AdminOrderDetailsContent params={props.params} />
    </Suspense>
  );
}
