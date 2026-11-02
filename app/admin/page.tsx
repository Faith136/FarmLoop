import type { Metadata } from "next";
import { DashboardPlaceholder } from "@/components/dashboard-placeholder";

export const metadata: Metadata = {
  title: "Admin | FarmLoop",
  description: "Admin workspace for the FarmLoop marketplace.",
};

export default function AdminPage() {
  return (
    <DashboardPlaceholder
      description="The admin workspace will bring marketplace activity, users, and the product catalogue together."
      role="Admin"
      title="Marketplace overview"
    />
  );
}
