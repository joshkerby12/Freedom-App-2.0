# Master Plan · Ground Control Pro

> 10,000 ft view. What this app is, who it's for, and what success looks like.
> References: implementation_plan.md · design_guidelines.md · data_structure.md

---

## What This App Is

Ground Control Pro is a full business management platform built for field service companies — starting with landscape operations. It consolidates client management, estimating, job tracking, crew scheduling, equipment/fleet management, expense tracking, and business reporting into a single mobile-web-first system. The app is designed so that the entire business — from the first client inquiry to final invoice — runs through one platform, with EOS/Traction tools built on top to give leadership real-time visibility into company health.

**Platform strategy:** Phase 1 is a mobile-optimized web app (Next.js, deployed to Vercel) — accessible from any browser on phone or desktop, no install required. Phase 2 adds Flutter native apps (iOS + Android) for offline use, push notifications, and App Store presence.

---

## The Problem It Solves

Field service companies are currently running on patchwork tools: spreadsheets, AppSheet, and manual processes. Estimates are disconnected from jobs. Jobs are disconnected from expenses. There's no single source of truth for what's happening in the field, what's been sold, or how the business is performing week over week. The EOS model (Traction) is being run manually without automated data feeding the Scorecard, Issues, and Rocks. Ground Control Pro solves all of that in one system built specifically for how a field service company operates.

---

## Primary Users

| User | Role | What They Need |
|---|---|---|
| Owner / Executive | Leadership | Business dashboard, financials, EOS Scorecard, full visibility |
| Operations Director | Ops | Scheduling, crews, fleet, job status, issues escalation |
| Sales / Estimator | Sales | Client management, estimate creation, pipeline tracking |
| Crew Lead / PM | Field ops | Job details, crew schedule, equipment, daily inspections |
| Fleet Manager | Fleet/DOT | Equipment records, maintenance, DOT compliance, DVIR |
| Field Employee | Field | View assigned jobs, log time, submit DVIR |
| Office Manager | Admin | Employee records, invoices, QB sync, settings |

---

## Core Features — v1

1. **Clients** — Residential and commercial client records, addresses, contacts, communication log, tags, referral tracking
2. **Estimates** — Full estimate builder with product catalog, formula engine, pricing modes, change orders, e-signature, QB sync
3. **Employees & Crews** — Employee records, compensation history, permissions, crew structure, DOT compliance tracking
4. **Equipment & Fleet** — Fleet records, maintenance tracking, DOT compliance, DVIR, scheduling
5. **Item & Product Catalog** — Materials, suppliers, product templates with formula-driven quantity calculations
6. **Expense Buckets** — Cost allocation system tied to estimates and overhead buckets; Teller.io bank integration
7. **EOS / Traction** — Scorecard (auto + manual), Rocks, Issues, To-Dos, L10 Meetings, Accountability Chart
8. **Scheduling** — Crew and job scheduling (architecture designed; detail TBD)
9. **Jobs** — Job records converted from approved estimates (architecture designed; detail TBD)
10. **Timesheets** — Employee time logging per bucket/project (TBD)
11. **Reporting** — Business performance dashboard and EOS financial metrics (TBD)

---

## What Success Looks Like (v1)

- An estimator can take a client from first inquiry → estimate → approval → job in the app without touching another tool
- A crew lead can see their schedule, equipment list, and supplier run for any job from their phone
- The EOS Scorecard populates automatically every Monday with real data from the app
- Leadership can open the app and see a real-time view of pipeline, active jobs, crew utilization, and cash position
- All client, estimate, and job history is searchable and attributed correctly

---

## What This App Is NOT (v1)

- Not a customer-facing portal (Phase 2 — architecture supports it, not built in v1)
- Not a full payroll or HR system — compensation records and hours tracked, but payroll processed externally
- Not a real-time inventory management system — catalog pricing and ordering guidance, not live stock levels
- Not a route optimization system — supplier run list with maps, but no automated route planning

---

## References

- [implementation_plan.md](implementation_plan.md) — ordered build phases
- [design_guidelines.md](design_guidelines.md) — visual and UX rules
- [data_structure.md](data_structure.md) — full Supabase schema
- [architecture.md](architecture.md) — tech stack and system overview
