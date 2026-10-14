import type { TradeId } from "./types";

export interface Objection {
  q: string;
  a: string;
}

export interface Trade {
  id: TradeId;
  label: string;
  /** What you do, as in "we're doing ___ on your street". */
  verb: string;
  services: string[];
  equipment: string[];
  /** Short question to size the job at the door. */
  sizeQuestion: string;
  /** Extra warning shown on the register step. */
  licenseNote?: string;
  objections?: Objection[];
}

export const TRADES: Trade[] = [
  {
    id: "window",
    label: "Window cleaning",
    verb: "window cleaning",
    services: ["Outside windows", "Inside windows", "Screens", "Tracks and sills", "Hard-water stain removal", "Skylights"],
    equipment: [
      "Squeegees (a few sizes) and rubber",
      "Scrubber (strip washer)",
      "Bucket and window soap",
      "Scraper with spare blades",
      "Microfiber towels",
      "Extension pole",
      "Ladder and ladder stabilizer",
      "Tool belt or holster",
      "Drop cloths and shoe covers for inside work",
      "Optional later: water-fed pole with pure-water filter",
    ],
    sizeQuestion: "About how many windows do you have, and is it one story or two?",
    objections: [
      {
        q: "How much is it?",
        a: "Most homes on this street run about [your price range]. I can give you an exact price in two minutes if I count the windows. Want me to?",
      },
      {
        q: "I clean them myself.",
        a: "That's great. A lot of folks do the inside and let us handle the outside and the high second-story ones. Want a price for just those?",
      },
      {
        q: "Not right now.",
        a: "No problem. I'm on your street again on [day]. Want me to pencil you in, or text you a price so you have it?",
      },
      {
        q: "I need to talk to my spouse.",
        a: "Of course. What's the best number to text the quote to? Then you can both look at it tonight.",
      },
      {
        q: "We already have someone.",
        a: "Glad you're taken care of. If they ever can't make it, I'm local and in the area every month. Can I leave my number?",
      },
    ],
  },
  {
    id: "pressure",
    label: "Pressure washing",
    verb: "pressure washing",
    services: ["Driveway and sidewalks", "House wash (soft wash)", "Patio and pool deck", "Fence", "Roof wash"],
    equipment: [
      "Pressure washer",
      "Surface cleaner for flat concrete",
      "High-pressure hose and quick-connects",
      "Nozzle set",
      "Soap injector or soft-wash pump",
      "Cleaning chemicals with safety data sheets",
      "Safety gear: glasses, gloves, boots",
      "Water hose and garden hose adapters",
    ],
    sizeQuestion: "Is it just the driveway, or the house and patio too?",
  },
  {
    id: "lawn",
    label: "Lawn care",
    verb: "lawn care",
    services: ["Mowing", "Edging and trimming", "Leaf cleanup", "Bed weeding", "Hedge trimming"],
    equipment: ["Mower", "String trimmer", "Edger", "Leaf blower", "Gas cans", "Way to haul it (truck or trailer)", "Safety gear: glasses, ear protection, boots"],
    sizeQuestion: "Is it the front and back yard, or just the front?",
  },
  {
    id: "pest",
    label: "Pest control",
    verb: "pest control",
    services: ["General pest (quarterly)", "Ants", "Mosquitoes", "Rodents", "Termite inspection"],
    equipment: ["Backpack or hand sprayer", "Duster", "Bait and stations", "Safety gear and respirator", "Flashlight", "Labels and safety data sheets for every product"],
    sizeQuestion: "What are you seeing most, and about how big is the house?",
    licenseNote:
      "Most states require a license to apply pesticides for pay. Check with your state's agriculture or pest control board before your first job.",
  },
  {
    id: "gutter",
    label: "Gutter cleaning",
    verb: "gutter cleaning",
    services: ["Gutter cleaning", "Downspout flush", "Gutter guard install", "Roof debris removal"],
    equipment: ["Ladder and ladder stabilizer", "Gutter scoop", "Gloves", "Buckets or tarp", "Hose with spray wand", "Optional: blower gutter attachment"],
    sizeQuestion: "Is it a one-story or two-story home?",
  },
  {
    id: "house",
    label: "House cleaning",
    verb: "house cleaning",
    services: ["Standard clean", "Deep clean", "Move-in / move-out", "Recurring (weekly, every 2 weeks, monthly)"],
    equipment: ["Vacuum", "Mop and bucket", "Microfiber cloths", "Cleaning caddy", "Cleaning products", "Scrub brushes", "Gloves"],
    sizeQuestion: "About how many bedrooms and bathrooms?",
  },
  {
    id: "other",
    label: "Something else",
    verb: "home services",
    services: [],
    equipment: ["List the tools you need for your first job"],
    sizeQuestion: "Can you tell me a little about what you need done?",
  },
];

export const GENERIC_OBJECTIONS: Objection[] = [
  { q: "How much is it?", a: "It depends on the home. I can give you an exact price in two minutes. Want me to take a quick look?" },
  { q: "We do it ourselves.", a: "Totally fair. Most of my customers did too, until they wanted their weekends back. Want a price just to compare?" },
  { q: "Not right now.", a: "No problem. I'm on your street again on [day]. Want me to text you a price so you have it?" },
  { q: "I need to talk to my spouse.", a: "Of course. What's the best number to text the quote to, so you can both look at it tonight?" },
  { q: "We already have someone.", a: "Glad you're taken care of. If they ever can't make it, I'm local and here every month. Can I leave my number?" },
];

export function getTrade(id: TradeId | undefined): Trade {
  return TRADES.find((t) => t.id === id) ?? TRADES[TRADES.length - 1];
}
