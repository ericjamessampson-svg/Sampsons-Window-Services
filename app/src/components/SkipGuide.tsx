"use client";

import { useState } from "react";
import { SKIP_HOUSES } from "@/lib/checklist";

export function SkipList() {
  return (
    <ul className="tight" style={{ listStyle: "none", padding: 0 }}>
      {SKIP_HOUSES.map((s) => (
        <li key={s.title} style={{ padding: "8px 0", borderBottom: "1px solid var(--line)" }}>
          <strong>{s.title}</strong>
          <div className="muted small">{s.why}</div>
        </li>
      ))}
    </ul>
  );
}

/** Button that opens the "skip these houses" guide. */
export function SkipGuideButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn block" onClick={() => setOpen(true)}>
        Skip these houses
      </button>
      {open && (
        <div className="sheet-backdrop" onClick={() => setOpen(false)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label="Skip these houses" onClick={(e) => e.stopPropagation()}>
            <div className="row between">
              <h2 style={{ margin: 0 }}>Skip these houses</h2>
              <button className="btn ghost" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <SkipList />
          </div>
        </div>
      )}
    </>
  );
}
