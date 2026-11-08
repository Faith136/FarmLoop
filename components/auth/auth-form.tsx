"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  loginAccount,
  registerAccount,
  type AuthActionResult,
} from "@/lib/auth/actions";

type AuthMode = "login" | "register";

interface AuthFormProps {
  initialMode: AuthMode;
  initialRole: "buyer" | "seller";
  confirmationFailed: boolean;
  accountSuspended: boolean;
  accountDeleted: boolean;
  initialRedirectTo: string;
}

export function AuthForm({
  initialMode,
  initialRole,
  confirmationFailed,
  accountSuspended,
  accountDeleted,
  initialRedirectTo,
}: AuthFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [role, setRole] = useState<"buyer" | "seller">(initialRole);
  const [result, setResult] = useState<AuthActionResult>(() =>
    confirmationFailed
      ? { error: "That confirmation link could not be verified. Sign in or request a new confirmation email." }
      : accountSuspended
        ? { error: "This account is suspended. Contact FarmLoop support for assistance." }
        : accountDeleted
          ? { message: "Your FarmLoop account and its data have been permanently deleted." }
          : {},
  );
  const [isPending, startTransition] = useTransition();

  function submit(formData: FormData) {
    setResult({});
    startTransition(async () => {
      const action = mode === "login" ? loginAccount : registerAccount;
      const response = await action(formData);
      setResult(response);

      if (response.redirectTo) {
        router.replace(response.redirectTo);
        router.refresh();
      }
    });
  }

  return (
    <section className="w-full max-w-md rounded-3xl border border-[#e4e9e1] bg-white p-6 shadow-[0_20px_60px_-40px_rgba(37,71,44,0.35)] sm:p-8">
      <div className="grid grid-cols-2 rounded-xl bg-[#f3f6f0] p-1">
        {(["login", "register"] as const).map((item) => (
          <button
            aria-pressed={mode === item}
            className={`min-h-10 rounded-lg text-sm font-semibold capitalize transition ${
              mode === item
                ? "bg-white text-[#315c3b] shadow-sm"
                : "text-[#778278] hover:text-[#315c3b]"
            }`}
            key={item}
            onClick={() => {
              setMode(item);
              setResult({});
            }}
            type="button"
          >
            {item === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <h1 className="mt-7 text-2xl font-semibold tracking-tight text-[#213d2b]">
        {mode === "login" ? "Welcome back" : "Join FarmLoop"}
      </h1>
      <p className="mt-2 text-sm leading-6 text-[#778278]">
        {mode === "login"
          ? "Sign in and we’ll take you to your workspace."
          : "Create a buyer or seller account to get started."}
      </p>

      <form action={submit} className="mt-6 space-y-4">
        <input name="redirectTo" type="hidden" value={initialRedirectTo} />
        {mode === "register" && (
          <>
            <label className="block text-sm font-medium text-[#405847]">
              Your name
              <input
                autoComplete="name"
                className="mt-1.5 h-11 w-full rounded-xl border border-[#dfe6dc] px-3 text-[#2d4532] outline-none focus:border-[#8eaa83] focus:ring-4 focus:ring-[#e9f0e5]"
                maxLength={100}
                name="displayName"
                required
              />
            </label>
            <fieldset>
              <legend className="text-sm font-medium text-[#405847]">
                Account type
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {(["buyer", "seller"] as const).map((item) => (
                  <label
                    className={`flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-medium capitalize ${
                      role === item
                        ? "border-[#8eaa83] bg-[#f2f6ef] text-[#315c3b]"
                        : "border-[#dfe6dc] text-[#778278]"
                    }`}
                    key={item}
                  >
                    <input
                      checked={role === item}
                      className="accent-[#315c3b]"
                      name="roleChoice"
                      onChange={() => setRole(item)}
                      type="radio"
                      value={item}
                    />
                    {item}
                  </label>
                ))}
              </div>
              <input name="role" type="hidden" value={role} />
            </fieldset>
          </>
        )}

        <label className="block text-sm font-medium text-[#405847]">
          Email address
          <input
            autoComplete="email"
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
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="mt-1.5 h-11 w-full rounded-xl border border-[#dfe6dc] px-3 text-[#2d4532] outline-none focus:border-[#8eaa83] focus:ring-4 focus:ring-[#e9f0e5]"
            minLength={8}
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
        {result.message && (
          <p aria-live="polite" className="rounded-xl bg-[#f2f6ef] px-3 py-2.5 text-sm text-[#315c3b]">
            {result.message}
          </p>
        )}

        <button
          className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#315c3b] px-6 text-sm font-semibold text-white transition hover:bg-[#24492e] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
          type="submit"
        >
          {isPending ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

    </section>
  );
}
