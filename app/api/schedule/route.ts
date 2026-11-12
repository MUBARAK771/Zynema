import { NextResponse } from "next/server";
import type { ScheduleDay, ScheduleEpisode } from "@/lib/tv-schedule";
import { addScheduleDays, getNigeriaDate, isValidScheduleDate } from "@/lib/tv-schedule";

type TVMazeEpisode = {
  id: number;
  name: string;
  season: number;
  number: number;
  airdate: string;
  airtime: string;
  runtime: number | null;
  summary: string | null;
  image: { medium?: string; original?: string } | null;
  show?: {
    id: number;
    name: string;
    image: { medium?: string; original?: string } | null;
    network: { name?: string } | null;
    webChannel: { name?: string } | null;
  };
};

const tvMazeBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.tvmaze.com")
  .trim()
  .replace(/\/$/, "");

function mapEpisode(episode: TVMazeEpisode): ScheduleEpisode | null {
  if (
    !episode.show ||
    !Number.isSafeInteger(episode.id) ||
    !Number.isSafeInteger(episode.show.id) ||
    !episode.show.name
  ) {
    return null;
  }

  return {
    id: episode.id,
    name: episode.name || "Untitled episode",
    season: episode.season,
    number: episode.number,
    airdate: episode.airdate,
    airtime: episode.airtime || "",
    runtime: episode.runtime,
    summary: episode.summary,
    image: episode.image?.original || episode.image?.medium || null,
    show: {
      id: episode.show.id,
      name: episode.show.name,
      image: episode.show.image?.original || episode.show.image?.medium || null,
      network:
        episode.show.network?.name ||
        episode.show.webChannel?.name ||
        null,
    },
  };
}

async function getScheduleDay(date: string): Promise<ScheduleDay> {
  const url = new URL(`${tvMazeBaseUrl}/schedule`);
  url.searchParams.set("country", "NG");
  url.searchParams.set("date", date);

  const response = await fetch(url, { next: { revalidate: 900 } });
  if (!response.ok) {
    throw new Error(`TVMaze schedule request failed with status ${response.status}.`);
  }

  const episodes = (await response.json()) as TVMazeEpisode[];
  return {
    date,
    episodes: episodes.flatMap((episode) => {
      const mapped = mapEpisode(episode);
      return mapped ? [mapped] : [];
    }),
  };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const date = params.get("date") ?? getNigeriaDate();
  const days = Number(params.get("days") ?? "1");

  if (!isValidScheduleDate(date)) {
    return NextResponse.json({ error: "Date must use the YYYY-MM-DD format." }, { status: 400 });
  }
  if (days !== 1 && days !== 7) {
    return NextResponse.json({ error: "Days must be either 1 or 7." }, { status: 400 });
  }

  try {
    const dates = Array.from({ length: days }, (_, index) => addScheduleDays(date, index));
    const scheduleDays = await Promise.all(dates.map(getScheduleDay));
    return NextResponse.json(
      { country: "NG", days: scheduleDays },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("TVMaze schedule lookup failed", error);
    return NextResponse.json(
      { error: "The TV schedule is temporarily unavailable. Please try again later." },
      { status: 502 },
    );
  }
}
