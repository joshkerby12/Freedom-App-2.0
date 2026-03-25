# Employees Spec · Freedom App 2.0

> Covers: TASK-008, TASK-009, TASK-010, TASK-011, TASK-012, TASK-013
> Phase 2 — depends on Phase 1 (auth + app shell) completing first.

---

## Overview

The Employees module manages the operational identity layer of the app. Every business record — estimates, jobs, clients, fleet assignments — references an `employees` row, not a `profiles` row. This module handles employee CRUD, compensation tracking, invite flow, and the role + permission system that gates every downstream feature.

Employees are created by managers/owners before being invited. An invite links an existing `employees` record to a Supabase auth account. Until the invite is accepted, the employee exists in the system but has no login.

---

## Scope

**Included:**
- Supabase schema: `roles`, `role_permissions`, `employees`, `employee_permission_overrides`, `employee_compensation`, `employee_invites`, `employee_preferences`, `custom_field_definitions`, `custom_field_values` + RLS
- EmployeeService — CRUD, status transitions, display_name logic
- CurrentEmployeeNotifier — resolves the logged-in user's employee record by `supabase_auth_uid`
- PermissionService — resolves effective permission for a given key (role permission + override)
- Employee list screen (with search + filter)
- Employee detail screen (all fields, compensation section permission-gated)
- Employee create screen
- Employee edit screen
- InviteService — create invite, send email via Edge Function, revoke
- Accept-invite screen (accepts token, links auth account to employee record)
- Role list screen (system roles + org-created roles)
- Role detail screen (permission matrix editor)
- Per-employee permission override panel

**Explicitly out of scope:**
- Timesheets / hour tracking — future phase
- GPS / location tracking — future phase
- Payroll integrations — not in scope v1
- Employee portal / public-facing access — future phase

---

## User Stories

- As an owner/admin, I can create an employee record with all relevant fields
- As an owner/admin, I can invite an employee by email so they can log in
- As an owner/admin, I can set compensation (hourly or salary) and view compensation history
- As a manager with `employees.view`, I can see all active employees and their basic info
- As an owner/admin with `compensation.view`, I can see pay rates; others see "Restricted" in that section
- As an owner/admin, I can assign roles and set per-employee permission overrides
- As an invited employee, I can accept my invite and create my login
- As any authenticated employee, the app resolves my employee record on launch to enforce permissions
- As an owner, I can mark an employee as terminated/resigned and set an end date

---

## Org / User Context

- **Data scoping:** All tables scoped to `org_id`. Every query must include `where org_id = currentOrgId`.
- **Role access:**
  - `employees.view` — read employee list and detail (non-compensation fields)
  - `employees.manage` — create, edit, status transitions
  - `compensation.view` — read `employee_compensation` rows
  - Only owner/admin can manage roles and permissions
- **Permission resolution:** `PermissionService.can(permissionKey)` checks `employee_permission_overrides` first, then falls back to `role_permissions` for the employee's `role_id`. Returns `bool`.

---

## Permission Resolution Logic

```
PermissionService.can(employeeId, permissionKey):
  1. Check employee_permission_overrides WHERE employee_id = employeeId AND permission_key = key
     → If row exists → return override.granted (true or false)
  2. Check role_permissions WHERE role_id = employee.role_id AND permission_key = key
     → If row exists → return role_permission.granted
  3. No row found → return false (deny by default)
```

This logic is the same everywhere in the app. Never check permissions at the RLS level for business logic — RLS is for data isolation only.

---

## Employment Status Transitions

```
active → on_leave        (admin/owner action, set leave dates in notes)
active → terminated      (admin/owner action, requires end_date)
active → resigned        (admin/owner action, requires end_date)
on_leave → active        (return from leave)
terminated → (no transition) — terminal state
resigned → (no transition) — terminal state
```

Terminated and resigned employees remain in the database. Their records are read-only. They are hidden from active employee lists by default but visible via filter toggle.

---

## display_name Logic

`display_name` is an optional override field. If null, the app renders `first_name + ' ' + last_name`. On create/edit, if the user leaves `display_name` blank, suggest the auto-format as placeholder text. Never auto-populate the field — only the user should set it.

---

## Page States

| State | Description |
|---|---|
| Loading | Data fetching — show shimmer list rows |
| Loaded | Data ready — show list or detail content |
| Empty | No employees found — show "No employees yet" + create button |
| Error | Fetch failed — show error message with retry |
| Submitting | Form submitted, awaiting Supabase response — disable button, show loading |
| Permission denied | Current employee lacks permission — show locked/restricted section, not error page |

---

## UI Behavior

### Employee List Screen (`/employees`)

**Permission required:** `employees.view`

**Loaded state:**
- List of active employees, sorted by last_name ascending
- Each row: display_name (or first+last), role name, employment_type badge, status indicator (active = green dot, on_leave = yellow, terminated/resigned = grey)
- Search bar at top — filters by name in real time
- Filter chip row: All / Active / On Leave / Terminated (default: Active)
- FAB: "Add Employee" — navigates to create screen (visible only if `employees.manage`)

**Interactions:**
- Tapping a row → navigate to `/employees/:id`
- Tapping FAB → navigate to `/employees/new`

---

### Employee Detail Screen (`/employees/:id`)

**Permission required:** `employees.view`

**Sections:**

**Header:**
- Avatar placeholder (initials), display_name, role badge, employment_type, status badge
- Edit button (top-right, visible if `employees.manage`)

**Personal Info:**
- first_name, last_name, display_name, personal_email, company_email, phone, address, birthday, start_date, end_date (if terminated/resigned)

**Employment:**
- employee_title, employee_position, employment_type, employee_status, crew assignment (crew name if crew_id set)
- on_vehicle_insurance toggle (read-only in detail view), has_company_card, company_card_last_four
- is_sales toggle, tracks_hours toggle

**Driver Info:**
- drivers_license_number, drivers_license_state, drivers_license_class, drivers_license_expiry
- medical_card_expiry
- Expiry fields: show red badge if within 30 days, yellow if within 60 days

**Compensation section:**
- If current employee has `compensation.view`: show current pay_type + pay_rate, effective_date, and a list of prior compensation rows (history)
- If no `compensation.view`: show grey locked block with "Restricted — you don't have access to compensation details"

**Custom Fields:**
- Any `custom_field_definitions` with `entity_type = 'employee'` are rendered here
- Field types: boolean (toggle), enum (dropdown), text, date, number, file (link to uploaded file)

**Invite Status (owner/admin only):**
- If no invite exists and `supabase_auth_uid` is null: "Not invited" + "Send Invite" button
- If invite exists with status `pending`: show invite email + "Revoke" button + sent date
- If invite `accepted`: show "Linked account: [email]"
- If invite `expired` or `revoked`: show status + "Resend Invite" button

---

### Employee Create Screen (`/employees/new`)

**Permission required:** `employees.manage`

**Fields:**
- First Name (required), Last Name (required), Display Name (optional, with auto-suggest placeholder)
- Personal Email, Company Email, Phone
- Role (dropdown, required — selects from org roles)
- Employment Type (dropdown: full_time / part_time / temporary / temp_agency / contractor / seasonal)
- Employee Title, Employee Position
- Start Date (date picker)
- Birthday (date picker, optional)
- Address (text)
- on_vehicle_insurance (toggle), has_company_card (toggle), company_card_last_four (conditional on toggle)
- is_sales (toggle), tracks_hours (toggle, default true)
- Driver's License Number, State, Class, Expiry (optional section)
- Medical Card Expiry (optional)

**Compensation (if current user has `compensation.view`):**
- Pay Type (hourly / salary)
- Pay Rate
- Effective Date (defaults to Start Date if set)

**Interactions:**
- "Save" → validate required fields → insert `employees` row → if compensation fields filled, insert `employee_compensation` row → navigate to detail screen
- "Cancel" → discard and pop

---

### Employee Edit Screen (`/employees/:id/edit`)

**Permission required:** `employees.manage`

Same fields as create. Pre-populated with current values. Compensation edit is separate from main fields:
- Editing pay rate on an existing employee always inserts a **new** `employee_compensation` row (never updates the current one) — preserves history
- "End Date" field appears only for terminated/resigned status

---

### Employee Invite Flow

**Send Invite:**
- Triggered from Employee Detail screen
- `InviteService.sendInvite(employeeId, email)` creates an `employee_invites` row (token = `uuid`, expires_at = now + 7 days)
- Calls Edge Function `send-employee-invite` with `{ employee_id, email, token, org_name }`
- Edge Function sends email with invite link: `/invite/accept?token=[token]`

**Accept Invite Screen (`/invite/accept`):**
- Reads `token` from URL query param
- Fetches matching `employee_invites` row — if expired or not found → show "This invite link is expired or invalid"
- If valid: show "Welcome to [org_name]" + email pre-filled (read-only) + Password + Confirm Password fields
- On submit: call `AuthService.signUp(email, password)` → on success, update `employee_invites.status = 'accepted'` + set `employees.supabase_auth_uid = auth.uid()`
- Redirect to `/dashboard`

**Revoke Invite:**
- Sets `employee_invites.status = 'revoked'`

---

### Role List Screen (`/settings/roles`)

**Permission required:** `settings.manage`

**Loaded state:**
- List of all roles (system + org-created), sorted by sort_order
- Each row: role name, "System" badge if `is_system = true`, employee count
- System roles cannot be deleted (show lock icon, no delete option)
- FAB: "Add Role"

**Interactions:**
- Tapping a role → navigate to role detail
- FAB → create new role (name only on create — configure permissions on detail screen)

---

### Role Detail Screen (`/settings/roles/:id`)

**Permission required:** `settings.manage`

**Sections:**

**Header:** Role name (editable inline if not system role)

**Permission Matrix:**
- Table of all 27 permission keys, grouped by module
- Toggle per permission (granted / not granted)
- System roles: all permissions are editable (owner can tighten system roles if desired)
- Changes save immediately on toggle (no save button — optimistic update + Supabase patch)

**Employees with this role:**
- List of employees currently assigned this role
- Tapping an employee → navigate to their detail

---

### Per-Employee Override Panel

Accessed from Employee Detail screen → "Permission Overrides" section (owner/admin only).

**Loaded state:**
- List of all 27 permission keys
- For each key: show current effective value (role default), toggle to override
- If an override exists: show the override value with a "Using override" badge and an X to remove it
- If no override: show role default as greyed-out hint

**Interactions:**
- Toggling a key that has no override → inserts an `employee_permission_overrides` row
- Tapping X on an override → deletes the `employee_permission_overrides` row (reverts to role default)

---

## Layouts

- **Mobile** — list/detail pattern. Detail uses scrollable sections with section headers. Create/edit uses scrollable form.
- **Tablet** — list + detail side by side on wider screens (optional — placeholder single-pane is acceptable for Phase 2).

---

## Seed Data

No additional seed data for employees. System roles and role_permissions were seeded by the `seed-org-data` Edge Function in Phase 1.

Custom field definitions are created by the org owner — not seeded.

---

## Data

**Reads:**
- `employees` — list, detail, CurrentEmployeeNotifier (by supabase_auth_uid)
- `roles` — dropdown in create/edit, role list screen
- `role_permissions` — role detail screen, PermissionService
- `employee_permission_overrides` — override panel, PermissionService
- `employee_compensation` — compensation section (permission-gated)
- `employee_invites` — invite status on detail screen
- `custom_field_definitions` — rendered in detail/edit
- `custom_field_values` — rendered in detail/edit

**Writes:**
- `employees` — create, edit, status transitions
- `employee_compensation` — new row on compensation change
- `employee_invites` — create, revoke, accept
- `employee_permission_overrides` — add, remove
- `role_permissions` — toggle on role detail
- `custom_field_values` — save custom field answers

---

## RLS Policies

All tables use org-scoped policies. Pattern from `data_structure.md`:

```sql
-- employees: any org member can SELECT
CREATE POLICY "org members can view employees"
ON employees FOR SELECT
USING (org_id IN (SELECT org_id FROM org_members WHERE profile_id = auth.uid()));

-- employees: admin/owner can INSERT/UPDATE
CREATE POLICY "admins can manage employees"
ON employees FOR INSERT
WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE profile_id = auth.uid() AND role IN ('owner','admin')));

-- employee_compensation: same pattern — admin/owner write, compensation.view gated at app layer
-- employee_invites: same pattern
-- role_permissions: same pattern — admin/owner write
-- employee_permission_overrides: same pattern — admin/owner write
-- custom_field_definitions: admin/owner write, all org members read
-- custom_field_values: all org members write own entity values; admin/owner write any
```

---

## Code Map

| File | Purpose |
|---|---|
| `lib/features/employees/models/employee.dart` | `@freezed` Employee model |
| `lib/features/employees/models/role.dart` | `@freezed` Role model |
| `lib/features/employees/models/role_permission.dart` | `@freezed` RolePermission model |
| `lib/features/employees/models/employee_compensation.dart` | `@freezed` EmployeeCompensation model |
| `lib/features/employees/models/employee_invite.dart` | `@freezed` EmployeeInvite model |
| `lib/features/employees/models/employee_permission_override.dart` | `@freezed` EmployeePermissionOverride model |
| `lib/features/employees/helpers/employee_validators.dart` | Form validation rules |
| `lib/features/employees/helpers/employee_calculations.dart` | display_name resolution, status label logic |
| `lib/features/employees/services/employee_service.dart` | Supabase CRUD for employees, compensation, invites |
| `lib/features/employees/services/invite_service.dart` | Invite create/revoke/accept flow, Edge Function call |
| `lib/features/employees/services/permission_service.dart` | `can(employeeId, permissionKey)` resolution |
| `lib/features/employees/providers/employee_list_provider.dart` | `@riverpod` — list of employees, search/filter |
| `lib/features/employees/providers/employee_detail_provider.dart` | `@riverpod` — single employee by id |
| `lib/features/employees/providers/current_employee_provider.dart` | `@riverpod` — resolves current employee from auth uid |
| `lib/features/employees/providers/role_list_provider.dart` | `@riverpod` — all org roles |
| `lib/features/employees/providers/permission_provider.dart` | `@riverpod` — wraps PermissionService for UI |
| `lib/features/employees/layouts/employee_list_layout.dart` | Employee list screen |
| `lib/features/employees/layouts/employee_detail_layout.dart` | Employee detail screen |
| `lib/features/employees/layouts/employee_form_layout.dart` | Shared create/edit form |
| `lib/features/employees/layouts/role_list_layout.dart` | Role list screen |
| `lib/features/employees/layouts/role_detail_layout.dart` | Role detail + permission matrix |
| `lib/features/employees/widgets/permission_matrix_widget.dart` | Reusable permission toggle table |
| `lib/features/employees/widgets/compensation_section_widget.dart` | Compensation section (permission-gated) |
| `supabase/functions/send-employee-invite/index.ts` | Edge Function — sends invite email |
