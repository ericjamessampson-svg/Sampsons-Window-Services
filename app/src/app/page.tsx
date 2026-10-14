"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CheckMark } from "@/components/Icons";
import { NumbersForm, totals } from "@/components/NumbersForm";
import { PlanList, streetsFor } from "@/components/PlanList";
import { SkipGuideButton } from "@/components/SkipGuide";
import { dailyChecklist, type CheckItem, type CheckSection } from "@/lib/checklist";
import { niceDate, weekStart, workDayInfo, ymd } from "@/lib/dates";
import { roadmapSteps } from "@/lib/roadmap";
import { GOAL_HOMES, HOMES_PER_DAY, PLAN_DAYS, planDayFor, type PlanDay } from "@/lib/samplePlan";
import { update, useData } from "@/lib/store";
import type { AppData } from "@/lib/types";

export default function TodayPage() {
  return (
    <AppShell>
      <Today />
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

function Today() {
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
  const reached = totals(data).hangers;

  const steps = roadmapSteps(profile);
  const nextStepIdx = steps.findIndex((s) => !data.roadmap[s.id]?.done);

  const header = (
    <div style={{ marginBottom: 12 }}>
      <div className="kicker">{niceDate(today)}</div>
      <h1 style={{ marginBottom: 0 }}>
        {started ? `Day ${(showDay - 1) % PLAN_DAYS + 1} of ${PLAN_DAYS}` : info.isWorkDay || showDay > 1 ? "Day off" : "Getting ready"}
        {started && round > 1 && <span className="muted"> · Round {round}</span>}
      </h1>
    </div>
  );

  let nowCard: React.ReactNode;
  if (!started && showDay === 1) {
    nowCard = (
      <div className="card gold">
        <div className="kicker">Do this now</div>
        {nextStepIdx >= 0 ? (
          <>
            <h2>
              Step {nextStepIdx + 1}: {steps[nextStepIdx].title}
            </h2>
            <p className="small">Day 1 is {niceDate(info.nextWorkDate)}. Finish your roadmap before then.</p>
            <Link className="btn primary block big" href="/roadmap">
              Open step {nextStepIdx + 1}
            </Link>
          </>
        ) : (
          <>
            <h2>You&apos;re ready. Day 1 is {niceDate(info.nextWorkDate)}.</h2>
            <p className="small" style={{ margin: 0 }}>
              Load {HOMES_PER_DAY / 100} bundles of hangers the night before.
            </p>
          </>
        )}
      </div>
    );
  } else if (!started) {
    nowCard = (
      <div className="card accent">
        <div className="kicker">Do this now</div>
        <h2>Rest up. Next is Day {(showDay - 1) % PLAN_DAYS + 1} on {niceDate(info.nextWorkDate)}.</h2>
        <p className="small" style={{ margin: 0 }}>
          Good time to text back quotes and load hangers for next time.
        </p>
      </div>
    );
  } else {
    nowCard = <NextItem sections={sections} checks={checks} date={today} hour={now.getHours()} />;
  }

  const todayCol = (
    <div>
      {header}
      {nowCard}
      <RouteCard data={data} hang={hang} knock={knock} upcoming={!started} />
      {!profile.useSamplePlan && (
        <div className="card gold small">This is a sample route from Kyle, TX. A route built for your area comes in the next version.</div>
      )}
      {started && <Checklist sections={sections} checks={checks} date={today} />}
      <div className="card">
        <div className="row between">
          <h2 style={{ margin: 0 }}>Today&apos;s numbers</h2>
          <Link href="/numbers" className="small">
            All days
          </Link>
        </div>
        <NumbersForm data={data} date={today} />
      </div>
      <Progress reached={reached} />
      <SkipGuideButton />
    </div>
  );

  return (
    <div className="cols three">
      {todayCol}
      <div className="col-side only-desktop">
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
      <div className="only-wide">
        <WeekCard data={data} today={today} />
      </div>
    </div>
  );
}

function NextItem({ sections, checks, date, hour }: { sections: CheckSection[]; checks: Record<string, boolean>; date: string; hour: number }) {
  // Prefer the section that matches the time of day; otherwise the first unchecked item.
  const key = (s: CheckSection, i: CheckItem) => `${s.id}.${i.id}`;
  const open = sections.flatMap((s) => s.items.filter((i) => !checks[key(s, i)]).map((i) => ({ s, i })));
  if (open.length === 0) {
    return (
      <div className="card accent">
        <div className="kicker">Do this now</div>
        <h2>Day done. Nice work.</h2>
        <p className="small" style={{ margin: 0 }}>
          Rest up. The checklist resets tomorrow morning.
        </p>
      </div>
    );
  }
  const timely = [...open].reverse().find(({ s }) => s.startsAt <= hour);
  const sectionNow = timely ? timely.s : open[0].s;
  const pick = open.find(({ s }) => s.id === sectionNow.id) ?? open[0];
  return (
    <div className="card gold">
      <div className="kicker">
        Do this now · {pick.s.title} · {pick.s.time}
      </div>
      <h2>{pick.i.text}</h2>
      <button className="btn primary block big" onClick={() => toggle(date, key(pick.s, pick.i))}>
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

function RouteCard({ data, hang, knock, upcoming }: { data: AppData; hang: PlanDay; knock: PlanDay | null; upcoming: boolean }) {
  const hangStreets = streetsFor(data, hang);
  return (
    <div className="card">
      <div className="kicker">{upcoming ? "Next hanging route" : "Hang here · 8:30am to 1:30pm"}</div>
      <h2 style={{ marginBottom: 2 }}>{hang.zone.name}</h2>
      <div className="muted small" style={{ marginBottom: 8 }}>
        {hang.zone.area}
        {hang.ofParts > 1 && ` · part ${hang.part} of ${hang.ofParts}`} · {hang.target} homes
      </div>
      <p className="small" style={{ marginBottom: 4 }}>
        <strong>Start:</strong> {hang.zone.entry}
      </p>
      <p className="small" style={{ marginBottom: 0 }}>
        <strong>Streets:</strong>{" "}
        {hangStreets ||
          (hang.zone.knownStreets.length ? `${hang.zone.knownStreets.join(", ")} (from public listings; check on a map)` : "Not set yet.")}{" "}
        <Link href="/plan">{hangStreets ? "Edit" : "Add streets"}</Link>
      </p>
      <hr style={{ border: 0, borderTop: "1px solid var(--line)", margin: "14px 0" }} />
      <div className="kicker">Knock here · 4:00 to 7:00pm</div>
      {knock ? (
        <>
          <h3 style={{ marginBottom: 2 }}>Yesterday&apos;s streets: {knock.zone.name}</h3>
          <div className="small">{streetsFor(data, knock) || `Day ${knock.day} route`}</div>
        </>
      ) : (
        <p className="small" style={{ margin: 0 }}>
          Day 1: knock the streets you hung this morning.
        </p>
      )}
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

function Progress({ reached }: { reached: number }) {
  const pct = Math.min(100, (reached / GOAL_HOMES) * 100);
  return (
    <div className="card">
      <div className="row between" style={{ alignItems: "end" }}>
        <div>
          <div className="kicker">Homes reached</div>
          <div className="big-num">{reached.toLocaleString()}</div>
        </div>
        <span className="muted">of {GOAL_HOMES.toLocaleString()}</span>
      </div>
      <div className="bar" style={{ marginTop: 10 }} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
        <div style={{ width: `${pct}%` }} />
      </div>
      <p className="muted small" style={{ margin: "6px 0 0" }}>
        Counted from the hangers you enter each day.
      </p>
    </div>
  );
}

function WeekCard({ data, today }: { data: AppData; today: string }) {
  const wk = weekStart(today);
  const t = totals(data, (d) => weekStart(d) === wk);
  const rows: [string, number][] = [
    ["Hangers", t.hangers],
    ["Doors knocked", t.knocked],
    ["Conversations", t.conversations],
    ["Quotes", t.quotes],
    ["Sales", t.sales],
  ];
  return (
    <div className="card">
      <h2>This week</h2>
      <table className="simple">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}>
              <td>{k}</td>
              <td>
                <strong>{v.toLocaleString()}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small" style={{ margin: "8px 0 0" }}>
        Full weekly results come in Phase 3.
      </p>
    </div>
  );
}
