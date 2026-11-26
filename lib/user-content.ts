import { getSupabaseConfig } from "@/lib/auth";

export type CreatorProfile = {
  user_id: string;
  display_name: string;
  searchable: boolean;
};

export type UserVideo = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  object_path: string;
  mime_type: string;
  created_at: string;
};

function restUrl(path: string): string {
  const { url } = getSupabaseConfig();
  return `${url.replace(/\/$/, "")}/rest/v1/${path}`;
}

async function requestSupabase<T>(
  path: string,
  accessToken: string,
  init: RequestInit = {},
): Promise<T> {
  const { anonKey } = getSupabaseConfig();
  const response = await fetch(restUrl(path), {
    ...init,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase request failed (${response.status}).`);
  }
  return (await response.json()) as T;
}

export async function getCreatorProfile(
  userId: string,
  accessToken: string,
): Promise<CreatorProfile | null> {
  const params = new URLSearchParams({
    select: "user_id,display_name,searchable",
    user_id: `eq.${userId}`,
    limit: "1",
  });
  const profiles = await requestSupabase<CreatorProfile[]>(
    `creator_profiles?${params}`,
    accessToken,
  );
  return profiles[0] ?? null;
}

export async function searchCreatorProfiles(
  query: string,
  accessToken: string,
): Promise<Pick<CreatorProfile, "user_id" | "display_name">[]> {
  if (query.length < 2 || query.length > 40) {
    return [];
  }
  return requestSupabase<Pick<CreatorProfile, "user_id" | "display_name">[]>(
    "rpc/search_creator_profiles",
    accessToken,
    {
      method: "POST",
      body: JSON.stringify({ search_query: query }),
    },
  );
}

export async function getCreatorVideos(
  userId: string,
  accessToken: string,
): Promise<UserVideo[]> {
  const params = new URLSearchParams({
    select: "id,user_id,title,description,object_path,mime_type,created_at",
    user_id: `eq.${userId}`,
    order: "created_at.desc",
    limit: "50",
  });
  return requestSupabase(`videos?${params}`, accessToken);
}

export function getPublicVideoUrl(objectPath: string): string {
  const { url } = getSupabaseConfig();
  const encodedPath = objectPath.split("/").map(encodeURIComponent).join("/");
  return `${url.replace(/\/$/, "")}/storage/v1/object/public/user-videos/${encodedPath}`;
}
