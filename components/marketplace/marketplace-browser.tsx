"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  MARKETPLACE_CATEGORIES,
  type MarketplaceCategory,
  type MarketplaceListing,
} from "@/lib/domain/marketplace";
import { ListingCard } from "@/components/marketplace/listing-card";

interface MarketplaceBrowserProps {
  listings: MarketplaceListing[];
  canRequest: boolean;
}

export function MarketplaceBrowser({ listings, canRequest }: MarketplaceBrowserProps) {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("search") ?? "";
  const categoryParam = searchParams.get("category");
  const initialCategory = MARKETPLACE_CATEGORIES.find((item) => item === categoryParam);

  return (
    <MarketplaceBrowserContent
      category={initialCategory}
      canRequest={canRequest}
      key={`${initialQuery}:${initialCategory ?? ""}`}
      listings={listings}
      query={initialQuery}
    />
  );
}

interface MarketplaceBrowserContentProps {
  category?: MarketplaceCategory;
  listings: MarketplaceListing[];
  query: string;
  canRequest: boolean;
}

function MarketplaceBrowserContent({
  category: initialCategory,
  listings,
  query: initialQuery,
  canRequest,
}: MarketplaceBrowserContentProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<MarketplaceCategory | "All materials">(initialCategory ?? "All materials");

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();

    return listings.filter((listing) => {
      const matchesCategory = category === "All materials" || listing.product.category === category;
      const searchableText = [
        listing.product.name,
        listing.product.category,
        listing.product.description,
        listing.seller.name,
        listing.seller.location,
      ].join(" ").toLocaleLowerCase();

      return matchesCategory && (!normalizedQuery || searchableText.includes(normalizedQuery));
    });
  }, [category, listings, query]);

  return (
    <section aria-label="Available materials" className="pt-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full lg:max-w-md">
          <span className="sr-only">Search materials, sellers, or locations</span>
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#89948a]"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.7" />
            <path d="m16 16 4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" />
          </svg>
          <input
            className="h-12 w-full rounded-xl border border-[#e0e6dc] bg-white pl-12 pr-4 text-sm text-[#2d4532] outline-none transition placeholder:text-[#98a197] focus:border-[#8eaa83] focus:ring-4 focus:ring-[#e9f0e5]"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search materials, sellers, or locations"
            type="search"
            value={query}
          />
        </label>
        <p aria-live="polite" className="text-sm text-[#778278]">
          Showing <span className="font-semibold text-[#405847]">{filteredListings.length}</span> of {listings.length} listings
        </p>
      </div>

      <div aria-label="Filter by category" className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {(["All materials", ...MARKETPLACE_CATEGORIES] as const).map((item) => {
          const isSelected = category === item;

          return (
            <button
              aria-pressed={isSelected}
              className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315c3b] ${
                isSelected
                  ? "bg-[#315c3b] text-white"
                  : "border border-[#e0e6dc] bg-white text-[#667468] hover:border-[#b8c9b0] hover:text-[#315c3b]"
              }`}
              key={item}
              onClick={() => setCategory(item)}
              type="button"
            >
              {item}
            </button>
          );
        })}
      </div>

      {filteredListings.length > 0 ? (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredListings.map((listing) => (
            <ListingCard canRequest={canRequest} key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-[#d8e1d4] bg-white/70 px-6 py-16 text-center">
          <span aria-hidden="true" className="text-4xl">🌱</span>
          <h2 className="mt-4 text-lg font-semibold text-[#2d4532]">No materials found</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#778278]">
            Try a different search or category. New materials are added as local farms list what they have available.
          </p>
          <button
            className="mt-5 text-sm font-semibold text-[#315c3b] underline underline-offset-4 hover:text-[#203f29]"
            onClick={() => {
              setQuery("");
              setCategory("All materials");
            }}
            type="button"
          >
            Clear filters
          </button>
        </div>
      )}
    </section>
  );
}
