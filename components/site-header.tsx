import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { UserRole } from "@/lib/supabase/database.types";

export function SiteHeader() {
  return (
    <Suspense fallback={<HeaderFallback />}>
      <SiteHeaderContent />
    </Suspense>
  );
}

function HeaderFallback() {
  return (
    <header className="border-b border-[#e6eae2] bg-[#f7f8f3]/90">
      <div className="mx-auto flex h-19 max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-12">
        <Link aria-label="FarmLoop home" className="flex items-center gap-2.5" href="/">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#315c3b] text-xl text-white" aria-hidden="true">🌱</span>
          <span className="text-lg font-semibold tracking-tight text-[#26432f]">FarmLoop</span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-3 sm:gap-7">
          <Link className="hidden text-sm font-medium text-[#59695d] sm:block" href="/marketplace">Marketplace</Link>
          <Link className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#315c3b] px-4 text-sm font-semibold text-white sm:px-5" href="/auth">Sign in</Link>
        </nav>
      </div>
    </header>
  );
}

async function SiteHeaderContent() {
  let account: {
    href: string;
    label: string;
    displayName: string;
    role: UserRole;
  } | null = null;

  if (isSupabaseConfigured()) {
    await connection();
    const supabase = await createSupabaseServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (!userError && userData.user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("display_name, role")
        .eq("id", userData.user.id)
        .single();

      if (profileError) {
        throw new Error(`Could not load your account navigation: ${profileError.message}`);
      }

      account = {
        href: profile.role === "admin" ? "/admin" : profile.role === "seller" ? "/seller" : "/buyer",
        label: profile.role === "admin" ? "Admin dashboard" : profile.role === "seller" ? "Seller workspace" : "Buyer workspace",
        displayName: profile.display_name,
        role: profile.role,
      };
    }
  }

  return (
    <header className="border-b border-[#e6eae2] bg-[#f7f8f3]/90">
      <div className="mx-auto flex h-19 max-w-7xl items-center justify-between px-6 sm:px-10 lg:px-12">
        <Link aria-label="FarmLoop home" className="flex items-center gap-2.5" href="/">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#315c3b] text-xl text-white" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
              <path d="M12 20v-8m0 4c-4.5 0-7-2.5-7-7 4.5 0 7 2.5 7 7Zm0-3c0-4.5 2.5-7 7-7 0 4.5-2.5 7-7 7Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-tight text-[#26432f]">FarmLoop</span>
        </Link>
        <nav aria-label="Main navigation" className="flex items-center gap-3 sm:gap-7">
          <Link className="hidden text-sm font-medium text-[#59695d] transition hover:text-[#315c3b] sm:block" href="/marketplace">
            Marketplace
          </Link>
          <Link className="hidden text-sm font-medium text-[#59695d] transition hover:text-[#315c3b] sm:block" href="/#how-it-works">
            How it works
          </Link>
          {account ? (
            <>
              <Link className="whitespace-nowrap text-xs font-semibold text-[#315c3b] transition hover:text-[#24492e] sm:text-sm" href={account.href}>
                <span className="sm:hidden">Workspace</span>
                <span className="hidden sm:inline">{account.label}</span>
              </Link>
              <Link
                aria-label={`My account: ${account.displayName}, ${account.role}`}
                className="hidden max-w-48 items-center gap-2 rounded-full border border-[#d6dfd1] bg-white py-1.5 pl-1.5 pr-3 transition hover:bg-[#f0f4ed] lg:flex"
                href="/settings"
              >
                <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e8efe3] text-sm font-semibold text-[#315c3b]">
                  {account.displayName.slice(0, 1).toUpperCase()}
                </span>
                <span className="min-w-0 text-left">
                  <span className="block truncate text-xs font-semibold text-[#315c3b]">{account.displayName}</span>
                  <span className="block text-[10px] capitalize text-[#778278]">{account.role}</span>
                </span>
              </Link>
              <SignOutButton admin={account.role === "admin"} />
            </>
          ) : (
            <>
              <Link
                className="hidden min-h-10 items-center justify-center rounded-full border border-[#d6dfd1] bg-white px-4 text-sm font-semibold text-[#315c3b] transition hover:bg-[#f0f4ed] sm:inline-flex sm:px-5"
                href="/auth?mode=register"
              >
                Create account
              </Link>
              <Link
                className="inline-flex min-h-10 items-center justify-center rounded-full bg-[#315c3b] px-4 text-sm font-semibold text-white transition hover:bg-[#24492e] sm:px-5"
                href="/auth"
              >
                Sign in
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
