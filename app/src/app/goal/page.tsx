"use client";

import { AppShell } from "@/components/AppShell";
import { goalMath, monthElapsed, monthRevenue, type Rate } from "@/lib/goal";
import { update, useData } from "@/lib/store";
import type { Goal } from "@/lib/types";

export default function GoalPage() {
  return (
    <AppShell narrow>
      <GoalCalc />
    </AppShell>
  );
}

const num = (v: string) => (v.trim() === "" ? null : Math.max(0, Number(v)));
const fmt = (n: number | null, digits = 0) => (n == null ? "—" : n.toLocaleString(undefined, { maximumFractionDigits: digits }));

function GoalCalc() {
  const data = useData()!;
  const g = data.goal;
  const m = goalMath(data);
  const setG = (patch: Partial<Goal>) => update((d) => void (d.goal = { ...d.goal, ...patch }));
  const sold = monthRevenue(data);
  const pct = Math.min(100, (sold / Math.max(1, g.monthly)) * 100);
  const pace = monthElapsed();

  return (
    <div>
      <h1>Monthly goal</h1>
      <p className="muted">Work backward from the money you want to the doors you need to knock.</p>

      <div className="card">
        <div className="row between" style={{ alignItems: "end" }}>
          <div>
            <div className="kicker">This month so far</div>
            <div className="big-num">${sold.toLocaleString()}</div>
          </div>
          <span className="muted">of ${g.monthly.toLocaleString()}</span>
        </div>
        <div className="bar" style={{ marginTop: 10 }}>
          <div style={{ width: `${pct}%` }} />
        </div>
        <p className="muted small" style={{ margin: "6px 0 0" }}>
          {sold / Math.max(1, g.monthly) >= pace
            ? "On pace for this month."
            : `To be on pace today you'd be at about $${Math.round(g.monthly * pace).toLocaleString()}.`}{" "}
          Counted from the revenue you enter each day.
        </p>
      </div>

      <div className="card">
        <label className="field">
          <span>Monthly revenue goal</span>
          <div className="money">
            <input type="number" inputMode="numeric" value={g.monthly} onChange={(e) => setG({ monthly: num(e.target.value) ?? 0 })} />
          </div>
        </label>
        <label className="field" style={{ marginBottom: 0 }}>
          <span>Average job price</span>
          <div className="money">
            <input
              type="number"
              inputMode="numeric"
              placeholder={m.avg && m.avgFrom === "numbers" ? String(Math.round(m.avg)) : ""}
              value={g.avgJob ?? ""}
              onChange={(e) => setG({ avgJob: num(e.target.value) })}
            />
          </div>
          {m.avgFrom === "numbers" && <small className="muted">Using ${Math.round(m.avg!)} from your sales so far.</small>}
        </label>
      </div>

      <div className="card">
        <h3>Your rates</h3>
        <p className="muted small">
          The app uses your real numbers once you have enough. Until then, type your own guess. It never makes up rates for
          you.
        </p>
        <RateRow label="Doors knocked → conversations" r={m.talk} guess={g.guessTalk} onGuess={(v) => setG({ guessTalk: v })} />
        <RateRow label="Conversations → quotes" r={m.quote} guess={g.guessQuote} onGuess={(v) => setG({ guessQuote: v })} />
        <RateRow label="Quotes → sales" r={m.close} guess={g.guessClose} onGuess={(v) => setG({ guessClose: v })} />
      </div>

      <div className="card accent">
        <h3>To hit ${g.monthly.toLocaleString()} a month you need about</h3>
        <table className="simple">
          <thead>
            <tr>
              <th />
              <th>Per month</th>
              <th>Per work day</th>
            </tr>
          </thead>
          <tbody>
            {(
              [
                ["Jobs", m.perMonth.jobs, m.perDay.jobs],
                ["Quotes", m.perMonth.quotes, m.perDay.quotes],
                ["Conversations", m.perMonth.talks, m.perDay.talks],
                ["Doors knocked", m.perMonth.knocks, m.perDay.knocks],
              ] as const
            ).map(([k, a, b]) => (
              <tr key={k}>
                <td>{k}</td>
                <td>
                  <strong>{fmt(a)}</strong>
                </td>
                <td>{fmt(b, 1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted small" style={{ margin: "8px 0 0" }}>
          This is math on the numbers above, not a promise. Quotes from hanger calls are a bonus on top of knocking.
          {m.perMonth.jobs == null && " Add your average job price to start."}
        </p>
      </div>
    </div>
  );
}

function RateRow({ label, r, guess, onGuess }: { label: string; r: Rate; guess: number | null; onGuess: (v: number | null) => void }) {
  return (
    <div className="stepper">
      <span>
        <strong>{label}</strong>
        <br />
        <span className="muted small">
          {r.value != null ? `${Math.round(r.value * 100)}% · ` : ""}
          {r.detail}
        </span>
      </span>
      {r.from === "yours" ? (
        <span className="status done">Yours</span>
      ) : (
        <label className="row" style={{ gap: 4 }}>
          <input
            type="number"
            inputMode="numeric"
            aria-label={`Your guess: ${label} percent`}
            placeholder="guess"
            value={guess ?? ""}
            onChange={(e) => onGuess(num(e.target.value))}
            style={{ width: 76, minHeight: 44, textAlign: "center" }}
          />
          %
        </label>
      )}
    </div>
  );
}
