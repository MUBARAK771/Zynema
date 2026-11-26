import { NextResponse } from "next/server";
import { getRequestSession, getSupabaseConfig } from "@/lib/auth";

const maxVideoSize = 100 * 1024 * 1024;
const extensions: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

export async function POST(request: Request) {
  const verified = await getRequestSession();
  if (!verified) {
    return NextResponse.json({ error: "Sign in before uploading a video." }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "A valid upload request is required." }, { status: 400 });
  }
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "A valid upload request is required." }, { status: 400 });
  }

  const { mimeType, sizeBytes } = payload as Record<string, unknown>;
  if (typeof mimeType !== "string" || !extensions[mimeType]) {
    return NextResponse.json(
      { error: "Choose an MP4, WebM, or QuickTime video." },
      { status: 400 },
    );
  }
  if (
    typeof sizeBytes !== "number" ||
    !Number.isSafeInteger(sizeBytes) ||
    sizeBytes <= 0 ||
    sizeBytes > maxVideoSize
  ) {
    return NextResponse.json(
      { error: "Video files must be smaller than 100 MB." },
      { status: 400 },
    );
  }

  const objectPath = `${verified.user.id}/${crypto.randomUUID()}.${extensions[mimeType]}`;
  const { url, anonKey } = getSupabaseConfig();
  const storageUrl = `${url.replace(/\/$/, "")}/storage/v1/object/upload/sign/user-videos/${objectPath}`;
  const response = await fetch(storageUrl, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${verified.session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
    cache: "no-store",
  });

  if (!response.ok) {
    console.error(`Supabase could not create a video upload URL (${response.status}).`);
    return NextResponse.json(
      { error: "A secure upload could not be started. Check that the video storage migration is applied." },
      { status: 502 },
    );
  }

  const result = (await response.json()) as { url?: string };
  if (!result.url) {
    console.error("Supabase returned no signed video upload URL.");
    return NextResponse.json({ error: "A secure upload could not be started." }, { status: 502 });
  }

  return NextResponse.json({
    objectPath,
    signedUrl: result.url.startsWith("http")
      ? result.url
      : `${url.replace(/\/$/, "")}/storage/v1${result.url}`,
  });
}
