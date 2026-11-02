import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "Settings | FarmLoop",
  description: "Settings for your FarmLoop marketplace experience.",
};

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#78916c]">
          Your preferences
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#213d2b] sm:text-5xl">
          Settings
        </h1>
        <p className="mt-4 max-w-xl leading-7 text-[#68766b]">
          Account and marketplace preferences will be available here in a
          future step. This static page does not save personal information.
        </p>
        <Link
          className="mt-7 inline-flex min-h-11 items-center justify-center rounded-full bg-[#315c3b] px-5 text-sm font-semibold text-white transition hover:bg-[#24492e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315c3b]"
          href="/marketplace"
        >
          Browse the marketplace
        </Link>
      </main>
    </div>
  );
}
