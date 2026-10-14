import { parseYmd, weekStart, ymd } from "./dates";
import { HOMES_PER_DAY } from "./samplePlan";
import type { AppData, DailyNumbers } from "./types";

export interface Tip {
  title: string;
  body: string;
}

function weekTotals(data: AppData, today: string): { t: DailyNumbers; days: number } {
  const wk = weekStart(today);
  const t: DailyNumbers = { hangers: 0, knocked: 0, conversations: 0, quotes: 0, sales: 0, revenue: 0, quotesHanger: 0, salesHanger: 0 };
  let days = 0;
  for (const [d, n] of Object.entries(data.numbers)) {
    if (weekStart(d) !== wk || d > today) continue;
    days++;
    for (const k of Object.keys(t) as (keyof DailyNumbers)[]) t[k] += n[k] || 0;
  }
  return { t, days };
}

const pct = (a: number, b: number) => `${Math.round((a / b) * 100)}%`;

/** Up to two tips from this week's numbers. Rules only: no made-up benchmarks. */
export function coachTips(data: AppData, today = ymd(new Date())): Tip[] {
  const { t, days } = weekTotals(data, today);
  const work = data.profile?.workDays ?? [1, 2, 3, 4, 5];
  const elapsed = (() => {
    let n = 0;
    for (let d = parseYmd(weekStart(today)); ymd(d) <= today; d.setDate(d.getDate() + 1)) if (work.includes(d.getDay())) n++;
    return n;
  })();
  const tips: Tip[] = [];

  if (days === 0) {
    return [{ title: "Enter your numbers each night", body: "Once you've logged a day or two, this card gives you one thing to work on." }];
  }
  const planned = elapsed * HOMES_PER_DAY;
  if (planned > 0 && t.hangers < planned * 0.8) {
    tips.push({
      title: `Hangers: ${t.hangers.toLocaleString()} of ${planned.toLocaleString()} planned so far this week`,
      body: "Hangers fill your phone for the next week. Start by 8:30 and finish all 5 bundles before you stop for jobs.",
    });
  }
  if (t.hangers >= 500 && t.knocked < t.hangers * 0.5) {
    tips.push({
      title: `You knocked ${t.knocked} doors after hanging ${t.hangers}`,
      body: "Homes that got a hanger yesterday already know your name. Knock as many of them as you can from 4 to 7pm.",
    });
  }
  if (t.conversations >= 10) {
    const doorQuotes = t.quotes - t.quotesHanger;
    const doorSales = t.sales - t.salesHanger;
    if (doorQuotes / t.conversations < 0.25) {
      tips.push({
        title: `${doorQuotes} quotes from ${t.conversations} conversations (${pct(doorQuotes, t.conversations)})`,
        body: "Ask for the quote sooner. Try: “I can give you an exact price in two minutes. Mind if I count the windows?”",
      });
    } else if (t.quotes >= 5 && doorSales / Math.max(1, doorQuotes) < 0.3) {
      tips.push({
        title: `${t.sales} sales from ${t.quotes} quotes (${pct(t.sales, t.quotes)})`,
        body: "Offer a day right away: “I have an opening Thursday. Want me to put you down?” Then text every quote the same day.",
      });
    }
  }
  if (tips.length === 0) {
    tips.push({ title: "You're on plan this week", body: "Keep the same rhythm: hang in the morning, knock yesterday's streets at 4." });
  }
  return tips.slice(0, 2);
}

/** Where this week's quotes and sales came from. */
export function sourceSplit(data: AppData, today = ymd(new Date())) {
  const { t } = weekTotals(data, today);
  return {
    hanger: { quotes: t.quotesHanger, sales: t.salesHanger },
    knocking: { quotes: Math.max(0, t.quotes - t.quotesHanger), sales: Math.max(0, t.sales - t.salesHanger) },
  };
}
