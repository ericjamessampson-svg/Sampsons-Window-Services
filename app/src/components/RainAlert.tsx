"use client";

import { useEffect, useState } from "react";
import { niceDate } from "@/lib/dates";

interface Forecast {
  date: string;
  chance: number;
}

const KEY = "tenk-homes:rain";

/** Warns when rain is likely on the next work day. Uses the free Open-Meteo forecast. */
export function RainAlert({ homeBase, nextWorkDate }: { homeBase: string; nextWorkDate: string }) {
  const [hit, setHit] = useState<Forecast | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cacheKey = `${homeBase}|${nextWorkDate}`;
        const cached = JSON.parse(sessionStorage.getItem(KEY) || "null");
        let days: Forecast[];
        if (cached?.key === cacheKey && Date.now() - cached.at < 3 * 3600_000) {
          days = cached.days;
        } else {
          const city = homeBase.split(",")[0].trim();
          const geo = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&countryCode=US`
          ).then((r) => r.json());
          const place = geo?.results?.[0];
          if (!place) return;
          const f = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&daily=precipitation_probability_max&timezone=auto&forecast_days=7`
          ).then((r) => r.json());
          days = (f?.daily?.time ?? []).map((d: string, i: number) => ({ date: d, chance: f.daily.precipitation_probability_max[i] ?? 0 }));
          try {
            sessionStorage.setItem(KEY, JSON.stringify({ key: cacheKey, at: Date.now(), days }));
          } catch {}
        }
        const day = days.find((d) => d.date === nextWorkDate);
        if (!cancelled && day && day.chance >= 60) setHit(day);
      } catch {
        // offline or blocked: no alert
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [homeBase, nextWorkDate]);

  if (!hit) return null;
  return (
    <div className="card rain">
      <div className="kicker">Rain alert</div>
      <h3 style={{ marginBottom: 4 }}>
        {hit.chance}% chance of rain {niceDate(hit.date)}
      </h3>
      <p className="small" style={{ margin: 0 }}>
        Wet hangers get tossed. If it rains, knock instead and hang on the next dry day. Forecast from Open-Meteo.
      </p>
    </div>
  );
}
