# Freedom App 2.0

Full business management platform for Freedom Landscapes — replacing a legacy AppSheet build.

---

## Overview

| Field | Value |
|---|---|
| Company | Freedom Landscapes |
| Platform | iOS + Android (Flutter/Dart) · Web (Next.js — future phase) |
| Backend | Supabase (Auth + Postgres + Storage + Edge Functions) |
| State Management | Riverpod |
| Navigation | GoRouter |
| Bank Integration | Plaid |
| QB Integration | QuickBooks API |
| AI | Anthropic Claude |
| Voice | Deepgram STT + flutter_tts |
| Push Notifications | Firebase Cloud Messaging (FCM) |
| .env Strategy | flutter_dotenv |

---

## What It Does

Covers the full business lifecycle for a landscape company:

- **Clients** — residential and commercial client management, communication log, referral tracking
- **Estimates** — formula-driven estimate builder, product catalog, change orders, e-signature, QB sync
- **Jobs** — job tracking, crew assignment, equipment scheduling, supplier run list
- **Employees** — role-based permissions, compensation history, DOT compliance
- **Equipment & Fleet** — maintenance tracking, DVIR, expiry alerts, scheduling
- **Item & Product Catalog** — materials, suppliers, formula-based quantity calculations
- **Expense Buckets** — cost allocation; Plaid bank transaction import
- **EOS / Traction** — Scorecard, Rocks, Issues, To-Dos, L10 Meetings, Accountability Chart
- **Reporting** — revenue, pipeline, labor %, crew utilization

---

## Org / User Model

Every record in every table is scoped to an `org_id`. RLS is enforced at the Supabase level. The model:

```
organizations  →  org_members  →  profiles  →  auth.users
                                      ↓
                                  employees  (operational identity)
```

---

## Folder Structure

```
lib/
  core/
    constants/       — app_constants.dart, supabase_constants.dart
    errors/          — failures.dart, exceptions.dart
    extensions/      — context_extensions.dart, datetime_extensions.dart
    network/         — supabase_client_provider.dart
    routing/         — app_router.dart, app_routes.dart, router_notifier.dart
    storage/         — secure_storage_provider.dart
    theme/           — app_theme.dart, app_colors.dart, app_text_styles.dart
    widgets/         — loading_overlay.dart, error_view.dart
  features/
    auth/
    orgs/
    clients/
    estimates/
    employees/
    crews/
    fleet/
    catalog/
    products/
    expenses/
    jobs/
    scheduling/
    timesheets/
    reports/
    eos/
    settings/
    ai/
    voice/
  main.dart
  app.dart

docs/              — all architecture and planning docs
specs/             — one spec per feature
assets/
  images/
  fonts/
  prompts/         — AI system prompt .txt files
```

---

## Dev Setup

1. Copy `.env.example` to `.env` and fill in all values
2. `flutter pub get`
3. `flutter pub run build_runner build --delete-conflicting-outputs`
4. `supabase login && supabase link --project-ref <ref>`
5. `flutter run`

---

## Key Docs

| Doc | Purpose |
|---|---|
| [docs/architecture.md](docs/architecture.md) | Root of the doc tree — read first every session |
| [docs/master_plan.md](docs/master_plan.md) | What the app is and why |
| [docs/implementation_plan.md](docs/implementation_plan.md) | Ordered build phases |
| [docs/design_guidelines.md](docs/design_guidelines.md) | UI/UX rules |
| [docs/rules.md](docs/rules.md) | Agent behavior rules |
| [docs/data_structure.md](docs/data_structure.md) | Full Supabase schema |
| [docs/tasks.md](docs/tasks.md) | Active task queue |
| [CODEX.md](CODEX.md) | Codex operator manual |

---

## Branch Strategy

- `main` — production-ready only. Never touch directly.
- `dev` — integration branch. All feature branches PR here.
- Feature branches: `feature/[task-id]-[short-description]`

---

**Status:** Planning complete · Phase 0 scaffold in progress
