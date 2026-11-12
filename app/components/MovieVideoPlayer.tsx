"use client";

import { useEffect, useRef, useState } from "react";
import type { MovieSource } from "@/lib/movie-sources";

export default function MovieVideoPlayer({
  source,
  title,
  poster,
  autoPlay,
}: {
  source: MovieSource;
  title: string;
  poster?: string;
  autoPlay: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const isHls = source.mimeType === "application/vnd.apple.mpegurl";
    setLoading(true);
    setError(null);
    video.autoplay = autoPlay;

    if (source.mimeType && video.canPlayType(source.mimeType)) {
      video.src = source.videoUrl;
    } else {
      setError(
        isHls
          ? "HLS playback is not supported by this browser."
          : "This file format is not supported for in-browser playback.",
      );
      setLoading(false);
    }

    video.load();

    return () => {
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [autoPlay, source.mimeType, source.videoUrl]);

  return (
    <div className="relative bg-black">
      <video
        ref={videoRef}
        className="aspect-video w-full"
        controls
        playsInline
        preload="metadata"
        poster={poster}
        aria-label={`${title} movie player`}
        onWaiting={() => setLoading(true)}
        onCanPlay={() => setLoading(false)}
        onError={() => {
          setError("This video is currently unavailable. Try another source.");
          setLoading(false);
        }}
      />
      {loading && !error ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35 text-sm text-white">
          Loading video…
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="p-3 text-sm text-amber-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
