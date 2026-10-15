"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { emptyData, setData, update, useData } from "@/lib/store";
import { ymd } from "@/lib/dates";
import type { AppData } from "@/lib/types";

export default function SettingsPage() {
  return (
    <AppShell narrow>
      <Settings />
    </AppShell>
  );
}

function Settings() {
  const data = useData()!;
  const p = data.profile!;
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");

  function backup() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `spur-backup-${ymd(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function restore(file: File) {
    try {
      const parsed = JSON.parse(await file.text()) as AppData;
      if (parsed?.version !== 1) throw new Error("bad file");
      setData({ ...emptyData(), ...parsed });
      setMsg("Backup loaded.");
    } catch {
      setMsg("That file isn't a Spur backup.");
    }
  }

  return (
    <div>
      <h1>Settings</h1>

      <div className="card">
        <label className="field">
          <span>Day 1 of the plan</span>
          <input type="date" value={p.startDate} onChange={(e) => e.target.value && update((d) => void (d.profile!.startDate = e.target.value))} />
        </label>
        <label className="field" style={{ marginBottom: 0 }}>
          <span>Door hanger budget</span>
          <div className="money">
            <input
              type="number"
              inputMode="numeric"
              value={p.hangerBudget ?? ""}
              onChange={(e) => update((d) => void (d.profile!.hangerBudget = e.target.value === "" ? null : Math.max(0, Number(e.target.value))))}
            />
          </div>
        </label>
      </div>

      <div className="card">
        <h2>Your answers</h2>
        <p className="muted small">Trade, services, home base, budget, hours, travel, target homes and stage.</p>
        <Link href="/onboarding" className="btn block">
          Change my answers
        </Link>
      </div>

      <div className="card">
        <h2>Back up your data</h2>
        <p className="muted small">
          For now, your data is saved only on this device. Save a backup file now and then. Syncing between phone and
          computer comes in the next version.
        </p>
        <div className="row wrap">
          <button className="btn" onClick={backup}>
            Save a backup
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            Load a backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => e.target.files?.[0] && restore(e.target.files[0])}
          />
        </div>
        {msg && <p className="small" style={{ margin: "8px 0 0" }}>{msg}</p>}
      </div>

      <div className="card">
        <h2>Start over</h2>
        <p className="muted small">Erases everything on this device.</p>
        <button
          className="btn danger"
          onClick={() => {
            if (confirm("Erase all your data on this device? This can't be undone.")) setData(emptyData());
          }}
        >
          Erase my data
        </button>
      </div>
    </div>
  );
}
