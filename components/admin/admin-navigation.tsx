"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export type AdminNavigationKey =
  | "overview"
  | "transactions"
  | "sellers"
  | "buyers"
  | "catalogue"
  | "listings";

const navigationGroups = [
  {
    label: "Workspace",
    items: [
      { key: "overview", href: "/admin/dashboard", label: "Overview", icon: "overview" },
      { key: "transactions", href: "/admin/orders", label: "Orders & transactions", icon: "listings" },
      { key: "sellers", href: "/admin/users?role=seller", label: "Sellers", icon: "sellers" },
      { key: "buyers", href: "/admin/users?role=buyer", label: "Buyers", icon: "buyers" },
    ],
  },
  {
    label: "Management",
    items: [
      { key: "catalogue", href: "/admin/catalogue", label: "Catalogue", icon: "catalogue" },
      { key: "listings", href: "/admin/listings", label: "Product listings", icon: "listings" },
      { key: "marketplace", href: "/marketplace", label: "Marketplace", icon: "marketplace" },
    ],
  },
] as const;

function NavigationIcon({ name }: { name: string }) {
  const common = {
    "aria-hidden": true as const,
    className: "h-5 w-5 shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.7,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "overview":
      return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>;
    case "sellers":
      return <svg {...common}><path d="M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-3A4.5 4.5 0 0 0 4 18.5V20" /><circle cx="10" cy="7.5" r="3.5" /><path d="M16 4.2a3.5 3.5 0 0 1 0 6.6M18 14a4.5 4.5 0 0 1 2 3.8V20" /></svg>;
    case "buyers":
      return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>;
    case "catalogue":
      return <svg {...common}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12v8.5" /></svg>;
    case "listings":
      return <svg {...common}><path d="M8 4H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" /><rect x="9" y="2" width="6" height="4" rx="1" /><path d="M8 11h8M8 15h8" /></svg>;
    case "marketplace":
      return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>;
    default:
      return <svg {...common}><circle cx="12" cy="8" r="4" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></svg>;
  }
}

export function AdminNavigation({
  adminName,
  adminEmail,
  activeSection,
}: {
  adminName: string;
  adminEmail: string | null;
  activeSection?: AdminNavigationKey;
}) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  function isActive(key: string, href: string) {
    if (key === "sellers" || key === "buyers") {
      return activeSection === key;
    }
    if (activeSection && key === activeSection) {
      return true;
    }
    const path = href.split("?")[0];
    return pathname === path || (path !== "/admin/dashboard" && pathname.startsWith(`${path}/`));
  }

  function renderLinks(mobile = false) {
    return (
      <>
        {navigationGroups.map((group) => (
          <div className="mt-6 first:mt-0" key={group.label}>
            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#98a397]">
              {group.label}
            </p>
            <ul className="mt-2 space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.key, item.href);
                return (
                  <li key={item.key}>
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
                        active
                          ? "bg-[#edf4e9] text-[#315c3b]"
                          : "text-[#657267] hover:bg-[#f4f6f1] hover:text-[#315c3b]"
                      }`}
                      href={item.href}
                      onClick={mobile ? () => setIsMobileMenuOpen(false) : undefined}
                    >
                      <NavigationIcon name={item.icon} />
                      <span>{item.label}</span>
                      {active && <span aria-hidden="true" className="ml-auto h-1.5 w-1.5 rounded-full bg-[#59835b]" />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <div className="mt-6 border-t border-[#edf0ea] pt-4">
          <Link
            aria-current={pathname === "/settings" ? "page" : undefined}
            className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
              pathname === "/settings"
                ? "bg-[#edf4e9] text-[#315c3b]"
                : "text-[#657267] hover:bg-[#f4f6f1] hover:text-[#315c3b]"
            }`}
            href="/settings"
            onClick={mobile ? () => setIsMobileMenuOpen(false) : undefined}
          >
            <NavigationIcon name="profile" />
            Admin profile
          </Link>
        </div>
      </>
    );
  }

  const profileCard = (
    <Link
      className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#e7ece4] bg-[#f8faf6] p-3 transition hover:border-[#d3dfce]"
      href="/settings"
    >
      <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dfeadd] text-sm font-bold text-[#315c3b]">
        {adminName.slice(0, 1).toUpperCase()}
      </span>
      <span className="min-w-0 text-left">
        <span className="block truncate text-sm font-semibold text-[#2d4532]">{adminName}</span>
        <span className="block truncate text-xs text-[#778278]">{adminEmail ?? "Administrator"}</span>
      </span>
      <span aria-hidden="true" className="ml-auto text-[#8a978b]">›</span>
    </Link>
  );

  return (
    <>
      <div className="border-b border-[#e4e9e1] bg-white px-4 py-3 lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#829080]">Admin workspace</p>
            <p className="mt-0.5 text-sm font-semibold text-[#2d4532]">Navigation</p>
          </div>
          <button
            aria-controls="admin-mobile-navigation"
            aria-expanded={isMobileMenuOpen}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#dfe6dc] bg-white px-3 text-sm font-semibold text-[#315c3b] hover:bg-[#f4f6f1]"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            type="button"
          >
            <span>{isMobileMenuOpen ? "Close" : "Menu"}</span>
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" viewBox="0 0 24 24">
              {isMobileMenuOpen ? <path d="m6 6 12 12M18 6 6 18" /> : <path d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
        {isMobileMenuOpen && (
          <nav aria-label="Admin navigation" className="pt-4" id="admin-mobile-navigation">
            {profileCard}
            <div className="mt-4">{renderLinks(true)}</div>
          </nav>
        )}
      </div>

      <aside className="hidden w-68 shrink-0 border-r border-[#e4e9e1] bg-white px-4 py-6 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="px-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#829080]">FarmLoop</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-[#29432f]">Admin workspace</h2>
        </div>
        <div className="mt-6">{profileCard}</div>
        <nav aria-label="Admin navigation" className="mt-7 flex-1">
          {renderLinks()}
        </nav>
        <div className="mt-6 rounded-2xl bg-[#f5f7f2] p-4">
          <p className="text-xs font-semibold text-[#315c3b]">FarmLoop operations</p>
          <p className="mt-1 text-xs leading-5 text-[#778278]">Manage accounts, products, and marketplace activity.</p>
        </div>
      </aside>
    </>
  );
}
