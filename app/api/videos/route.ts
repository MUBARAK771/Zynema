import { NextResponse } from "next/server";
import { getRequestSession, getSupabaseConfig } from "@/lib/auth";

const maxVideoSize = 100 * 1024 * 1024;
const videoMimeTypes = new Set(["video/mp4", "video/webm", "video/quicktime"]);

export async function POST(request: Request) {
  const verified = await getRequestSession();
  if (!verified) {
    return NextResponse.json({ error: "Sign in before publishing a video." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid video description is required." }, { status: 400 });
  }
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "A valid video description is required." }, { status: 400 });
  }

  const body = payload as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const objectPath = typeof body.objectPath === "string" ? body.objectPath : "";
  const mimeType = typeof body.mimeType === "string" ? body.mimeType : "";
  const sizeBytes = body.sizeBytes;
  const ownedPathPattern = new RegExp(
    `^${verified.user.id}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(mp4|webm|mov)$`,
    "i",
  );

  if (!title || title.length > 120 || description.length > 2000) {
    return NextResponse.json(
      { error: "Add a title up to 120 characters and a description up to 2,000 characters." },
      { status: 400 },
    );
  }
  if (
    !ownedPathPattern.test(objectPath) ||
    !videoMimeTypes.has(mimeType) ||
    typeof sizeBytes !== "number" ||
    !Number.isSafeInteger(sizeBytes) ||
    sizeBytes <= 0 ||
    sizeBytes > maxVideoSize
  ) {
    return NextResponse.json({ error: "The uploaded video details are invalid." }, { status: 400 });
  }

  const { url, anonKey } = getSupabaseConfig();
  const baseUrl = url.replace(/\/$/, "");
  const response = await fetch(`${baseUrl}/rest/v1/videos`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${verified.session.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      user_id: verified.user.id,
      title,
      description,
      object_path: objectPath,
      mime_type: mimeType,
      size_bytes: sizeBytes,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error(`Video metadata could not be saved (${response.status}).`);
    const cleanupResponse = await fetch(
      `${baseUrl}/storage/v1/object/user-videos/${objectPath}`,
      {
        method: "DELETE",
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${verified.session.access_token}`,
        },
        cache: "no-store",
      },
    );
    if (!cleanupResponse.ok) {
      console.error(`Unpublished video cleanup failed (${cleanupResponse.status}).`);
    }
    return NextResponse.json(
      { error: "Your video could not be published. Please try uploading it again." },
      { status: 502 },
    );
  }

  const videos = (await response.json()) as Array<{
    id: string;
    title: string;
    description: string;
  }>;
  if (!videos[0]?.id) {
    console.error("Supabase saved video metadata but returned no video record.");
    return NextResponse.json({ error: "Your video could not be confirmed." }, { status: 502 });
  }

  return NextResponse.json({ video: videos[0] }, { status: 201 });
}
