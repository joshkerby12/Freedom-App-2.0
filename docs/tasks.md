# Tasks · Freedom App 2.0

> Active task queue. Claude authors and scopes all tasks. Codex picks up `ready` tasks and implements them.

---

## Status Key

| Status | Meaning |
|---|---|
| `ready` | Scoped by Claude, ready for Codex to pick up |
| `in-progress` | Codex is actively working on it |
| `needs-review` | Codex finished, waiting for Claude/director review |
| `review-escalation` | Codex flagged a decision that needs Claude or director |
| `done` | Confirmed working |
| `blocked` | Codex hit a problem — see errors.md |

---

## Active Tasks

---

## Phase 0 · Project Setup

> **Status: COMPLETE** — See Completed Tasks table.

---

## Phase 1 · Foundation — Auth, Orgs, Core Shell

> **Status: COMPLETE** — TASK-001 through TASK-007 done. See Completed Tasks table.

---

## Phase 2 · Employees, Roles & Permissions

> **Status: COMPLETE** — TASK-008 through TASK-013 done. See Completed Tasks table.

---

## Phase 3 · Next.js Scaffold

> **Status: COMPLETE** — TASK-029 done. See Completed Tasks table.

---

## Phase 4 · Web — Clients

> **Status: COMPLETE** — TASK-014, TASK-015, TASK-016W, TASK-017W, TASK-018W done. See Completed Tasks table.

---

## Phase 1001 · Mobile — Clients

> Track: Mobile (Flutter)
> **Status: PLACEHOLDER** — Tasks not written. Pending director sign-off on Phase 4 web and mobile direction.

---

## Phase 5 · Web — Crews & Fleet

> **Status: COMPLETE** — TASK-019, TASK-020W, TASK-021W, TASK-022W, TASK-023W done. See Completed Tasks table.

---

## Phase 1002 · Mobile — Crews & Fleet

> Track: Mobile (Flutter)
> **Status: PLACEHOLDER** — Tasks not written. Pending director sign-off on Phase 5 web and mobile direction.

---

## Phase 6 · Web — Item Catalog, Suppliers & Product Catalog

> **Status: COMPLETE** — TASK-029W through TASK-033W done. See Completed Tasks table.

---

## Phase 7 · Web — Employees

> **Status: COMPLETE** — TASK-034W through TASK-037W done. Edge Function deploy pending (director action: `supabase functions deploy send-employee-invite`). See Completed Tasks table.

---

## Phases 8–14 (Web) + Phases 1003–1009 (Mobile)

> See `docs/implementation_plan.md` for full phase breakdown.
> Web phases 8–14 tasks will be written as each phase is reached.
> Mobile phases 1003–1009 are placeholders — tasks not written until corresponding web phase is director-approved.

---

## Previously Phase 5 · Item Catalog, Suppliers & Product Catalog

> **Status: COMPLETE** — TASK-024 through TASK-028 done (Flutter mobile, pre-web-decision). Web UI backtrack scheduled as Phase 6. See Completed Tasks table.

---

## Completed Tasks

| Task ID | Description | Module | Phase | Completed |
|---|---|---|---|---|
| TASK-001 | Flutter project scaffold — flutter create, pubspec, pub get, build_runner | scaffold | 0 | 2026-03-25 |
| TASK-002 | Core lib/ folder structure — all feature + core folders, placeholder files, analyzer clean | scaffold | 0 | 2026-03-25 |
| TASK-003 | Supabase schema — organizations, profiles, org_members, org_settings, triggers, RLS | auth | 1 | 2026-03-25 |
| TASK-004 | Seed data Edge Function — roles, permissions, payment_terms, estimate_types, expense_buckets | auth | 1 | 2026-03-25 |
| TASK-005 | Auth flow — sign up, sign in, sign out, password reset screens + AuthService + AuthNotifier | auth | 1 | 2026-03-25 |
| TASK-006 | Org creation + onboarding — OrgService, OrgNotifier, org setup screen, RouterNotifier guards | orgs | 1 | 2026-03-25 |
| TASK-007 | App shell — bottom nav, placeholder screens, GoRouter shell route, full route table | scaffold | 1 | 2026-03-25 |
| TASK-008 | Employees schema — roles, employees, permissions, compensation, invites, custom fields + RLS | employees | 2 | 2026-03-25 |
| TASK-009 | Employee service + providers — EmployeeService, PermissionService, CurrentEmployeeNotifier | employees | 2 | 2026-03-25 |
| TASK-010 | Employee list + detail screens — filter, status badge, compensation section gated | employees | 2 | 2026-03-25 |
| TASK-011 | Employee create + edit — display_name auto-suggest, status transitions, compensation entry | employees | 2 | 2026-03-25 |
| TASK-012 | Employee invite flow — InviteService, send-employee-invite Edge Function, accept screen | employees | 2 | 2026-03-25 |
| TASK-013 | Role + permission management UI — role list/detail, per-employee override panel | employees | 2 | 2026-03-25 |
| TASK-024 | Catalog schema — catalog items, specs, suppliers, partners, material configs, product catalog + RLS | item_catalog | 5 | 2026-03-25 |
| TASK-025 | Item catalog service + providers — CatalogItemService, pricing hierarchy, price review alerts | item_catalog | 5 | 2026-03-25 |
| TASK-026 | Item catalog + supplier UI — list/detail/create/edit, supplier management, price review workflow | item_catalog | 5 | 2026-03-25 |
| TASK-027 | Product catalog service + formula engine — ProductCatalogService, FormulaEngine, 48 seeded templates | product_catalog | 5 | 2026-03-25 |
| TASK-028 | Product catalog builder UI — list by category, form designer, material config builder | product_catalog | 5 | 2026-03-25 |
| TASK-029 | Next.js scaffold — web/ init, @supabase/ssr auth, middleware, design system, app shell, login/sign-up pages | next_js_scaffold | 3 | 2026-03-26 |
| TASK-014 | Clients schema — clients, addresses, contacts, lookup tables, notes, tasks, communications + RLS | clients | 4 | 2026-03-26 |
| TASK-019 | Fleet schema — crews, equipment, all fleet tables, conflict function, RLS | crews/fleet | 5 | 2026-03-26 |
| TASK-020W | Crews service + UI — Next.js — CrewService, list/detail/create/edit, member counts | crews | 5 | 2026-03-26 |
| TASK-021W | Equipment service — EquipmentService, availability check, expiry alerts, maintenance + DVIR services | fleet | 5 | 2026-03-26 |
| TASK-022W | Equipment list, detail, create + edit — Next.js — type filter, expiry badges, all fields | fleet | 5 | 2026-03-26 |
| TASK-023W | Maintenance log + DVIR — Next.js — entry forms, history lists, receipt + signature upload | fleet | 5 | 2026-03-26 |
| TASK-015 | Client web service — listClients, getClientDetail, saveClient, createCommunication, lookups | clients | 4 | 2026-03-26 |
| TASK-016W | Client list + detail — Next.js — search, filter, incomplete badge, all detail sections | clients | 4 | 2026-03-26 |
| TASK-017W | Client create + edit — Next.js — form, lookups, referral source conditional, is_incomplete | clients | 4 | 2026-03-26 |
| TASK-018W | Communications log — Next.js — log form, attachment upload, last_contacted update | clients | 4 | 2026-03-26 |
| TASK-029W | Item catalog service + list/detail + price review workflow — Next.js | item_catalog | 6 | 2026-03-26 |
| TASK-030W | Item catalog create + edit — full form, specs, supplier links — Next.js | item_catalog | 6 | 2026-03-26 |
| TASK-031W | Suppliers + Partners — list/detail/create/edit, location management — Next.js | item_catalog | 6 | 2026-03-26 |
| TASK-032W | Material Configurations — list grouped by type, create/edit with role assignment — Next.js | product_catalog | 6 | 2026-03-26 |
| TASK-033W | Product Catalog — list by category, detail, form designer — Next.js | product_catalog | 6 | 2026-03-26 |
| TASK-034W | Employee service + list/detail — all sections, compensation gated, invite status — Next.js | employees_web | 7 | 2026-03-26 |
| TASK-035W | Employee create + edit — all fields, compensation insert, status transitions — Next.js | employees_web | 7 | 2026-03-26 |
| TASK-036W | Employee invite flow — invite-service, accept page, middleware public route — Next.js | employees_web | 7 | 2026-03-26 |
| TASK-037W | Roles + Permission matrix — role list/detail, 27-key matrix, per-employee overrides — Next.js | employees_web | 7 | 2026-03-26 |

---

## Review Escalations

| Task ID | Question | Raised by | Status |
|---|---|---|---|
| — | — | — | — |

---

## Task Ordering — Full View

| Task | Description | Phase | Track | Depends On | Parallel Safe | Status |
|---|---|---|---|---|---|---|
| TASK-001 | Flutter project scaffold | 0 | shared | none | no | done |
| TASK-002 | Core lib/ folder structure | 0 | shared | TASK-001 | no | done |
| TASK-003 | Schema — core auth tables + RLS | 1 | shared | TASK-001, TASK-002 | no | done |
| TASK-004 | Seed data — org creation | 1 | shared | TASK-003 | no | done |
| TASK-005 | Auth flow — sign up/in/out/reset | 1 | mobile | TASK-003 | no | done |
| TASK-006 | Org creation + onboarding | 1 | mobile | TASK-004, TASK-005 | no | done |
| TASK-007 | App shell — bottom nav + routes | 1 | mobile | TASK-006 | no | done |
| TASK-008 | Schema — employees, roles, permissions | 2 | shared | TASK-007 | no | done |
| TASK-009 | Employee service + providers | 2 | shared | TASK-008 | no | done |
| TASK-010 | Employee list + detail screens | 2 | mobile | TASK-009 | yes | done |
| TASK-011 | Employee create + edit screens | 2 | mobile | TASK-009 | yes | done |
| TASK-012 | Employee invite flow | 2 | mobile | TASK-009 | yes | done |
| TASK-013 | Role + permission management UI | 2 | mobile | TASK-009 | yes | done |
| TASK-029 | Next.js scaffold — web/ init, Supabase SSR, app shell | 3 | web | TASK-007 | no | done |
| TASK-014 | Schema — clients, addresses, contacts, lookups | 4 | shared | TASK-013 | no | done |
| TASK-015 | Client service + providers | 4 | shared | TASK-014 | no | done |
| TASK-016W | Client list + detail — Next.js | 4 | web | TASK-015 | yes | done |
| TASK-017W | Client create + edit — Next.js | 4 | web | TASK-015 | yes | done |
| TASK-018W | Communications log — Next.js | 4 | web | TASK-015 | yes | done |
| Phase 1001 | Mobile — Clients | 1001 | mobile | Phase 4 sign-off | — | placeholder |
| TASK-019 | Schema — crews, equipment, fleet | 5 | shared | TASK-013 | no | done |
| TASK-020W | Crews service + UI — Next.js | 5 | web | TASK-019 | yes | done |
| TASK-021W | Equipment service + providers | 5 | shared | TASK-019 | yes | done |
| TASK-022W | Equipment list, detail, create + edit — Next.js | 5 | web | TASK-021W | yes | done |
| TASK-023W | Maintenance log + DVIR — Next.js | 5 | web | TASK-021W | yes | done |
| Phase 1002 | Mobile — Crews & Fleet | 1002 | mobile | Phase 5 sign-off | — | placeholder |
| TASK-024 | Catalog schema | 5 (pre-decision) | shared | TASK-003 | no | done |
| TASK-025 | Item catalog service + providers | 5 (pre-decision) | shared | TASK-024 | no | done |
| TASK-026 | Item catalog + supplier UI (Flutter) | 5 (pre-decision) | mobile | TASK-025 | yes | done |
| TASK-027 | Product catalog service + formula engine | 5 (pre-decision) | shared | TASK-025 | no | done |
| TASK-028 | Product catalog builder UI (Flutter) | 5 (pre-decision) | mobile | TASK-027 | no | done |
| TASK-024 | Schema — catalog, suppliers, product catalog | 5 | TASK-003 | no | done |
| TASK-025 | Item catalog service + providers | 5 | TASK-024 | no | done |
| TASK-026 | Item catalog + supplier UI | 5 | TASK-025 | yes | done |
| TASK-027 | Product catalog service + formula engine | 5 | TASK-025 | no | done |
| TASK-028 | Product catalog builder UI | 5 | TASK-027 | no | done |
