import { Suspense, type ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import {
  AdminNavigation,
  type AdminNavigationKey,
} from "@/components/admin/admin-navigation";
import { requireRole } from "@/lib/auth/server";

interface AdminLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  activeSection?: AdminNavigationKey;
}

async function AdminNavigationForUser({
  activeSection,
}: {
  activeSection?: AdminNavigationKey;
}) {
  const { profile } = await requireRole("admin");
  return (
    <AdminNavigation
      activeSection={activeSection}
      adminEmail={profile.email}
      adminName={profile.display_name}
    />
  );
}

export function AdminLayout({
  title,
  description,
  children,
  activeSection,
}: AdminLayoutProps) {
  return (
    <div className="-mb-20 min-h-screen bg-[#f7f8f3] md:mb-0">
      <SiteHeader />
      <div className="lg:flex">
        <Suspense fallback={<aside aria-hidden="true" className="hidden w-68 shrink-0 border-r border-[#e4e9e1] bg-white lg:block" />}>
          <AdminNavigationForUser activeSection={activeSection} />
        </Suspense>
        <main className="min-w-0 flex-1 px-4 pb-12 pt-7 sm:px-7 sm:pt-9 lg:px-10 lg:py-10 xl:px-12">
          <div className="mb-8 border-b border-[#e4e9e1] pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#78916c]">
              Admin workspace
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#213d2b] sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#68766b] sm:text-base">
              {description}
            </p>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
