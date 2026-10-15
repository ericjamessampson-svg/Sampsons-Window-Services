"use client";

import { useEffect, useState } from "react";
import { smsLink } from "@/lib/booking";

interface Biz {
  name: string;
  phone: string;
  services: string[];
  area: string;
}

/** Public page a homeowner opens from the hanger's QR code. No login needed. */
export default function BookPage() {
  const [biz, setBiz] = useState<Biz | null>(null);
  const [form, setForm] = useState({ name: "", address: "", when: "", notes: "", picks: [] as string[] });

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    setBiz({
      name: q.get("b") || "Your local pro",
      phone: q.get("p") || "",
      services: (q.get("s") || "").split("|").filter(Boolean),
      area: q.get("a") || "",
    });
  }, []);

  if (!biz) return null;

  const pretty = biz.phone.replace(/^\+?1?(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3");
  const message = [
    `Hi ${biz.name}! I'd like a free quote.`,
    form.name && `Name: ${form.name}`,
    form.address && `Address: ${form.address}`,
    form.picks.length > 0 && `Services: ${form.picks.join(", ")}`,
    form.when && `Best time: ${form.when}`,
    form.notes && `Notes: ${form.notes}`,
  ]
    .filter(Boolean)
    .join("\n");
  const ready = form.name.trim() && form.address.trim();

  return (
    <div className="book">
      <header className="book-head">
        <div className="kicker" style={{ color: "inherit", opacity: 0.85 }}>
          Free quote{biz.area ? ` · ${biz.area}` : ""}
        </div>
        <h1>{biz.name}</h1>
        {biz.phone && (
          <a className="btn block big book-call" href={`tel:${biz.phone}`}>
            Call {pretty}
          </a>
        )}
      </header>

      <main className="book-body">
        <h2>Request a free quote</h2>
        <p className="muted">Fill this in and tap Send. It opens your texting app with your request ready to go.</p>
        <label className="field">
          <span>Your name</span>
          <input type="text" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </label>
        <label className="field">
          <span>Address</span>
          <input
            type="text"
            autoComplete="street-address"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </label>
        {biz.services.length > 0 && (
          <>
            <span style={{ fontWeight: 700 }}>What do you need?</span>
            <div className="chips" style={{ margin: "6px 0 14px" }}>
              {biz.services.map((s) => {
                const on = form.picks.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    className="chip"
                    aria-pressed={on}
                    onClick={() => setForm({ ...form, picks: on ? form.picks.filter((x) => x !== s) : [...form.picks, s] })}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </>
        )}
        <label className="field">
          <span>Best time to reach you</span>
          <input type="text" placeholder="Weekday evenings" value={form.when} onChange={(e) => setForm({ ...form, when: e.target.value })} />
        </label>
        <label className="field">
          <span>Anything else? (optional)</span>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </label>
        {biz.phone ? (
          <a
            className={`btn primary block big${ready ? "" : " is-disabled"}`}
            href={ready ? smsLink(biz.phone, message) : undefined}
            aria-disabled={!ready}
          >
            Send my request
          </a>
        ) : (
          <p className="muted">This business hasn&apos;t added a phone number yet.</p>
        )}
        {!ready && <p className="muted small">Add your name and address to send.</p>}
      </main>
      <footer className="muted small book-foot">Made with Spur</footer>
    </div>
  );
}
