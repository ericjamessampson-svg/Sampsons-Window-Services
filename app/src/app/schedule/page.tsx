"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { MonthGrid, TimeGrid, weekDates } from "@/components/Calendar";
import { useJobEditor } from "@/components/JobEditor";
import { addDays, niceDate, parseYmd, ymd } from "@/lib/dates";
import { useData } from "@/lib/store";

// The map only runs in the browser.
const DayMap = dynamic(() => import("@/components/DayMap").then((m) => m.DayMap), {
  ssr: false,
  loading: () => <div className="day-map" style={{ height: 360 }} />,
});

type View = "day" | "week" | "month";
const VIEW_KEY = "tenk-homes:schedule-view";

export default function SchedulePage() {
  return (
    <AppShell>
      <Schedule />
    </AppShell>
  );
}

function Schedule() {
  const data = useData()!;
  const today = ymd(new Date());
  const [date, setDate] = useState(today);
  const [view, setView] = useState<View>("day");
  const editor = useJobEditor();

  // Phones start on Day view, computers on Week view. Remember the last choice.
  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(VIEW_KEY);
    } catch {}
    if (saved === "day" || saved === "week" || saved === "month") setView(saved);
    else if (window.matchMedia("(min-width: 900px)").matches) setView("week");
    const fromLink = new URLSearchParams(window.location.search).get("date");
    if (fromLink && /^\d{4}-\d{2}-\d{2}$/.test(fromLink)) setDate(fromLink);
  }, []);

  const pickView = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {}
  };

  const step = (dir: number) => {
    const d = parseYmd(date);
    if (view === "day") setDate(ymd(addDays(d, dir)));
    else if (view === "week") setDate(ymd(addDays(d, 7 * dir)));
    else setDate(ymd(new Date(d.getFullYear(), d.getMonth() + dir, 1)));
  };

  const dates = view === "week" ? weekDates(date) : [date];
  const label =
    view === "month"
      ? parseYmd(date).toLocaleDateString(undefined, { month: "long", year: "numeric" })
      : view === "week"
        ? `${niceDate(dates[0])} – ${niceDate(dates[6])}`
        : niceDate(date);

  return (
    <div className="sched">
      <div className="sched-bar">
        <div className="seg" role="group" aria-label="View">
          {(["day", "week", "month"] as const).map((v) => (
            <button key={v} aria-pressed={view === v} onClick={() => pickView(v)}>
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <div className="row" style={{ gap: 4 }}>
          <button className="btn icon" aria-label="Back" onClick={() => step(-1)}>
            ‹
          </button>
          <button className="btn ghost" onClick={() => setDate(today)}>
            Today
          </button>
          <button className="btn icon" aria-label="Forward" onClick={() => step(1)}>
            ›
          </button>
        </div>
        <strong className="sched-label">{label}</strong>
        <button className="btn primary sched-add" onClick={() => editor.open({ date, start: "14:00" })}>
          + Add job or quote
        </button>
      </div>

      <div className="sched-cols">
        <div className="sched-main">
          {view === "month" ? (
            <MonthGrid
              data={data}
              date={date}
              today={today}
              onPickDay={(d) => {
                setDate(d);
                pickView("day");
              }}
            />
          ) : (
            <TimeGrid
              data={data}
              dates={dates}
              today={today}
              onAdd={(d, start) => editor.open({ date: d, start })}
              onOpen={(j) => editor.open(j)}
              onMoved={(j) => editor.checkConflicts(j)}
              onPickDay={view === "week" ? setDate : undefined}
            />
          )}
          <p className="muted small" style={{ marginTop: 8 }}>
            Tap an open time to add a job or quote. To move a job, drag it (on a phone, press and hold first).
          </p>
          <div className="legend">
            <span><i className="hang" /> Hanging</span>
            <span><i className="knock" /> Knocking</span>
            <span><i className="job" /> Job</span>
            <span><i className="quote" /> Quote</span>
          </div>
        </div>
        <aside className="sched-map">
          <details className="map-box" open>
            <summary>
              <strong>Stops on {niceDate(date)}</strong>
            </summary>
            <DayMap data={data} date={date} />
          </details>
        </aside>
      </div>
      {editor.element}
    </div>
  );
}
