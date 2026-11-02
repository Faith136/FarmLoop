import Link from "next/link";

export function SiteHeader() {
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
            Admin
          </Link>
          <Link className="hidden text-sm font-medium text-[#59695d] transition hover:text-[#315c3b] sm:block" href="/marketplace">
            Marketplace
          </Link>
          <Link className="hidden text-sm font-medium text-[#59695d] transition hover:text-[#315c3b] sm:block" href="/#how-it-works">
            How it works
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#d6dfd1] bg-white px-4 text-sm font-semibold text-[#315c3b] transition hover:bg-[#f0f4ed] sm:px-5"
            href="/marketplace"
          >
            Log In
          </Link>
        </nav>
      </div>
    </header>
  );
}
