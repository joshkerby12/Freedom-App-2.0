# Auth + Orgs Spec · Freedom App 2.0

> Covers: TASK-003, TASK-004, TASK-005, TASK-006, TASK-007
> Phase 1 — prerequisite for every other module.

---

## Overview

Auth + Orgs is the identity and tenancy foundation of the entire app. It handles Supabase authentication (sign up, sign in, sign out, password reset), automatic profile creation, org creation with seed data, and the RouterNotifier that enforces session and org guards on all routes. The app shell (bottom nav + placeholder screens) is also scoped here as the first thing a successfully authenticated and org-enrolled user lands on.

Every downstream module depends on a valid session, a resolved `org_id`, and a seeded set of roles, estimate types, payment terms, and expense buckets.

---

## Scope

**Included:**
- Supabase schema: `organizations`, `profiles`, `org_members`, `org_settings`
- Auto-create-profile trigger on `auth.users` insert
- Reusable `updated_at` trigger function (applied to all tables with `updated_at`)
- RLS policies on all four tables
- AuthService and AuthNotifier (session state)
- Sign up screen (email, password, full name)
- Sign in screen (email, password)
- Password reset screen (email input → confirmation)
- Sign out (from menu/profile, clears session)
- OrgService and OrgNotifier (current org state)
- Org setup screen (company name → creates org + org_settings + org_members + triggers seed)
- Seed data Edge Function: `seed-org-data` (roles, role_permissions, payment_terms, estimate_types, expense_buckets)
- RouterNotifier: session guard, org guard, full redirect logic
- App shell: bottom nav, shell route, placeholder screens, full named route table

**Explicitly out of scope:**
- Employee records — handled in Phase 2 (employees_spec.md)
- Org settings UI (editing company info, branding, labor rates) — Phase 2+
- Email confirmation (disabled in dev; re-enable before production)
- Social/OAuth sign in — not in scope for v1
- Multi-org support (a user belonging to multiple orgs) — not in scope for v1
- Client portal auth — Phase 12

---

## User Stories

- As a new user, I can sign up with my email and password so that an account and profile are created automatically
- As a new user, I can create my company org so that I am enrolled as the owner and seed data is populated
- As a returning user, I can sign in and be taken directly to the dashboard if my org exists
- As any user, I can reset my password by entering my email so that I receive a reset link
- As any authenticated user, I can sign out so that my session is cleared and I am returned to sign in
- As a user who has signed up but not created an org, I am automatically redirected to org setup
- As an unauthenticated user, I cannot access any protected route

---

## Org / User Context

- **Data scoping:** `profiles` — no org_id (user-level). `org_members`, `org_settings` — scoped to `org_id`. `organizations` — no org_id (is the tenant root).
- **Role access:**
  - `profiles`: owner = the authenticated user themselves
  - `org_members`: read by any org member; write by owner only (on creation)
  - `org_settings`: read by any org member; write by owner/admin
  - `organizations`: read by any org member; write by owner only
- **Permission keys:** N/A — auth and org setup is pre-permission-system. Permissions are seeded as part of this phase and enforced from Phase 2 onward.

---

## RouterNotifier Logic

```
On app start / auth state change:
  → No session                      → redirect to /auth/sign-in
  → Session exists, no org          → redirect to /orgs/setup
  → Session exists, org exists      → redirect to /dashboard (or last route)

Protected routes (require session + org):
  /dashboard, /clients, /estimates, /schedule, /menu, and all sub-routes

Unprotected routes:
  /auth/sign-in
  /auth/sign-up
  /auth/reset-password
  /orgs/setup
```

`RouterNotifier` is a `@riverpod` notifier that listens to `AuthNotifier` state changes and triggers GoRouter redirects. GoRouter `redirect` callback calls `RouterNotifier.redirect(state)` on every navigation attempt.

---

## Page States

| State | Description |
|---|---|
| Loading | Auth state resolving — show full-screen loading indicator (not shimmer) |
| Unauthenticated | No session — show sign in screen |
| Authenticated, no org | Session exists, `org_members` empty — show org setup |
| Authenticated, org exists | Session + org valid — show app shell + bottom nav |
| Error | Auth call failed — show inline error message on form |
| Submitting | Form submitted, awaiting response — disable button, show loading indicator |

---

## UI Behavior

### Sign Up Screen (`/auth/sign-up`)

**Fields:**
- Full Name (text, required)
- Email (text, required, email format)
- Password (obscured, required, min 8 characters)
- Confirm Password (obscured, required, must match)

**Loaded state:**
- Form with all fields, "Create Account" primary button, "Sign In" text link below

**Interactions:**
- Tapping "Create Account" → validate form → call `AuthService.signUp()` → on success RouterNotifier redirects
- Tapping "Sign In" → navigate to `/auth/sign-in`

**Validation rules:**
- Full name: required
- Email: required, valid email format
- Password: required, minimum 8 characters
- Confirm password: must match password

**Edge cases:**
- Email already registered → show "An account with this email already exists"
- Network failure → show "Could not connect. Check your connection and try again"
- Never expose raw Supabase error strings to the user

---

### Sign In Screen (`/auth/sign-in`)

**Fields:**
- Email (text, required)
- Password (obscured, required)

**Loaded state:**
- Form with email + password fields, "Sign In" primary button, "Forgot Password?" text link, "Create Account" text link below

**Interactions:**
- Tapping "Sign In" → validate → call `AuthService.signIn()` → on success RouterNotifier handles redirect
- Tapping "Forgot Password?" → navigate to `/auth/reset-password`
- Tapping "Create Account" → navigate to `/auth/sign-up`

**Validation rules:**
- Email: required
- Password: required

**Edge cases:**
- Invalid credentials → show "Email or password is incorrect"
- Unverified email (if email confirmation re-enabled) → show "Please verify your email before signing in"

---

### Password Reset Screen (`/auth/reset-password`)

**Fields:**
- Email (text, required)

**States:**
- Input state: email field + "Send Reset Link" button
- Sent state: confirmation message ("Check your email for a reset link"), "Back to Sign In" link

**Interactions:**
- Tapping "Send Reset Link" → call `AuthService.resetPassword(email)` → show sent state regardless of whether email exists (security best practice)

---

### Org Setup Screen (`/orgs/setup`)

**Fields:**
- Company Name (text, required)

**Loaded state:**
- Single input field for company name, "Create My Company" primary button, brief explanation copy: "Set up your company to get started"

**Interactions:**
- Tapping "Create My Company" → validate → call `OrgService.createOrg(name)` → on success RouterNotifier redirects to `/dashboard`

**Validation rules:**
- Company name: required, max 100 characters

**Edge cases:**
- If org creation succeeds but seed function fails → org still exists; log error in `errors.md` pattern; do not show failure to user — seed can be re-triggered manually if needed
- User cannot navigate back from org setup while session exists and no org is present (RouterNotifier will re-redirect)

---

### App Shell

**Loaded state:**
- `NavigationBar` (Material 3) at bottom with 5 destinations:
  - Dashboard (icon: `home_outlined` / `home` when active)
  - Clients (icon: `people_outlined` / `people` when active)
  - Estimates (icon: `description_outlined` / `description` when active)
  - Schedule (icon: `calendar_today_outlined` / `calendar_today` when active)
  - Menu (icon: `menu`)
- Content area above nav bar — loads current route's screen
- Each destination shows a placeholder screen until the relevant phase is complete

**Placeholder screen structure:**
- Centered text with the module name and "Coming soon" — no further functionality

**Edge cases:**
- Back button on Android must not navigate outside the shell to auth screens while session is valid

---

## Layouts

- **Mobile** — full-screen form layouts for auth screens. Centered card layout not required — full-bleed form with padding is fine. App shell uses bottom `NavigationBar`.
- **Tablet** — same screens, wider content max-width (480px centered). App shell may use `NavigationRail` on tablet in a later pass — placeholder bottom nav is acceptable for Phase 1.

---

## Seed Data — `seed-org-data` Edge Function

Called by `OrgService.createOrg()` immediately after org + org_members + org_settings rows are inserted. Receives `org_id` as payload.

### Roles seeded (10 system roles, `is_system = true`)

| sort_order | name |
|---|---|
| 10 | Owner |
| 20 | Executive |
| 30 | Operations Director |
| 40 | Manager |
| 50 | Sales / Estimator |
| 60 | Marketing |
| 70 | Crew Lead / PM |
| 80 | Fleet Manager |
| 90 | Driver |
| 100 | Field |

### role_permissions seeded

Full permission matrix. All keys granted (`granted = true`) per role as shown:

| Permission Key | Owner | Executive | Ops Dir | Manager | Sales/Est | Marketing | Crew Lead | Fleet Mgr | Driver | Field |
|---|---|---|---|---|---|---|---|---|---|---|
| clients.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| clients.create | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — |
| clients.edit | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — |
| clients.delete | ✓ | ✓ | ✓ | — | — | — | — | — | — | — |
| estimates.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — |
| estimates.create | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — |
| estimates.edit | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — |
| estimates.delete | ✓ | ✓ | ✓ | — | — | — | — | — | — | — |
| jobs.view | ✓ | ✓ | ✓ | ✓ | ✓ | — | ✓ | — | ✓ | ✓ |
| jobs.create | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| jobs.edit | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | — | — | — |
| jobs.delete | ✓ | ✓ | ✓ | — | — | — | — | — | — | — |
| catalog.view | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — |
| catalog.manage | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| employees.view | ✓ | ✓ | ✓ | ✓ | — | — | — | — | — | — |
| employees.manage | ✓ | ✓ | ✓ | — | — | — | — | — | — | — |
| compensation.view | ✓ | ✓ | — | — | — | — | — | — | — | — |
| settings.manage | ✓ | ✓ | — | — | — | — | — | — | — | — |
| financials.view | ✓ | ✓ | ✓ | — | — | — | — | — | — | — |
| scheduling.view | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | — | ✓ | ✓ |
| scheduling.manage | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | — | — | — |
| fleet.view | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | — |
| fleet.manage | ✓ | ✓ | ✓ | — | — | — | — | ✓ | — | — |
| equipment.view | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | ✓ | — |
| equipment.schedule | ✓ | ✓ | ✓ | ✓ | — | — | ✓ | ✓ | — | — |
| equipment.approve | ✓ | ✓ | ✓ | — | — | — | — | ✓ | — | — |
| reports.view | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | — | — | — | — |

### payment_terms seeded (5 records)

| sort_order | name | days_until_due |
|---|---|---|
| 10 | Due on Receipt | 0 |
| 20 | Net 7 | 7 |
| 30 | Net 15 | 15 |
| 40 | Net 30 | 30 |
| 50 | Net 45 | 45 |

### estimate_types seeded (5 records)

| sort_order | name | prefix | next_number | requires_signature |
|---|---|---|---|---|
| 10 | Design/Build | DB | 10000 | true |
| 20 | Special Projects | SP | 20000 | false |
| 30 | Irrigation | IR | 30000 | true |
| 40 | Maintenance | MTN | 40000 | true |
| 50 | Snow | SN | 50000 | true |

### expense_buckets seeded (11 records — parent first, then children)

| name | parent | cost_model | estimate_type |
|---|---|---|---|
| Projects | — | — (parent) | — |
| → Design/Build | Projects | project | Design/Build |
| → Special Projects | Projects | project | Special Projects |
| → Irrigation Install | Projects | project | Irrigation |
| Maintenance | — | — (parent) | — |
| → Residential Maintenance | Maintenance | bucket | Maintenance |
| → Commercial Maintenance | Maintenance | bucket | Maintenance |
| Snow | — | — (parent) | — |
| → Residential Snow | Snow | bucket | Snow |
| → Commercial Snow | Snow | bucket | Snow |
| Irrigation | — | — (parent) | — |
| → Irrigation Service | Irrigation | bucket | Irrigation |
| Overhead | — | — (parent) | — |
| → Admin | Overhead | bucket | — |
| → Vehicles & Equipment | Overhead | bucket | — |
| → Payroll / Labor (non-job) | Overhead | bucket | — |

> Note: Parent buckets must be inserted before children. Edge Function must handle insert order or use a two-pass approach.

---

## Data

**Reads:**
- `auth.users` — Supabase managed; trigger reads on insert
- `profiles` — read on sign in to confirm profile exists
- `org_members` — read to determine if user belongs to an org (RouterNotifier)
- `organizations` — read to get org name for display
- `org_settings` — read for app-wide settings in future phases

**Writes:**
- `profiles` — auto-written by trigger on `auth.users` insert; user can update own later
- `organizations` — written on org creation
- `org_members` — written on org creation (owner row)
- `org_settings` — written on org creation (defaults row)
- `roles`, `role_permissions`, `payment_terms`, `estimate_types`, `expense_buckets` — written by `seed-org-data` Edge Function on org creation

**Supabase tables involved:**
- `organizations` — ref: `docs/data_structure.md#organizations`
- `profiles` — ref: `docs/data_structure.md#profiles`
- `org_members` — ref: `docs/data_structure.md#org_members`
- `org_settings` — ref: `docs/data_structure.md#org_settings`
- `roles` — seeded here, owned by employees module — ref: `docs/data_structure.md#roles`
- `role_permissions` — seeded here — ref: `docs/data_structure.md#role_permissions`
- `payment_terms` — seeded here — ref: `docs/data_structure.md#payment_terms`
- `estimate_types` — seeded here — ref: `docs/data_structure.md#estimate_types`
- `expense_buckets` — seeded here — ref: `docs/data_structure.md#expense_buckets`

---

## Edge Cases & Rules

- **`AuthException` clash:** Every file in `lib/features/auth/` that imports Supabase must use `import 'package:supabase_flutter/supabase_flutter.dart' as supa;`. Never use bare `AuthException` — always `supa.AuthException`.
- **Profile auto-creation:** The trigger handles this. `AuthService.signUp()` does NOT manually insert into `profiles`. If the trigger fails, the sign-up appears to succeed but the user will have no profile — this should be treated as a critical error and logged.
- **Org creation atomicity:** If any step of org creation fails (organizations insert, org_members insert, org_settings insert, or seed function call), the partial state should be caught and the user should be able to retry. The seed function is idempotent — safe to call multiple times for the same `org_id` (uses `INSERT ... ON CONFLICT DO NOTHING`).
- **Session persistence:** Supabase Flutter handles session persistence in secure storage automatically. No manual token management needed.
- **RouterNotifier and async:** `RouterNotifier` must handle the initial loading state before auth state is known — show a blank/loading screen, not a redirect, while Supabase session is resolving on cold start.
- **`BuildContext` across async gaps:** Capture `GoRouter.of(context)` before any `await` in auth flow callbacks.
- **Email confirmation:** Disabled in Supabase Auth settings for development. Must be re-enabled before production launch. Noted in `architecture.md` Pre-Launch Dependencies.

---

## Code Map

> Updated as code is written. Start empty — Codex fills this in during TASK-003 through TASK-007.

### Functions

_(Codex adds entries here as functions are implemented)_

### Key Files

| File | Purpose |
|---|---|
| `lib/features/auth/auth_service.dart` | Supabase Auth wrapper — signUp, signIn, signOut, resetPassword |
| `lib/features/auth/auth_notifier.dart` | Riverpod auth state — session stream |
| `lib/features/auth/layouts/mobile/sign_up_screen_mobile.dart` | Sign up form — mobile |
| `lib/features/auth/layouts/mobile/sign_in_screen_mobile.dart` | Sign in form — mobile |
| `lib/features/auth/layouts/mobile/reset_password_screen_mobile.dart` | Password reset — mobile |
| `lib/features/auth/auth_sign_up_screen.dart` | Layout router — sign up |
| `lib/features/auth/auth_sign_in_screen.dart` | Layout router — sign in |
| `lib/features/auth/auth_reset_password_screen.dart` | Layout router — reset password |
| `lib/features/orgs/org_service.dart` | Org creation, org_settings defaults, seed call |
| `lib/features/orgs/org_notifier.dart` | Riverpod current org state |
| `lib/features/orgs/layouts/mobile/org_setup_screen_mobile.dart` | Org setup form — mobile |
| `lib/features/orgs/org_setup_screen.dart` | Layout router — org setup |
| `lib/core/routing/router_notifier.dart` | GoRouter redirect logic — session + org guards |
| `lib/core/routing/app_router.dart` | Full GoRouter configuration |
| `lib/core/routing/app_routes.dart` | Named route constants |
| `lib/app.dart` | MaterialApp.router + GoRouter provider |
| `lib/main.dart` | App entry point — dotenv load, Supabase init |
| `supabase/functions/seed-org-data/index.ts` | Edge Function — seeds all org creation data |
| `supabase/migrations/[timestamp]_core_auth.sql` | organizations, profiles, org_members, org_settings, triggers, RLS |
