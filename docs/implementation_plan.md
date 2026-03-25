# Implementation Plan · Freedom App 2.0

> Ordered build roadmap. Codex must not start a phase until the previous phase's acceptance criteria are met.
> Current phase is marked ← CURRENT.

---

## Phase 0 · Project Setup ← CURRENT

**What gets built:**
- [x] Git repo initialized (main + dev branches)
- [x] .gitignore created
- [ ] Flutter project created (`flutter create --org com.freedomlandscapes --project-name freedom_app --platforms ios,android .`)
- [ ] `pubspec.yaml` seeded with full dependency stack
- [ ] `flutter pub get` successful
- [ ] `build_runner` confirmed working
- [ ] All framework docs generated (architecture.md, master_plan.md, this file, etc.)
- [ ] Supabase project created and linked (pre-launch dependency — unblocks Phase 1)
- [ ] Firebase project created, FCM configured (pre-launch dependency — unblocks Phase 7)

**Acceptance:** Repo is clean, `flutter run` boots to a blank screen on iOS simulator, all docs exist and are populated.

---

## Phase 1 · Foundation — Auth, Orgs, Core Shell

**Depends on:** Phase 0 complete, Supabase project linked

**Tasks:** TASK-003, TASK-004, TASK-005, TASK-006, TASK-007

**Parallelism map:**
```
TASK-003 (schema)
  ├── TASK-004 (seed data)  ─┐
  └── TASK-005 (auth flow)  ─┴── TASK-006 (org creation) ── TASK-007 (app shell)
```
All sequential. Core identity must be fully wired before anything branches.

**What gets built:**
- [ ] TASK-003 — Supabase schema: `organizations`, `profiles`, `org_members`, `org_settings`, triggers, RLS
- [ ] TASK-004 — Seed data Edge Function: roles, payment_terms, estimate_types, expense_buckets on org creation
- [ ] TASK-005 — Auth flow: sign up, sign in, sign out, password reset + AuthService + AuthNotifier
- [ ] TASK-006 — Org creation + onboarding: OrgService, OrgNotifier, setup screen, RouterNotifier guards
- [ ] TASK-007 — App shell: bottom nav, placeholder screens, GoRouter shell route, full route table

**Acceptance:** User can sign up, create an org, be redirected to dashboard with correct bottom nav. Sign out and sign back in redirects correctly. Unauthenticated and no-org users are guarded at routing level.

---

## Phase 2 · Employees, Roles & Permissions

**Depends on:** Phase 1 complete

**Tasks:** TASK-008, TASK-009, TASK-010, TASK-011, TASK-012, TASK-013

**Parallelism map:**
```
TASK-008 (schema)
  └── TASK-009 (service + providers)
        ├── TASK-010 (list + detail UI)      ← parallel-safe
        ├── TASK-011 (create + edit UI)      ← parallel-safe
        ├── TASK-012 (invite flow)           ← parallel-safe
        └── TASK-013 (role + perms UI)       ← parallel-safe, blocks Phase 3 + 4
```

**What gets built:**
- [ ] TASK-008 — Schema: roles, role_permissions, employees, overrides, compensation, invites, preferences, custom fields + RLS
- [ ] TASK-009 — EmployeeService, CurrentEmployeeNotifier, PermissionService, Freezed models
- [ ] TASK-010 — Employee list + detail screens (permission-gated compensation section)
- [ ] TASK-011 — Employee create + edit screens, status transitions, compensation entry
- [ ] TASK-012 — Invite flow: send invite, Edge Function email, accept screen, link to auth user
- [ ] TASK-013 — Role list + detail, permission matrix UI, per-employee override panel

**Acceptance:** Owner can create an employee record, assign a role, send an invite. Invited user can accept and log in with correct permissions. Permission overrides resolve correctly.

---

## Phase 3 · Clients, Addresses & Contacts

**Depends on:** Phase 2 complete (needs employees for sales_lead)

**Tasks:** TASK-014, TASK-015, TASK-016, TASK-017, TASK-018

**Parallelism map:**
```
TASK-014 (schema)
  └── TASK-015 (service + providers)
        ├── TASK-016 (list + detail UI)      ← parallel-safe
        ├── TASK-017 (create + edit UI)      ← parallel-safe
        └── TASK-018 (communications log)   ← parallel-safe
```

**What gets built:**
- [ ] TASK-014 — Schema: clients, addresses, contacts, all lookup tables, notes, tasks, communications + RLS
- [ ] TASK-015 — ClientService, ClientListNotifier, is_incomplete logic, display_name helper, Freezed models
- [ ] TASK-016 — Client list (search/filter/incomplete flag) + detail (all sections)
- [ ] TASK-017 — Client create + edit (type toggle, all fields, inline address/contact)
- [ ] TASK-018 — Communications log: entry form, chronological list, file attachments

**Acceptance:** Estimator can create a residential and org client, add addresses and contacts, log a communication, and see the client detail page fully populated. Incomplete clients are flagged.

---

## Phase 4 · Crews & Equipment / Fleet

**Depends on:** Phase 2 complete (needs employees for crew leads and drivers)
**Note:** Phases 3 and 4 can run in parallel — no cross-dependency between them.

**Tasks:** TASK-019, TASK-020, TASK-021, TASK-022, TASK-023

**Parallelism map:**
```
TASK-019 (schema)
  ├── TASK-020 (crews service + UI)          ← parallel-safe after schema
  └── TASK-021 (equipment service)
        ├── TASK-022 (equipment UI)          ← parallel-safe
        └── TASK-023 (maintenance + DVIR)   ← parallel-safe
```

**What gets built:**
- [ ] TASK-019 — Schema: crews, equipment, all fleet tables + RLS
- [ ] TASK-020 — Crews: CrewService, list/detail/create/edit UI
- [ ] TASK-021 — Equipment service, availability check, expiry alert logic, Freezed models
- [ ] TASK-022 — Equipment list, detail, create + edit screens, expiry badges
- [ ] TASK-023 — Maintenance log + DVIR screens, receipt + signature upload

**Acceptance:** Fleet Manager can add equipment, log maintenance, submit a DVIR, assign equipment to a crew. Expiring documents surface as alerts.

---

## Phase 5 · Item Catalog, Suppliers & Product Catalog

**Depends on:** Phase 1 complete (only needs org context)
**Note:** Phase 5 can run in parallel with Phases 3 and 4.

**Tasks:** TASK-024, TASK-025, TASK-026, TASK-027, TASK-028

**Parallelism map:**
```
TASK-024 (schema)
  └── TASK-025 (item catalog service)
        ├── TASK-026 (item catalog UI)       ← parallel-safe
        └── TASK-027 (product catalog service + formula engine)
              └── TASK-028 (product catalog builder UI)
```

**What gets built:**
- [ ] TASK-024 — Schema: all catalog, supplier, and product catalog tables + RLS
- [ ] TASK-025 — CatalogItemService, SupplierService, pricing hierarchy, price review alerts, Freezed models
- [ ] TASK-026 — Item catalog UI, supplier management, partner management, price review workflow
- [ ] TASK-027 — ProductCatalogService, FormulaEngine (math_expressions wrapper), seeded system templates
- [ ] TASK-028 — Product catalog builder UI: form designer for inputs + components, material config builder

**Acceptance:** Estimator can browse the product catalog, open a product, see its inputs, and get a quantity calculation back from the formula engine. System templates are seeded and visible.

---

## Phase 6 · Estimates

**Depends on:** Phases 3, 5 complete

**What gets built:**
- [ ] `estimate_types`, `estimate_sub_statuses` schema + RLS
- [ ] `estimates`, `estimate_contacts`, `estimate_product_lines`, `service_visits` schema + RLS
- [ ] `change_orders` schema + RLS
- [ ] `expense_buckets`, `expense_splits` schema + RLS
- [ ] Estimate list (pipeline view) UI
- [ ] Estimate create flow (client → type → product lines → line items)
- [ ] Product line builder using product catalog
- [ ] Change order flow
- [ ] Estimate status management (lead → estimate → approved/declined)
- [ ] E-signature UI
- [ ] Billing / contract terms (deposit, payment schedule)
- [ ] Discount logic (resolve line item vs estimate level)
- [ ] Tax handling (`org_settings.charges_tax`, `is_tax_exempt`)
- [ ] QB sync: estimate → QuickBooks estimate
- [ ] Auto-log communications on send/approve/decline

**Backtrack items (must resolve before this phase):**
- [ ] Line items table (`estimate_line_items`) fully defined
- [ ] Billing / contract terms fully designed
- [ ] Discount resolution (line item vs estimate level)
- [ ] Product catalog inputs/formulas for all seeded templates (Phase 5 P2 backtrack)

**Acceptance:** Estimator can create a full estimate, add product lines using the catalog formula engine, set status, send to client, and mark as approved. Change order can be created on an approved estimate.

---

## Phase 7 · Jobs & Scheduling

**Depends on:** Phase 6 complete, Firebase configured

**What gets built:**
- [ ] `jobs` schema + RLS (workshopping still in progress — spec required before build)
- [ ] Estimate → Job conversion flow
- [ ] Job list, detail, status screens
- [ ] Scheduling calendar UI
- [ ] Crew assignment to jobs
- [ ] Equipment scheduling for jobs
- [ ] Supplier run list (aggregated materials + nearest supplier routing)
- [ ] FCM push notifications: job assignments, schedule changes

**Acceptance:** Approved estimate converts to a job. Job appears on crew schedule. Crew lead can view job details, equipment list, and supplier run from their phone.

---

## Phase 8 · Expenses (Plaid), Timesheets & Expense Buckets

**Depends on:** Phase 6 complete, Plaid keys configured

**What gets built:**
- [ ] Plaid integration: bank account link, transaction import
- [ ] Expense entry UI (manual + from Plaid transactions)
- [ ] Expense split UI (bucket or project product line)
- [ ] Timesheet UI (employee time logging per bucket/project)
- [ ] Expense bucket overview UI

**Acceptance:** Employee can log a time entry to a project line. Admin can import bank transactions via Plaid and split an expense across buckets.

---

## Phase 9 · EOS / Traction Module

**Depends on:** Phases 2–8 substantially complete (needs real data)

**What gets built:**
- [ ] `eos_scorecard_metrics`, `eos_scorecard_entries` schema + RLS
- [ ] `eos_rocks`, `eos_todos`, `eos_issues` schema + RLS
- [ ] `eos_meetings`, `eos_meeting_attendees` schema + RLS
- [ ] `eos_seats` (accountability chart) schema + RLS
- [ ] `eos_auto_issue_rules` schema + seeded rules
- [ ] Scorecard UI (weekly view, on-track/off-track)
- [ ] Rocks UI (quarterly, company + individual)
- [ ] Issues list UI (IDS workflow)
- [ ] To-Do list UI
- [ ] L10 Meeting runner UI (agenda segments, time-boxed)
- [ ] Accountability Chart UI
- [ ] Weekly automation: auto scorecard rollup + auto issue generation (Supabase scheduled function)

**Acceptance:** Monday automation runs and populates the scorecard with real data from Phase 2–8 modules. Issues auto-generate for triggered rules. L10 meeting can be started, run through all segments, and closed with todos created.

---

## Phase 10 · Reporting

**Depends on:** Phase 9 complete

**What gets built:**
- [ ] Revenue vs goal dashboard
- [ ] Pipeline report (estimates by type, stage, value)
- [ ] Job profitability report
- [ ] Labor % / materials % of revenue
- [ ] Crew utilization report
- [ ] EOS financial metrics integrated with Reporting module

**Acceptance:** Executive can open Reporting and see current week/month/quarter revenue, pipeline, and crew utilization — all from live data.

---

## Phase 11 · AI + Voice

**Depends on:** Phase 6 complete (needs estimate data)

**What gets built:**
- [ ] Anthropic Claude integration (`lib/features/ai/`)
- [ ] Voice STT via Deepgram (`lib/features/voice/`)
- [ ] Voice TTS via flutter_tts
- [ ] AI-assisted estimate notes / summaries
- [ ] Voice input on key forms (notes, descriptions)

**Acceptance:** User can tap a voice button on an estimate note field, speak, and have transcription appear. AI can generate a summary of a client's estimate history.

---

## Phase 12 · Client Portal (Web / Next.js)

**Depends on:** Phase 6 complete, Next.js web project initialized

**What gets built:**
- [ ] Next.js web project scaffold
- [ ] Client-facing portal: view estimates, approve/decline, view invoices, pay
- [ ] Portal auth (magic link or password)
- [ ] Branded per org (logo + colors from `org_settings`)
- [ ] `clients.has_portal_access` flag enforcement

**Acceptance:** Client with portal access can log in, view their open estimate, and approve it. Approval reflects immediately in the Flutter app.

---

## Completed Phases

| Phase | Description | Completed |
|---|---|---|
| — | Nothing complete yet | — |
