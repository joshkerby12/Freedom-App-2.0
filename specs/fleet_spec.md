# Fleet + Crews Spec · Ground Control Pro

> Covers: TASK-019, TASK-020, TASK-021, TASK-022, TASK-023
> Phase 4 — depends on Phase 2 (employees + permissions) completing first.

---

## Overview

The Fleet + Crews module manages all physical assets — trucks, trailers, equipment, attachments — and the crew groups they are assigned to. It handles availability tracking, scheduling, equipment requests (with approval workflow if configured), maintenance logging, and pre/post-trip DVIR (Driver Vehicle Inspection Report) entry.

This module does not handle job scheduling — that is a future phase. Fleet scheduling in this module is asset-focused: tracking which equipment is assigned to which crew for which date range.

---

## Scope

**Included:**
- Supabase schema: `crews`, `equipment`, `equipment_assignments`, `equipment_schedule`, `equipment_requests`, `equipment_maintenance`, `vehicle_inspections` + RLS
- CrewService — CRUD for crews
- EquipmentService — CRUD, availability check, expiry alert logic
- Equipment list screen
- Equipment detail screen
- Equipment create + edit screens
- Crew list screen
- Crew detail screen
- Crew create + edit screens
- Maintenance log — entry form + history list
- DVIR (Driver Vehicle Inspection Report) — pre/post-trip form + history
- Equipment request flow (crew lead submits → approval if required)

**Explicitly out of scope:**
- GPS / telematics integration — not in scope v1
- Fuel tracking — not in scope v1
- Job-to-equipment linking — handled in jobs module (future phase)
- Equipment cost allocation — future phase

---

## User Stories

- As a fleet manager, I can add all trucks, trailers, equipment, and attachments with full details
- As a fleet manager, I can track registration, insurance, and inspection expiry dates with badge alerts
- As a fleet manager, I can assign equipment to crews and schedule them for date ranges
- As a crew lead, I can request equipment for a date range; fleet manager approves or denies
- As a driver, I can complete pre-trip and post-trip DVIR for any vehicle I drive
- As a fleet manager, I can log maintenance events (oil change, repair, inspection) with costs
- As a manager with `fleet.view`, I can see all equipment and current crew assignments
- As an owner, I can create crew groups and assign a crew lead and default vehicle

---

## Org / User Context

- **Data scoping:** All tables scoped to `org_id`.
- **Role access:**
  - `fleet.view` — read fleet list and crew list
  - `fleet.manage` — create, edit, delete fleet and crews
  - `equipment.view` — read equipment list and detail
  - `equipment.schedule` — assign equipment, manage schedule
  - `equipment.approve` — approve/deny equipment requests
- **DVIR:** Any employee with a valid driver's license can submit a DVIR (no specific permission key — app-layer check: `driver_id` must be an active employee)
- **Equipment approval:** If `org_settings.equipment_approval_required = true`, requests go through approval flow. If false, requests are auto-approved on creation.

---

## Equipment Types

| type | description |
|---|---|
| `truck` | Pickup trucks, dump trucks, box trucks |
| `trailer` | Landscape trailers, equipment trailers, dump trailers |
| `equipment` | Skid steers, excavators, mowers, walk-behinds |
| `attachment` | Buckets, forks, blades, augers — attached to other equipment |

---

## Expiry Alert Logic

Fields with expiry dates (`registration_expiry`, `insurance_expiry`, `annual_inspection_due`) display alert badges:

| Days until expiry | Badge |
|---|---|
| > 60 days | None |
| 31–60 days | Yellow "Expiring Soon" |
| 0–30 days | Red "Expires Soon" |
| Past | Red "EXPIRED" |

`EquipmentService.getExpiryStatus(date)` returns: `ok | warning | critical | expired`. Used everywhere expiry dates are displayed.

---

## Equipment Availability Logic

An equipment item is considered **unavailable** on a given date range if:

1. An `equipment_schedule` row exists that overlaps the requested date range AND the schedule is for a non-shareable item (`is_shareable = false`)
2. OR `is_active = false`

`EquipmentService.checkAvailability(equipmentId, startDate, endDate)` returns `bool`. Used in the request flow and schedule view.

---

## Equipment Request Flow

```
Crew lead submits request (equipment_requests row, status = 'pending')
  ↓
If org_settings.equipment_approval_required = false:
  → Auto-approve: status = 'approved', insert equipment_schedule row
If org_settings.equipment_approval_required = true:
  → Notify employee(s) with equipment.approve permission
  → Fleet manager approves → status = 'approved', insert equipment_schedule row
  → Fleet manager denies → status = 'denied', notes field for reason
```

---

## Page States

| State | Description |
|---|---|
| Loading | Data fetching — show shimmer |
| Loaded | Data ready |
| Empty | No records — show empty state + create button |
| Error | Fetch failed — show error + retry |
| Submitting | Saving — disable button, show loading |
| Permission denied | Insufficient permission |

---

## UI Behavior

### Equipment List Screen (`/fleet/equipment`)

**Permission required:** `equipment.view`

**Loaded state:**
- List of equipment sorted by type then name
- Each row: name, type badge (truck/trailer/equipment/attachment), make/model/year, crew assignment (if any), expiry badge(s) if any date is warning/critical/expired
- Filter chips: All / Trucks / Trailers / Equipment / Attachments / Has Expiry Alert / Inactive
- Search bar: filter by name, make, model, VIN, plate
- FAB: "Add Equipment" (visible if `fleet.manage`)

**Interactions:**
- Tapping a row → `/fleet/equipment/:id`
- FAB → `/fleet/equipment/new`

---

### Equipment Detail Screen (`/fleet/equipment/:id`)

**Permission required:** `equipment.view`

**Sections:**

**Header:**
- Name (large), type badge, is_active badge
- Edit button (if `fleet.manage`)

**Identification:**
- make, model, year, vin_serial, license_plate, dot_number
- is_shareable indicator

**Compliance & Expiry:**
- registration_expiry (with badge)
- insurance_expiry (with badge)
- annual_inspection_due (with badge)
- medical_card_expiry displayed if applicable

**Current Assignment:**
- If `equipment_assignments` row exists (most recent): crew name + assigned_date
- "Reassign" button (if `equipment.schedule`)

**Schedule:**
- List of upcoming `equipment_schedule` rows (start_date >= today)
- Each row: date range, crew name, notes
- "Add to Schedule" button (if `equipment.schedule`)

**Maintenance Log:**
- List of `equipment_maintenance` rows sorted by performed_date desc (newest first)
- Each row: type, performed_date, mileage (if set), performed_by, cost, notes, receipt link
- "Log Maintenance" button

**DVIR History:**
- List of `vehicle_inspections` sorted by inspection_date desc
- Each row: type (pre/post), inspection_date, driver name, passed/failed badge
- "New DVIR" button

**Notes:**
- Standard notes section (entity_type = 'equipment', entity_id = equipment.id)

---

### Equipment Create Screen (`/fleet/equipment/new`)

**Permission required:** `fleet.manage`

**Fields:**
- Name (required)
- Type (dropdown: truck / trailer / equipment / attachment, required)
- Make, Model, Year
- VIN / Serial Number
- License Plate
- DOT Number
- Registration Expiry (date picker)
- Insurance Expiry (date picker)
- Annual Inspection Due (date picker)
- is_shareable (toggle, default false)
- is_active (toggle, default true)
- Notes (multi-line)

**Interactions:**
- "Save" → validate → insert `equipment` → navigate to detail
- "Cancel" → discard and pop

---

### Equipment Edit Screen (`/fleet/equipment/:id/edit`)

**Permission required:** `fleet.manage`

Same fields as create. Pre-populated with current values.

---

### Crew List Screen (`/fleet/crews`)

**Permission required:** `fleet.view`

**Loaded state:**
- List of crews sorted by name
- Each row: crew name, crew lead name (if set), is_active badge, member count (from employees.crew_id)
- FAB: "Add Crew" (visible if `fleet.manage`)

**Interactions:**
- Tapping a row → `/fleet/crews/:id`
- FAB → `/fleet/crews/new`

---

### Crew Detail Screen (`/fleet/crews/:id`)

**Permission required:** `fleet.view`

**Sections:**

**Header:**
- Crew name, is_active badge
- Edit button (if `fleet.manage`)

**Crew Lead:**
- Crew lead employee name + role
- "Change Lead" button (if `fleet.manage`)

**Members:**
- List of employees where `employees.crew_id = crew.id`
- Each row: display_name, role badge, employment_type
- Members are not managed here — managed on the employee record. This is a read-only view.

**Equipment:**
- Current equipment assignment (most recent `equipment_assignments` row per equipment)
- List: name, type, assigned_date
- "Assign Equipment" button → equipment picker (if `equipment.schedule`)

**Upcoming Schedule:**
- List of `equipment_schedule` rows for this crew (start_date >= today)

**Notes:**
- Standard notes section (entity_type defaults to 'general' for crew — use crew.id as entity_id)

---

### Crew Create + Edit Screens

**Permission required:** `fleet.manage`

**Fields:**
- Name (required)
- Crew Lead (employee dropdown, optional)
- is_active (toggle, default true)
- Notes (multi-line)

Members are assigned on the employee record — not editable here.

---

### Maintenance Log

**Log Form (modal or bottom sheet):**
- Type (text — e.g., Oil Change, Tire Rotation, Repair, Annual Inspection, etc.)
- Performed Date (date picker, required)
- Mileage (number, optional)
- Next Service Date (date picker, optional)
- Next Service Mileage (number, optional)
- Performed By (text — person or shop name)
- Cost (currency input, optional)
- Notes (multi-line, optional)
- Receipt (file attachment, optional — uploads to Supabase Storage → `receipt_url`)

**On Save:** Insert `equipment_maintenance` row.

**History List:**
- Sorted by performed_date desc
- Each row: type, performed_date, performed_by, cost, notes snippet, receipt link

---

### DVIR (Driver Vehicle Inspection Report)

**Pre-Trip and Post-Trip forms are identical except for `inspection_type`.**

**Form:**
- Inspection Type (pre_trip / post_trip — auto-set from which button was tapped)
- Driver (employee dropdown filtered to `on_vehicle_insurance = true` or any active employee — org's choice; use any active employee for now)
- Inspection Date (date, defaults to today)
- Odometer (number, optional)
- Passed (toggle — "All items satisfactory")
- Defects (conditional — shown if Passed = false):
  - Multi-select checklist of common defect categories (jsonb stored as array of strings):
    - Brakes, Lights/Signals, Tires, Horn, Wipers, Mirrors, Fuel/Fluids, Frame/Body, Coupling Devices, Other
  - Notes field for defect detail
- Driver Signature (text field for name — digital signature widget is a future phase)
- Notes (general notes, optional)

**On Save:** Insert `vehicle_inspections` row.

**History List:**
- Sorted by inspection_date desc
- Each row: inspection_type badge, date, driver name, passed/failed badge, defect count if failed

---

### Equipment Requests

**Request Form (crew lead submits):**
- Equipment (dropdown — shows available equipment for the requested date range)
- Start Date (date picker, required)
- End Date (date picker, optional)
- Notes (optional)

**On Submit:**
- Insert `equipment_requests` row with `status = 'pending'`
- If `org_settings.equipment_approval_required = false`: immediately update to `status = 'approved'` and insert `equipment_schedule` row
- If approval required: leave as pending; show in fleet manager's pending requests list

**Approval View (fleet manager):**
- List of pending requests
- Each row: equipment name, crew name, date range, submitted by, submitted at
- Approve → update status, insert schedule row
- Deny → update status, prompt for reason (stored in notes)

---

## Layouts

- **Mobile** — list/detail. Detail uses scrollable sections. Forms are scrollable modal sheets or full screens.
- **Tablet** — single-pane acceptable for Phase 4.

---

## Data

**Reads:**
- `equipment` — list, detail
- `equipment_assignments` — current assignment on detail
- `equipment_schedule` — upcoming schedule
- `equipment_requests` — pending requests list
- `equipment_maintenance` — maintenance history
- `vehicle_inspections` — DVIR history
- `crews` — list, detail, assignment dropdowns
- `employees` — crew lead dropdown, driver dropdown, member list via crew_id

**Writes:**
- `equipment` — create, edit
- `equipment_assignments` — assign to crew
- `equipment_schedule` — add, auto-created on approval
- `equipment_requests` — create (crew lead), approve/deny (fleet manager)
- `equipment_maintenance` — log entry
- `vehicle_inspections` — DVIR entry
- `crews` — create, edit

---

## RLS Policies

All tables use org-scoped policies per the pattern in `data_structure.md`.

```sql
-- equipment: any org member SELECT
CREATE POLICY "org members can view equipment"
ON equipment FOR SELECT
USING (org_id IN (SELECT org_id FROM org_members WHERE profile_id = auth.uid()));

-- equipment: admin/owner INSERT/UPDATE/DELETE
CREATE POLICY "admins can manage equipment"
ON equipment FOR INSERT
WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE profile_id = auth.uid() AND role IN ('owner','admin')));

-- Same pattern for crews, equipment_assignments, equipment_schedule, equipment_requests, equipment_maintenance, vehicle_inspections
-- App-layer permission checks (fleet.manage, equipment.schedule, equipment.approve) enforce business rules above the RLS floor
```

---

## Code Map

| File | Purpose |
|---|---|
| `lib/features/fleet/models/equipment.dart` | `@freezed` Equipment model |
| `lib/features/fleet/models/crew.dart` | `@freezed` Crew model |
| `lib/features/fleet/models/equipment_assignment.dart` | `@freezed` EquipmentAssignment model |
| `lib/features/fleet/models/equipment_schedule.dart` | `@freezed` EquipmentSchedule model |
| `lib/features/fleet/models/equipment_request.dart` | `@freezed` EquipmentRequest model |
| `lib/features/fleet/models/equipment_maintenance.dart` | `@freezed` EquipmentMaintenance model |
| `lib/features/fleet/models/vehicle_inspection.dart` | `@freezed` VehicleInspection model |
| `lib/features/fleet/helpers/fleet_validators.dart` | Form validation |
| `lib/features/fleet/helpers/expiry_calculations.dart` | `getExpiryStatus(date)` — ok/warning/critical/expired |
| `lib/features/fleet/services/equipment_service.dart` | CRUD, availability check, expiry logic |
| `lib/features/fleet/services/crew_service.dart` | Crew CRUD, assignment management |
| `lib/features/fleet/providers/equipment_list_provider.dart` | `@riverpod` — equipment list, filter |
| `lib/features/fleet/providers/equipment_detail_provider.dart` | `@riverpod` — single equipment by id |
| `lib/features/fleet/providers/crew_list_provider.dart` | `@riverpod` — crew list |
| `lib/features/fleet/providers/crew_detail_provider.dart` | `@riverpod` — single crew by id |
| `lib/features/fleet/layouts/equipment_list_layout.dart` | Equipment list screen |
| `lib/features/fleet/layouts/equipment_detail_layout.dart` | Equipment detail screen |
| `lib/features/fleet/layouts/equipment_form_layout.dart` | Shared create/edit form |
| `lib/features/fleet/layouts/crew_list_layout.dart` | Crew list screen |
| `lib/features/fleet/layouts/crew_detail_layout.dart` | Crew detail screen |
| `lib/features/fleet/layouts/crew_form_layout.dart` | Crew create/edit form |
| `lib/features/fleet/widgets/maintenance_log_widget.dart` | Maintenance history + log form |
| `lib/features/fleet/widgets/dvir_widget.dart` | DVIR history + form |
| `lib/features/fleet/widgets/expiry_badge_widget.dart` | Reusable expiry status badge |
| `lib/features/fleet/widgets/equipment_request_widget.dart` | Request form + approval list |
