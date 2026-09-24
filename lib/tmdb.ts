export type Movie = {
  id: number;
  title: string;
  genre: string;
  year: string;
  runtime: string;
  rating: number;
  posterImage?: string;
  overview?: string;
};

export type WatchProvider = {
  name: string;
  logoPath: string | null;
  link: string;
};

type TMDBMovie = {
  id: number;
  title: string;
  release_date: string;
  genre_ids?: number[];
  vote_average: number;
  poster_path: string | null;
};

type TMDBResponse = {
  results: TMDBMovie[];
  total_pages: number;
};

type TMDBMovieDetails = TMDBMovie & {
  overview: string;
  runtime: number | null;
  backdrop_path: string | null;
  genres?: { id: number; name: string }[];
};

type TMDBProvider = {
  provider_name: string;
  logo_path: string | null;
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

function getGenreNames(movie: TMDBMovie & { genres?: { id: number; name: string }[] }) {
  if (movie.genres?.length) {
    return movie.genres.map((genre) => genre.name).join(", ");
  }

  return (movie.genre_ids ?? [])
    .map((genreId) => genreNames[genreId])
    .filter(Boolean)
    .join(", ");
}

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
      genre: getGenreNames(movie) || "Movie",
      year: movie.release_date?.slice(0, 4) || "—",
      runtime: "Movie",
      rating: movie.vote_average,
      overview: undefined,
      posterImage: movie.poster_path
        ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
        : undefined,
    })),
    totalPages: Math.min(data.total_pages, 500),
  };
}

export async function getLatestMovie(): Promise<Movie | null> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new Error("TMDB_API_KEY is not configured");
  }

  const url = new URL("https://api.themoviedb.org/3/movie/latest");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", "en-US");

  const response = await fetch(url, {
    next: { revalidate: 3600 },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Unable to load the latest movie from TMDB");

  const movie = (await response.json()) as TMDBMovie & { overview?: string };

  return {
    id: movie.id,
    title: movie.title,
    genre: getGenreNames(movie) || "Movie",
    year: movie.release_date?.slice(0, 4) || "—",
    runtime: "Movie",
    rating: movie.vote_average,
    overview: movie.overview,
    posterImage: movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : undefined,
  };
}

export async function getMovie(id: string): Promise<{
  movie: Movie & { overview: string; backdropImage?: string };
  providers: WatchProvider[];
} | null> {
  const apiKey = process.env.TMDB_API_KEY;

  if (!apiKey) {
    throw new Error("TMDB_API_KEY is not configured");
  }

  const movieUrl = new URL(`https://api.themoviedb.org/3/movie/${encodeURIComponent(id)}`);
  movieUrl.searchParams.set("api_key", apiKey);
  movieUrl.searchParams.set("language", "en-US");

  const providerUrl = new URL(`https://api.themoviedb.org/3/movie/${encodeURIComponent(id)}/watch/providers`);
  providerUrl.searchParams.set("api_key", apiKey);

  const [movieResponse, providerResponse] = await Promise.all([
    fetch(movieUrl, { next: { revalidate: 3600 } }),
    fetch(providerUrl, { next: { revalidate: 3600 } }),
  ]);

  if (movieResponse.status === 404) return null;
  if (!movieResponse.ok) throw new Error("Unable to load movie details from TMDB");

  const movie = (await movieResponse.json()) as TMDBMovieDetails;
  const providerData = providerResponse.ok
    ? ((await providerResponse.json()) as { results?: Record<string, { link?: string; flatrate?: TMDBProvider[]; rent?: TMDBProvider[]; buy?: TMDBProvider[] }> })
    : { results: {} };
  const region = providerData.results?.US;
  const uniqueProviders = new Map<string, WatchProvider>();

  for (const provider of [...(region?.flatrate ?? []), ...(region?.rent ?? []), ...(region?.buy ?? [])]) {
    if (region?.link && !uniqueProviders.has(provider.provider_name)) {
      uniqueProviders.set(provider.provider_name, {
        name: provider.provider_name,
        logoPath: provider.logo_path,
        link: region.link,
      });
    }
  }

  return {
    movie: {
      id: movie.id,
      title: movie.title,
      genre: getGenreNames(movie) || "Movie",
      year: movie.release_date?.slice(0, 4) || "—",
      runtime: movie.runtime ? `${movie.runtime}m` : "Movie",
      rating: movie.vote_average,
      overview: movie.overview || "No description available.",
      posterImage: movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : undefined,
      backdropImage: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : undefined,
    },
    providers: [...uniqueProviders.values()],
  };
}