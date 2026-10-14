import { weekStart } from "./dates";
import { GOAL_HOMES } from "./samplePlan";
import type { AppData } from "./types";

export interface Milestone {
  id: string;
  title: string;
  reached: boolean;
  /** Short line on how to get there. */
  hint: string;
}

const booked = (data: AppData) => data.jobs.filter((j) => j.status !== "canceled");

export function homesReached(data: AppData) {
  return Object.values(data.numbers).reduce((s, n) => s + (n.hangers ?? 0), 0);
}

/** Booked-job revenue per week (Monday start). */
export function revenueByWeek(data: AppData): Record<string, number> {
  const out: Record<string, number> = {};
  for (const j of booked(data)) {
    if (j.kind !== "job" || !j.price) continue;
    const w = weekStart(j.date);
    out[w] = (out[w] ?? 0) + j.price;
  }
  return out;
}

/** Hours of booked jobs per week. */
export function jobHoursByWeek(data: AppData): Record<string, number> {
  const out: Record<string, number> = {};
  for (const j of booked(data)) {
    if (j.kind !== "job") continue;
    const w = weekStart(j.date);
    out[w] = (out[w] ?? 0) + j.minutes / 60;
  }
  return out;
}

export function milestones(data: AppData): Milestone[] {
  const homes = homesReached(data);
  const nums = Object.values(data.numbers);
  const jobs = booked(data);
  const anyQuote = nums.some((n) => n.quotes > 0) || jobs.some((j) => j.kind === "quote");
  const anyJob = nums.some((n) => n.sales > 0) || jobs.some((j) => j.kind === "job");
  const bestWeek = Math.max(0, ...Object.values(revenueByWeek(data)));
  const counts: Record<string, number> = {};
  for (const j of jobs) if (j.kind === "job" && j.customer.trim()) counts[j.customer.trim().toLowerCase()] = (counts[j.customer.trim().toLowerCase()] ?? 0) + 1;
  const repeat = Object.values(counts).some((c) => c >= 2);
  const dayHours = data.profile?.hoursPerDay || 8;
  const fullDays = Math.max(0, ...Object.values(jobHoursByWeek(data))) / dayHours;

  return [
    { id: "quote", title: "First quote", reached: anyQuote, hint: "Knock yesterday's streets and ask every person for a quote." },
    { id: "job", title: "First job", reached: anyJob, hint: "Book the next quote on the spot." },
    { id: "homes2500", title: "2,500 homes reached", reached: homes >= 2500, hint: `${Math.max(0, 2500 - homes).toLocaleString()} homes to go.` },
    {
      id: "week1000",
      title: "First $1,000 week",
      reached: bestWeek >= 1000,
      hint: `Best week so far: $${bestWeek.toLocaleString()} in booked jobs.`,
    },
    { id: "homes5000", title: "5,000 homes reached", reached: homes >= 5000, hint: `${Math.max(0, 5000 - homes).toLocaleString()} homes to go.` },
    { id: "repeat", title: "First repeat customer", reached: repeat, hint: "Offer every customer a spot on your next round." },
    {
      id: "homes10k",
      title: `${GOAL_HOMES.toLocaleString()} homes reached`,
      reached: homes >= GOAL_HOMES,
      hint: `${Math.max(0, GOAL_HOMES - homes).toLocaleString()} homes to go.`,
    },
    {
      id: "hire",
      title: "Time to hire your first technician",
      reached: fullDays > 2,
      hint: `Happens when booked jobs fill more than 2 work days in a week. Your busiest week so far: ${fullDays.toFixed(1)} days.`,
    },
  ];
}
