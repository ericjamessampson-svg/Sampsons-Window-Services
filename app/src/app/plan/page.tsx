"use client";

import { AppShell } from "@/components/AppShell";
import { PlanList } from "@/components/PlanList";
import { CONFIRMED_HOMES, GOAL_HOMES, HOMES_PER_DAY, PLAN_DAYS, ZONES, planDayFor } from "@/lib/samplePlan";
import { niceDate, workDayInfo } from "@/lib/dates";
import { useData } from "@/lib/store";

export default function PlanPage() {
  return (
    <AppShell>
      <Plan />
    </AppShell>
  );
}

function Plan() {
  const data = useData()!;
  const profile = data.profile!;
  const info = workDayInfo(profile.startDate, profile.workDays);
  const current = planDayFor(Math.max(1, info.dayNumber || info.nextDayNumber)).day.day;
  const done = Object.values(data.planEdits).filter((e) => e.status === "done").length;

  return (
    <div className="cols">
      <div>
        <h1>Your 10K Homes plan</h1>
        <p className="muted">
          {PLAN_DAYS} work days × {HOMES_PER_DAY} homes = {GOAL_HOMES.toLocaleString()} homes. Day 1: {niceDate(profile.startDate)}.
        </p>
        {!profile.useSamplePlan && (
          <div className="card gold small">This is a sample route from Kyle, TX. A route built for your area comes in the next version.</div>
        )}
        <div className="card accent">
          <h3>How each day works</h3>
          <ul className="tight">
            <li>
              <strong>8:30am to 1:30pm:</strong> hang 500 door hangers (2:30 at the latest)
            </li>
            <li>
              <strong>Midday:</strong> call back, give quotes, do jobs
            </li>
            <li>
              <strong>4 to 7pm:</strong> knock on yesterday&apos;s streets
            </li>
            <li>
              <strong>Month 2:</strong> repeat the same 20 days on the same homes. Repetition is what makes hangers work.
            </li>
          </ul>
          <p className="small" style={{ margin: 0 }}>
            Drive to each area and use the scooter on the streets. Each day stays in one area, so it&apos;s one trip.
          </p>
        </div>
        <div className="card">
          <div className="row between">
            <h2 style={{ margin: 0 }}>Day by day</h2>
            <span className="count-pill">
              {done} of {PLAN_DAYS} done
            </span>
          </div>
          <p className="muted small">Type in the streets for each day. Mark days done or skipped.</p>
          <PlanList data={data} todayDay={current} editable />
        </div>
      </div>

      <div className="col-side">
        <div className="card gold">
          <h3>About these numbers</h3>
          <p className="small">
            Public sources confirm about <strong>{CONFIRMED_HOMES.toLocaleString()}</strong> homes in these zones (using the
            low end where sources disagree). Belterra and the large-lot side of 6 Creeks don&apos;t have a confirmed count.
          </p>
          <p className="small" style={{ margin: 0 }}>
            So 10,000 is the <strong>goal</strong>, not a promise. If a zone runs out of good homes, move to the next zone
            early. All counts are estimates from the sources below, checked October 2026.
          </p>
        </div>
        {ZONES.map((z) => (
          <div className="card" key={z.id}>
            <div className="row between">
              <h3 style={{ margin: 0 }}>{z.name}</h3>
              <span className="count-pill">
                {z.days} day{z.days > 1 ? "s" : ""}
              </span>
            </div>
            <div className="muted small" style={{ marginBottom: 8 }}>
              {z.area}
            </div>
            <p className="small">
              <strong>Homes (estimate):</strong> {z.homeCount}
            </p>
            <p className="small">
              <strong>Start:</strong> {z.entry}
            </p>
            {z.knownStreets.length > 0 && (
              <p className="small">
                <strong>Streets seen in listings:</strong> {z.knownStreets.join(", ")}
              </p>
            )}
            <p className="small">{z.notes}</p>
            <div className="small muted">Sources:</div>
            <ul className="source-list">
              {z.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
