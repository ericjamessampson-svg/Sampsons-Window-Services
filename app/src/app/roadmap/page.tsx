"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CheckMark } from "@/components/Icons";
import { StepBody } from "@/components/StepBody";
import { update, useData } from "@/lib/store";
import { roadmapSteps, type Step } from "@/lib/roadmap";
import { getTrade } from "@/lib/trades";
import { ymd } from "@/lib/dates";
import type { AppData } from "@/lib/types";

export default function RoadmapPage() {
  return (
    <AppShell>
      <Roadmap />
    </AppShell>
  );
}

function Roadmap() {
  const data = useData()!;
  const steps = roadmapSteps(data.profile);
  const firstOpen = steps.findIndex((s) => !data.roadmap[s.id]?.done);
  const current = firstOpen === -1 ? steps.length : firstOpen;
  const [open, setOpen] = useState<string | null>(null);
  const selected = steps.find((s) => s.id === open);
  const doneCount = steps.filter((s) => data.roadmap[s.id]?.done).length;

  const list = (
    <div className="card">
      <div className="row between">
        <h1 style={{ margin: 0 }}>Your roadmap</h1>
        <span className="count-pill">
          {doneCount} of {steps.length}
        </span>
      </div>
      <div className="bar" style={{ margin: "12px 0 6px" }}>
        <div style={{ width: `${(doneCount / steps.length) * 100}%` }} />
      </div>
      {steps.map((s, i) => {
        const done = !!data.roadmap[s.id]?.done;
        const locked = i > current;
        const cls = done ? "done" : i === current ? "current" : locked ? "locked" : "";
        return (
          <button
            key={s.id}
            className={`step ${cls}`}
            style={{ width: "100%", background: "none", border: 0, borderBottom: "1px solid var(--line)", textAlign: "left", font: "inherit", cursor: locked ? "default" : "pointer" }}
            onClick={() => !locked && setOpen(s.id)}
            aria-disabled={locked}
          >
            <span className="dot">{done ? <CheckMark /> : i + 1}</span>
            <span>
              <strong>{s.title}</strong>
              <br />
              <span className="muted small">{locked ? `Finish step ${current + 1} first` : s.why}</span>
            </span>
          </button>
        );
      })}
    </div>
  );

  // Phone: show either the list or one step. Computer: both side by side.
  const fallback = steps[Math.min(current, steps.length - 1)];
  const detailStep = selected ?? fallback;

  return (
    <div className="cols">
      <div className={selected ? "only-desktop" : ""}>
        {current < steps.length && !selected && (
          <div className="card gold">
            <div className="kicker">Do this now</div>
            <h2>
              Step {current + 1}: {steps[current].title}
            </h2>
            <button className="btn primary block big" onClick={() => setOpen(steps[current].id)}>
              Open step {current + 1}
            </button>
          </div>
        )}
        {current >= steps.length && (
          <div className="card accent">
            <h2>Roadmap done</h2>
            <p style={{ margin: 0 }}>Now follow the Today screen every work day.</p>
          </div>
        )}
        {list}
      </div>
      <div className={selected ? "" : "only-desktop"}>
        <StepDetail
          step={detailStep}
          index={steps.indexOf(detailStep)}
          data={data}
          onBack={() => setOpen(null)}
          onDone={() => {
            const nextStep = steps[steps.indexOf(detailStep) + 1];
            setOpen(nextStep ? nextStep.id : null);
            window.scrollTo({ top: 0 });
          }}
          locked={steps.indexOf(detailStep) > current}
        />
      </div>
    </div>
  );
}

function StepDetail({
  step,
  index,
  data,
  onBack,
  onDone,
  locked,
}: {
  step: Step;
  index: number;
  data: AppData;
  onBack: () => void;
  onDone: () => void;
  locked: boolean;
}) {
  const state = data.roadmap[step.id] ?? {};
  const trade = getTrade(data.profile!.trade);
  const tasks = step.id === "equipment" ? trade.equipment : step.tasks;
  const toggle = (t: string) =>
    update((d) => {
      const s = (d.roadmap[step.id] ??= {});
      s.checks = { ...s.checks, [t]: !s.checks?.[t] };
    });

  return (
    <div>
      <button className="btn ghost" onClick={onBack} style={{ marginBottom: 6 }}>
        ← All steps
      </button>
      <div className="kicker">Step {index + 1}</div>
      <h1>{step.title}</h1>
      <p className="muted">{step.why}</p>

      {tasks.length > 0 && (
        <div className="card">
          {tasks.map((t) => (
            <button key={t} className="check" role="checkbox" aria-checked={!!state.checks?.[t]} onClick={() => toggle(t)}>
              <span className="box">{state.checks?.[t] && <CheckMark />}</span>
              <span className="label">{t}</span>
            </button>
          ))}
        </div>
      )}

      <StepBody kind={step.id} data={data} />

      {step.links && step.links.length > 0 && (
        <div className="card">
          <h3>Helpful links</h3>
          <ul className="tight">
            {step.links.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noreferrer">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {step.caution && <div className="card gold small">{step.caution}</div>}

      {state.done ? (
        <div className="row between card accent">
          <strong>Done</strong>
          <button className="btn ghost" onClick={() => update((d) => void delete d.roadmap[step.id]?.done)}>
            Undo
          </button>
        </div>
      ) : (
        <button
          className="btn primary block big"
          disabled={locked}
          onClick={() => {
            update((d) => {
              (d.roadmap[step.id] ??= {}).done = ymd(new Date());
            });
            onDone();
          }}
        >
          {locked ? "Finish the earlier steps first" : "Mark this step done"}
        </button>
      )}
    </div>
  );
}
