import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export type DashboardSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user_id: string;
};

export const DASHBOARD_SESSION_COOKIE = "sb_dashboard_session";

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getSupabaseConfig() {
  const url = process.env.NEXT_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    url: requireEnv("NEXT_SUPABASE_URL", url),
    anonKey: requireEnv("NEXT_SUPABASE_ANON_KEY", anonKey),
  };
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
    if (
      !parsed.access_token ||
      !parsed.refresh_token ||
      !parsed.user_id ||
      typeof parsed.expires_at !== "number" ||
      !Number.isFinite(parsed.expires_at)
    ) {
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

  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    user?: { id?: string };
  };
  if (
    !data.access_token ||
    !data.refresh_token ||
    !data.user?.id ||
    data.user.id !== session.user_id
  ) {
    return null;
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: Math.floor(Date.now() / 1000) + (Number(data.expires_in) || 3600),
    user_id: data.user.id,
  };
}

export async function verifyDashboardSession(
  session: DashboardSession,
): Promise<{
  session: DashboardSession;
  user: { id: string; email?: string | null; name?: string | null };
} | null> {
  const { url, anonKey } = getSupabaseConfig();
  let activeSession = session;

  if (session.expires_at <= Math.floor(Date.now() / 1000) + 60) {
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
      apikey: anonKey,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const user = (await response.json()) as {
    id?: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  };
  if (!user.id || user.id !== activeSession.user_id) {
    return null;
  }

  const metadata = user.user_metadata ?? {};
  const name = [metadata.full_name, metadata.name, metadata.display_name, metadata.given_name]
    .find((value): value is string => typeof value === "string" && value.trim().length > 0)
    ?.trim()
    .slice(0, 80) ?? null;

  return {
    session: activeSession,
    user: { id: user.id, email: user.email ?? null, name },
  };
}

export async function getRequestSession() {
  const cookieStore = await cookies();
  const session = deserializeSessionCookie(cookieStore.get(DASHBOARD_SESSION_COOKIE)?.value);
  return session ? verifyDashboardSession(session) : null;
}

export function clearDashboardSession(response: NextResponse): NextResponse {
  response.cookies.set(DASHBOARD_SESSION_COOKIE, "", {
    maxAge: 0,
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}

export function isSafeDashboardPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  try {
    const candidate = new URL(value, "https://dashboard.invalid");
    return candidate.origin === "https://dashboard.invalid"
      ? `${candidate.pathname}${candidate.search}${candidate.hash}`
      : "/";
  } catch {
    return "/";
  }
}
