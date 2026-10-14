"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { NumbersForm, totals } from "@/components/NumbersForm";
import { niceDate, weekStart, ymd } from "@/lib/dates";
import { useData } from "@/lib/store";
import type { DailyNumbers } from "@/lib/types";

export default function NumbersPage() {
  return (
    <AppShell>
      <Numbers />
    </AppShell>
  );
}

const COLS: [keyof DailyNumbers, string][] = [
  ["hangers", "Hangers"],
  ["knocked", "Knocked"],
  ["conversations", "Talks"],
  ["quotes", "Quotes"],
  ["sales", "Sales"],
];

function Numbers() {
  const data = useData()!;
  const [date, setDate] = useState(ymd(new Date()));
  const all = totals(data);
  const weeks = Array.from(new Set(Object.keys(data.numbers).map(weekStart))).sort().reverse();
  const days = Object.keys(data.numbers).sort().reverse();

  return (
    <div className="cols">
      <div>
        <h1>Numbers</h1>
        <div className="card">
          <label className="field">
            <span>Day</span>
            <input type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
          </label>
          <NumbersForm data={data} date={date} />
        </div>
        <div className="card">
          <h2>All time</h2>
          <table className="simple">
            <tbody>
              {COLS.map(([k, label]) => (
                <tr key={k}>
                  <td>{label}</td>
                  <td>
                    <strong>{all[k].toLocaleString()}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <div className="card" style={{ overflowX: "auto" }}>
          <h2>By week</h2>
          {weeks.length === 0 ? (
            <p className="muted">No numbers yet. Enter them at the end of each day.</p>
          ) : (
            <table className="simple">
              <thead>
                <tr>
                  <th>Week of</th>
                  {COLS.map(([k, l]) => (
                    <th key={k}>{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {weeks.map((w) => {
                  const t = totals(data, (d) => weekStart(d) === w);
                  return (
                    <tr key={w}>
                      <td>{niceDate(w)}</td>
                      {COLS.map(([k]) => (
                        <td key={k}>{t[k].toLocaleString()}</td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {days.length > 0 && (
          <div className="card" style={{ overflowX: "auto" }}>
            <h2>By day</h2>
            <table className="simple">
              <thead>
                <tr>
                  <th>Day</th>
                  {COLS.map(([k, l]) => (
                    <th key={k}>{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map((d) => (
                  <tr key={d} onClick={() => setDate(d)} style={{ cursor: "pointer" }}>
                    <td>{niceDate(d)}</td>
                    {COLS.map(([k]) => (
                      <td key={k}>{(data.numbers[d][k] ?? 0).toLocaleString()}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
