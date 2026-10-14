"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, LayerGroup } from "leaflet";
import { blocksFor, niceTime } from "@/lib/schedule";
import { update } from "@/lib/store";
import type { AppData } from "@/lib/types";

export interface Stop {
  key: string; // text we search the map for
  label: string;
  time: string;
  kind: "hang" | "knock";
}

export function stopsFor(data: AppData, date: string): Stop[] {
  return blocksFor(data, date).map((b) => ({
    key: b.planDay.zone.geoQuery,
    label: b.title,
    time: b.start,
    kind: b.kind,
  }));
}

// OpenStreetMap's free address search allows about 1 lookup per second.
let queue: Promise<void> = Promise.resolve();
const pending = new Set<string>();

function geocode(q: string) {
  if (pending.has(q)) return;
  pending.add(q);
  queue = queue.then(async () => {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=us&q=${encodeURIComponent(q)}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const hits = (await res.json()) as { lat: string; lon: string }[];
      const hit = hits[0] ? { lat: Number(hits[0].lat), lon: Number(hits[0].lon) } : null;
      update((d) => void (d.geocache[q] = hit));
    } catch {
      // offline: try again next time the map opens
    } finally {
      pending.delete(q);
      await new Promise((r) => setTimeout(r, 1100));
    }
  });
}

const COLORS: Record<Stop["kind"], string> = { hang: "#157a5a", knock: "#c77700" };

/** Map of one day's hanging and knocking areas, numbered in time order. */
export function DayMap({ data, date, height = 360 }: { data: AppData; date: string; height?: number }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const [ready, setReady] = useState(false);
  const stops = stopsFor(data, date);
  const placed = stops.map((s, i) => ({ ...s, n: i + 1, pos: data.geocache[s.key] })).filter((s) => s.pos);
  const missing = stops.filter((s) => data.geocache[s.key] === null);

  useEffect(() => {
    for (const s of stops) if (!(s.key in data.geocache)) geocode(s.key);
  });

  useEffect(() => {
    let cancelled = false;
    import("leaflet").then((L) => {
      if (cancelled || !el.current || map.current) return;
      map.current = L.map(el.current, { zoomControl: true, attributionControl: true }).setView([30.15, -97.9], 10);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map.current);
      layer.current = L.layerGroup().addTo(map.current);
      setReady(true);
    });
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
  }, []);

  const sig = JSON.stringify(placed.map((p) => [p.key, p.pos, p.kind]));
  useEffect(() => {
    if (!ready) return;
    import("leaflet").then((L) => {
      const m = map.current;
      const g = layer.current;
      if (!m || !g) return;
      g.clearLayers();
      const pts: [number, number][] = [];
      const seen = new Map<string, number[]>();
      for (const s of placed) seen.set(s.key, [...(seen.get(s.key) ?? []), s.n]);
      placed.forEach((s) => {
        const ll: [number, number] = [s.pos!.lat, s.pos!.lon];
        pts.push(ll);
        const nums = seen.get(s.key)!;
        if (nums[0] !== s.n) return; // already pinned this place
        L.marker(ll, {
          icon: L.divIcon({
            className: "",
            html: `<div class="map-pin" style="background:${COLORS[s.kind]};${nums.length > 1 ? "width:auto;padding:0 6px;border-radius:14px" : ""}">${nums.join(",")}</div>`,
            iconSize: [nums.length > 1 ? 40 : 28, 28],
            iconAnchor: [14, 14],
          }),
        })
          .bindPopup(
            placed
              .filter((x) => x.key === s.key)
              .map((x) => `<strong>${x.n}. ${escapeHtml(x.label)}</strong> ${niceTime(x.time)}`)
              .join("<br>")
          )
          .addTo(g);
      });
      if (pts.length > 1) L.polyline(pts, { color: "#157a5a", weight: 3, opacity: 0.6, dashArray: "6 6" }).addTo(g);
      if (pts.length === 1) m.setView(pts[0], 14);
      else if (pts.length > 1) m.fitBounds(L.latLngBounds(pts), { padding: [30, 30] });
    });
  }, [ready, sig]);

  return (
    <div>
      <div ref={el} className="day-map" style={{ height }} />
      <ol className="stop-list">
        {stops.map((s) => (
          <li key={s.key + s.time}>
            <span className="stop-dot" style={{ background: COLORS[s.kind] }} />
            <span>
              <strong>{niceTime(s.time)}</strong> {s.label}
              {data.geocache[s.key] === null && <span className="muted small"> (not found on the map)</span>}
            </span>
          </li>
        ))}
        {stops.length === 0 && <li className="muted">Day off. No route this day.</li>}
      </ol>
      {missing.length > 0 && <p className="muted small">Map spots are approximate. Use the start point listed on the Plan screen.</p>}
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
