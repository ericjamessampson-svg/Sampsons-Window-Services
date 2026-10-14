"use client";

// All data lives in this browser for Phase 1. Phase 2 swaps this file's
// load/save for Supabase so phone and computer stay in sync.
import { useSyncExternalStore } from "react";
import type { AppData } from "./types";

const KEY = "tenk-homes:v1";

export function emptyData(): AppData {
  return {
    version: 1,
    profile: null,
    business: { name: "", phone: "", offer: "" },
    roadmap: {},
    prices: [],
    hangerQuote: { qty: null, total: null },
    planEdits: {},
    checklists: {},
    numbers: {},
  };
}

let cache: AppData | null = null;
const listeners = new Set<() => void>();

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...emptyData(), ...JSON.parse(raw) };
  } catch {
    // storage blocked or corrupt: start fresh
  }
  return emptyData();
}

function getSnapshot(): AppData {
  if (!cache) cache = load();
  return cache;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = load();
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function setData(next: AppData) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore: data still works for this session
  }
  listeners.forEach((l) => l());
}

/** Change data with a function that edits a copy. */
export function update(fn: (draft: AppData) => void) {
  const draft = structuredClone(getSnapshot());
  fn(draft);
  setData(draft);
}

/** Returns null during the first server render, then the saved data. */
export function useData(): AppData | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
