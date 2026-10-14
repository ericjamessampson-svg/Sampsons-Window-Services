"use client";

import Link from "next/link";
import { update } from "@/lib/store";
import { GENERIC_OBJECTIONS, getTrade } from "@/lib/trades";
import { niceDate } from "@/lib/dates";
import { GOAL_HOMES, HOMES_PER_DAY } from "@/lib/samplePlan";
import type { AppData } from "@/lib/types";
import type { StepKind } from "@/lib/roadmap";

/** Extra tools inside some roadmap steps (inputs, calculators, scripts). */
export function StepBody({ kind, data }: { kind: StepKind; data: AppData }) {
  const profile = data.profile!;
  const trade = getTrade(profile.trade);

  switch (kind) {
    case "name":
      return (
        <div className="card">
          <label className="field">
            <span>Business name</span>
            <input
              type="text"
              value={data.business.name}
              onChange={(e) => update((d) => void (d.business.name = e.target.value))}
            />
          </label>
          <label className="field" style={{ marginBottom: 0 }}>
            <span>Phone for calls and texts</span>
            <input
              type="tel"
              inputMode="tel"
              value={data.business.phone}
              onChange={(e) => update((d) => void (d.business.phone = e.target.value))}
            />
          </label>
        </div>
      );

    case "register":
      return trade.licenseNote ? <div className="card gold">{trade.licenseNote}</div> : null;

    case "prices":
      return <PriceEditor data={data} />;

    case "equipment":
      return profile.stage !== "idea" ? (
        <div className="card accent small">You said you already have equipment. Check off what you have and note what&apos;s missing.</div>
      ) : null;

    case "design":
      return <ExampleHanger />;

    case "website":
      return (
        <div className="card accent small">
          <strong>No website yet?</strong> You already have a free booking page. Your hanger&apos;s QR code opens it, and
          requests come to you by text. <Link href="/more">See your booking page</Link>
        </div>
      );

    case "booking":
      return (
        <div className="card accent small">
          Ready-to-send texts for quotes, bookings, reminders and reviews: <Link href="/kit/texts">Text templates</Link>
        </div>
      );

    case "print":
      return <PrintCalc data={data} />;

    case "script":
      return <Script data={data} />;

    case "start":
      return (
        <div className="card accent">
          <p>
            <strong>Day 1: {niceDate(profile.startDate)}</strong>
          </p>
          <div className="row wrap">
            <Link className="btn" href="/plan">
              See the 20-day route
            </Link>
            <Link className="btn" href="/settings">
              Change Day 1
            </Link>
          </div>
        </div>
      );

    default:
      return null;
  }
}

function PriceEditor({ data }: { data: AppData }) {
  const services = data.profile!.services;
  const rows = services.map((s) => data.prices.find((r) => r.service === s) ?? { service: s, price: "", unit: "" });
  const setRow = (service: string, patch: { price?: string; unit?: string }) =>
    update((d) => {
      const i = d.prices.findIndex((r) => r.service === service);
      const cur = i >= 0 ? d.prices[i] : { service, price: "", unit: "" };
      const next = { ...cur, ...patch };
      if (i >= 0) d.prices[i] = next;
      else d.prices.push(next);
    });

  return (
    <div className="card">
      <h3>Your prices</h3>
      <p className="muted small">Write the price and how you charge, for example &quot;$10&quot; and &quot;per window&quot;.</p>
      {rows.map((r) => (
        <div key={r.service} style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 700, marginBottom: 4 }}>{r.service}</div>
          <div className="row">
            <input type="text" placeholder="$" value={r.price} onChange={(e) => setRow(r.service, { price: e.target.value })} />
            <input
              type="text"
              placeholder="per window, per home…"
              value={r.unit}
              onChange={(e) => setRow(r.service, { unit: e.target.value })}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ExampleHanger() {
  return (
    <>
      <div className="card">
        <div className="kicker">A real example from Kyle, TX</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/examples/sampsons-flyer-back.jpg"
          alt="Back of a Sampson's Window Services hanger: a blank price box, $25 off if you call this week, four reasons to choose them, and a big phone number."
          className="example-img"
        />
        <h3 style={{ marginTop: 12 }}>Why it works</h3>
        <ul className="tight small">
          <li>
            <strong>Blank price box.</strong> You write each home&apos;s price in by hand, so it feels personal.
          </li>
          <li>
            <strong>“$25 off if you call this week.”</strong> A clear reason to act now.
          </li>
          <li>
            <strong>“Call now to lock in this price.”</strong> Tells them exactly what to do.
          </li>
          <li>
            <strong>Four quick reasons,</strong> ending with proof: 5-star reviews.
          </li>
          <li>
            <strong>Huge phone number</strong> across the bottom, easy to read from the driveway.
          </li>
        </ul>
        <p className="muted small" style={{ margin: 0 }}>
          To add: “call or text” next to the number, and a QR code. The hanger maker does both.
        </p>
      </div>
      <Link className="btn primary block big" href="/kit/hanger" style={{ marginBottom: 14 }}>
        Open the door hanger maker
      </Link>
    </>
  );
}

function PrintCalc({ data }: { data: AppData }) {
  const budget = data.profile!.hangerBudget;
  const { qty, total } = data.hangerQuote;
  const each = qty && total ? total / qty : null;
  const canBuy = each && budget ? Math.floor(budget / each) : null;
  const days = canBuy ? Math.floor(canBuy / 500) : null;
  const setQ = (patch: Partial<typeof data.hangerQuote>) => update((d) => void Object.assign(d.hangerQuote, patch));
  const n = (v: string) => (v === "" ? null : Math.max(0, Number(v)));

  return (
    <div className="card">
      <h3>What your budget covers</h3>
      <div className="card accent small">
        <strong>Our suggestion: start with {GOAL_HOMES.toLocaleString()} hangers.</strong> That&apos;s 500 a day for all
        20 days of month 1. Reorder for month 2 once jobs come in.
      </div>
      <p className="small">
        <strong>Ask the printer for:</strong> standard door hangers with a die-cut hole, printed on both sides, on thick
        card stock.
      </p>
      <div className="row">
        <label className="field" style={{ flex: 1 }}>
          <span>Quote: how many</span>
          <input type="number" inputMode="numeric" value={qty ?? ""} onChange={(e) => setQ({ qty: n(e.target.value) })} />
        </label>
        <label className="field" style={{ flex: 1 }}>
          <span>Total price</span>
          <div className="money">
            <input
              type="number"
              inputMode="decimal"
              value={total ?? ""}
              onChange={(e) => setQ({ total: n(e.target.value) })}
            />
          </div>
        </label>
      </div>
      {each ? (
        <div className="card accent" style={{ marginBottom: 0 }}>
          <p>
            That&apos;s about <strong>${each.toFixed(3)}</strong> per hanger (from your quote).
          </p>
          {budget ? (
            <p style={{ marginBottom: 0 }}>
              Your ${budget.toLocaleString()} hanger budget buys about <strong>{canBuy!.toLocaleString()}</strong> hangers,
              enough for <strong>{days}</strong> day{days === 1 ? "" : "s"} of 500.
              {canBuy! < GOAL_HOMES && " Not enough for all 20 days yet. Start with what you can, and reorder as jobs come in."}
            </p>
          ) : (
            <p style={{ marginBottom: 0 }}>
              At that price, {GOAL_HOMES.toLocaleString()} hangers for month 1 would cost about{" "}
              <strong>${Math.round(each * GOAL_HOMES).toLocaleString()}</strong>, and {(HOMES_PER_DAY).toLocaleString()} for one
              day about <strong>${Math.round(each * HOMES_PER_DAY).toLocaleString()}</strong>. You can start small and
              reorder as jobs come in.
            </p>
          )}
        </div>
      ) : (
        <p className="muted small" style={{ marginBottom: 0 }}>
          Enter a real quote. The app doesn&apos;t guess printing prices.
        </p>
      )}
    </div>
  );
}

function Script({ data }: { data: AppData }) {
  const trade = getTrade(data.profile!.trade);
  const name = data.business.name || "[business]";
  const objections = trade.objections ?? GENERIC_OBJECTIONS;
  return (
    <>
      <div className="card">
        <h3>The script</h3>
        <ol style={{ paddingLeft: 20, margin: 0 }}>
          <li style={{ marginBottom: 8 }}>
            &quot;Hi! I&apos;m [your name] with {name}. We left a hanger on your door yesterday. We&apos;re doing{" "}
            {trade.verb} on your street this week.&quot;
          </li>
          <li style={{ marginBottom: 8 }}>&quot;Can I give you a free price? It takes about two minutes.&quot;</li>
          <li style={{ marginBottom: 8 }}>&quot;{trade.sizeQuestion}&quot;</li>
          <li style={{ marginBottom: 8 }}>&quot;That comes to $___. I have an opening on [day]. Want me to put you down?&quot;</li>
          <li>
            <strong>Yes:</strong> get their name, phone and day, and text a confirmation right away. <strong>No:</strong>{" "}
            &quot;No problem. Can I text you the price so you have it?&quot;
          </li>
        </ol>
      </div>
      <div className="card">
        <h3>5 common answers</h3>
        {objections.map((o) => (
          <div key={o.q} style={{ marginBottom: 12 }}>
            <div style={{ fontWeight: 700 }}>&quot;{o.q}&quot;</div>
            <div>{o.a}</div>
          </div>
        ))}
        <p className="muted small" style={{ marginBottom: 0 }}>
          Starter answers. Change the words so they sound like you.
        </p>
      </div>
    </>
  );
}
