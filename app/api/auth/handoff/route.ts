import { NextResponse } from "next/server";
import {
  DASHBOARD_SESSION_COOKIE,
  getApprovedLoginOrigins,
  getSupabaseConfig,
  isSafeDashboardPath,
  serializeSessionCookie,
} from "@/lib/auth";

function handoffError(message: string, status: number) {
  return new NextResponse(`${message}\nPlease return to the sign-in page and try again.`, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/x-www-form-urlencoded")) {
    return handoffError("This sign-in request has an unsupported format.", 415);
  }

  const requestOrigin = request.headers.get("origin");

  let actualOrigin: string;
  try {
    actualOrigin = requestOrigin ? new URL(requestOrigin).origin : "";
  } catch {
    actualOrigin = "";
  }

  if (!actualOrigin || !getApprovedLoginOrigins().includes(actualOrigin)) {
    return handoffError("This sign-in request did not come from the approved Zynema login site.", 403);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return handoffError("We could not read the sign-in request.", 400);
  }

  const accessToken = formData.get("access_token");
  const refreshToken = formData.get("refresh_token");
  const userId = formData.get("user_id");
  const expiresAt = Number(formData.get("expires_at"));
  const requestedNext = formData.get("next");
  const nextPath = isSafeDashboardPath(typeof requestedNext === "string" ? requestedNext : null);

  if (
    typeof accessToken !== "string" ||
    typeof refreshToken !== "string" ||
    typeof userId !== "string" ||
    !accessToken ||
    !refreshToken ||
    !userId ||
    !Number.isFinite(expiresAt) ||
    expiresAt <= Math.floor(Date.now() / 1000)
  ) {
    return handoffError("Your sign-in session is invalid or expired.", 400);
  }

  const { url, anonKey } = getSupabaseConfig();
  const userResponse = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!userResponse.ok) {
    return handoffError("We could not verify your Supabase session.", 401);
  }

  const user = (await userResponse.json()) as { id?: string };
  if (!user.id || user.id !== userId) {
    return handoffError("The signed-in account could not be verified.", 401);
  }

  const session = {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: expiresAt,
    user_id: user.id,
  };
  const response = NextResponse.redirect(new URL(nextPath, request.url), 303);
  response.cookies.set(DASHBOARD_SESSION_COOKIE, serializeSessionCookie(session), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}
