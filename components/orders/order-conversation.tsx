"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { MessageRow } from "@/lib/supabase/database.types";

function isMessageRow(value: unknown): value is MessageRow {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.conversation_id === "string" &&
    typeof row.sender_id === "string" &&
    typeof row.body === "string" &&
    typeof row.created_at === "string" &&
    (typeof row.read_at === "string" || row.read_at === null)
  );
}

export function OrderConversation({
  conversationId,
  orderId,
  currentUserId,
  otherName,
  otherRole,
  initialMessages,
}: {
  conversationId: string;
  orderId: string;
  currentUserId: string;
  otherName: string;
  otherRole: "buyer" | "seller";
  initialMessages: MessageRow[];
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Connecting…");
  const [isPending, startTransition] = useTransition();
  const messageEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const markRead = async () => {
      try {
        const { error: readError } = await supabase.rpc("mark_conversation_read", {
          p_conversation_id: conversationId,
        });
        if (readError) setError(`Could not mark messages as read: ${readError.message}`);
      } catch (readError: unknown) {
        const detail = readError instanceof Error ? readError.message : "Unexpected network error.";
        setError(`Could not mark messages as read: ${detail}`);
      }
    };

    void markRead();

    const channel = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          if (!isMessageRow(payload.new)) {
            setError("Received an invalid live message update.");
            return;
          }
          const incoming = payload.new;
          setMessages((current) =>
            current.some((message) => message.id === incoming.id)
              ? current
              : [...current, incoming],
          );
          if (incoming.sender_id !== currentUserId) {
            void markRead();
          }
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnectionStatus("Live");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnectionStatus("Reconnecting");
          setError("Live updates are temporarily unavailable. You can still send messages.");
        } else if (status === "CLOSED") {
          setConnectionStatus("Offline");
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [conversationId, currentUserId]);

  useEffect(() => {
    messageEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = draft.trim();
    if (!body) return;
    if (body.length > 2000) {
      setError("Messages must be 2000 characters or fewer.");
      return;
    }

    setError("");
    startTransition(async () => {
      try {
        const { error: sendError } = await createSupabaseBrowserClient()
          .from("messages")
          .insert({
            conversation_id: conversationId,
            sender_id: currentUserId,
            body,
          });

        if (sendError) {
          setError(`Could not send your message: ${sendError.message}`);
          return;
        }
        setDraft("");
      } catch (sendError: unknown) {
        const detail = sendError instanceof Error ? sendError.message : "Unexpected network error.";
        setError(`Could not send your message: ${detail}`);
      }
    });
  }

  return (
    <section
      aria-label={`Conversation with ${otherName}`}
      className="overflow-hidden rounded-2xl border border-[#e4e9e1] bg-white"
      id="conversation"
    >
      <header className="flex items-center justify-between gap-3 border-b border-[#edf0ea] px-4 py-4 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8efe3] text-sm font-bold text-[#315c3b]">
            {otherName.slice(0, 1).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-[#2d4532]">{otherName}</h2>
            <p className="text-xs capitalize text-[#778278]">{otherRole} · order conversation</p>
          </div>
        </div>
        <span aria-live="polite" className="shrink-0 text-xs text-[#778278]">{connectionStatus}</span>
      </header>

      <div
        aria-live="polite"
        className="flex max-h-[60vh] min-h-64 flex-col gap-3 overflow-y-auto bg-[#f7f8f3] px-3 py-4 sm:px-5"
      >
        {messages.length === 0 && (
          <p className="m-auto max-w-xs text-center text-sm leading-6 text-[#778278]">
            Conversation is open. Coordinate the order here; only you and the other participant can see these messages.
          </p>
        )}
        {messages.map((message) => {
          const ownMessage = message.sender_id === currentUserId;
          return (
            <div className={`flex ${ownMessage ? "justify-end" : "justify-start"}`} key={message.id}>
              <article className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 sm:max-w-[75%] ${
                ownMessage
                  ? "rounded-br-md bg-[#315c3b] text-white"
                  : "rounded-bl-md border border-[#e3e9df] bg-white text-[#344a38]"
              }`}>
                <p className="whitespace-pre-wrap wrap-break-word text-sm leading-6">{message.body}</p>
                <time className={`mt-1 block text-right text-[10px] ${ownMessage ? "text-white/70" : "text-[#89948a]"}`} dateTime={message.created_at}>
                  {new Date(message.created_at).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
                </time>
              </article>
            </div>
          );
        })}
        <div ref={messageEnd} />
      </div>

      {error && <p aria-live="polite" className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-800">{error}</p>}
      <form className="border-t border-[#edf0ea] bg-white p-3 sm:p-4" onSubmit={sendMessage}>
        <label className="sr-only" htmlFor={`message-${orderId}`}>Write a message</label>
        <div className="flex items-end gap-2">
          <textarea
            className="min-h-11 max-h-36 min-w-0 flex-1 resize-y rounded-xl border border-[#dfe6dc] bg-white px-3 py-2.5 text-sm text-[#2d4532] outline-none focus:border-[#8eaa83] focus:ring-4 focus:ring-[#e9f0e5]"
            id={`message-${orderId}`}
            maxLength={2000}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Write a message…"
            rows={1}
            value={draft}
          />
          <button
            className="min-h-11 shrink-0 rounded-xl bg-[#315c3b] px-4 text-sm font-semibold text-white hover:bg-[#24492e] disabled:cursor-not-allowed disabled:opacity-50"
            disabled={isPending || !draft.trim()}
            type="submit"
          >
            {isPending ? "Sending…" : "Send"}
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-[#89948a]">
          Contact details are not shared by FarmLoop. You may choose to share your phone number in a message.
        </p>
      </form>
    </section>
  );
}
