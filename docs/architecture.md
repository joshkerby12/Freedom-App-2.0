# Architecture · Freedom App 2.0

> Every agent reads this file first at the start of every session. The doc tree, spec sheet index, and folder conventions must be kept current at all times. A task is not done until this file reflects the current state of the codebase.

---

## System Overview

**App Name:** Freedom App 2.0
**Company:** Freedom Landscapes
**Platform:** iOS + Android (Flutter/Dart) · Web (Next.js — `web/` subfolder, active)
**State Management:** Riverpod (@riverpod annotation only) — Flutter only
**Navigation:** GoRouter (Flutter) · Next.js App Router (web)
**Backend:** Supabase (Auth + Postgres + Storage + Edge Functions)
**Bank Integration:** Plaid (expense tracking / transaction import)
**QB Integration:** QuickBooks API (customer, payment terms, invoice sync)
**AI:** Anthropic Claude API
**Voice:** Deepgram (STT) + flutter_tts (TTS)
**Push Notifications:** Firebase Cloud Messaging (FCM)
**Supabase Project Ref:** `dhkqhctriihbdzprxqnk`
**Supabase URL:** `https://dhkqhctriihbdzprxqnk.supabase.co`
**Supabase Anon Key:** in `.env` — `SUPABASE_ANON_KEY`

**Build Track Convention:**
- Phases 0–999: Shared (schema + services) + Web (Next.js UI)
- Phases 1000–1999: Mobile (Flutter UI)
- Web is built first. Mobile phases are placeholders until director signs off on web and confirms mobile direction.
- Next.js auth: `@supabase/ssr` (App Router) — sessions via HTTP-only cookies, same Supabase project as Flutter.

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
| Next.js `"use server"` non-async exports | `"use server"` files may only export async functions — never export types, constants, or plain objects. Move types + initial state to a sibling `*-types.ts` file (no `"use server"` directive) and import from there |

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
| `specs/employees_spec.md` | employees | 2 | Employees, roles, permissions system — CRUD, invite flow, permission resolution |
| `specs/clients_spec.md` | clients | 4 | Clients, addresses, contacts, lookup tables, communications log |
| `specs/fleet_spec.md` | fleet | 5 | Crews, equipment, fleet management — scheduling, maintenance, DVIR, expiry alerts |
| `specs/catalog_spec.md` | item_catalog, product_catalog | 6 | Item catalog, suppliers, partners, material configurations, product catalog, formula engine |

---

## Folder Conventions

### Flutter (`lib/`)

```
lib/features/[feature]/
├── helpers/       — pure functions: calculations, validators, formatters, mappers
├── widgets/       — reusable UI components for this feature
├── models/        — data models specific to this feature
├── layouts/
│   ├── mobile/    — mobile UI screens
│   └── tablet/    — tablet UI screens
├── [feature]_[page]_screen.dart     — layout router (entry point)
└── [feature]_[page]_provider.dart   — Riverpod state (shared across all layouts)
```

### Next.js (`web/`)

```
web/
├── app/
│   ├── (auth)/        — login, sign-up, password reset
│   ├── (app)/         — authenticated shell
│   │   ├── dashboard/
│   │   ├── clients/
│   │   ├── employees/
│   │   └── [feature]/
│   └── layout.tsx
├── components/
│   ├── ui/            — base design system components
│   └── [feature]/     — feature-specific components
├── lib/
│   ├── supabase/      — client + server Supabase helpers (@supabase/ssr)
│   └── [feature]/     — service layer (mirrors Flutter services)
└── middleware.ts       — route protection
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
_Track: S = Shared, W = Web (Next.js), M = Mobile (Flutter)_

| Module | Track | Status | Spec | Phase |
|---|---|---|---|---|
| scaffold | S | complete | — | 0 |
| auth | S+M | complete (Flutter) · web pending | specs/auth_spec.md | 1 / 3 |
| orgs | S+M | complete (Flutter) · web pending | specs/auth_spec.md | 1 / 3 |
| employees | S+M | complete (Flutter) · web pending | specs/employees_spec.md | 2 / 7 |
| next_js_scaffold | W | complete | — | 3 |
| clients | S+W | complete (web) · mobile pending | specs/clients_spec.md | 4 |
| clients_mobile | M | placeholder | specs/clients_spec.md | 1001 |
| crews | S+W | complete (web) · mobile pending | specs/fleet_spec.md | 5 |
| fleet | S+W | complete (web) · mobile pending | specs/fleet_spec.md | 5 |
| crews_mobile | M | placeholder | specs/fleet_spec.md | 1002 |
| fleet_mobile | M | placeholder | specs/fleet_spec.md | 1002 |
| item_catalog | S+M | complete (Flutter) · web pending | specs/catalog_spec.md | 6 |
| product_catalog | S+M | complete (Flutter) · web pending | specs/catalog_spec.md | 6 |
| catalog_web | W | complete | specs/catalog_spec.md | 6 |
| catalog_mobile | M | placeholder | specs/catalog_spec.md | 1003 |
| employees_web | W | complete (Edge Function deploy pending) | specs/employees_spec.md | 7 |
| employees_mobile | M | placeholder | specs/employees_spec.md | 1004 |
| estimates | S+W | not started | — | 8 |
| estimates_mobile | M | placeholder | — | 1005 |
| jobs | S+W | not started | — | 9 |
| scheduling | S+W | not started | — | 9 |
| jobs_mobile | M | placeholder | — | 1006 |
| expense_buckets | S+W | not started | — | 10 |
| expenses_plaid | S+W | not started | — | 10 |
| timesheets | S+W | not started | — | 10 |
| expenses_mobile | M | placeholder | — | 1007 |
| eos | S+W | not started | — | 11 |
| eos_mobile | M | placeholder | — | 1008 |
| reporting | W | not started | — | 12 |
| reporting_mobile | M | placeholder | — | 1009 |
| ai | S | not started | — | 13 |
| voice | M | not started | — | 13 |
| push_notifications | S | not started | — | 9 |
| client_portal | W | not started | — | 14 |
| settings | S | not started | — | TBD |

---

## What's Working

- Flutter app boots, auth flow, org creation, RouterNotifier guards
- Employee CRUD, roles, permissions, invite flow (Flutter mobile)
- Item catalog, supplier management, partner management, material configurations, and product catalog + formula engine (Flutter mobile + web)
- Supabase schema: all tables through Phase 2 + catalog (Phase 5) + clients (Phase 4) + fleet (Phase 5) live and RLS-enabled
- Next.js `web/` scaffold: @supabase/ssr auth, middleware route guards, design system (Montserrat + brand tokens), app shell, login/sign-up pages (Phase 3 complete)
- Phase 4 clients web: service (list, detail, save, communications), list/detail/create/edit, communications log — complete (TASK-015–018W)
- Phase 5 fleet web flows: crews (list/detail/create/edit) + equipment (list/detail/create/edit, maintenance log, DVIR) — complete (TASK-020W/021W/022W/023W)
- Phase 6 catalog web flows: items (list/detail/create/edit + price review), suppliers, partners, material configurations, and product catalog builder — complete (TASK-029W/030W/031W/032W/033W)

---

## What Still Needs Building

- All mobile phases — placeholders, pending director sign-off on web versions
- See `docs/implementation_plan.md` for full phase breakdown

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
