import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { SiteHeader } from "@/components/site-header";
import { DeleteAccountControl } from "@/components/auth/delete-account-control";
import { getProfile, requireUser } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "My account | FarmLoop",
  description: "View your FarmLoop account profile.",
};

async function AccountProfile() {
  await connection();
  const { user } = await requireUser();
  const profile = await getProfile(user);
  const workspaceHref =
    profile.role === "admin"
      ? "/admin"
      : profile.role === "seller"
        ? "/seller"
        : "/buyer";

  return (
    <>
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#78916c]">
          My account
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#213d2b] sm:text-5xl">
          Account profile
        </h1>
        <section
          aria-label="Your account details"
          className="mt-8 rounded-3xl border border-[#e3e9df] bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex items-center gap-4 border-b border-[#e3e9df] pb-6">
            <span aria-hidden="true" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#e8efe3] text-xl font-semibold text-[#315c3b]">
              {profile.display_name.slice(0, 1).toUpperCase()}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-xl font-semibold text-[#213d2b]">
                {profile.display_name}
              </h2>
              <p className="mt-1 text-sm capitalize text-[#68766b]">
                {profile.role} account
              </p>
            </div>
          </div>
          <dl className="grid gap-5 pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-[#778278]">
                Name
              </dt>
              <dd className="mt-1 wrap-break-word text-sm text-[#213d2b]">
                {profile.display_name}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-[#778278]">
                Email
              </dt>
              <dd className="mt-1 wrap-break-word text-sm text-[#213d2b]">
                {user.email ?? "Not available"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-[#778278]">
                Account type
              </dt>
              <dd className="mt-1 text-sm capitalize text-[#213d2b]">
                {profile.role}
              </dd>
            </div>
          </dl>
        </section>
        <Link
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-[#315c3b] px-5 text-sm font-semibold text-white transition hover:bg-[#24492e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315c3b]"
          href={workspaceHref}
        >
          Go to {profile.role === "seller" ? "seller workspace" : profile.role === "admin" ? "admin dashboard" : "buyer workspace"}
        </Link>
        {(profile.role === "buyer" || profile.role === "seller") && (
          <section
            aria-labelledby="delete-account-heading"
            className="mt-10 rounded-3xl border border-[#ead8d5] bg-white p-6 shadow-sm sm:p-8"
          >
            <h2
              className="text-xl font-semibold text-[#7b3028]"
              id="delete-account-heading"
            >
              Delete account
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68766b]">
              Permanently delete your FarmLoop account. Your profile, seller
              listings, and account activity will also be removed. This can’t be
              undone.
            </p>
            <div className="mt-5">
              <DeleteAccountControl />
            </div>
          </section>
        )}
        {profile.role === "admin" && (
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d6dfd1] bg-white px-5 text-sm font-semibold text-[#315c3b] transition hover:bg-[#f0f4ed]"
              href="/seller"
            >
              Open seller workspace
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#d6dfd1] bg-white px-5 text-sm font-semibold text-[#315c3b] transition hover:bg-[#f0f4ed]"
              href="/marketplace"
            >
              Open buyer marketplace
            </Link>
          </div>
        )}
    </>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
        <Suspense fallback={<p className="text-sm text-[#778278]">Loading your account…</p>}>
          <AccountProfile />
        </Suspense>
      </main>
    </div>
  );
}
