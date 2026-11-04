import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/supabase/database.types";

export async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/auth");
  }

  const profile = await getProfile(data.user);

  if (profile.is_suspended) {
    redirect("/auth?error=suspended");
  }

  return { supabase, user: data.user, profile };
}

export async function getProfile(user: User): Promise<Profile> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, email, role, is_suspended, last_login_at, created_at")
    .eq("id", user.id)
    .single();

  if (error) {
    throw new Error(`Could not load your account profile: ${error.message}`);
  }

  return data;
}

export async function requireRole(role: UserRole) {
  const { supabase, user, profile } =
    role === "admin" ? await requireAdmin() : await requireUser();

  if (profile.role !== role && profile.role !== "admin") {
    redirect(profile.role === "seller" ? "/seller" : "/marketplace");
  }

  return { supabase, user, profile };
}

export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/admin/login");
  }

  const profile = await getProfile(data.user);

  if (profile.is_suspended) {
    redirect("/admin/login?error=suspended");
  }
  if (profile.role !== "admin") {
    redirect(profile.role === "seller" ? "/seller" : "/marketplace");
  }

  return { supabase, user: data.user, profile };
}
