import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const cookieOptions: CookieOptions = {
  maxAge: 60 * 60 * 24,
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  httpOnly: true,
};

const PROTECTED_PATHS = [
  "/dashboard",
  "/leads",
  "/opportunities",
  "/accounts",
  "/contacts",
  "/calendar",
  "/admin",
];

export async function middleware(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  const response = NextResponse.next();
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions,
    cookies: {
      get(name) {
        return request.cookies.get(name)?.value;
      },
      set(name, value, options) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name, options) {
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const [sessionResponse, userResponse] = await Promise.all([
    supabase.auth.getSession(),
    supabase.auth.getUser(),
  ]);
  const session = sessionResponse.data.session;
  const user = userResponse.data.user;

  const { pathname } = request.nextUrl;
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/auth/callback");
  const isProtectedRoute = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  if (session && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("requires_password_reset")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.requires_password_reset && pathname !== "/auth/reset-password") {
      const redirectUrl = new URL("/auth/reset-password", request.url);
      redirectUrl.searchParams.set("redirect", request.nextUrl.pathname);
      return NextResponse.redirect(redirectUrl);
    }

    if (!profile?.requires_password_reset && pathname === "/auth/reset-password") {
      const redirectTo = request.nextUrl.searchParams.get("redirect") ?? "/dashboard";
      return NextResponse.redirect(new URL(redirectTo, request.url));
    }
  }

  if ((!session || !user) && isProtectedRoute) {
    const redirectUrl = new URL("/login", request.url);
    redirectUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (session && user && isAuthRoute) {
    const redirectTo = request.nextUrl.searchParams.get("redirect") ?? "/dashboard";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/leads/:path*",
    "/opportunities/:path*",
    "/accounts/:path*",
    "/contacts/:path*",
    "/calendar/:path*",
    "/admin/:path*",
    "/login",
    "/auth/callback",
    "/auth/reset-password",
  ],
};
