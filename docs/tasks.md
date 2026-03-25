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

### TASK-001 · Flutter project scaffold
- **Status:** needs-review
- **Phase:** 0
- **Module:** scaffold
- **Parallel-safe:** no
- **Depends on:** none
- **Blocks:** TASK-002
- **Spec:** N/A — setup task
- **What to build:**
  Run `flutter create` with correct bundle ID, org, and platform flags. Seed `pubspec.yaml` with the full confirmed dependency stack. Run `flutter pub get`. Confirm `build_runner` works.
  ```bash
  flutter create --org com.freedomlandscapes --project-name freedom_app \
    --platforms ios,android .
  ```
  Then seed `pubspec.yaml` with:
  ```yaml
  dependencies:
    flutter:
      sdk: flutter
    flutter_riverpod: ^2.6.1
    riverpod_annotation: ^2.6.1
    supabase_flutter: ^2.x.x
    go_router: ^14.x.x
    freezed_annotation: ^3.0.0
    json_annotation: ^4.x.x
    flutter_dotenv: ^5.x.x
    math_expressions: ^2.x.x
    anthropic_sdk_dart: ^0.x.x
    deepgram_speech_to_text: ^1.x.x
    flutter_tts: ^4.x.x
    firebase_core: ^3.x.x
    firebase_messaging: ^15.x.x
    plaid_flutter: ^3.x.x

  dev_dependencies:
    flutter_test:
      sdk: flutter
    build_runner: ^2.x.x
    riverpod_generator: ^2.6.5
    freezed: ^3.0.0
    json_serializable: ^6.x.x
  ```
- **Acceptance criteria:**
  - [x] `flutter create` runs without error
  - [x] `flutter pub get` succeeds
  - [x] `flutter pub run build_runner build --delete-conflicting-outputs` succeeds
  - [x] App boots to blank screen on iOS simulator
- **Files to create/modify:** `pubspec.yaml`, generated Flutter project structure
- **After implementation:** Confirm on simulator, update `tasks.md`

---

### TASK-002 · Core lib/ folder structure
- **Status:** blocked — waiting on TASK-001
- **Phase:** 0
- **Module:** scaffold
- **Parallel-safe:** no
- **Depends on:** TASK-001
- **Blocks:** none
- **Spec:** N/A — setup task
- **What to build:** Scaffold the `lib/` folder structure per `architecture.md` conventions. Create placeholder `.dart` files (not stubs — just empty files with the correct package declaration).
- **Acceptance criteria:**
  - [ ] All folders and files exist per architecture.md structure
  - [ ] No compile errors
- **Files to create/modify:** All of `lib/`
- **After implementation:** Update `architecture.md` folder conventions if any deviations made

---

## Phase 1 · Foundation — Auth, Orgs, Core Shell

> Depends on: Phase 0 done, Supabase project linked.
> Sequential — no parallel tasks in this phase. Core identity must be fully wired before anything else.

---

### TASK-003 · Supabase schema — core auth tables + RLS
- **Status:** blocked — waiting on Phase 0 done + Supabase linked
- **Phase:** 1
- **Module:** auth
- **Parallel-safe:** no
- **Depends on:** TASK-001, TASK-002
- **Blocks:** TASK-004, TASK-005, TASK-006
- **Spec:** [specs/auth_spec.md](../specs/auth_spec.md)
- **What to build:**
  Run migrations via Supabase CLI. Create tables and policies exactly as defined in `data_structure.md`.
  - `organizations` table
  - `profiles` table
  - `org_members` table
  - `org_settings` table (full column set from history.md section — company info, branding, labor rates, markups, tax fields, portal fields)
  - `updated_at` trigger function (reusable across all tables)
  - Auto-create-profile trigger on `auth.users`
  - RLS policies on all four tables (see data_structure.md RLS patterns)
- **Acceptance criteria:**
  - [ ] `supabase db push` succeeds with no errors
  - [ ] Sign up creates a row in `profiles` automatically
  - [ ] RLS blocks cross-org reads (test with two orgs)
- **Files to create/modify:** `supabase/migrations/`, `lib/core/network/supabase_client_provider.dart`

---

### TASK-004 · Seed data function — org creation seeds
- **Status:** blocked — waiting on TASK-003
- **Phase:** 1
- **Module:** auth
- **Parallel-safe:** no
- **Depends on:** TASK-003
- **Blocks:** TASK-005
- **Spec:** specs/auth_spec.md
- **What to build:**
  Supabase Edge Function `seed-org-data` that fires after a new org is created. Seeds:
  - `roles` — 10 system roles exactly as defined in history.md (Owner, Executive, Operations Director, Manager, Sales/Estimator, Marketing, Crew Lead/PM, Fleet Manager, Driver, Field)
  - `role_permissions` — full permission matrix per role from history.md permission keys
  - `payment_terms` — 5 standard terms (Due on Receipt, Net 7, Net 15, Net 30, Net 45)
  - `estimate_types` — 5 types (Design/Build DB-10000, Special Projects SP-20000, Irrigation IR-30000, Maintenance MTN-40000, Snow SN-50000)
  - `expense_buckets` — full seeded bucket/sub-bucket tree from history.md (Projects, Maintenance, Snow, Irrigation, Overhead)
  All seeded records must have correct `org_id`, `sort_order`, and `is_active = true`.
- **Acceptance criteria:**
  - [ ] After org creation, all seed tables are populated with correct records
  - [ ] All records have correct `org_id`
  - [ ] `estimate_types.next_number` starts at correct value per type
- **Files to create/modify:** `supabase/functions/seed-org-data/`, `lib/features/auth/`

---

### TASK-005 · Auth flow — sign up, sign in, sign out, password reset
- **Status:** blocked — waiting on TASK-003
- **Phase:** 1
- **Module:** auth
- **Parallel-safe:** no
- **Depends on:** TASK-003
- **Blocks:** TASK-006
- **Spec:** specs/auth_spec.md
- **What to build:**
  Full auth flow. Screens + providers + service layer.
  - `AuthService` — wraps Supabase Auth. Methods: `signUp`, `signIn`, `signOut`, `resetPassword`, `getCurrentUser`
  - `AuthNotifier` (`@riverpod`) — holds auth state, exposes stream from Supabase auth changes
  - Sign up screen — email, password, full name. On success: trigger profile creation, redirect to org setup.
  - Sign in screen — email, password. On success: RouterNotifier checks for org, redirects appropriately.
  - Password reset screen — email input, confirmation message.
  - Sign out — available from settings/profile. Clears session, redirects to sign in.
  - `import 'package:supabase_flutter/supabase_flutter.dart' as supa;` in all auth files (AuthException clash rule).
- **Acceptance criteria:**
  - [ ] New user can sign up and land on org setup screen
  - [ ] Existing user can sign in and land on dashboard (if org exists)
  - [ ] Sign out clears session and redirects to sign in
  - [ ] Password reset email is sent
  - [ ] Invalid credentials show user-friendly error (not raw exception)
- **Files to create/modify:** `lib/features/auth/`, `lib/core/routing/router_notifier.dart`

---

### TASK-006 · Org creation + onboarding flow
- **Status:** blocked — waiting on TASK-004, TASK-005
- **Phase:** 1
- **Module:** orgs
- **Parallel-safe:** no
- **Depends on:** TASK-004, TASK-005
- **Blocks:** TASK-007
- **Spec:** specs/auth_spec.md
- **What to build:**
  Post-signup org creation. Minimal — name + basic info to get started.
  - `OrgService` — `createOrg(name)`: inserts into `organizations`, creates `org_members` record (role = owner), inserts `org_settings` row with defaults, calls `seed-org-data` Edge Function.
  - `OrgNotifier` (`@riverpod`) — holds current org, exposes current org_id globally.
  - Org setup screen — company name input. Submit creates org and redirects to dashboard.
  - RouterNotifier guard: if session exists but no org → redirect to `/orgs/setup`.
- **Acceptance criteria:**
  - [ ] New user lands on org setup after sign up
  - [ ] Completing setup creates org, org_settings, org_members, and triggers seed data
  - [ ] User is redirected to dashboard after org creation
  - [ ] RouterNotifier correctly guards org-required routes
- **Files to create/modify:** `lib/features/orgs/`, `lib/core/routing/router_notifier.dart`, `lib/core/routing/app_router.dart`

---

### TASK-007 · App shell — bottom nav + route structure
- **Status:** blocked — waiting on TASK-006
- **Phase:** 1
- **Module:** scaffold
- **Parallel-safe:** no
- **Depends on:** TASK-006
- **Blocks:** none (all feature modules depend on this)
- **Spec:** N/A — shell task
- **What to build:**
  App shell with bottom nav and placeholder screens for each top-level route. This is the skeleton everything else mounts onto.
  - `AppShell` widget — scaffold with `NavigationBar` (Material 3)
  - Routes: Dashboard, Clients, Estimates, Schedule, Menu (more items)
  - Each route loads a placeholder screen with the module name — replaced as phases complete
  - GoRouter shell route wraps all authenticated routes
  - `app_router.dart` — full route table with shell, guards, and named routes
  - `app_routes.dart` — named route constants
- **Acceptance criteria:**
  - [ ] Bottom nav renders and switches between placeholder screens
  - [ ] Unauthenticated user cannot reach shell routes
  - [ ] No-org user cannot reach shell routes
  - [ ] All route constants defined and named
- **Files to create/modify:** `lib/core/routing/`, `lib/app.dart`, `lib/main.dart`

---

## Phase 2 · Employees, Roles & Permissions

> Depends on: Phase 1 complete.
> Two parallel tracks: schema (TASK-008) unblocks everything. UI can be split after schema is done.

---

### TASK-008 · Supabase schema — employees, roles, permissions + RLS
- **Status:** blocked — waiting on Phase 1 done
- **Phase:** 2
- **Module:** employees
- **Parallel-safe:** no
- **Depends on:** TASK-007
- **Blocks:** TASK-009, TASK-010, TASK-011, TASK-012
- **Spec:** specs/employees_spec.md _(to be created before this task is marked ready)_
- **What to build:**
  Full schema migration for the employees and permissions system.
  - `roles` table + RLS
  - `role_permissions` table + RLS
  - `employees` table (full column set from history.md) + RLS
  - `employee_permission_overrides` table + RLS
  - `employee_compensation` table + RLS (restricted to owner/exec — permission-gated via RLS)
  - `employee_invites` table + RLS
  - `employee_preferences` table + RLS
  - `custom_field_definitions` table + RLS
  - `custom_field_values` table + RLS
  - `updated_at` trigger applied to all tables
- **Acceptance criteria:**
  - [ ] Migration runs clean
  - [ ] RLS blocks employees from viewing other orgs' data
  - [ ] Compensation rows only readable by users with `compensation.view` permission
- **Files to create/modify:** `supabase/migrations/`

---

### TASK-009 · Employee service + providers
- **Status:** blocked — waiting on TASK-008
- **Phase:** 2
- **Module:** employees
- **Parallel-safe:** yes
- **Depends on:** TASK-008
- **Blocks:** TASK-010
- **Spec:** specs/employees_spec.md
- **What to build:**
  Data/service layer for employees. No UI yet.
  - `EmployeeService` — CRUD for employees, list with org scope, get by id, get by auth uid
  - `EmployeeListNotifier` (`@riverpod`) — paginated employee list
  - `CurrentEmployeeNotifier` (`@riverpod`) — the logged-in user's employee record (looked up by `supabase_auth_uid`)
  - `PermissionService` — resolves effective permissions: load role permissions + apply overrides. Single method: `hasPermission(employeeId, permissionKey) → bool`
  - `PermissionNotifier` (`@riverpod`) — holds current user's resolved permission set, used globally for UI gating
  - Freezed models: `Employee`, `Role`, `RolePermission`, `EmployeePermissionOverride`
- **Acceptance criteria:**
  - [ ] `CurrentEmployeeNotifier` resolves correctly after sign in
  - [ ] `PermissionService.hasPermission` returns correct results for role + override combos
  - [ ] `build_runner` runs clean after all `@riverpod` + `@freezed` changes
- **Files to create/modify:** `lib/features/employees/`

---

### TASK-010 · Employee list + detail screens
- **Status:** blocked — waiting on TASK-009
- **Phase:** 2
- **Module:** employees
- **Parallel-safe:** yes
- **Depends on:** TASK-009
- **Blocks:** none
- **Spec:** specs/employees_spec.md
- **What to build:**
  Employee browse and detail UI.
  - Employee list screen — sortable, filterable by status/role/crew. Mobile layout.
  - Employee detail screen — all fields visible per `employees.view` permission. Compensation section gated to `compensation.view`.
  - Status badge (active / on_leave / terminated / resigned)
  - Navigation: list → detail
- **Acceptance criteria:**
  - [ ] Employee list loads and displays all active employees
  - [ ] Filtering by status works
  - [ ] Detail screen shows correct data
  - [ ] Compensation section hidden from users without `compensation.view`
- **Files to create/modify:** `lib/features/employees/layouts/mobile/`, `lib/features/employees/widgets/`

---

### TASK-011 · Employee create + edit screens
- **Status:** blocked — waiting on TASK-009
- **Phase:** 2
- **Module:** employees
- **Parallel-safe:** yes
- **Depends on:** TASK-009
- **Blocks:** none
- **Spec:** specs/employees_spec.md
- **What to build:**
  Create and edit flows for employee records.
  - Create screen — all required fields, role picker (dropdown from `roles`), employment type enum, status default `active`
  - Edit screen — same form pre-populated
  - `display_name` auto-suggest on first/last name change (user can override)
  - Status change actions: activate, place on leave, terminate, resign — with confirmation dialog
  - Compensation entry form (gated to `compensation.view`) — pay type, rate, effective date, reason
- **Acceptance criteria:**
  - [ ] New employee can be created and appears in list immediately
  - [ ] Edit saves correctly
  - [ ] Status transitions work and persist
  - [ ] Compensation entry saves to `employee_compensation` with correct `effective_date`
- **Files to create/modify:** `lib/features/employees/layouts/mobile/`, `lib/features/employees/helpers/`

---

### TASK-012 · Employee invite flow
- **Status:** blocked — waiting on TASK-009
- **Phase:** 2
- **Module:** employees
- **Parallel-safe:** yes
- **Depends on:** TASK-009
- **Blocks:** none
- **Spec:** specs/employees_spec.md
- **What to build:**
  Invite system so employees can be given app access.
  - `InviteService` — `sendInvite(employeeId, email)`: generates token, inserts `employee_invites` row, calls Supabase Edge Function to send invite email
  - Edge Function `send-invite-email` — sends email with invite link containing token
  - Invite accept screen (deep link or web link) — user sets password, `supabase_auth_uid` is linked to employee record on accept
  - Invite status visible on employee detail (pending / accepted / expired)
  - Resend and revoke invite actions
- **Acceptance criteria:**
  - [ ] Invite email is sent
  - [ ] Accepting invite creates Supabase Auth user and links to employee record
  - [ ] Invite status updates correctly
  - [ ] Expired tokens are rejected
- **Files to create/modify:** `lib/features/employees/`, `supabase/functions/send-invite-email/`

---

### TASK-013 · Role + permission management UI
- **Status:** blocked — waiting on TASK-009
- **Phase:** 2
- **Module:** employees
- **Parallel-safe:** yes
- **Depends on:** TASK-009
- **Blocks:** none
- **Spec:** specs/employees_spec.md
- **What to build:**
  UI for managing roles and per-employee permission overrides.
  - Role list screen — shows all roles, system roles marked, custom roles (future)
  - Role detail screen — shows all permission keys and granted/denied state for that role
  - Per-employee override panel (on employee detail screen) — list of overridden permission keys with grant/revoke toggle
  - Gated to `employees.manage` permission
- **Acceptance criteria:**
  - [ ] Role list loads all seeded roles
  - [ ] Role detail shows correct permissions
  - [ ] Adding an override to an employee persists and is reflected in `PermissionService`
- **Files to create/modify:** `lib/features/employees/layouts/mobile/`

---

## Phase 3 · Clients, Addresses & Contacts

> Depends on: Phase 2 complete.
> Schema (TASK-014) unblocks all. UI tracks can run in parallel after schema + service layer done.

---

### TASK-014 · Supabase schema — clients, addresses, contacts, lookup tables + RLS
- **Status:** blocked — waiting on Phase 2 done
- **Phase:** 3
- **Module:** clients
- **Parallel-safe:** no
- **Depends on:** TASK-013
- **Blocks:** TASK-015, TASK-016, TASK-017, TASK-018
- **Spec:** specs/clients_spec.md _(to be created before this task is marked ready)_
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
- **Status:** blocked — waiting on Phase 2 done
- **Phase:** 4
- **Module:** crews
- **Parallel-safe:** no
- **Depends on:** TASK-013
- **Blocks:** TASK-020, TASK-021, TASK-022, TASK-023
- **Spec:** specs/fleet_spec.md _(to be created before this task is marked ready)_
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
> Schema (TASK-024) unblocks everything. Item catalog (TASK-025/026) must be done before product catalog (TASK-027/028).

---

### TASK-024 · Supabase schema — catalog, suppliers, product catalog tables + RLS
- **Status:** blocked — waiting on Phase 1 done
- **Phase:** 5
- **Module:** item_catalog
- **Parallel-safe:** no
- **Depends on:** TASK-007
- **Blocks:** TASK-025, TASK-026, TASK-027, TASK-028
- **Spec:** specs/catalog_spec.md _(to be created before this task is marked ready)_
- **What to build:**
  Full schema migration for item catalog, suppliers, and product catalog.
  - `catalog_items` table (including rounding fields: color, quantity_type, round_to, minimum_qty, package_unit) + RLS
  - `catalog_item_specs` table + RLS
  - `suppliers` table + RLS
  - `supplier_locations` table + RLS
  - `catalog_item_suppliers` table + RLS
  - `partners` table + RLS
  - `material_configurations` table + RLS
  - `material_configuration_roles` table + RLS
  - `product_catalog` table + RLS
  - `product_catalog_inputs` table + RLS
  - `product_catalog_components` table + RLS
  - `updated_at` trigger on all new tables
- **Acceptance criteria:**
  - [ ] Migration runs clean
  - [ ] RLS enforces org scoping on all tables
  - [ ] `catalog_item_suppliers` preferred vendor constraint works (only one `is_preferred = true` per item)
- **Files to create/modify:** `supabase/migrations/`

---

### TASK-025 · Item catalog service + providers
- **Status:** blocked — waiting on TASK-024
- **Phase:** 5
- **Module:** item_catalog
- **Parallel-safe:** no
- **Depends on:** TASK-024
- **Blocks:** TASK-026, TASK-027
- **Spec:** specs/catalog_spec.md
- **What to build:**
  Data/service layer for item catalog and suppliers. No UI yet.
  - `CatalogItemService` — CRUD, list (paginated, searchable), get with specs + suppliers
  - `SupplierService` — CRUD, list, get with locations, get nearest location to a lat/lng
  - `PartnerService` — CRUD, list
  - `CatalogItemListNotifier` (`@riverpod`)
  - `CatalogItemDetailNotifier` (`@riverpod`) — single item with specs, suppliers, pricing hierarchy resolved
  - Pricing hierarchy helper in `lib/features/item_catalog/helpers/pricing_helpers.dart` — implements the 4-step price resolution from history.md
  - Price review alert logic — items where `today > last_price_updated_at + price_review_frequency_days`
  - Freezed models: `CatalogItem`, `CatalogItemSpec`, `Supplier`, `SupplierLocation`, `CatalogItemSupplier`, `Partner`
- **Acceptance criteria:**
  - [ ] Pricing hierarchy resolves in correct priority order
  - [ ] Price review alerts surface overdue items
  - [ ] Nearest supplier location calculation returns correct result given a lat/lng
  - [ ] `build_runner` clean
- **Files to create/modify:** `lib/features/item_catalog/`

---

### TASK-026 · Item catalog + supplier UI
- **Status:** blocked — waiting on TASK-025
- **Phase:** 5
- **Module:** item_catalog
- **Parallel-safe:** yes
- **Depends on:** TASK-025
- **Blocks:** none
- **Spec:** specs/catalog_spec.md
- **What to build:**
  Item catalog and supplier management UI.
  - Catalog item list screen — search, filter by category, price review alert badge
  - Catalog item detail screen — specs, supplier pricing list, price history
  - Catalog item create/edit screen — all fields, spec inputs, supplier linking
  - Supplier list + detail + create/edit screens
  - Supplier location management (sub-list on supplier detail)
  - Partner list + detail + create/edit screens
  - Price review workflow — list of overdue items, tap to review and confirm/update price
- **Acceptance criteria:**
  - [ ] Item list loads with search + filter
  - [ ] Price review alert badge shows on overdue items
  - [ ] Reviewing a price resets `last_price_updated_at`
  - [ ] Supplier list with locations loads correctly
- **Files to create/modify:** `lib/features/item_catalog/layouts/mobile/`

---

### TASK-027 · Product catalog service + formula engine
- **Status:** blocked — waiting on TASK-025
- **Phase:** 5
- **Module:** product_catalog
- **Parallel-safe:** no
- **Depends on:** TASK-025
- **Blocks:** TASK-028
- **Spec:** specs/catalog_spec.md
- **What to build:**
  Service layer + formula engine for product catalog. No UI yet.
  - `ProductCatalogService` — CRUD, list, get with inputs + components, evaluate formula for given inputs
  - `FormulaEngine` in `lib/features/product_catalog/helpers/formula_engine.dart` — wraps `math_expressions`. Takes formula string + variable map (input values + item spec values). Returns computed quantity.
  - `MaterialConfigService` — CRUD for material configurations and their roles
  - `ProductCatalogNotifier` (`@riverpod`)
  - System-seeded product template migration — all templates from history.md seeded as `is_system_template = true` rows in `product_catalog`. Shell records only (inputs and components empty — filled by Backtrack P2).
  - Freezed models: `ProductCatalog`, `ProductCatalogInput`, `ProductCatalogComponent`, `MaterialConfiguration`, `MaterialConfigurationRole`
- **Acceptance criteria:**
  - [ ] `FormulaEngine` evaluates a simple formula (`area / spread_rate * depth`) with correct result
  - [ ] `FormulaEngine` handles missing variables gracefully (returns null / error state, not a crash)
  - [ ] All system template shell records seeded in DB
  - [ ] `build_runner` clean
- **Files to create/modify:** `lib/features/product_catalog/`, `supabase/migrations/` (seed data)

---

### TASK-028 · Product catalog builder UI
- **Status:** blocked — waiting on TASK-027
- **Phase:** 5
- **Module:** product_catalog
- **Parallel-safe:** no
- **Depends on:** TASK-027
- **Blocks:** none (Phase 6 estimates depends on this whole phase being done)
- **Spec:** specs/catalog_spec.md
- **What to build:**
  Product catalog browse and builder UI.
  - Product catalog list screen — grouped by category, system templates visually distinct
  - Product detail screen — shows all inputs and components with formula strings
  - Product create/edit screen (form designer):
    - Name, category, pricing mode, install rate, labor rate override
    - Input builder: add/remove/reorder inputs (label, input_type, unit_label, required, default)
    - Component builder: add/remove/reorder components (label, type, item picker or input ref, formula string)
  - Material configuration builder:
    - Config type picker, name, item assignment per role
    - Color auto-generation preview
  - System templates: all fields editable, but cannot delete
- **Acceptance criteria:**
  - [ ] Product list loads grouped by category
  - [ ] System templates load with correct metadata
  - [ ] Adding an input and component to a product and saving persists correctly
  - [ ] Material configuration with two items saves and previews color options
- **Files to create/modify:** `lib/features/product_catalog/layouts/mobile/`

---

## Completed Tasks

| Task ID | Description | Module | Phase | Completed |
|---|---|---|---|---|
| — | Nothing complete yet | — | — | — |

---

## Review Escalations

| Task ID | Question | Raised by | Status |
|---|---|---|---|
| — | — | — | — |

---

## Task Ordering — Full View

| Task | Description | Phase | Depends On | Parallel Safe | Status |
|---|---|---|---|---|---|
| TASK-001 | Flutter project scaffold | 0 | none | no | needs-review |
| TASK-002 | Core lib/ folder structure | 0 | TASK-001 | no | blocked |
| TASK-003 | Schema — core auth tables + RLS | 1 | TASK-001, TASK-002 | no | blocked |
| TASK-004 | Seed data — org creation | 1 | TASK-003 | no | blocked |
| TASK-005 | Auth flow — sign up/in/out/reset | 1 | TASK-003 | no | blocked |
| TASK-006 | Org creation + onboarding | 1 | TASK-004, TASK-005 | no | blocked |
| TASK-007 | App shell — bottom nav + routes | 1 | TASK-006 | no | blocked |
| TASK-008 | Schema — employees, roles, permissions | 2 | TASK-007 | no | blocked |
| TASK-009 | Employee service + providers | 2 | TASK-008 | no | blocked |
| TASK-010 | Employee list + detail screens | 2 | TASK-009 | yes | blocked |
| TASK-011 | Employee create + edit screens | 2 | TASK-009 | yes | blocked |
| TASK-012 | Employee invite flow | 2 | TASK-009 | yes | blocked |
| TASK-013 | Role + permission management UI | 2 | TASK-009 | yes | blocked |
| TASK-014 | Schema — clients, addresses, contacts, lookups | 3 | TASK-013 | no | blocked |
| TASK-015 | Client service + providers | 3 | TASK-014 | no | blocked |
| TASK-016 | Client list + detail screens | 3 | TASK-015 | yes | blocked |
| TASK-017 | Client create + edit screens | 3 | TASK-015 | yes | blocked |
| TASK-018 | Communications log UI | 3 | TASK-015 | yes | blocked |
| TASK-019 | Schema — crews, equipment, fleet | 4 | TASK-013 | no | blocked |
| TASK-020 | Crews service + UI | 4 | TASK-019 | yes | blocked |
| TASK-021 | Equipment service + providers | 4 | TASK-019 | yes | blocked |
| TASK-022 | Equipment list, detail, create + edit | 4 | TASK-021 | yes | blocked |
| TASK-023 | Maintenance log + DVIR screens | 4 | TASK-021 | yes | blocked |
| TASK-024 | Schema — catalog, suppliers, product catalog | 5 | TASK-007 | no | blocked |
| TASK-025 | Item catalog service + providers | 5 | TASK-024 | no | blocked |
| TASK-026 | Item catalog + supplier UI | 5 | TASK-025 | yes | blocked |
| TASK-027 | Product catalog service + formula engine | 5 | TASK-025 | no | blocked |
| TASK-028 | Product catalog builder UI | 5 | TASK-027 | no | blocked |
