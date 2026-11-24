"use client"
import { useState, useRef, useEffect } from "react";
import { Search, Bell, ChevronDown } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { useRouter } from "next/navigation";
import type { Movie } from "@/lib/tmdb";
import { useDashboardUser } from "@/app/components/AuthGate";

interface TVMazeShow {
  show: {
    id: number;
    name: string;
    image: { medium: string } | null;
  };
}

type SearchResults = {
  shows: TVMazeShow[];
  movies: Movie[];
};

export default function Header() {
  const router = useRouter();
  const user = useDashboardUser();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>({ shows: [], movies: [] });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const displayName = user?.name || user?.email?.split("@")[0] || "Zynema user";
  const nameParts = displayName.trim().split(/\s+/);
  const initials = nameParts.length > 1
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : displayName.slice(0, 2).toUpperCase();

  const handleSearch = useDebouncedCallback(async (term: string) => {
    if (!term) {
      setResults({ shows: [], movies: [] });
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`);
      if (!res.ok) {
        throw new Error("Search request failed");
      }
      const data = (await res.json()) as SearchResults;
      setResults(data);
      setOpen(true);
    } catch (err) {
      console.error("Search failed", err);
    } finally {
      setLoading(false);
    }
  }, 300);

  // close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex items-center gap-2 border-b border-[#242529] bg-[#0d0e10] px-3 py-3 sm:gap-4 sm:px-6 sm:py-4">
      <div ref={containerRef} className="flex-1 max-w-xl relative">
        <Search
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          onFocus={() => (results.shows.length > 0 || results.movies.length > 0) && setOpen(true)}
          placeholder="Search movies, shows, episodes, or actors..."
          className="w-full bg-base-panel border border-[#242529] rounded-full pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />

        {open && (
          <div className="absolute top-full mt-2 w-full bg-base-panel border border-zinc-200 scrollbar-none bg-[#1D1F23] rounded-xl shadow-lg max-h-80 overflow-y-auto z-50">
            {loading && (
              <p className="px-4 py-3 text-sm text-zinc-200">Searching...</p>
            )}
            {!loading && results.shows.length === 0 && results.movies.length === 0 && (
              <p className="px-4 py-3 text-sm text-zinc-200">No results found.</p>
            )}
            {!loading && results.movies.length > 0 ? (
              <>
                <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">Movies</p>
                {results.movies.map((movie) => (
                  <button
                    key={`movie-${movie.id}`}
                    onClick={() => {
                      setOpen(false);
                      setQuery(movie.title);
                      router.push(`/movies/${movie.id}?playTrailer=1`);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-white/5"
                  >
                    {movie.posterImage ? <img src={movie.posterImage} alt="" className="h-10 w-8 rounded object-cover" /> : null}
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-200">{movie.title}</span>
                    <span className="text-[10px] uppercase text-zinc-500">{movie.year}</span>
                  </button>
                ))}
              </>
            ) : null}
            {!loading && results.shows.length > 0 ? (
              <>
                <p className="px-4 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">TV Shows</p>
                {results.shows.map(({ show }) => (
                <button
                  key={`show-${show.id}`}
                  onClick={() => {
                    setOpen(false);
                    setQuery(show.name);
                    router.push(`/shows/${show.id}`);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 text-left"
                >
                  {show.image && (
                    <img
                      src={show.image.medium}
                      alt={show.name}
                      className="w-8 h-10 object-cover rounded"
                    />
                  )}
                  <span className="text-sm text-zinc-200">{show.name}</span>
                </button>
                ))}
              </>
            ) : null}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-5">
        <button className="relative text-zinc-300 hover:text-white">
          <Bell size={20} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent" />
        </button>
        <div
          className="flex min-w-0 items-center gap-2"
          title={user?.email ?? displayName}
          aria-label={`Signed in as ${displayName}`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-amber-300 to-orange-500 text-xs font-bold text-[#21140b]">
            {initials}
          </div>
          <span className="hidden max-w-36 truncate text-xs font-medium text-zinc-200 sm:inline">
            {displayName}
          </span>
          {/* <ChevronDown size={16} className="text-muted" /> */}
        </div>
      </div>
    </header>
  );
}