import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Sign in or join | FarmLoop",
  description: "Create a buyer or seller account, or sign in to FarmLoop.",
};

interface AuthPageProps {
  searchParams: Promise<{
    mode?: string;
    role?: string;
    error?: string;
    redirectTo?: string;
    deleted?: string;
  }>;
}

async function AuthPageContent({ searchParams }: AuthPageProps) {
  const params = await searchParams;

  return <AuthForm
    confirmationFailed={params.error === "confirmation"}
    accountSuspended={params.error === "suspended"}
    accountDeleted={params.deleted === "1"}
    initialMode={params.mode === "register" ? "register" : "login"}
    initialRole={params.role === "seller" ? "seller" : "buyer"}
    initialRedirectTo={params.redirectTo ?? ""}
  />;
}

export default function AuthPage(props: AuthPageProps) {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto flex max-w-7xl flex-col items-center px-6 py-10 sm:px-10 sm:py-16">
        <Suspense fallback={<p className="text-sm text-[#778278]">Loading account options…</p>}>
          <AuthPageContent searchParams={props.searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
