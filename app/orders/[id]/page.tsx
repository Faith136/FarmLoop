import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { connection } from "next/server";
import { SiteHeader } from "@/components/site-header";
import { OrderConversation } from "@/components/orders/order-conversation";
import { requireUser } from "@/lib/auth/server";
import type { OrderRow } from "@/lib/supabase/database.types";

export const metadata: Metadata = {
  title: "Order details | FarmLoop",
  description: "Review your order status, timeline, and private conversation.",
};

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

function statusStyle(status: OrderRow["status"]) {
  if (status === "accepted" || status === "ready_for_collection" || status === "completed") {
    return "bg-[#edf4e9] text-[#315c3b]";
  }
  if (status === "rejected") return "bg-red-50 text-[#934b42]";
  if (status === "countered") return "bg-amber-50 text-amber-800";
  return "bg-[#f3f6f0] text-[#667468]";
}

async function OrderDetails({ params }: OrderDetailsPageProps) {
  await connection();
  const { id } = await params;
  const { supabase, user, profile } = await requireUser();
  if (profile.role !== "buyer" && profile.role !== "seller") {
    redirect("/admin");
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, listing_id, product_id, buyer_id, seller_id, buyer_name, seller_name, product_name, unit, requested_quantity, unit_price, estimated_total, buyer_message, seller_message, status, proposed_quantity, proposed_unit_price, confirmed_at, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();

  if (orderError) throw new Error(`Could not load this order: ${orderError.message}`);
  if (!order) notFound();

  const [timelineResult, conversationResult] = await Promise.all([
    supabase
      .from("order_timeline")
      .select("id, order_id, actor_id, event_type, note, occurred_at")
      .eq("order_id", order.id)
      .order("occurred_at"),
    supabase
      .from("conversations")
      .select("id, order_id, buyer_id, seller_id, created_at, last_message_at")
      .eq("order_id", order.id)
      .maybeSingle(),
  ]);
  if (timelineResult.error) throw new Error(`Could not load the order timeline: ${timelineResult.error.message}`);
  if (conversationResult.error) throw new Error(`Could not load the order conversation: ${conversationResult.error.message}`);

  const conversation = conversationResult.data;
  const messagesResult = conversation
    ? await supabase
        .from("messages")
        .select("id, conversation_id, sender_id, body, created_at, read_at")
        .eq("conversation_id", conversation.id)
        .order("created_at")
    : null;
  if (messagesResult?.error) throw new Error(`Could not load the conversation: ${messagesResult.error.message}`);

  const otherName = profile.role === "buyer" ? order.seller_name : order.buyer_name;
  const otherRole = profile.role === "buyer" ? "seller" : "buyer";

  return (
    <div className="mx-auto max-w-5xl">
      <Link className="inline-flex min-h-10 items-center text-sm font-semibold text-[#315c3b] hover:underline" href={profile.role === "seller" ? "/seller" : "/buyer"}>
        ← Back to {profile.role} workspace
      </Link>
      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#78916c]">Order details</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#213d2b] sm:text-4xl">{order.product_name}</h1>
          <p className="mt-2 text-sm text-[#68766b]">
            {profile.role === "buyer" ? "Seller" : "Buyer"}: <span className="font-semibold text-[#405847]">{otherName}</span>
          </p>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-sm font-semibold capitalize ${statusStyle(order.status)}`}>
          {order.status.replaceAll("_", " ")}
        </span>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <section aria-label="Order summary" className="rounded-2xl border border-[#e4e9e1] bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-[#2d4532]">Request summary</h2>
          <dl className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-xl bg-[#f7f8f3] p-3">
              <dt className="text-xs text-[#778278]">Quantity</dt>
              <dd className="mt-1 font-semibold text-[#344a38]">{order.requested_quantity.toLocaleString()} {order.unit}</dd>
            </div>
            <div className="rounded-xl bg-[#f7f8f3] p-3">
              <dt className="text-xs text-[#778278]">Price per unit</dt>
              <dd className="mt-1 font-semibold text-[#344a38]">KSh {order.unit_price.toLocaleString()}</dd>
            </div>
            <div className="rounded-xl bg-[#f7f8f3] p-3">
              <dt className="text-xs text-[#778278]">Estimated total</dt>
              <dd className="mt-1 font-semibold text-[#344a38]">KSh {order.estimated_total.toLocaleString()}</dd>
            </div>
            <div className="rounded-xl bg-[#f7f8f3] p-3">
              <dt className="text-xs text-[#778278]">Requested</dt>
              <dd className="mt-1 font-semibold text-[#344a38]">{new Date(order.created_at).toLocaleDateString("en-KE", { dateStyle: "medium" })}</dd>
            </div>
          </dl>
          <div className="mt-5 border-t border-[#edf0ea] pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#778278]">Participants</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {[{ label: "Buyer", name: order.buyer_name }, { label: "Seller", name: order.seller_name }].map((person) => (
                <div className="flex items-center gap-3 rounded-xl border border-[#edf0ea] p-3" key={person.label}>
                  <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e8efe3] text-sm font-bold text-[#315c3b]">
                    {person.name.slice(0, 1).toUpperCase()}
                  </span>
                  <div>
                    <p className="text-[11px] text-[#89948a]">{person.label}</p>
                    <p className="text-sm font-semibold text-[#344a38]">{person.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {order.buyer_message && (
            <p className="mt-4 rounded-xl bg-[#f7f8f3] p-3 text-sm leading-6 text-[#667468]">
              <span className="font-semibold text-[#405847]">Buyer message: </span>{order.buyer_message}
            </p>
          )}
          {order.seller_message && (
            <p className="mt-3 rounded-xl bg-[#f7f8f3] p-3 text-sm leading-6 text-[#667468]">
              <span className="font-semibold text-[#405847]">Seller message: </span>{order.seller_message}
            </p>
          )}
          {order.status === "countered" && order.proposed_quantity !== null && order.proposed_unit_price !== null && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-900">Seller proposal awaiting your response</p>
              <p className="mt-1 text-sm text-amber-900">
                {order.proposed_quantity.toLocaleString()} {order.unit} at KSh {order.proposed_unit_price.toLocaleString()} per {order.unit}; estimated total KSh {(order.proposed_quantity * order.proposed_unit_price).toLocaleString()}.
              </p>
              <Link className="mt-2 inline-flex text-sm font-semibold text-[#315c3b] underline underline-offset-4" href="/buyer">
                Review proposal in buyer workspace
              </Link>
            </div>
          )}
          <p className="mt-5 text-xs leading-5 text-[#89948a]">
            Order requests are not purchases until the seller accepts. The estimated total may change if a proposal is agreed.
          </p>
        </section>

        <section aria-label="Order timeline" className="rounded-2xl border border-[#e4e9e1] bg-white p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-[#2d4532]">Order timeline</h2>
          {timelineResult.data.length === 0 ? (
            <p className="mt-4 text-sm text-[#778278]">No order activity yet.</p>
          ) : (
            <ol className="mt-4 space-y-4">
              {timelineResult.data.map((event) => (
                <li className="relative border-l border-[#dfe6dc] pb-1 pl-4 last:border-transparent" key={event.id}>
                  <span aria-hidden="true" className="absolute -left-1.25 top-1 h-2.5 w-2.5 rounded-full bg-[#78916c]" />
                  <p className="text-sm font-semibold capitalize text-[#344a38]">{event.event_type.replaceAll("_", " ")}</p>
                  <p className="mt-1 text-sm leading-5 text-[#68766b]">{event.note}</p>
                  <time className="mt-1 block text-xs text-[#89948a]" dateTime={event.occurred_at}>
                    {new Date(event.occurred_at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {conversation ? (
        <div className="mt-6">
          <OrderConversation
            conversationId={conversation.id}
            currentUserId={user.id}
            initialMessages={messagesResult?.data ?? []}
            orderId={order.id}
            otherName={otherName}
            otherRole={otherRole}
          />
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-[#d8e1d4] bg-white/70 p-5 text-sm leading-6 text-[#778278]">
          Private messaging opens when the seller accepts the order request.
        </p>
      )}
    </div>
  );
}

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-7 sm:py-10 lg:px-12">
        <Suspense fallback={<p className="text-sm text-[#778278]">Loading order details…</p>}>
          <OrderDetails params={params} />
        </Suspense>
      </main>
    </div>
  );
}
