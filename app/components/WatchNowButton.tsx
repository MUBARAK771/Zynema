"use client";

import { Play } from "lucide-react";

export default function WatchNowButton({
  hasVideo,
}: {
  hasVideo: boolean;
}) {
  function handleClick() {
    const watchSection = document.getElementById("watch");
    const video = watchSection?.querySelector("video");
    const trailer = watchSection?.querySelector("iframe");

    watchSection?.scrollIntoView({ behavior: "smooth", block: "start" });

    if (hasVideo) {
      void video?.play().catch(() => undefined);
    } else if (trailer instanceof HTMLIFrameElement) {
      trailer.src = `${trailer.src}${trailer.src.includes("?") ? "&" : "?"}autoplay=1`;
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-[#ff3d00] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#ff551f]"
    >
      <Play size={15} /> {hasVideo ? "Watch now" : "Watch trailer"}
    </button>
  );
}