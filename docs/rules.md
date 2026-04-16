# Rules · Ground Control Pro

> How every agent must behave at all times. Applies to Claude, Codex, and Copilot.
> These rules are not negotiable and do not change per task.

---

## Coding Standards

- **State management:** Riverpod only — `@riverpod` annotation, never `setState`, never `ChangeNotifier`
- **After any `@riverpod` or `@freezed` change:** run `flutter pub run build_runner build --delete-conflicting-outputs`
- **Supabase calls:** only in service/data layer — never direct from widgets or providers
- **Edge Functions:** TypeScript only, never JavaScript
- **Edge Function imports:** `https://esm.sh/@supabase/supabase-js@2` — never `jsr:`
- **Edge Functions:** "Verify JWT" is disabled — always call `supabase.auth.getUser()` manually
- **Flutter → Edge Function calls:** always include `headers: {'Authorization': 'Bearer ${session.accessToken}'}`
- **Helpers:** pure functions only — no side effects, no direct DB calls
- **Models:** Freezed v3.x — `@freezed` annotation, part files
- **Navigation:** GoRouter — `context.go()` / `context.push()` / `context.pop()`
- **Async safety:** capture `GoRouter.of(context)` and `ScaffoldMessenger.of(context)` before any `await`
- **AuthException clash:** `import 'package:supabase_flutter/supabase_flutter.dart' as supa;` in all auth files
- **Org/user scoping:** always enforce — never hardcode IDs — all queries scoped to `org_id`
- **No hardcoded strings or keys:** use constants from `lib/core/constants/`
- **dart format:** run on all new or modified files

---

## Module Boundaries

- A feature's code never imports directly from another feature's internals
- Cross-feature data flows through shared providers or services only
- If a task requires reaching into another module, stop and flag to Claude
- Check `index.json` module field before any cross-feature work

---

## Agent Behavior

- Always read `docs/architecture.md` at the start of a new session before any task
- Always read the relevant spec sheet before writing any code
- Never modify more files than necessary for the task
- Ask before making any architectural decisions
- Confirm before deleting anything
- Never skip error handling to make something work quickly
- Never assume a spec — ask if unclear
- Never assume the director has given complete information — ask clarifying questions
- Fix only what is broken — do not refactor surrounding code while fixing a bug
- Do not "improve" code that isn't part of the task

---

## File & Folder Conventions

- Feature folder structure must follow `architecture.md` conventions exactly
- Naming: `[feature]_[page]_screen.dart`, `[feature]_[page]_provider.dart`
- Layout files: `[feature]_[page]_screen_mobile.dart`, `_tablet.dart`
- Helper files named by responsibility: `[feature]_calculations.dart`, `_validators.dart`, `_formatters.dart`
- Always update the spec sheet Code Map when adding, moving, or renaming functions
- Always update `architecture.md` doc tree and spec sheet index after every task — no exceptions
- Always update `index.json` after every task (status, branch)
- Always update `tasks.md` when a task is completed — remove the full entry from Active Tasks, append a one-line row to the Completed Tasks table at the bottom
- A task is not complete until `architecture.md` and `index.json` reflect the current state of the codebase

---

## Data Rules

- Every table must have `org_id` — no exceptions
- Every query must be scoped to `org_id` — no exceptions
- RLS must be enabled on every table
- Never change the Supabase schema without explicit instruction from the director
- Never modify schema to fix an app-layer problem
- Teller.io integration: raw transaction data treated as read-only — never mutate Teller data
- All financial amounts stored as `numeric` (not `float`) to avoid precision errors

---

## What Never To Do

- Never change the Supabase schema without explicit director instruction
- Never refactor surrounding code while fixing a bug — fix only what is broken
- Never change data models to fix a UI issue
- Never make structural or architectural decisions without flagging to Claude
- Never let a Copilot suggestion override spec behavior without verification
- Never commit `.env` or any file containing secrets
- Never touch the `main` branch — all work on `dev` or feature branches
- Never use `setState` or `ChangeNotifier`
- Never call Supabase directly from a widget
- Never skip `build_runner` after a `@riverpod` or `@freezed` change
- Never attempt a third fix on a failing error without escalating to Claude first
