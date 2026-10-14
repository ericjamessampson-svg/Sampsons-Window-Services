"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { EMPTY_NUMBERS } from "@/components/NumbersForm";
import { ymd } from "@/lib/dates";
import { update, useData } from "@/lib/store";
import type { DailyNumbers } from "@/lib/types";

export default function KnockPage() {
  return (
    <AppShell narrow>
      <Knock />
    </AppShell>
  );
}

type Key = keyof DailyNumbers;

const BIG: { label: string; keys: Key[]; cls: string }[] = [
  { label: "Knocked", keys: ["knocked"], cls: "k1" },
  { label: "Talked", keys: ["conversations"], cls: "k2" },
  { label: "Quote", keys: ["quotes"], cls: "k3" },
  { label: "Sale", keys: ["sales"], cls: "k4" },
];

/** Big one-thumb counters for the 4 to 7pm knocking block. */
function Knock() {
  const data = useData()!;
  const today = ymd(new Date());
  const n = { ...EMPTY_NUMBERS, ...data.numbers[today] };
  const [last, setLast] = useState<Key[][]>([]);
  const [revenue, setRevenue] = useState("");

  const bump = (keys: Key[], by = 1) =>
    update((d) => {
      const cur = { ...EMPTY_NUMBERS, ...d.numbers[today] };
      for (const k of keys) cur[k] = Math.max(0, (cur[k] || 0) + by);
      d.numbers[today] = cur;
    });

  const tap = (keys: Key[]) => {
    bump(keys);
    setLast((l) => [...l.slice(-19), keys]);
    navigator.vibrate?.(10);
  };

  return (
    <div>
      <h1>Knock counter</h1>
      <p className="muted small">Tap Knocked at every door. Then Talked if someone answered, and Quote or Sale if you got one.</p>

      <div className="knock-grid">
        {BIG.map((b) => (
          <button key={b.label} className={`knock-btn ${b.cls}`} onClick={() => tap(b.keys)}>
            <span className="knock-num">{n[b.keys[0]]}</span>
            <span>+1 {b.label}</span>
          </button>
        ))}
      </div>

      <div className="card">
        <h3>Someone called or texted from a hanger?</h3>
        <div className="row">
          <button className="btn block" onClick={() => tap(["quotes", "quotesHanger"])}>
            +1 Quote ({n.quotesHanger})
          </button>
          <button className="btn block" onClick={() => tap(["sales", "salesHanger"])}>
            +1 Sale ({n.salesHanger})
          </button>
        </div>
      </div>

      <div className="card">
        <h3>Add revenue from a sale</h3>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            const v = Math.round(Number(revenue));
            if (v > 0) {
              bump(["revenue"], v);
              setRevenue("");
            }
          }}
        >
          <div className="money" style={{ flex: 1 }}>
            <input type="number" inputMode="numeric" placeholder="Job price" value={revenue} onChange={(e) => setRevenue(e.target.value)} />
          </div>
          <button className="btn primary" type="submit">
            Add
          </button>
        </form>
        <p className="muted small" style={{ margin: "8px 0 0" }}>
          Today: ${n.revenue.toLocaleString()}
        </p>
      </div>

      <button
        className="btn block"
        disabled={last.length === 0}
        onClick={() => {
          const keys = last[last.length - 1];
          bump(keys, -1);
          setLast((l) => l.slice(0, -1));
        }}
      >
        Undo last tap
      </button>
    </div>
  );
}
