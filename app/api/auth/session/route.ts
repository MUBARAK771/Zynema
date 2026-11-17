import { NextResponse } from "next/server";
import {
  DASHBOARD_SESSION_COOKIE,
  getRequestSession,
  serializeSessionCookie,
} from "@/lib/auth";

export async function GET() {
  const verified = await getRequestSession();

  if (!verified) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const response = NextResponse.json({
    authenticated: true,
    user: {
      id: verified.user.id,
      email: verified.user.email ?? null,
      name: verified.user.name ?? null,
    },
  });

  response.cookies.set(DASHBOARD_SESSION_COOKIE, serializeSessionCookie(verified.session), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
