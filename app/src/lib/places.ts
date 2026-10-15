// Turns a typed home base into a town and state, and picks the right town from search results.

const STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California", CO: "Colorado", CT: "Connecticut",
  DE: "Delaware", DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

export interface Place {
  latitude: number;
  longitude: number;
  admin1?: string;
}

/** "Kyle, TX", "Kyle, Texas" or "123 Main St, Kyle, TX 78640" -> { city: "Kyle", state: "texas" }. */
export function parseHomeBase(homeBase: string): { city: string; state: string } {
  const parts = homeBase.split(",").map((x) => x.trim()).filter(Boolean);
  if (parts.length < 2) return { city: parts[0] ?? "", state: "" };
  const last = parts[parts.length - 1].replace(/\d{5}(-\d{4})?/g, "").trim();
  const state = (STATES[last.toUpperCase()] ?? last).toLowerCase();
  return { city: parts[parts.length - 2], state };
}

/** The search result in the right state, or null rather than a same-named town elsewhere. */
export function pickPlace(homeBase: string, results: Place[]): Place | null {
  if (!results?.length) return null;
  const { state } = parseHomeBase(homeBase);
  if (!state) return results[0];
  return results.find((r) => r.admin1?.toLowerCase() === state) ?? null;
}
