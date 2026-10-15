import { DAY_NAMES } from "./dates";

const BYDAY = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

/** Calendar file with repeating reminders on work days (phone calendars alert at each one). */
export function remindersIcs(workDays: number[], startDate: string): string {
  const days = (workDays.length ? workDays : [1, 2, 3, 4, 5]).map((d) => BYDAY[d]).join(",");
  const date = startDate.replace(/-/g, "");
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  const events = [
    ["0815", "0830", "Load hangers and go (Spur)", "5 bundles of 100. Start hanging at 8:30."],
    ["1545", "1600", "Knocking time (Spur)", "Knock yesterday's streets from 4 to 7pm."],
    ["1915", "1930", "Enter today's numbers (Spur)", "Open Spur and log today's numbers."],
  ];
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Spur//Reminders//EN", "CALSCALE:GREGORIAN"];
  events.forEach(([start, end, title, desc], i) => {
    lines.push(
      "BEGIN:VEVENT",
      `UID:tenk-${i}-${date}@10khomes`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${date}T${start}00`,
      `DTEND:${date}T${end}00`,
      `RRULE:FREQ=WEEKLY;BYDAY=${days}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${desc}`,
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      `DESCRIPTION:${title}`,
      "TRIGGER:PT0M",
      "END:VALARM",
      "END:VEVENT"
    );
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export const workDayNames = (d: number[]) => d.map((x) => DAY_NAMES[x]).join(", ");
