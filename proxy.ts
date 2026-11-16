import { NextResponse, type NextRequest } from "next/server";
import { DASHBOARD_SESSION_COOKIE, deserializeSessionCookie, getAuthenticatedUserFromSession } from "@/lib/auth";

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
    const loginUrl = new URL(process.env.NEXT_PUBLIC_LOGIN_URL ?? "https://zynema-web.vercel.app");
    loginUrl.searchParams.set("next", `${origin}${pathname}${search}`);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(DASHBOARD_SESSION_COOKIE);
    return response;
  }

  const user = await getAuthenticatedUserFromSession(session);
  if (!user) {
    const loginUrl = new URL(process.env.NEXT_PUBLIC_LOGIN_URL ?? "https://zynema-web.vercel.app");
    loginUrl.searchParams.set("next", `${origin}${pathname}${search}`);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(DASHBOARD_SESSION_COOKIE);
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|js|css)$).*)",
  ],
};
