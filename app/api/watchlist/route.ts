import { NextResponse } from "next/server";
import {
  DASHBOARD_SESSION_COOKIE,
  getRequestSession,
  getSupabaseConfig,
  serializeSessionCookie,
  type DashboardSession,
} from "@/lib/auth";

type WatchlistRow = {
  item_type: "movie" | "show";
  item_id: string;
  title: string;
  year: string;
  poster_image: string | null;
};

function withSessionCookie(response: NextResponse, session: DashboardSession) {
  response.cookies.set(DASHBOARD_SESSION_COOKIE, serializeSessionCookie(session), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

async function getSupabaseError(response: Response, action: string, session: DashboardSession) {
  const details = await response.text();
  console.error(`Supabase watchlist ${action} failed (${response.status}): ${details}`);
  return withSessionCookie(
    NextResponse.json(
      { error: "Your My List could not be saved. Check that the Supabase watchlist migration has been applied." },
      { status: 502 },
    ),
    session,
  );
}

function toWatchlistItem(row: WatchlistRow) {
  return {
    type: row.item_type,
    id: row.item_id,
    title: row.title,
    year: row.year,
    posterImage: row.poster_image ?? undefined,
    key: `${row.item_type}:${row.item_id}`,
  };
}

function isWatchlistType(value: unknown): value is "movie" | "show" {
  return value === "movie" || value === "show";
}

function isNumericId(value: unknown): value is string {
  return typeof value === "string" && /^\d{1,32}$/.test(value);
}

function isSecureImageUrl(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export async function GET() {
  const verified = await getRequestSession();
  if (!verified) {
    return NextResponse.json({ error: "Sign in to view your My List." }, { status: 401 });
  }

  const { url, anonKey } = getSupabaseConfig();
  const query = new URL(`${url.replace(/\/$/, "")}/rest/v1/watchlist_items`);
  query.searchParams.set("select", "item_type,item_id,title,year,poster_image");
  query.searchParams.set("order", "created_at.desc");

  const response = await fetch(query, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${verified.session.access_token}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return getSupabaseError(response, "read", verified.session);
  }

  const rows = (await response.json()) as WatchlistRow[];
  return withSessionCookie(
    NextResponse.json(rows.map(toWatchlistItem)),
    verified.session,
  );
}

export async function POST(request: Request) {
  const verified = await getRequestSession();
  if (!verified) {
    return NextResponse.json({ error: "Sign in to save items to My List." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON item is required." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "A valid item is required." }, { status: 400 });
  }

  const entry = payload as Record<string, unknown>;
  const type = entry.type;
  const id = entry.id;
  const title = typeof entry.title === "string" ? entry.title.trim() : "";
  const year = typeof entry.year === "string" ? entry.year.trim() : "";
  const posterImage = entry.posterImage;

  if (
    !isWatchlistType(type) ||
    !isNumericId(id) ||
    !title ||
    title.length > 300 ||
    !year ||
    year.length > 40 ||
    (posterImage !== null && posterImage !== undefined && !isSecureImageUrl(posterImage))
  ) {
    return NextResponse.json({ error: "The item details are invalid." }, { status: 400 });
  }

  const { url, anonKey } = getSupabaseConfig();
  const endpoint = new URL(`${url.replace(/\/$/, "")}/rest/v1/watchlist_items`);
  endpoint.searchParams.set("on_conflict", "user_id,item_type,item_id");

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${verified.session.access_token}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      user_id: verified.user.id,
      item_type: type,
      item_id: id,
      title,
      year,
      poster_image: typeof posterImage === "string" ? posterImage : null,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    return getSupabaseError(response, "save", verified.session);
  }

  return withSessionCookie(NextResponse.json({ saved: true }), verified.session);
}

export async function DELETE(request: Request) {
  const verified = await getRequestSession();
  if (!verified) {
    return NextResponse.json({ error: "Sign in to edit your My List." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid item reference is required." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "A valid item reference is required." }, { status: 400 });
  }

  const entry = payload as Record<string, unknown>;
  if (!isWatchlistType(entry.type) || !isNumericId(entry.id)) {
    return NextResponse.json({ error: "The item reference is invalid." }, { status: 400 });
  }

  const { url, anonKey } = getSupabaseConfig();
  const endpoint = new URL(`${url.replace(/\/$/, "")}/rest/v1/watchlist_items`);
  endpoint.searchParams.set("item_type", `eq.${entry.type}`);
  endpoint.searchParams.set("item_id", `eq.${entry.id}`);

  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${verified.session.access_token}`,
      Prefer: "return=minimal",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return getSupabaseError(response, "remove", verified.session);
  }

  return withSessionCookie(NextResponse.json({ removed: true }), verified.session);
}
