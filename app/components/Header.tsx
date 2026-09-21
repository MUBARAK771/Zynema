"use client"
import { useState, useRef, useEffect } from "react";
import { Search, Bell, ChevronDown } from "lucide-react";
import { useDebouncedCallback } from "use-debounce";
import { useRouter } from "next/navigation";

interface Show {
  show: {
    id: number;
    name: string;
    image: { medium: string } | null;
  };
}

export default function Header() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Show[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearch = useDebouncedCallback(async (term: string) => {
    if (!term) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/search/shows?q=${encodeURIComponent(term)}`
      );
      const data = await res.json();
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
    <header className="flex items-center gap-4 border-b border-[#242529] bg-base-bg px-6 py-4">
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
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search shows, episodes, or actors..."
          className="w-full bg-base-panel border border-[#242529] rounded-full pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent"
        />

        {open && (
          <div className="absolute top-full mt-2 w-full bg-base-panel border border-zinc-200 scrollbar-none bg-[#1D1F23] rounded-xl shadow-lg max-h-80 overflow-y-auto z-50">
            {loading && (
              <p className="px-4 py-3 text-sm text-zinc-200">Searching...</p>
            )}
            {!loading && results.length === 0 && (
              <p className="px-4 py-3 text-sm text-zinc-200">No results found.</p>
            )}
            {!loading &&
              results.map(({ show }) => (
                <button
                  key={show.id}
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
                  <span className="text-sm text-zinc-200 ">{show.name}</span>
                </button>
              ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-5">
        <button className="relative text-zinc-300 hover:text-white">
          <Bell size={20} />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent" />
        </button>
        <button className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-300 to-orange-500" />
          <ChevronDown size={16} className="text-muted" />
        </button>
      </div>
    </header>
  );
}