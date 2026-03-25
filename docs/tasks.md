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

## Phase 1 · Foundation — Auth, Orgs, Core Shell

> Depends on: Phase 0 done, Supabase project linked.
> **Status: COMPLETE** — TASK-001 through TASK-007 done. See Completed Tasks table.

---

## Phase 2 · Employees, Roles & Permissions

> Depends on: Phase 1 complete.
> **Status: COMPLETE** — TASK-008 through TASK-013 done. See Completed Tasks table.

---

## Phase 3 · Clients, Addresses & Contacts

> Depends on: Phase 2 complete.
> Schema (TASK-014) unblocks all. UI tracks can run in parallel after schema + service layer done.

---

### TASK-014 · Supabase schema — clients, addresses, contacts, lookup tables + RLS
- **Status:** ready
- **Phase:** 3
- **Module:** clients
- **Parallel-safe:** no
- **Depends on:** TASK-013
- **Blocks:** TASK-015, TASK-016, TASK-017, TASK-018
- **Spec:** specs/clients_spec.md
- **What to build:**
  Full schema migration for clients and all supporting lookup tables.
  - `clients` table (full column set from history.md) + RLS
  - `client_addresses` table + RLS
  - `client_contacts` table + RLS
  - `client_tags` join table + RLS
  - `client_types` lookup table + RLS
  - `tags` lookup table + RLS
  - `referral_funnels` lookup table + RLS
  - `referral_sources` lookup table + RLS
  - `payment_terms` table (already seeded in TASK-004 — confirm exists, add RLS if missing)
  - `notes` table (global — entity_type enum, entity_id) + RLS
  - `note_attachments` table + RLS
  - `tasks` table (global — entity_type enum) + RLS
  - `task_followers` join table + RLS
  - `communications` table + RLS
  - `communication_attachments` table + RLS
  - `updated_at` trigger on all new tables
- **Acceptance criteria:**
  - [ ] Migration runs clean
  - [ ] RLS enforces org scoping on all tables
  - [ ] `client_tags` join correctly links clients to tags within same org
- **Files to create/modify:** `supabase/migrations/`

---

### TASK-015 · Client service + providers
- **Status:** blocked — waiting on TASK-014
- **Phase:** 3
- **Module:** clients
- **Parallel-safe:** no
- **Depends on:** TASK-014
- **Blocks:** TASK-016, TASK-017, TASK-018
- **Spec:** specs/clients_spec.md
- **What to build:**
  Data/service layer for clients. No UI yet.
  - `ClientService` — CRUD, list (org-scoped, paginated), search by name/phone/email, get by id
  - `ClientListNotifier` (`@riverpod`) — paginated + filterable client list
  - `ClientDetailNotifier` (`@riverpod`) — single client with addresses, contacts, tags loaded
  - `is_incomplete` flag logic — computed in service on create/update: true if `referral_funnel_id`, `client_type_id`, or `sales_lead` is null
  - `display_name` auto-suggest helper in `lib/features/clients/helpers/client_helpers.dart`
  - Freezed models: `Client`, `ClientAddress`, `ClientContact`, `ClientTag`, `ClientType`, `Tag`, `ReferralFunnel`, `ReferralSource`
- **Acceptance criteria:**
  - [ ] `ClientListNotifier` returns paginated, org-scoped results
  - [ ] `is_incomplete` flag computed correctly on create and update
  - [ ] `display_name` auto-suggest logic matches all four cases from history.md
  - [ ] `build_runner` clean
- **Files to create/modify:** `lib/features/clients/`

---

### TASK-016 · Client list + detail screens
- **Status:** blocked — waiting on TASK-015
- **Phase:** 3
- **Module:** clients
- **Parallel-safe:** yes
- **Depends on:** TASK-015
- **Blocks:** none
- **Spec:** specs/clients_spec.md
- **What to build:**
  Client browse and detail UI.
  - Client list screen — search bar, filter by client_type/tag/is_incomplete, sort by name/last_contacted
  - Incomplete flag badge — surfaces clients missing required fields
  - Client detail screen — all info sections: info, addresses, contacts, tags, notes, communications, tasks
  - Each section collapsible; each can navigate to its own manage screen
- **Acceptance criteria:**
  - [ ] List loads and searches correctly
  - [ ] Incomplete clients flagged visually
  - [ ] Detail screen loads all related data
  - [ ] Navigation between list and detail works
- **Files to create/modify:** `lib/features/clients/layouts/mobile/`, `lib/features/clients/widgets/`

---

### TASK-017 · Client create + edit screens
- **Status:** blocked — waiting on TASK-015
- **Phase:** 3
- **Module:** clients
- **Parallel-safe:** yes
- **Depends on:** TASK-015
- **Blocks:** none
- **Spec:** specs/clients_spec.md
- **What to build:**
  Create and edit flows for client records.
  - Create screen — type toggle (Residential / Organization), all required fields, `display_name` auto-suggest, client_type picker, tag multi-select, referral funnel picker (shows source picker if `requires_source = true`), sales lead picker (employees filtered to `is_sales = true`), payment terms picker
  - Edit screen — same form pre-populated
  - Address create/edit inline (at least one address required)
  - Contact create/edit inline
- **Acceptance criteria:**
  - [ ] Residential and org clients create correctly with different field behavior
  - [ ] `display_name` auto-suggests and user can override
  - [ ] Referral source shows/hides based on funnel's `requires_source`
  - [ ] `is_incomplete` recalculates correctly on save
- **Files to create/modify:** `lib/features/clients/layouts/mobile/`, `lib/features/clients/helpers/`

---

### TASK-018 · Communications log UI
- **Status:** blocked — waiting on TASK-015
- **Phase:** 3
- **Module:** clients
- **Parallel-safe:** yes
- **Depends on:** TASK-015
- **Blocks:** none
- **Spec:** specs/clients_spec.md
- **What to build:**
  Log and view client communications.
  - Communications list on client detail — chronological, shows method + direction + result
  - Log communication form — method (phone/email/text/in_person/portal_message), direction (inbound/outbound), result enum, notes, occurred_at datetime, optional file attachment
  - `CommunicationService` — create, list by client_id, attach file to Supabase storage
- **Acceptance criteria:**
  - [ ] Communication can be logged from client detail screen
  - [ ] List shows all logged communications in chronological order
  - [ ] File attachment uploads to Supabase storage and URL saves to `communication_attachments`
- **Files to create/modify:** `lib/features/clients/`, `lib/features/clients/widgets/`

---

## Phase 4 · Crews & Equipment / Fleet

> Depends on: Phase 2 complete (employees must exist for crew_lead_id and driver assignments).
> Can run in parallel with Phase 3 — no cross-dependency.
> Schema (TASK-019) unblocks everything in this phase.

---

### TASK-019 · Supabase schema — crews, equipment, fleet tables + RLS
- **Status:** ready
- **Phase:** 4
- **Module:** crews
- **Parallel-safe:** no
- **Depends on:** TASK-013
- **Blocks:** TASK-020, TASK-021, TASK-022, TASK-023
- **Spec:** specs/fleet_spec.md
- **What to build:**
  Full schema migration for crews and fleet management.
  - `crews` table + RLS
  - `equipment` table (full column set from history.md) + RLS
  - `equipment_assignments` table + RLS
  - `equipment_schedule` table + RLS
  - `equipment_requests` table + RLS
  - `equipment_maintenance` table + RLS
  - `vehicle_inspections` table + RLS
  - `updated_at` trigger on all new tables
- **Acceptance criteria:**
  - [ ] Migration runs clean
  - [ ] RLS enforces org scoping
  - [ ] `equipment_schedule` overlap queries work correctly (test conflicting assignments)
- **Files to create/modify:** `supabase/migrations/`

---

### TASK-020 · Crews service + UI
- **Status:** blocked — waiting on TASK-019
- **Phase:** 4
- **Module:** crews
- **Parallel-safe:** yes
- **Depends on:** TASK-019
- **Blocks:** none
- **Spec:** specs/fleet_spec.md
- **What to build:**
  Full crews module — service + UI.
  - `CrewService` — CRUD, list org-scoped, get members (employees where `crew_id` = this crew)
  - `CrewListNotifier` (`@riverpod`)
  - Crew list screen — active crews, member count, crew lead name
  - Crew detail screen — crew lead, member list (read from employees), notes
  - Crew create/edit screen — name, crew lead picker (employee dropdown)
  - Freezed model: `Crew`
- **Acceptance criteria:**
  - [ ] Crews list loads correctly
  - [ ] Crew detail shows correct members (pulled from employees.crew_id)
  - [ ] Create/edit saves correctly
- **Files to create/modify:** `lib/features/crews/`

---

### TASK-021 · Equipment service + providers
- **Status:** blocked — waiting on TASK-019
- **Phase:** 4
- **Module:** fleet
- **Parallel-safe:** yes
- **Depends on:** TASK-019
- **Blocks:** TASK-022, TASK-023
- **Spec:** specs/fleet_spec.md
- **What to build:**
  Data/service layer for equipment. No UI yet.
  - `EquipmentService` — CRUD, list, get with assignments/schedule, check availability for date range
  - `EquipmentListNotifier` (`@riverpod`)
  - `EquipmentDetailNotifier` (`@riverpod`) — single equipment with maintenance log, schedule, current assignment
  - Expiry alert logic: surface equipment where `registration_expiry`, `insurance_expiry`, or `annual_inspection_due` is within 30 days or past
  - Freezed models: `Equipment`, `EquipmentAssignment`, `EquipmentSchedule`, `EquipmentMaintenance`, `VehicleInspection`
- **Acceptance criteria:**
  - [ ] Equipment list loads org-scoped
  - [ ] Availability check correctly identifies conflicts for non-shareable equipment
  - [ ] Expiry alerts surface overdue and near-due records
  - [ ] `build_runner` clean
- **Files to create/modify:** `lib/features/fleet/`

---

### TASK-022 · Equipment list, detail, create + edit screens
- **Status:** blocked — waiting on TASK-021
- **Phase:** 4
- **Module:** fleet
- **Parallel-safe:** yes
- **Depends on:** TASK-021
- **Blocks:** none
- **Spec:** specs/fleet_spec.md
- **What to build:**
  Equipment browse and management UI.
  - Equipment list screen — filter by type (truck/trailer/equipment/attachment), status badges for expiring docs
  - Equipment detail screen — all fields, maintenance log list, DVIR history, current assignment
  - Equipment create/edit screen — all fields from history.md schema
  - Expiry alert banners on detail screen and list badges
- **Acceptance criteria:**
  - [ ] List loads all equipment with correct type filter
  - [ ] Expiry alerts visible on list and detail
  - [ ] Create/edit saves correctly
- **Files to create/modify:** `lib/features/fleet/layouts/mobile/`

---

### TASK-023 · Maintenance log + DVIR screens
- **Status:** blocked — waiting on TASK-021
- **Phase:** 4
- **Module:** fleet
- **Parallel-safe:** yes
- **Depends on:** TASK-021
- **Blocks:** none
- **Spec:** specs/fleet_spec.md
- **What to build:**
  Maintenance logging and daily vehicle inspection UI.
  - `MaintenanceService` / `DVIRService` — create entries, list by equipment
  - Maintenance log entry form — type, performed_date, mileage, next_service_date, cost, performed_by, receipt upload
  - DVIR form — pre_trip / post_trip toggle, odometer, defects list (checkboxes), pass/fail, signature pad (image capture), notes
  - Maintenance history list on equipment detail
  - DVIR history list on equipment detail
- **Acceptance criteria:**
  - [ ] Maintenance entry saves with receipt URL in Supabase storage
  - [ ] DVIR saves with signature image URL
  - [ ] Both history lists load correctly on equipment detail
- **Files to create/modify:** `lib/features/fleet/layouts/mobile/`, `lib/features/fleet/widgets/`

---

## Phase 5 · Item Catalog, Suppliers & Product Catalog

> Depends on: Phase 1 complete (only needs org context — can run parallel to Phases 3 and 4).
> **Status: COMPLETE** — TASK-024 through TASK-028 done. See Completed Tasks table.

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

---

## Review Escalations

| Task ID | Question | Raised by | Status |
|---|---|---|---|
| — | — | — | — |

---

## Task Ordering — Full View

| Task | Description | Phase | Depends On | Parallel Safe | Status |
|---|---|---|---|---|---|
| TASK-001 | Flutter project scaffold | 0 | none | no | done |
| TASK-002 | Core lib/ folder structure | 0 | TASK-001 | no | done |
| TASK-003 | Schema — core auth tables + RLS | 1 | TASK-001, TASK-002 | no | done |
| TASK-004 | Seed data — org creation | 1 | TASK-003 | no | done |
| TASK-005 | Auth flow — sign up/in/out/reset | 1 | TASK-003 | no | done |
| TASK-006 | Org creation + onboarding | 1 | TASK-004, TASK-005 | no | done |
| TASK-007 | App shell — bottom nav + routes | 1 | TASK-006 | no | done |
| TASK-008 | Schema — employees, roles, permissions | 2 | TASK-007 | no | done |
| TASK-009 | Employee service + providers | 2 | TASK-008 | no | done |
| TASK-010 | Employee list + detail screens | 2 | TASK-009 | yes | done |
| TASK-011 | Employee create + edit screens | 2 | TASK-009 | yes | done |
| TASK-012 | Employee invite flow | 2 | TASK-009 | yes | done |
| TASK-013 | Role + permission management UI | 2 | TASK-009 | yes | done |
| TASK-014 | Schema — clients, addresses, contacts, lookups | 3 | TASK-013 | no | ready |
| TASK-015 | Client service + providers | 3 | TASK-014 | no | blocked |
| TASK-016 | Client list + detail screens | 3 | TASK-015 | yes | blocked |
| TASK-017 | Client create + edit screens | 3 | TASK-015 | yes | blocked |
| TASK-018 | Communications log UI | 3 | TASK-015 | yes | blocked |
| TASK-019 | Schema — crews, equipment, fleet | 4 | TASK-013 | no | ready |
| TASK-020 | Crews service + UI | 4 | TASK-019 | yes | blocked |
| TASK-021 | Equipment service + providers | 4 | TASK-019 | yes | blocked |
| TASK-022 | Equipment list, detail, create + edit | 4 | TASK-021 | yes | blocked |
| TASK-023 | Maintenance log + DVIR screens | 4 | TASK-021 | yes | blocked |
| TASK-024 | Schema — catalog, suppliers, product catalog | 5 | TASK-003 | no | done |
| TASK-025 | Item catalog service + providers | 5 | TASK-024 | no | done |
| TASK-026 | Item catalog + supplier UI | 5 | TASK-025 | yes | done |
| TASK-027 | Product catalog service + formula engine | 5 | TASK-025 | no | done |
| TASK-028 | Product catalog builder UI | 5 | TASK-027 | no | done |
