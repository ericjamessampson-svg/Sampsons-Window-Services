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
}
