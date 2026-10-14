"use client";

import { useState } from "react";
import { update, useData } from "@/lib/store";
import { niceDate } from "@/lib/dates";
import { getTrade } from "@/lib/trades";
import {
  jobEnd,
  newId,
  niceTime,
  overlapsFor,
  shiftOptions,
  toMin,
  type PlanBlock,
} from "@/lib/schedule";
import type { Job, JobKind } from "@/lib/types";

const LENGTHS = [30, 60, 90, 120, 180, 240];
const lengthLabel = (m: number) => (m < 60 ? `${m} min` : `${m / 60} hr${m > 60 ? "s" : ""}`);

export interface Draft {
  date: string;
  start: string;
  kind?: JobKind;
}

/**
 * Hook that gives you an `open` function and the form/warning sheets to render.
 * Used by the home screen and the schedule.
 */
export function useJobEditor() {
  const [job, setJob] = useState<Job | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [conflict, setConflict] = useState<{ job: Job; blocks: PlanBlock[] } | null>(null);
  const data = useData();

  function open(target: Job | Draft) {
    if ("id" in target) {
      setJob({ ...target });
      setIsNew(false);
    } else {
      setJob({
        id: newId(),
        kind: target.kind ?? "job",
        customer: "",
        phone: "",
        address: "",
        service: data?.profile?.services[0] ?? "",
        price: null,
        notes: "",
        date: target.date,
        start: target.start,
        minutes: target.kind === "quote" ? 30 : 120,
        status: "booked",
      });
      setIsNew(true);
    }
  }

  /** Call after a job is saved or moved, to warn about plan blocks it overlaps. */
  function checkConflicts(j: Job) {
    if (!data || j.status === "canceled") return;
    const blocks = overlapsFor(data, j);
    if (blocks.length) setConflict({ job: j, blocks });
  }

  function save(j: Job) {
    update((d) => {
      const i = d.jobs.findIndex((x) => x.id === j.id);
      if (i >= 0) d.jobs[i] = j;
      else d.jobs.push(j);
    });
    setJob(null);
    checkConflicts(j);
  }

  const element = (
    <>
      {job && data && (
        <JobForm
          job={job}
          isNew={isNew}
          services={data.profile ? Array.from(new Set([...data.profile.services, ...getTrade(data.profile.trade).services])) : []}
          onChange={setJob}
          onCancel={() => setJob(null)}
          onSave={save}
          onDelete={() => {
            update((d) => void (d.jobs = d.jobs.filter((x) => x.id !== job.id)));
            setJob(null);
          }}
        />
      )}
      {conflict && <ConflictSheet {...conflict} onClose={() => setConflict(null)} />}
    </>
  );

  return { open, element, checkConflicts };
}

function JobForm({
  job,
  isNew,
  services,
  onChange,
  onCancel,
  onSave,
  onDelete,
}: {
  job: Job;
  isNew: boolean;
  services: string[];
  onChange: (j: Job) => void;
  onCancel: () => void;
  onSave: (j: Job) => void;
  onDelete: () => void;
}) {
  const set = (patch: Partial<Job>) => onChange({ ...job, ...patch });
  const word = job.kind === "quote" ? "quote" : "job";
  const canSave = job.customer.trim().length > 0 && !!job.date && !!job.start;

  return (
    <div className="sheet-backdrop" onClick={onCancel}>
      <form
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={isNew ? `New ${word}` : `Edit ${word}`}
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (canSave) onSave(job);
        }}
      >
        <div className="row between" style={{ marginBottom: 10 }}>
          <h2 style={{ margin: 0 }}>{isNew ? `New ${word}` : `Edit ${word}`}</h2>
          <button type="button" className="btn ghost" onClick={onCancel}>
            Close
          </button>
        </div>

        <div className="seg" role="group" aria-label="Type">
          {(["job", "quote"] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={job.kind === k}
              onClick={() => set({ kind: k, minutes: isNew ? (k === "quote" ? 30 : 120) : job.minutes })}
            >
              {k === "job" ? "Cleaning job" : "Quote visit"}
            </button>
          ))}
        </div>

        <label className="field">
          <span>Customer name</span>
          <input type="text" autoComplete="off" value={job.customer} onChange={(e) => set({ customer: e.target.value })} autoFocus={isNew} />
        </label>
        <label className="field">
          <span>Address</span>
          <input type="text" autoComplete="off" placeholder="123 Main St, Austin, TX" value={job.address} onChange={(e) => set({ address: e.target.value })} />
        </label>
        <label className="field">
          <span>Phone</span>
          <input type="tel" inputMode="tel" value={job.phone} onChange={(e) => set({ phone: e.target.value })} />
        </label>
        <label className="field">
          <span>Service</span>
          <input type="text" list="service-list" value={job.service} onChange={(e) => set({ service: e.target.value })} />
          <datalist id="service-list">
            {services.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
        <label className="field">
          <span>{job.kind === "quote" ? "Expected price (optional)" : "Price"}</span>
          <div className="money">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={job.price ?? ""}
              onChange={(e) => set({ price: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })}
            />
          </div>
        </label>
        <div className="row">
          <label className="field" style={{ flex: 1 }}>
            <span>Day</span>
            <input type="date" value={job.date} onChange={(e) => e.target.value && set({ date: e.target.value })} />
          </label>
          <label className="field" style={{ flex: 1 }}>
            <span>Start</span>
            <input type="time" step={900} value={job.start} onChange={(e) => e.target.value && set({ start: e.target.value })} />
          </label>
        </div>
        <span style={{ fontWeight: 700 }}>How long</span>
        <div className="chips" style={{ margin: "6px 0 14px" }}>
          {LENGTHS.map((m) => (
            <button key={m} type="button" className="chip" aria-pressed={job.minutes === m} onClick={() => set({ minutes: m })}>
              {lengthLabel(m)}
            </button>
          ))}
        </div>
        <label className="field">
          <span>Notes</span>
          <textarea value={job.notes} placeholder="Gate code, dog, 2-story back side…" onChange={(e) => set({ notes: e.target.value })} />
        </label>

        {!isNew && (
          <div className="chips" style={{ marginBottom: 14 }}>
            {(["booked", "done", "canceled"] as const).map((s) => (
              <button key={s} type="button" className="chip" aria-pressed={job.status === s} onClick={() => set({ status: s })}>
                {s === "booked" ? "Booked" : s === "done" ? "Done" : "Canceled"}
              </button>
            ))}
          </div>
        )}

        <button type="submit" className="btn primary block big" disabled={!canSave}>
          {isNew ? `Add ${word}` : "Save"}
        </button>
        {!isNew && (
          <button
            type="button"
            className="btn ghost danger block"
            style={{ marginTop: 8 }}
            onClick={() => confirm(`Delete this ${word}?`) && onDelete()}
          >
            Delete {word}
          </button>
        )}
      </form>
    </div>
  );
}

function ConflictSheet({ job, blocks, onClose }: { job: Job; blocks: PlanBlock[]; onClose: () => void }) {
  const data = useData();
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="alertdialog" aria-modal="true" aria-label="Time overlap" onClick={(e) => e.stopPropagation()}>
        <div className="kicker" style={{ color: "var(--danger)" }}>
          Heads up: time overlap
        </div>
        <h2>
          {job.customer || "This job"} ({niceTime(job.start)} to {niceTime(jobEnd(job))}) overlaps your{" "}
          {blocks.map((b) => (b.kind === "hang" ? "hanging" : "knocking")).join(" and ")} time on {niceDate(job.date)}.
        </h2>
        {blocks.map((b) => {
          const name = b.kind === "hang" ? "hanging" : "knocking";
          const fullLen = toMin(b.end) - toMin(b.start);
          const opts = data ? shiftOptions(data, b, job) : [];
          if (!opts.length)
            return (
              <p key={b.kind} className="small">
                There&apos;s no free time that day to move {name}. Keep it, or move the {job.kind}.
              </p>
            );
          return opts.map((o) => {
            const len = toMin(o.end) - toMin(o.start);
            return (
              <button
                key={b.kind + o.start}
                className="btn primary block"
                style={{ marginBottom: 10, height: "auto", padding: "12px 16px" }}
                onClick={() => {
                  update((d) => {
                    (d.blockShifts[job.date] ??= {})[b.kind] = o;
                  });
                  onClose();
                }}
              >
                Move {name} to {niceTime(o.start)} to {niceTime(o.end)}
                {len < fullLen && ` (shorter: ${+(len / 60).toFixed(1)} hrs)`}
              </button>
            );
          });
        })}
        <button className="btn block" onClick={onClose}>
          Keep it as is
        </button>
      </div>
    </div>
  );
}
