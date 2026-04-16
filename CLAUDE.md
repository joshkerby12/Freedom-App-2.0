# CLAUDE.md · Ground Control Pro

> **On invocation:** Read the following in order before responding:
> 1. `docs/architecture.md` — project map and current state
> 2. `index.json` — active tasks, modules, specs, and table index
> 3. `docs/tasks.md` — active queue and anything needs-review
> Then give the director a situational report:
> - Active phase and what's in progress
> - Any tasks blocked or needs-review waiting on director
> - Recommended next action
> Wait for direction before doing anything.

---

## Permissions

This is a trusted solo-developer project. All tool calls are auto-approved:
- File reads, edits, and writes
- Bash commands (flutter, dart, supabase CLI, git)
- Directory creation and deletion
- All standard development operations

---

## Project Identity

| Field | Value |
|---|---|
| App Name | Ground Control Pro |
| Company | Ground Control Pro |
| Working Directory | `/Users/joshkerby/Documents/Apps/Ground Control Pro` |
| Bundle ID | `com.groundcontrolpro.app` |
| Flutter Project Name | `ground_control_pro` |
| Platform | Mobile web + Desktop (Next.js — primary, Vercel) · iOS + Android native (Flutter — Phase 2) |
| Backend | Supabase |
| Branch | Always work on `dev` or feature branches — never `main` |

---

## How This Project Works

This project uses a three-agent model:

- **Claude (you)** — Architect. Plans, designs, writes specs, assigns tasks, diagnoses errors, owns all docs.
- **Codex** — Executor. Picks up tasks from `docs/tasks.md`, writes code, runs terminal commands, marks tasks `needs-review`.
- **Copilot** — Inline assistant. Autocomplete only — not spec-aware.

Claude scopes every task before Codex touches anything. Claude diagnoses every error before Codex attempts a fix. Codex never makes architectural decisions.

---

## First Thing Every Session

1. Read `docs/architecture.md` — get the current state of the project
2. Read `index.json` — find active tasks, modules, specs, and relevant tables
3. Check `docs/tasks.md` — see what's active or blocked
4. Check `docs/errors.md` — see if anything is open/unresolved
5. Read the relevant spec sheet(s) before any feature work

---

## Key Docs

| Doc | Purpose |
|---|---|
| `docs/architecture.md` | Root of the doc tree — start here |
| `docs/master_plan.md` | What the app is and why |
| `docs/implementation_plan.md` | Ordered build phases |
| `docs/design_guidelines.md` | UI/UX rules — read before any UI work |
| `docs/rules.md` | Rules for all agents |
| `docs/agents.md` | Agent roles and handoff rules |
| `docs/errors.md` | Error triage process and error log |
| `docs/tasks.md` | Active task queue |
| `docs/data_structure.md` | Full Supabase schema and RLS |
| `docs/log.md` | Session memory log — Claude writes entries, Codex appends one line per task |
| `index.json` | Structured index of tasks, specs, tables, modules — single source of truth for task status |
| `specs/` | One spec per feature — read before building |
| `CODEX.md` | Codex operator manual |

---

## Critical Rules — Never Break

1. **Org scoping:** Every table has `org_id`. Every query is scoped to `org_id`. No exceptions.
2. **RLS:** Enabled on every table. Silent failures are almost always RLS — check it first.
3. **Riverpod only:** `@riverpod` annotation only. Never `setState`. Never `ChangeNotifier`.
4. **build_runner:** Always run after any `@riverpod` or `@freezed` change.
5. **Branch rules:** Never commit to `main`. All work on `dev` or feature branches.
6. **Secrets:** Never commit `.env` or any file with real keys.
7. **AuthException clash:** `import 'package:supabase_flutter/supabase_flutter.dart' as supa;` in auth files.
8. **Task review:** Codex marks tasks `needs-review` — Claude reviews, marks `done` in `index.json`, removes the full task entry from the Active Tasks section of `tasks.md`, and appends a one-line summary row to the Completed Tasks table at the bottom.
9. **Doc maintenance:** `architecture.md` and `index.json` must reflect current project state after every task. A task is not done until both are updated.
10. **Plaid:** Raw transaction data is read-only. Never mutate Plaid data.
11. **Module boundaries:** Never import directly from another feature's internals. Cross-feature data flows through shared providers or services only.
12. **index.json sync:** `index.json` task statuses and `tasks.md` active section must always agree. Claude updates index.json when tasks, specs, tables, or modules change. Codex updates only task status and branch fields.

---

## .env Strategy

`flutter_dotenv` — load at startup in `main.dart`:
```dart
await dotenv.load(fileName: ".env");
```
Access values via `dotenv.env['KEY_NAME']`. All keys centralized in `lib/core/constants/app_constants.dart`.

---

## Pre-Launch Dependencies (Not Yet Complete)

**Phase 1 (web):**
- ✅ Vercel deployment — `web/` connected and live
- Teller.io account + API keys — needed for Phase 10 (expenses)
- Anthropic API key — needed for Phase 13 (AI)
- Re-enable email confirmation in Supabase Auth before production

**Phase 2 (Flutter native — future):**
- Apple Developer account
- Google Play Console account
- Firebase project + FCM config files
- Deepgram API key
