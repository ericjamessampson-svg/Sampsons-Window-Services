import { weekStart } from "./dates";
import { GOAL_HOMES } from "./samplePlan";
import type { AppData } from "./types";

export interface Milestone {
  id: string;
  title: string;
  reached: boolean;
  /** Short line on how to get there. */
  hint: string;
  /** The app can't count this one; the owner marks it reached. */
  manual?: boolean;
}

export function homesReached(data: AppData) {
  return Object.values(data.numbers).reduce((s, n) => s + (n.hangers ?? 0), 0);
}

/** Revenue entered in daily numbers, per week (Monday start). */
export function revenueByWeek(data: AppData): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [date, n] of Object.entries(data.numbers)) {
    if (!n.revenue) continue;
    const w = weekStart(date);
    out[w] = (out[w] ?? 0) + n.revenue;
  }
  return out;
}

export function milestones(data: AppData): Milestone[] {
  const homes = homesReached(data);
  const nums = Object.values(data.numbers);
  const bestWeek = Math.max(0, ...Object.values(revenueByWeek(data)));
  const manual = (id: string) => !!data.milestonesDone[id];

  return [
    { id: "quote", title: "First quote", reached: nums.some((n) => n.quotes > 0), hint: "Knock yesterday's streets and ask every person for a quote." },
    { id: "sale", title: "First sale", reached: nums.some((n) => n.sales > 0), hint: "Book the next quote on the spot." },
    { id: "homes2500", title: "2,500 homes reached", reached: homes >= 2500, hint: `${Math.max(0, 2500 - homes).toLocaleString()} homes to go.` },
    { id: "week1000", title: "First $1,000 week", reached: bestWeek >= 1000, hint: `Best week so far: $${bestWeek.toLocaleString()}. Enter revenue in today's numbers.` },
    { id: "homes5000", title: "5,000 homes reached", reached: homes >= 5000, hint: `${Math.max(0, 5000 - homes).toLocaleString()} homes to go.` },
    { id: "repeat", title: "First recurring customer", reached: manual("repeat"), hint: "Offer every customer a spot on your next round.", manual: true },
    { id: "homes10k", title: `${GOAL_HOMES.toLocaleString()} homes reached`, reached: homes >= GOAL_HOMES, hint: `${Math.max(0, GOAL_HOMES - homes).toLocaleString()} homes to go.` },
    {
      id: "hire",
      title: "Time to hire your first technician",
      reached: manual("hire"),
      hint: "When your booked jobs fill more than 2 work days a week.",
      manual: true,
    },
  ];
}
