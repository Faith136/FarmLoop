import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/supabase/database.types";

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  const { pathname, search } = request.nextUrl;
  const isAdminLogin = pathname === "/admin/login";
  const requiresAuthentication =
    !isAdminLogin && /^\/(admin|seller|buyer|settings)(\/|$)/.test(pathname);

  if (requiresAuthentication && (error || !data.user)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = pathname.startsWith("/admin") ? "/admin/login" : "/auth";
    loginUrl.search = "";
    loginUrl.searchParams.set("redirectTo", `${pathname}${search}`);
    const hasSupabaseAuthCookie = request.cookies
      .getAll()
      .some(({ name }) => name.includes("-auth-token"));
    if (pathname.startsWith("/admin") && hasSupabaseAuthCookie) {
      loginUrl.searchParams.set("session", "expired");
    }

    const redirectResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
