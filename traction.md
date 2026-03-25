# Freedom App 2.0 — EOS / Traction Integration Guide

## Overview

This document defines how the Entrepreneurial Operating System (EOS) from the book *Traction* is built into Freedom App 2.0. Every module in the app is designed to feed EOS data automatically — metrics surface on the Scorecard, issues capture to the Issues List, tasks sync to the To-Do list, and Rocks track 90-day priorities.

The goal: the app runs the business, and EOS runs on top of it with minimal manual entry.

---

## EOS Components

| Component | What it is | Cadence |
|---|---|---|
| Scorecard | Weekly measurables — leading indicators that show if you're on track | Weekly |
| Rocks | 90-day priorities — 3–7 per person, company-level and individual | Quarterly |
| To-Dos | 7-day tasks created during L10 meetings | Weekly |
| Issues List | Parking lot for problems, obstacles, and ideas (IDS: Identify, Discuss, Solve) | Ongoing + weekly L10 |
| L10 Meeting | Weekly 90-minute leadership meeting — structured agenda | Weekly |
| Accountability Chart | Seats with clear roles and Functions — not an org chart | Quarterly review |

---

## Module-by-Module: What Gets Tracked

---

### Clients

**Auto-generated Scorecard metrics:**
- New leads this week (estimates created in `lead` status)
- Leads converted to estimates this week (status moved from `lead` → `estimate`)
- Estimates sent this week (`sent_at` populated)
- Estimates approved this week (`approved_at` populated)
- Estimates declined this week (`main_status = declined`)
- Close rate (approved / sent — rolling 4-week)
- Average estimate value (approved estimates — rolling 4-week)
- New clients added this week

**Issues triggers:**
- Client flagged `is_incomplete` — surfaces as an issue until resolved
- No contact with high-profile client type in > `contact_frequency_days` — auto-issue

---

### Estimates

**Auto-generated Scorecard metrics:**
- Estimates in pipeline by type (DB, SP, IR, MTN, SN)
- Total pipeline value by type
- Estimate-to-job conversion rate by type (rolling quarter)
- Average days from lead to approval by type
- Estimates sitting in `lead` status > 14 days (configurable threshold)
- Open change orders pending approval

**Issues triggers:**
- Estimate in `lead` status with no activity in > X days (org-configurable)
- Change order pending approval > X days

---

### Employees & Compensation

**Auto-generated Scorecard metrics:**
- Active headcount (employees with status `active`)
- New hires this week (`start_date` in current week)
- Terminations / resignations this week (`end_date` in current week)
- Employees on leave count (`employee_status = on_leave`)
- Incomplete employee records (`is_incomplete` equivalent — missing role, crew, or compensation record)
- Drivers license expirations within 30 days
- Medical card expirations within 30 days

**Issues triggers:**
- Employee drivers license expiring within N days → auto-issue assigned to Fleet Manager
- Employee medical card expiring within N days → auto-issue assigned to Fleet Manager
- Employee has no compensation record → auto-issue assigned to Owner/Executive
- Employee terminated but still has active app access (Supabase Auth not disabled) → auto-issue assigned to Owner

**Rocks examples:**
- Hire X field employees by end of quarter
- Complete performance reviews for all crew leads
- Implement training program for new hires

---

### Crews

**Auto-generated Scorecard metrics:**
- Active crew count
- Crew utilization % per crew (scheduled job days / available work days this week)
- Jobs completed per crew this week
- Crews with zero scheduled jobs next week

**Issues triggers:**
- Crew with no crew lead assigned → auto-issue
- Crew with zero scheduled jobs for upcoming week by Thursday → auto-issue assigned to Ops Director
- Crew lead position vacant (crew_lead_id points to inactive employee) → auto-issue

---

### Equipment & Fleet

**Auto-generated Scorecard metrics:**
- Equipment utilization % (days scheduled / available days this week, per piece)
- Maintenance events completed this week
- Maintenance events overdue (next_service_date passed and no new record)
- Failed vehicle inspections this week (`vehicle_inspections.passed = false`)
- Open equipment defects (from failed DVIR `defects` field, not yet resolved)

**Issues triggers:**
- Equipment registration expiring within N days → auto-issue assigned to Fleet Manager
- Equipment insurance expiring within N days → auto-issue assigned to Fleet Manager
- Annual inspection due within N days → auto-issue assigned to Fleet Manager
- Maintenance overdue (next_service_date passed) → auto-issue assigned to Fleet Manager
- Failed DVIR with unresolved defects > 1 day → auto-issue assigned to Fleet Manager
- Equipment scheduled for a job with expired registration or insurance → auto-issue, blocks scheduling

**Rocks examples:**
- Complete DOT compliance audit for all trucks by end of quarter
- Replace or retire equipment with > X repair events this quarter

---

### Item Catalog

**Auto-generated Scorecard metrics:**
- Items with price review overdue (today > `last_price_updated_at` + `price_review_frequency_days`)
- Items with no supplier assigned (no `catalog_item_suppliers` record)
- Items with no cost or price set (`default_cost` and `default_sell_price` both null)
- Auto-price increases applied this week

**Issues triggers:**
- Item price review overdue → auto-issue (rule: `item_price_overdue`)
- Item used on active estimate with no supplier or cost → auto-issue assigned to catalog owner

---

### Expense Buckets

**Auto-generated Scorecard metrics:**
- Total spend per top-level bucket this week
- Project buckets over budget (expense total vs estimate contract value)
- Bucket spend vs prior week (week-over-week trend per bucket)
- Overhead spend as % of total revenue this week

**Issues triggers:**
- Project bucket over budget by > N% → auto-issue (rule: `project_over_budget`)
- Sub-bucket with no expenses logged in > N weeks (may indicate logging gap) → auto-issue

---

### Communications Log

**Auto-generated Scorecard metrics:**
- Outbound communications this week (calls made, emails sent, in-person meetings)
- Inbound communications this week (calls received, emails received)
- Follow-up attempts on leads this week (outbound linked to estimate in `lead` status)
- Clients with overdue next_contact date (today > `clients.next_contact`)

**Issues triggers:**
- Client `next_contact` date passed with no communication logged → auto-issue assigned to sales lead
- Lead estimate with no outbound communication in > N days → auto-issue (overlaps with `lead_no_activity` rule, but communication-specific)

---

### Jobs (Module 12 — TBD)

**Auto-generated Scorecard metrics:**
- Jobs in progress this week
- Jobs completed this week
- Jobs behind schedule (scheduled end date passed, not complete)
- Revenue recognized this week (jobs completed × contract value)
- Projected revenue this week (jobs scheduled to complete)

**Issues triggers:**
- Job behind schedule
- Job with no crew assigned within X days of start date

---

### Scheduling (Module 13 — TBD)

**Auto-generated Scorecard metrics:**
- Crew utilization % (scheduled hours / available hours per crew)
- Unscheduled approved jobs count
- Days until next available scheduling slot per crew

**Issues triggers:**
- Crew under X% utilization for upcoming week
- Approved job with no scheduled date within X days of target start

---

### Expenses (Module 14 — TBD)

**Auto-generated Scorecard metrics:**
- Total expenses this week by bucket
- Materials spend vs budget per active project
- Subcontractor spend vs budget per active project
- Overhead spend this week vs weekly target

**Issues triggers:**
- Project bucket over budget by > X%
- Unreconciled transactions older than X days

---

### Timesheets (Module 15 — TBD)

**Auto-generated Scorecard metrics:**
- Total labor hours logged this week by bucket
- Billable hours vs non-billable hours
- Hours per completed job vs estimated hours
- Missing timesheets (employees with no entries for prior work day)

**Issues triggers:**
- Employee missing timesheet entry for > 1 day
- Job labor hours exceeding estimated hours by > X%

---

### Reporting (Module 16 — TBD)

EOS financial metrics surface here in addition to standard reporting:
- Revenue vs goal (weekly, monthly, quarterly)
- Gross profit % by bucket
- Labor % of revenue
- Material % of revenue

---

## EOS Data Tables

These tables are dedicated to EOS functionality. They sit alongside the business modules and pull data from them automatically where possible.

---

### eos_scorecard_metrics

Defines what gets tracked on the scorecard — some are auto-pulled from app data, some are manually entered each week.

```
eos_scorecard_metrics
  - id
  - org_id
  - name                    text — e.g. "New Leads", "Close Rate", "Revenue"
  - description             text — nullable
  - owner_id                uuid, FK → employees — who is accountable for this number
  - data_source             enum — auto, manual
  - auto_query_key          text — nullable — internal key that maps to a pre-built query
  - goal                    numeric — weekly target
  - goal_direction          enum — at_least, at_most, exactly
  - unit                    text — nullable — e.g. "$", "%", "jobs", "hrs"
  - is_active               bool
  - sort_order              int
```

**`data_source = auto`** — system pulls from app data on weekly rollup. No manual entry needed.
**`data_source = manual`** — user enters the number each week (e.g. customer satisfaction score, number of referrals asked for).

---

### eos_scorecard_entries

One row per metric per week.

```
eos_scorecard_entries
  - id
  - org_id
  - metric_id               uuid, FK → eos_scorecard_metrics
  - week_start              date — always Monday
  - value                   numeric
  - is_on_track             bool — computed: value meets goal direction
  - entered_by              uuid, FK → employees — nullable if auto
  - notes                   text — nullable
  - created_at
```

---

### eos_rocks

90-day priorities. Company-level or individual.

```
eos_rocks
  - id
  - org_id
  - title                   text
  - description             text — nullable
  - owner_id                uuid, FK → employees
  - quarter                 text — e.g. "Q1 2026" (YYYY-Qn format)
  - status                  enum — on_track, off_track, done, dropped
  - is_company_rock         bool — company-level vs individual
  - created_at, updated_at
```

---

### eos_todos

7-day action items — created during or outside of L10 meetings. Different from tasks: todos are short-lived, single-owner, 7-day commitment items.

```
eos_todos
  - id
  - org_id
  - title                   text
  - owner_id                uuid, FK → employees
  - due_date                date — typically 7 days from L10 meeting
  - status                  enum — open, done, dropped
  - created_in_meeting_id   uuid, FK → eos_meetings, nullable
  - created_at, updated_at
```

---

### eos_issues

Parking lot for anything that needs to be Identified, Discussed, Solved (IDS). Can be linked to any entity in the app.

```
eos_issues
  - id
  - org_id
  - title                   text
  - description             text — nullable
  - owner_id                uuid, FK → employees — who brought it up / is driving resolution
  - priority                enum — low, medium, high
  - status                  enum — open, in_progress, solved, dropped
  - entity_type             text — nullable — e.g. "estimate", "job", "employee"
  - entity_id               uuid — nullable — FK to relevant record
  - resolved_in_meeting_id  uuid, FK → eos_meetings, nullable
  - created_at, updated_at
```

---

### eos_meetings

L10 meeting log. Tracks what was covered, todos created, issues resolved.

```
eos_meetings
  - id
  - org_id
  - meeting_date            date
  - facilitator_id          uuid, FK → employees
  - started_at              timestamp — nullable
  - ended_at                timestamp — nullable
  - rating                  int — nullable — 1–10 team rating at close
  - notes                   text — nullable
  - created_at
```

**L10 Agenda (system-enforced order, time-boxed):**

| Segment | Time | What happens in app |
|---|---|---|
| Segue | 5 min | Each person shares personal + business best — free text, no data needed |
| Scorecard | 5 min | Auto-pulls this week's entries, highlights off-track metrics → drops them to Issues |
| Rock Review | 5 min | Shows all rocks for the quarter — on_track / off_track update |
| Customer / Employee Headlines | 5 min | Free-text headlines — good news or bad news |
| To-Do List | 5 min | Prior week's todos reviewed — done / not done. Not done → drop to Issues |
| IDS | 60 min | Work through Issues list — identify, discuss, solve. Solved issues close out. |
| Conclude | 5 min | New todos created, cascading messages noted, meeting rated 1–10 |

---

### eos_meeting_attendees (join)

```
eos_meeting_attendees
  - meeting_id
  - employee_id
  - was_present             bool
```

---

### eos_accountability_chart

EOS Accountability Chart — seats with functions and roles. Not a hierarchy — a functional map of who owns what.

```
eos_seats
  - id
  - org_id
  - name                    text — e.g. "Visionary", "Integrator", "Sales Lead", "Ops Director"
  - description             text — nullable
  - functions               jsonb — list of key responsibilities/functions for this seat
  - employee_id             uuid, FK → employees, nullable — who sits in this seat
  - sort_order              int
  - is_active               bool
```

---

## Auto-Issue Generation Rules

The app auto-creates `eos_issues` records for common problem patterns. Each rule is org-configurable (can disable or change thresholds).

```
eos_auto_issue_rules
  - id
  - org_id
  - rule_key                text — internal identifier
  - is_enabled              bool
  - threshold_value         numeric — nullable — configurable threshold
  - description             text — what the rule checks
```

**Seeded rules:**

| Rule Key | Module | Trigger |
|---|---|---|
| lead_no_activity | Estimates | Estimate in lead status with no status change or note in > N days |
| change_order_stale | Estimates | Change order pending approval > N days |
| client_contact_overdue | Clients | client.next_contact date passed with no communication logged |
| client_incomplete | Clients | Client flagged is_incomplete |
| communication_lead_stale | Communications | Lead estimate with no outbound communication in > N days |
| employee_license_expiring | Employees | Driver's license expiring within N days |
| employee_medical_expiring | Employees | Medical card expiring within N days |
| employee_no_compensation | Employees | Employee record with no compensation entry |
| crew_no_lead | Crews | Crew with no active crew lead assigned |
| crew_unscheduled | Crews | Crew with zero scheduled jobs for upcoming week (fires Thursday) |
| equipment_registration_expiring | Fleet | Equipment registration expiring within N days |
| equipment_insurance_expiring | Fleet | Equipment insurance expiring within N days |
| equipment_inspection_due | Fleet | Annual inspection due within N days |
| equipment_maintenance_overdue | Fleet | Maintenance next_service_date passed with no new record |
| equipment_dvir_defect | Fleet | Failed DVIR with unresolved defects > 1 day |
| item_price_overdue | Catalog | Catalog item last_price_updated_at past review frequency |
| item_no_supplier | Catalog | Item used on active estimate with no supplier or cost |
| bucket_no_activity | Expense Buckets | Sub-bucket with no expenses logged in > N weeks |
| project_over_budget | Expense Buckets | Project bucket over budget by > N% |
| timesheet_missing | Timesheets | Employee no timesheet entry for prior working day |
| job_behind_schedule | Jobs | Job past scheduled end date and not complete |
| job_no_crew | Jobs | Approved job with no crew assigned within N days of start date |

---

## Weekly Automation Flow

Every Monday morning, a scheduled Supabase function runs:

1. Pull all `auto` metrics → calculate values → insert `eos_scorecard_entries` for the new week
2. Evaluate all `eos_auto_issue_rules` → create new `eos_issues` records for any triggered rules (deduped — don't re-create if open issue already exists for same entity)
3. Mark any `eos_todos` past due_date as needing review in next L10

---

## Permissions

```
eos.view           — view scorecard, rocks, todos, issues
eos.manage         — create/edit/resolve issues, manage rocks, run meetings
eos.admin          — configure scorecard metrics, auto-issue rules, accountability chart
```

**Default role mappings:**
- Owner / Executive → eos.admin
- Operations Director / Manager → eos.manage
- All others → eos.view (read-only scorecard)

---

**Document Version:** 1.0
**Last Updated:** March 4, 2026
