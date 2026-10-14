"use client";

import { update } from "@/lib/store";
import { SAMPLE_PLAN, type PlanDay } from "@/lib/samplePlan";
import type { AppData } from "@/lib/types";

export function streetsFor(data: AppData, d: PlanDay): string {
  return data.planEdits[d.day]?.streets ?? "";
}

/** The 20 plan days. `todayDay` highlights the current day. `editable` shows street boxes and done/skip. */
export function PlanList({ data, todayDay, editable }: { data: AppData; todayDay?: number; editable?: boolean }) {
  return (
    <div>
      {SAMPLE_PLAN.map((d) => {
        const edit = data.planEdits[d.day] ?? {};
        const status = edit.status ?? "todo";
        return (
          <div key={d.day} className={`plan-day${todayDay === d.day ? " today" : ""}`} style={editable ? { alignItems: "start" } : undefined}>
            <span className="day-badge" aria-label={`Day ${d.day}`}>
              {d.day}
            </span>
            <div style={{ minWidth: 0 }}>
              <strong>{d.zone.name}</strong>
              <div className="muted small">
                {d.zone.area} · {d.ofParts > 1 ? `part ${d.part} of ${d.ofParts} · ` : ""}
                {d.target} homes
              </div>
              {!editable && edit.streets && <div className="small">{edit.streets}</div>}
              {editable && (
                <>
                  <input
                    type="text"
                    placeholder="Streets you'll cover (type them in)"
                    aria-label={`Streets for day ${d.day}`}
                    value={edit.streets ?? ""}
                    onChange={(e) => update((x) => void ((x.planEdits[d.day] ??= {}).streets = e.target.value))}
                    style={{ marginTop: 6 }}
                  />
                  <div className="chips" style={{ marginTop: 6 }}>
                    {(["todo", "done", "skipped"] as const).map((s) => (
                      <button
                        key={s}
                        className="chip"
                        style={{ minHeight: 40 }}
                        aria-pressed={status === s}
                        onClick={() => update((x) => void ((x.planEdits[d.day] ??= {}).status = s))}
                      >
                        {s === "todo" ? "To do" : s === "done" ? "Done" : "Skipped"}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            {!editable && (status === "todo" ? <span /> : <span className={`status ${status}`}>{status === "done" ? "Done" : "Skipped"}</span>)}
            {editable && <span />}
          </div>
        );
      })}
    </div>
  );
}
