export type TradeId = "window" | "pressure" | "lawn" | "pest" | "gutter" | "house" | "other";
export type Travel = "car" | "car_scooter" | "scooter" | "bike" | "walking";
export type Stage = "idea" | "equipment" | "customers";

export interface Profile {
  trade: TradeId;
  tradeOther: string;
  services: string[];
  homeBase: string;
  startupBudget: number | null;
  hangerBudget: number | null;
  hoursPerDay: number | null;
  /** 0 = Sunday ... 6 = Saturday */
  workDays: number[];
  travel: Travel;
  rangeMinutes: number | null;
  targetHome: string;
  stage: Stage;
  /** YYYY-MM-DD, Day 1 of the 10K Homes plan */
  startDate: string;
  /** true when this profile uses the Kyle, TX sample plan */
  useSamplePlan: boolean;
}

export interface StepState {
  done?: string; // date finished
  checks?: Record<string, boolean>;
}

export interface PriceRow {
  service: string;
  price: string;
  unit: string;
}

export interface DayEdit {
  streets?: string;
  status?: "todo" | "done" | "skipped";
}

export interface DailyNumbers {
  hangers: number;
  knocked: number;
  conversations: number;
  quotes: number;
  sales: number;
}

export type JobKind = "job" | "quote";

/** A booked cleaning job or a quote visit on the schedule. */
export interface Job {
  id: string;
  kind: JobKind;
  customer: string;
  phone: string;
  address: string;
  service: string;
  price: number | null;
  notes: string;
  date: string; // YYYY-MM-DD
  start: string; // HH:MM, 24h
  minutes: number;
  status: "booked" | "done" | "canceled";
}

/** Start and end of a hanging or knocking block, HH:MM. */
export interface BlockTimes {
  start: string;
  end: string;
}

export interface AppData {
  version: 1;
  profile: Profile | null;
  business: { name: string; phone: string; offer: string };
  roadmap: Record<string, StepState>;
  prices: PriceRow[];
  hangerQuote: { qty: number | null; total: number | null };
  planEdits: Record<number, DayEdit>;
  /** date (YYYY-MM-DD) -> checklist item id -> checked */
  checklists: Record<string, Record<string, boolean>>;
  numbers: Record<string, DailyNumbers>;
  jobs: Job[];
  /** date -> moved hanging/knocking block times for that day */
  blockShifts: Record<string, { hang?: BlockTimes; knock?: BlockTimes }>;
  /** address -> map position (null when the address wasn't found) */
  geocache: Record<string, { lat: number; lon: number } | null>;
}
