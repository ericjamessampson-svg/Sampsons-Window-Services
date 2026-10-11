# Sampson's Window Services

Website for Sampson's Window Services, Kyle, TX. Intended domain: sampsonswindows.com.

A static site, no build step: `index.html`, `styles.css`, `script.js` and `images/`.

- Preview locally: `python3 -m http.server` then open http://localhost:8000
- Quote form: opens the visitor's texting app with a message to 512-947-3460 (no server needed).
  To change the number, update `PHONE` in `script.js` and the `tel:`/`sms:` links in `index.html`.

## Legends CRM

`crm/legends-crm.html` is Legends CRM, the business's customer manager: customers and property details,
a leads pipeline, quotes, the job schedule, invoices, recurring plans, expenses, a price book and reports.

- Published as a private claude.ai artifact, where records are saved to the owner's account and sync across devices.
- Opened directly from this repo (`python3 -m http.server`, then http://localhost:8000/crm/legends-crm.html) it saves
  to that browser only; use Settings > Export backup / Import backup to move data.
