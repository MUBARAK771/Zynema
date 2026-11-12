import { NextResponse } from "next/server";
import { getAuthorizedArchiveDownload } from "@/lib/movie-sources";
import { getMovie } from "@/lib/tmdb";

type DownloadRequest = {
  archiveId: string;
  fileName: string;
};

function isValidMovieId(id: string) {
  return /^\d+$/.test(id) && Number.isSafeInteger(Number(id)) && Number(id) > 0;
}

function isDownloadRequest(body: unknown): body is DownloadRequest {
  return (
    typeof body === "object" &&
    body !== null &&
    "archiveId" in body &&
    typeof body.archiveId === "string" &&
    "fileName" in body &&
    typeof body.fileName === "string"
  );
}

async function findDownloadUrl(id: string, archiveId: string, fileName: string) {
  const result = await getMovie(id);
  if (!result) return undefined;

  const source = await getAuthorizedArchiveDownload(
    {
      id: result.movie.id,
      title: result.movie.title,
      year: result.movie.year,
      alternativeTitles: result.alternativeTitles,
    },
    archiveId,
    fileName,
  );
  return source?.videoUrl;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const url = new URL(request.url);

  if (!isValidMovieId(id)) {
    return NextResponse.json({ error: "Invalid movie ID." }, { status: 400 });
  }

  try {
    const downloadUrl = await findDownloadUrl(
      id,
      url.searchParams.get("archiveId") ?? "",
      url.searchParams.get("file") ?? "",
    );
    if (!downloadUrl) {
      return NextResponse.json(
        { error: "This file is no longer available or does not have a supported license." },
        { status: 404 },
      );
    }

    return NextResponse.redirect(downloadUrl, {
      status: 302,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Authorized movie download lookup failed", error);
    return NextResponse.json(
      { error: "The download could not be verified. Please try again later." },
      { status: 502 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid download request." }, { status: 400 });
  }

  if (!isDownloadRequest(body)) {
    return NextResponse.json({ error: "Invalid download request." }, { status: 400 });
  }

  if (!isValidMovieId(id)) {
    return NextResponse.json({ error: "Invalid movie ID." }, { status: 400 });
  }

  try {
    const downloadUrl = await findDownloadUrl(id, body.archiveId, body.fileName);
    if (!downloadUrl) {
      return NextResponse.json(
        { error: "This file is no longer available or does not have a supported license." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { downloadUrl },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Authorized movie download lookup failed", error);
    return NextResponse.json(
      { error: "The download could not be verified. Please try again later." },
      { status: 502 },
    );
  }
}
