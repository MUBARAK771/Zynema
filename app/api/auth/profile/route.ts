import { NextResponse } from "next/server";
import {
  DASHBOARD_SESSION_COOKIE,
  getRequestSession,
  getSupabaseConfig,
  serializeSessionCookie,
} from "@/lib/auth";
import { getCreatorProfile } from "@/lib/user-content";

const languagePattern = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/i;

export async function GET() {
  const verified = await getRequestSession();
  if (!verified) {
    return NextResponse.json({ error: "Sign in to view your profile." }, { status: 401 });
  }

  try {
    let profile = await getCreatorProfile(verified.user.id, verified.session.access_token);
    if (!profile) {
      const { url, anonKey } = getSupabaseConfig();
      const createResponse = await fetch(
        `${url.replace(/\/$/, "")}/rest/v1/creator_profiles?on_conflict=user_id`,
        {
          method: "POST",
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${verified.session.access_token}`,
            "Content-Type": "application/json",
            Prefer: "resolution=ignore-duplicates,return=minimal",
          },
          body: JSON.stringify({
            user_id: verified.user.id,
            display_name: verified.user.name ?? "Zynema Creator",
            searchable: false,
          }),
          cache: "no-store",
        },
      );
      if (!createResponse.ok) {
        console.error(`Creator profile initialization failed (${createResponse.status}).`);
        return NextResponse.json(
          { error: "Your creator profile could not be loaded." },
          { status: 502 },
        );
      }
      profile = await getCreatorProfile(verified.user.id, verified.session.access_token);
    }

    if (!profile) {
      return NextResponse.json(
        { error: "Your creator profile could not be loaded." },
        { status: 502 },
      );
    }
    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Creator profile lookup failed.", error);
    return NextResponse.json(
      { error: "Your creator profile could not be loaded." },
      { status: 502 },
    );
  }
}

export async function PATCH(request: Request) {
  const verified = await getRequestSession();
  if (!verified) {
    return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid JSON profile is required." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "A valid profile is required." }, { status: 400 });
  }

  const profile = payload as Record<string, unknown>;
  const name = typeof profile.name === "string" ? profile.name.trim() : "";
  const language = typeof profile.language === "string" ? profile.language.trim() : "";
  const searchable = profile.searchable;

  if (!name || name.length > 80) {
    return NextResponse.json({ error: "Name must be between 1 and 80 characters." }, { status: 400 });
  }
  if (!languagePattern.test(language) || language.length > 35) {
    return NextResponse.json({ error: "Choose a supported content language." }, { status: 400 });
  }
  if (typeof searchable !== "boolean") {
    return NextResponse.json({ error: "Choose whether your profile appears in creator search." }, { status: 400 });
  }

  const { url, anonKey } = getSupabaseConfig();
  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
    method: "PUT",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${verified.session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      data: { ...verified.user.metadata, full_name: name, language },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const details = await response.text();
    console.error(`Supabase profile update failed (${response.status}): ${details}`);
    return NextResponse.json(
      { error: "Your profile could not be saved. Please try again." },
      { status: 502 },
    );
  }

  const result = (await response.json()) as {
    id?: string;
    email?: string | null;
    user_metadata?: Record<string, unknown>;
  };
  if (result.id !== verified.user.id) {
    console.error("Supabase returned a different user after a profile update.");
    return NextResponse.json({ error: "Your profile could not be verified." }, { status: 502 });
  }

  const creatorProfileResponse = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/creator_profiles?on_conflict=user_id`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${verified.session.access_token}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        user_id: verified.user.id,
        display_name: name,
        searchable,
        updated_at: new Date().toISOString(),
      }),
      cache: "no-store",
    },
  );
  if (!creatorProfileResponse.ok) {
    console.error(`Creator profile update failed (${creatorProfileResponse.status}).`);
    return NextResponse.json(
      { error: "Your creator search profile could not be saved." },
      { status: 502 },
    );
  }

  const updatedName =
    typeof result.user_metadata?.full_name === "string"
      ? result.user_metadata.full_name
      : name;
  const updatedLanguage =
    typeof result.user_metadata?.language === "string"
      ? result.user_metadata.language
      : language;
  const updatedResponse = NextResponse.json({
    user: {
      id: result.id,
      email: result.email ?? verified.user.email ?? null,
      name: updatedName,
      language: updatedLanguage,
      searchable,
    },
  });
  updatedResponse.cookies.set(
    DASHBOARD_SESSION_COOKIE,
    serializeSessionCookie(verified.session),
    {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    },
  );
  return updatedResponse;
}
