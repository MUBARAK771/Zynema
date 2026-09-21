import { ArrowUpDown, LayoutGrid, List } from "lucide-react";
import Filters, { ActiveFilterPills } from "../components/Filter";
import { getShows } from "@/lib/tvmaze";
import ShowCard from "../components/ShowCard";
import Pagination from "../components/Pagination";

export default async function Dashboard({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const page = Number.isNaN(requestedPage) ? 1 : Math.min(Math.max(requestedPage, 1), 10);
  const { shows: movies, totalPages } = await getShows(page);

  return (
    <div className="flex min-h-screen">
      <Filters />

      <main className="flex-1 min-w-0 px-4 py-5 lg:px-6">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h1 className="text-2xl font-bold">Discover</h1>

            <p className="text-sm text-muted mt-1">
              Found {movies.length} movies matching your criteria
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
          {movies.map((show) => (
            <ShowCard key={show.id} show={show} />
          ))}
        </div>

        <Pagination currentPage={page} totalPages={totalPages} />
      </main>
    </div>
  );
}
