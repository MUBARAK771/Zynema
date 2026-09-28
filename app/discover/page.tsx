import { ArrowUpDown, LayoutGrid, List } from "lucide-react";
import Filters, { ActiveFilterPills } from "../components/Filter";
import { getMovies, type Movie } from "@/lib/tmdb";
import ShowCard from "../components/ShowCard";
import Pagination from "../components/Pagination";
import { getVideoAssets } from "@/lib/videoCatalog";

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isNaN(requestedPage) ? 1 : Math.min(Math.max(requestedPage, 1), 10);
  let movies: Movie[] = [];
  let totalPages = 1;
  let loadError: string | null = null;
  let playableMovieIds = new Set<number>();

  try {
    const result = await getMovies(page);
    movies = result.movies;
    totalPages = result.totalPages;
    const videoAssets = await getVideoAssets(movies.map((movie) => movie.id));
    playableMovieIds = new Set(videoAssets.keys());
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Unable to load movies";
  }

  return (
    <div className="flex min-h-screen">
      <Filters />

      <main className="flex-1 min-w-0 px-4 py-5 lg:px-6">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h1 className="text-2xl font-bold">Discover</h1>

            <p className="text-sm text-muted mt-1">
              {loadError ? "Movie discovery is temporarily unavailable" : `Found ${movies.length} movies matching your criteria`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 bg-base-panel border border-[#242529] rounded-lg px-3 py-2 text-sm text-zinc-300">
              <ArrowUpDown size={14} />
              Popularity
            </button>

            <div className="flex items-center bg-base-panel border border-[#242529] rounded-lg p-1">
              <button className="p-1.5 rounded-md bg-base-panelBorder">
                <LayoutGrid size={16} />
              </button>

              <button className="p-1.5 rounded-md text-muted">
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <ActiveFilterPills />
        </div>

        {loadError ? (
          <div className="mt-8 rounded-lg border border-[#242529] bg-base-card p-6 text-sm text-zinc-400">
            {loadError.includes("401")
              ? "TMDB rejected the API credential. Replace TMDB_API_KEY or TMDB_API_READ_ACCESS_TOKEN in .env, then restart the dev server."
              : loadError.includes("connect") || loadError.includes("aborted")
                ? "We could not connect to TMDB right now. Check your network connection or try again shortly."
                : "TMDB could not load movies right now. Try again shortly."}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {movies.map((show) => (
              <ShowCard key={show.id} show={show} hasFullMovie={playableMovieIds.has(show.id)} />
            ))}
          </div>
        )}

        <Pagination currentPage={page} totalPages={totalPages} />
      </main>
    </div>
  );
}
