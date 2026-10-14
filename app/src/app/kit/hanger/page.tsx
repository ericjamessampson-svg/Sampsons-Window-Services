"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { QR } from "@/components/QR";
import { bookingUrl } from "@/lib/booking";
import { HANGER_COLORS, defaultHanger } from "@/lib/hanger";
import { getTrade } from "@/lib/trades";
import { update, useData } from "@/lib/store";
import type { AppData, HangerDesign } from "@/lib/types";

export default function HangerPage() {
  return (
    <AppShell>
      <HangerMaker />
    </AppShell>
  );
}

function HangerMaker() {
  const data = useData()!;
  const h = data.hanger ?? defaultHanger(data);
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const link = origin ? bookingUrl(origin, data) : "";

  const set = (patch: Partial<HangerDesign>) =>
    update((d) => {
      d.hanger = { ...(d.hanger ?? defaultHanger(d)), ...patch };
    });

  async function onLogo(file: File) {
    const url = await shrinkImage(file, 300);
    set({ logo: url });
  }

  return (
    <div className="hanger-page">
      <div className="hanger-form no-print">
        <h1>Door hanger maker</h1>
        <p className="muted">
          Fill this in, then tap <strong>Print or save PDF</strong> and send the PDF to your printer. Size: 4.25&quot; × 11&quot;
          door hanger, printed on both sides.
        </p>
        <div className="card accent small">
          <strong>We suggest 10,000 hangers to start</strong>: 500 a day for the 20 days of month 1.
        </div>

        <div className="card">
          <h3>Your business</h3>
          <label className="field">
            <span>Business name</span>
            <input type="text" value={data.business.name} onChange={(e) => update((d) => void (d.business.name = e.target.value))} />
          </label>
          <label className="field">
            <span>Phone (call or text)</span>
            <input type="tel" value={data.business.phone} onChange={(e) => update((d) => void (d.business.phone = e.target.value))} />
          </label>
          <label className="field">
            <span>Logo (optional)</span>
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && onLogo(e.target.files[0])} />
          </label>
          {h.logo && (
            <button className="btn ghost danger" onClick={() => set({ logo: null })}>
              Remove logo
            </button>
          )}
          <span style={{ fontWeight: 700, display: "block", margin: "6px 0" }}>Color</span>
          <div className="chips">
            {HANGER_COLORS.map((c) => (
              <button
                key={c.value}
                className="chip swatch"
                aria-pressed={h.color === c.value}
                aria-label={c.name}
                title={c.name}
                style={{ background: c.value }}
                onClick={() => set({ color: c.value })}
              />
            ))}
          </div>
        </div>

        <div className="card">
          <h3>Front</h3>
          <Field label="Headline" value={h.headline} onChange={(v) => set({ headline: v })} />
          <Field label="Services (separate with ·)" value={h.services} onChange={(v) => set({ services: v })} />
          <Field label="Tagline" value={h.tagline} onChange={(v) => set({ tagline: v })} />
          <Field label="Proof" value={h.proof} onChange={(v) => set({ proof: v })} hint="A review, or “We're working on your street this week”" />
          <label className="row" style={{ gap: 8, margin: "4px 0 0" }}>
            <input type="checkbox" checked={h.showQR} onChange={(e) => set({ showQR: e.target.checked })} />
            <span>Add a QR code to your free booking page</span>
          </label>
        </div>

        <div className="card">
          <h3>Back</h3>
          <Field
            label="Your price"
            value={h.price}
            onChange={(v) => set({ price: v })}
            hint="Leave empty for a blank box. You write the price in at the door, like the example."
          />
          <Field label="Reason to act now" value={h.urgency} onChange={(v) => set({ urgency: v })} />
          <label className="field">
            <span>Reasons to choose you (one per line)</span>
            <textarea rows={4} value={h.reasons} onChange={(e) => set({ reasons: e.target.value })} />
          </label>
          <Field label="Social handle (optional)" value={h.social} onChange={(v) => set({ social: v })} />
        </div>

        <div className="row wrap" style={{ marginBottom: 20 }}>
          <button className="btn primary big" onClick={() => window.print()}>
            Print or save PDF
          </button>
          <button
            className="btn"
            onClick={() => confirm("Start over with the example wording?") && update((d) => void (d.hanger = defaultHanger(d)))}
          >
            Reset to example
          </button>
        </div>
        <p className="muted small">
          On iPhone: tap Print or save PDF, then pinch out on the preview and tap Share to save the PDF. On a computer, pick
          &quot;Save as PDF&quot; as the printer.
        </p>
      </div>

      <div className="hanger-previews">
        <div className="hanger-label no-print">Front</div>
        <Front data={data} h={h} link={link} />
        <div className="hanger-label no-print">Back</div>
        <Back data={data} h={h} link={link} />
      </div>
    </div>
  );
}

function Field({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      {hint && <small className="muted">{hint}</small>}
    </label>
  );
}

const prettyPhone = (p: string) => p.replace(/^\+?1?\D*(\d{3})\D*(\d{3})\D*(\d{4})$/, "$1-$2-$3") || "000-000-0000";

function Front({ data, h, link }: { data: AppData; h: HangerDesign; link: string }) {
  return (
    <div className="hanger" style={{ ["--hc" as string]: h.color }}>
      <div className="hanger-hole no-print" aria-hidden />
      <div className="hg-band hg-top">
        <div className="hg-headline">{h.headline}</div>
      </div>
      <div className="hg-brand">
        {h.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={h.logo} alt="" className="hg-logo" />
        ) : (
          <div className="hg-logo hg-logo-empty">{(data.business.name || "?").slice(0, 1)}</div>
        )}
        <div className="hg-name">{data.business.name || "Your Business Name"}</div>
      </div>
      <div className="hg-services">{h.services}</div>
      <div className="hg-tagline">{h.tagline}</div>
      <div className="hg-proof">★ {h.proof}</div>
      {h.showQR && link && (
        <div className="hg-qr">
          <QR value={link} size={150} />
          <span>Scan for a free quote</span>
        </div>
      )}
      <div className="hg-band hg-phone">
        <div className="hg-cta">Call or text</div>
        <div className="hg-number">{prettyPhone(data.business.phone)}</div>
      </div>
    </div>
  );
}

function Back({ data, h, link }: { data: AppData; h: HangerDesign; link: string }) {
  const trade = getTrade(data.profile?.trade);
  return (
    <div className="hanger" style={{ ["--hc" as string]: h.color }}>
      <div className="hanger-hole no-print" aria-hidden />
      <div className="hg-band hg-top">
        <div className="hg-name light">{data.business.name || "Your Business Name"}</div>
      </div>
      <div className="hg-burst">{h.urgency}</div>
      <div className="hg-price-label">Your {trade.id === "other" ? "" : trade.verb + " "}price:</div>
      <div className="hg-price">
        <span>$</span>
        {h.price.replace(/^\$/, "")}
      </div>
      <div className="hg-lock">Call now to lock in this price!</div>
      <ul className="hg-reasons">
        {h.reasons
          .split("\n")
          .map((r) => r.trim())
          .filter(Boolean)
          .map((r) => (
            <li key={r}>{r}</li>
          ))}
      </ul>
      {h.showQR && link && (
        <div className="hg-qr small-qr">
          <QR value={link} size={80} />
          <span>Scan to book</span>
        </div>
      )}
      <div className="hg-band hg-phone">
        <div className="hg-number">{prettyPhone(data.business.phone)}</div>
        {h.social && <div className="hg-social">@{h.social.replace(/^@/, "")}</div>}
      </div>
    </div>
  );
}

/** Shrinks an uploaded logo so it fits in phone storage. */
function shrinkImage(file: File, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/png"));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
