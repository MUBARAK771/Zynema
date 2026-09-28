import { NextResponse } from "next/server";
import { searchMovies } from "@/lib/tmdb";

const defaultBaseUrl = "https://api.tvmaze.com";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ shows: [], movies: [] });
  }

  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? defaultBaseUrl).trim().replace(/\/$/, "");

  try {
    const [showsResult, moviesResult] = await Promise.allSettled([
      fetch(`${baseUrl}/search/shows?q=${encodeURIComponent(query)}`, { next: { revalidate: 300 } }),
      searchMovies(query),
    ]);

    const showsResponse = showsResult.status === "fulfilled" ? showsResult.value : undefined;
    const shows = showsResponse?.ok
      ? await showsResponse.json().catch(() => [])
      : [];
    const movies = moviesResult.status === "fulfilled" ? moviesResult.value : [];

    return NextResponse.json({ shows, movies });
  } catch (error) {
    console.error("Search failed", error);
    return NextResponse.json(
      { error: "Unable to search movies and shows" },
      { status: 502 },
    );
  }
}
