export type Movie = {
  id: number;
  title: string;
  genre: string;
  year: string;
  runtime: string;
  rating: number;
  posterImage?: string;
};

type TMDBMovie = {
  id: number;
  title: string;
  release_date: string;
  genre_ids: number[];
  vote_average: number;
  poster_path: string | null;
};

type TMDBResponse = {
  results: TMDBMovie[];
  total_pages: number;
};

const genreNames: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export async function getMovies(page = 1): Promise<{ movies: Movie[]; totalPages: number }> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new Error("TMDB_API_KEY is not configured");
  }

  const url = new URL("https://api.themoviedb.org/3/discover/movie");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "en-US");
  url.searchParams.set("sort_by", "popularity.desc");
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("page", String(page));

  const response = await fetch(url, {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error("Unable to load movies from TMDB");
  }

  const data = (await response.json()) as TMDBResponse;

  return {
    movies: data.results.map((movie) => ({
      id: movie.id,
      title: movie.title,
      genre:
        movie.genre_ids.map((genreId) => genreNames[genreId]).filter(Boolean).join(", ") ||
        "Movie",
      year: movie.release_date?.slice(0, 4) || "—",
      runtime: "Movie",
      rating: movie.vote_average,
      posterImage: movie.poster_path
        ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
        : undefined,
    })),
    totalPages: Math.min(data.total_pages, 500),
  };
}