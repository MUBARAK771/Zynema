"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import {
  isWatchlisted,
  subscribeToWatchlist,
  toggleWatchlist,
  type WatchlistEntry,
} from "@/lib/watchlist";

export default function WatchlistButton({
  item,
  className = "",
}: {
  item: WatchlistEntry;
  className?: string;
}) {
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => {
      try {
        setSaved(isWatchlisted(item.type, item.id));
        setError(null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "The saved list could not be read.");
      }
    };

    const timer = window.setTimeout(refresh, 0);
    const unsubscribe = subscribeToWatchlist(refresh);
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [item.id, item.type]);

  function handleClick() {
    try {
      setSaved(toggleWatchlist(item));
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The item could not be saved.");
    }
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        className={className || "inline-flex items-center gap-2 rounded-full border border-zinc-600 bg-white/5 px-4 py-3 text-sm text-zinc-200 hover:border-zinc-400"}
      >
        {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        {saved ? "Remove from My List" : "Add to My List"}
      </button>
      {error ? <span role="alert" className="mt-2 text-xs text-amber-200">{error}</span> : null}
    </span>
  );
}
