"use client";

import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import type { ScheduleDay, ScheduleResponse } from "@/lib/tv-schedule";
import { addScheduleDays } from "@/lib/tv-schedule";

function formatDay(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00.000Z`));
}

function formatProgramTime(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  }).format(new Date(`${value}+01:00`));
}

export default function ScheduleClient({ initialDate }: { initialDate: string }) {
  const [date, setDate] = useState(initialDate);
  const [days, setDays] = useState<1 | 7>(1);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [channelSearch, setChannelSearch] = useState("");
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(
            `/api/schedule?date=${encodeURIComponent(date)}&days=${days}`,
            { signal: controller.signal },
          );
          const data = (await response.json()) as ScheduleResponse | { error?: string };
          if (!response.ok || !("days" in data)) {
            throw new Error("error" in data && data.error ? data.error : "The schedule could not be loaded.");
          }
          setSchedule(data.days);
        } catch (cause) {
          if (cause instanceof DOMException && cause.name === "AbortError") return;
          setError(cause instanceof Error ? cause.message : "The schedule could not be loaded.");
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      })();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [date, days]);

  function moveDate(amount: number) {
    setDate((current) => addScheduleDays(current, amount * days));
  }

  const visibleSchedule = schedule.map((day) => ({
    ...day,
    channels: day.channels.filter((channel) =>
      `${channel.number} ${channel.name}`.toLowerCase().includes(channelSearch.trim().toLowerCase()),
    ),
  }));
  const hasListings = schedule.some((day) => day.channels.length > 0);
  const hasUnavailableDays = schedule.some((day) => day.error);
  const hasVisibleChannels = visibleSchedule.some((day) => day.channels.length > 0);

  return (
    <section className="mt-7">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#242529] bg-[#17191c] p-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => moveDate(-1)} aria-label="Previous date" className="rounded-lg border border-[#34363a] p-2 text-zinc-300 hover:text-white">
            <ChevronLeft size={17} />
          </button>
          <button type="button" onClick={() => setDate(initialDate)} className="rounded-lg border border-[#34363a] px-3 py-2 text-xs text-zinc-200 hover:border-zinc-500">
            Today
          </button>
          <button type="button" onClick={() => moveDate(1)} aria-label="Next date" className="rounded-lg border border-[#34363a] p-2 text-zinc-300 hover:text-white">
            <ChevronRight size={17} />
          </button>
          <span className="ml-1 text-sm font-medium text-white">{formatDay(date)}</span>
        </div>

        <div className="flex rounded-lg border border-[#34363a] p-1" aria-label="Schedule view">
          <button type="button" onClick={() => setDays(1)} aria-pressed={days === 1} className={`rounded-md px-3 py-1.5 text-xs ${days === 1 ? "bg-[#ff3d00] text-white" : "text-zinc-400 hover:text-white"}`}>
            Today
          </button>
          <button type="button" onClick={() => setDays(7)} aria-pressed={days === 7} className={`rounded-md px-3 py-1.5 text-xs ${days === 7 ? "bg-[#ff3d00] text-white" : "text-zinc-400 hover:text-white"}`}>
            7 days
          </button>
        </div>
      </div>

      <label className="mt-4 flex max-w-md items-center gap-2 rounded-lg border border-[#34363a] bg-[#17191c] px-3 py-2 text-zinc-400">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={channelSearch}
          onChange={(event) => setChannelSearch(event.target.value)}
          placeholder="Search Nigeria TV channels"
          aria-label="Search Nigeria TV channels"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
        />
      </label>

      {loading ? <p role="status" className="mt-5 text-sm text-zinc-400">Loading TV listings for Nigeria…</p> : null}
      {error ? (
        <p role="alert" className="mt-5 rounded-lg border border-amber-900/60 bg-amber-950/30 p-4 text-sm text-amber-100">
          {error}
        </p>
      ) : null}

      {!loading && !error && !hasListings && !hasUnavailableDays ? (
        <div className="mt-5 rounded-xl border border-[#242529] bg-[#17191c] p-6 text-sm text-zinc-400">
          DStv has no listings for Nigeria on these dates. Try another date or check back later.
        </div>
      ) : null}

      {!loading && !error && hasListings && !hasVisibleChannels ? (
        <p className="mt-5 rounded-xl border border-[#242529] bg-[#17191c] p-6 text-sm text-zinc-400">
          No channels match “{channelSearch}”. Try another channel name or number.
        </p>
      ) : null}

      <div className="mt-5 space-y-7">
        {visibleSchedule.filter((day) => day.channels.length > 0 || day.error).map((day) => (
          <section key={day.date} aria-label={`Schedule for ${day.date}`}>
            {days === 7 ? <h2 className="mb-3 text-sm font-semibold text-zinc-300">{formatDay(day.date)}</h2> : null}
            {day.error ? (
              <p role="status" className="mb-2 rounded-xl border border-amber-900/60 bg-amber-950/30 p-4 text-sm text-amber-100">
                {day.error}
              </p>
            ) : null}
            <div className="space-y-2">
              {day.channels.map((channel) => {
                const channelKey = `${day.date}-${channel.number}`;
                const expanded = expandedChannels.has(channelKey);
                return (
                  <article key={channelKey} className="overflow-hidden rounded-xl border border-[#242529] bg-[#17191c]">
                    <button
                      type="button"
                      aria-expanded={expanded}
                      onClick={() => {
                        setExpandedChannels((current) => {
                          const next = new Set(current);
                          if (next.has(channelKey)) next.delete(channelKey);
                          else next.add(channelKey);
                          return next;
                        });
                      }}
                      className="flex w-full items-center justify-between gap-3 p-4 text-left hover:bg-white/[0.03]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-white">{channel.name}</span>
                        <span className="mt-1 block text-xs text-zinc-500">
                          Channel {channel.number} · {channel.programmes.length} listings
                        </span>
                      </span>
                      <ChevronDown
                        size={18}
                        aria-hidden="true"
                        className={`shrink-0 text-zinc-400 transition-transform ${expanded ? "rotate-180" : ""}`}
                      />
                    </button>
                    {expanded ? (
                      <ul className="divide-y divide-[#242529] border-t border-[#242529] px-4">
                        {channel.programmes.map((program) => (
                          <li key={`${channel.number}-${program.id}`} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
                            <span className="text-sm text-zinc-200">{program.title}</span>
                            <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                              {formatProgramTime(program.startTime)} – {formatProgramTime(program.endTime)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs text-zinc-600">
        <CalendarDays size={13} />
        Listings provided by{" "}
        <a
          href="https://www.dstv.com/en-ng/explore/tv-guide"
          target="_blank"
          rel="noreferrer"
          className="text-zinc-400 underline underline-offset-2 hover:text-white"
        >
          DStv Nigeria
        </a>
        . Channel availability depends on your package.
      </p>
    </section>
  );
}
