"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setAccountSuspended,
  type AdminActionResult,
} from "@/app/admin/actions";

export function AccountStatusControl({
  id,
  isSuspended,
}: {
  id: string;
  isSuspended: boolean;
}) {
  const router = useRouter();
  const [result, setResult] = useState<AdminActionResult>({});
  const [isPending, startTransition] = useTransition();

  function submit() {
    const formData = new FormData();
    formData.set("id", id);
    formData.set("suspended", String(!isSuspended));

    startTransition(async () => {
      const response = await setAccountSuspended(formData);
      setResult(response);
      if (response.success) router.refresh();
    });
  }

  return (
    <div>
      <button
        className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition disabled:opacity-60 ${
          isSuspended
            ? "border-[#d6dfd1] text-[#315c3b] hover:bg-[#f0f4ed]"
            : "border-[#ead8d5] text-[#934b42] hover:bg-red-50"
        }`}
        disabled={isPending}
        onClick={submit}
        type="button"
      >
        {isPending ? "Updating…" : isSuspended ? "Reactivate account" : "Suspend account"}
      </button>
      {result.error && <p aria-live="polite" className="mt-2 text-sm text-red-800">{result.error}</p>}
      {result.success && <p aria-live="polite" className="mt-2 text-sm text-[#315c3b]">{result.success}</p>}
    </div>
  );
}
