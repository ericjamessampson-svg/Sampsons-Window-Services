"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CheckMark } from "@/components/Icons";
import { streetsFor } from "@/components/PlanList";
import { dailyChecklist } from "@/lib/checklist";
import { niceDate, workDayInfo, ymd } from "@/lib/dates";
import { roadmapSteps } from "@/lib/roadmap";
import { HOMES_PER_DAY, PLAN_DAYS, planDayFor } from "@/lib/samplePlan";
import { update, useData } from "@/lib/store";

export default function TodayPage() {
  return (
    <AppShell narrow>
      <Today />
    </AppShell>
  );
}

/** Just today's to-do list, in order. Nothing else. */
function Today() {
  const data = useData()!;
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const p = data.profile!;
  const today = ymd(now);
  const info = workDayInfo(p.startDate, p.workDays, now);

  // Before Day 1: today's job is to get ready.
  if (info.dayNumber === 0 && info.nextDayNumber === 1) {
    const steps = roadmapSteps(p).filter((s) => !data.roadmap[s.id]?.done);
    return (
      <div>
        <Header date={today} sub={`Day 1 is ${niceDate(info.nextWorkDate)}`} />
        <div className="card">
          <h2>Today: get ready for Day 1</h2>
          {steps.length === 0 ? (
            <p style={{ margin: 0 }}>You&apos;re ready. Load 5 bundles of hangers the night before Day 1.</p>
          ) : (
            <ol className="today-steps">
              {steps.map((s) => (
                <li key={s.id}>
                  <Link href="/roadmap">{s.title}</Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    );
  }

  // Day off.
  if (info.dayNumber === 0) {
    const next = planDayFor(info.nextDayNumber).day;
    return (
      <div>
        <Header date={today} sub="Day off" />
        <div className="card accent">
          <h2>Rest today.</h2>
          <p style={{ margin: 0 }}>
            Next work day: {niceDate(info.nextWorkDate)}, hanging in {next.zone.name}.
          </p>
        </div>
      </div>
    );
  }

  // Work day.
  const n = info.dayNumber;
  const hang = planDayFor(n).day;
  const knock = n > 1 ? planDayFor(n - 1).day : hang;
  const round = Math.floor((n - 1) / PLAN_DAYS) + 1;
  const sections = dailyChecklist(HOMES_PER_DAY);
  const checks = data.checklists[today] ?? {};
  const total = sections.reduce((s, x) => s + x.items.length, 0);
  const done = sections.reduce((s, x) => s + x.items.filter((i) => checks[`${x.id}.${i.id}`]).length, 0);
  const toggle = (id: string) =>
    update((d) => {
      const day = (d.checklists[today] ??= {});
      day[id] = !day[id];
    });

  const where: Record<string, string> = {
    hanging: `${hang.zone.name}. Start: ${hang.zone.entry}.${streetsFor(data, hang) ? ` Streets: ${streetsFor(data, hang)}.` : ""}`,
    knocking: `${knock.zone.name}, ${n > 1 ? "yesterday's streets" : "this morning's streets"}.${streetsFor(data, knock) ? ` ${streetsFor(data, knock)}.` : ""}`,
  };

  return (
    <div>
      <Header date={today} sub={`Day ${((n - 1) % PLAN_DAYS) + 1} of ${PLAN_DAYS}${round > 1 ? ` · Round ${round}` : ""}`} />
      <div className="row between" style={{ margin: "0 0 6px" }}>
        <span className="muted small">
          {done} of {total} done
        </span>
      </div>
      <div className="bar" style={{ marginBottom: 14 }}>
        <div style={{ width: `${(done / total) * 100}%` }} />
      </div>

      {sections.map((s) => (
        <div className="card today-block" key={s.id}>
          <div className="kicker">{s.time}</div>
          <h2 style={{ marginBottom: where[s.id] ? 2 : 6 }}>{s.title}</h2>
          {where[s.id] && <p className="small today-where">{where[s.id]}</p>}
          {s.items.map((i) => {
            const id = `${s.id}.${i.id}`;
            return (
              <button key={id} className="check" role="checkbox" aria-checked={!!checks[id]} onClick={() => toggle(id)}>
                <span className="box">{checks[id] && <CheckMark />}</span>
                <span className="label">{i.text}</span>
              </button>
            );
          })}
        </div>
      ))}
      {done === total && <div className="card accent">Day done. Nice work. This list resets tomorrow morning.</div>}
    </div>
  );
}

function Header({ date, sub }: { date: string; sub: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="kicker">{sub}</div>
      <h1 style={{ marginBottom: 0 }}>Today · {niceDate(date)}</h1>
    </div>
  );
}
