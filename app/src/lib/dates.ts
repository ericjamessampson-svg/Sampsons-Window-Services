export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Local date as YYYY-MM-DD. */
export function ymd(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function niceDate(s: string): string {
  return parseYmd(s).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

/** Next Monday on or after today. */
export function nextMonday(from = new Date()): string {
  const d = new Date(from);
  const diff = (8 - d.getDay()) % 7;
  return ymd(addDays(d, diff === 0 ? 0 : diff));
}

export interface WorkDayInfo {
  /** 1-based count of work days since start (1 = Day 1). 0 = not started. */
  dayNumber: number;
  isWorkDay: boolean;
  /** date of the next work day if today isn't one or before start */
  nextWorkDate: string;
  nextDayNumber: number;
}

/** Counts work days from the start date to `today`. */
export function workDayInfo(startDate: string, workDays: number[], today = new Date()): WorkDayInfo {
  const days = workDays.length ? workDays : [1, 2, 3, 4, 5];
  const start = parseYmd(startDate);
  const t = parseYmd(ymd(today));
  let count = 0;
  for (let d = new Date(start); d <= t; d = addDays(d, 1)) {
    if (days.includes(d.getDay())) count++;
  }
  const isWorkDay = t >= start && days.includes(t.getDay());
  let next = isWorkDay ? t : addDays(t, 1);
  if (next < start) next = start;
  for (let i = 0; i < 14 && !days.includes(next.getDay()); i++) next = addDays(next, 1);
  return {
    dayNumber: isWorkDay ? count : 0,
    isWorkDay,
    nextWorkDate: ymd(next),
    nextDayNumber: isWorkDay ? count : count + 1,
  };
}

/** Monday-based week key, e.g. "2026-10-19". */
export function weekStart(s: string): string {
  const d = parseYmd(s);
  const diff = (d.getDay() + 6) % 7;
  return ymd(addDays(d, -diff));
}
