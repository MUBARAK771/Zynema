"use client";

type MuxVideoPlayerProps = {
  playbackUrl: string;
  title: string;
  poster?: string;
};

export default function MuxVideoPlayer({ playbackUrl, title, poster }: MuxVideoPlayerProps) {
  return (
    <video className="aspect-video w-full" controls playsInline preload="metadata" poster={poster}>
      <source src={playbackUrl} type="video/mp4" />
      {title} is not supported by this browser.
    </video>
  );
}