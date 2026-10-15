# Spur (app)

Spur helps new home-service owners start a business and reach 10,000 homes in their first month
with door hangers in the morning and door knocking from 4 to 7pm.

Phase 1: onboarding, launch roadmap, today screen with daily checklist and numbers, and a sample
20-day plan for Kyle, TX. Data is saved on each device (no accounts yet).

- Run locally: `npm install`, then `npm run dev`, then open http://localhost:3000
- Build: `npm run build`
- Hosting: Vercel, with the project's Root Directory set to `app`
- Sample plan data and sources: `src/lib/samplePlan.ts`
- Data storage: `src/lib/store.ts` (Phase 2 replaces this with Supabase)
