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

const storageKey = "zynema:watchlist:v1";
const changeEvent = "zynema:watchlist-change";

function getKey(type: WatchlistEntry["type"], id: string) {
  return `${type}:${id}`;
}

function isWatchlistItem(value: unknown): value is WatchlistItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<WatchlistItem>;
  return (
    (item.type === "movie" || item.type === "show") &&
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.year === "string" &&
    typeof item.key === "string" &&
    (item.posterImage === undefined || typeof item.posterImage === "string") &&
    item.key === getKey(item.type, item.id)
  );
}

export function getWatchlist(): WatchlistItem[] {
  const storedValue = window.localStorage.getItem(storageKey);
  if (!storedValue) return [];

  const parsed: unknown = JSON.parse(storedValue);
  if (!Array.isArray(parsed) || !parsed.every(isWatchlistItem)) {
    throw new Error("The saved list has invalid data. Clear this browser's saved list to continue.");
  }

  return parsed;
}

function saveWatchlist(items: WatchlistItem[]) {
  window.localStorage.setItem(storageKey, JSON.stringify(items));
  window.dispatchEvent(new Event(changeEvent));
}

export function isWatchlisted(type: WatchlistEntry["type"], id: string) {
  const key = getKey(type, id);
  return getWatchlist().some((item) => item.key === key);
}

export function toggleWatchlist(entry: WatchlistEntry) {
  const key = getKey(entry.type, entry.id);
  const current = getWatchlist();
  const alreadySaved = current.some((item) => item.key === key);

  saveWatchlist(
    alreadySaved
      ? current.filter((item) => item.key !== key)
      : [{ ...entry, key }, ...current],
  );

  return !alreadySaved;
}

export function removeFromWatchlist(key: string) {
  saveWatchlist(getWatchlist().filter((item) => item.key !== key));
}

export function subscribeToWatchlist(callback: () => void) {
  window.addEventListener(changeEvent, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(changeEvent, callback);
    window.removeEventListener("storage", callback);
  };
}
