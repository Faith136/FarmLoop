import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { AdminNavigation } from "@/components/admin/admin-navigation";

export function AdminLayout({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <AdminNavigation />
      <main className="mx-auto max-w-7xl px-6 py-10 sm:px-10 sm:py-14 lg:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#78916c]">
          Admin workspace
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[#213d2b] sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl leading-7 text-[#68766b]">{description}</p>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
