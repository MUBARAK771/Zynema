export type ScheduleProgram = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
};

export type ScheduleChannel = {
  number: string;
  name: string;
  programmes: ScheduleProgram[];
};

export type ScheduleDay = {
  date: string;
  channels: ScheduleChannel[];
  error?: string;
};

export type ScheduleResponse = {
  country: "NG";
  provider: "DStv";
  days: ScheduleDay[];
};

export function getNigeriaDate(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function isValidScheduleDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function addScheduleDays(value: string, days: number) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
