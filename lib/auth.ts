import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export type DashboardSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id: string;
};

export const DASHBOARD_SESSION_COOKIE = "sb_dashboard_session";
export const DASHBOARD_RETURN_TO_COOKIE = "zynema_return_to";

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseConfig() {
  return {
    url: requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  };
}

export async function makeServerHandoffSignature(payload: Record<string, string | number | null | undefined>): Promise<string> {
  const secret = requireEnv("AUTH_HANDOFF_SECRET", process.env.AUTH_HANDOFF_SECRET);
  const normalized = Object.entries(payload)
    .filter(([, value]) => value !== undefined && value !== null && value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${String(value)}`)
    .join("|");

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(normalized));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function isValidHandoffPayload(payload: unknown): payload is DashboardSession {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const session = payload as Partial<DashboardSession>;
  return Boolean(
    session.access_token &&
      session.refresh_token &&
      session.user_id &&
      typeof session.expires_at === "number" &&
      Number.isFinite(session.expires_at),
  );
}

export function getLoginRedirectUrl(destination: string): string {
  const loginUrl = new URL(requireEnv("NEXT_PUBLIC_LOGIN_URL", process.env.NEXT_PUBLIC_LOGIN_URL));
  loginUrl.searchParams.set("next", destination);
  return loginUrl.toString();
}

export function serializeSessionCookie(session: DashboardSession): string {
  return encodeURIComponent(JSON.stringify(session));
}

export function deserializeSessionCookie(rawValue: string | undefined): DashboardSession | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(rawValue)) as Partial<DashboardSession>;
    if (!parsed.access_token || !parsed.refresh_token || !parsed.user_id || typeof parsed.expires_at !== "number") {
      return null;
    }
    return {
      access_token: parsed.access_token,
      refresh_token: parsed.refresh_token,
      expires_at: parsed.expires_at,
      user_id: parsed.user_id,
    };
  } catch {
    return null;
  }
}

export async function refreshSupabaseSession(session: DashboardSession): Promise<DashboardSession | null> {
  const { url, anonKey } = getSupabaseConfig();

  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: session.refresh_token,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; user?: { id?: string } };
  if (!data.access_token || !data.refresh_token || !data.user?.id) {
    return null;
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + (Number(data.expires_in) || 3600),
    user_id: data.user.id,
  };
}

export async function getAuthenticatedUserFromSession(session: DashboardSession): Promise<{ id: string; email?: string | null } | null> {
  const { url } = getSupabaseConfig();

  const expiresAtMs = session.expires_at * 1000;
  let activeSession = session;

  if (Date.now() >= expiresAtMs) {
    const refreshed = await refreshSupabaseSession(session);
    if (!refreshed) {
      return null;
    }
    activeSession = refreshed;
  }

  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${activeSession.access_token}`,
      apikey: getSupabaseConfig().anonKey,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const user = (await response.json()) as { id?: string; email?: string | null };
  if (!user.id) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
  };
}

export async function getRequestUserFromCookie(cookieHeader?: string | null): Promise<{ id: string; email?: string | null } | null> {
  const cookie = cookieHeader ? `; ${cookieHeader}` : "";
  const match = cookie.match(new RegExp(`(?:^|; )${DASHBOARD_SESSION_COOKIE}=([^;]+)`));
  const session = deserializeSessionCookie(match ? decodeURIComponent(match[1]) : undefined);

  if (!session) {
    return null;
  }

  return getAuthenticatedUserFromSession(session);
}

export async function getRequestUser(): Promise<{ id: string; email?: string | null } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(DASHBOARD_SESSION_COOKIE)?.value;
  const session = deserializeSessionCookie(sessionCookie);

  if (!session) {
    return null;
  }

  return getAuthenticatedUserFromSession(session);
}

export function clearDashboardSession(response: NextResponse): NextResponse {
  response.cookies.set(DASHBOARD_SESSION_COOKIE, "", {
    maxAge: 0,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  response.cookies.set(DASHBOARD_RETURN_TO_COOKIE, "", {
    maxAge: 0,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}

export function requireAuthenticatedRequest(request: NextRequest): { isAuthenticated: boolean; response?: NextResponse } {
  const sessionCookie = request.cookies.get(DASHBOARD_SESSION_COOKIE)?.value;
  const session = deserializeSessionCookie(sessionCookie);

  if (!session) {
    const loginUrl = new URL(requireEnv("NEXT_PUBLIC_LOGIN_URL", process.env.NEXT_PUBLIC_LOGIN_URL));
    loginUrl.searchParams.set("next", request.nextUrl.origin + request.nextUrl.pathname + request.nextUrl.search);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(DASHBOARD_SESSION_COOKIE);
    return { isAuthenticated: false, response };
  }

  return { isAuthenticated: true };
}
