import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

interface DashboardPlaceholderProps {
  role: "Admin" | "Buyer" | "Seller";
  title: string;
  description: string;
}

export function DashboardPlaceholder({
  role,
  title,
  description,
}: DashboardPlaceholderProps) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#78916c]">
          {role} workspace
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#213d2b] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[#68766b]">{description}</p>
        <section className="mt-8 rounded-2xl border border-dashed border-[#d8e1d4] bg-white/70 px-6 py-12 text-center sm:px-10">
          <span aria-hidden="true" className="text-4xl">
            🌱
          </span>
          <h2 className="mt-4 text-xl font-semibold text-[#2d4532]">
            Your {role.toLowerCase()} tools are coming next
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#778278]">
            This route is ready for the next development step. For now, explore
            the static marketplace to see available materials.
          </p>
          <Link
            className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[#315c3b] px-5 text-sm font-semibold text-white transition hover:bg-[#24492e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#315c3b]"
            href="/marketplace"
          >
            Explore marketplace
          </Link>
        </section>
      </main>
    </div>
  );
}
