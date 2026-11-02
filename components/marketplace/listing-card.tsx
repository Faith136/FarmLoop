import type { MarketplaceListing } from "@/lib/domain/marketplace";

interface ListingCardProps {
  listing: MarketplaceListing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const availableUntil = new Date(`${listing.availableUntil}T00:00:00`).toLocaleDateString("en-KE", {
    day: "numeric",
    month: "short",
  });

  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#e4e9e1] bg-white p-5 shadow-[0_6px_24px_-20px_rgba(37,71,44,0.3)] transition hover:-translate-y-0.5 hover:border-[#cbd8c5] hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eff4e9] text-3xl" aria-hidden="true">
          {listing.product.icon}
        </span>
        <span className="rounded-full bg-[#f3f6f0] px-3 py-1.5 text-xs font-medium text-[#667468]">
          {listing.product.category}
        </span>
      </div>
      <div className="mt-4">
        <h2 className="text-lg font-semibold tracking-tight text-[#2b4331]">{listing.product.name}</h2>
        <p className="mt-1 text-sm leading-6 text-[#778278]">{listing.product.description}</p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-[#f7f8f3] p-3.5">
        <div>
          <p className="text-xs text-[#849085]">Available</p>
          <p className="mt-1 font-semibold text-[#344a38]">{listing.quantityAvailable.toLocaleString("en-KE")} {listing.unit}{listing.quantityAvailable === 1 ? "" : "s"}</p>
        </div>
        <div>
          <p className="text-xs text-[#849085]">Price</p>
          <p className="mt-1 font-semibold text-[#344a38]">
            KSh {listing.pricePerUnit.toLocaleString("en-KE")} <span className="text-xs font-normal text-[#778278]">/ {listing.unit}</span>
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-start gap-3 text-sm">
        <svg aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#78916c]" fill="none" viewBox="0 0 24 24">
          <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" stroke="currentColor" strokeWidth="1.7" />
          <circle cx="12" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.7" />
        </svg>
        <span className="text-[#667468]">{listing.seller.location}</span>
      </div>
      <div className="mt-3 flex items-start gap-3 text-sm">
        <svg aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#78916c]" fill="none" viewBox="0 0 24 24">
          <path d="M12 3 14.8 8.7l6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9L12 3Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
        </svg>
        <span className="text-[#667468]">{listing.condition}</span>
      </div>
      <div className="mt-4 border-t border-[#edf0ea] pt-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-[#89948a]">Seller</p>
            <p className="mt-1 text-sm font-semibold text-[#405847]">{listing.seller.name}</p>
          </div>
          <p className="text-right text-xs leading-5 text-[#89948a]">Available until<br /><span className="font-medium text-[#667468]">{availableUntil}</span></p>
        </div>
        <a
          className="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-[#315c3b] px-4 text-sm font-semibold text-white transition hover:bg-[#24492e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315c3b]"
          href={`mailto:${listing.seller.email}?subject=${encodeURIComponent(`Question about ${listing.product.name}`)}`}
        >
          Contact seller <span aria-hidden="true" className="ml-2">↗</span>
        </a>
      </div>
    </article>
  );
}
