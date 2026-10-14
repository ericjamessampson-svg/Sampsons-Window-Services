// Sample 10K Homes plan for a window cleaner based in Kyle, TX.
// Home counts come from public sources (listed per zone). Where sources
// disagree we show the range; where nothing could be confirmed we say so.
// Researched October 2026. Phase 2 replaces this with AI-built plans that
// pull counts from public data for any US location.

export interface Source {
  label: string;
  url: string;
}

export interface Zone {
  id: string;
  name: string;
  area: string;
  /** Search text used to place this zone on the map. */
  geoQuery: string;
  /** What published sources say about the number of homes. */
  homeCount: string;
  /** Low end of published counts, or null when no count was confirmed. */
  confirmedLow: number | null;
  days: number;
  entry: string;
  /** Street names seen in public listings for this zone. Check on a map. */
  knownStreets: string[];
  notes: string;
  sources: Source[];
}

export const ZONES: Zone[] = [
  {
    id: "6creeks",
    name: "6 Creeks (large-lot side)",
    area: "Kyle",
    geoQuery: "6 Creeks, Kyle, TX",
    homeCount:
      "Whole community: about 2,000–2,100 homes at build-out, most on lots under 1/5 acre. The number of homes on the larger 70–80 ft lots was not found.",
    confirmedLow: null,
    days: 1,
    entry: "Off Old Stagecoach Rd (check on a map)",
    knownStreets: ["Farmer Brook Ln", "Tinctoria Creek Dr"],
    notes:
      "Closest zone to home, so it's an easy Day 1. If the large-lot streets run out before 500 homes, finish on the next-largest lots nearby.",
    sources: [
      { label: "Builder Online (Trendmaker press release)", url: "https://www.builderonline.com/?p=37065" },
      { label: "Austin Real Estate Homes Blog: 6 Creeks", url: "https://austinrealestatehomesblog.com/kyle/6_creeks" },
    ],
  },
  {
    id: "circlec",
    name: "Circle C Ranch",
    area: "Southwest Austin",
    geoQuery: "Circle C Ranch, Austin, TX",
    homeCount: "About 4,000 single-family homes (LRG Realty, 2025) to 5,620+ (Wikipedia). Sources disagree.",
    confirmedLow: 4000,
    days: 8,
    entry: "Slaughter Ln at La Crosse Ave or Escarpment Blvd (check on a map)",
    knownStreets: [],
    notes:
      "Big zone: plan one subdivision per day. Subdivisions named in a local guide: Circle C West, Park Place, Muirfield, Hielscher, Vintage Place, Alta Mira, Meridian, Avana, Grey Rock Ridge.",
    sources: [
      { label: "LRG Realty: 2025 Guide to Circle C", url: "https://lrgrealty.com/lrg-blog/2025-guide-circle-c-in-austin-texas" },
      { label: "Wikipedia: Circle C Ranch", url: "https://en.wikipedia.org/wiki/Circle_C_Ranch" },
      { label: "Moreland: Circle C Ranch guide", url: "https://moreland.com/blog/circle-c-ranch-neighborhood-guide" },
    ],
  },
  {
    id: "shadyhollow",
    name: "Shady Hollow",
    area: "Southwest Austin",
    geoQuery: "Shady Hollow, TX",
    homeCount:
      "About 1,500 houses (neighborhood guide). The 2020 Census counted 1,752 households in the Shady Hollow census area.",
    confirmedLow: 1500,
    days: 3,
    entry: "Brodie Ln (check on a map)",
    knownStreets: [],
    notes: "Older homes with mature trees. Some sections are newer (1990s–2000s).",
    sources: [
      { label: "Austin Real Estate Homes Blog: Shady Hollow", url: "https://www.austinrealestatehomesblog.com/southwest-austin/shady-hollow/" },
      { label: "Wikipedia: Shady Hollow, Texas", url: "https://en.wikipedia.org/wiki/Shady_Hollow,_Texas" },
    ],
  },
  {
    id: "vwo",
    name: "Village at Western Oaks",
    area: "Southwest Austin",
    geoQuery: "Village at Western Oaks, Austin, TX",
    homeCount: "About 1,600 homes (neighborhood guides).",
    confirmedLow: 1600,
    days: 3,
    entry: "Slaughter Ln or Escarpment Blvd (check on a map)",
    knownStreets: ["Korth Dr", "Marchmont Ln", "Farmdale Cv"],
    notes: "Built from the early 1980s to 2005. Neighbors Shady Hollow and Circle C, so knocking trips stay short.",
    sources: [
      { label: "Austin Real Estate Homes Blog: Village at Western Oaks", url: "https://www.austinrealestatehomesblog.com/southwest-austin/village-at-western-oaks/" },
      { label: "Search Austin Homes: Village at Western Oaks", url: "https://www.searchaustinhomes.com/neighborhood/southwest-austin/village-at-western-oaks/" },
    ],
  },
  {
    id: "belterra",
    name: "Belterra",
    area: "Dripping Springs",
    geoQuery: "Belterra, Hays County, TX",
    homeCount:
      "About 3,000 homes planned at build-out (LRG Realty, 2026). That is a projection; the number already built was not found.",
    confirmedLow: null,
    days: 2,
    entry: "US 290 at Nutty Brown Rd. Amenity center listed at 801 Belterra Dr (older source).",
    knownStreets: [],
    notes: "Some sections have big lots. Spend your 2 days on the sections with the most homes close together.",
    sources: [
      { label: "LRG Realty: Belterra 2026 guide", url: "https://lrgrealty.com/lrg-blog/belterra-dripping-springs-neighborhood-guide/" },
      { label: "Austin Real Estate Homes Blog: Belterra", url: "https://www.austinrealestatehomesblog.com/southwest_austin/belterra" },
    ],
  },
  {
    id: "headwaters",
    name: "Headwaters",
    area: "Dripping Springs",
    geoQuery: "Headwaters Boulevard, Dripping Springs, TX",
    homeCount: "About 1,000–1,100 homes at full build-out (listings). Some lots are still being built.",
    confirmedLow: 1000,
    days: 2,
    entry: "Headwaters Blvd (check on a map)",
    knownStreets: ["Headwaters Blvd", "Kibo Rdg"],
    notes: "Skip streets that are still under construction (new builds).",
    sources: [
      { label: "Austin Real Estate Homes Blog: Headwaters", url: "https://austinrealestatehomesblog.com/dripping_springs/headwaters" },
      { label: "Endeavor Real Estate: Headwaters", url: "https://www.endeavor-re.com/properties/headwaters/" },
    ],
  },
  {
    id: "caliterra",
    name: "Caliterra",
    area: "Dripping Springs",
    geoQuery: "Caliterra Parkway, Dripping Springs, TX",
    homeCount:
      "About 575 homes built of 616 first planned, plus 232 more in The Ranch at Caliterra (Luxe Homes Austin). Another source says 500–600 total.",
    confirmedLow: 575,
    days: 1,
    entry: "Caliterra Pkwy, off RM 12 at the northwest corner of RM 12 and RM 150",
    knownStreets: ["Caliterra Pkwy", "Soaring Hill Rd"],
    notes: "The Ranch section is new in 2026. Skip homes still being built.",
    sources: [
      { label: "Luxe Homes Austin: Caliterra second phase", url: "https://www.luxehomesaustin.com/blog/caliterra-in-dripping-springs-breaks-ground-on-second-phase.html" },
      { label: "The Mangin Team: The Ranch at Caliterra", url: "https://www.themanginteam.com/the-ranch-at-caliterra-whats-coming-to-dripping-springs-in-2026/" },
      { label: "Austin Real Estate Homes Blog: Caliterra", url: "https://austinrealestatehomesblog.com/dripping_springs/caliterra" },
    ],
  },
];

export const HOMES_PER_DAY = 500;
export const PLAN_DAYS = 20;
export const GOAL_HOMES = HOMES_PER_DAY * PLAN_DAYS;

export interface PlanDay {
  day: number; // 1..20
  zone: Zone;
  part: number; // which day inside this zone
  ofParts: number;
  target: number;
}

export function buildPlan(zones: Zone[] = ZONES): PlanDay[] {
  const days: PlanDay[] = [];
  for (const zone of zones) {
    for (let p = 1; p <= zone.days; p++) {
      days.push({ day: days.length + 1, zone, part: p, ofParts: zone.days, target: HOMES_PER_DAY });
    }
  }
  return days.slice(0, PLAN_DAYS);
}

export const SAMPLE_PLAN = buildPlan();

/** Total of the low-end published counts we could confirm. */
export const CONFIRMED_HOMES = ZONES.reduce((s, z) => s + (z.confirmedLow ?? 0), 0);

/** Plan day for a work-day number (repeats every 20 days: month 2 = same homes). */
export function planDayFor(dayNumber: number): { round: number; day: PlanDay } {
  const idx = (dayNumber - 1) % PLAN_DAYS;
  return { round: Math.floor((dayNumber - 1) / PLAN_DAYS) + 1, day: SAMPLE_PLAN[idx] };
}
