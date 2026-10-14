"use client";

import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { getTrade } from "@/lib/trades";
import { useData } from "@/lib/store";

export default function TextsPage() {
  return (
    <AppShell narrow>
      <Texts />
    </AppShell>
  );
}

function Texts() {
  const data = useData()!;
  const biz = data.business.name || "[your business]";
  const verb = getTrade(data.profile?.trade).verb;
  const [copied, setCopied] = useState<string | null>(null);

  const templates: { when: string; text: string }[] = [
    {
      when: "Someone calls or texts from a hanger",
      text: `Hi! This is [your name] with ${biz}. Thanks for reaching out about ${verb}. What's your address? I can get you a price today.`,
    },
    {
      when: "Same day as a quote",
      text: `Hi [name], great meeting you today! Your price for ${verb} is $[price]. I have openings on [day] and [day]. Want me to put you down?`,
    },
    {
      when: "3 days after a quote, no answer yet",
      text: `Hi [name], it's [your name] with ${biz}. Just checking in on your quote for $[price]. I'm back on your street [day] if that works for you.`,
    },
    {
      when: "When they book",
      text: `You're booked! ${biz} will be there [day] between [time] and [time]. Price: $[price]. Reply here with any questions.`,
    },
    {
      when: "Day before the job",
      text: `Hi [name], reminder that ${biz} is coming tomorrow between [time] and [time]. Please unlock any gates. See you then!`,
    },
    {
      when: "After the job: ask for a review",
      text: `Thanks for choosing ${biz}! If you're happy with the work, a quick Google review helps a small local business a lot: [review link]`,
    },
    {
      when: "After the job: offer a repeat visit",
      text: `Want me to keep you on the schedule? I can come back every [3] months at the same price, and you won't have to think about it.`,
    },
  ];

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(text);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      setCopied(null);
    }
  }

  return (
    <div>
      <h1>Text templates</h1>
      <p className="muted">Copy one, paste it into your texting app, and replace the [brackets].</p>
      {templates.map((t) => (
        <div className="card" key={t.when}>
          <div className="kicker">{t.when}</div>
          <p>{t.text}</p>
          <div className="row">
            <button className="btn" onClick={() => copy(t.text)}>
              {copied === t.text ? "Copied" : "Copy"}
            </button>
            <a className="btn ghost" href={`sms:?&body=${encodeURIComponent(t.text)}`}>
              Open in Messages
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
