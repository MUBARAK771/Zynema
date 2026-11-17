"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookmarkX, Film, Tv } from "lucide-react";
import {
  getWatchlist,
  removeFromWatchlist,
  subscribeToWatchlist,
  type WatchlistItem,
} from "@/lib/watchlist";

function itemHref(item: WatchlistItem) {
  return item.type === "movie" ? `/movies/${item.id}` : `/shows/${item.id}`;
}

export default function MyListClient() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const savedItems = await getWatchlist();
        if (active) {
          setItems(savedItems);
          setError(null);
        }
      } catch (cause) {
        if (active) {
          setError(cause instanceof Error ? cause.message : "Your saved list could not be loaded.");
        }
      } finally {
        if (active) setReady(true);
      }
    };

    void refresh();
    const unsubscribe = subscribeToWatchlist(() => void refresh());
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function removeItem(item: WatchlistItem) {
    try {
      await removeFromWatchlist(item.type, item.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The item could not be removed.");
    }
  }

  if (!ready) {
    return <p role="status" className="mt-8 text-sm text-zinc-400">Loading your saved list…</p>;
  }

  return (
    <div className="mt-8">
      {error ? (
        <p role="alert" className="rounded-lg border border-amber-900/60 bg-amber-950/30 p-4 text-sm text-amber-100">
          {error}
        </p>
      ) : null}

      {items.length === 0 && !error ? (
        <div className="rounded-xl border border-[#242529] bg-[#17191c] p-8 text-center">
          <BookmarkX className="mx-auto text-zinc-500" size={28} />
          <h2 className="mt-3 text-base font-semibold text-white">Your list is empty</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Add a movie or show from its details page to keep it in your account.
          </p>
          <Link href="/discover" className="mt-5 inline-flex rounded-full bg-[#ff3d00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ff551f]">
            Discover movies
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-zinc-400">{items.length} saved {items.length === 1 ? "title" : "titles"}</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <article key={item.key} className="overflow-hidden rounded-lg border border-[#242529] bg-[#17191c]">
                <Link href={itemHref(item)} className="group block">
                  <div className="aspect-16/10 bg-zinc-800">
                    {item.posterImage ? (
                      <img src={item.posterImage} alt={`${item.title} poster`} className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-zinc-500">
                        {item.type === "movie" ? <Film size={28} /> : <Tv size={28} />}
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <span className="text-[10px] uppercase tracking-wider text-[#ff754b]">
                      {item.type} · {item.year}
                    </span>
                    <h2 className="mt-1 truncate text-sm font-semibold text-white">{item.title}</h2>
                  </div>
                </Link>
                <div className="border-t border-[#242529] p-3">
                  <button
                    type="button"
                    onClick={() => void removeItem(item)}
                    className="text-xs text-zinc-400 hover:text-white"
                  >
                    Remove from My List
                  </button>
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      <p className="mt-5 text-xs text-zinc-600">Your list is saved to your account and is available when you sign in on another device.</p>
    </div>
  );
}
