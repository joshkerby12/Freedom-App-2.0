# Freedom App 2.0

## Project Specification Document

---

## Project Overview

**Application:** Freedom App 2.0
**Company:** Freedom Landscapes
**Platform:** Flutter / Dart (iOS, Android, Web)
**Backend:** Supabase (Auth + Database + Storage)
**Bank Integration:** Teller.io (expense tracking)
**QB Integration:** QuickBooks (customer, payment terms, invoice sync)

**Purpose:** Full business management app for a landscape company — replacing a legacy AppSheet build. Covers clients, estimates, jobs, scheduling, expenses, and reporting.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Flutter / Dart |
| State Management | Riverpod |
| Navigation | go_router |
| Database + Auth | Supabase |
| Formula Evaluation | math_expressions |
| Bank Integration | Teller.io |
| QB Integration | QuickBooks API |

---

## Architecture

### Multi-Tenant
- Every table includes `org_id` (uuid, FK → organizations)
- Row Level Security (RLS) enforced at the Supabase level
- Each organization has fully isolated data

### Standard Columns
Every table includes:
```
org_id       uuid        FK → organizations, NOT NULL
created_at   timestamp   default now()
updated_at   timestamp   auto-managed by trigger
```

### Project Structure
```
lib/
  features/
    clients/
    estimates/
    jobs/
    catalog/
    suppliers/
    employees/
    scheduling/
    expenses/
    reports/
    settings/
  core/
    supabase/
    formula_engine/
    theme/
  shared/
    widgets/
    models/
```

---

## Global Patterns

These patterns apply across multiple modules. Implemented once, reused everywhere.

---

### Notes

Available on: clients, estimates, jobs, employees, equipment, and more.

```
notes
  - id
  - org_id
  - entity_type    enum — client, estimate, job, employee, equipment, general
  - entity_id      uuid — FK to relevant record
  - body           text — rich text
  - author_id      uuid, FK → employees
  - created_at, updated_at

note_attachments
  - id
  - org_id
  - note_id        uuid, FK → notes
  - file_url       text — Supabase storage
  - file_type      text — image, pdf, etc.
  - file_name      text
  - created_at
```

---

### Tasks

Four scopes in one unified system.

```
tasks
  - id
  - org_id
  - entity_type      enum — client, estimate, job, employee, general
  - entity_id        uuid — nullable for general tasks
  - title            text
  - description      text — nullable
  - assignee_id      uuid, FK → employees (primary owner)
  - due_date         date — nullable
  - priority         enum — low, medium, high, urgent
  - status           enum — pending, in_progress, completed, cancelled
  - completed_at     timestamp — nullable
  - completed_by     uuid, FK → employees — nullable
  - created_by       uuid, FK → employees
  - created_at, updated_at

task_followers  (join)
  - task_id
  - employee_id
  - notified_on_update   bool
```

---

### Communications Log

Client-level. Tracks every touchpoint.

```
communications
  - id
  - org_id
  - client_id          uuid, FK → clients
  - estimate_id        uuid, FK — nullable
  - job_id             uuid, FK — nullable
  - method             enum — phone, email, text, in_person, portal_message
  - direction          enum — inbound, outbound
  - result             enum — spoke_with_client, left_voicemail, no_answer, email_sent, meeting_held, other
  - notes              text
  - logged_by          uuid, FK → employees
  - occurred_at        timestamp
  - created_at, updated_at

communication_attachments  (join — reuses note_attachments pattern)
  - id
  - communication_id
  - file_url
  - file_name
  - file_type
```

**Auto-logged events:**
- Estimate sent → outbound, email
- Estimate approved → inbound
- Estimate declined → inbound
- Invoice sent → outbound, email

---

### Org Settings & Branding

Per-org configuration. Drives app behavior and client portal appearance.

```
org_settings
  - id
  - org_id
  - company_name
  - company_phone
  - company_email
  - company_website
  - company_address
  - logo_url                        Supabase storage
  - primary_color                   hex
  - secondary_color                 hex
  - accent_color                    hex
  - font_preference                 text
  - estimate_footer_text            text
  - invoice_footer_text             text
  - equipment_approval_required     bool — default false
  - equipment_approval_role_id      uuid, FK → roles
  - portal_enabled                  bool — default false (Phase 2)
  - portal_subdomain                text — nullable (e.g. "freedomlandscapes")
  - charges_tax                     bool — default false — if false, tax never shown on estimates/invoices
  - default_tax_rate                numeric — nullable — e.g. 0.07 for 7%, only used if charges_tax = true
  - updated_at
```

**Client Portal (Phase 2 — architect now, build later):**
- `clients.has_portal_access` flag controls who can access
- Branded with org logo + colors
- Clients can: view estimates, approve/decline, view invoices, pay, request services
- Targeted at routine/recurring clients, not one-off jobs

---

## Modules

---

## 1. Clients

### Overview
Two client types: **Residential** and **Organization/Company**.

- Residential → auto-selects primary address and contact on estimate creation
- Organization → must pick install address and site contact (or create new)

### clients

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| is_company | bool | false = residential, true = org |
| company_name | text | nullable, only if is_company |
| first_name | text | |
| last_name | text | |
| display_name | text | auto-suggested, user can override |
| phone | text | |
| email | text | |
| quickbooks_customer_id | text | QB sync reference |
| client_type_id | uuid, FK | → client_types (one only) |
| sales_lead | uuid, FK | → employees |
| referral_funnel_id | uuid, FK | → referral_funnels |
| referral_source_id | uuid, FK | → referral_sources (nullable) |
| payment_terms_id | uuid, FK | → payment_terms |
| contact_frequency | enum | monthly, quarterly, bi-annually, annually, custom |
| contact_frequency_days | int | nullable, only if contact_frequency = custom |
| last_contacted | date | |
| next_contact | date | |
| is_previous_customer | bool | |
| is_incomplete | bool | auto-flag — true if referral_funnel, tags, client_type, or sales_lead missing |
| has_portal_access | bool | Phase 2 — enables client portal access |
| notes | text | |

**display_name auto-suggest logic:**
- Residential, no partner → `"First Last"` or `"Last, First"`
- Residential, with partner → `"First & PartnerFirst Last"`
- Company → `"Company Name"`
- User can always override

---

## 2. Lookup / Reference Tables

All user-built lists share the same standard columns plus:
```
sort_order   int     increments of 10 (allows insert-between without renumbering)
is_active    bool
```

### client_types
Profile/tier of client (e.g. High Profile, Average). One per client. User-built.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text | |
| color | text | optional, for UI display |
| sort_order | int | |
| is_active | bool | |

### tags
Used for client categorization (e.g. Irrigation Blowout, Snow, Routine Maintenance). Many per client. User-built.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text | |
| color | text | optional |
| sort_order | int | |
| is_active | bool | |

### client_tags (join)

| Column | Type | Notes |
|---|---|---|
| client_id | uuid, FK | |
| tag_id | uuid, FK | |

### referral_funnels
How the client found you (e.g. Google, Contract Referral, Door Hanger). User-built.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text | |
| requires_source | bool | if true, show referral_source picker |
| sort_order | int | |
| is_active | bool | |

### referral_sources
Person or company name associated with a referral funnel. Reusable across clients.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| referral_funnel_id | uuid, FK | |
| name | text | person or company name |
| is_active | bool | |

### payment_terms
Seeded on org creation with standard set. Syncs with QuickBooks.

**Standard seed values:**
- Due on Receipt (0 days)
- Net 7
- Net 15
- Net 30
- Net 45

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text | |
| days_until_due | int | |
| quickbooks_term_id | text | QB sync reference |
| sort_order | int | |
| is_active | bool | |

**QB sync behavior:**
- On org creation → seed standard terms, push to QB
- On new term created in app → create in QB, store `quickbooks_term_id`
- On QB import → pull existing terms, match or create

---

## 3. Addresses

Addresses are owned by the client and reused across estimates.

### client_addresses

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| client_id | uuid, FK | |
| type | enum | billing, job_site, both |
| is_primary | bool | |
| street_address | text | |
| city | text | |
| state | text | |
| zip | text | |
| lat | numeric | |
| lng | numeric | |
| notes | text | |

---

## 4. Contacts

Contacts are owned by the client and can be attached to estimates with a role.

### client_contacts

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| client_id | uuid, FK | |
| first_name | text | |
| last_name | text | |
| phone | text | |
| email | text | |
| role | text | owner, spouse/partner, site_contact, billing, pm, etc. |
| is_primary | bool | |
| notes | text | |

### estimate_contacts (join — covered in Estimates module)
Contacts attached to a specific estimate, with a role of `contact_only` or `contact_and_billing`.

---

## 5. Employees & Permissions

### Overview
- Authentication via Supabase Auth
- Each employee has a base role
- Individual permission overrides on top of role baseline
- Override always wins
- Employee records are never deleted — status changes only
- Eligible for reactivation if rehired

### roles

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text | |
| is_system | bool | system roles can't be deleted |
| sort_order | int | |

**System roles (seeded on org creation):**

| Role | Access Level |
|---|---|
| Owner | Everything, unrestricted |
| Executive | Everything + financials (CEO, COO, Office Manager) |
| Operations Director | Full ops, scheduling, jobs, financials — no org settings |
| Manager | Full access for their department + reports |
| Sales / Estimator | Clients, estimates, catalog, basic reporting |
| Marketing | Client tags, referral sources, reports, estimates via override |
| Crew Lead / PM | Jobs, schedules, crew management |
| Fleet Manager | Full equipment/fleet, DOT compliance, maintenance |
| Driver | View assigned jobs, simplified interface — same as #2 |
| Field | View assigned jobs only (simplified interface) |

### role_permissions

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| role_id | uuid, FK | |
| permission_key | text | e.g. "estimates.create" |
| granted | bool | |

### employees

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| supabase_auth_uid | uuid | FK → auth.users, nullable until invite accepted |
| role_id | uuid, FK | → roles (baseline) |
| first_name | text | |
| last_name | text | |
| display_name | text | auto-suggested, user can override |
| personal_email | text | |
| company_email | text | |
| phone | text | |
| address | text | |
| birthday | date | |
| start_date | date | |
| end_date | date | nullable |
| employee_title | text | |
| employee_position | text | |
| employment_type | enum | full_time, part_time, temporary, temp_agency, contractor, seasonal |
| employee_status | enum | active, on_leave, terminated, resigned |
| crew_id | uuid, FK | → crews |
| on_vehicle_insurance | bool | |
| has_company_card | bool | |
| company_card_last_four | text | nullable |
| is_sales | bool | if true, eligible as sales lead on clients/estimates |
| tracks_hours | bool | always true for hourly — optional for salaried |
| drivers_license_number | text | nullable |
| drivers_license_state | text | nullable |
| drivers_license_class | text | nullable — Class C, etc. |
| drivers_license_expiry | date | nullable — alert before expiry |
| medical_card_expiry | date | nullable — if required |

**Access rules:**
- `active` and `on_leave` → app access granted
- `terminated` and `resigned` → app access revoked immediately
- Supabase Auth user disabled on separation, re-enabled on rehire
- Historical records (estimates, jobs, clients) always remain attributed to employee

### employee_invites

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| employee_id | uuid, FK | |
| email | text | address invite was sent to |
| token | text | secure random token |
| status | enum | pending, accepted, expired, revoked |
| invited_by | uuid, FK | → employees |
| invited_at | timestamp | |
| accepted_at | timestamp | nullable |
| expires_at | timestamp | |

### employee_permission_overrides

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| employee_id | uuid, FK | |
| permission_key | text | |
| granted | bool | true = grant above role, false = revoke from role |

**Permission resolution:**
1. Load employee's base role permissions
2. Apply `employee_permission_overrides` on top
3. Override always wins

### employee_compensation

Full compensation history. Current pay = most recent record where `effective_date <= today`.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| employee_id | uuid, FK | |
| pay_type | enum | hourly, salary |
| pay_rate | numeric | |
| effective_date | date | |
| end_date | date | nullable |
| reason | text | e.g. "Annual raise", "Promotion", "Role change" |
| created_by | uuid, FK | → employees |

**Visibility:** Owner, Executive, and direct manager only (`compensation.view` permission)

### employee_preferences

App settings saved per employee.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| employee_id | uuid, FK | |
| dashboard_config | jsonb | saved dashboard layout/widgets |
| notification_config | jsonb | notification preferences |
| project_item_filter | jsonb | last used filter state |
| route_select | text | last selected route |

### custom_field_definitions

Universal custom fields — org defines fields per entity type. Used for employee HR tracking (uniform sizes, insurance enrollment, documents, etc.) and other entities.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| entity_type | enum | employee, client, estimate, job |
| name | text | e.g. "Edward Jones", "T-Shirt Size" |
| field_type | enum | boolean, enum, file, file_enum, text, date, number |
| options | jsonb | nullable — list of options for enum/file_enum types |
| is_required | bool | |
| sort_order | int | |
| is_active | bool | |

### custom_field_values

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| custom_field_definition_id | uuid, FK | |
| entity_type | enum | matches definition |
| entity_id | uuid | FK to employee, client, estimate, or job |
| value_boolean | bool | nullable |
| value_enum | text | nullable |
| value_text | text | nullable |
| value_date | date | nullable |
| value_number | numeric | nullable |
| file_url | text | nullable — Supabase storage URL |

### Permission Keys (by module)

```
clients.view / clients.create / clients.edit / clients.delete
estimates.view / estimates.create / estimates.edit / estimates.delete
jobs.view / jobs.create / jobs.edit / jobs.delete
catalog.view / catalog.manage
employees.view / employees.manage
compensation.view
settings.manage
financials.view
scheduling.view / scheduling.manage
fleet.view / fleet.manage
equipment.view / equipment.schedule / equipment.approve
reports.view
```

---

## 6. Crews

### Overview
- Crews are fixed week-to-week — same members, different job assignments
- Each employee has one home crew (`crew_id` on employee)
- Employees can work a different crew's job on rare occasions — handled at job assignment level, not by changing home crew

### crews

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text | e.g. "Crew 1", "Paver Crew" |
| crew_lead_id | uuid, FK | → employees |
| is_active | bool | |
| notes | text | |

---

## 7. Equipment & Fleet

### Overview
Full fleet management module covering equipment scheduling, DOT compliance, maintenance, and driver tracking.

**Roles:**
- **Fleet Manager** — full equipment/fleet management, DOT compliance, maintenance
- **Ops Director** — inherits all Fleet Manager permissions
- **Driver** — same permissions as #2, simplified interface

### equipment

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text | e.g. "F-350 #2", "16ft Trailer", "Skid Steer" |
| type | enum | truck, trailer, equipment, attachment |
| make | text | |
| model | text | |
| year | int | |
| vin_serial | text | VIN or serial number |
| license_plate | text | nullable |
| dot_number | text | nullable |
| registration_expiry | date | alert before expiry |
| insurance_expiry | date | alert before expiry |
| annual_inspection_due | date | alert before expiry |
| is_shareable | bool | if true, multiple crews can schedule same day |
| is_active | bool | |
| notes | text | |

**Sharing rules by type:**
- `truck`, `trailer` → `is_shareable = false` — one crew per day, blocked once assigned
- `equipment`, `attachment` → `is_shareable = true` — can overlap if schedules don't conflict

### equipment_assignments
Permanent crew assignments.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| equipment_id | uuid, FK | |
| crew_id | uuid, FK | |
| assigned_date | date | |
| notes | text | |

### equipment_schedule
Temporary / date-range assignments for specific jobs or dates.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| equipment_id | uuid, FK | |
| crew_id | uuid, FK | nullable |
| job_id | uuid, FK | nullable |
| start_date | date | |
| end_date | date | nullable — single day if null |
| notes | text | |

### equipment_requests
Used when `org_settings.equipment_approval_required = true`.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| equipment_id | uuid, FK | |
| crew_id | uuid, FK | |
| job_id | uuid, FK | nullable |
| requested_by | uuid, FK | → employees |
| start_date | date | |
| end_date | date | nullable |
| status | enum | pending, approved, denied |
| reviewed_by | uuid, FK | → employees, nullable |
| reviewed_at | timestamp | nullable |
| notes | text | |

**Approval workflow (org-configurable):**
- `equipment_approval_required = false` → crew lead schedules directly, no approval
- `equipment_approval_required = true` → request goes to Ops Director / Fleet Manager for approval
- Crew lead notified of decision either way

### equipment_maintenance

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| equipment_id | uuid, FK | |
| type | text | e.g. "Oil Change", "Tire Rotation", "Inspection", "Repair" |
| performed_date | date | |
| mileage | int | nullable |
| next_service_date | date | nullable — alert before due |
| next_service_mileage | int | nullable |
| performed_by | text | person or shop name |
| cost | numeric | nullable |
| notes | text | |
| receipt_url | text | nullable — Supabase storage |

### vehicle_inspections
Daily pre/post trip DVIR (Driver Vehicle Inspection Report).

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| equipment_id | uuid, FK | |
| driver_id | uuid, FK | → employees |
| inspection_type | enum | pre_trip, post_trip |
| inspection_date | date | |
| odometer | int | nullable |
| passed | bool | |
| defects | jsonb | list of noted defects |
| driver_signature | text | Supabase storage URL |
| notes | text | |

---

## 8. Estimates

### Overview
The estimate record serves as the lead from day one — no separate opportunity table. Every inquiry starts as an estimate in `lead` status.

**Key behaviors:**
- Residential → auto-populates billing address and primary contact
- Organization → requires install address and site contact selection
- Each estimate has a type (Design/Build, Irrigation, etc.) that drives numbering, contract template, and layout
- Estimate carries a main status + org-defined sub-status
- Change orders created for post-approval edits
- Add-on services (e.g. fall cleanup) are added directly to the existing recurring estimate as new product lines — no child estimate
- `declined_reason` lives on the estimate

**Structure:**
```
estimate
  └── estimate_product_lines   (e.g. "Weekly Mowing", "Irrigation Blowout")
        └── service_visits     (one or many per product line)
              └── line item overrides (optional — inherits from product line template if none)
```

---

### estimate_types

System-seeded per org. Org can customize prefix, templates, and signature requirements.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text | e.g. "Design/Build", "Irrigation" |
| prefix | text | DB, SP, IR, MTN, SN |
| next_number | int | auto-increments per type |
| requires_signature | bool | |
| contract_template_id | uuid, FK | → document_templates, nullable |
| estimate_template_id | uuid, FK | → document_templates, nullable |
| is_active | bool | |
| sort_order | int | |

**System-seeded estimate types:**

| Type | Prefix | Starting # | Signature |
|---|---|---|---|
| Design/Build | DB | 10000 | Yes |
| Special Projects | SP | 20000 | Configurable |
| Irrigation | IR | 30000 | Yes |
| Maintenance | MTN | 40000 | Yes |
| Snow | SN | 50000 | Yes |

---

### estimate_sub_statuses

Org-defined sub-statuses per main status. Applies to estimates and jobs.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| parent_status | enum | lead, estimate, approved, declined, on_hold, converted |
| name | text | e.g. "New Inquiry", "Appointment Scheduled", "Draft", "Sent" |
| color | text | optional |
| sort_order | int | |
| is_active | bool | |

---

### estimates

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| estimate_number | text | auto-generated — e.g. "DB10001" |
| estimate_type_id | uuid, FK | → estimate_types |
| client_id | uuid, FK | → clients |
| sales_lead_id | uuid, FK | → employees (filtered to is_sales = true) |
| job_site_address_id | uuid, FK | → client_addresses |
| billing_address_id | uuid, FK | → client_addresses |
| main_status | enum | lead, estimate, approved, declined, on_hold, converted |
| sub_status_id | uuid, FK | → estimate_sub_statuses, nullable |
| declined_reason | text | nullable |
| default_labor_rate | numeric | inheritable by line items |
| total_amount | numeric | calculated |
| requires_signature | bool | inherited from estimate_type, overridable |
| signed_at | timestamp | nullable |
| signed_by | text | nullable — name of signer |
| signature_url | text | nullable — Supabase storage |
| is_recurring | bool | default false |
| recurrence_type | enum | weekly, bi_weekly, monthly, seasonal, annual — nullable |
| recurrence_start | date | nullable |
| recurrence_end | date | nullable |
| expense_bucket_id | uuid, FK | → expense_buckets (sub-bucket) — required, auto-suggested from estimate type, user confirms |
| is_tax_exempt | bool | default false — if org charges_tax = true, user can mark individual estimate as exempt |
| quickbooks_estimate_id | text | QB sync reference |
| sent_at | timestamp | nullable |
| approved_at | timestamp | nullable |
| converted_at | timestamp | nullable |
| converted_to_job_id | uuid, FK | → jobs, nullable |

---

### estimate_contacts (join)

Contacts attached to a specific estimate.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| estimate_id | uuid, FK | |
| contact_id | uuid, FK | → client_contacts |
| role | enum | contact_only, contact_and_billing |

---

### change_orders

Post-approval edits to an estimate.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| estimate_id | uuid, FK | |
| change_order_number | text | e.g. "DB10001-CO1" |
| description | text | |
| amount_delta | numeric | positive = increase, negative = decrease |
| status | enum | draft, pending_approval, approved, declined |
| approved_at | timestamp | nullable |
| approved_by | uuid, FK | → employees, nullable |
| quickbooks_id | text | nullable |

---

### estimate_product_lines

One or more per estimate. Defines the scope/template for a service type. For project-based estimates (Design/Build, Special Projects), also serves as the cost tracking target for time and expenses.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| estimate_id | uuid, FK | |
| name | text | e.g. "Weekly Mowing", "Irrigation Blowout", "Hardscape Phase 1" |
| description | text | nullable |
| sort_order | int | |

---

### service_visits

Children of a product line. One or many per product line depending on recurrence.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| product_line_id | uuid, FK | → estimate_product_lines |
| estimate_id | uuid | denormalized for easy querying |
| scheduled_date | date | nullable |
| completed_date | date | nullable |
| status | enum | scheduled, completed, skipped, cancelled |
| price_override | numeric | nullable — overrides product line template price if set |
| notes | text | nullable |

**Line item behavior:**
- If no line item overrides on the visit → inherits and bills from product line template
- If visit has its own line items → those win

---

## 9. Expense Buckets

### Overview

Org-defined cost/income allocation system. All time entries and expenses are logged to a sub-bucket or project product line — never directly to a service visit or contract root.

**Two cost models — determined by the sub-bucket:**

| Cost Model | How it works |
|---|---|
| project | Sub-bucket IS a specific estimate. User drills to product line. Income + costs tracked at line item level. |
| bucket | Sub-bucket is a category. Income rolls up from attached estimates. Costs logged at sub-bucket level. |

**Selection flow when logging time or an expense:**

```
Toggle: [Project] or [Expense]

Project  →  List of active contracts (DB / SP / IR Install)  →  Product Line
Expense  →  Bucket  →  Sub-bucket
```

**Rules enforced in UI:**
- Project: must select a product line — can't log to contract root
- Expense: must drill to sub-bucket — can't stop at parent bucket

---

### expense_buckets

One table — `parent_bucket_id` null = top-level bucket, set = sub-bucket.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text | e.g. "Maintenance", "Residential Maintenance", "Design/Build" |
| parent_bucket_id | uuid, FK | → expense_buckets, nullable — null = top-level |
| cost_model | enum | project, bucket — nullable on top-level (inherited from sub) |
| estimate_type_id | uuid, FK | → estimate_types, nullable — filters which estimate types attach here |
| is_active | bool | |
| sort_order | int | |

**Seeded on org creation:**

| Bucket | Sub-bucket | Estimate Type | Cost Model |
|---|---|---|---|
| Projects | Design/Build | Design/Build | project |
| Projects | Special Projects | Special Projects | project |
| Projects | Irrigation Install | Irrigation | project |
| Maintenance | Residential Maintenance | Maintenance | bucket |
| Maintenance | Commercial Maintenance | Maintenance | bucket |
| Snow | Residential Snow | Snow | bucket |
| Snow | Commercial Snow | Snow | bucket |
| Irrigation | Irrigation Service | Irrigation | bucket |
| Overhead | Admin | — | bucket |
| Overhead | Vehicles & Equipment | — | bucket |
| Overhead | Payroll / Labor (non-job) | — | bucket |

Org can add additional sub-buckets or free-form top-level buckets (e.g. "Food & Drink", "Training").

---

### Time & Expense Allocation

**Time entries:** One entry per target. No splitting.

**Expenses:** Can be split across multiple targets.

```
expense_splits
  - id
  - expense_id          FK → expense_entries
  - target_type         enum — sub_bucket, project_line
  - target_id           uuid — FK to expense_buckets (sub) or estimate_product_lines
  - amount              numeric
```

---

## 10. Item Catalog

### Overview

Individual materials and subcontractor line items. Building blocks used in product catalog assemblies and estimate line items.

- **Materials** — physical products (mulch, pavers, pipe, sod, etc.)
- **Partners (Subcontractors)** — saved sub/trade companies, bid price entered per estimate
- Labor and equipment are NOT catalog items — they come from org-level labor rates and equipment costs

---

### Org-Level Labor Rates & Markups

Stored in `org_settings`. Used as default starting values on all estimates.

```
org_settings additions:
  labor_rate_install          numeric    $/hr — field/install labor
  labor_rate_equipment_op     numeric    $/hr — equipment operator
  labor_rate_design           numeric    $/hr — design/estimating time
  material_markup_pct         numeric    default markup % on all materials
  subcontractor_markup_pct    numeric    default markup % on all partner bids
```

---

### catalog_items (materials)

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text | canonical name — always from preferred vendor |
| description | text | nullable |
| unit | text | e.g. "yard", "sf", "each", "lb", "lf" |
| default_cost | numeric | nullable — global cost if no supplier pricing used |
| default_sell_price | numeric | nullable — global sell price, skips cost+margin |
| default_markup_pct | numeric | nullable — item-level override of org markup |
| waste_pct | numeric | default 0 — applied on top of calculated qty |
| last_price_updated_at | date | nullable — last time cost/price was manually reviewed or updated |
| price_review_frequency_days | int | nullable — how often to remind to review (e.g. 30, 90, 180) |
| price_auto_increase_pct | numeric | nullable — if set, auto-increase default_cost by this % on schedule |
| price_auto_increase_months | int | nullable — interval in months between auto-increases |
| price_next_increase_date | date | nullable — next scheduled auto-increase date |
| is_active | bool | |
| sort_order | int | |

**Price review reminders:** When `price_review_frequency_days` is set, the catalog view surfaces overdue items (today > last_price_updated_at + frequency_days). User reviews and confirms or updates — `last_price_updated_at` resets on save.

**Auto-increase behavior:** When `price_auto_increase_pct` and `price_auto_increase_months` are set, a scheduled job increments `default_cost` by the percentage and advances `price_next_increase_date` by the interval. Does not affect `default_sell_price` (flat price) — auto-increase is cost-side only.

**Pricing hierarchy:**
1. If `default_sell_price` set → use as flat sell price
2. Else if preferred supplier has `unit_cost` → cost × (1 + markup_pct)
3. Else if `default_cost` set → cost × (1 + markup_pct)
4. Markup % = item override → else org default

**Quantity calculation flow:**
```
calculated_qty = formula result (from product catalog)
order_qty = calculated_qty × (1 + waste_pct / 100)
```

---

### catalog_item_specs

Standard named spec fields used by formulas. Semi-flexible — system recognizes standard keys; extras stored as free-form JSON.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| catalog_item_id | uuid, FK | |
| length_in | numeric | nullable — length in inches |
| width_in | numeric | nullable — width in inches |
| height_depth_in | numeric | nullable — height or depth in inches |
| spread_rate_sqft_per_inch | numeric | nullable — coverage at 1" depth (e.g. mulch) |
| face_feet | numeric | nullable — face footage per unit (e.g. block) |
| extra_specs | jsonb | nullable — any additional free-form spec values |

---

### suppliers

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| name | text | |
| contact_name | text | nullable |
| phone | text | nullable |
| email | text | nullable |
| website | text | nullable |
| is_active | bool | |

### supplier_locations

One supplier, many locations. Used for proximity-based vendor selection.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| supplier_id | uuid, FK | → suppliers |
| name | text | e.g. "Main Branch", "North Location" |
| street_address | text | |
| city | text | |
| state | text | |
| zip | text | |
| lat | numeric | for distance calculation |
| lng | numeric | for distance calculation |
| phone | text | nullable — location-specific |
| is_primary | bool | |
| is_active | bool | |

---

### catalog_item_suppliers

One item, many suppliers. Preferred vendor defines the canonical item name.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| catalog_item_id | uuid, FK | |
| supplier_id | uuid, FK | → suppliers |
| supplier_location_id | uuid, FK | → supplier_locations, nullable — null = applies to all locations |
| is_preferred | bool | preferred vendor — defines canonical item name |
| supplier_sku | text | nullable |
| supplier_item_name | text | nullable — what the supplier calls it |
| unit_cost | numeric | nullable — supplier's price per unit |
| last_price_date | date | nullable |

**Proximity-based vendor selection:**
- On estimate creation, job site lat/lng used to rank supplier locations by distance
- Nearest location carrying the item is auto-suggested as preferred
- User can override

**Job view — Supplier Run List:**
- Aggregates all materials across the job's line items
- Groups by nearest supplier location
- Shows which items to pick up at each stop, sorted by proximity to job site
- "Drive" button opens native maps app with directions to that supplier location

---

### partners (subcontractors)

Saved sub/trade partner records. Bid price entered fresh per estimate line item.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| company_name | text | |
| contact_name | text | nullable |
| phone | text | nullable |
| email | text | nullable |
| trade_type | text | e.g. "Concrete", "Electrical", "Irrigation" |
| notes | text | nullable |
| is_active | bool | |

---

## 11. Product Catalog

### Overview

The product catalog is a form designer + formula engine. Each product defines what inputs the estimator is asked, what items are calculated, and how they're priced. Ships with pre-built templates — user populates their items and goes.

---

### catalog_item rounding rules (additions to catalog_items)

| Column | Type | Notes |
|---|---|---|
| color | text | nullable — used for auto color dropdowns in configurations |
| quantity_type | enum | whole, decimal |
| round_to | numeric | nullable — e.g. 1, 0.25, 0.1, 0.05 |
| minimum_qty | numeric | nullable — always order at least this amount |
| package_unit | text | nullable — e.g. "bag", "box", "ton", "pallet" |

---

### material_configurations

Named presets that bundle catalog items into roles (paver field + border, wall block + cap, etc.). User builds these; system handles math internally based on config type.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| org_id | uuid, FK | |
| name | text | e.g. "Plaza - I Pattern", "Unilock Belgard Natural" |
| config_type | enum | paver_patio, wall, mulch_bed, sod, flagstone, rock_bed, turf |
| color | text | nullable — auto-derived from selected items |
| is_active | bool | |
| sort_order | int | |

**Config types (system-defined, math pre-baked):**

| Config Type | Roles & Calc Logic |
|---|---|
| paver_patio | field (% of area), border_soldier (lf ÷ width_in/12), border_sailor (lf ÷ length_in/12) |
| wall | block (lf × height ÷ face_feet), cap (lf ÷ face_feet) |
| flagstone | field (% of area by sf), border (lf) |
| mulch_bed | mulch (area ÷ spread_rate × depth), edging (lf) |
| sod | sod (sf), soil_amendment (area × depth) |
| rock_bed | rock (area × depth / 27), edging (lf) |
| turf | turf (sf), infill (sf), edging (lf) |

---

### material_configuration_roles

Items assigned to each role within a configuration.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| configuration_id | uuid, FK | → material_configurations |
| role_key | text | e.g. "field", "border_soldier", "border_sailor", "block", "cap" |
| catalog_item_id | uuid, FK | → catalog_items |
| area_pct | numeric | nullable — % of area for field roles |
| orientation | enum | soldier, sailor, nullable — for border roles |
| sort_order | int | |

**Color auto-generation:** When items in a configuration have `color` populated, the system auto-generates a color picker dropdown at estimate time from those item colors. Selecting a color resolves to the specific catalog item.

---

### product_catalog

The top-level product template. Defines inputs, items, and pricing defaults.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| org_id | uuid, FK | |
| name | text | e.g. "Paver Patio", "Mulch Bed", "Sod Installation" |
| category | enum | hardscape, softscape, drainage, maintenance, snow, irrigation, other |
| pricing_mode | enum | cost_plus, flat_rate, per_sf, t_and_m — default, overridable at estimate |
| install_rate | numeric | nullable — default install labor hrs per unit (sf, lf, etc.) |
| minimum_hours | numeric | nullable — minimum labor hours regardless of size |
| flat_rate_price | numeric | nullable — starting flat rate if pricing_mode = flat_rate |
| labor_rate_override | numeric | nullable — overrides org default labor rate for this product |
| equipment_rate_override | numeric | nullable — overrides org default equipment rate |
| default_description | text | nullable — pre-fills estimate line item description, editable per estimate |
| quickbooks_item_code | text | nullable — QB service/item code for invoice sync |
| is_system_template | bool | true = shipped with app, org can edit but not delete |
| is_active | bool | |
| sort_order | int | |

---

### product_catalog_inputs

The form fields shown to the estimator when adding this product to an estimate.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| product_catalog_id | uuid, FK | |
| label | text | e.g. "Area", "Depth", "Paver Style", "Border LF" |
| input_type | enum | number, item_dropdown, color_dropdown, config_dropdown, custom_dropdown, text |
| unit_label | text | nullable — e.g. "sf", "inches", "lf" |
| is_required | bool | |
| default_value | text | nullable |
| custom_options | jsonb | nullable — static list for custom_dropdown type |
| sort_order | int | |

---

### product_catalog_components

Items that get calculated and added to the estimate when this product is used. Each component has a formula referencing input field labels and item spec keys.

| Column | Type | Notes |
|---|---|---|
| id | uuid, PK | |
| product_catalog_id | uuid, FK | |
| label | text | e.g. "Mulch", "Weed Fabric", "Snap Edging" |
| component_type | enum | catalog_item, material_configuration, labor, equipment, partner |
| catalog_item_id | uuid, FK | nullable — fixed item |
| input_ref | text | nullable — which input drives item selection (for item_dropdown inputs) |
| configuration_input_ref | text | nullable — which input drives config selection |
| qty_formula | text | formula string — e.g. "area / spread_rate_sqft_per_inch * depth" |
| sort_order | int | |

---

### System-Seeded Product Templates

**Hardscape**
- Paver Patio
- Paver Walkway
- Paver Driveway
- Flagstone Patio
- Flagstone Walkway
- Flagstone Steps
- Step Units
- Retaining Wall (block)
- Boulder Wall
- Seat Wall
- Block Border
- 3/4" Rock Bed
- 1.5" Rock Bed
- 2"+ Rock / Boulders
- Breeze / Decomposed Granite Path
- Breeze / Decomposed Granite Patio
- Artificial Turf
- Concrete (subcontractor)
- Site Prep / Demo
- T&M Structure

**Softscape**
- Mulch Bed
- Sod Installation
- Seeding
- Plants #1
- Plants #5
- Plants #10–#25
- Trees
- Water Feature

**Drainage**
- French Drain
- Catch Basin
- Dry Well
- Downspout / Drain Tile
- Dry Creek Bed

**Irrigation**
- Irrigation Zone Installation
- Irrigation Valve Replacement
- Backflow Preventer
- Head Replacement / Adjustment

**Maintenance**
- Mowing
- Spring Cleanup
- Fall Cleanup
- Fertilization / Treatment
- Irrigation Blowout
- Irrigation Activation

**Snow**
- Plowing
- Salting
- Shoveling / Hand Work

> Irrigation and Plant templates marked as complex — full input/formula definitions to be detailed during build phase.

---

## 12. Jobs

> TBD — workshopping in progress

Estimates convert to jobs on approval. Jobs carry crew assignments, scheduling, and expense tracking.

---

## 13. Scheduling

> TBD — workshopping in progress

---

## 14. Expenses (Teller.io)

> TBD — workshopping in progress

Teller.io integration for bank transaction import. Expenses split to buckets or project product lines via expense_splits.

---

## 15. Timesheets

> TBD — workshopping in progress

Employees log separate time entries per bucket/sub-bucket or project product line.

---

## 16. Reporting

> TBD — workshopping in progress

---

## Backtrack Tasks

Items already workshopped that need to be revisited before build. Work order: P1 → P2 → P3.

### Priority 1 — EOS hooks for completed modules
- [x] Employees & Compensation — EOS metrics: headcount, new hires, terminations, expiring licenses/medical cards, incomplete records
- [x] Equipment & Fleet — EOS metrics: utilization %, maintenance overdue, expiring registration/insurance/inspection, failed DVIRs
- [x] Crews — EOS metrics: crew utilization, jobs per crew per week, crew lead scorecard accountability
- [x] Item Catalog — EOS metrics: items with stale pricing, items with no supplier assigned
- [x] Expense Buckets — EOS scorecard metrics for bucket vs budget tracking
- [x] Communications Log — EOS metrics: outreach activity, calls/emails this week, follow-up accountability

### Priority 2 — Product Catalog templates
- [ ] Define inputs and formulas for every seeded template (Hardscape, Softscape, Drainage, Irrigation, Maintenance, Snow)

### Priority 3 — Estimate (blocks job conversion)
- [ ] Billing / contract terms — deposit, payment schedule, invoice triggers, monthly vs milestone vs on-completion
- [ ] Discounts — resolve line item vs estimate level (or both)
- [ ] Line items table — `estimate_line_items` not yet defined; walk through how user adds items per estimate type
- [ ] Estimate → Job conversion — what exactly copies over and what gets created fresh

---

## Open Questions

1. Can a contact belong to multiple clients/organizations?
2. Estimate sub-statuses — full list TBD
3. QuickBooks sync — Phase 1 or later?
4. Inventory tracking — real-time levels or just pricing/availability?
5. Tax handling — RESOLVED: `org_settings.charges_tax` (bool) controls whether tax is ever applied. `org_settings.default_tax_rate` stores the rate. `estimates.is_tax_exempt` (bool) allows per-estimate override. Tax applies to the total estimate amount; no per-item taxable flag in v1.
6. Discounts — line item or estimate level?

---

## Future Enhancements

### Phase 2:
- Historical install rate tracking
- Auto-update formulas based on completed job actuals
- Quantity break pricing
- Seasonal pricing adjustments

### Phase 3:
- AI-powered estimate suggestions
- Material order automation
- Customer-facing estimate portal
- Photo attachments per line item

---

**Document Version:** 2.0
**Last Updated:** February 26, 2026
**Status:** Workshopping in progress
