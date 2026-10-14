import { parseYmd, workDayInfo } from "./dates";
import { PLAN_DAYS, planDayFor, type PlanDay } from "./samplePlan";
import type { AppData, BlockTimes, Job } from "./types";

export const DEFAULT_HANG: BlockTimes = { start: "08:30", end: "13:30" };
export const DEFAULT_KNOCK: BlockTimes = { start: "16:00", end: "19:00" };

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

export const jobEnd = (j: Job) => toHHMM(toMin(j.start) + j.minutes);

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
  const shift = data.blockShifts[date] ?? {};
  const hangDay = planDayFor(n).day;
  const hang = shift.hang ?? DEFAULT_HANG;
  const knock = shift.knock ?? DEFAULT_KNOCK;
  const blocks: PlanBlock[] = [
    {
      kind: "hang",
      date,
      ...hang,
      title: `Hang 500: ${hangDay.zone.name}`,
      detail: `Day ${((n - 1) % PLAN_DAYS) + 1}${hangDay.ofParts > 1 ? ` · part ${hangDay.part} of ${hangDay.ofParts}` : ""}`,
      planDay: hangDay,
    },
  ];
  const knockDay = n > 1 ? planDayFor(n - 1).day : hangDay;
  blocks.push({
    kind: "knock",
    date,
    ...knock,
    title: `Knock: ${knockDay.zone.name}`,
    detail: n > 1 ? "Yesterday's streets" : "This morning's streets",
    planDay: knockDay,
  });
  return blocks;
}

export function jobsOn(data: AppData, date: string): Job[] {
  return data.jobs
    .filter((j) => j.date === date && j.status !== "canceled")
    .sort((a, b) => toMin(a.start) - toMin(b.start));
}

/** Plan blocks that overlap a job's time. */
export function overlapsFor(data: AppData, job: Pick<Job, "date" | "start" | "minutes">): PlanBlock[] {
  const s = toMin(job.start);
  const e = s + job.minutes;
  return blocksFor(data, job.date).filter((b) => s < toMin(b.end) && e > toMin(b.start));
}

/**
 * Times a block could move to so it no longer overlaps the job, without
 * running into the day's other block or other jobs. Full-length options come
 * first; shorter ones are offered when that's all that fits.
 */
export function shiftOptions(data: AppData, block: PlanBlock, job: Pick<Job, "id" | "date" | "start" | "minutes">): BlockTimes[] {
  const len = toMin(block.end) - toMin(block.start);
  const js = toMin(job.start);
  const je = js + job.minutes;
  const busy = [
    ...blocksFor(data, job.date)
      .filter((b) => b.kind !== block.kind)
      .map((b) => [toMin(b.start), toMin(b.end)]),
    ...jobsOn(data, job.date)
      .filter((j) => j.id !== job.id)
      .map((j) => [toMin(j.start), toMin(j.start) + j.minutes]),
    [js, je],
  ];
  const fits = (s: number, e: number) => s >= DAY_MIN && e <= DAY_MAX && e - s >= 60 && !busy.some(([a, b]) => s < b && e > a);
  const out: [number, number][] = [];
  if (fits(je, je + len)) out.push([je, je + len]);
  if (fits(js - len, js)) out.push([js - len, js]);
  if (!out.length) {
    const prevEnd = Math.max(DAY_MIN, ...busy.filter(([, b]) => b <= js).map(([, b]) => b));
    if (fits(Math.max(prevEnd, js - len), js)) out.push([Math.max(prevEnd, js - len), js]);
    const nextStart = Math.min(DAY_MAX, ...busy.filter(([a]) => a >= je).map(([a]) => a));
    if (fits(je, Math.min(nextStart, je + len))) out.push([je, Math.min(nextStart, je + len)]);
  }
  return out.map(([a, b]) => ({ start: toHHMM(a), end: toHHMM(b) }));
}

const DAY_MIN = 6 * 60;
const DAY_MAX = 21 * 60;

export function newId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
