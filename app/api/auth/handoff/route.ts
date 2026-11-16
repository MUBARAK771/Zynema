import { NextResponse } from "next/server";
import {
  DASHBOARD_SESSION_COOKIE,
  getSupabaseConfig,
  isValidHandoffPayload,
  makeServerHandoffSignature,
  serializeSessionCookie,
} from "@/lib/auth";

export async function POST(request: Request) {
  const requestOrigin = request.headers.get("origin");
  const expectedOrigin = process.env.NEXT_PUBLIC_LOGIN_URL ?? "https://zynema-web.vercel.app";

  if (requestOrigin && new URL(requestOrigin).origin !== new URL(expectedOrigin).origin) {
    return NextResponse.json({ error: "Origin not allowed" }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON payload is required." }, { status: 400 });
  }

  if (!isValidHandoffPayload(payload)) {
    return NextResponse.json({ error: "Invalid handoff payload." }, { status: 400 });
  }

  const signature = request.headers.get("x-zynema-handoff-signature");
  const computedSignature = await makeServerHandoffSignature(payload);

  if (!signature || signature !== computedSignature) {
    return NextResponse.json({ error: "Handoff signature rejected." }, { status: 401 });
  }

  const { url, anonKey } = getSupabaseConfig();
  const userResponse = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${payload.access_token}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!userResponse.ok) {
    return NextResponse.json({ error: "Supabase session validation failed." }, { status: 401 });
  }

  const user = (await userResponse.json()) as { id?: string };
  if (!user.id || user.id !== payload.user_id) {
    return NextResponse.json({ error: "User mismatch during handoff." }, { status: 401 });
  }

  const response = NextResponse.json({ authenticated: true, user: { id: user.id } }, { status: 200 });
  response.cookies.set(DASHBOARD_SESSION_COOKIE, serializeSessionCookie(payload), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
