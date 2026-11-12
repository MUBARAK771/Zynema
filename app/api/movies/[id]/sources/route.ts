import { NextResponse } from "next/server";
import { searchMovieSources } from "@/lib/movie-sources";
import { getMovie } from "@/lib/tmdb";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!/^\d+$/.test(id) || !Number.isSafeInteger(Number(id)) || Number(id) <= 0) {
    return NextResponse.json({ error: "Invalid movie ID." }, { status: 400 });
  }

  const requestedPage = Number(new URL(request.url).searchParams.get("page") ?? "1");
  if (!Number.isInteger(requestedPage) || requestedPage < 1 || requestedPage > 1000) {
    return NextResponse.json({ error: "Invalid page number." }, { status: 400 });
  }

  try {
    const result = await getMovie(id);
    if (!result) {
      return NextResponse.json({ error: "Movie not found." }, { status: 404 });
    }

    const sources = await searchMovieSources(
      {
        id: result.movie.id,
        title: result.movie.title,
        year: result.movie.year,
        alternativeTitles: result.alternativeTitles,
      },
      requestedPage,
    );

    return NextResponse.json(sources, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("Movie source lookup failed", error);
    return NextResponse.json(
      { error: "Movie sources are temporarily unavailable. Please try again later." },
      { status: 502 },
    );
  }
}
