import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

type CookieToSet = {
  name: string;
  value: string;
  options?: Parameters<NextResponse["cookies"]["set"]>[2];
};

const authRoutes = new Set(["/login", "/signup"]);

const protectedRoutePrefixes = [
  "/dashboard",
  "/review",
  "/stats",
  "/missed",
  "/import",
  "/practice",
  "/banks/new",
];

const protectedRoutePatterns = [
  /^\/banks\/[^/]+\/edit$/,
  /^\/banks\/[^/]+\/questions\/new$/,
  /^\/banks\/[^/]+\/questions\/[^/]+\/edit$/,
];

function isProtectedRoute(pathname: string) {
  return (
    protectedRoutePrefixes.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    ) || protectedRoutePatterns.some((pattern) => pattern.test(pathname))
  );
}

export async function proxy(request: NextRequest) {
  const refreshedCookies: CookieToSet[] = [];

  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            refreshedCookies.push({ name, value, options });
          });

          response = NextResponse.next({
            request,
          });

          refreshedCookies.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  let finalResponse = response;

  if (user && authRoutes.has(pathname)) {
    finalResponse = NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!user && isProtectedRoute(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
    finalResponse = NextResponse.redirect(loginUrl);
  }

  refreshedCookies.forEach(({ name, value, options }) => {
    finalResponse.cookies.set(name, value, options);
  });

  return finalResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
