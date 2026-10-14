import { addDays, parseYmd, weekStart, ymd } from "./dates";
import type { AppData, DailyNumbers } from "./types";

export interface Rate {
  value: number | null; // 0..1
  from: "yours" | "guess" | "none";
  detail: string;
}

/** Sums daily numbers over the last `days` days. */
export function recent(data: AppData, days: number, today = new Date()): DailyNumbers {
  const t: DailyNumbers = { hangers: 0, knocked: 0, conversations: 0, quotes: 0, sales: 0, revenue: 0, quotesHanger: 0, salesHanger: 0 };
  const from = ymd(addDays(today, -days + 1));
  const to = ymd(today);
  for (const [d, n] of Object.entries(data.numbers)) {
    if (d < from || d > to) continue;
    for (const k of Object.keys(t) as (keyof DailyNumbers)[]) t[k] += n[k] || 0;
  }
  return t;
}

/** Your real rate when you have enough numbers, otherwise your own guess. */
function rate(part: number, whole: number, minWhole: number, guess: number | null, label: string): Rate {
  if (whole >= minWhole) return { value: part / whole, from: "yours", detail: `${part} of ${whole} ${label} (last 4 weeks)` };
  if (guess != null && guess > 0) return { value: guess / 100, from: "guess", detail: "your guess until you have more numbers" };
  return { value: null, from: "none", detail: `needs at least ${minWhole} ${label}, or your guess` };
}

export function goalMath(data: AppData) {
  const g = data.goal;
  const r = recent(data, 28);
  const talk = rate(r.conversations, r.knocked, 50, g.guessTalk, "doors knocked");
  const doorQuotes = r.quotes - r.quotesHanger;
  const quote = rate(doorQuotes, r.conversations, 20, g.guessQuote, "conversations");
  const close = rate(r.sales, r.quotes, 5, g.guessClose, "quotes");
  const avg = g.avgJob ?? (r.sales >= 3 && r.revenue > 0 ? r.revenue / r.sales : null);
  const days = Math.max(1, (data.profile?.workDays.length || 5) * 4.33);

  const jobs = avg ? Math.ceil(g.monthly / avg) : null;
  const quotes = jobs != null && close.value ? Math.ceil(jobs / close.value) : null;
  const talks = quotes != null && quote.value ? Math.ceil(quotes / quote.value) : null;
  const knocks = talks != null && talk.value ? Math.ceil(talks / talk.value) : null;
  return {
    avg,
    avgFrom: g.avgJob ? "yours" : avg ? "numbers" : "none",
    talk,
    quote,
    close,
    perMonth: { jobs, quotes, talks, knocks },
    perDay: {
      jobs: jobs != null ? jobs / days : null,
      quotes: quotes != null ? quotes / days : null,
      talks: talks != null ? talks / days : null,
      knocks: knocks != null ? knocks / days : null,
    },
  };
}

/** Revenue entered so far this calendar month. */
export function monthRevenue(data: AppData, today = new Date()): number {
  const prefix = ymd(today).slice(0, 7);
  return Object.entries(data.numbers)
    .filter(([d]) => d.startsWith(prefix))
    .reduce((s, [, n]) => s + (n.revenue || 0), 0);
}

/** Fraction of this month's days that have passed (for pace). */
export function monthElapsed(today = new Date()): number {
  const days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  return today.getDate() / days;
}

export { weekStart, parseYmd };
