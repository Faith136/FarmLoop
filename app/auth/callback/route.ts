import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/supabase/database.types";

function dashboardForRole(role: UserRole): string {
  if (role === "admin") return "/admin/dashboard";
  if (role === "seller") return "/seller";
  return "/marketplace";
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const supabase = await createSupabaseServerClient(true);

  if (!code) {
    return NextResponse.redirect(new URL("/auth?error=confirmation", request.url));
  }

  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

  if (sessionError) {
    return NextResponse.redirect(new URL("/auth?error=confirmation", request.url));
  }

  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    return NextResponse.redirect(new URL("/auth?error=confirmation", request.url));
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (profileError) {
    throw new Error(`Could not load the confirmed account profile: ${profileError.message}`);
  }

  const { error: loginError } = await supabase
    .from("profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", userData.user.id);

  if (loginError) {
    throw new Error(`Could not record the confirmed account login: ${loginError.message}`);
  }

  return NextResponse.redirect(
    new URL(dashboardForRole(profile.role), request.url),
  );
}
