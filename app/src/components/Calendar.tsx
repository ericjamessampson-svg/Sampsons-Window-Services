"use client";

import { useEffect, useState } from "react";
import { addDays, DAY_NAMES, parseYmd, weekStart, ymd } from "@/lib/dates";
import { blocksFor, niceTime, toHHMM, toMin } from "@/lib/schedule";
import type { AppData } from "@/lib/types";

const DAY_START = 7 * 60; // 7am
const DAY_END = 20 * 60; // 8pm
const PX_PER_MIN = 52 / 60;

export function weekDates(date: string): string[] {
  const start = parseYmd(weekStart(date));
  return Array.from({ length: 7 }, (_, i) => ymd(addDays(start, i)));
}

/** Day or week view of the plan's hanging and knocking blocks. */
export function TimeGrid({
  data,
  dates,
  today,
  selected,
  onPickDay,
}: {
  data: AppData;
  dates: string[];
  today: string;
  selected?: string;
  onPickDay?: (date: string) => void;
}) {
  const [nowMin, setNowMin] = useState(() => new Date().getHours() * 60 + new Date().getMinutes());

  useEffect(() => {
    const t = setInterval(() => setNowMin(new Date().getHours() * 60 + new Date().getMinutes()), 60_000);
    return () => clearInterval(t);
  }, []);

  const hours: number[] = [];
  for (let m = DAY_START; m < DAY_END; m += 60) hours.push(m);
  const multi = dates.length > 1;
  const cols = `52px repeat(${dates.length}, minmax(${multi ? 92 : 0}px, 1fr))`;

  return (
    <div className="cal">
      <div className="cal-head" style={{ gridTemplateColumns: cols }}>
        <span />
        {dates.map((d) => {
          const dt = parseYmd(d);
          return (
            <button
              key={d}
              className={`cal-day${d === today ? " is-today" : ""}${multi && d === selected ? " is-selected" : ""}`}
              onClick={() => onPickDay?.(d)}
              disabled={!onPickDay}
            >
              <span>{DAY_NAMES[dt.getDay()]}</span> <strong>{dt.getDate()}</strong>
            </button>
          );
        })}
      </div>
      <div className="cal-scroll">
        <div className="cal-body" style={{ gridTemplateColumns: cols, height: (DAY_END - DAY_START) * PX_PER_MIN }}>
          <div className="cal-hours">
            {hours.map((m) => (
              <div key={m} style={{ top: (m - DAY_START) * PX_PER_MIN }}>
                {niceTime(toHHMM(m))}
              </div>
            ))}
          </div>
          {dates.map((date) => {
            const blocks = blocksFor(data, date);
            return (
              <div
                key={date}
                className={`cal-col${date === today ? " is-today" : ""}`}
                onClick={() => onPickDay?.(date)}
                style={{ cursor: onPickDay ? "pointer" : "default" }}
              >
                {hours.map((m) => (
                  <div key={m} className="cal-line" style={{ top: (m - DAY_START) * PX_PER_MIN }} />
                ))}
                {blocks.map((b) => (
                  <div
                    key={b.kind}
                    className={`cal-block ${b.kind}`}
                    style={{ top: (toMin(b.start) - DAY_START) * PX_PER_MIN, height: (toMin(b.end) - toMin(b.start)) * PX_PER_MIN }}
                  >
                    <strong>{b.title}</strong>
                    <span>
                      {niceTime(b.start)}–{niceTime(b.end)} · {b.detail}
                    </span>
                  </div>
                ))}
                {blocks.length > 0 && (
                  <div className="cal-block midday" style={{ top: (toMin("13:30") - DAY_START) * PX_PER_MIN, height: 150 * PX_PER_MIN }}>
                    <strong>Midday</strong>
                    <span>Call back, give quotes, do jobs</span>
                  </div>
                )}
                {blocks.length === 0 && <div className="cal-off">Day off</div>}
                {date === today && nowMin >= DAY_START && nowMin <= DAY_END && (
                  <div className="cal-now" style={{ top: (nowMin - DAY_START) * PX_PER_MIN }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
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
        return (
          <button
            key={c}
            className={`month-cell${cd.getMonth() !== month ? " other" : ""}${c === today ? " is-today" : ""}`}
            onClick={() => onPickDay(c)}
          >
            <span className="month-num">{cd.getDate()}</span>
            {blocks.map((b) => (
              <span key={b.kind} className={`pill ${b.kind}`}>
                {b.kind === "hang" ? "Hang" : "Knock"}: {b.planDay.zone.name}
              </span>
            ))}
          </button>
        );
      })}
    </div>
  );
}
