"use client";

import { Play } from "lucide-react";

export default function WatchNowButton() {
  function handleClick() {
    document
      .getElementById("available-to-watch")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.dispatchEvent(new Event("zynema:watch-now"));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex h-10 w-fit items-center gap-2 whitespace-nowrap rounded-full bg-[#ff3d00] px-5 text-xs font-semibold text-white hover:bg-[#ff551f]"
    >
      <Play size={15} /> Watch Now
    </button>
  );
}