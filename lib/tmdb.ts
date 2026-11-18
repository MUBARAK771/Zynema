export type Movie = {
  id: number;
  title: string;
  genre: string;
  year: string;
  releaseDate?: string;
  runtime: string;
  rating: number;
  posterImage?: string;
  backdropImage?: string;
  overview?: string;
};

export type TMDBLocale = {
  code: string;
  name: string;
};

export type WatchProvider = {
  name: string;
  logoPath: string | null;
  link: string;
};

export type MovieTrailer = {
  key: string;
  name: string;
  site: "YouTube";
};

export type MovieCastMember = {
  id: number;
  name: string;
  character: string;
  profileImage?: string;
};

export type MovieCrewMember = {
  id: number;
  name: string;
  job: string;
};

type TMDBMovie = {
  id: number;
  title: string;
  release_date: string;
  genre_ids?: number[];
  vote_average: number;
  poster_path: string | null;
  backdrop_path?: string | null;
  overview?: string;
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

type TMDBVideo = {
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
};

type TMDBCredit = {
  id: number;
  name: string;
  character?: string;
  job?: string;
  profile_path?: string | null;
};

type TMDBVideosResponse = { results?: TMDBVideo[] };
type TMDBCreditsResponse = { cast?: TMDBCredit[]; crew?: TMDBCredit[] };
type TMDBAlternativeTitlesResponse = { titles?: { title?: string }[] };

const TMDB_REQUEST_TIMEOUT_MS = 8_000;

async function fetchTMDB(url: URL, init: RequestInit & { next?: { revalidate: number } }) {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TMDB_REQUEST_TIMEOUT_MS);

    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (error) {
      lastError = error;
    } finally {
      clearTimeout(timeout);
    }
  }

  const reason = lastError instanceof Error ? lastError.message : "unknown network error";
  throw new Error(`Unable to connect to TMDB: ${reason}`, { cause: lastError });
}

async function fetchOptionalTMDB<T>(
  url: URL,
  auth: ReturnType<typeof getTMDBAuth>,
  label: string,
): Promise<T | undefined> {
  try {
    const response = await fetchTMDB(url, { ...auth, next: { revalidate: 3600 } });
    if (!response.ok) {
      console.warn(`${label} request returned ${response.status}.`);
      return undefined;
    }
    return (await response.json()) as T;
  } catch (error) {
    console.warn(`${label} could not be loaded from TMDB.`, error);
    return undefined;
  }
}

function getTMDBAuth() {
  const accessToken = process.env.TMDB_API_READ_ACCESS_TOKEN?.trim();
  const apiKey = process.env.TMDB_API_KEY?.trim();

  if (!accessToken && !apiKey) {
    throw new Error("TMDB_API_KEY or TMDB_API_READ_ACCESS_TOKEN is not configured");
  }

  return accessToken
    ? { headers: { Authorization: `Bearer ${accessToken}` } }
    : { apiKey };
}

function addTMDBAuth(url: URL, auth: ReturnType<typeof getTMDBAuth>) {
  if ("apiKey" in auth && auth.apiKey) {
    url.searchParams.set("api_key", auth.apiKey);
  }
}

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

function mapMovie(movie: TMDBMovie): Movie {
  return {
    id: movie.id,
    title: movie.title,
    genre: getGenreNames(movie) || "Movie",
    year: movie.release_date?.slice(0, 4) || "—",
    releaseDate: movie.release_date || undefined,
    runtime: "Movie",
    rating: movie.vote_average,
    overview: movie.overview,
    posterImage: movie.poster_path
      ? `https://image.tmdb.org/t/p/w780${movie.poster_path}`
      : undefined,
    backdropImage: movie.backdrop_path
      ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
      : undefined,
  };
}

async function discoverMovies(options: {
  page: number;
  language: string;
  country?: "NG" | "IN";
  originalLanguage?: string;
}): Promise<{ movies: Movie[]; totalPages: number }> {
  const auth = getTMDBAuth();

  const url = new URL("https://api.themoviedb.org/3/discover/movie");
  addTMDBAuth(url, auth);
  url.searchParams.set("language", options.language);
  url.searchParams.set("sort_by", "popularity.desc");
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("page", String(options.page));
  if (options.country) url.searchParams.set("with_origin_country", options.country);
  if (options.originalLanguage) {
    url.searchParams.set("with_original_language", options.originalLanguage);
  }

  const response = await fetchTMDB(url, {
    ...auth,
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(`TMDB returned ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as TMDBResponse;

  return {
    movies: data.results.map(mapMovie),
    totalPages: Math.min(data.total_pages, 500),
  };
}

export function getMovies(page = 1, language = "en-US") {
  return discoverMovies({ page, language });
}

export function getRegionalMovies(
  country: "NG" | "IN",
  page = 1,
  language = "en-US",
  originalLanguage?: string,
) {
  return discoverMovies({ country, page, language, originalLanguage });
}

export async function getTMDBLocales(): Promise<TMDBLocale[]> {
  const auth = getTMDBAuth();
  const url = new URL("https://api.themoviedb.org/3/configuration/primary_translations");
  addTMDBAuth(url, auth);

  const response = await fetchTMDB(url, { ...auth, next: { revalidate: 86400 } });
  if (!response.ok) {
    throw new Error(`TMDB returned ${response.status} ${response.statusText}`);
  }

  const locales = (await response.json()) as unknown;
  if (!Array.isArray(locales)) {
    throw new Error("TMDB returned an invalid language list.");
  }

  const displayNames = new Intl.DisplayNames(["en"], { type: "language" });
  return [...new Set(locales.filter((locale): locale is string =>
    typeof locale === "string" && /^[a-z]{2,3}-[A-Z]{2}$/i.test(locale),
  ))]
    .map((code) => ({ code, name: displayNames.of(code) ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getLatestMovie(): Promise<Movie | null> {
  const auth = getTMDBAuth();

  const url = new URL("https://api.themoviedb.org/3/movie/latest");
  addTMDBAuth(url, auth);
  url.searchParams.set("language", "en-US");

  const response = await fetchTMDB(url, {
    ...auth,
    next: { revalidate: 3600 },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`TMDB returned ${response.status} ${response.statusText}`);

  const movie = (await response.json()) as TMDBMovie & { overview?: string };

  return {
    id: movie.id,
    title: movie.title,
    genre: getGenreNames(movie) || "Movie",
    year: movie.release_date?.slice(0, 4) || "—",
    releaseDate: movie.release_date || undefined,
    runtime: "Movie",
    rating: movie.vote_average,
    overview: movie.overview,
    posterImage: movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : undefined,
  };
}

export async function getMovie(id: string, language = "en-US"): Promise<{
  movie: Movie & { overview: string; backdropImage?: string };
  trailer?: MovieTrailer;
  cast: MovieCastMember[];
  crew: MovieCrewMember[];
  alternativeTitles: string[];
} | null> {
  const auth = getTMDBAuth();

  const movieUrl = new URL(`https://api.themoviedb.org/3/movie/${encodeURIComponent(id)}`);
  addTMDBAuth(movieUrl, auth);
  movieUrl.searchParams.set("language", language);

  const videosUrl = new URL(`https://api.themoviedb.org/3/movie/${encodeURIComponent(id)}/videos`);
  addTMDBAuth(videosUrl, auth);
  videosUrl.searchParams.set("language", language);
  const creditsUrl = new URL(`https://api.themoviedb.org/3/movie/${encodeURIComponent(id)}/credits`);
  addTMDBAuth(creditsUrl, auth);
  creditsUrl.searchParams.set("language", language);
  const alternativeTitlesUrl = new URL(
    `https://api.themoviedb.org/3/movie/${encodeURIComponent(id)}/alternative_titles`,
  );
  addTMDBAuth(alternativeTitlesUrl, auth);

  const [
    movieResponse,
    videosData,
    creditsData,
    alternativeTitlesData,
  ] = await Promise.all([
    fetchTMDB(movieUrl, { ...auth, next: { revalidate: 3600 } }),
    fetchOptionalTMDB<TMDBVideosResponse>(videosUrl, auth, "Movie trailers"),
    fetchOptionalTMDB<TMDBCreditsResponse>(creditsUrl, auth, "Movie cast and crew"),
    fetchOptionalTMDB<TMDBAlternativeTitlesResponse>(
      alternativeTitlesUrl,
      auth,
      "Movie alternative titles",
    ),
  ]);

  if (movieResponse.status === 404) return null;
  if (!movieResponse.ok) throw new Error(`TMDB returned ${movieResponse.status} ${movieResponse.statusText}`);

  const movie = (await movieResponse.json()) as TMDBMovieDetails;
  const availableVideoData: TMDBVideosResponse = videosData ?? { results: [] };
  const availableCreditData: TMDBCreditsResponse = creditsData ?? {};
  const availableAlternativeTitles: TMDBAlternativeTitlesResponse =
    alternativeTitlesData ?? {};
  const trailers = (availableVideoData.results ?? []).filter((video) => video.site === "YouTube" && video.type === "Trailer");
  const selectedTrailer = trailers.find((video) => video.official) ?? trailers[0];
  return {
    movie: {
      id: movie.id,
      title: movie.title,
      genre: getGenreNames(movie) || "Movie",
      year: movie.release_date?.slice(0, 4) || "—",
      releaseDate: movie.release_date || undefined,
      runtime: movie.runtime ? `${movie.runtime}m` : "Movie",
      rating: movie.vote_average,
      overview: movie.overview || "No description available.",
      posterImage: movie.poster_path ? `https://image.tmdb.org/t/p/w780${movie.poster_path}` : undefined,
      backdropImage: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : undefined,
    },
    trailer: selectedTrailer
      ? { key: selectedTrailer.key, name: selectedTrailer.name, site: "YouTube" }
      : undefined,
    cast: (availableCreditData.cast ?? []).slice(0, 12).map((member) => ({
      id: member.id,
      name: member.name,
      character: member.character || "Cast",
      profileImage: member.profile_path
        ? `https://image.tmdb.org/t/p/w185${member.profile_path}`
        : undefined,
    })),
    crew: (availableCreditData.crew ?? [])
      .filter((member) => member.job === "Director" || member.job === "Writer")
      .slice(0, 8)
      .map((member) => ({
        id: member.id,
        name: member.name,
        job: member.job || "Crew",
      })),
    alternativeTitles: [...new Set(
      (availableAlternativeTitles.titles ?? [])
        .map(({ title }) => title?.trim())
        .filter((title): title is string => Boolean(title)),
    )],
  };
}

export async function searchMovies(query: string, language = "en-US"): Promise<Movie[]> {
  const auth = getTMDBAuth();
  const url = new URL("https://api.themoviedb.org/3/search/movie");
  addTMDBAuth(url, auth);
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("language", language);
  url.searchParams.set("page", "1");

  const response = await fetchTMDB(url, { ...auth, next: { revalidate: 300 } });
  if (!response.ok) throw new Error(`TMDB returned ${response.status} ${response.statusText}`);

  const data = (await response.json()) as TMDBResponse;
  return data.results.slice(0, 8).map((movie) => ({
    id: movie.id,
    title: movie.title,
    genre: getGenreNames(movie) || "Movie",
    year: movie.release_date?.slice(0, 4) || "—",
    releaseDate: movie.release_date || undefined,
    runtime: "Movie",
    rating: movie.vote_average,
    posterImage: movie.poster_path ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` : undefined,
  }));
}