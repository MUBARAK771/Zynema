"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Tv } from "lucide-react";
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

export default function ScheduleClient({ initialDate }: { initialDate: string }) {
  const [date, setDate] = useState(initialDate);
  const [days, setDays] = useState<1 | 7>(1);
  const [schedule, setSchedule] = useState<ScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

      {loading ? <p role="status" className="mt-5 text-sm text-zinc-400">Loading TV listings for Nigeria…</p> : null}
      {error ? (
        <p role="alert" className="mt-5 rounded-lg border border-amber-900/60 bg-amber-950/30 p-4 text-sm text-amber-100">
          {error}
        </p>
      ) : null}

      {!loading && !error && schedule.every((day) => day.episodes.length === 0) ? (
        <div className="mt-5 rounded-xl border border-[#242529] bg-[#17191c] p-6 text-sm text-zinc-400">
          TVMaze has no broadcast listings for Nigeria on these dates. Try another date or check back later.
        </div>
      ) : null}

      <div className="mt-5 space-y-7">
        {schedule.filter((day) => day.episodes.length > 0).map((day) => (
          <section key={day.date} aria-label={`Schedule for ${day.date}`}>
            {days === 7 ? <h2 className="mb-3 text-sm font-semibold text-zinc-300">{formatDay(day.date)}</h2> : null}
            <div className="space-y-3">
              {day.episodes.map((episode) => (
                <article key={episode.id} className="flex flex-col gap-4 rounded-xl border border-[#242529] bg-[#17191c] p-3 sm:flex-row">
                  <Link href={`/shows/${episode.show.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-zinc-800 sm:w-36">
                      {episode.image || episode.show.image ? (
                        <img src={episode.image || episode.show.image || ""} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-zinc-500"><Tv size={22} /></div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{episode.show.name}</p>
                      <p className="mt-1 truncate text-xs text-zinc-300">{episode.name}</p>
                      <p className="mt-1 text-[11px] text-zinc-500">
                        {episode.season > 0 ? `Season ${episode.season}` : "Special"}
                        {episode.number > 0 ? ` · Episode ${episode.number}` : ""}
                        {episode.show.network ? ` · ${episode.show.network}` : ""}
                      </p>
                    </div>
                  </Link>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-zinc-400 sm:justify-end">
                    <Clock size={14} />
                    <span>{episode.airtime || "Time not listed"}{episode.runtime ? ` · ${episode.runtime}m` : ""}</span>
                    <Link href={`/shows/${episode.show.id}`} aria-label={`View ${episode.show.name}`} className="ml-2 text-[#ff754b] hover:text-white">
                      Details
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>

      <p className="mt-6 flex items-center gap-2 text-xs text-zinc-600">
        <CalendarDays size={13} /> Listings provided by TVMaze and may not include every broadcaster.
      </p>
    </section>
  );
}
