"use client";

import { update } from "@/lib/store";
import type { AppData, DailyNumbers } from "@/lib/types";

export const EMPTY_NUMBERS: DailyNumbers = { hangers: 0, knocked: 0, conversations: 0, quotes: 0, sales: 0 };

const FIELDS: { key: keyof DailyNumbers; label: string; step: number }[] = [
  { key: "hangers", label: "Hangers hung", step: 100 },
  { key: "knocked", label: "Doors knocked", step: 1 },
  { key: "conversations", label: "Conversations", step: 1 },
  { key: "quotes", label: "Quotes given", step: 1 },
  { key: "sales", label: "Sales (jobs booked)", step: 1 },
];

/** Big +/- buttons for one day's numbers. Saves as you tap. */
export function NumbersForm({ data, date }: { data: AppData; date: string }) {
  const n = data.numbers[date] ?? EMPTY_NUMBERS;
  const set = (key: keyof DailyNumbers, value: number) =>
    update((d) => {
      d.numbers[date] = { ...EMPTY_NUMBERS, ...d.numbers[date], [key]: Math.max(0, Math.round(value) || 0) };
    });

  return (
    <div>
      {FIELDS.map((f) => (
        <div className="stepper" key={f.key}>
          <span style={{ fontWeight: 600 }}>{f.label}</span>
          <div className="ctrl">
            <button aria-label={`Less ${f.label}`} onClick={() => set(f.key, n[f.key] - f.step)} className={f.step > 1 ? "wide" : ""}>
              {f.step > 1 ? `−${f.step}` : "−"}
            </button>
            <input
              type="number"
              inputMode="numeric"
              aria-label={f.label}
              value={n[f.key]}
              onFocus={(e) => e.target.select()}
              onChange={(e) => set(f.key, Number(e.target.value))}
            />
            <button aria-label={`More ${f.label}`} onClick={() => set(f.key, n[f.key] + f.step)} className={f.step > 1 ? "wide" : ""}>
              {f.step > 1 ? `+${f.step}` : "+"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export function totals(data: AppData, filter?: (date: string) => boolean): DailyNumbers {
  const t = { ...EMPTY_NUMBERS };
  for (const [date, n] of Object.entries(data.numbers)) {
    if (filter && !filter(date)) continue;
    for (const k of Object.keys(t) as (keyof DailyNumbers)[]) t[k] += n[k] ?? 0;
  }
  return t;
}
