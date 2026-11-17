export type WatchlistEntry = {
  type: "movie" | "show";
  id: string;
  title: string;
  year: string;
  posterImage?: string;
};

export type WatchlistItem = WatchlistEntry & {
  key: string;
};

const changeEvent = "zynema:watchlist-change";

async function requestWatchlist(
  method: "GET" | "POST" | "DELETE",
  body?: Record<string, string | null>,
): Promise<Response> {
  const response = await fetch("/api/watchlist", {
    method,
    cache: "no-store",
    credentials: "same-origin",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const result = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(result.error || "Your My List could not be updated.");
  }

  return response;
}

export async function getWatchlist(): Promise<WatchlistItem[]> {
  const response = await requestWatchlist("GET");
  const items = (await response.json()) as unknown;
  if (!Array.isArray(items)) {
    throw new Error("The server returned an invalid My List.");
  }
  return items as WatchlistItem[];
}

export async function addToWatchlist(entry: WatchlistEntry): Promise<void> {
  await requestWatchlist("POST", {
    type: entry.type,
    id: entry.id,
    title: entry.title,
    year: entry.year,
    posterImage: entry.posterImage ?? null,
  });
  window.dispatchEvent(new Event(changeEvent));
}

export async function removeFromWatchlist(type: WatchlistEntry["type"], id: string): Promise<void> {
  await requestWatchlist("DELETE", { type, id });
  window.dispatchEvent(new Event(changeEvent));
}

export function subscribeToWatchlist(callback: () => void) {
  window.addEventListener(changeEvent, callback);
  return () => window.removeEventListener(changeEvent, callback);
}
