# Errors · Ground Control Pro

> Error triage process and error log. When told to reference `errors.md`, follow the full triage process before attempting any fix.

---

## Error Handling Philosophy

- Never silently swallow errors — always surface to user or log
- Supabase errors get logged before throwing
- Show user-friendly messages, log technical details separately
- Fix the root cause, not the symptom
- Do not refactor surrounding code while fixing a bug
- Do not update `tasks.md` until the fix is confirmed working

---

## Triage Process

When an error is reported, assume the reporter has missed information. Do not assume you have the full picture. Work through every step in order.

### Step 1 — Clarify Before Touching Anything

Ask every question needed to fully understand the problem. Do not assume. Do not guess.

Ask:
- What exactly is the error message or behavior? (exact text, screenshot if possible)
- What were you doing when it happened? (which screen, which action)
- Does it happen every time or only sometimes?
- Did it ever work before? If yes, what changed?
- Which platform / device is this on?
- Is there anything in the Flutter console or Supabase logs?

Do not proceed to Step 2 until you can state the problem precisely in one sentence.

### Step 2 — Map the Problem Using Docs

Read the following in order before touching any code:

1. `docs/architecture.md` — identify which feature area is involved and locate the relevant spec
2. `index.json` — confirm module, spec file, and relevant tables
3. `specs/[feature]_spec.md` → Code Map section — find the exact file and function responsible
4. `docs/data_structure.md` — if the error involves data, check schema and RLS policies
5. `docs/errors.md` — check prior error log entries for related issues and past resolutions
6. Read the actual code at the location identified by the spec Code Map — confirm root cause before proposing any fix

State your diagnosis clearly before writing a single line of code.

### Step 3 — Attempt Fix

Fix only what is broken. Do not touch surrounding code. Do not refactor. Do not "improve" while in there.

After the fix: confirm it works. If confirmed, update `tasks.md` and log resolution in the error entry below.

### Step 4 — If Step 3 Fails: Add Logging

If the fix did not work:
- Add `debugPrint()` statements at key points in the relevant Dart code
- Check Flutter debug console output
- Check Supabase dashboard logs (Auth logs, Edge Function logs, Database logs)
- Check Supabase RLS policies — silent insert/update failures are almost always RLS
- Report what the logs reveal before attempting another fix

### Step 5 — If Step 4 Still Fails: Update Docs and Escalate

If after two fix attempts the problem is unresolved:
- Log full details in the error entry below (what was tried, what logs showed)
- If the issue reveals a gap in a spec or a rule that needs adding, update the relevant doc
- Stop and escalate to Claude (if Codex) or to the director (if Claude)

---

## Error Type Routing

| Error Type | First Stop | Second Stop |
|---|---|---|
| Math / calculation wrong | `helpers/[feature]_calculations.dart` | spec Code Map |
| Validation not working | `helpers/[feature]_validators.dart` | spec validation rules |
| UI displaying wrong data | relevant `_provider.dart` | spec page state |
| Supabase insert/update failing | RLS policies first | `supabase_service.dart` |
| Auth error | `auth_service.dart` | Supabase Auth logs |
| Edge function error | Supabase Edge Function logs | edge function code |
| State not updating | relevant `_provider.dart` | spec page state |
| Layout broken on specific device | relevant layout file | spec layouts section |
| Plaid integration error | Plaid dashboard logs | `plaid_service.dart` |

---

## What Not To Do During Error Resolution

- Do not change data models to fix a UI bug
- Do not modify schema to fix an app-layer problem
- Do not update `tasks.md` until fix is confirmed working
- Do not touch layout files to fix logic bugs (fix helpers instead)
- Do not attempt a third fix without escalating first

---

## Error Log

Entry format:
```
### ERR-001 · [short description]
- **Date:**
- **Status:** Blocked / Resolved
- **Feature area:**
- **Module:** (from index.json)
- **What was reported:**
- **Clarifying questions asked / answers received:**
- **Root cause:**
- **What was tried:**
- **Resolution:**
- **Docs updated as result:** (spec, rules, architecture, index.json — list any that were changed)
```

### ERR-001 · iOS simulator launch blocked by deployment target + pre-scaffold app wiring
- **Date:** 2026-03-09
- **Status:** Resolved
- **Feature area:** Scaffold / iOS build setup
- **What was reported:** `flutter run` on iOS simulator failed during `pod install` because `firebase_core` required a higher minimum deployment target; after that, compile failed because preexisting `lib/main.dart` referenced unfinished app wiring.
- **Clarifying questions asked / answers received:** N/A (setup task execution)
- **Root cause:** `ios/Podfile` default platform was too low (`13.0`) for current Firebase iOS pods, and the existing `main.dart` imported project files that were not yet compile-ready for this phase.
- **What was tried:** Set `platform :ios, '15.0'` in Podfile, reran iOS launch, then replaced `lib/main.dart` with a minimal blank-screen app entrypoint and reran `flutter run`.
- **Resolution:** iOS simulator build and launch succeeded with the scaffold blank screen.
- **Docs updated as result:** `docs/tasks.md`

### ERR-002 · Phase 5 blocked by unresolved dependency and missing spec
- **Date:** 2026-03-25
- **Status:** Resolved
- **Feature area:** Item catalog / product catalog phase execution
- **Module:** item_catalog, product_catalog
- **What was reported:** Run `@CODEX.md phase 5`.
- **Clarifying questions asked / answers received:** N/A (direct phase invocation)
- **Root cause:** Initial preflight failed because upstream dependency state and spec availability were out of sync with the phase invocation requirements.
- **What was tried:** Re-ran phase preflight after dependency/state updates, then executed TASK-024 through TASK-028 (migrations, services/providers, UI flows, router wiring), regenerated Riverpod/Freezed code, and fixed analyzer errors.
- **Resolution:** Phase 5 implementation completed and task statuses moved to `needs-review`.
- **Docs updated as result:** `docs/tasks.md`, `index.json`, `docs/log.md`, `docs/errors.md`

### ERR-003 · Supabase db push failed during Phase 1 migration apply
- **Date:** 2026-03-25
- **Status:** Blocked
- **Feature area:** Auth schema migration deployment
- **Module:** auth
- **What was reported:** `supabase db push` failed while applying Phase 1 migration.
- **Clarifying questions asked / answers received:** N/A (execution task)
- **Root cause:** Supabase CLI login role authentication failed for remote Postgres user `cli_login_postgres` (`SQLSTATE 28P01`), so migration could not be applied to the remote database from this environment.
- **What was tried:** Ran `supabase migration list` (migration detected locally), then ran `supabase db push`; command failed with password authentication error.
- **Resolution:** Code/migration implementation completed locally; remote migration apply is pending credential fix or re-link by director.
- **Docs updated as result:** `docs/errors.md`

### ERR-004 · TASK-036W invite function deploy blocked by missing Supabase access token
- **Date:** 2026-03-26
- **Status:** Blocked
- **Feature area:** Employees web invite flow
- **Module:** employees_web
- **What was reported:** `@CODEX.md phase 7` execution required deploying `send-employee-invite` with `supabase functions deploy send-employee-invite`.
- **Clarifying questions asked / answers received:** N/A (direct phase execution in this environment)
- **Root cause:** Supabase CLI is not authenticated in this workspace. Deploy command failed with: `Access token not provided`.
- **What was tried:** Confirmed function exists at `supabase/functions/send-employee-invite/index.ts`, then ran deploy command; checked `.env` for `SUPABASE_ACCESS_TOKEN` (not present).
- **Resolution:** TASK-036W remains blocked until Supabase CLI auth is provided (`supabase login` or `SUPABASE_ACCESS_TOKEN` env var) and deploy is rerun.
- **Docs updated as result:** `docs/errors.md`, `docs/tasks.md`, `index.json`
