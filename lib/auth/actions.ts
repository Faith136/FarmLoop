"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/server";
import type { UserRole } from "@/lib/supabase/database.types";
import { redirect } from "next/navigation";

export interface AuthActionResult {
  error?: string;
  message?: string;
  redirectTo?: string;
}

export async function logoutAccount() {
  const supabase = await createSupabaseServerClient(true);
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Could not sign out: ${error.message}`);
  }

  redirect("/auth");
}

export async function logoutAdmin() {
  const supabase = await createSupabaseServerClient(true);
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Could not sign out: ${error.message}`);
  }

  redirect("/admin/login");
}

export async function deleteOwnAccount(): Promise<AuthActionResult> {
  const { supabase, profile } = await requireUser();

  if (profile.role !== "buyer" && profile.role !== "seller") {
    return { error: "Only buyer and seller accounts can be deleted here." };
  }

  const { error } = await supabase.rpc("delete_own_account");
  if (error) {
    return { error: `Could not delete your account: ${error.message}` };
  }

  revalidatePath("/marketplace");
  revalidatePath("/seller");
  revalidatePath("/settings");

  const writableSupabase = await createSupabaseServerClient(true);
  const { error: signOutError } = await writableSupabase.auth.signOut({
    scope: "local",
  });
  if (
    signOutError &&
    ![401, 403, 404].includes(signOutError.status ?? 0)
  ) {
    throw new Error(`Your account was deleted, but your session could not be cleared: ${signOutError.message}`);
  }

  redirect("/auth?deleted=1");
}

function dashboardForRole(role: UserRole): string {
  if (role === "admin") return "/admin/dashboard";
  if (role === "seller") return "/seller";
  return "/marketplace";
}

function safeRedirectTo(value: string): string | null {
  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  try {
    const url = new URL(value, "http://farmloop.local");
    if (url.origin !== "http://farmloop.local") {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}

export async function registerAccount(
  formData: FormData,
): Promise<AuthActionResult> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const requestedRole = String(formData.get("role") ?? "");

  if (displayName.length < 2 || displayName.length > 100) {
    return { error: "Enter a name between 2 and 100 characters long." };
  }
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: "Enter a valid email address." };
  }
  if (password.length < 8 || password.length > 128) {
    return { error: "Your password must be between 8 and 128 characters long." };
  }
  if (requestedRole !== "buyer" && requestedRole !== "seller") {
    return { error: "Choose a buyer or seller account." };
  }

  const supabase = await createSupabaseServerClient(true);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: new URL("/auth/callback", siteUrl).toString(),
      data: { display_name: displayName, role: requestedRole },
    },
  });

  if (error) {
    return { error: error.message };
  }
  if (!data.session) {
    return {
      message: "Check your email to confirm your account, then sign in.",
    };
  }
  if (!data.user) {
    return { error: "Your account was created, but the account details are unavailable." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  if (profileError) {
    return {
      error: `Your account was created, but its profile could not be loaded: ${profileError.message}`,
    };
  }

  const { error: loginError } = await supabase
    .from("profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", data.user.id);

  if (loginError) {
    return { error: `Could not record your login: ${loginError.message}` };
  }

  const requestedRedirect = safeRedirectTo(
    String(formData.get("redirectTo") ?? ""),
  );
  return { redirectTo: requestedRedirect ?? dashboardForRole(profile.role) };
}

export async function loginAccount(
  formData: FormData,
): Promise<AuthActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length === 0 ||
    password.length > 128
  ) {
    return { error: "Enter your email address and password." };
  }

  const supabase = await createSupabaseServerClient(true);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_suspended")
    .eq("id", data.user.id)
    .single();

  if (profileError) {
    return {
      error: `Your account profile could not be loaded: ${profileError.message}`,
    };
  }
  if (profile.is_suspended) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      throw new Error(`Could not clear the suspended account session: ${signOutError.message}`);
    }
    return { error: "This account is suspended. Contact FarmLoop support for assistance." };
  }
  if (profile.role === "admin") {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      throw new Error(`Could not clear the administrator session: ${signOutError.message}`);
    }
    return { error: "Use the administrator sign-in page to access the admin workspace." };
  }

  const { error: loginError } = await supabase
    .from("profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", data.user.id);

  if (loginError) {
    return { error: `Could not record your login: ${loginError.message}` };
  }

  return { redirectTo: dashboardForRole(profile.role) };
}

export async function loginAdminAccount(
  formData: FormData,
): Promise<AuthActionResult> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    password.length === 0 ||
    password.length > 128
  ) {
    return { error: "Enter your email address and password." };
  }

  const supabase = await createSupabaseServerClient(true);
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Email or password is incorrect, or this account is not an administrator." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_suspended")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      throw new Error(`Could not clear the unverified admin session: ${signOutError.message}`);
    }
    return { error: "Could not verify this account's administrator access." };
  }

  if (profile.role !== "admin" || profile.is_suspended) {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      throw new Error(`Could not clear the non-admin session: ${signOutError.message}`);
    }
    return { error: "Email or password is incorrect, or this account is not an active administrator." };
  }

  const { error: loginError } = await supabase
    .from("profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", data.user.id);

  if (loginError) {
    throw new Error(`Could not record your login: ${loginError.message}`);
  }

  return { redirectTo: "/admin/dashboard" };
}
