import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { SiteHeader } from "@/components/site-header";
import { requireUser } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Messages | FarmLoop",
  description: "Private conversations about your accepted FarmLoop orders.",
};

async function MessageInbox() {
  await connection();
  const { supabase, user, profile } = await requireUser();
  if (profile.role !== "buyer" && profile.role !== "seller") {
    return <p className="rounded-2xl border border-[#e4e9e1] bg-white p-5 text-sm text-[#667468]">Messaging is available to buyers and sellers.</p>;
  }

  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select("id, order_id, buyer_id, seller_id, created_at, last_message_at")
    .order("last_message_at", { ascending: false });
  if (conversationsError) throw new Error(`Could not load your conversations: ${conversationsError.message}`);

  if (conversations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[#d8e1d4] bg-white/70 px-6 py-12 text-center">
        <h2 className="text-lg font-semibold text-[#2d4532]">No conversations yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#778278]">
          A private conversation opens after a seller accepts an order request.
        </p>
        <Link className="mt-4 inline-flex min-h-10 items-center rounded-full bg-[#315c3b] px-4 text-sm font-semibold text-white" href={profile.role === "buyer" ? "/marketplace" : "/seller"}>
          {profile.role === "buyer" ? "Browse marketplace" : "Go to seller workspace"}
        </Link>
      </div>
    );
  }

  const orderIds = [...new Set(conversations.map((conversation) => conversation.order_id))];
  const conversationIds = conversations.map((conversation) => conversation.id);
  const [ordersResult, unreadResult] = await Promise.all([
    supabase
      .from("orders")
      .select("id, product_name, buyer_name, seller_name, status")
      .in("id", orderIds),
    supabase
      .from("notifications")
      .select("conversation_id")
      .eq("user_id", user.id)
      .eq("notification_type", "new_message")
      .is("read_at", null)
      .in("conversation_id", conversationIds),
  ]);
  if (ordersResult.error) throw new Error(`Could not load conversation order details: ${ordersResult.error.message}`);
  if (unreadResult.error) throw new Error(`Could not load unread message counts: ${unreadResult.error.message}`);

  const ordersById = new Map(ordersResult.data.map((order) => [order.id, order]));
  const unreadByConversation = new Map<string, number>();
  for (const notification of unreadResult.data) {
    if (notification.conversation_id) {
      unreadByConversation.set(
        notification.conversation_id,
        (unreadByConversation.get(notification.conversation_id) ?? 0) + 1,
      );
    }
  }

  return (
    <div className="space-y-3">
      {conversations.map((conversation) => {
        const order = ordersById.get(conversation.order_id);
        if (!order) return null;
        const otherName = profile.role === "buyer" ? order.seller_name : order.buyer_name;
        const unreadCount = unreadByConversation.get(conversation.id) ?? 0;
        return (
          <Link
            className="flex items-center gap-3 rounded-2xl border border-[#e4e9e1] bg-white p-4 transition hover:border-[#cbd8c5] sm:p-5"
            href={`/orders/${conversation.order_id}#conversation`}
            key={conversation.id}
          >
            <span aria-hidden="true" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8efe3] text-sm font-bold text-[#315c3b]">
              {otherName.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="truncate text-sm font-semibold text-[#2d4532]">{otherName}</span>
                <span className="rounded-full bg-[#f3f6f0] px-2 py-0.5 text-[10px] capitalize text-[#667468]">{order.status.replaceAll("_", " ")}</span>
              </span>
              <span className="mt-1 block truncate text-sm text-[#667468]">{order.product_name} · Order conversation</span>
              <span className="mt-1 block text-xs text-[#89948a]">
                Updated {new Date(conversation.last_message_at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </span>
            {unreadCount > 0 && (
              <span aria-label={`${unreadCount} unread messages`} className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full bg-[#315c3b] px-1.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
            <span aria-hidden="true" className="text-[#89948a]">›</span>
          </Link>
        );
      })}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-7 sm:py-10 lg:px-12">
        <header className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#78916c]">Your workspace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#213d2b]">Messages</h1>
          <p className="mt-2 text-sm leading-6 text-[#68766b]">
            Private conversations stay saved here, with a separate thread for each accepted order.
          </p>
        </header>
        <Suspense fallback={<p className="text-sm text-[#778278]">Loading conversations…</p>}>
          <MessageInbox />
        </Suspense>
      </main>
    </div>
  );
}
