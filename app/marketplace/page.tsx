import { Suspense } from "react";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { getAvailableListings } from "@/lib/data/marketplace";

export const metadata: Metadata = {
  title: "Marketplace | FarmLoop",
  description: "Browse available agricultural by-products from local sellers.",
};

export default function MarketplacePage() {
  const listings = getAvailableListings();

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
        <div className="flex flex-col justify-between gap-6 border-b border-[#e3e9df] pb-8 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#78916c]">The marketplace</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#213d2b] sm:text-5xl">Find a new use for it.</h1>
            <p className="mt-4 max-w-2xl leading-7 text-[#68766b]">
              Browse useful agricultural materials available from local farms.
              Compare sellers, quantities, and prices to find the right fit.
            </p>
          </div>
          <p className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#59695d] shadow-sm ring-1 ring-[#e3e9df]">
            <span className="font-semibold text-[#315c3b]">{listings.length}</span> available listings
          </p>
        </div>
        <Suspense fallback={<div className="pt-8 text-sm text-[#778278]">Loading materials...</div>}>
          <MarketplaceBrowser listings={listings} />
        </Suspense>
      </main>
    </div>
  );
}
