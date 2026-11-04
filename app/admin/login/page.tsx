import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminLoginForm } from "@/components/auth/admin-login-form";

export const metadata: Metadata = {
  title: "Administrator sign in | FarmLoop",
  description: "Sign in to the FarmLoop administrator workspace.",
};

interface AdminLoginPageProps {
  searchParams: Promise<{
    error?: string;
    session?: string;
  }>;
}

async function AdminLoginContent({
  searchParams,
}: AdminLoginPageProps) {
  const params = await searchParams;
  const initialError =
    params.error === "suspended"
      ? "This administrator account is suspended. Contact a system administrator."
      : params.session === "expired"
        ? "Your session expired. Sign in again to continue."
        : undefined;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#f7f8f3] px-6 py-10">
      <Link aria-label="FarmLoop home" className="mb-8 flex items-center gap-2.5" href="/">
        <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#315c3b] text-xl text-white">🌱</span>
        <span className="text-lg font-semibold tracking-tight text-[#26432f]">FarmLoop</span>
      </Link>
      <AdminLoginForm initialError={initialError} />
    </main>
  );
}

export default function AdminLoginPage(props: AdminLoginPageProps) {
  return (
    <Suspense fallback={<p className="text-sm text-[#778278]">Loading administrator sign in…</p>}>
      <AdminLoginContent searchParams={props.searchParams} />
    </Suspense>
  );
}
