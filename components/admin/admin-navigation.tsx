"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/dashboard", label: "Overview" },
  { href: "/admin/catalogue", label: "Catalogue" },
  { href: "/admin/users", label: "Accounts" },
  { href: "/admin/listings", label: "Listings" },
];

export function AdminNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin navigation" className="border-b border-[#e6eae2] bg-white">
      <ul className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-6 sm:px-10 lg:px-12">
        {links.map((link) => {
          const active = pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <li className="shrink-0" key={link.href}>
              <Link
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-12 items-center border-b-2 px-3 text-sm font-semibold transition ${
                  active
                    ? "border-[#315c3b] text-[#315c3b]"
                    : "border-transparent text-[#778278] hover:text-[#315c3b]"
                }`}
                href={link.href}
              >
                {link.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
