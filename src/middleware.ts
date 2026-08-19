import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware — lightweight, non-authoritative.
 *
 * Security headers are also set in next.config.ts; this is defense-in-depth.
 * Authorization itself always happens server-side (layouts + route handlers),
 * never here. The cookie-existence checks below are only UX fast-paths.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = process.env.SESSION_COOKIE_NAME || "ra_session";
  const hasSession = Boolean(req.cookies.get(sessionCookie)?.value);

  const res = NextResponse.next();

  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-XSS-Protection", "0");

  // Never cache authenticated or API pages.
  if (pathname.startsWith("/api") || pathname.startsWith("/account") || pathname.startsWith("/admin")) {
    res.headers.set("Cache-Control", "no-store, max-age=0");
  }

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/account") && !pathname.startsWith("/account/login") && !pathname.startsWith("/account/register") && !pathname.startsWith("/account/forgot-password") && !pathname.startsWith("/account/reset-password") && !pathname.startsWith("/account/verify-email")) {
    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/account/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/api/:path*",
    "/admin/:path*",
    "/account/:path*",
    "/checkout",
  ],
};
