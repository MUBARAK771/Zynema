import { shows as fallbackShows } from "@/lib/data";

export type Show = {
  id: string;
  title: string;
  genre: string;
  year: string;
  runtime: string;
  rating: number;
  posterImage?: string;
  trailerUrl?: string;
};

type TVMazeShowData = {
  id: number;
  name: string;
  genres: string[];
  premiered: string | null;
  runtime: number | null;
  rating: { average: number | null };
  image: { medium: string; original: string } | null;
};

type TVMazeResult = TVMazeShowData | { show: TVMazeShowData };

type TmdbVideoResult = {
  key: string;
  site: string;
  type?: string;
  official?: boolean;
};

type TmdbSearchResult = {
  id?: number;
  media_type?: "movie" | "tv";
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
};

const fallbackPageSize = 8;

async function getTmdbTrailerUrl(title: string, year?: string): Promise<string | undefined> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    return undefined;
  }

  const searchUrl = new URL("https://api.themoviedb.org/3/search/multi");
  searchUrl.searchParams.set("api_key", apiKey);
  searchUrl.searchParams.set("query", title);
  searchUrl.searchParams.set("language", "en-US");

  if (year && year !== "—") {
    searchUrl.searchParams.set("year", year);
  }

  let searchResponse: Response;

  try {
    searchResponse = await fetch(searchUrl, {
      next: { revalidate: 86400 },
    });
  } catch {
    return undefined;
  }

  if (!searchResponse.ok) {
    return undefined;
  }

  const searchData = (await searchResponse.json()) as { results?: TmdbSearchResult[] };
  const bestMatch =
    searchData.results?.find((result) => result.media_type === "movie" || result.media_type === "tv") ??
    searchData.results?.[0];

  if (!bestMatch?.id || !bestMatch.media_type) {
    return undefined;
  }

  const videosUrl = new URL(`https://api.themoviedb.org/3/${bestMatch.media_type}/${bestMatch.id}/videos`);
  videosUrl.searchParams.set("api_key", apiKey);
  videosUrl.searchParams.set("language", "en-US");

  let videosResponse: Response;

  try {
    videosResponse = await fetch(videosUrl, {
      next: { revalidate: 86400 },
    });
  } catch {
    return undefined;
  }

  if (!videosResponse.ok) {
    return undefined;
  }

  const videoData = (await videosResponse.json()) as { results?: TmdbVideoResult[] };
  const trailer =
    videoData.results?.find(
      (video) =>
        video.site === "YouTube" &&
        (video.type === "Trailer" || video.official === true),
    ) ??
    videoData.results?.find((video) => video.site === "YouTube");

  if (!trailer?.key) {
    return undefined;
  }

  return `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&loop=1&playlist=${trailer.key}&controls=0&showinfo=0&rel=0`;
}

export async function getShows(page = 1): Promise<{ shows: Show[]; totalPages: number }> {
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.tvmaze.com")
    .trim()
    .replace(/\/$/, "");

  try {
    const response = await fetch(`${baseUrl}/shows?page=${page}`, {
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      throw new Error("Unable to load shows from TVMaze");
    }

    const results = (await response.json()) as TVMazeResult[];
    const shows = await Promise.all(
      results.map(async (entry) => {
        const show = "show" in entry ? entry.show : entry;
        const year = show.premiered?.slice(0, 4) || "—";

        return {
          id: String(show.id),
          title: show.name,
          genre: show.genres?.join(", ") || "Unknown genre",
          year,
          runtime: show.runtime ? `${show.runtime}m` : "—",
          rating: show.rating?.average ?? 0,
          posterImage: show.image?.original || show.image?.medium,
          trailerUrl: await getTmdbTrailerUrl(show.name, year),
        };
      }),
    );

    return {
      shows,
      totalPages: 10,
    };
  } catch (error) {
    console.warn("TVMaze fetch failed, falling back to local catalog.", error);

    const sliceStart = (page - 1) * fallbackPageSize;
    const sliced = fallbackShows.slice(sliceStart, sliceStart + fallbackPageSize);

    return {
      shows: sliced.map((show) => ({
        id: String(show.id),
        title: show.title,
        genre: show.genre,
        year: String(show.year),
        runtime: show.runtime,
        rating: show.rating,
        posterImage: show.posterImage,
        trailerUrl: undefined,
      })),
      totalPages: Math.max(1, Math.ceil(fallbackShows.length / fallbackPageSize)),
    };
  }
}