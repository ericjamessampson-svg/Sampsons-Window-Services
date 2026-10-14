"use client";

import { useEffect, useRef, useState } from "react";
import { addDays, DAY_NAMES, parseYmd, weekStart, ymd } from "@/lib/dates";
import { blocksFor, jobEnd, jobsOn, niceTime, toHHMM, toMin } from "@/lib/schedule";
import { update } from "@/lib/store";
import type { AppData, Job } from "@/lib/types";

export const DAY_START = 6 * 60; // 6am
export const DAY_END = 21 * 60; // 9pm
const HOUR_PX = 56;
const PX_PER_MIN = HOUR_PX / 60;
const SNAP = 15;

export function weekDates(date: string): string[] {
  const start = parseYmd(weekStart(date));
  return Array.from({ length: 7 }, (_, i) => ymd(addDays(start, i)));
}

interface Drag {
  job: Job;
  grabOffsetMin: number;
  startX: number;
  startY: number;
  active: boolean;
  date: string;
  start: string;
  pointerType: string;
  timer?: number;
}

/** Day or week time grid. Tap open time to add; drag a job to move it. */
export function TimeGrid({
  data,
  dates,
  today,
  onAdd,
  onOpen,
  onMoved,
  onPickDay,
}: {
  data: AppData;
  dates: string[];
  today: string;
  onAdd: (date: string, start: string) => void;
  onOpen: (job: Job) => void;
  onMoved: (job: Job) => void;
  onPickDay?: (date: string) => void;
}) {
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const [nowMin, setNowMin] = useState(() => new Date().getHours() * 60 + new Date().getMinutes());

  useEffect(() => {
    const t = setInterval(() => setNowMin(new Date().getHours() * 60 + new Date().getMinutes()), 60_000);
    return () => clearInterval(t);
  }, []);

  // Start scrolled near 8am.
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = (8 * 60 - DAY_START) * PX_PER_MIN - 8;
  }, []);

  // While dragging on a phone, stop the page from scrolling.
  useEffect(() => {
    const stop = (e: TouchEvent) => {
      if (dragRef.current?.active) e.preventDefault();
    };
    document.addEventListener("touchmove", stop, { passive: false });
    return () => document.removeEventListener("touchmove", stop);
  }, []);

  const setBoth = (d: Drag | null) => {
    dragRef.current = d;
    setDrag(d);
  };

  function pointToSlot(clientX: number, clientY: number, grabOffsetMin = 0) {
    let idx = colRefs.current.findIndex((el) => {
      if (!el) return false;
      const r = el.getBoundingClientRect();
      return clientX >= r.left && clientX < r.right;
    });
    if (idx < 0) idx = clientX < (colRefs.current[0]?.getBoundingClientRect().left ?? 0) ? 0 : dates.length - 1;
    const col = colRefs.current[idx]!;
    const r = col.getBoundingClientRect();
    const raw = DAY_START + (clientY - r.top) / PX_PER_MIN - grabOffsetMin;
    const snapped = Math.round(raw / SNAP) * SNAP;
    return { date: dates[idx], minute: Math.max(DAY_START, Math.min(DAY_END - SNAP, snapped)) };
  }

  function onJobPointerDown(e: React.PointerEvent, job: Job) {
    if (e.button !== 0) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const d: Drag = {
      job,
      grabOffsetMin: (e.clientY - r.top) / PX_PER_MIN,
      startX: e.clientX,
      startY: e.clientY,
      active: false,
      date: job.date,
      start: job.start,
      pointerType: e.pointerType,
    };
    if (e.pointerType !== "mouse") {
      // Phones: press and hold to pick up a job, so normal swipes still scroll.
      d.timer = window.setTimeout(() => {
        if (dragRef.current === d) {
          d.active = true;
          setBoth({ ...d });
          navigator.vibrate?.(15);
        }
      }, 300);
    }
    dragRef.current = d;
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragRef.current;
    if (!d) return;
    const moved = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
    if (!d.active) {
      if (d.pointerType === "mouse" && moved > 4) d.active = true;
      else if (d.pointerType !== "mouse" && moved > 8) {
        // finger moved before the hold finished: treat it as a scroll
        clearTimeout(d.timer);
        dragRef.current = null;
        return;
      } else return;
    }
    const slot = pointToSlot(e.clientX, e.clientY, d.grabOffsetMin);
    setBoth({ ...d, date: slot.date, start: toHHMM(slot.minute) });
  }

  function onPointerUp() {
    const d = dragRef.current;
    if (!d) return;
    clearTimeout(d.timer);
    if (d.active) {
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 50);
      if (d.date !== d.job.date || d.start !== d.job.start) {
        const moved = { ...d.job, date: d.date, start: d.start };
        update((x) => {
          const i = x.jobs.findIndex((j) => j.id === moved.id);
          if (i >= 0) x.jobs[i] = moved;
        });
        onMoved(moved);
      }
    } else {
      onOpen(d.job);
      suppressClick.current = true;
      setTimeout(() => (suppressClick.current = false), 50);
    }
    setBoth(null);
  }

  const hours: number[] = [];
  for (let m = DAY_START; m < DAY_END; m += 60) hours.push(m);
  const height = (DAY_END - DAY_START) * PX_PER_MIN;
  const multi = dates.length > 1;

  return (
    <div className="cal">
      <div className="cal-head" style={{ gridTemplateColumns: `52px repeat(${dates.length}, minmax(${multi ? 92 : 0}px, 1fr))` }}>
        <span />
        {dates.map((d) => {
          const dt = parseYmd(d);
          return (
            <button
              key={d}
              className={`cal-day${d === today ? " is-today" : ""}`}
              onClick={() => onPickDay?.(d)}
              disabled={!onPickDay}
            >
              <span>{DAY_NAMES[dt.getDay()]}</span> <strong>{dt.getDate()}</strong>
            </button>
          );
        })}
      </div>
      <div className="cal-scroll" ref={scrollRef}>
        <div
          className="cal-body"
          style={{ gridTemplateColumns: `52px repeat(${dates.length}, minmax(${multi ? 92 : 0}px, 1fr))`, height }}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={() => {
            clearTimeout(dragRef.current?.timer);
            setBoth(null);
          }}
        >
          <div className="cal-hours">
            {hours.map((m) => (
              <div key={m} style={{ top: (m - DAY_START) * PX_PER_MIN }}>
                {niceTime(toHHMM(m))}
              </div>
            ))}
          </div>
          {dates.map((date, i) => {
            const jobs = jobsOn(
              {
                ...data,
                jobs: data.jobs.map((j) => (drag?.active && j.id === drag.job.id ? { ...j, date: drag.date, start: drag.start } : j)),
              },
              date
            );
            const lanes = layoutLanes(jobs);
            return (
              <div
                key={date}
                ref={(el) => void (colRefs.current[i] = el)}
                className={`cal-col${date === today ? " is-today" : ""}`}
                onClick={(e) => {
                  if (suppressClick.current || e.target !== e.currentTarget) return;
                  const slot = pointToSlot(e.clientX, e.clientY);
                  onAdd(date, toHHMM(slot.minute));
                }}
              >
                {hours.map((m) => (
                  <div key={m} className="cal-line" style={{ top: (m - DAY_START) * PX_PER_MIN }} />
                ))}
                {blocksFor(data, date).map((b) => {
                  const top = (toMin(b.start) - DAY_START) * PX_PER_MIN;
                  const h = (toMin(b.end) - toMin(b.start)) * PX_PER_MIN;
                  return (
                    <div key={b.kind} className={`cal-block ${b.kind}`} style={{ top, height: h }}>
                      <strong>{b.title}</strong>
                      <span>
                        {niceTime(b.start)}–{niceTime(b.end)} · {b.detail}
                      </span>
                    </div>
                  );
                })}
                {date === today && nowMin >= DAY_START && nowMin <= DAY_END && (
                  <div className="cal-now" style={{ top: (nowMin - DAY_START) * PX_PER_MIN }} />
                )}
                {jobs.map((j) => {
                  const top = (toMin(j.start) - DAY_START) * PX_PER_MIN;
                  const h = Math.max(22, j.minutes * PX_PER_MIN - 2);
                  const lane = lanes.get(j.id) ?? { lane: 0, of: 1 };
                  const dragging = drag?.active && drag.job.id === j.id;
                  return (
                    <div
                      key={j.id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${j.kind === "quote" ? "Quote" : "Job"}: ${j.customer}, ${niceTime(j.start)}`}
                      className={`cal-job ${j.kind}${j.status === "done" ? " done" : ""}${dragging ? " dragging" : ""}`}
                      style={{
                        top,
                        height: h,
                        left: `calc(${(lane.lane / lane.of) * 100}% + 2px)`,
                        width: `calc(${100 / lane.of}% - 4px)`,
                      }}
                      onPointerDown={(e) => onJobPointerDown(e, j)}
                      onKeyDown={(e) => e.key === "Enter" && onOpen(j)}
                    >
                      {j.minutes <= 30 ? (
                        <span style={{ color: "var(--text)" }}>
                          <strong>{j.customer || "No name"}</strong> · {niceTime(j.start)}
                        </span>
                      ) : (
                        <>
                          <div className="row between" style={{ gap: 4 }}>
                            <strong>{j.customer || "No name"}</strong>
                            {j.price != null && <span>${j.price}</span>}
                          </div>
                          <span>
                            {niceTime(j.start)}–{niceTime(jobEnd(j))} · {j.kind === "quote" ? "Quote" : j.service}
                          </span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Puts jobs that overlap side by side. */
function layoutLanes(jobs: Job[]) {
  const out = new Map<string, { lane: number; of: number }>();
  let group: Job[] = [];
  let groupEnd = -1;
  const flush = () => {
    const laneEnds: number[] = [];
    const assigned: [string, number][] = [];
    for (const j of group) {
      const s = toMin(j.start);
      let lane = laneEnds.findIndex((e) => e <= s);
      if (lane < 0) lane = laneEnds.length;
      laneEnds[lane] = s + j.minutes;
      assigned.push([j.id, lane]);
    }
    for (const [id, lane] of assigned) out.set(id, { lane, of: laneEnds.length });
    group = [];
  };
  for (const j of jobs) {
    const s = toMin(j.start);
    if (group.length && s >= groupEnd) flush();
    group.push(j);
    groupEnd = Math.max(groupEnd, s + j.minutes);
  }
  if (group.length) flush();
  return out;
}

/** Month grid: tap a day to open it. */
export function MonthGrid({ data, date, today, onPickDay }: { data: AppData; date: string; today: string; onPickDay: (d: string) => void }) {
  const d = parseYmd(date);
  const first = new Date(d.getFullYear(), d.getMonth(), 1);
  const gridStart = parseYmd(weekStart(ymd(first)));
  const cells = Array.from({ length: 42 }, (_, i) => ymd(addDays(gridStart, i)));
  const month = d.getMonth();

  return (
    <div className="month">
      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((n) => (
        <div key={n} className="month-name">
          {n}
        </div>
      ))}
      {cells.map((c) => {
        const cd = parseYmd(c);
        const blocks = blocksFor(data, c);
        const jobs = jobsOn(data, c);
        const hang = blocks.find((b) => b.kind === "hang");
        return (
          <button
            key={c}
            className={`month-cell${cd.getMonth() !== month ? " other" : ""}${c === today ? " is-today" : ""}`}
            onClick={() => onPickDay(c)}
          >
            <span className="month-num">{cd.getDate()}</span>
            {hang && <span className="pill hang">{hang.planDay.zone.name}</span>}
            {jobs.slice(0, 2).map((j) => (
              <span key={j.id} className={`pill ${j.kind}`}>
                {niceTime(j.start)} {j.customer}
              </span>
            ))}
            {jobs.length > 2 && <span className="muted small">+{jobs.length - 2} more</span>}
          </button>
        );
      })}
    </div>
  );
}
