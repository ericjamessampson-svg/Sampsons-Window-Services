"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CheckMark } from "@/components/Icons";
import { useJobEditor } from "@/components/JobEditor";
import { EMPTY_NUMBERS, NumbersForm, totals } from "@/components/NumbersForm";
import { PlanList, streetsFor } from "@/components/PlanList";
import { SkipGuideButton } from "@/components/SkipGuide";
import { dailyChecklist, type CheckItem, type CheckSection } from "@/lib/checklist";
import { niceDate, weekStart, workDayInfo, ymd } from "@/lib/dates";
import { homesReached, milestones, revenueByWeek } from "@/lib/milestones";
import { roadmapSteps } from "@/lib/roadmap";
import { GOAL_HOMES, HOMES_PER_DAY, PLAN_DAYS, planDayFor, type PlanDay } from "@/lib/samplePlan";
import { blocksFor, jobEnd, jobsOn, niceTime, toMin } from "@/lib/schedule";
import { update, useData } from "@/lib/store";
import type { AppData, Job } from "@/lib/types";

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

const directions = (address: string) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;

function greeting(h: number) {
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function Home() {
  const data = useData()!;
  const now = useNow();
  const editor = useJobEditor();
  const profile = data.profile!;
  const today = ymd(now);
  const info = workDayInfo(profile.startDate, profile.workDays, now);
  const started = info.dayNumber > 0;
  const showDay = started ? info.dayNumber : info.nextDayNumber;
  const { round, day: hang } = planDayFor(Math.max(1, showDay));
  const knock = showDay > 1 ? planDayFor(showDay - 1).day : null;
  const sections = dailyChecklist(HOMES_PER_DAY);
  const checks = data.checklists[today] ?? {};
  const jobs = jobsOn(data, today);
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
    <NextAction data={data} started={started} showDay={showDay} nextWorkDate={info.nextWorkDate} sections={sections} checks={checks} today={today} nowMin={nowMin} jobs={jobs} />
  );

  const glance = <Glance data={data} today={today} hang={hang} knock={knock} upcoming={!started} />;

  const jobsCard = (
    <div className="card">
      <div className="row between">
        <h2 style={{ margin: 0 }}>Today&apos;s jobs and quotes</h2>
        <Link href={`/schedule?date=${today}`} className="small">
          Schedule
        </Link>
      </div>
      {jobs.length === 0 ? (
        <p className="muted" style={{ margin: "10px 0" }}>
          Nothing booked today yet.
        </p>
      ) : (
        <div style={{ marginTop: 8 }}>
          {jobs.map((j) => (
            <button key={j.id} className="job-row" onClick={() => editor.open(j)}>
              <span className={`job-time ${j.kind}`}>
                {niceTime(j.start)}
                <small>{niceTime(jobEnd(j))}</small>
              </span>
              <span style={{ minWidth: 0 }}>
                <strong>{j.customer || "No name"}</strong>
                {j.status === "done" && <span className="status done" style={{ marginLeft: 6 }}>Done</span>}
                <br />
                <span className="muted small">
                  {j.kind === "quote" ? "Quote" : j.service}
                  {j.address && ` · ${j.address}`}
                </span>
              </span>
              <span style={{ fontWeight: 700 }}>{j.price != null ? `$${j.price}` : ""}</span>
            </button>
          ))}
        </div>
      )}
      <button className="btn block" onClick={() => editor.open({ date: today, start: nextFreeStart(data, today, nowMin) })}>
        + Add a job or quote
      </button>
    </div>
  );

  const week = <WeekCard data={data} today={today} />;
  const progress = <Progress data={data} />;

  return (
    <>
      <div className="cols three">
        <div>
          {header}
          {next}
          {glance}
          {jobsCard}
          <div className="only-phone">
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
      {editor.element}
    </>
  );
}

/** First 30-minute slot from now that's not inside a plan block or job. */
function nextFreeStart(data: AppData, date: string, nowMin: number): string {
  const busy = [
    ...blocksFor(data, date).map((b) => [toMin(b.start), toMin(b.end)]),
    ...jobsOn(data, date).map((j) => [toMin(j.start), toMin(j.start) + j.minutes]),
  ];
  let m = Math.max(8 * 60, Math.ceil(nowMin / 30) * 30);
  while (m < 20 * 60 && busy.some(([s, e]) => m < e && m + 60 > s)) m += 30;
  if (m >= 20 * 60) m = 14 * 60;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
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
  jobs,
}: {
  data: AppData;
  started: boolean;
  showDay: number;
  nextWorkDate: string;
  sections: CheckSection[];
  checks: Record<string, boolean>;
  today: string;
  nowMin: number;
  jobs: Job[];
}) {
  // 1. A job happening now or starting within the hour comes first.
  const soon = jobs.find((j) => j.status === "booked" && toMin(j.start) - 60 <= nowMin && nowMin < toMin(j.start) + j.minutes);
  if (soon) {
    const inProgress = nowMin >= toMin(soon.start);
    return (
      <div className="card next-card">
        <div className="kicker">
          Do this now · {soon.kind === "quote" ? "Quote" : "Job"} at {niceTime(soon.start)}
        </div>
        <h2>
          {inProgress ? "Finish" : "Head to"} {soon.customer || "your next job"}
        </h2>
        {soon.address && <p className="small">{soon.address}</p>}
        {inProgress ? (
          <button className="btn primary block big" onClick={() => update((d) => void (d.jobs.find((j) => j.id === soon.id)!.status = "done"))}>
            Mark done
          </button>
        ) : soon.address ? (
          <a className="btn primary block big" href={directions(soon.address)} target="_blank" rel="noreferrer">
            Get directions
          </a>
        ) : (
          <Link className="btn primary block big" href={`/schedule?date=${today}`}>
            Open schedule
          </Link>
        )}
      </div>
    );
  }

  // 2. Before Day 1: work through the roadmap.
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

  // 3. Day off.
  if (!started) {
    return (
      <div className="card next-card calm">
        <div className="kicker">Do this now</div>
        <h2>Rest up. Next is Day {((showDay - 1) % PLAN_DAYS) + 1} on {niceDate(nextWorkDate)}.</h2>
        <Link className="btn primary block big" href="/schedule">
          Text back quotes and book jobs
        </Link>
      </div>
    );
  }

  // 4. Work day: the next checklist item for this time of day.
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
      <div className="kicker">Knock tonight{kb ? ` · ${niceTime(kb.start)} to ${niceTime(kb.end)}` : " · 4 to 7pm"}</div>
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
      {!data.profile!.useSamplePlan && <p className="muted small" style={{ margin: "8px 0 0" }}>Sample route from Kyle, TX. Your own area comes in the next version.</p>}
    </div>
  );
}

function WeekCard({ data, today }: { data: AppData; today: string }) {
  const wk = weekStart(today);
  const t = totals(data, (d) => weekStart(d) === wk);
  const revenue = revenueByWeek(data)[wk] ?? 0;
  const tiles: [string, string][] = [
    ["Hangers", t.hangers.toLocaleString()],
    ["Doors knocked", t.knocked.toLocaleString()],
    ["Conversations", t.conversations.toLocaleString()],
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
      <p className="muted small" style={{ margin: "8px 0 0" }}>
        Revenue counts booked jobs on your schedule this week.
      </p>
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
