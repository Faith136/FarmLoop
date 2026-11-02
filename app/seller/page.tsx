import type { Metadata } from "next";
import { DashboardPlaceholder } from "@/components/dashboard-placeholder";

export const metadata: Metadata = {
  title: "Seller | FarmLoop",
  description: "Seller workspace for the FarmLoop marketplace.",
};

export default function SellerPage() {
  return (
    <DashboardPlaceholder
      description="The seller workspace will help you create listings from the catalogue and keep availability up to date."
      role="Seller"
      title="Your selling workspace"
    />
  );
}
