"use client";

import { useEffect, useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
  subscribeToWatchlist,
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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const items = await getWatchlist();
        if (active) {
          setSaved(items.some((savedItem) => savedItem.key === `${item.type}:${item.id}`));
          setError(null);
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Your My List could not be loaded.");
        }
      }
    };

    void refresh();
    const unsubscribe = subscribeToWatchlist(() => void refresh());
    return () => {
      active = false;
      unsubscribe();
    };
  }, [item.id, item.type]);

  async function handleClick() {
    if (saving) return;
    setSaving(true);
    try {
      if (saved) {
        await removeFromWatchlist(item.type, item.id);
        setSaved(false);
      } else {
        await addToWatchlist(item);
        setSaved(true);
      }
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your My List could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start">
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={saved}
        disabled={saving}
        aria-busy={saving}
        className={className || "inline-flex items-center gap-2 rounded-full border border-zinc-600 bg-white/5 px-4 py-3 text-sm text-zinc-200 hover:border-zinc-400"}
      >
        {saved ? <BookmarkCheck size={16} /> : <Bookmark size={16} />}
        {saved ? "Remove from My List" : "Add to My List"}
      </button>
      {error ? <span role="alert" className="mt-2 text-xs text-amber-200">{error}</span> : null}
    </span>
  );
}
