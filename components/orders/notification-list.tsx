"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { markNotificationRead, type OrderActionResult } from "@/app/orders/actions";
import type { NotificationRow } from "@/lib/supabase/database.types";

export function NotificationList({ notifications }: { notifications: NotificationRow[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function markRead(id: string) {
    setError("");
    startTransition(async () => {
      const result: OrderActionResult = await markNotificationRead(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (notifications.length === 0) {
    return <p className="rounded-2xl border border-dashed border-[#d8e1d4] bg-white/70 px-6 py-12 text-center text-sm text-[#778278]">You’re all caught up.</p>;
  }

  return (
    <div className="space-y-3">
      {error && <p aria-live="polite" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
      {notifications.map((notification) => (
        <article className={`rounded-2xl border bg-white p-4 sm:p-5 ${notification.read_at ? "border-[#e4e9e1]" : "border-[#cbd8c5] shadow-sm"}`} key={notification.id}>
          <div className="flex items-start gap-3">
            {!notification.read_at && <span aria-label="Unread" className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-[#59835b]" />}
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-[#2d4532]">{notification.title}</h2>
              <p className="mt-1 text-sm leading-6 text-[#667468]">{notification.body}</p>
              <time className="mt-2 block text-xs text-[#89948a]" dateTime={notification.created_at}>
                {new Date(notification.created_at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
              </time>
              <div className="mt-3 flex flex-wrap gap-4">
                <Link className="text-sm font-semibold text-[#315c3b] underline underline-offset-4" href={notification.href}>
                  View update
                </Link>
                {!notification.read_at && (
                  <button
                    className="text-sm font-medium text-[#667468] underline underline-offset-4 disabled:opacity-50"
                    disabled={isPending}
                    onClick={() => markRead(notification.id)}
                    type="button"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
