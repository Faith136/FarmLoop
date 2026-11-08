import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { SiteHeader } from "@/components/site-header";
import { NotificationList } from "@/components/orders/notification-list";
import { requireUser } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Notifications | FarmLoop",
  description: "Order and message updates for your FarmLoop account.",
};

async function NotificationInbox() {
  await connection();
  const { supabase, user } = await requireUser();
  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id, user_id, order_id, conversation_id, notification_type, title, body, href, created_at, read_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(`Could not load your notifications: ${error.message}`);
  return <NotificationList notifications={notifications} />;
}

export default function NotificationsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-7 sm:py-10 lg:px-12">
        <header className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#78916c]">Your workspace</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#213d2b]">Notifications</h1>
          <p className="mt-2 text-sm leading-6 text-[#68766b]">Updates about order requests, fulfillment, and messages.</p>
        </header>
        <Suspense fallback={<p className="text-sm text-[#778278]">Loading notifications…</p>}>
          <NotificationInbox />
        </Suspense>
      </main>
    </div>
  );
}
