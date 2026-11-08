import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AdminLayout } from "@/app/admin/admin-layout";
import { requireRole } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Buyer and seller accounts | FarmLoop",
  description: "View buyer and seller accounts and their status.",
};

async function AccountsTable({ roleFilter }: { roleFilter: "buyer" | "seller" | null }) {
  const { supabase } = await requireRole("admin");
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, role, is_suspended, last_login_at, created_at")
    .in("role", roleFilter ? [roleFilter] : ["buyer", "seller"])
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Could not load buyer and seller accounts: ${error.message}`);
  }

  const accountType = roleFilter ?? "buyer or seller";

  return (
    <section aria-label={`${accountType} accounts`} className="overflow-x-auto rounded-2xl border border-[#e4e9e1] bg-white">
      <table className="w-full min-w-190 text-left text-sm">
        <thead className="bg-[#f7f8f3] text-xs uppercase tracking-wide text-[#778278]">
          <tr>
            <th className="px-5 py-3 font-semibold">Name</th>
            <th className="px-5 py-3 font-semibold">Email</th>
            <th className="px-5 py-3 font-semibold">Account type</th>
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 font-semibold">Last sign-in</th>
            <th className="px-5 py-3 font-semibold">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#edf0ea]">
          {profiles.map((profile) => (
            <tr key={profile.id}>
              <td className="px-5 py-4 font-medium text-[#344a38]">{profile.display_name}</td>
              <td className="px-5 py-4 text-[#667468]">{profile.email ?? "Not available"}</td>
              <td className="px-5 py-4 capitalize text-[#667468]">{profile.role}</td>
              <td className={`px-5 py-4 font-medium ${profile.is_suspended ? "text-[#934b42]" : "text-[#315c3b]"}`}>
                {profile.is_suspended ? "Suspended" : "Active"}
              </td>
              <td className="px-5 py-4 text-[#667468]">
                {profile.last_login_at
                  ? new Date(profile.last_login_at).toLocaleDateString("en", {
                      dateStyle: "medium",
                    })
                  : "Never"}
              </td>
              <td className="px-5 py-4">
                <Link
                  className="font-semibold text-[#315c3b] underline underline-offset-4"
                  href={`/admin/users/${profile.id}`}
                >
                  View account
                </Link>
              </td>
            </tr>
          ))}
          {profiles.length === 0 && (
            <tr>
              <td className="px-5 py-10 text-center text-[#778278]" colSpan={6}>
                No {accountType} accounts found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

interface AdminUsersPageProps {
  searchParams: Promise<{ role?: string | string[] }>;
}

async function AdminUsersContent({ searchParams }: AdminUsersPageProps) {
  const params = await searchParams;
  const roleFilter =
    params.role === "buyer" || params.role === "seller" ? params.role : null;
  const title =
    roleFilter === "seller"
      ? "Seller accounts"
      : roleFilter === "buyer"
        ? "Buyer accounts"
        : "Buyer and seller accounts";
  const description =
    roleFilter === "seller"
      ? "Review seller accounts, account status, and recent sign-in activity."
      : roleFilter === "buyer"
        ? "Review buyer accounts, account status, and recent sign-in activity."
        : "View account details and manage buyer or seller access. Account suspension is separate from listing moderation.";

  return (
    <AdminLayout
      activeSection={roleFilter === "seller" ? "sellers" : roleFilter === "buyer" ? "buyers" : undefined}
      description={description}
      title={title}
    >
      <Suspense fallback={<p className="text-sm text-[#778278]">Loading accounts…</p>}>
        <AccountsTable roleFilter={roleFilter} />
      </Suspense>
    </AdminLayout>
  );
}

export default function AdminUsersPage(props: AdminUsersPageProps) {
  return (
    <Suspense fallback={<p className="px-6 py-10 text-sm text-[#778278]">Loading accounts…</p>}>
      <AdminUsersContent searchParams={props.searchParams} />
    </Suspense>
  );
}
