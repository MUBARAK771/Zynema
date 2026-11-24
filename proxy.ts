import { NextResponse, type NextRequest } from "next/server";
import {
  DASHBOARD_SESSION_COOKIE,
  deserializeSessionCookie,
  getLoginUrl,
  serializeSessionCookie,
  verifyDashboardSession,
} from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const { pathname, origin, search } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon.ico") ||
    /\.[A-Za-z0-9]+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(DASHBOARD_SESSION_COOKIE)?.value;
  const session = deserializeSessionCookie(sessionCookie);

  if (!session) {
    const loginUrl = new URL(getLoginUrl());
    loginUrl.searchParams.set("next", `${origin}${pathname}${search}`);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(DASHBOARD_SESSION_COOKIE);
    return response;
  }

  const verified = await verifyDashboardSession(session);
  if (!verified) {
    const loginUrl = new URL(getLoginUrl());
    loginUrl.searchParams.set("next", `${origin}${pathname}${search}`);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(DASHBOARD_SESSION_COOKIE);
    return response;
  }

  const response = NextResponse.next();
  if (verified.session.access_token !== session.access_token || verified.session.refresh_token !== session.refresh_token) {
    response.cookies.set(DASHBOARD_SESSION_COOKIE, serializeSessionCookie(verified.session), {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  return response;
}

export const config = {
  matcher: [
    "/((?!api/auth|api/watchlist|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css)$).*)",
  ],
};
