import { NextResponse } from "next/server";
import type { ScheduleChannel, ScheduleDay, ScheduleProgram } from "@/lib/tv-schedule";
import { addScheduleDays, getNigeriaDate, isValidScheduleDate } from "@/lib/tv-schedule";

type DstvProgram = {
  Id?: unknown;
  StartTime?: unknown;
  EndTime?: unknown;
  Title?: unknown;
};

type DstvChannel = {
  Number?: unknown;
  Name?: unknown;
  Programmes?: unknown;
};

const dstvScheduleUrl = "https://www.dstv.com/umbraco/api/TvGuide/GetProgrammes";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidLocalDateTime(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value) &&
    Number.isFinite(new Date(`${value}+01:00`).getTime())
  );
}

function mapProgram(program: DstvProgram, channelNumber: string): ScheduleProgram | null {
  if (
    typeof program.Title !== "string" ||
    !program.Title ||
    !isValidLocalDateTime(program.StartTime) ||
    !isValidLocalDateTime(program.EndTime) ||
    program.EndTime <= program.StartTime
  ) {
    return null;
  }

  return {
    id:
      typeof program.Id === "string" && program.Id
        ? program.Id
        : `${channelNumber}-${program.StartTime}-${program.Title}`,
    title: program.Title,
    startTime: program.StartTime,
    endTime: program.EndTime,
  };
}

async function getScheduleDay(date: string): Promise<ScheduleDay> {
  const url = new URL(dstvScheduleUrl);
  url.searchParams.set("d", date);
  url.searchParams.set("country", "nga");

  const response = await fetch(url, { next: { revalidate: 900 } });
  if (!response.ok) {
    throw new Error(`DStv Nigeria guide request failed with status ${response.status}.`);
  }

  const payload: unknown = await response.json();
  if (!isRecord(payload) || !Array.isArray(payload.Channels)) {
    throw new Error("DStv returned an invalid Nigeria TV guide response.");
  }

  const startOfDay = `${date}T00:00:00`;
  const startOfNextDay = `${addScheduleDays(date, 1)}T00:00:00`;
  const channels = payload.Channels.flatMap((entry: unknown): ScheduleChannel[] => {
    if (!isRecord(entry)) return [];
    const channel = entry as DstvChannel;
    if (
      (typeof channel.Number !== "string" && typeof channel.Number !== "number") ||
      typeof channel.Name !== "string" ||
      !Array.isArray(channel.Programmes)
    ) {
      return [];
    }

    const number = String(channel.Number);
    const programmes = channel.Programmes.flatMap((item: unknown) => {
      if (!isRecord(item)) return [];
      const program = mapProgram(item as DstvProgram, number);
      if (
        !program ||
        program.endTime <= startOfDay ||
        program.startTime >= startOfNextDay
      ) {
        return [];
      }
      return [program];
    });

    if (programmes.length === 0) return [];
    programmes.sort((a, b) => a.startTime.localeCompare(b.startTime));
    return [{ number, name: channel.Name, programmes }];
  });

  return { date, channels };
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
    const results = await Promise.allSettled(dates.map(getScheduleDay));
    const availableDays = results.filter(
      (result): result is PromiseFulfilledResult<ScheduleDay> => result.status === "fulfilled",
    );
    if (availableDays.length === 0) {
      const failure = results.find(
        (result): result is PromiseRejectedResult => result.status === "rejected",
      );
      throw failure?.reason ?? new Error("DStv returned no schedule data.");
    }

    const scheduleDays = results.map((result, index): ScheduleDay => {
      if (result.status === "fulfilled") return result.value;
      console.error(`DStv Nigeria schedule unavailable for ${dates[index]}`, result.reason);
      return {
        date: dates[index],
        channels: [],
        error: "Listings are temporarily unavailable for this date.",
      };
    });

    return NextResponse.json(
      { country: "NG", provider: "DStv", days: scheduleDays },
      { headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300" } },
    );
  } catch (error) {
    console.error("DStv Nigeria schedule lookup failed", error);
    return NextResponse.json(
      { error: "The Nigeria TV schedule is temporarily unavailable. Please try again later." },
      { status: 502 },
    );
  }
}
