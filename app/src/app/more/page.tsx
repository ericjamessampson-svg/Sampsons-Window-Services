"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { QR } from "@/components/QR";
import { bookingUrl } from "@/lib/booking";
import { niceDate } from "@/lib/dates";
import { remindersIcs, workDayNames } from "@/lib/ics";
import { useData } from "@/lib/store";

export default function MorePage() {
  return (
    <AppShell narrow>
      <More />
    </AppShell>
  );
}

const TOOLS = [
  { href: "/knock", title: "Knock counter", body: "Big +1 buttons for knocking, 4 to 7pm" },
  { href: "/kit/hanger", title: "Door hanger maker", body: "Print-ready hanger with your QR code" },
  { href: "/goal", title: "Monthly goal", body: "From $ goal to doors per day" },
  { href: "/kit/texts", title: "Text templates", body: "Quotes, bookings, reviews" },
  { href: "/numbers", title: "Numbers", body: "Every day and week" },
  { href: "/settings", title: "Settings", body: "Day 1, budget, backup" },
];

function More() {
  const data = useData()!;
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => setOrigin(window.location.origin), []);
  const link = origin ? bookingUrl(origin, data) : "";
  const p = data.profile!;

  function downloadReminders() {
    const blob = new Blob([remindersIcs(p.workDays, p.startDate)], { type: "text/calendar" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "spur-reminders.ics";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div>
      <h1>Tools</h1>
      <div className="tool-grid">
        {TOOLS.map((t) => (
          <Link key={t.href} href={t.href} className="card tool">
            <strong>{t.title}</strong>
            <span className="muted small">{t.body}</span>
          </Link>
        ))}
      </div>

      <div className="card">
        <h2>Your free booking page</h2>
        <p className="muted small">
          Your hanger&apos;s QR code opens this page. Homeowners fill it in, and it texts the request to{" "}
          {data.business.phone || "your phone"}.
        </p>
        {!data.business.phone && (
          <p className="small">
            <Link href="/roadmap">Add your phone number</Link> first (roadmap step 1).
          </p>
        )}
        {link && (
          <div className="row wrap" style={{ alignItems: "center" }}>
            <QR value={link} size={110} />
            <div className="stack">
              <a className="btn" href={link} target="_blank" rel="noreferrer">
                Open my page
              </a>
              <button
                className="btn ghost"
                onClick={() =>
                  navigator.clipboard
                    .writeText(link)
                    .then(() => setCopied(true))
                    .catch(() => {})
                }
              >
                {copied ? "Link copied" : "Copy link"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card">
        <h2>Phone reminders</h2>
        <p className="muted small">
          Adds 3 repeating reminders to your phone&apos;s calendar on {workDayNames(p.workDays)}, starting{" "}
          {niceDate(p.startDate)}: load hangers at 8:15am, knock at 3:45pm, numbers at 7:15pm. Free, and works even when the
          app is closed.
        </p>
        <button className="btn primary block" onClick={downloadReminders}>
          Add reminders to my calendar
        </button>
        <p className="muted small" style={{ margin: "8px 0 0" }}>
          On iPhone, tap the file that downloads, then tap Add All. To remove them later, delete the events in your Calendar
          app.
        </p>
      </div>
    </div>
  );
}
