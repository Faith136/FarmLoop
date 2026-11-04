import { logoutAccount, logoutAdmin } from "@/lib/auth/actions";

export function SignOutButton({ admin = false }: { admin?: boolean }) {
  return (
    <form action={admin ? logoutAdmin : logoutAccount}>
      <button
        className="inline-flex min-h-10 items-center justify-center rounded-full border border-[#d6dfd1] bg-white px-4 text-sm font-semibold text-[#315c3b] transition hover:bg-[#f0f4ed]"
        type="submit"
      >
        Sign out
      </button>
    </form>
  );
}
