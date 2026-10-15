"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CheckMark } from "@/components/Icons";
import { EMPTY_NUMBERS, NumbersForm, totals } from "@/components/NumbersForm";
import { PlanList, streetsFor } from "@/components/PlanList";
import { RainAlert } from "@/components/RainAlert";
import { SkipGuideButton } from "@/components/SkipGuide";
import { coachTips, sourceSplit } from "@/lib/coach";
import { monthElapsed, monthRevenue } from "@/lib/goal";
import { dailyChecklist, type CheckItem, type CheckSection } from "@/lib/checklist";
import { addDays, niceDate, weekStart, workDayInfo, ymd } from "@/lib/dates";
import { homesReached, milestones } from "@/lib/milestones";
import { roadmapSteps } from "@/lib/roadmap";
import { GOAL_HOMES, HOMES_PER_DAY, PLAN_DAYS, planDayFor, type PlanDay } from "@/lib/samplePlan";
import { blocksFor, niceTime } from "@/lib/schedule";
import { update, useData } from "@/lib/store";
import type { AppData } from "@/lib/types";

export default function HomePage() {
  return (
    <AppShell>
      <Home />
    </AppShell>
  );
}

/** Re-renders every minute so "do this now" and the date stay current. */
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  return now;
}

function greeting(h: number) {
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Home() {
  const data = useData()!;
  const now = useNow();
  const profile = data.profile!;
  const today = ymd(now);
  const info = workDayInfo(profile.startDate, profile.workDays, now);
  const started = info.dayNumber > 0;
  const showDay = started ? info.dayNumber : info.nextDayNumber;
  const { round, day: hang } = planDayFor(Math.max(1, showDay));
  const knock = showDay > 1 ? planDayFor(showDay - 1).day : null;
  const sections = dailyChecklist(HOMES_PER_DAY);
  const checks = data.checklists[today] ?? {};
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const dayLabel = started
    ? `Day ${((showDay - 1) % PLAN_DAYS) + 1} of ${PLAN_DAYS}${round > 1 ? ` · Round ${round}` : ""}`
    : showDay === 1
      ? `Day 1 is ${niceDate(info.nextWorkDate)}`
      : `Day off · next work day ${niceDate(info.nextWorkDate)}`;

  const header = (
    <div style={{ marginBottom: 14 }}>
      <div className="kicker">
        {niceDate(today)} · {dayLabel}
      </div>
      <h1 style={{ marginBottom: 0 }}>
        {greeting(now.getHours())}
        {data.business.name ? `, ${data.business.name}` : ""}
      </h1>
    </div>
  );

  const next = (
    <NextAction data={data} started={started} showDay={showDay} nextWorkDate={info.nextWorkDate} sections={sections} checks={checks} today={today} nowMin={nowMin} />
  );

  const glance = <Glance data={data} today={today} hang={hang} knock={knock} upcoming={!started} />;

  const week = <WeekCard data={data} today={today} />;
  const progress = <Progress data={data} />;
  const goal = <MonthGoal data={data} />;
  const coach = <Coach data={data} today={today} />;
  // Rain check: today's work if it's still morning, otherwise the next work day.
  const rainDay =
    info.isWorkDay && now.getHours() < 12
      ? today
      : workDayInfo(profile.startDate, profile.workDays, addDays(now, 1)).nextWorkDate;

  return (
    <>
      <div className="cols three">
        <div>
          {header}
          {next}
          <RainAlert homeBase={profile.homeBase} nextWorkDate={rainDay} />
          {glance}
          <div className="only-phone">
            {goal}
            {coach}
            {week}
            {progress}
          </div>
          {started && <Checklist sections={sections} checks={checks} date={today} />}
          <div className="card only-phone">
            <h2>Today&apos;s numbers</h2>
            <NumbersForm data={data} date={today} />
          </div>
          <SkipGuideButton />
        </div>
        <div className="only-desktop">
          {goal}
          {coach}
          {week}
          {progress}
          <div className="card">
            <div className="row between">
              <h2 style={{ margin: 0 }}>Today&apos;s numbers</h2>
              <Link href="/numbers" className="small">
                All days
              </Link>
            </div>
            <NumbersForm data={data} date={today} />
          </div>
        </div>
        <div className="only-wide">
          <div className="card">
            <div className="row between">
              <h2 style={{ margin: 0 }}>20-day route</h2>
              <Link href="/plan" className="small">
                Edit plan
              </Link>
            </div>
            <PlanList data={data} todayDay={hang.day} />
          </div>
        </div>
      </div>
    </>
  );
}

function NextAction({
  data,
  started,
  showDay,
  nextWorkDate,
  sections,
  checks,
  today,
  nowMin,
}: {
  data: AppData;
  started: boolean;
  showDay: number;
  nextWorkDate: string;
  sections: CheckSection[];
  checks: Record<string, boolean>;
  today: string;
  nowMin: number;
}) {
  // 1. Before Day 1: work through the roadmap.
  if (!started && showDay === 1) {
    const steps = roadmapSteps(data.profile);
    const i = steps.findIndex((s) => !data.roadmap[s.id]?.done);
    return (
      <div className="card next-card">
        <div className="kicker">Do this now</div>
        {i >= 0 ? (
          <>
            <h2>
              Step {i + 1}: {steps[i].title}
            </h2>
            <p className="small">Day 1 is {niceDate(nextWorkDate)}. Finish your roadmap before then.</p>
            <Link className="btn primary block big" href="/roadmap">
              Open step {i + 1}
            </Link>
          </>
        ) : (
          <>
            <h2>You&apos;re ready. Day 1 is {niceDate(nextWorkDate)}.</h2>
            <Link className="btn primary block big" href="/plan">
              Look over your route
            </Link>
          </>
        )}
      </div>
    );
  }

  // 2. Day off.
  if (!started) {
    return (
      <div className="card next-card calm">
        <div className="kicker">Do this now</div>
        <h2>
          Rest up. Next is Day {((showDay - 1) % PLAN_DAYS) + 1}
          {showDay > PLAN_DAYS ? ` of round ${Math.floor((showDay - 1) / PLAN_DAYS) + 1}` : ""} on {niceDate(nextWorkDate)}.
        </h2>
        <p className="small" style={{ margin: 0 }}>
          Good time to text back quotes and load hangers for next time.
        </p>
      </div>
    );
  }

  // 3. Work day: the next checklist item for this time of day.
  const key = (s: CheckSection, i: CheckItem) => `${s.id}.${i.id}`;
  const open = sections.flatMap((s) => s.items.filter((i) => !checks[key(s, i)]).map((i) => ({ s, i })));
  if (open.length === 0) {
    return (
      <div className="card next-card calm">
        <div className="kicker">Do this now</div>
        <h2>Day done. Nice work.</h2>
        <p className="small" style={{ margin: 0 }}>
          The checklist resets tomorrow morning.
        </p>
      </div>
    );
  }
  const hour = Math.floor(nowMin / 60);
  const timely = [...open].reverse().find(({ s }) => s.startsAt <= hour);
  const pick = open.find(({ s }) => s.id === (timely ?? open[0]).s.id) ?? open[0];
  return (
    <div className="card next-card">
      <div className="kicker">
        Do this now · {pick.s.title} · {pick.s.time}
      </div>
      <h2>{pick.i.text}</h2>
      <button className="btn primary block big" onClick={() => toggle(today, key(pick.s, pick.i))}>
        Done
      </button>
    </div>
  );
}

function toggle(date: string, id: string) {
  update((d) => {
    const day = (d.checklists[date] ??= {});
    day[id] = !day[id];
  });
}

function Glance({ data, today, hang, knock, upcoming }: { data: AppData; today: string; hang: PlanDay; knock: PlanDay | null; upcoming: boolean }) {
  const done = data.numbers[today]?.hangers ?? 0;
  const pct = Math.min(100, (done / hang.target) * 100);
  const hangStreets = streetsFor(data, hang);
  const blocks = blocksFor(data, today);
  const hb = blocks.find((b) => b.kind === "hang");
  const kb = blocks.find((b) => b.kind === "knock");
  const addHangers = (n: number) =>
    update((d) => {
      const cur = d.numbers[today] ?? { ...EMPTY_NUMBERS };
      d.numbers[today] = { ...EMPTY_NUMBERS, ...cur, hangers: Math.max(0, (cur.hangers ?? 0) + n) };
    });

  return (
    <div className="card">
      <div className="kicker">{upcoming ? "Next hanging route" : `Hang · ${hb ? `${niceTime(hb.start)} to ${niceTime(hb.end)}` : ""}`}</div>
      <h2 style={{ marginBottom: 2 }}>{hang.zone.name}</h2>
      <div className="muted small">
        {hang.zone.area}
        {hang.ofParts > 1 && ` · part ${hang.part} of ${hang.ofParts}`} · start: {hang.zone.entry}
      </div>
      {hangStreets && <p className="small" style={{ margin: "6px 0 0" }}>Streets: {hangStreets}</p>}
      {!upcoming && (
        <>
          <div className="row between" style={{ margin: "12px 0 6px", alignItems: "end" }}>
            <span>
              <span className="big-num">{done}</span> <span className="muted">/ {hang.target} hangers</span>
            </span>
            <span className="row" style={{ gap: 6 }}>
              <button className="btn" style={{ minHeight: 44, padding: "0 12px" }} onClick={() => addHangers(-100)} aria-label="Remove 100 hangers">
                −100
              </button>
              <button className="btn primary" style={{ minHeight: 44, padding: "0 12px" }} onClick={() => addHangers(100)}>
                +100
              </button>
            </span>
          </div>
          <div className="bar" role="progressbar" aria-label="Hangers today" aria-valuenow={done} aria-valuemin={0} aria-valuemax={hang.target}>
            <div style={{ width: `${pct}%` }} />
          </div>
        </>
      )}
      <hr className="sep" />
      <div className="kicker">
        {upcoming ? "Next knocking" : "Knock tonight"}
        {kb ? ` · ${niceTime(kb.start)} to ${niceTime(kb.end)}` : " · 4 to 7pm"}
      </div>
      {knock ? (
        <>
          <strong>{knock.zone.name}</strong>
          <div className="small">{streetsFor(data, knock) || `Yesterday's streets (Day ${knock.day})`}</div>
        </>
      ) : (
        <p className="small" style={{ margin: 0 }}>
          Day 1: knock the streets you hung this morning.
        </p>
      )}
      {!upcoming && (
        <Link className="btn block" href="/knock" style={{ marginTop: 12 }}>
          Open knock counter
        </Link>
      )}
      {!data.profile!.useSamplePlan && <p className="muted small" style={{ margin: "8px 0 0" }}>Sample route from Kyle, TX. Your own area comes in the next version.</p>}
    </div>
  );
}

function WeekCard({ data, today }: { data: AppData; today: string }) {
  const wk = weekStart(today);
  const t = totals(data, (d) => weekStart(d) === wk);
  const revenue = t.revenue;
  const tiles: [string, string][] = [
    ["Hangers", t.hangers.toLocaleString()],
    ["Doors knocked", t.knocked.toLocaleString()],
    ["Talks", t.conversations.toLocaleString()],
    ["Quotes", t.quotes.toLocaleString()],
    ["Sales", t.sales.toLocaleString()],
    ["Revenue", `$${revenue.toLocaleString()}`],
  ];
  return (
    <div className="card">
      <div className="row between">
        <h2 style={{ margin: 0 }}>This week</h2>
        <Link href="/numbers" className="small">
          All numbers
        </Link>
      </div>
      <div className="tiles">
        {tiles.map(([k, v]) => (
          <div key={k} className="tile">
            <span className="muted small">{k}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      <SourceSplit data={data} today={today} />
    </div>
  );
}

function SourceSplit({ data, today }: { data: AppData; today: string }) {
  const s = sourceSplit(data, today);
  const any = s.hanger.quotes + s.knocking.quotes + s.hanger.sales + s.knocking.sales > 0;
  return (
    <div style={{ marginTop: 12 }}>
      <div className="kicker">What worked this week</div>
      {any ? (
        <table className="simple">
          <thead>
            <tr>
              <th />
              <th>Quotes</th>
              <th>Sales</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>From hangers (calls and texts)</td>
              <td>{s.hanger.quotes}</td>
              <td>{s.hanger.sales}</td>
            </tr>
            <tr>
              <td>From knocking</td>
              <td>{s.knocking.quotes}</td>
              <td>{s.knocking.sales}</td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p className="muted small" style={{ margin: 0 }}>
          Log quotes and sales to see whether hangers or knocking brought them in.
        </p>
      )}
    </div>
  );
}

function MonthGoal({ data }: { data: AppData }) {
  const sold = monthRevenue(data);
  const goal = data.goal.monthly || 10000;
  const pct = Math.min(100, (sold / goal) * 100);
  const onPace = sold / goal >= monthElapsed();
  return (
    <Link href="/goal" className="card goal-card">
      <div className="row between" style={{ alignItems: "end" }}>
        <div>
          <div className="kicker">This month</div>
          <div className="big-num">${sold.toLocaleString()}</div>
        </div>
        <span className="muted">of ${goal.toLocaleString()} goal</span>
      </div>
      <div className="bar" style={{ marginTop: 10 }}>
        <div style={{ width: `${pct}%` }} />
      </div>
      <p className="muted small" style={{ margin: "6px 0 0" }}>
        {onPace ? "On pace." : "Behind pace."} Tap to see the doors you need per day.
      </p>
    </Link>
  );
}

function Coach({ data, today }: { data: AppData; today: string }) {
  const tips = coachTips(data, today);
  return (
    <div className="card coach">
      <div className="kicker">Coach · from your numbers</div>
      {tips.map((t) => (
        <div key={t.title} style={{ marginTop: 6 }}>
          <strong>{t.title}</strong>
          <p className="small" style={{ margin: "2px 0 0" }}>
            {t.body}
          </p>
        </div>
      ))}
    </div>
  );
}

function Progress({ data }: { data: AppData }) {
  const reached = homesReached(data);
  const pct = Math.min(100, (reached / GOAL_HOMES) * 100);
  const list = milestones(data);
  const next = list.find((m) => !m.reached);
  const got = list.filter((m) => m.reached).length;
  return (
    <div className="card">
      <div className="row between" style={{ alignItems: "end" }}>
        <div>
          <div className="kicker">Homes reached</div>
          <div className="big-num">{reached.toLocaleString()}</div>
        </div>
        <span className="muted">of {GOAL_HOMES.toLocaleString()}</span>
      </div>
      <div className="bar" style={{ marginTop: 10 }} role="progressbar" aria-label="Homes reached" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ width: `${pct}%` }} />
      </div>
      <hr className="sep" />
      <div className="row between">
        <div className="kicker" style={{ margin: 0 }}>
          Next milestone
        </div>
        <span className="count-pill">
          {got} of {list.length}
        </span>
      </div>
      {next ? (
        <>
          <h3 style={{ margin: "6px 0 2px" }}>{next.title}</h3>
          <p className="muted small" style={{ margin: 0 }}>
            {next.hint}
          </p>
          {next.manual && (
            <button
              className="btn"
              style={{ marginTop: 10 }}
              onClick={() => update((d) => void ((d.milestonesDone ??= {})[next.id] = ymd(new Date())))}
            >
              I reached this
            </button>
          )}
        </>
      ) : (
        <h3 style={{ margin: "6px 0 0" }}>All milestones reached.</h3>
      )}
      <div className="chips" style={{ marginTop: 10, gap: 6 }}>
        {list
          .filter((m) => m.reached)
          .map((m) => (
            <span key={m.id} className="status done">
              ✓ {m.title}
            </span>
          ))}
      </div>
    </div>
  );
}

function Checklist({ sections, checks, date }: { sections: CheckSection[]; checks: Record<string, boolean>; date: string }) {
  return (
    <div className="card">
      <h2>Today&apos;s checklist</h2>
      <p className="muted small">Resets every morning.</p>
      {sections.map((s) => {
        const done = s.items.filter((i) => checks[`${s.id}.${i.id}`]).length;
        const all = done === s.items.length;
        return (
          <details key={s.id} className="section" open={!all}>
            <summary>
              <span>
                <strong>{s.title}</strong>
                <br />
                <span className="muted small">{s.time}</span>
              </span>
              <span className={`count-pill${all ? " done" : ""}`}>
                {done}/{s.items.length}
              </span>
            </summary>
            {s.items.map((i) => {
              const id = `${s.id}.${i.id}`;
              return (
                <button key={id} className="check" role="checkbox" aria-checked={!!checks[id]} onClick={() => toggle(date, id)}>
                  <span className="box">{checks[id] && <CheckMark />}</span>
                  <span className="label">{i.text}</span>
                </button>
              );
            })}
          </details>
        );
      })}
    </div>
  );
}
