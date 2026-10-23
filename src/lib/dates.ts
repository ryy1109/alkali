export const TIMEZONE = "Asia/Singapore";

export function todayInSingapore(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (name: string) => parts.find((p) => p.type === name)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function addDays(date: string, days: number): string {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function displayDate(date: string): string {
  return new Intl.DateTimeFormat("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date.slice(0, 10)}T00:00:00.000Z`));
}

export function calendarMonth(value: unknown, today = todayInSingapore()): string {
  return typeof value === "string" && /^(19\d{2}|[2-9]\d{3})-(0[1-9]|1[0-2])$/.test(value)
    ? value : today.slice(0, 7);
}

export function monthBounds(month: string) {
  const start = month + "-01";
  const date = new Date(start + "T00:00:00.000Z");
  date.setUTCMonth(date.getUTCMonth() + 1, 0);
  return { start, end: date.toISOString().slice(0, 10) };
}

export function adjacentMonth(month: string, offset: number): string | null {
  const date = new Date(month + "-01T00:00:00.000Z");
  date.setUTCMonth(date.getUTCMonth() + offset);
  const year = date.getUTCFullYear();
  return year < 1900 || year > 9999 ? null : date.toISOString().slice(0, 7);
}

export function monthDays(month: string): (string | null)[] {
  const { start, end } = monthBounds(month);
  const offset = (new Date(start + "T00:00:00Z").getUTCDay() + 6) % 7;
  const days: (string | null)[] = Array(offset).fill(null);
  for (let day = 1; day <= Number(end.slice(8, 10)); day++) {
    days.push(`${month}-${String(day).padStart(2, "0")}`);
  }
  while (days.length % 7) days.push(null);
  return days;
}

export function displayEstimate(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return [hours ? `${hours} ${hours === 1 ? "hour" : "hours"}` : "",
    remainder ? `${remainder} ${remainder === 1 ? "minute" : "minutes"}` : ""]
    .filter(Boolean).join(" ");
}
