import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { educationalMaterials } from "@/lib/data/education";

const categories = [
  { icon: "🌾", name: "Crop residue", detail: "Stalks, husks & cobs" },
  { icon: "🐄", name: "Animal manure", detail: "Natural soil nutrients" },
  { icon: "☕", name: "Processing waste", detail: "By-products with value" },
];

const buyerSteps = [
  { icon: "👤", title: "Create an account", description: "Set up your buyer account to get started." },
  { icon: "🌾", title: "Browse products", description: "Explore agricultural materials listed by local sellers." },
  { icon: "🔎", title: "Search or filter", description: "Narrow the options by product or category." },
  { icon: "⚖️", title: "Compare listings", description: "Check prices, quantities, seller locations, and product condition." },
  { icon: "💬", title: "Contact a seller", description: "Ask questions or proceed to the order process when available." },
  { icon: "🚚", title: "Arrange collection or delivery", description: "Agree with the seller on how and when to receive your purchase." },
];

const sellerSteps = [
  { icon: "👤", title: "Create an account", description: "Set up your seller account to get started." },
  { icon: "📚", title: "Browse the product catalogue", description: "Find the catalogue product that matches what you have." },
  { icon: "✅", title: "Select a product", description: "Choose the product you want to offer for sale." },
  { icon: "📝", title: "Create a listing", description: "Add quantity, price, location, condition, and availability." },
  { icon: "📣", title: "Publish your listing", description: "Make your offer visible to buyers in the marketplace." },
  { icon: "💬", title: "Respond to inquiries", description: "Answer buyer questions and discuss the details." },
  { icon: "🚚", title: "Arrange collection or delivery", description: "Agree with the buyer on how and when they will receive it." },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <section className="mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-14 sm:px-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16 lg:px-12 lg:pb-28 lg:pt-20">
          <div>
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#dce6d5] bg-white/80 px-4 py-2 text-sm font-medium text-[#477344]">
              <span className="h-2 w-2 rounded-full bg-[#6a9c5e]" />
              A better use for every harvest
            </p>
            <h1 className="max-w-2xl text-5xl font-semibold leading-[1.08] tracking-[-0.045em] text-[#213d2b] sm:text-6xl lg:text-7xl">
              Waste less.
              <br />
              <span className="text-[#72945e]">Grow more.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-[#647268]">
              The marketplace for agricultural by-products. Help useful
              materials find their next life as feed, compost, and more.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#315c3b] px-7 text-sm font-semibold text-white shadow-sm transition hover:bg-[#24492e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315c3b]"
                href="/marketplace"
              >
                Explore the marketplace <span className="ml-2">↗</span>
              </Link>
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold text-[#315c3b] transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315c3b]"
                href="#how-it-works"
              >
                How it works
              </a>
            </div>
            <div className="mt-12 flex items-center gap-4 border-t border-[#e4e9df] pt-6">
              <div className="flex -space-x-2" aria-hidden="true">
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#f7f8f3] bg-[#dbe7cf] text-sm">🌱</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#f7f8f3] bg-[#f2e7ca] text-sm">🌾</span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#f7f8f3] bg-[#e7e0d1] text-sm">🐄</span>
              </div>
              <p className="text-sm leading-6 text-[#68756b]">
                Connecting local farmers to
                <br />
                a more circular future.
              </p>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -left-5 top-12 h-32 w-32 rounded-full bg-[#e6eedb] blur-2xl" />
            <div className="absolute -right-4 bottom-8 h-40 w-40 rounded-full bg-[#e8ead7] blur-2xl" />
            <div className="relative overflow-hidden rounded-4xl border border-[#e4e9df] bg-white p-5 shadow-[0_24px_70px_-35px_rgba(37,71,44,0.28)] sm:p-7">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-[#778278]">Good things nearby</p>
                  <h2 className="mt-1 text-xl font-semibold tracking-tight text-[#233b2a]">Materials with a next life</h2>
                </div>
                <span className="rounded-full bg-[#edf4e9] px-3 py-1.5 text-xs font-semibold text-[#527b4c]">
                  Sirende & beyond
                </span>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-4 rounded-2xl bg-[#f7f8f3] p-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#e8eedc] text-3xl">🌾</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#2c4231]">Dry maize stalks</p>
                    <p className="mt-1 text-sm text-[#7b857b]">Crop residue · Kitale</p>
                  </div>
                  <p className="whitespace-nowrap text-sm font-semibold text-[#315c3b]">KSh 3 <span className="font-normal text-[#7b857b]">/ kg</span></p>
                </div>
                <div className="flex items-center gap-4 rounded-2xl bg-[#f7f8f3] p-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#f3ebd7] text-3xl">🐔</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#2c4231]">Poultry manure</p>
                    <p className="mt-1 text-sm text-[#7b857b]">Animal manure · Eldoret</p>
                  </div>
                  <p className="whitespace-nowrap text-sm font-semibold text-[#315c3b]">KSh 450 <span className="font-normal text-[#7b857b]">/ bag</span></p>
                </div>
                <div className="flex items-center gap-4 rounded-2xl bg-[#f7f8f3] p-4">
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#efe6dc] text-3xl">☕</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[#2c4231]">Coffee husks</p>
                    <p className="mt-1 text-sm text-[#7b857b]">Processing waste · Nyeri</p>
                  </div>
                  <p className="whitespace-nowrap text-sm font-semibold text-[#315c3b]">KSh 8 <span className="font-normal text-[#7b857b]">/ kg</span></p>
                </div>
              </div>
              <Link
                className="mt-5 flex min-h-12 items-center justify-center rounded-xl border border-[#e1e8dc] text-sm font-semibold text-[#315c3b] transition hover:bg-[#f7f8f3]"
                href="/marketplace"
              >
                See what&apos;s available <span className="ml-2">→</span>
              </Link>
            </div>
            <div className="absolute -bottom-5 -left-5 hidden rounded-2xl border border-[#e4e9df] bg-white px-4 py-3 shadow-lg sm:block">
              <p className="text-xs font-medium text-[#778278]">A little goes a long way</p>
              <p className="mt-1 text-sm font-semibold text-[#315c3b]">Reuse. Restore. Regrow.</p>
            </div>
          </div>
        </section>

        <section className="border-y border-[#e8ebe4] bg-white/70">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-12">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#78916c]">Find a new purpose</p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#213d2b]">Useful materials, close to home.</h2>
              </div>
              <Link className="text-sm font-semibold text-[#315c3b] hover:text-[#203f29]" href="/marketplace">
                Browse all materials <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {categories.map((category) => (
                <Link
                  className="group rounded-2xl border border-[#e5e9e1] bg-[#fbfcf9] p-5 transition hover:-translate-y-0.5 hover:border-[#cbd8c5] hover:shadow-md"
                  href="/marketplace"
                  key={category.name}
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#edf3e8] text-2xl">{category.icon}</span>
                  <h3 className="mt-5 font-semibold text-[#2d4532] group-hover:text-[#315c3b]">{category.name}</h3>
                  <p className="mt-1 text-sm text-[#778278]">{category.detail}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        

        <section aria-labelledby="discover-value-title" className="border-y border-[#e8ebe4] bg-white/70">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-12">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#78916c]">Learn, reuse, grow</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#213d2b] sm:text-4xl" id="discover-value-title">
                Discover the Value
              </h2>
              <p className="mt-4 leading-7 text-[#68766b]">
                Many farm and processing leftovers can have another use. Explore practical ideas for
                putting them to work instead of burning or discarding them. Uses depend on local
                conditions, safe handling, and suitable preparation.
              </p>
            </div>
            <div className="mt-9 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {educationalMaterials.map((material) => (
                <article
                  className="flex h-full flex-col rounded-2xl border border-[#e4e9e1] bg-[#fbfcf9] p-5 sm:p-6"
                  key={material.id}
                >
                  <div className="flex items-start gap-4">
                    <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#edf3e8] text-2xl">
                      {material.icon}
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#78916c]">{material.category}</p>
                      <h3 className="mt-1 text-lg font-semibold text-[#2d4532]">{material.name}</h3>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-[#68766b]">{material.description}</p>
                  <div className="mt-5">
                    <h4 className="text-sm font-semibold text-[#344a38]">Common uses</h4>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-5 text-[#68766b]">
                      {material.commonUses.map((use) => <li key={use}>{use}</li>)}
                    </ul>
                  </div>
                  <div className="mt-5">
                    <h4 className="text-sm font-semibold text-[#344a38]">Environmental benefits</h4>
                    <p className="mt-1.5 text-sm leading-6 text-[#68766b]">{material.environmentalBenefits}</p>
                  </div>
                  <div className="mt-5">
                    <h4 className="text-sm font-semibold text-[#344a38]">Potential buyers and industries</h4>
                    <p className="mt-1.5 text-sm leading-6 text-[#68766b]">{material.potentialBuyers.join(", ")}</p>
                  </div>
                  <Link
                    className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl border border-[#d6dfd1] bg-white px-4 text-sm font-semibold text-[#315c3b] transition hover:bg-[#f0f4ed] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315c3b]"
                    href={material.marketplaceHref}
                  >
                    Explore products <span aria-hidden="true" className="ml-2">→</span>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section aria-labelledby="how-it-works-title" className="mx-auto max-w-7xl px-6 py-16 sm:px-10 lg:px-12" id="how-it-works">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#78916c]">A simple way to get started</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[#213d2b] sm:text-4xl" id="how-it-works-title">
              How It Works
            </h2>
            <p className="mt-4 leading-7 text-[#68766b]">
              Whether you&apos;re looking for useful materials or have something to sell, follow these steps to connect through FarmLoop.
            </p>
          </div>
          <div className="mt-10 grid items-start gap-6 lg:grid-cols-2">
            {[
              {
                audience: "I'm a Buyer",
                description: "Find materials, compare offers, and connect with sellers.",
                steps: buyerSteps,
                href: "/marketplace",
                cta: "Explore Products",
                icon: "🛒",
              },
              {
                audience: "I'm a Seller",
                description: "Create a listing and help your materials find a new use.",
                steps: sellerSteps,
                href: "/seller",
                cta: "Start Selling",
                icon: "🌱",
              },
            ].map((guide) => (
              <article className="flex h-full flex-col rounded-3xl border border-[#e4e9e1] bg-white p-5 shadow-[0_12px_36px_-28px_rgba(37,71,44,0.35)] sm:p-7" key={guide.audience}>
                <div className="flex items-start gap-4 border-b border-[#edf0ea] pb-5">
                  <span aria-hidden="true" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#edf3e8] text-2xl">
                    {guide.icon}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold tracking-tight text-[#2d4532]">{guide.audience}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#778278]">{guide.description}</p>
                  </div>
                </div>
                <ol className="mt-5 flex-1 space-y-4">
                  {guide.steps.map((step, index) => (
                    <li className="flex items-start gap-3" key={step.title}>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f3f6f0] text-lg" aria-hidden="true">
                        {step.icon}
                      </span>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <span className="text-xs font-semibold tabular-nums text-[#78916c]">{String(index + 1).padStart(2, "0")}</span>
                          <h4 className="text-sm font-semibold text-[#344a38]">{step.title}</h4>
                        </div>
                        <p className="mt-1 text-sm leading-5 text-[#778278]">{step.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
                <Link
                  className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-[#315c3b] px-6 text-sm font-semibold text-white transition hover:bg-[#24492e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315c3b]"
                  href={guide.href}
                >
                  {guide.cta} <span aria-hidden="true" className="ml-2">↗</span>
                </Link>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-[#e5e9e1] bg-lime-100">
        <div className="mx-auto max-w-7xl px-6 py-7 text-sm text-[#778278] text-center">
                   <p>Built for a more circular agriculture.</p>
        </div>
      </footer>
    </div>
  );
}
