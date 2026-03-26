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

## Phase 6 · Web — Item Catalog, Suppliers & Product Catalog ← CURRENT

> Track: Web
> Depends on: Phase 5 schema already live (catalog tables on remote).
> TASK-029W and TASK-034W (Phase 7) can be picked up in parallel — no cross-phase dependency.

---

### TASK-029W · Item catalog service + list/detail + price review — Next.js
- **Status:** ready
- **Phase:** 6
- **Track:** web
- **Module:** item_catalog
- **Parallel-safe:** no (unblocks 030W, 031W, 032W, 033W)
- **Depends on:** TASK-029 (scaffold)
- **Blocks:** TASK-030W, TASK-031W, TASK-032W, TASK-033W
- **Spec:** specs/catalog_spec.md
- **What to build:**
  - `web/lib/catalog/catalog-service.ts` — `getItems(orgId, filters?)`, `getItem(orgId, id)`, `createItem(orgId, data)`, `updateItem(orgId, id, data)`, `deleteItem(orgId, id)`, `getPriceReviewItems(orgId)`, `markItemReviewed(orgId, id)` — use `getViewerContext()` pattern
  - `web/app/(app)/catalog/items/page.tsx` — item list:
    - Search bar (filters by name client-side)
    - Category filter chips
    - "Needs Review" toggle — filters to items where `today > last_price_updated_at + price_review_frequency_days`
    - Price review badge on overdue rows
    - Price review mode: inline cost edit on overdue rows, "Mark Reviewed" resets `last_price_updated_at` to today
    - "Add Item" button → `/catalog/items/new`
  - `web/app/(app)/catalog/items/[id]/page.tsx` — item detail:
    - Sections: name/unit/description, Specs (dimensions, spread rate, face feet, extra specs), Pricing (default cost, sell price, markup %, waste %), Supplier links (each with unit_cost, last_price_date, is_preferred badge), Price review info (frequency, last reviewed, next due), Rounding rules
    - Edit button → `/catalog/items/[id]/edit`
- **Acceptance criteria:**
  - [ ] Item list loads with search + category filter
  - [ ] "Needs Review" toggle surfaces overdue items
  - [ ] Inline cost update resets last_price_updated_at
  - [ ] Item detail shows all sections with supplier links
- **Files to create/modify:**
  - `web/lib/catalog/catalog-service.ts`
  - `web/app/(app)/catalog/items/page.tsx`
  - `web/app/(app)/catalog/items/[id]/page.tsx`

---

### TASK-030W · Item catalog create + edit — Next.js
- **Status:** ready
- **Phase:** 6
- **Track:** web
- **Module:** item_catalog
- **Parallel-safe:** yes
- **Depends on:** TASK-029W
- **Blocks:** none
- **Spec:** specs/catalog_spec.md
- **What to build:**
  - `web/app/(app)/catalog/items/new/page.tsx` — create form
  - `web/app/(app)/catalog/items/[id]/edit/page.tsx` — edit form (pre-populated)
  - `web/app/(app)/catalog/items/actions.ts` — server actions: `createItemAction`, `updateItemAction`, `deleteItemAction`
  - `web/app/(app)/catalog/items/item-types.ts` — sibling types file (no `"use server"`)
  - Full field set: name (required), unit (required), description, default_cost, default_sell_price, default_markup_pct, waste_pct, color, quantity_type toggle (whole/decimal), round_to, minimum_qty, package_unit, price_review_frequency_days, auto_increase_pct + auto_increase_months
  - Specs section: length_in, width_in, height_depth_in, spread_rate_sqft_per_inch, face_feet, extra_specs (dynamic key/value rows)
  - Supplier links section: add/remove suppliers with SKU, supplier_item_name, unit_cost, is_preferred toggle — enforce only one preferred per item
  - Hint: if default_sell_price is set, show info note that markup is ignored
- **Acceptance criteria:**
  - [ ] Create saves item + specs + supplier links in one flow
  - [ ] Only one supplier can be marked preferred (others auto-cleared)
  - [ ] Edit pre-populates all fields
  - [ ] Redirects to detail on save
- **Files to create/modify:**
  - `web/app/(app)/catalog/items/new/page.tsx`
  - `web/app/(app)/catalog/items/[id]/edit/page.tsx`
  - `web/app/(app)/catalog/items/actions.ts`
  - `web/app/(app)/catalog/items/item-types.ts`

---

### TASK-031W · Suppliers + Partners — Next.js
- **Status:** ready
- **Phase:** 6
- **Track:** web
- **Module:** item_catalog
- **Parallel-safe:** yes
- **Depends on:** TASK-029W
- **Blocks:** none
- **Spec:** specs/catalog_spec.md
- **What to build:**
  - `web/lib/catalog/supplier-service.ts` — `getSuppliers`, `getSupplier`, `createSupplier`, `updateSupplier`, `deleteSupplier`, `addLocation`, `updateLocation`, `deleteLocation`
  - `web/lib/catalog/partner-service.ts` — `getPartners`, `getPartner`, `createPartner`, `updatePartner`, `deletePartner`
  - Supplier list (`/catalog/suppliers`) — name, location count, active badge; search by name
  - Supplier detail (`/catalog/suppliers/[id]`) — name, contact, phone, email, website; locations sub-list with address + lat/lng + is_primary badge; items carried (reverse lookup from `catalog_item_suppliers`, read-only)
  - Supplier create/edit (`/catalog/suppliers/new`, `/catalog/suppliers/[id]/edit`) — name (required), contact name, phone, email, website; location management (add/edit/remove inline — street, city, state, zip, lat/lng, is_primary, is_active)
  - Partner list (`/catalog/partners`) — name, trade_type, active badge; search
  - Partner detail + create/edit — company name, contact name, phone, email, trade_type, notes, is_active
  - Server actions in `web/app/(app)/catalog/suppliers/actions.ts` and `web/app/(app)/catalog/partners/actions.ts`
- **Acceptance criteria:**
  - [ ] Supplier create/edit with multiple locations saves correctly
  - [ ] Items carried appears on supplier detail
  - [ ] Partner CRUD works end to end
- **Files to create/modify:**
  - `web/lib/catalog/supplier-service.ts`
  - `web/lib/catalog/partner-service.ts`
  - `web/app/(app)/catalog/suppliers/` (list, detail, new, edit, actions)
  - `web/app/(app)/catalog/partners/` (list, detail, new, edit, actions)

---

### TASK-032W · Material Configurations — Next.js
- **Status:** ready
- **Phase:** 6
- **Track:** web
- **Module:** product_catalog
- **Parallel-safe:** yes
- **Depends on:** TASK-029W
- **Blocks:** none
- **Spec:** specs/catalog_spec.md
- **What to build:**
  - `web/lib/catalog/material-config-service.ts` — `getConfigs`, `getConfig`, `createConfig`, `updateConfig`, `deleteConfig`
  - Config list (`/catalog/configurations`) — grouped by config_type, search by name, color swatch preview
  - Config create/edit (`/catalog/configurations/new`, `/catalog/configurations/[id]/edit`):
    - config_type picker (system enum: paver_patio, wall, flagstone, mulch_bed, sod, rock_bed, turf)
    - Name field
    - For each role defined by the selected config_type: catalog item picker (search + select), area_pct field (for field roles), orientation picker (soldier/sailor for border roles)
    - is_active toggle
    - Validate: all required roles must have a catalog item assigned before save
  - Server actions in `web/app/(app)/catalog/configurations/actions.ts`
- **Acceptance criteria:**
  - [ ] Config type picker drives which role fields appear
  - [ ] Cannot save with missing required role assignments
  - [ ] Color swatches derived from selected items' color field
- **Files to create/modify:**
  - `web/lib/catalog/material-config-service.ts`
  - `web/app/(app)/catalog/configurations/` (list, new, edit, actions)

---

### TASK-033W · Product Catalog — Next.js
- **Status:** ready
- **Phase:** 6
- **Track:** web
- **Module:** product_catalog
- **Parallel-safe:** yes
- **Depends on:** TASK-029W
- **Blocks:** none
- **Spec:** specs/catalog_spec.md
- **What to build:**
  - `web/lib/catalog/product-catalog-service.ts` — `getProducts`, `getProduct`, `createProduct`, `updateProduct`, `deleteProduct`; delete must reject if `is_system_template = true`
  - Product list (`/catalog/products`) — grouped by category (Hardscape / Softscape / Drainage / Irrigation / Maintenance / Snow / Other), "System" badge on system templates, search by name, active/inactive toggle
  - Product detail (`/catalog/products/[id]`) — name, category, pricing_mode, install_rate, minimum_hours, labor/equipment rate overrides, default_description, QB item code; inputs list; components list with formula strings; "System Template" badge
  - Product create/edit (`/catalog/products/new`, `/catalog/products/[id]/edit`) — form designer:
    - Header fields: name, category, pricing_mode (cost_plus / flat_rate / per_sf / t_and_m), install_rate, minimum_hours, flat_rate_price (conditional on flat_rate mode), labor_rate_override, equipment_rate_override, default_description, qb_item_code, is_active
    - Inputs builder: add/remove/reorder rows; each row: label, input_type (number / item_dropdown / color_dropdown / config_dropdown / custom_dropdown / text), unit_label, is_required, default_value; for custom_dropdown: inline options list editor; for config_dropdown: config_type filter picker
    - Components builder: add/remove/reorder rows; each row: label, component_type (catalog_item / material_configuration / labor / equipment / partner), optional fixed catalog_item_id or input_ref, qty_formula text field
    - Delete disabled on system templates
  - Server actions in `web/app/(app)/catalog/products/actions.ts`
- **Acceptance criteria:**
  - [ ] Products list groups by category, system templates badge correctly
  - [ ] Form designer allows adding/removing/reordering inputs and components
  - [ ] System template delete is blocked with clear error
  - [ ] Formula field saved and displayed on detail
- **Files to create/modify:**
  - `web/lib/catalog/product-catalog-service.ts`
  - `web/app/(app)/catalog/products/` (list, detail, new, edit, actions)

---

## Phase 7 · Web — Employees

> Track: Web
> Depends on: Phase 3 (Next.js scaffold) complete. Employees schema already live.
> Can run in parallel with Phase 6 — no cross-dependency.
> TASK-034W can be picked up at the same time as TASK-029W.

---

### TASK-034W · Employee service + list/detail — Next.js
- **Status:** ready
- **Phase:** 7
- **Track:** web
- **Module:** employees_web
- **Parallel-safe:** no (unblocks 035W, 036W, 037W)
- **Depends on:** TASK-029 (scaffold)
- **Blocks:** TASK-035W, TASK-036W, TASK-037W
- **Spec:** specs/employees_spec.md
- **What to build:**
  - `web/lib/employees/employee-service.ts` — `getEmployees(orgId, filters?)`, `getEmployee(orgId, id)`, `createEmployee(orgId, data)`, `updateEmployee(orgId, id, data)`, `transitionStatus(orgId, id, status, endDate?)` — use `getViewerContext()` pattern
  - `web/lib/employees/role-service.ts` — `getRoles(orgId)` (used in employee form dropdowns — full role management is TASK-037W)
  - Employee list (`/employees`) — sorted by last_name asc; each row: display_name (or first+last), role name, employment_type badge, status dot (active=green, on_leave=yellow, terminated/resigned=grey); search bar; filter chips: All / Active / On Leave / Terminated; "Add Employee" button (→ `/employees/new`)
  - Employee detail (`/employees/[id]`) — sections:
    - Header: initials avatar, display_name, role badge, employment_type, status badge; Edit button
    - Personal Info: first_name, last_name, display_name, personal_email, company_email, phone, address, birthday, start_date, end_date
    - Employment: title, position, employment_type, status, crew assignment (crew name if crew_id set), on_vehicle_insurance, has_company_card, company_card_last_four, is_sales, tracks_hours
    - Driver Info: license number, state, class, expiry (red badge ≤30 days, yellow ≤60 days), medical_card_expiry (same badge logic)
    - Compensation: if viewer has `compensation.view` permission → show current pay_type + pay_rate + effective_date + history list; else → grey locked block "Restricted — you don't have access to compensation details"
    - Custom Fields: render any `custom_field_definitions` with `entity_type = 'employee'` and their values
    - Invite Status (owner/admin only): no invite + no auth_uid → "Not invited" + "Send Invite" button; pending invite → email + "Revoke" button + sent date; accepted → "Linked account: [email]"; expired/revoked → status + "Resend Invite" button
- **Acceptance criteria:**
  - [ ] Employee list loads with search + status filter
  - [ ] Detail shows all sections correctly
  - [ ] Compensation section shows locked block when permission absent
  - [ ] Invite status block reflects current invite state
- **Files to create/modify:**
  - `web/lib/employees/employee-service.ts`
  - `web/lib/employees/role-service.ts`
  - `web/app/(app)/employees/page.tsx`
  - `web/app/(app)/employees/[id]/page.tsx`

---

### TASK-035W · Employee create + edit — Next.js
- **Status:** ready
- **Phase:** 7
- **Track:** web
- **Module:** employees_web
- **Parallel-safe:** yes
- **Depends on:** TASK-034W
- **Blocks:** none
- **Spec:** specs/employees_spec.md
- **What to build:**
  - `web/app/(app)/employees/new/page.tsx` — create form
  - `web/app/(app)/employees/[id]/edit/page.tsx` — edit form (pre-populated)
  - `web/app/(app)/employees/actions.ts` — `createEmployeeAction`, `updateEmployeeAction`, `transitionStatusAction`
  - `web/app/(app)/employees/employee-types.ts` — sibling types file (no `"use server"`)
  - Full field set per spec: first_name (required), last_name (required), display_name (optional — show auto-suggest placeholder of "first last", never auto-populate), personal_email, company_email, phone, address, birthday, start_date, role (dropdown from `getRoles`), employment_type (dropdown), employee_title, employee_position, on_vehicle_insurance, has_company_card + company_card_last_four (conditional), is_sales, tracks_hours, driver's license section (number, state, class, expiry), medical_card_expiry
  - Compensation section (only shown if viewer has `compensation.view`): pay_type (hourly/salary), pay_rate, effective_date (defaults to start_date if set) — on edit this always INSERTs a new `employee_compensation` row, never updates existing
  - Status transition UI on edit: dropdown for status changes; end_date field appears only when status is terminated or resigned
- **Acceptance criteria:**
  - [ ] Create saves employee + compensation row (if filled) in one flow
  - [ ] Compensation section hidden when viewer lacks permission
  - [ ] Edit compensation always inserts new row (history preserved)
  - [ ] Status transition shows end_date field conditionally
  - [ ] Redirects to detail on save
- **Files to create/modify:**
  - `web/app/(app)/employees/new/page.tsx`
  - `web/app/(app)/employees/[id]/edit/page.tsx`
  - `web/app/(app)/employees/actions.ts`
  - `web/app/(app)/employees/employee-types.ts`

---

### TASK-036W · Employee invite flow — Next.js + deploy Edge Function
- **Status:** ready
- **Phase:** 7
- **Track:** web
- **Module:** employees_web
- **Parallel-safe:** yes
- **Depends on:** TASK-034W
- **Blocks:** none
- **Spec:** specs/employees_spec.md
- **What to build:**
  - Deploy existing `supabase/functions/send-employee-invite/` Edge Function: run `supabase functions deploy send-employee-invite` — verify it exists and deploys cleanly; if the function file doesn't exist at that path, create it (sends invite email with link `/invite/accept?token=[token]`)
  - `web/lib/employees/invite-service.ts` — `sendInvite(orgId, employeeId, email)`: creates `employee_invites` row (token = `crypto.randomUUID()`, expires_at = now + 7 days), calls Edge Function via `supabase.functions.invoke`; `revokeInvite(orgId, inviteId)`: sets status = 'revoked'
  - Server actions wired to invite status block on employee detail (send + revoke buttons)
  - Accept invite page (`/invite/accept`) — public route (no auth required):
    - Reads `token` query param
    - Fetches `employee_invites` row by token — if not found or status ≠ 'pending' or expires_at < now → show "This invite link is expired or invalid"
    - If valid: show "Welcome to [org_name]" + email pre-filled (read-only) + Password + Confirm Password fields
    - On submit: call Supabase `signUp(email, password)` → on success update `employee_invites.status = 'accepted'` + `employees.supabase_auth_uid = auth.uid()` → redirect to `/dashboard`
  - Add `/invite/accept` to middleware public routes (do not redirect to login)
- **Acceptance criteria:**
  - [ ] Edge Function deploys without error
  - [ ] Send invite creates DB row and invokes Edge Function
  - [ ] Revoke sets status to 'revoked'
  - [ ] Accept page shows expired message for bad tokens
  - [ ] Valid token flow creates auth account and links to employee record
- **Files to create/modify:**
  - `supabase/functions/send-employee-invite/index.ts` (deploy or create)
  - `web/lib/employees/invite-service.ts`
  - `web/app/invite/accept/page.tsx`
  - `web/lib/supabase/middleware.ts` (add public route)
  - Employee detail server actions (send/revoke)

---

### TASK-037W · Roles + Permission matrix — Next.js
- **Status:** ready
- **Phase:** 7
- **Track:** web
- **Module:** employees_web
- **Parallel-safe:** yes
- **Depends on:** TASK-034W
- **Blocks:** none
- **Spec:** specs/employees_spec.md
- **What to build:**
  - Expand `web/lib/employees/role-service.ts` — add `createRole`, `updateRole`, `deleteRole`, `getRolePermissions(orgId, roleId)`, `setPermission(orgId, roleId, permissionKey, granted)`, `getEmployeeOverrides(orgId, employeeId)`, `setOverride(orgId, employeeId, permissionKey, granted)`, `removeOverride(orgId, overrideId)`
  - Role list (`/settings/roles`) — all roles sorted by sort_order; each row: role name, "System" badge if is_system, employee count; system roles show lock icon (no delete); "Add Role" button
  - Role detail (`/settings/roles/[id]`) — role name (editable inline if not system); permission matrix: table of all 27 permission keys grouped by module, toggle per key (saves immediately on toggle — no save button, optimistic update + Supabase patch); employees with this role list (tap → employee detail)
  - Per-employee override panel on employee detail page (owner/admin only — section added to TASK-034W's detail page):
    - List all 27 permission keys; for each: show current role default (greyed), toggle to override; if override exists → show override value + "Using override" badge + X to remove
    - Toggle with no existing override → INSERT `employee_permission_overrides`
    - X on override → DELETE the row (reverts to role default)
  - Server actions in `web/app/(app)/settings/roles/actions.ts`
  - Permission keys constant (27 keys from spec) in `web/lib/employees/permission-keys.ts`
- **Acceptance criteria:**
  - [ ] Role list shows system badge + lock on system roles
  - [ ] Permission matrix toggles save immediately
  - [ ] Per-employee overrides show "Using override" badge when active
  - [ ] Removing override reverts to role default display
  - [ ] Add/delete role works for non-system roles
- **Files to create/modify:**
  - `web/lib/employees/role-service.ts` (expand)
  - `web/lib/employees/permission-keys.ts`
  - `web/app/(app)/settings/roles/` (list, detail, actions)
  - `web/app/(app)/employees/[id]/page.tsx` (add override panel section)

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
