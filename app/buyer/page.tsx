import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "Buyer | FarmLoop",
  description: "Buyer workspace for the FarmLoop marketplace.",
};

async function BuyerRedirect(): Promise<never> {
  await requireRole("buyer");
  redirect("/marketplace");
}

export default function BuyerPage() {
  return (
    <Suspense fallback={<p className="p-8 text-sm text-[#778278]">Loading your marketplace…</p>}>
      <BuyerRedirect />
    </Suspense>
  );
}
