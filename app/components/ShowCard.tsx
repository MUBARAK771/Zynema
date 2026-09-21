"use client";

import Link from "next/link";
import { Star, Calendar, Clock } from "lucide-react";
import type { Show } from "@/lib/tvmaze";

export default function ShowCard({ show }: { show: Show }) {
  return (
    <Link href={`/shows/${show.id}`} className="group block overflow-hidden rounded-lg border border-[#242529] bg-base-card transition-colors hover:border-accent/50">
      <article>
        <div className="relative aspect-[16/10] bg-zinc-800">
          {show.posterImage && (
            <img
              src={show.posterImage}
              alt={`${show.title} poster`}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-black/10" />
          <span className="absolute right-2.5 top-2.5 z-10 flex items-center gap-1 rounded-md bg-black/70 px-2 py-1 text-xs font-semibold text-white backdrop-blur">
            <Star size={11} className="text-accent fill-accent" />
            {show.rating.toFixed(1)}
          </span>
        </div>
        <div className="min-h-[88px] p-3.5">
          <h3 className="truncate text-sm font-semibold text-white">{show.title}</h3>
          <p className="mt-0.5 truncate text-xs text-muted">{show.genre}</p>
          <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {show.year}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {show.runtime}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}