# Implementation Plan · Freedom App 2.0

> Ordered build roadmap. Codex must not start a phase until the previous phase's acceptance criteria are met.
> Current phase is marked ← CURRENT.

---

## Phase Numbering Convention

| Range | Track | Description |
|---|---|---|
| 0–999 | Shared + Web | Schema, services, and Next.js web UI |
| 1000–1999 | Mobile | Flutter mobile UI |

**Build order:** Web-first. Each mobile phase is a placeholder until the corresponding web phase is director-approved and direction for mobile is confirmed. Mobile tasks are not written until the web phase is signed off.

**Next.js project location:** `web/` subfolder in this repo.

**Auth strategy:** Supabase Auth via `@supabase/ssr` (Next.js App Router). Same Supabase project, same users, same RLS. Flutter and Next.js share one backend.

---

## Completed Phases

| Phase | Track | Description | Completed |
|---|---|---|---|
| 0 | Shared | Project setup — Flutter scaffold, repo, Supabase linked | 2026-03-25 |
| 1 | Shared | Foundation — auth, orgs, core shell (Flutter) | 2026-03-25 |
| 2 | Shared | Employees, roles & permissions (Flutter) | 2026-03-25 |
| 5 | Shared | Item catalog, suppliers & product catalog (Flutter) | 2026-03-25 |

> Phases 0–2 and 5 were completed pre-web-decision. Flutter mobile UI was built as part of those phases. Web UI for these modules will be scheduled as backtrack phases once the forward web track is established.

---

## Phase 3 · Next.js Scaffold ← CURRENT

**Track:** Web
**Depends on:** Phase 2 complete, Supabase project linked

**What gets built:**
- [ ] `web/` Next.js project initialized (App Router, TypeScript)
- [ ] `@supabase/ssr` auth configured — session via HTTP-only cookies
- [ ] Middleware for route protection (unauthenticated → /login, no org → /onboarding)
- [ ] Design system scaffold — Montserrat font, brand color tokens, base component set
- [ ] App shell — top nav / sidebar layout, responsive breakpoints
- [ ] Login + sign-up pages wired to Supabase Auth
- [ ] Dashboard placeholder (authenticated landing page)
- [ ] Deployment config (Vercel or equivalent) — TBD by director

**Acceptance:** Developer can `cd web && npm run dev`, sign in with a Supabase account, and land on a dashboard placeholder. Unauthenticated users are redirected to /login.

---

## Phase 4 · Web — Clients

**Track:** Web
**Depends on:** Phase 3 complete, TASK-014 schema done

**Tasks:** TASK-014 (schema — shared), TASK-015 (service — shared), TASK-016W, TASK-017W, TASK-018W

**Parallelism map:**
```
TASK-014 (schema — shared)
  └── TASK-015 (service + providers — shared)
        ├── TASK-016W (client list + detail — web)    ← parallel-safe
        ├── TASK-017W (client create + edit — web)    ← parallel-safe
        └── TASK-018W (communications log — web)      ← parallel-safe
```

**What gets built:**
- [ ] TASK-014 — Schema: clients, addresses, contacts, all lookup tables, notes, tasks, communications + RLS
- [ ] TASK-015 — ClientService, ClientListNotifier, is_incomplete logic, display_name helper, Freezed models
- [ ] TASK-016W — Client list (search/filter/incomplete flag) + detail (all sections) — Next.js
- [ ] TASK-017W — Client create + edit (type toggle, all fields, inline address/contact) — Next.js
- [ ] TASK-018W — Communications log: entry form, chronological list, file attachments — Next.js

**Acceptance:** Estimator can create a residential and org client, add addresses and contacts, log a communication, and see the client detail page fully populated on web. Incomplete clients are flagged.

---

## Phase 1001 · Mobile — Clients

**Track:** Mobile (Flutter)
**Depends on:** Phase 4 complete + director sign-off on web version + mobile direction confirmed
**Status:** Placeholder — tasks not yet written

> Tasks will be scoped after director reviews Phase 4 web and confirms mobile scope and UX direction.

---

## Phase 5 · Web — Crews & Fleet

**Track:** Web
**Depends on:** Phase 2 complete (needs employees for crew leads), TASK-019 schema done

**Tasks:** TASK-019 (schema — shared), TASK-020W, TASK-021W, TASK-022W, TASK-023W

**Parallelism map:**
```
TASK-019 (schema — shared)
  ├── TASK-020W (crews service + UI — web)            ← parallel-safe
  └── TASK-021W (equipment service — shared)
        ├── TASK-022W (equipment UI — web)            ← parallel-safe
        └── TASK-023W (maintenance + DVIR — web)      ← parallel-safe
```

**What gets built:**
- [ ] TASK-019 — Schema: crews, equipment, all fleet tables + RLS
- [ ] TASK-020W — Crews: CrewService, list/detail/create/edit UI — Next.js
- [ ] TASK-021W — Equipment service, availability check, expiry alert logic, Freezed models
- [ ] TASK-022W — Equipment list, detail, create + edit screens, expiry badges — Next.js
- [ ] TASK-023W — Maintenance log + DVIR screens, receipt + signature upload — Next.js

**Acceptance:** Fleet Manager can add equipment, log maintenance, submit a DVIR, assign equipment to a crew on web. Expiring documents surface as alerts.

---

## Phase 1002 · Mobile — Crews & Fleet

**Track:** Mobile (Flutter)
**Depends on:** Phase 5 complete + director sign-off + mobile direction confirmed
**Status:** Placeholder — tasks not yet written

---

## Phase 6 · Web — Item & Product Catalog (Web UI Backtrack)

**Track:** Web
**Depends on:** Phase 3 complete (Next.js scaffold)
**Note:** Schema and service layer already complete from Phase 5 (pre-decision). This phase builds the Next.js UI only.

**What gets built:**
- [ ] Item catalog list + detail + create/edit — Next.js
- [ ] Supplier management — Next.js
- [ ] Partner management — Next.js
- [ ] Price review workflow — Next.js
- [ ] Product catalog builder — Next.js
- [ ] Material config builder — Next.js

**Acceptance:** Estimator can browse the product catalog, open a product, see its inputs, and get a quantity calculation back from the formula engine — all on web.

---

## Phase 1003 · Mobile — Item & Product Catalog

**Track:** Mobile (Flutter)
**Depends on:** Phase 6 complete + director sign-off + mobile direction confirmed
**Status:** Placeholder — tasks not yet written

---

## Phase 7 · Web — Employees (Web UI Backtrack)

**Track:** Web
**Depends on:** Phase 3 complete (Next.js scaffold)
**Note:** Schema and service layer already complete from Phase 2. This phase builds the Next.js UI only.

**What gets built:**
- [ ] Employee list + detail — Next.js
- [ ] Employee create + edit — Next.js
- [ ] Invite flow — Next.js
- [ ] Role + permission management — Next.js

**Acceptance:** Owner can manage employees, roles, and permissions fully from the web interface.

---

## Phase 1004 · Mobile — Employees

**Track:** Mobile (Flutter)
**Depends on:** Phase 7 complete + director sign-off + mobile direction confirmed
**Status:** Placeholder — tasks not yet written

---

## Phase 8 · Web — Estimates

**Track:** Web
**Depends on:** Phases 4, 6 complete

**What gets built:**
- [ ] `estimate_types`, `estimate_sub_statuses` schema + RLS
- [ ] `estimates`, `estimate_contacts`, `estimate_product_lines`, `service_visits` schema + RLS
- [ ] `change_orders` schema + RLS
- [ ] `expense_buckets`, `expense_splits` schema + RLS
- [ ] Estimate list (pipeline view) — Next.js
- [ ] Estimate create flow (client → type → product lines → line items) — Next.js
- [ ] Product line builder using product catalog — Next.js
- [ ] Change order flow — Next.js
- [ ] Estimate status management — Next.js
- [ ] E-signature UI — Next.js
- [ ] Billing / contract terms — Next.js
- [ ] Discount logic + tax handling — Next.js
- [ ] QB sync: estimate → QuickBooks estimate
- [ ] Auto-log communications on send/approve/decline

**Backtrack items (must resolve before this phase):**
- [ ] Line items table (`estimate_line_items`) fully defined
- [ ] Billing / contract terms fully designed
- [ ] Discount resolution (line item vs estimate level)
- [ ] Product catalog inputs/formulas for all seeded templates

**Acceptance:** Estimator can create a full estimate, add product lines, set status, send to client, and mark as approved on web.

---

## Phase 1005 · Mobile — Estimates

**Track:** Mobile (Flutter)
**Depends on:** Phase 8 complete + director sign-off + mobile direction confirmed
**Status:** Placeholder — tasks not yet written

---

## Phase 9 · Web — Jobs & Scheduling

**Track:** Web
**Depends on:** Phase 8 complete, Firebase configured

**What gets built:**
- [ ] `jobs` schema + RLS (spec required before build)
- [ ] Estimate → Job conversion flow — Next.js
- [ ] Job list, detail, status screens — Next.js
- [ ] Scheduling calendar UI — Next.js
- [ ] Crew assignment to jobs — Next.js
- [ ] Equipment scheduling for jobs — Next.js
- [ ] Supplier run list — Next.js
- [ ] FCM push notifications: job assignments, schedule changes

**Acceptance:** Approved estimate converts to a job. Job appears on crew schedule. Crew lead can view job details, equipment list, and supplier run.

---

## Phase 1006 · Mobile — Jobs & Scheduling

**Track:** Mobile (Flutter)
**Depends on:** Phase 9 complete + director sign-off + mobile direction confirmed
**Status:** Placeholder — tasks not yet written

---

## Phase 10 · Web — Expenses, Timesheets & Expense Buckets

**Track:** Web
**Depends on:** Phase 8 complete, Plaid keys configured

**What gets built:**
- [ ] Plaid integration: bank account link, transaction import
- [ ] Expense entry UI (manual + from Plaid) — Next.js
- [ ] Expense split UI (bucket or project product line) — Next.js
- [ ] Timesheet UI — Next.js
- [ ] Expense bucket overview — Next.js

**Acceptance:** Admin can import bank transactions and split expenses. Employee can log time to a project line.

---

## Phase 1007 · Mobile — Expenses & Timesheets

**Track:** Mobile (Flutter)
**Depends on:** Phase 10 complete + director sign-off + mobile direction confirmed
**Status:** Placeholder — tasks not yet written

---

## Phase 11 · Web — EOS / Traction

**Track:** Web
**Depends on:** Phases 2–10 substantially complete

**What gets built:**
- [ ] All EOS schema (scorecard, rocks, todos, issues, meetings, seats, auto-rules) + RLS
- [ ] Scorecard UI — Next.js
- [ ] Rocks UI — Next.js
- [ ] Issues list (IDS workflow) — Next.js
- [ ] To-Do list — Next.js
- [ ] L10 Meeting runner — Next.js
- [ ] Accountability Chart — Next.js
- [ ] Weekly automation: auto scorecard rollup + auto issue generation

**Acceptance:** Monday automation populates scorecard. L10 meeting can be run end-to-end.

---

## Phase 1008 · Mobile — EOS / Traction

**Track:** Mobile (Flutter)
**Depends on:** Phase 11 complete + director sign-off + mobile direction confirmed
**Status:** Placeholder — tasks not yet written

---

## Phase 12 · Web — Reporting

**Track:** Web
**Depends on:** Phase 11 complete

**What gets built:**
- [ ] Revenue vs goal dashboard — Next.js
- [ ] Pipeline report — Next.js
- [ ] Job profitability report — Next.js
- [ ] Labor % / materials % of revenue — Next.js
- [ ] Crew utilization report — Next.js
- [ ] EOS financial metrics — Next.js

**Acceptance:** Executive can see current week/month/quarter revenue, pipeline, and crew utilization from live data.

---

## Phase 1009 · Mobile — Reporting

**Track:** Mobile (Flutter)
**Depends on:** Phase 12 complete + director sign-off + mobile direction confirmed
**Status:** Placeholder — tasks not yet written

---

## Phase 13 · AI + Voice

**Track:** Shared (Flutter + web)
**Depends on:** Phase 8 complete (needs estimate data)

**What gets built:**
- [ ] Anthropic Claude integration
- [ ] Voice STT via Deepgram
- [ ] Voice TTS via flutter_tts
- [ ] AI-assisted estimate notes / summaries
- [ ] Voice input on key forms

**Acceptance:** User can tap a voice button, speak, and have transcription appear. AI can generate a summary of a client's estimate history.

---

## Phase 14 · Client Portal

**Track:** Web (Next.js)
**Depends on:** Phase 8 complete

**What gets built:**
- [ ] Client-facing portal: view estimates, approve/decline, view invoices, pay
- [ ] Portal auth (magic link or password)
- [ ] Branded per org (logo + colors from `org_settings`)
- [ ] `clients.has_portal_access` flag enforcement

**Acceptance:** Client with portal access can log in, view their open estimate, and approve it.
