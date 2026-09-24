"use client";

import Link from "next/link";
import { Info, Pause, Play, Plus, Star } from "lucide-react";
import { useEffect, useState } from "react";
import type { Show } from "@/lib/tvmaze";

const SLIDE_DURATION = 3200;

export default function HeroSlideshow({ shows }: { shows: Show[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (shows.length < 2 || isHovered) return;

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % shows.length);
    }, SLIDE_DURATION);

    return () => window.clearInterval(timer);
  }, [isHovered, shows.length]);

  if (!shows.length) return null;

  const featured = shows[activeIndex] ?? shows[0];
  const hasTrailer = Boolean(featured.trailerUrl);
  const isYoutubeTrailer = hasTrailer && featured.trailerUrl?.includes("youtube.com");

  return (
    <section
      className="relative min-h-97.5 overflow-hidden border-b border-[#202226]"
    >
      <div
        className="absolute inset-0"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {featured.posterImage ? (
          <img
            key={`${featured.id}-poster`}
            src={featured.posterImage}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${hasTrailer && isHovered ? "opacity-0" : "opacity-35"}`}
          />
        ) : null}
        {hasTrailer && isHovered ? (
          isYoutubeTrailer ? (
            <iframe
              key={`${featured.id}-trailer`}
              className="pointer-events-none absolute inset-0 h-full w-full opacity-70"
              src={featured.trailerUrl}
              title={`${featured.title} trailer`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <video
              key={`${featured.id}-trailer`}
              className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-55"
              src={featured.trailerUrl}
              autoPlay
              muted
              loop
              playsInline
              poster={featured.posterImage}
            />
          )
        ) : null}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-linear-to-r from-[#0d0e10] via-[#0d0e10]/75 to-[#0d0e10]/25" />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-[#0d0e10] via-transparent to-black/20" />

      <div className="relative mx-auto flex min-h-97.5 max-w-7xl items-end px-5 pb-12 pt-14 lg:px-8">
        <div className="max-w-xl">
          <div className="mb-3 flex flex-wrap gap-2 text-[9px] font-medium text-[#ff754b]">
            <span className="rounded bg-[#ff3d00]/20 px-2 py-1">Featured</span>
            <span className="rounded bg-[#ff3d00]/20 px-2 py-1">{featured.genre.split(",")[0]}</span>
            <span className="rounded bg-[#ff3d00]/20 px-2 py-1">Epic</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white md:text-6xl">{featured.title}</h1>
          <div className="mt-3 flex gap-4 text-[10px] text-zinc-300">
            <span className="flex items-center gap-1 text-base"><Star size={11} className="fill-[#ffb400] text-[#ffb400]" /> {featured.rating.toFixed(1)} Rating</span>
            <span className="text-base">{featured.year}</span>
            <span className="text-base">{featured.runtime}</span>
          </div>
          <p className="mt-4 max-w-lg text-base leading-5 text-zinc-400">Explore a universe of remarkable stories, unforgettable characters, and fresh episodes waiting for your next watch.</p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Link href={`/shows/${featured.id}`} className="inline-flex items-center gap-2 rounded-full bg-[#ff3d00] px-5 py-2.5 text-base font-semibold text-white hover:bg-[#ff551f]"><Play size={18} /> Watch Now</Link>
            <Link href={`/shows/${featured.id}`} className="inline-flex items-center gap-2 rounded-full border border-zinc-600 px-4 py-2.5 text-base text-zinc-200 hover:border-white"><Info size={18} /> More Details</Link>
            <button aria-label="Add featured show" className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-600 text-zinc-200 hover:border-white"><Plus size={14} /></button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-5 right-5 flex items-center gap-2 lg:right-8">
        {shows.map((show, index) => (
          <button
            key={show.id}
            aria-label={`Show ${show.title}`}
            onClick={() => setActiveIndex(index)}
            className={`h-1.5 rounded-full transition-all ${index === activeIndex ? "w-8 bg-[#ff3d00]" : "w-1.5 bg-white/40 hover:bg-white"}`}
          />
        ))}
        <span className="ml-2 flex items-center gap-1 text-[9px] text-zinc-400">
          {isHovered ? <Pause size={10} /> : <Play size={10} />} {hasTrailer ? "Hover to preview" : "Featured"}
        </span>
      </div>
    </section>
  );
}