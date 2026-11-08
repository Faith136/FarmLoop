"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { markNotificationRead } from "@/app/orders/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { NotificationRow } from "@/lib/supabase/database.types";

function isNotificationType(value: unknown): value is NotificationRow["notification_type"] {
  return (
    value === "order_request" ||
    value === "order_accepted" ||
    value === "order_rejected" ||
    value === "order_countered" ||
    value === "order_ready" ||
    value === "order_completed" ||
    value === "new_message"
  );
}

function isNotificationRow(value: unknown): value is NotificationRow {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.user_id === "string" &&
    (typeof row.order_id === "string" || row.order_id === null) &&
    (typeof row.conversation_id === "string" || row.conversation_id === null) &&
    isNotificationType(row.notification_type) &&
    typeof row.title === "string" &&
    typeof row.body === "string" &&
    typeof row.href === "string" &&
    typeof row.created_at === "string" &&
    (typeof row.read_at === "string" || row.read_at === null)
  );
}

export function NotificationPopup({
  initialNotifications,
  userId,
}: {
  initialNotifications: NotificationRow[];
  userId: string;
}) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isOpen, setIsOpen] = useState(initialNotifications.length > 0);
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (!isNotificationRow(payload.new)) {
            setError("Received an invalid live notification.");
            return;
          }

          const incoming = payload.new;
          setNotifications((current) =>
            current.some((notification) => notification.id === incoming.id)
              ? current
              : [incoming, ...current].slice(0, 10),
          );
          setIsOpen(true);
        },
      )
      .subscribe((status) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setError("Live notifications are temporarily unavailable. Your saved notifications are still available.");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  async function dismiss() {
    setError("");
    setIsPending(true);
    try {
      const unreadNotifications = notifications.filter((notification) => !notification.read_at);
      const results = await Promise.all(
        unreadNotifications.map((notification) => markNotificationRead(notification.id)),
      );
      const failedResult = results.find((result) => result.error);
      if (failedResult?.error) {
        setError(failedResult.error);
        return;
      }

      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((notification) =>
          notification.read_at ? notification : { ...notification, read_at: readAt },
        ),
      );
      setIsOpen(false);
    } catch (dismissError: unknown) {
      const detail = dismissError instanceof Error ? dismissError.message : "Unexpected network error.";
      setError(`Could not mark notifications as read: ${detail}`);
    } finally {
      setIsPending(false);
    }
  }

  if (!isOpen) return null;

  const unreadNotifications = notifications.filter((notification) => !notification.read_at);

  return (
    <div className="fixed inset-0 z-60 flex items-start justify-center overflow-y-auto bg-[#17251a]/45 px-4 py-8 sm:items-center">
      <section
        aria-labelledby="notification-popup-title"
        aria-modal="true"
        className="my-auto w-full max-w-lg rounded-2xl border border-[#e4e9e1] bg-[#fbfcf9] p-5 shadow-2xl sm:p-6"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#78916c]">Account updates</p>
            <h2 className="mt-1 text-xl font-semibold text-[#213d2b]" id="notification-popup-title">
              You have {unreadNotifications.length} new {unreadNotifications.length === 1 ? "notification" : "notifications"}
            </h2>
          </div>
          <button
            aria-label="Close notifications"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-[#667468] hover:bg-[#edf2e9] focus-visible:outline-2 focus-visible:outline-[#315c3b] disabled:opacity-50"
            disabled={isPending}
            onClick={() => void dismiss()}
            type="button"
          >
            ×
          </button>
        </div>

        {error && <p aria-live="polite" className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{error}</p>}

        {unreadNotifications.length > 0 ? (
          <ul className="mt-4 max-h-[55vh] space-y-2 overflow-y-auto">
            {unreadNotifications.map((notification) => (
              <li key={notification.id}>
                <Link
                  className="block rounded-xl border border-[#e4e9e1] bg-white p-3 transition hover:border-[#b8c9b0]"
                  href={notification.href}
                  onClick={() => void dismiss()}
                >
                  <span className="block text-sm font-semibold text-[#2d4532]">{notification.title}</span>
                  <span className="mt-1 block text-sm leading-5 text-[#667468]">{notification.body}</span>
                  <time className="mt-2 block text-xs text-[#89948a]" dateTime={notification.created_at}>
                    {new Date(notification.created_at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 rounded-xl bg-white p-4 text-sm text-[#667468]">You’re all caught up.</p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Link className="text-sm font-semibold text-[#315c3b] underline underline-offset-4" href="/notifications" onClick={() => void dismiss()}>
            View all notifications
          </Link>
          <button
            className="min-h-10 rounded-full bg-[#315c3b] px-4 text-sm font-semibold text-white hover:bg-[#24492e] disabled:opacity-50"
            disabled={isPending}
            onClick={() => void dismiss()}
            type="button"
          >
            {isPending ? "Saving…" : "Dismiss"}
          </button>
        </div>
      </section>
    </div>
  );
}
