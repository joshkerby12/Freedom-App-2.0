# Clients Spec · Freedom App 2.0

> Covers: TASK-014, TASK-015, TASK-016, TASK-017, TASK-018
> Phase 3 — depends on Phase 2 (employees + permissions) completing first.

---

## Overview

The Clients module is the CRM core of the app. It manages residential and commercial client records, property addresses, contacts, referral tracking, communications logging, follow-up scheduling, and the global notes/tasks system. Every estimate and job is attached to a client.

Clients are flagged `is_incomplete = true` by default and cleared to `false` only when minimum required fields are satisfied. The incomplete flag surfaces throughout the app as a visual cue to push data quality.

---

## Scope

**Included:**
- Supabase schema: `clients`, `client_addresses`, `client_contacts`, `client_tags`, `client_types`, `tags`, `referral_funnels`, `referral_sources`, `payment_terms`, `notes`, `note_attachments`, `tasks`, `task_followers`, `communications`, `communication_attachments` + RLS
- ClientService — CRUD, is_incomplete resolution, display_name logic
- ClientListNotifier — paginated list with search and filter
- Client list screen
- Client detail screen (all sections)
- Client create screen
- Client edit screen
- Communications log — log form + history list
- Global notes system (polymorphic — used by clients, estimates, jobs, employees, equipment)
- Global tasks system (polymorphic — same)

**Explicitly out of scope:**
- Client portal — Phase 12
- Estimates on client detail — will link once Phase 6+ (estimates module) is built
- QuickBooks customer sync — future phase
- Bulk import / CSV upload — not in scope v1

---

## User Stories

- As a sales lead, I can create a new client record (residential or commercial) and capture all contact info
- As a sales lead, I can add multiple job site and billing addresses to a client
- As a sales lead, I can add multiple contacts on a commercial account
- As any employee with `clients.view`, I can see the client list and search/filter it
- As a sales lead, I can log every call, email, or in-person meeting against a client
- As a manager, I can see which clients are overdue for contact and get to them from the list
- As any employee, I can add notes to a client and attach files
- As any employee, I can create tasks against a client and assign them to team members
- As an owner/admin, I can manage lookup tables: client types, tags, referral funnels/sources, payment terms

---

## Org / User Context

- **Data scoping:** All tables scoped to `org_id`.
- **Role access:**
  - `clients.view` — read client list and detail
  - `clients.create` — create new clients
  - `clients.edit` — edit existing clients
  - `clients.delete` — delete clients (hard delete only allowed by owner/admin; soft delete via status not implemented in this phase)
- **sales_lead field:** Any employee with `is_sales = true` can be assigned as a sales lead. The field references `employees.id`.

---

## is_incomplete Logic

`is_incomplete` starts as `true` on every new client. It is set to `false` when all of the following are satisfied:

**Residential clients (`is_company = false`):**
- `first_name` is not blank
- `last_name` is not blank
- At least one `client_addresses` row exists
- `phone` or `email` is not blank

**Commercial clients (`is_company = true`):**
- `company_name` is not blank
- At least one `client_addresses` row exists
- At least one `client_contacts` row exists with phone or email

The `is_incomplete` flag is re-evaluated on every save (create or edit). `ClientService` performs this check and sets the field before upserting. Do not let the UI control `is_incomplete` directly.

---

## display_name Logic

`display_name` is an optional override. If null:
- `is_company = false`: render `first_name + ' ' + last_name`
- `is_company = true` and `company_name` is not null: render `company_name`
- `is_company = true` and `company_name` is null: render `first_name + ' ' + last_name`

On create/edit, show the auto-format as placeholder text if the user leaves `display_name` blank. Never auto-populate the field.

---

## Contact Frequency Logic

`contact_frequency` and `contact_frequency_days` drive follow-up scheduling:

| contact_frequency | behavior |
|---|---|
| `monthly` | next_contact = last_contacted + 30 days |
| `quarterly` | next_contact = last_contacted + 90 days |
| `bi-annually` | next_contact = last_contacted + 180 days |
| `annually` | next_contact = last_contacted + 365 days |
| `custom` | next_contact = last_contacted + contact_frequency_days |

`next_contact` is recalculated by the app layer (not a DB trigger) whenever a communication is logged or `last_contacted` is updated manually. No background job in this phase — updated on write only.

---

## Page States

| State | Description |
|---|---|
| Loading | Data fetching — show shimmer list rows |
| Loaded | Data ready — show list or detail |
| Empty | No clients — show "No clients yet" + "Add Client" button |
| Error | Fetch failed — show error + retry |
| Submitting | Form saving — disable button, show loading |
| Permission denied | Insufficient permission — show locked message |

---

## UI Behavior

### Client List Screen (`/clients`)

**Permission required:** `clients.view`

**Loaded state:**
- List of clients sorted by display_name ascending
- Each row: display_name, client_type badge (colored), primary phone or email, incomplete indicator (yellow dot if `is_incomplete = true`), next_contact date if overdue (red)
- Search bar at top — filters by display_name, company_name, email, phone in real time
- Filter chips: All / Residential / Commercial / Incomplete / Overdue Contact
- FAB: "Add Client" (visible if `clients.create`)

**Interactions:**
- Tapping a row → navigate to `/clients/:id`
- FAB → `/clients/new`

---

### Client Detail Screen (`/clients/:id`)

**Permission required:** `clients.view`

**Sections:**

**Header:**
- display_name (large), client_type badge, is_incomplete badge if flagged
- Edit button (visible if `clients.edit`)

**Client Info:**
- is_company toggle (read-only in detail)
- company_name (if is_company)
- first_name, last_name, display_name
- phone, email
- payment_terms name
- sales_lead employee name
- is_previous_customer (badge), has_portal_access (badge)

**Referral:**
- referral_funnel_id → funnel name
- referral_source_id → source name (if funnel requires_source)

**Contact Schedule:**
- contact_frequency display, last_contacted, next_contact
- If next_contact < today: show "Overdue" in red
- "Log Contact" shortcut button → opens communications log form

**Addresses:**
- List of all client_addresses sorted by is_primary desc
- Each row: address type badge (billing / job_site / both), full address, primary badge
- "Add Address" button (if `clients.edit`)

**Contacts (commercial only — shown when is_company = true):**
- List of client_contacts
- Each row: first_name + last_name, role, phone, email, primary badge
- "Add Contact" button (if `clients.edit`)

**Tags:**
- Displayed as colored chips
- "Edit Tags" button → tag selector modal (if `clients.edit`)

**Notes:**
- List of notes (entity_type = 'client', entity_id = client.id) sorted newest first
- Each note: author name, date, body text, attachment thumbnails/links
- "Add Note" button → inline note form

**Tasks:**
- List of tasks (entity_type = 'client', entity_id = client.id)
- Each task: title, assignee, due_date, priority badge, status toggle
- Filter: Open / Completed
- "Add Task" button → task create form

**Communications:**
- Chronological list of all communications (newest first)
- Each row: method icon, direction indicator, occurred_at date, result label, logged_by name, notes snippet
- "Log Communication" button → opens log form

---

### Client Create Screen (`/clients/new`)

**Permission required:** `clients.create`

**Type Toggle (first field):**
- Residential / Commercial — changes which fields appear

**Residential fields:**
- First Name (required), Last Name (required), Display Name (optional)
- Phone, Email
- Client Type (dropdown)
- Sales Lead (employee dropdown — filtered to is_sales = true)
- Referral Funnel (dropdown), Referral Source (conditional on funnel)
- Payment Terms (dropdown)
- Contact Frequency (dropdown), Contact Frequency Days (conditional if custom)
- is_previous_customer (toggle)

**Commercial additional fields:**
- Company Name (required)
- All residential fields above

**Address (inline — at least one required for completeness):**
- Address Type (billing / job_site / both)
- Street Address, City, State, Zip
- is_primary toggle
- "Add Another Address" — adds a second address inline

**Contact (inline, commercial only):**
- First Name (required), Last Name, Phone, Email, Role
- is_primary toggle
- "Add Another Contact"

**Interactions:**
- "Save" → validate → insert client → insert addresses/contacts → is_incomplete evaluated → navigate to detail
- "Cancel" → discard and pop

---

### Client Edit Screen (`/clients/:id/edit`)

**Permission required:** `clients.edit`

Same fields as create. Addresses and contacts are shown as an editable list — tap to edit inline, swipe to delete, "Add" to append new rows.

---

### Communications Log

**Log Form (modal or bottom sheet):**
- Method (dropdown: phone / email / text / in_person / portal_message)
- Direction (inbound / outbound)
- Result (dropdown: spoke_with_client / left_voicemail / no_answer / email_sent / meeting_held / other)
- Occurred At (datetime picker, defaults to now)
- Notes (multi-line text)
- Optional file attachment (opens file picker, uploads to Supabase Storage)

**On Save:**
- Insert `communications` row
- Insert `communication_attachments` row if file attached
- Recalculate `next_contact` based on `contact_frequency` and set `last_contacted = occurred_at` on the client row

**History List:**
- Chronological (newest first)
- Each entry: method icon + label, direction arrow, result label, occurred_at formatted date, logged_by name, notes text, attachment link if present

---

### Notes System (Global)

Used on clients, estimates, jobs, employees, equipment. Behavior is the same across all contexts.

**Add Note Form (inline on detail screen):**
- Body (multi-line text, required)
- Optional file attachment (uploads to Supabase Storage → `note_attachments`)

**Note Display:**
- Author name, created_at formatted, body text
- Attachments as file links or image thumbnails

---

### Tasks System (Global)

Used on clients, estimates, jobs, employees. Behavior is the same across contexts.

**Task Create Form:**
- Title (required)
- Description (optional)
- Assignee (employee dropdown)
- Due Date (date picker)
- Priority (low / medium / high / urgent — default medium)

**Task Display:**
- Title, assignee name, due_date (red if overdue), priority badge
- Status toggle: tap to mark complete / reopen
- Completed tasks are greyed out and collapsible

---

## Layouts

- **Mobile** — list/detail. Detail is a scrollable set of sections with clear section headers. Create/edit is a scrollable form.
- **Tablet** — list + detail side by side (optional; single-pane acceptable for Phase 3).

---

## Seed Data

Lookup tables below are org-created — no system seed data for client types, tags, or referral funnels/sources.

`payment_terms` were seeded in Phase 1 by `seed-org-data` Edge Function. These are the same payment_terms table — no re-seeding needed.

---

## Data

**Reads:**
- `clients` — list, detail
- `client_addresses` — detail, create/edit
- `client_contacts` — detail, create/edit
- `client_tags` / `tags` — detail, create/edit
- `client_types` — dropdown
- `referral_funnels` / `referral_sources` — dropdowns
- `payment_terms` — dropdown
- `notes` / `note_attachments` — detail
- `tasks` — detail
- `communications` / `communication_attachments` — detail
- `employees` (for sales_lead dropdown, task assignee, logged_by) — from employees module

**Writes:**
- `clients` — create, edit
- `client_addresses` — add, edit, delete
- `client_contacts` — add, edit, delete
- `client_tags` — add, remove (junction)
- `notes` / `note_attachments` — create
- `tasks` — create, status update
- `communications` / `communication_attachments` — create

---

## RLS Policies

All tables use org-scoped policies per the pattern in `data_structure.md`.

```sql
-- clients: view = any org member with clients.view (app-layer enforced)
CREATE POLICY "org members can view clients"
ON clients FOR SELECT
USING (org_id IN (SELECT org_id FROM org_members WHERE profile_id = auth.uid()));

-- clients: insert/update = admin/owner or employees with clients.create / clients.edit (app-layer permission check)
CREATE POLICY "admins can manage clients"
ON clients FOR INSERT
WITH CHECK (org_id IN (SELECT org_id FROM org_members WHERE profile_id = auth.uid() AND role IN ('owner','admin')));

-- Same pattern for client_addresses, client_contacts, communications, notes, tasks
-- Note: notes, tasks, communications are polymorphic — RLS is org_id only; entity filtering is app-layer
```

---

## Code Map

| File | Purpose |
|---|---|
| `lib/features/clients/models/client.dart` | `@freezed` Client model |
| `lib/features/clients/models/client_address.dart` | `@freezed` ClientAddress model |
| `lib/features/clients/models/client_contact.dart` | `@freezed` ClientContact model |
| `lib/features/clients/models/communication.dart` | `@freezed` Communication model |
| `lib/features/clients/models/note.dart` | `@freezed` Note model (shared / global) |
| `lib/features/clients/models/task_item.dart` | `@freezed` TaskItem model (shared / global — named TaskItem to avoid dart:core clash) |
| `lib/features/clients/helpers/client_validators.dart` | Form validation, is_incomplete rules |
| `lib/features/clients/helpers/client_calculations.dart` | display_name resolution, next_contact calc, overdue logic |
| `lib/features/clients/services/client_service.dart` | Supabase CRUD — clients, addresses, contacts, tags |
| `lib/features/clients/services/communication_service.dart` | Log, fetch communications; update last_contacted |
| `lib/features/clients/services/note_service.dart` | Create, fetch notes + attachments (shared service) |
| `lib/features/clients/services/task_service.dart` | Create, fetch, update tasks (shared service) |
| `lib/features/clients/providers/client_list_provider.dart` | `@riverpod` — paginated list, search, filter |
| `lib/features/clients/providers/client_detail_provider.dart` | `@riverpod` — single client by id |
| `lib/features/clients/layouts/client_list_layout.dart` | Client list screen |
| `lib/features/clients/layouts/client_detail_layout.dart` | Client detail screen |
| `lib/features/clients/layouts/client_form_layout.dart` | Shared create/edit form |
| `lib/features/clients/widgets/address_list_widget.dart` | Editable address list |
| `lib/features/clients/widgets/contact_list_widget.dart` | Editable contacts list |
| `lib/features/clients/widgets/communication_log_widget.dart` | Communications history + log form |
| `lib/features/clients/widgets/notes_section_widget.dart` | Notes list + add form (reusable across modules) |
| `lib/features/clients/widgets/tasks_section_widget.dart` | Tasks list + add form (reusable across modules) |
