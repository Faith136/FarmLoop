"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
  {
    label: "Home",
    href: "/",
    icon: (
      <path
        d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    ),
  },
  {
    label: "Products",
    href: "/marketplace",
    icon: (
      <>
        <path
          d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
        <path
          d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12v8.5"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.7"
        />
      </>
    ),
  },
  {
    label: "My Account",
    href: "/settings",
    icon: (
      <>
        <circle
          cx="12"
          cy="12"
          r="3"
          stroke="currentColor"
          strokeWidth="1.7"
        />
        <path
          d="m19.4 15 .1.1a1.7 1.7 0 0 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a1.7 1.7 0 0 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 0 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9H4a1.7 1.7 0 0 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 0 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2V4a1.7 1.7 0 0 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 0 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a1.7 1.7 0 0 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2.9Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
      </>
    ),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-[#e3e9df] bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-20px_rgba(37,71,44,0.35)] backdrop-blur md:hidden"
    >
      <ul className="mx-auto grid min-h-16 max-w-lg grid-cols-3">
        {navigationItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <li className="flex" key={item.href}>
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`flex min-h-16 w-full flex-col items-center justify-center gap-1 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#315c3b] ${
                  isActive
                    ? "text-[#315c3b]"
                    : "text-[#7a867b] hover:text-[#315c3b]"
                }`}
                href={item.href}
              >
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  {item.icon}
                </svg>
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
