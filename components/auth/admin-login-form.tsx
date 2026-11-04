"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  loginAdminAccount,
  type AuthActionResult,
} from "@/lib/auth/actions";

export function AdminLoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [result, setResult] = useState<AuthActionResult>(() => ({
    error: initialError,
  }));
  const [isPending, startTransition] = useTransition();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult({});
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await loginAdminAccount(formData);
      setResult(response);

      if (response.redirectTo) {
        router.replace(response.redirectTo);
        router.refresh();
      }
    });
  }

  return (
    <section className="w-full max-w-md rounded-3xl border border-[#e4e9e1] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(37,71,44,0.35)] sm:p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#78916c]">
        FarmLoop administration
      </p>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#213d2b]">
        Administrator sign in
      </h1>
      <p className="mt-2 text-sm leading-6 text-[#778278]">
        Sign in with an administrator account provisioned by a trusted database operation.
      </p>

      <form className="mt-6 space-y-4" onSubmit={submit}>
        <label className="block text-sm font-medium text-[#405847]">
          Email address
          <input
            autoComplete="username"
            className="mt-1.5 h-11 w-full rounded-xl border border-[#dfe6dc] px-3 text-[#2d4532] outline-none focus:border-[#8eaa83] focus:ring-4 focus:ring-[#e9f0e5]"
            maxLength={254}
            name="email"
            required
            type="email"
          />
        </label>
        <label className="block text-sm font-medium text-[#405847]">
          Password
          <input
            autoComplete="current-password"
            className="mt-1.5 h-11 w-full rounded-xl border border-[#dfe6dc] px-3 text-[#2d4532] outline-none focus:border-[#8eaa83] focus:ring-4 focus:ring-[#e9f0e5]"
            maxLength={128}
            name="password"
            required
            type="password"
          />
        </label>

        {result.error && (
          <p aria-live="polite" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-800">
            {result.error}
          </p>
        )}

        <button
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#315c3b] px-6 text-sm font-semibold text-white transition hover:bg-[#24492e] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Please wait…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-[#778278]">
        Not an administrator?{" "}
        <Link className="font-semibold text-[#315c3b] underline underline-offset-4" href="/auth">
          Go to account sign in
        </Link>
      </p>
    </section>
  );
}
