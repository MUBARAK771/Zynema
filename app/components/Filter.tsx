"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown, Star } from "lucide-react";

const activeFilters = ["Popular movies"];

const genres = [
  "Action",
  "Comedy",
  "Drama",
  "Sci-Fi",
  "Mystery",
  "Fantasy",
  "Documentary",
];
const statuses = ["Ongoing", "Completed", "Airing", "Upcoming"];
const showTypes = ["TV Series", "Mini Series", "Movie", "Special"];
const trendingTags = ["#cyberpunk", "#oscar-winner", "#true-story", "#classic"];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="py-5 border-b border-[#242529]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-xs font-semibold tracking-wide text-zinc-400"
      >
        {title}
        <ChevronDown
          size={14}
          className={`transition-transform ${open ? "" : "-rotate-90"}`}
        />
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}

export default function Filters() {
  const [minRating, setMinRating] = useState(7.0);

  return (
    <aside className="hidden lg:block w-[270px] shrink-0 border-r border-[#242529] px-5 py-5 overflow-y-auto">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 text-base font-semibold">
          <SlidersHorizontal size={16} className="text-accent" />
          Filters
        </div>
        <button className="text-xs text-muted hover:text-white">Reset</button>
      </div>

      <Section title="GENRES">
        <div className="space-y-2.5">
          {genres.map((g) => (
            <label
              key={g}
              className="flex items-center gap-2.5 text-sm text-zinc-300 cursor-pointer"
            >
              <input
                type="checkbox"
                defaultChecked={g === "Sci-Fi"}
                className="h-4 w-4 rounded border-zinc-600 accent-[#FF3D00]"
              />
              {g}
            </label>
          ))}
        </div>
      </Section>

      <Section title="STATUS">
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              className="px-3 py-1.5 rounded-full text-xs bg-base-panel border border-[#242529] text-zinc-300 hover:border-accent hover:text-white"
            >
              {s}
            </button>
          ))}
        </div>
      </Section>

      <Section title="SHOW TYPE">
        <div className="space-y-2.5">
          {showTypes.map((t) => (
            <label
              key={t}
              className="flex items-center gap-2.5 text-sm text-zinc-300 cursor-pointer"
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-zinc-600 accent-[#FF3D00]"
              />
              {t}
            </label>
          ))}
        </div>
      </Section>

      <Section title="MINIMUM RATING">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-accent font-medium">
            {minRating.toFixed(1)}+
          </span>
          <Star size={14} className="text-accent fill-accent" />
        </div>
        <input
          type="range"
          min={0}
          max={10}
          step={0.1}
          value={minRating}
          onChange={(e) => setMinRating(parseFloat(e.target.value))}
          style={{ ["--fill" as any]: `${(minRating / 10) * 100}%` }}
          className="range-accent w-full"
        />
        <div className="flex justify-between text-[11px] text-muted mt-1">
          <span>0.0</span>
          <span>5.0</span>
          <span>10.0</span>
        </div>
      </Section>

      <div className="pt-5">
        <p className="text-xs font-semibold tracking-wide text-zinc-400 mb-3">
          TRENDING TAGS
        </p>
        <div className="flex flex-wrap gap-2">
          {trendingTags.map((t) => (
            <span
              key={t}
              className="px-3 py-1 rounded-full text-xs bg-base-panel border border-[#242529] text-zinc-400"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function ActiveFilterPills() {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="text-xs text-muted tracking-wide mr-1">
        ACTIVE FILTERS:
      </span>
      {activeFilters.map((filter) => (
        <span
          key={filter}
          className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full text-xs bg-accent/15 text-accent border border-accent/30"
        >
          {filter}
          <button className="hover:text-white">×</button>
        </span>
      ))}
      <button className="text-xs text-muted hover:text-white ml-1">
        Clear All
      </button>
    </div>
  );
}