"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setSellerListingStatus,
  type AdminActionResult,
} from "@/app/admin/actions";
import type { ListingStatus } from "@/lib/domain/marketplace";

export function ListingStatusControl({
  id,
  status,
}: {
  id: string;
  status: ListingStatus;
}) {
  const router = useRouter();
  const [result, setResult] = useState<AdminActionResult>({});
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await setSellerListingStatus(formData);
      setResult(response);
      if (response.success) router.refresh();
    });
  }

  return (
    <form className="flex items-center gap-2" onSubmit={submit}>
      <input name="id" type="hidden" value={id} />
      <select
        aria-label="Listing status"
        className="h-10 rounded-lg border border-[#dfe6dc] bg-white px-2 text-sm text-[#2d4532]"
        defaultValue={status}
        name="status"
      >
        <option value="active">Active</option>
        <option value="paused">Paused</option>
        <option value="sold_out">Sold out</option>
      </select>
      <button
        className="min-h-10 rounded-lg bg-[#315c3b] px-3 text-sm font-semibold text-white hover:bg-[#24492e] disabled:opacity-60"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Saving…" : "Save"}
      </button>
      {result.error && <span aria-live="polite" className="text-xs text-red-800">{result.error}</span>}
    </form>
  );
}
