"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { update, useData } from "@/lib/store";
import { TRADES, getTrade } from "@/lib/trades";
import { DAY_NAMES, nextMonday } from "@/lib/dates";
import type { Profile, Stage, TradeId, Travel } from "@/lib/types";

const TRAVEL: { id: Travel; label: string; hint: string }[] = [
  { id: "car", label: "Car", hint: "Drive and walk the streets" },
  { id: "car_scooter", label: "Car, then scooter or bike", hint: "Drive to the area, ride the streets" },
  { id: "scooter", label: "Scooter only", hint: "Electric or gas" },
  { id: "bike", label: "Bike", hint: "" },
  { id: "walking", label: "Walking", hint: "" },
];

const TARGETS = ["Any home", "$300K+", "$500K+", "$750K+", "$1M+"];

const STAGES: { id: Stage; label: string; hint: string }[] = [
  { id: "idea", label: "Just an idea", hint: "No equipment or customers yet" },
  { id: "equipment", label: "I have equipment", hint: "Ready to work, no steady customers" },
  { id: "customers", label: "I have a few customers", hint: "Want to grow" },
];

function blankProfile(): Profile {
  return {
    trade: "window",
    tradeOther: "",
    services: [],
    homeBase: "",
    startupBudget: null,
    hangerBudget: null,
    hoursPerDay: 8,
    workDays: [1, 2, 3, 4, 5],
    travel: "car",
    rangeMinutes: 30,
    targetHome: "$500K+",
    stage: "idea",
    startDate: nextMonday(),
    useSamplePlan: false,
  };
}

function kyleSample(): Profile {
  return {
    ...blankProfile(),
    trade: "window",
    services: ["Outside windows", "Inside windows", "Screens", "Tracks and sills"],
    homeBase: "Kyle, TX",
    hoursPerDay: 9,
    travel: "car_scooter",
    rangeMinutes: 50,
    targetHome: "$500K+",
    stage: "equipment",
    useSamplePlan: true,
  };
}

const num = (v: string) => (v.trim() === "" ? null : Math.max(0, Number(v)));

export default function Onboarding() {
  const router = useRouter();
  const data = useData();
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>(() => data?.profile ?? blankProfile());
  const [loaded, setLoaded] = useState(false);
  // Saved answers arrive after the first render; load them once for editing.
  useEffect(() => {
    if (!loaded && data) {
      if (data.profile) setP(data.profile);
      setLoaded(true);
    }
  }, [data, loaded]);
  const set = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }));
  const trade = getTrade(p.trade);
  const TOTAL = 9;

  function finish() {
    update((d) => {
      d.profile = p;
    });
    router.replace("/roadmap");
  }

  const next = () => (step >= TOTAL ? finish() : setStep(step + 1));
  const back = () => setStep(Math.max(0, step - 1));

  let body: React.ReactNode;
  let canNext = true;

  switch (step) {
    case 0:
      body = (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/spur-logo.png" alt="Spur" className="welcome-logo" />
          <h1>Let&apos;s start your business</h1>
          <p>Answer 9 quick questions. It takes about 5 minutes. Then the app tells you what to do, step by step.</p>
          <div className="card gold">
            <strong>The 10K Homes plan:</strong> hang 500 door hangers every morning, then knock on those same streets
            the next evening. In 20 work days, you reach about 10,000 homes.
          </div>
          <button className="btn primary block big" onClick={() => setStep(1)}>
            Start
          </button>
          <button
            className="btn block"
            style={{ marginTop: 10 }}
            onClick={() => {
              setP(kyleSample());
              setStep(1);
            }}
          >
            Fill in the Kyle, TX window cleaner sample
          </button>
        </>
      );
      break;
    case 1:
      body = (
        <>
          <h1>What&apos;s your trade?</h1>
          {TRADES.map((t) => (
            <button
              key={t.id}
              className="choice"
              aria-pressed={p.trade === t.id}
              onClick={() => set({ trade: t.id as TradeId, services: p.trade === t.id ? p.services : [] })}
            >
              <strong>{t.label}</strong>
            </button>
          ))}
          {p.trade === "other" && (
            <label className="field">
              <span>What do you do?</span>
              <input type="text" value={p.tradeOther} onChange={(e) => set({ tradeOther: e.target.value })} />
            </label>
          )}
        </>
      );
      break;
    case 2: {
      const options = Array.from(new Set([...trade.services, ...p.services]));
      body = (
        <>
          <h1>Which services will you offer?</h1>
          <p className="muted">Tap all that apply. Start with 2 or 3. You can add more later.</p>
          <div className="chips">
            {options.map((s) => {
              const on = p.services.includes(s);
              return (
                <button
                  key={s}
                  className="chip"
                  aria-pressed={on}
                  onClick={() => set({ services: on ? p.services.filter((x) => x !== s) : [...p.services, s] })}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <AddService onAdd={(s) => set({ services: [...p.services, s] })} />
        </>
      );
      canNext = p.services.length > 0;
      break;
    }
    case 3:
      body = (
        <>
          <h1>Where is home base?</h1>
          <p className="muted">Your city and state, or your address. We use it to pick neighborhoods near you.</p>
          <label className="field">
            <span>City and state</span>
            <input type="text" placeholder="Kyle, TX" value={p.homeBase} onChange={(e) => set({ homeBase: e.target.value })} />
          </label>
        </>
      );
      canNext = p.homeBase.trim().length > 1;
      break;
    case 4:
      body = (
        <>
          <h1>What&apos;s your budget?</h1>
          <p className="muted">A rough number is fine. You can change it later.</p>
          <label className="field">
            <span>Total startup budget</span>
            <div className="money">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={p.startupBudget ?? ""}
                onChange={(e) => set({ startupBudget: num(e.target.value) })}
              />
            </div>
          </label>
          <label className="field">
            <span>How much of that for door hangers?</span>
            <div className="money">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={p.hangerBudget ?? ""}
                onChange={(e) => set({ hangerBudget: num(e.target.value) })}
              />
            </div>
          </label>
          <div className="card accent small">
            <strong>We suggest 10,000 door hangers to start.</strong> That&apos;s 500 a day for the first 20 work days.
            Get a printer&apos;s quote for 10,000 to see what it costs.
          </div>
        </>
      );
      break;
    case 5:
      body = (
        <>
          <h1>When can you work?</h1>
          <label className="field">
            <span>Hours per day</span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={14}
              value={p.hoursPerDay ?? ""}
              onChange={(e) => set({ hoursPerDay: num(e.target.value) })}
            />
          </label>
          <span style={{ fontWeight: 700 }}>Which days?</span>
          <div className="chips" style={{ marginTop: 6 }}>
            {[1, 2, 3, 4, 5, 6, 0].map((d) => {
              const on = p.workDays.includes(d);
              return (
                <button
                  key={d}
                  className="chip"
                  aria-pressed={on}
                  onClick={() => set({ workDays: on ? p.workDays.filter((x) => x !== d) : [...p.workDays, d] })}
                >
                  {DAY_NAMES[d]}
                </button>
              );
            })}
          </div>
          <p className="muted small" style={{ marginTop: 12 }}>
            The plan works best with 5 hours or more: hanging in the morning and knocking from 4 to 7pm.
          </p>
        </>
      );
      canNext = p.workDays.length > 0;
      break;
    case 6:
      body = (
        <>
          <h1>How do you get around?</h1>
          {TRAVEL.map((t) => (
            <button key={t.id} className="choice" aria-pressed={p.travel === t.id} onClick={() => set({ travel: t.id })}>
              <strong>{t.label}</strong>
              {t.hint && <span className="muted small">{t.hint}</span>}
            </button>
          ))}
          <label className="field">
            <span>Longest drive or ride to an area, in minutes, one way</span>
            <input
              type="number"
              inputMode="numeric"
              min={5}
              value={p.rangeMinutes ?? ""}
              onChange={(e) => set({ rangeMinutes: num(e.target.value) })}
            />
          </label>
        </>
      );
      break;
    case 7:
      body = (
        <>
          <h1>Which homes do you want?</h1>
          <p className="muted">Pick the home value you&apos;ll target. Higher-value homes usually spend more on upkeep.</p>
          {TARGETS.map((t) => (
            <button key={t} className="choice" aria-pressed={p.targetHome === t} onClick={() => set({ targetHome: t })}>
              <strong>{t}</strong>
            </button>
          ))}
        </>
      );
      break;
    case 8:
      body = (
        <>
          <h1>Where are you now?</h1>
          {STAGES.map((s) => (
            <button key={s.id} className="choice" aria-pressed={p.stage === s.id} onClick={() => set({ stage: s.id })}>
              <strong>{s.label}</strong>
              <span className="muted small">{s.hint}</span>
            </button>
          ))}
        </>
      );
      break;
    case 9:
      body = (
        <>
          <h1>When is Day 1?</h1>
          <p className="muted">The first day you&apos;ll hang 500 door hangers. Give yourself time to finish the roadmap first.</p>
          <label className="field">
            <span>Day 1</span>
            <input type="date" value={p.startDate} onChange={(e) => set({ startDate: e.target.value })} />
          </label>
          {!p.useSamplePlan && (
            <div className="card gold small">
              For now the app shows a sample route from Kyle, TX. A route built for {p.homeBase || "your area"} comes in
              the next version.
            </div>
          )}
        </>
      );
      canNext = !!p.startDate;
      break;
  }

  return (
    <div className="onb">
      {step > 0 && (
        <>
          <div className="row between">
            <button className="btn ghost" onClick={back}>
              ← Back
            </button>
            <span className="muted small">
              {step} of {TOTAL}
            </span>
          </div>
          <div className="dots" aria-hidden>
            {Array.from({ length: TOTAL }, (_, i) => (
              <span key={i} className={i < step ? "on" : ""} />
            ))}
          </div>
        </>
      )}
      <div className="grow">{body}</div>
      {step > 0 && (
        <button className="btn primary block big" disabled={!canNext} onClick={next} style={{ marginTop: 16 }}>
          {step === TOTAL ? "Finish" : "Next"}
        </button>
      )}
    </div>
  );
}

function AddService({ onAdd }: { onAdd: (s: string) => void }) {
  const [v, setV] = useState("");
  return (
    <form
      className="row"
      style={{ marginTop: 14 }}
      onSubmit={(e) => {
        e.preventDefault();
        if (v.trim()) onAdd(v.trim());
        setV("");
      }}
    >
      <input type="text" placeholder="Add your own" value={v} onChange={(e) => setV(e.target.value)} />
      <button className="btn" type="submit">
        Add
      </button>
    </form>
  );
}
