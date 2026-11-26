import { NextResponse } from "next/server";
import { searchMovies } from "@/lib/tmdb";
import { getRequestSession } from "@/lib/auth";
import { searchCreatorProfiles } from "@/lib/user-content";

const defaultBaseUrl = "https://api.tvmaze.com";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ shows: [], movies: [], creators: [] });
  }

  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? defaultBaseUrl).trim().replace(/\/$/, "");

  try {
    const session = await getRequestSession();
    const [showsResult, moviesResult, creatorsResult] = await Promise.allSettled([
      fetch(`${baseUrl}/search/shows?q=${encodeURIComponent(query)}`, { next: { revalidate: 300 } }),
      searchMovies(query, session?.user.language ?? "en-US"),
      session
        ? searchCreatorProfiles(query, session.session.access_token)
        : Promise.resolve([]),
    ]);

    const showsResponse = showsResult.status === "fulfilled" ? showsResult.value : undefined;
    const shows = showsResponse?.ok
      ? await showsResponse.json().catch(() => [])
      : [];
    const movies = moviesResult.status === "fulfilled" ? moviesResult.value : [];
    const creators = creatorsResult.status === "fulfilled" ? creatorsResult.value : [];
    if (creatorsResult.status === "rejected") {
      console.error("Creator search failed", creatorsResult.reason);
    }

    return NextResponse.json({ shows, movies, creators });
  } catch (error) {
    console.error("Search failed", error);
    return NextResponse.json(
      { error: "Unable to search movies and shows" },
      { status: 502 },
    );
  }
}
