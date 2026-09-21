import { shows as fallbackShows } from "@/lib/data";

export type Show = {
  id: number;
  title: string;
  genre: string;
  year: string;
  runtime: string;
  rating: number;
  posterImage?: string;
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

type TVMazeResult = {
  show?: TVMazeShowData;
} & Partial<TVMazeShowData>;

const fallbackPageSize = 8;

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

    return {
      shows: results.map((entry) => {
        const show = entry.show ?? entry;

        return {
          id: show.id,
          title: show.name,
          genre: show.genres?.join(", ") || "Unknown genre",
          year: show.premiered?.slice(0, 4) || "—",
          runtime: show.runtime ? `${show.runtime}m` : "—",
          rating: show.rating?.average ?? 0,
          posterImage: show.image?.original || show.image?.medium,
        };
      }),
      totalPages: 10,
    };
  } catch (error) {
    console.warn("TVMaze fetch failed, falling back to local catalog.", error);

    const sliceStart = (page - 1) * fallbackPageSize;
    const sliced = fallbackShows.slice(sliceStart, sliceStart + fallbackPageSize);

    return {
      shows: sliced,
      totalPages: Math.max(1, Math.ceil(fallbackShows.length / fallbackPageSize)),
    };
  }
}