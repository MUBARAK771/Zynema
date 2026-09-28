"use client";

type MovieTrailerPlayerProps = {
  videoKey: string;
  title: string;
};

export default function MovieTrailerPlayer({ videoKey, title }: MovieTrailerPlayerProps) {
  return (
    <iframe
      className="aspect-video w-full"
      src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoKey)}?playsinline=1&rel=0`}
      title={`${title} trailer`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
}