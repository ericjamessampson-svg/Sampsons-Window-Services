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
  /** Dollars from sales that day. */
  revenue: number;
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
  /** milestone id -> date the owner marked it reached (for ones the app can't count) */
  milestonesDone: Record<string, string>;
  /** address -> map position (null when the address wasn't found) */
  geocache: Record<string, { lat: number; lon: number } | null>;
}
