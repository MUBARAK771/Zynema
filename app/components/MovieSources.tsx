"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Download, ExternalLink, Play, RefreshCw } from "lucide-react";
import MovieVideoPlayer from "@/app/components/MovieVideoPlayer";
import type { MovieSource, MovieSourceSearchResult } from "@/lib/movie-sources";
import type { WatchProvider } from "@/lib/tmdb";

function formatSize(sizeBytes?: number) {
  if (!sizeBytes) return "Size not listed";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = sizeBytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(unitIndex > 0 && value < 10 ? 1 : 0)} ${units[unitIndex]}`;
}

function formatDuration(seconds?: number) {
  if (!seconds) return undefined;
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

export default function MovieSources({
  movieId,
  title,
  poster,
  providers,
  watchGuideUrl,
}: {
  movieId: number;
  title: string;
  poster?: string;
  providers: WatchProvider[];
  watchGuideUrl?: string;
}) {
  const [result, setResult] = useState<MovieSourceSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [selectedSource, setSelectedSource] = useState<MovieSource | null>(null);
  const [autoPlay, setAutoPlay] = useState(false);
  const requestRef = useRef<Promise<MovieSourceSearchResult | null> | null>(null);
  const closePlayerRef = useRef<HTMLButtonElement>(null);

  const loadPage = useCallback(async (page: number) => {
    if (page === 1 && requestRef.current) return requestRef.current;

    if (page === 1) setLoading(true);
    else setLoadingMore(true);
    setError(null);

    const request = (async () => {
      const response = await fetch(`/api/movies/${movieId}/sources?page=${page}`);
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error || "Movie sources could not be loaded.");
      }
      return (await response.json()) as MovieSourceSearchResult;
    })();

    if (page === 1) requestRef.current = request;

    try {
      const nextResult = await request;
      setResult((current) => {
        if (page === 1 || !current) return nextResult;
        const seen = new Set(current.sources.map((source) => source.id));
        return {
          ...nextResult,
          sources: [
            ...current.sources,
            ...nextResult.sources.filter((source) => !seen.has(source.id)),
          ],
          errors: [...current.errors, ...nextResult.errors],
        };
      });
      return nextResult;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Movie sources could not be loaded.");
      return null;
    } finally {
      if (page === 1) {
        requestRef.current = null;
        setLoading(false);
      } else {
        setLoadingMore(false);
      }
    }
  }, [movieId]);

  const playSource = useCallback(async (source: MovieSource) => {
    setError(null);
    setPlayingId(source.id);
    setSelectedSource(null);
    setAutoPlay(false);
    try {
      const response = await fetch(`/api/movies/${movieId}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archiveId: source.providerId,
          fileName: source.fileName,
        }),
      });
      const data = (await response.json()) as MovieSource | { error?: string };
      if (!response.ok || !("videoUrl" in data)) {
        throw new Error(
          "error" in data && data.error
            ? data.error
            : "This video source is no longer available.",
        );
      }

      setSelectedSource(data);
      setAutoPlay(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Playback could not be verified.");
    } finally {
      setPlayingId(null);
    }
  }, [movieId]);

  const startWatching = useCallback(async () => {
    const data = result ?? await loadPage(1);
    const playableSource = data?.sources.find((source) => source.canStream);
    if (!playableSource) {
      setError(
        data
          ? "No verified, browser-playable source was found. Choose an official viewing option below."
          : "Sources could not be checked. Try again or use an official viewing option below.",
      );
      return;
    }

    await playSource(playableSource);
  }, [loadPage, playSource, result]);

  async function downloadSource(source: MovieSource) {
    setDownloadError(null);
    setDownloadingId(source.id);
    const downloadWindow = window.open("about:blank", "_blank");
    if (downloadWindow) downloadWindow.opener = null;

    try {
      const response = await fetch(`/api/movies/${movieId}/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          archiveId: source.providerId,
          fileName: source.fileName,
        }),
      });
      const data = (await response.json()) as { downloadUrl?: string; error?: string };
      if (!response.ok || !data.downloadUrl) {
        throw new Error(data.error || "This download is no longer available.");
      }

      const downloadUrl = new URL(data.downloadUrl);
      if (downloadUrl.protocol !== "https:" || downloadUrl.hostname !== "archive.org") {
        throw new Error("The provider returned an invalid download link.");
      }

      if (downloadWindow) downloadWindow.location.replace(downloadUrl.toString());
      else window.location.assign(downloadUrl.toString());
    } catch (cause) {
      downloadWindow?.close();
      setDownloadError(
        cause instanceof Error ? cause.message : "The download could not be verified.",
      );
    } finally {
      setDownloadingId(null);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPage(1);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPage]);

  useEffect(() => {
    const handleWatchRequest = () => {
      void startWatching();
    };
    window.addEventListener("zynema:watch-now", handleWatchRequest);
    return () => window.removeEventListener("zynema:watch-now", handleWatchRequest);
  }, [startWatching]);

  useEffect(() => {
    if (!selectedSource) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closePlayerRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelectedSource(null);
        setAutoPlay(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedSource]);

  const sources = result?.sources ?? [];

  return (
    <section
      id="available-to-watch"
      className="scroll-mt-6"
      aria-labelledby="available-to-watch-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="available-to-watch-title" className="text-xl font-bold">
            Available to Watch
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Only sources with a recognized license are enabled for playback or download.
          </p>
        </div>
        {error ? (
          <button
            type="button"
            onClick={() => void loadPage(1)}
            className="inline-flex items-center gap-2 text-xs text-zinc-300 hover:text-white"
          >
            <RefreshCw size={13} /> Try again
          </button>
        ) : null}
      </div>

      {loading ? (
        <p role="status" className="mt-4 rounded-lg border border-[#2b2d31] bg-[#17191c] p-4 text-sm text-zinc-400">
          Checking authorized movie sources…
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 rounded-lg border border-amber-900/60 bg-amber-950/30 p-4 text-sm text-amber-100">
          {error}
        </p>
      ) : null}

      {result?.errors.length ? (
        <p className="mt-4 text-xs text-amber-200/80">
          Some sources could not be checked. Results shown below were verified.
        </p>
      ) : null}

      {sources.length > 0 ? (
        <div className="mt-5 space-y-3">
          {sources.map((source) => (
            <article
              key={source.id}
              className="rounded-lg border border-[#2b2d31] bg-[#17191c] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white">{source.title}</p>
                  <p className="mt-1 break-all text-xs text-zinc-400">
                    {source.provider} ({source.providerId}) · {source.format} ·{" "}
                    {formatSize(source.sizeBytes)}
                    {source.videoQuality ? ` · ${source.videoQuality}` : ""}
                    {formatDuration(source.durationSeconds)
                      ? ` · ${formatDuration(source.durationSeconds)}`
                      : ""}
                  </p>
                </div>
                <a
                  href={source.sourcePageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1 text-xs text-zinc-400 hover:text-white"
                >
                  Source details <ExternalLink size={12} />
                </a>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {source.canStream ? (
                  <button
                    type="button"
                    disabled={playingId !== null}
                    onClick={() => void playSource(source)}
                    className="inline-flex items-center gap-2 rounded-md bg-[#ff3d00] px-3 py-2 text-xs font-semibold text-white hover:bg-[#ff551f] disabled:opacity-50"
                  >
                    <Play size={13} fill="currentColor" />
                    {playingId === source.id ? "Verifying source…" : "Watch in Zynema"}
                  </button>
                ) : (
                  <span className="rounded-md border border-[#34363a] px-3 py-2 text-xs text-zinc-500">
                    Browser playback unavailable
                  </span>
                )}
                {source.canDownload ? (
                  <button
                    type="button"
                    disabled={downloadingId !== null}
                    onClick={() => void downloadSource(source)}
                    className="inline-flex items-center gap-2 rounded-md border border-[#3b3d42] px-3 py-2 text-xs font-semibold text-zinc-200 hover:border-zinc-500"
                  >
                    <Download size={13} />
                    {downloadingId === source.id ? "Verifying download…" : "Download original"}
                  </button>
                ) : null}
                <span className="text-xs text-zinc-500">
                  {source.license.name}
                  {source.license.attributionRequired ? " · attribution required" : ""}
                </span>
              </div>

              {source.license.attributionRequired ? (
                <p className="mt-2 text-[11px] text-zinc-500">
                  {source.attribution} · {source.title} · {source.provider} ·{" "}
                  <a
                    href={source.license.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-zinc-300"
                  >
                    {source.license.name}
                  </a>
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}

      {downloadError ? (
        <p role="alert" className="mt-4 rounded-lg border border-amber-900/60 bg-amber-950/30 p-4 text-sm text-amber-100">
          {downloadError}
        </p>
      ) : null}

      {!loading && sources.length === 0 && !error ? (
        <p className="mt-4 rounded-lg border border-[#2b2d31] bg-[#17191c] p-4 text-sm text-zinc-400">
          No matching files with a supported license were found. These files are intentionally
          excluded unless their rights can be verified.
        </p>
      ) : null}

      {result && result.page < result.totalPages ? (
        <button
          type="button"
          disabled={loadingMore}
          onClick={() => void loadPage(result.page + 1)}
          className="mt-4 inline-flex items-center gap-2 rounded-md border border-[#3b3d42] px-4 py-2 text-xs font-semibold text-zinc-200 hover:border-zinc-500 disabled:opacity-50"
        >
          {loadingMore ? "Loading…" : "Load more sources"} <ArrowUpRight size={13} />
        </button>
      ) : null}

      {selectedSource ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="movie-player-title"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-3 sm:p-6"
        >
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl border border-[#2b2d31] bg-[#111214] shadow-2xl">
            <div className="flex items-center justify-between gap-3 bg-[#17191c] px-4 py-3">
              <p id="movie-player-title" className="truncate text-sm font-semibold text-white">
                Now playing: {title} · {selectedSource.videoQuality ?? selectedSource.format}
              </p>
              <button
                ref={closePlayerRef}
                type="button"
                onClick={() => {
                  setSelectedSource(null);
                  setAutoPlay(false);
                }}
                className="shrink-0 rounded px-2 py-1 text-xs text-zinc-300 hover:bg-white/10 hover:text-white"
              >
                Close player
              </button>
            </div>
            <MovieVideoPlayer
              key={selectedSource.id}
              source={selectedSource}
              title={title}
              poster={poster}
              autoPlay={autoPlay}
            />
          </div>
        </div>
      ) : null}

      {providers.length > 0 ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-zinc-300">Official viewing alternatives</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {providers.map((provider) => (
              <a
                key={provider.name}
                href={provider.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg border border-[#2b2d31] bg-[#17191c] p-3 transition hover:border-[#ff3d00]"
              >
                {provider.logoPath ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${provider.logoPath}`}
                    alt=""
                    className="h-9 w-9 rounded-lg"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#ff3d00]">
                    <Play size={14} />
                  </span>
                )}
                <span className="min-w-0 flex-1 text-sm font-semibold text-white">
                  {provider.name}
                </span>
                <ArrowUpRight size={15} className="text-zinc-500" />
              </a>
            ))}
          </div>
        </div>
      ) : watchGuideUrl ? (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-zinc-300">Legal viewing alternatives</h3>
          <a
            href={watchGuideUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[#2b2d31] bg-[#17191c] p-3 text-sm text-zinc-200 hover:border-[#ff3d00]"
          >
            View official streaming options <ArrowUpRight size={15} />
          </a>
        </div>
      ) : (
        <p className="mt-4 inline-flex items-center gap-2 text-xs text-zinc-500">
          <ExternalLink size={13} /> Check local streaming catalogs for availability.
        </p>
      )}
    </section>
  );
}
