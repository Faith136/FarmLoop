"use client";

import { useState, useTransition } from "react";
import { deleteOwnAccount, type AuthActionResult } from "@/lib/auth/actions";

export function DeleteAccountControl() {
  const [result, setResult] = useState<AuthActionResult>({});
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (
      !window.confirm(
        "Permanently delete your FarmLoop account and all associated data? This cannot be undone.",
      )
    ) {
      return;
    }

    setResult({});
    startTransition(async () => {
      setResult(await deleteOwnAccount());
    });
  }

  return (
    <div>
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#c98d85] px-5 text-sm font-semibold text-[#934b42] transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isPending}
        onClick={submit}
        type="button"
      >
        {isPending ? "Deleting account…" : "Delete account"}
      </button>
      {result.error && (
        <p aria-live="polite" className="mt-3 text-sm text-red-800">
          {result.error}
        </p>
      )}
    </div>
  );
}
