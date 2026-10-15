import { describe, expect, it } from "vitest";
import { emptyData } from "@/lib/store";
import { workDayInfo, weekStart, ymd } from "@/lib/dates";
import { CONFIRMED_HOMES, PLAN_DAYS, SAMPLE_PLAN, ZONES, planDayFor } from "@/lib/samplePlan";
import { blocksFor } from "@/lib/schedule";
import { goalMath, monthRevenue } from "@/lib/goal";
import { coachTips, sourceSplit } from "@/lib/coach";
import { milestones } from "@/lib/milestones";
import { parseHomeBase, pickPlace } from "@/lib/places";
import { remindersIcs } from "@/lib/ics";
import { bookingUrl, smsLink } from "@/lib/booking";
import type { AppData, DailyNumbers, Profile } from "@/lib/types";

const profile: Profile = {
  trade: "window", tradeOther: "", services: ["Outside windows", "Screens"], homeBase: "Kyle, TX",
  startupBudget: null, hangerBudget: null, hoursPerDay: 9, workDays: [1, 2, 3, 4, 5], travel: "car_scooter",
  rangeMinutes: 50, targetHome: "$500K+", stage: "equipment", startDate: "2026-10-19", useSamplePlan: true,
};
const nums = (n: Partial<DailyNumbers>): DailyNumbers => ({
  hangers: 0, knocked: 0, conversations: 0, quotes: 0, sales: 0, revenue: 0, quotesHanger: 0, salesHanger: 0, ...n,
});
const withData = (patch: Partial<AppData> = {}): AppData => ({ ...emptyData(), profile, ...patch });
const d = (s: string) => new Date(`${s}T10:00:00`);

describe("work days", () => {
  it("Day 1 is the start date, weekends are days off", () => {
    expect(workDayInfo("2026-10-19", [1, 2, 3, 4, 5], d("2026-10-19")).dayNumber).toBe(1);
    expect(workDayInfo("2026-10-19", [1, 2, 3, 4, 5], d("2026-10-23")).dayNumber).toBe(5);
    const sat = workDayInfo("2026-10-19", [1, 2, 3, 4, 5], d("2026-10-24"));
    expect(sat.isWorkDay).toBe(false);
    expect(sat.nextWorkDate).toBe("2026-10-26");
    expect(sat.nextDayNumber).toBe(6);
  });
  it("before the start date it points at Day 1", () => {
    const before = workDayInfo("2026-10-19", [1, 2, 3, 4, 5], d("2026-10-14"));
    expect(before.dayNumber).toBe(0);
    expect(before.nextWorkDate).toBe("2026-10-19");
    expect(before.nextDayNumber).toBe(1);
  });
  it("weeks start on Monday", () => {
    expect(weekStart("2026-10-18")).toBe("2026-10-12");
    expect(weekStart("2026-10-19")).toBe("2026-10-19");
  });
});

describe("10K Homes plan", () => {
  it("has 20 days of 500 homes", () => {
    expect(SAMPLE_PLAN).toHaveLength(PLAN_DAYS);
    expect(SAMPLE_PLAN.every((p) => p.target === 500)).toBe(true);
    expect(ZONES.reduce((s, z) => s + z.days, 0)).toBe(20);
  });
  it("every zone lists at least one source", () => {
    for (const z of ZONES) expect(z.sources.length).toBeGreaterThan(0);
  });
  it("only counts confirmed home numbers", () => {
    expect(CONFIRMED_HOMES).toBe(8675);
  });
  it("month 2 repeats the same homes", () => {
    expect(planDayFor(21).round).toBe(2);
    expect(planDayFor(21).day).toBe(planDayFor(1).day);
    expect(planDayFor(40).day).toBe(planDayFor(20).day);
  });
  it("hangs today's area and knocks yesterday's", () => {
    const data = withData();
    expect(blocksFor(data, "2026-10-24")).toHaveLength(0); // Saturday
    const day2 = blocksFor(data, "2026-10-20");
    expect(day2.map((b) => b.kind)).toEqual(["hang", "knock"]);
    expect(day2[1].planDay).toBe(planDayFor(1).day);
  });
});

describe("goal calculator", () => {
  it("never invents rates", () => {
    const m = goalMath(withData({ goal: { monthly: 10000, avgJob: 250, guessTalk: null, guessQuote: null, guessClose: null } }));
    expect(m.perMonth.jobs).toBe(40);
    expect(m.perMonth.quotes).toBeNull();
    expect(m.talk.from).toBe("none");
  });
  it("uses the owner's guesses, then their real numbers", () => {
    const g = { monthly: 10000, avgJob: 250, guessTalk: 30, guessQuote: 50, guessClose: 40 };
    const m = goalMath(withData({ goal: g }));
    expect(m.close.from).toBe("guess");
    expect(m.perMonth.quotes).toBe(100);
    const today = ymd(new Date());
    const real = goalMath(withData({ goal: g, numbers: { [today]: nums({ knocked: 100, conversations: 40, quotes: 10, sales: 5 }) } }));
    expect(real.talk.from).toBe("yours");
    expect(real.close.value).toBeCloseTo(0.5);
  });
  it("adds up this month's revenue only", () => {
    const now = new Date(2026, 9, 20);
    const data = withData({ numbers: { "2026-10-05": nums({ revenue: 300 }), "2026-09-30": nums({ revenue: 999 }) } });
    expect(monthRevenue(data, now)).toBe(300);
  });
});

describe("coach and results", () => {
  it("asks for numbers when there are none", () => {
    expect(coachTips(withData(), "2026-10-21")[0].title).toMatch(/Enter your numbers/);
  });
  it("flags knocking far below hangers", () => {
    const data = withData({ numbers: { "2026-10-19": nums({ hangers: 500, knocked: 50 }), "2026-10-20": nums({ hangers: 500 }) } });
    expect(coachTips(data, "2026-10-20").some((t) => /knocked 50 doors/.test(t.title))).toBe(true);
  });
  it("splits quotes and sales between hangers and knocking", () => {
    const data = withData({ numbers: { "2026-10-19": nums({ quotes: 5, quotesHanger: 2, sales: 3, salesHanger: 1 }) } });
    expect(sourceSplit(data, "2026-10-20")).toEqual({ hanger: { quotes: 2, sales: 1 }, knocking: { quotes: 3, sales: 2 } });
  });
  it("counts milestones from numbers", () => {
    const data = withData({ numbers: { "2026-10-19": nums({ hangers: 2500, quotes: 1, revenue: 1200 }) } });
    const reached = milestones(data).filter((m) => m.reached).map((m) => m.id);
    expect(reached).toEqual(["quote", "homes2500", "week1000"]);
  });
});

describe("weather town lookup", () => {
  it("reads a city, a state, or a full address", () => {
    expect(parseHomeBase("Kyle, TX")).toEqual({ city: "Kyle", state: "texas" });
    expect(parseHomeBase("123 Main St, Kyle, TX 78640")).toEqual({ city: "Kyle", state: "texas" });
    expect(parseHomeBase("Phoenix, Arizona")).toEqual({ city: "Phoenix", state: "arizona" });
  });
  it("picks the town in the right state, or none", () => {
    const results = [
      { latitude: 1, longitude: 1, admin1: "South Dakota" },
      { latitude: 2, longitude: 2, admin1: "Texas" },
    ];
    expect(pickPlace("Kyle, TX", results)?.latitude).toBe(2);
    expect(pickPlace("Kyle, OH", results)).toBeNull();
  });
});

describe("links and reminders", () => {
  it("builds a booking link with the business info", () => {
    const data = withData({ business: { name: "Sampson's Window Services", phone: "512-947-3460", offer: "" } });
    const url = new URL(bookingUrl("https://example.com", data));
    expect(url.pathname).toBe("/book");
    expect(url.searchParams.get("p")).toBe("5129473460");
    expect(url.searchParams.get("s")).toBe("Outside windows|Screens");
  });
  it("makes a text link with the message", () => {
    expect(smsLink("(512) 947-3460", "Hi there")).toBe("sms:5129473460?&body=Hi%20there");
  });
  it("calendar reminders repeat on work days", () => {
    const ics = remindersIcs([1, 3, 5], "2026-10-19");
    expect(ics).toContain("RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR");
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(3);
    expect(ics).toContain("DTSTART:20261019T081500");
  });
});
