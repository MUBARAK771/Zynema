import { NextResponse } from "next/server";

const defaultBaseUrl = "https://api.tvmaze.com";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json([]);
  }

  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? defaultBaseUrl)
    .trim()
    .replace(/\/$/, "");

  try {
    const response = await fetch(
      `${baseUrl}/search/shows?q=${encodeURIComponent(query)}`,
      { next: { revalidate: 300 } },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Search provider unavailable" },
        { status: response.status },
      );
    }

    return NextResponse.json(await response.json());
  } catch (error) {
    console.error("TVMaze search failed", error);
    return NextResponse.json(
      { error: "Unable to search shows" },
      { status: 502 },
    );
  }
}
