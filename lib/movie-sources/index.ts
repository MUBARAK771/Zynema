import { internetArchiveProvider } from "./internet-archive";
import type {
  MovieIdentity,
  MovieSourceProvider,
  MovieSourceSearchResult,
} from "./types";

const providers: MovieSourceProvider[] = [internetArchiveProvider];

export async function searchMovieSources(
  movie: MovieIdentity,
  page = 1,
): Promise<MovieSourceSearchResult> {
  const results = await Promise.allSettled(
    providers.map((provider) => provider.search(movie, page)),
  );
  const successfulResults = results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );

  if (successfulResults.length === 0) {
    throw new Error("All movie source providers are temporarily unavailable.");
  }

  return {
    sources: successfulResults.flatMap((result) => result.sources),
    page,
    totalPages: Math.max(...successfulResults.map((result) => result.totalPages)),
    errors: [
      ...successfulResults.flatMap((result) => result.errors),
      ...results.flatMap((result) =>
        result.status === "rejected"
          ? ["A movie source provider is temporarily unavailable."]
          : [],
      ),
    ],
  };
}

export { getAuthorizedArchiveDownload } from "./internet-archive";
export type {
  MovieIdentity,
  MovieLicense,
  MovieSource,
  MovieSourceProvider,
  MovieSourceSearchResult,
} from "./types";
