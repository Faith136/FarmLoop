import type { Metadata } from "next";
import { DashboardPlaceholder } from "@/components/dashboard-placeholder";

export const metadata: Metadata = {
  title: "Buyer | FarmLoop",
  description: "Buyer workspace for the FarmLoop marketplace.",
};

export default function BuyerPage() {
  return (
    <DashboardPlaceholder
      description="The buyer workspace will make it easier to track materials, compare sellers, and manage inquiries."
      role="Buyer"
      title="Your buying workspace"
    />
  );
}
