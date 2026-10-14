import { parseYmd, workDayInfo } from "./dates";
import { PLAN_DAYS, planDayFor, type PlanDay } from "./samplePlan";
import type { AppData } from "./types";

export const HANG = { start: "08:30", end: "13:30" };
export const KNOCK = { start: "16:00", end: "19:00" };

export type BlockKind = "hang" | "knock";

export interface PlanBlock {
  kind: BlockKind;
  date: string;
  start: string;
  end: string;
  title: string;
  detail: string;
  /** Plan day this block belongs to (for hanging: today's; for knocking: yesterday's). */
  planDay: PlanDay;
}

export const toMin = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
};

export const toHHMM = (min: number) => {
  const m = Math.max(0, Math.min(24 * 60 - 1, Math.round(min)));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

/** "1:30pm" style. */
export function niceTime(hhmm: string): string {
  const m = toMin(hhmm);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ampm = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return mm ? `${h12}:${String(mm).padStart(2, "0")}${ampm}` : `${h12}${ampm}`;
}

/** Work-day number (1-based) for a date, or 0 when it isn't a plan work day. */
export function planDayNumberOn(data: AppData, date: string): number {
  const p = data.profile;
  if (!p) return 0;
  return workDayInfo(p.startDate, p.workDays, parseYmd(date)).dayNumber;
}

/** Hanging and knocking blocks for one date from the 10K Homes plan. */
export function blocksFor(data: AppData, date: string): PlanBlock[] {
  const n = planDayNumberOn(data, date);
  if (!n) return [];
  const hangDay = planDayFor(n).day;
  const knockDay = n > 1 ? planDayFor(n - 1).day : hangDay;
  return [
    {
      kind: "hang",
      date,
      ...HANG,
      title: `Hang 500: ${hangDay.zone.name}`,
      detail: `Day ${((n - 1) % PLAN_DAYS) + 1}${hangDay.ofParts > 1 ? ` · part ${hangDay.part} of ${hangDay.ofParts}` : ""}`,
      planDay: hangDay,
    },
    {
      kind: "knock",
      date,
      ...KNOCK,
      title: `Knock: ${knockDay.zone.name}`,
      detail: n > 1 ? "Yesterday's streets" : "This morning's streets",
      planDay: knockDay,
    },
  ];
}
