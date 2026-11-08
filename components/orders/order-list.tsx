"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  acceptOrderRequest,
  proposeOrderChange,
  rejectOrderRequest,
  respondToOrderProposal,
  updateOrderFulfillmentStatus,
  type OrderActionResult,
} from "@/app/orders/actions";
import type { OrderRow } from "@/lib/supabase/database.types";

type OrderParticipantRole = "buyer" | "seller";
type OrderAction = (formData: FormData) => Promise<OrderActionResult>;

const fieldClass =
  "mt-1.5 h-10 w-full rounded-lg border border-[#dfe6dc] bg-white px-3 text-sm text-[#2d4532] outline-none focus:border-[#8eaa83] focus:ring-4 focus:ring-[#e9f0e5]";

function statusLabel(status: OrderRow["status"]) {
  return status.replaceAll("_", " ");
}

function statusStyle(status: OrderRow["status"]) {
  if (status === "accepted" || status === "ready_for_collection" || status === "completed") {
    return "bg-[#edf4e9] text-[#315c3b]";
  }
  if (status === "rejected") return "bg-red-50 text-[#934b42]";
  if (status === "countered") return "bg-amber-50 text-amber-800";
  return "bg-[#f3f6f0] text-[#667468]";
}

export function OrderList({
  orders,
  viewerRole,
  emptyMessage,
}: {
  orders: OrderRow[];
  viewerRole: OrderParticipantRole;
  emptyMessage: string;
}) {
  const router = useRouter();
  const [notice, setNotice] = useState<OrderActionResult>({});
  const [isPending, startTransition] = useTransition();

  function run(action: OrderAction, formData: FormData) {
    setNotice({});
    startTransition(async () => {
      const result = await action(formData);
      setNotice(result);
      if (result.success) router.refresh();
    });
  }

  function submit(
    event: React.FormEvent<HTMLFormElement>,
    action: OrderAction,
  ) {
    event.preventDefault();
    run(action, new FormData(event.currentTarget));
  }

  if (orders.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-[#d8e1d4] bg-white/70 px-6 py-10 text-center text-sm text-[#778278]">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {notice.error && <p aria-live="polite" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800">{notice.error}</p>}
      {notice.success && <p aria-live="polite" className="rounded-xl bg-[#edf4e9] px-4 py-3 text-sm text-[#315c3b]">{notice.success}</p>}
      {orders.map((order) => {
        const counterTotal =
          order.proposed_quantity !== null && order.proposed_unit_price !== null
            ? order.proposed_quantity * order.proposed_unit_price
            : null;
        const otherParty = viewerRole === "buyer" ? order.seller_name : order.buyer_name;

        return (
          <article className="rounded-2xl border border-[#e4e9e1] bg-white p-4 shadow-[0_6px_24px_-20px_rgba(37,71,44,0.3)] sm:p-5" key={order.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-[#89948a]">{viewerRole === "buyer" ? "Seller" : "Buyer"}</p>
                <h3 className="mt-1 truncate text-base font-semibold text-[#2d4532]">{order.product_name}</h3>
                <p className="mt-1 text-sm text-[#778278]">{otherParty}</p>
              </div>
              <span className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${statusStyle(order.status)}`}>
                {statusLabel(order.status)}
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#f7f8f3] p-3 sm:grid-cols-4">
              <div>
                <dt className="text-[11px] text-[#89948a]">Quantity</dt>
                <dd className="mt-1 text-sm font-semibold text-[#344a38]">{order.requested_quantity.toLocaleString()} {order.unit}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-[#89948a]">Price / unit</dt>
                <dd className="mt-1 text-sm font-semibold text-[#344a38]">KSh {order.unit_price.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-[#89948a]">Estimated total</dt>
                <dd className="mt-1 text-sm font-semibold text-[#344a38]">KSh {order.estimated_total.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-[11px] text-[#89948a]">Requested</dt>
                <dd className="mt-1 text-sm font-semibold text-[#344a38]">{new Date(order.created_at).toLocaleDateString("en-KE")}</dd>
              </div>
            </dl>

            {order.buyer_message && (
              <p className="mt-3 rounded-xl border border-[#edf0ea] px-3 py-2 text-sm leading-6 text-[#667468]">
                <span className="font-semibold text-[#405847]">Buyer message: </span>{order.buyer_message}
              </p>
            )}
            {order.seller_message && (
              <p className="mt-3 rounded-xl border border-[#edf0ea] px-3 py-2 text-sm leading-6 text-[#667468]">
                <span className="font-semibold text-[#405847]">Seller message: </span>{order.seller_message}
              </p>
            )}

            {viewerRole === "buyer" && order.status === "countered" && counterTotal !== null && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4">
                <p className="text-sm font-semibold text-amber-900">Seller proposal</p>
                <p className="mt-1 text-sm text-amber-900">
                  {order.proposed_quantity?.toLocaleString()} {order.unit} · KSh {order.proposed_unit_price?.toLocaleString()} / {order.unit} · Estimated KSh {counterTotal.toLocaleString()}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    { accept: "true", label: "Accept proposal", className: "bg-[#315c3b] text-white hover:bg-[#24492e]" },
                    { accept: "false", label: "Decline", className: "border border-[#e4c9c4] bg-white text-[#934b42] hover:bg-red-50" },
                  ].map((choice) => (
                    <button
                      className={`min-h-10 rounded-lg px-4 text-sm font-semibold disabled:opacity-60 ${choice.className}`}
                      disabled={isPending}
                      key={choice.accept}
                      onClick={() => {
                        const formData = new FormData();
                        formData.set("orderId", order.id);
                        formData.set("accept", choice.accept);
                        run(respondToOrderProposal, formData);
                      }}
                      type="button"
                    >
                      {choice.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {viewerRole === "seller" && order.status === "pending" && (
              <div className="mt-4 grid gap-3 border-t border-[#edf0ea] pt-4 sm:grid-cols-2">
                <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
                  <button
                    className="min-h-10 rounded-lg bg-[#315c3b] px-4 text-sm font-semibold text-white hover:bg-[#24492e] disabled:opacity-60"
                    disabled={isPending}
                    onClick={() => {
                      const formData = new FormData();
                      formData.set("orderId", order.id);
                      run(acceptOrderRequest, formData);
                    }}
                    type="button"
                  >
                    Accept & reserve quantity
                  </button>
                </div>
                <form className="space-y-2" onSubmit={(event) => submit(event, rejectOrderRequest)}>
                  <input name="orderId" type="hidden" value={order.id} />
                  <label className="block text-xs font-semibold text-[#667468]">
                    Decline with explanation (optional)
                    <input className={fieldClass} maxLength={1000} name="explanation" placeholder="Reason for declining" />
                  </label>
                  <button className="min-h-9 rounded-lg border border-[#e4c9c4] px-3 text-sm font-semibold text-[#934b42] hover:bg-red-50 disabled:opacity-60" disabled={isPending} type="submit">
                    Decline request
                  </button>
                </form>
                <form className="space-y-2" onSubmit={(event) => submit(event, proposeOrderChange)}>
                  <input name="orderId" type="hidden" value={order.id} />
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-xs font-semibold text-[#667468]">
                      Proposed quantity
                      <input className={fieldClass} min="0.01" name="quantity" required step="any" type="number" defaultValue={order.requested_quantity} />
                    </label>
                    <label className="block text-xs font-semibold text-[#667468]">
                      Price per unit
                      <input className={fieldClass} min="0" name="unitPrice" required step="0.01" type="number" defaultValue={order.unit_price} />
                    </label>
                  </div>
                  <label className="block text-xs font-semibold text-[#667468]">
                    Note (optional)
                    <input className={fieldClass} maxLength={1000} name="message" placeholder="Add context for the buyer" />
                  </label>
                  <button className="min-h-9 rounded-lg border border-[#d6dfd1] px-3 text-sm font-semibold text-[#315c3b] hover:bg-[#f4f6f1] disabled:opacity-60" disabled={isPending} type="submit">
                    Propose a change
                  </button>
                </form>
              </div>
            )}

            {viewerRole === "seller" && order.status === "accepted" && (
              <button
                className="mt-4 min-h-10 rounded-lg bg-[#315c3b] px-4 text-sm font-semibold text-white hover:bg-[#24492e] disabled:opacity-60"
                disabled={isPending}
                onClick={() => {
                  const formData = new FormData();
                  formData.set("orderId", order.id);
                  formData.set("status", "ready_for_collection");
                  run(updateOrderFulfillmentStatus, formData);
                }}
                type="button"
              >
                Mark ready for collection
              </button>
            )}
            {viewerRole === "seller" && order.status === "ready_for_collection" && (
              <button
                className="mt-4 min-h-10 rounded-lg bg-[#315c3b] px-4 text-sm font-semibold text-white hover:bg-[#24492e] disabled:opacity-60"
                disabled={isPending}
                onClick={() => {
                  const formData = new FormData();
                  formData.set("orderId", order.id);
                  formData.set("status", "completed");
                  run(updateOrderFulfillmentStatus, formData);
                }}
                type="button"
              >
                Mark completed
              </button>
            )}

            <div className="mt-4 flex flex-wrap gap-4 border-t border-[#edf0ea] pt-4">
              <Link className="text-sm font-semibold text-[#315c3b] underline underline-offset-4" href={`/orders/${order.id}`}>
                Order details
              </Link>
              {order.status === "accepted" || order.status === "ready_for_collection" || order.status === "completed" ? (
                <Link className="text-sm font-semibold text-[#315c3b] underline underline-offset-4" href={`/orders/${order.id}#conversation`}>
                  Open conversation
                </Link>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
