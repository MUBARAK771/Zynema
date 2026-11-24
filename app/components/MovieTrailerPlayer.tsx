"use client";

import { useEffect } from "react";

type MovieTrailerPlayerProps = {
  videoKey: string;
  title: string;
  autoPlay?: boolean;
};

export default function MovieTrailerPlayer({
  videoKey,
  title,
  autoPlay = false,
}: MovieTrailerPlayerProps) {
  useEffect(() => {
    if (autoPlay) {
      document.getElementById("trailer")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [autoPlay]);

  const playbackParams = new URLSearchParams({ playsinline: "1", rel: "0" });
  if (autoPlay) {
    playbackParams.set("autoplay", "1");
    playbackParams.set("mute", "1");
  }

  return (
    <iframe
      className="aspect-video w-full"
      src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoKey)}?${playbackParams}`}
      title={`${title} trailer`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
}