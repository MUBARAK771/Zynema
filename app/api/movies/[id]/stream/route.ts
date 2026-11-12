import { NextResponse } from "next/server";
import { getAuthorizedArchiveDownload } from "@/lib/movie-sources";
import { getMovie } from "@/lib/tmdb";

type StreamRequest = {
  archiveId: string;
  fileName: string;
};

function isStreamRequest(body: unknown): body is StreamRequest {
  return (
    typeof body === "object" &&
    body !== null &&
    "archiveId" in body &&
    typeof body.archiveId === "string" &&
    "fileName" in body &&
    typeof body.fileName === "string"
  );
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
    return NextResponse.json({ error: "Invalid movie ID." }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid playback request." }, { status: 400 });
  }

  if (!isStreamRequest(body)) {
    return NextResponse.json({ error: "Invalid playback request." }, { status: 400 });
  }

  try {
    const result = await getMovie(id);
    if (!result) {
      return NextResponse.json({ error: "Movie not found." }, { status: 404 });
    }

    const source = await getAuthorizedArchiveDownload(
      {
        id: result.movie.id,
        title: result.movie.title,
        year: result.movie.year,
        alternativeTitles: result.alternativeTitles,
      },
      body.archiveId,
      body.fileName,
    );

    if (!source?.canStream) {
      return NextResponse.json(
        { error: "This file is no longer available for authorized browser playback." },
        { status: 404 },
      );
    }

    return NextResponse.json(source, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Authorized movie playback lookup failed", error);
    return NextResponse.json(
      { error: "Playback could not be verified. Please try another source." },
      { status: 502 },
    );
  }
}
