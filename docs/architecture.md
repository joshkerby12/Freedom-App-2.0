# Architecture · Freedom App 2.0

> Every agent reads this file first at the start of every session. The doc tree, spec sheet index, and folder conventions must be kept current at all times. A task is not done until this file reflects the current state of the codebase.

---

## System Overview

**App Name:** Freedom App 2.0
**Company:** Freedom Landscapes
**Platform:** iOS + Android (Flutter/Dart) · Web (Next.js — future phase)
**State Management:** Riverpod (@riverpod annotation only)
**Navigation:** GoRouter
**Backend:** Supabase (Auth + Postgres + Storage + Edge Functions)
**Bank Integration:** Plaid (expense tracking / transaction import)
**QB Integration:** QuickBooks API (customer, payment terms, invoice sync)
**AI:** Anthropic Claude API
**Voice:** Deepgram (STT) + flutter_tts (TTS)
**Push Notifications:** Firebase Cloud Messaging (FCM)
**Supabase Project Ref:** `dhkqhctriihbdzprxqnk`
**Supabase URL:** `https://dhkqhctriihbdzprxqnk.supabase.co`
**Supabase Anon Key:** in `.env` — `SUPABASE_ANON_KEY`

**Core Principles:**
- Every table is org-scoped — `org_id` on every row, no exceptions
- RLS enforced at the database layer — never rely solely on app-layer filtering
- Supabase calls only in service/data layer — never from widgets or providers directly
- All state via Riverpod `@riverpod` — never `setState`, never `ChangeNotifier`
- Navigation via GoRouter — `context.go()` / `context.push()` / `context.pop()`
- One task at a time — Codex never modifies beyond the assigned task scope

---

## Org / User Model

Every project uses this model without exception.

```
organizations       — the tenant (one per company)
profiles            — 1:1 with auth.users, auto-created via trigger
org_members         — junction: which profiles belong to which org, with role
employees           — app-layer employee record, linked to profiles via supabase_auth_uid
```

- Every new user gets a `profiles` row via trigger on `auth.users` insert
- Employees are the operational identity — clients, estimates, jobs all reference `employees`
- `org_members` role: `owner | admin | member`
- Employee role system is separate and more granular (see data_structure.md)

---

## Navigation Flow (RouterNotifier)

```
App starts
  └── Check Supabase session
        ├── No session → /auth/login
        └── Session exists
              ├── No org → /orgs/setup
              └── Org exists → /dashboard
```

RouterNotifier listens to auth state changes and redirects automatically. GoRouter `redirect` callback handles all route guards.

---

## Known Gotchas

| Issue | Resolution |
|---|---|
| `AuthException` name clash | `import 'package:supabase_flutter/supabase_flutter.dart' as supa;` in all auth files |
| `BuildContext` across async gaps | Capture `GoRouter.of(context)` and `ScaffoldMessenger.of(context)` before any `await` |
| Edge Function import format | Always use `https://esm.sh/@supabase/supabase-js@2` — never `jsr:` |
| Edge Function JWT verification | Disabled on all Edge Functions — always call `supabase.auth.getUser()` manually |
| Supabase RLS silent failures | RLS blocks inserts/updates silently — always check RLS first on any DB write failure |
| Flutter → Edge Function auth | Always include `headers: {'Authorization': 'Bearer ${session.accessToken}'}` |
| `@riverpod` / `@freezed` changes | Always run `flutter pub run build_runner build --delete-conflicting-outputs` after any change |

---

## .env Strategy

**Approach:** `flutter_dotenv`

- Load `.env` at app startup in `main.dart`: `await dotenv.load(fileName: ".env")`
- Access values via `dotenv.env['KEY_NAME']`
- `.env` is in `.gitignore` — never commit it
- `.env.example` is committed — contains all keys with placeholder values
- All keys accessed through constants in `lib/core/constants/app_constants.dart`

---

## Doc Tree

```
docs/
├── architecture.md         ← you are here — read first every session
├── master_plan.md          ← 10,000 ft view: what the app is and why
├── implementation_plan.md  ← ordered build roadmap, phase by phase
├── design_guidelines.md    ← UI/UX rules, fonts, colors, spacing, do/don't
├── rules.md                ← how all agents must always behave
├── agents.md               ← who does what, handoff rules, escalation
├── errors.md               ← error log + triage process
├── tasks.md                ← active task queue
├── data_structure.md       ← full Supabase schema and RLS patterns
└── log.md                  ← session memory log, Claude-authored

specs/
├── _spec_template.md       ← copy this when creating a new spec
└── [feature]_spec.md       ← one per feature, added as features are designed

index.json                  ← structured task/spec/table/module index — Claude maintains, Codex reads first
```

---

## Spec Sheet Index

_Updated as specs are created. One line per spec — read this before deciding which spec to pull._

| Spec | Module | Phase | Description |
|---|---|---|---|
| `specs/auth_spec.md` | auth, orgs | 1 | Auth flow, org creation, RouterNotifier, app shell, seed data |

---

## Folder Conventions

```
lib/features/[feature]/
├── helpers/       — pure functions: calculations, validators, formatters, mappers
├── widgets/       — reusable UI components for this feature
├── models/        — data models specific to this feature
├── layouts/
│   ├── mobile/    — mobile UI screens
│   ├── tablet/    — tablet UI screens
│   └── web/       — web UI screens (future — Next.js owns web, but placeholder here)
├── [feature]_[page]_screen.dart     — layout router (entry point)
└── [feature]_[page]_provider.dart   — Riverpod state (shared across all layouts)
```

**Naming conventions:**
- Layout router: `[feature]_[page]_screen.dart`
- Provider: `[feature]_[page]_provider.dart`
- Mobile layout: `[feature]_[page]_screen_mobile.dart`
- Tablet layout: `[feature]_[page]_screen_tablet.dart`
- Helpers named by responsibility: `[feature]_calculations.dart`, `_validators.dart`, `_formatters.dart`

---

## Module Registry

_Updated as modules are added. One row per module — must match `index.json`._

| Module | Status | Spec | Tables | Phase |
|---|---|---|---|---|
| scaffold | in-progress | — | — | 0 |
| auth | not started | specs/auth_spec.md | organizations, profiles, org_members, org_settings | 1 |
| orgs | not started | specs/auth_spec.md | organizations, org_members, org_settings | 1 |
| employees | not started | specs/employees_spec.md | roles, role_permissions, employees, employee_permission_overrides, employee_compensation, employee_invites, employee_preferences, custom_field_definitions, custom_field_values | 2 |
| clients | not started | specs/clients_spec.md | clients, client_addresses, client_contacts, client_tags, client_types, tags, referral_funnels, referral_sources, payment_terms, notes, note_attachments, tasks, task_followers, communications, communication_attachments | 3 |
| crews | not started | specs/fleet_spec.md | crews | 4 |
| fleet | not started | specs/fleet_spec.md | equipment, equipment_assignments, equipment_schedule, equipment_requests, equipment_maintenance, vehicle_inspections | 4 |
| item_catalog | not started | specs/catalog_spec.md | catalog_items, catalog_item_specs, suppliers, supplier_locations, catalog_item_suppliers, partners | 5 |
| product_catalog | not started | specs/catalog_spec.md | material_configurations, material_configuration_roles, product_catalog, product_catalog_inputs, product_catalog_components | 5 |
| estimates | not started | — | — | 6 |
| jobs | not started | — | — | 7 |
| scheduling | not started | — | — | 7 |
| expense_buckets | not started | — | expense_buckets, expense_splits | 8 |
| expenses_plaid | not started | — | — | 8 |
| timesheets | not started | — | — | 8 |
| eos | not started | — | — | 9 |
| reporting | not started | — | — | 10 |
| ai | not started | — | — | 11 |
| voice | not started | — | — | 11 |
| push_notifications | not started | — | — | 7 |
| settings | not started | — | — | TBD |

---

## What's Working

_Nothing yet — project scaffold in progress._

---

## What Still Needs Building

_Everything. See implementation_plan.md for phase breakdown._

---

## Pre-Launch Dependencies

These items are not blocking scaffold but must be completed before launch:

| Item | Owner | Notes |
|---|---|---|
| Supabase project creation | Director | ✅ Done — `dhkqhctriihbdzprxqnk` |
| `supabase login && supabase link` | Director + Claude | ✅ Done — linked 2026-03-25 |
| Remote git repository | Director | ✅ Done — https://github.com/joshkerby12/Freedom-App-2.0.git |
| Apple Developer account | Director | Required for iOS App Store / TestFlight |
| Google Play Console account | Director | Required for Android distribution |
| Firebase project + FCM setup | Director + Claude | Create Firebase project, add `google-services.json` and `GoogleService-Info.plist` before any notification work |
| Email confirmation | Director | Disable in Supabase Auth settings for dev. **Re-enable before production launch.** |
| Plaid account + API keys | Director | Sign up at plaid.com, obtain client_id and secret |
| Anthropic API key | Director | Obtain from console.anthropic.com |
| Deepgram API key | Director | Obtain from deepgram.com |
