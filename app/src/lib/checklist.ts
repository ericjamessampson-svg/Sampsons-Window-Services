export interface CheckItem {
  id: string;
  text: string;
}

export interface CheckSection {
  id: string;
  title: string;
  time: string;
  /** Hour (24h) when this section usually starts; used to suggest "do this now". */
  startsAt: number;
  items: CheckItem[];
}

export function dailyChecklist(target = 500): CheckSection[] {
  const bundles = Math.max(1, Math.ceil(target / 100));
  return [
    {
      id: "before",
      title: "Before you leave",
      time: "By 8:15am",
      startsAt: 0,
      items: [
        { id: "load", text: `Load ${bundles} bundles of 100 hangers, plus a few spares` },
        { id: "battery", text: "Scooter battery charged, and the scooter in the car" },
        { id: "phone", text: "Phone charged, and a battery pack" },
        { id: "water", text: "Water, snacks, sunscreen" },
        { id: "route", text: "Look at today's route and where to start" },
      ],
    },
    {
      id: "hanging",
      title: "Hanging",
      time: "8:30am to 1:30pm (2:30 at the latest)",
      startsAt: 8,
      items: Array.from({ length: bundles }, (_, i) => ({
        id: `bundle${i + 1}`,
        text: `Bundle ${i + 1} of ${bundles}: 100 homes`,
      })),
    },
    {
      id: "midday",
      title: "Midday",
      time: "About 2:00 to 4:00pm",
      startsAt: 13,
      items: [
        { id: "callback", text: "Call or text back everyone who reached out, within 1 hour if you can" },
        { id: "quotes", text: "Give quotes and do any booked jobs" },
        { id: "eat", text: "Eat, and recharge the scooter" },
      ],
    },
    {
      id: "knocking",
      title: "Knocking",
      time: "4:00 to 7:00pm",
      startsAt: 16,
      items: [
        { id: "drive", text: "Go to yesterday's streets" },
        { id: "knock", text: "Knock every home that got a hanger (use the skip list)" },
        { id: "script", text: "Use the script. Ask every person for a quote." },
        { id: "notes", text: "Write down every quote and every \"come back later\"" },
      ],
    },
    {
      id: "wrap",
      title: "Wrap-up",
      time: "After 7:00pm",
      startsAt: 19,
      items: [
        { id: "numbers", text: "Enter today's numbers" },
        { id: "followup", text: "Text every quote you gave today" },
        { id: "restock", text: "Count and load tomorrow's hangers" },
        { id: "charge", text: "Charge the scooter and your phone" },
      ],
    },
  ];
}

export const SKIP_HOUSES: { title: string; why: string }[] = [
  { title: "No Soliciting sign", why: "Always respect it. Don't hang, don't knock." },
  { title: "Gated driveway", why: "You can't reach the door. Move on." },
  { title: "For sale sign", why: "The owner is leaving, not investing in the home." },
  { title: "Looks vacant", why: "Overgrown yard, piled-up mail, no curtains. Nobody to call you." },
  { title: "Rental", why: "Usually the owner pays for upkeep, not the person living there." },
  { title: "New build or under construction", why: "Nobody lives there yet, or the builder handles it." },
  { title: "A competitor's hanger already on the door", why: "Don't cover it up. Come back next round." },
];
