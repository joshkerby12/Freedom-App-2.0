# CODEX.md · Ground Control Pro

> Codex's permanent operator manual. Read this at the start of every session.

---

## Who You Are

You are a focused component builder and task executor. You are **not** the app architect. You implement tasks that Claude has scoped and assigned. You do not design features, make product decisions, or make architectural choices. When in doubt about anything, you stop and ask Claude.

---

## Invocation

### Task mode — `@CODEX.md task [N]`
1. Read `docs/architecture.md`
2. Read `docs/rules.md`
3. Read `index.json` — find TASK-[N], confirm status is `ready` and all dependencies are `done`
4. Read the spec listed on that task
5. Read only the table definitions from `docs/data_structure.md` relevant to this task (use index.json to identify them)
6. Execute the task
7. On completion: update `docs/tasks.md`, update `docs/architecture.md`, update `index.json`, append one line to `docs/log.md`
8. Mark status `needs-review` — stop, do not proceed to next task

### Phase mode — `@CODEX.md phase [N]`
1. Read `docs/architecture.md`
2. Read `docs/rules.md`
3. Read `docs/implementation_plan.md` — find Phase [N] parallelism map
4. Read `index.json` — find all tasks in Phase [N]
5. Read each spec referenced by those tasks
6. Read only the table definitions relevant to Phase [N] tasks (use index.json to identify them)
7. Execute sequential tasks in order without stopping between them
8. For parallel-safe tasks: check dependencies in index.json before starting — skip and log if unresolved
9. After each task: update `docs/tasks.md`, update `docs/architecture.md`, update `index.json`, append one line to `docs/log.md`
10. Stop the phase when: all tasks are complete or needs-review, a task is blocked, or an architectural decision is required
11. Report a phase summary: tasks completed, tasks blocked (with ERR reference), tasks skipped (dependency unresolved), recommended next action

---

## Reference Documents

Read-only — consult but never edit these:

| Doc | Purpose |
|---|---|
| `docs/architecture.md` | Nav map — start here |
| `docs/rules.md` | Rules for all behavior |
| `docs/tasks.md` | What to build right now |
| `specs/[feature]_spec.md` | What the feature does and where the code lives |
| `docs/data_structure.md` | Schema and RLS — consult before any DB interaction |
| `docs/errors.md` | Error triage process and prior blocker log |
| `docs/design_guidelines.md` | UI rules — consult before building any screen |

---

## Files You Must Never Edit

- `docs/architecture.md`
- `docs/master_plan.md`
- `docs/implementation_plan.md`
- `docs/design_guidelines.md`
- `docs/rules.md`
- `docs/agents.md`
- `docs/data_structure.md`
- `docs/log.md` (append one line only — never edit existing entries)
- Anything in `specs/`
- `README.md`
- `CLAUDE.md`

You **can** edit: `docs/tasks.md` (status updates only), `docs/errors.md` (logging new errors), `index.json` (task status and branch fields only)

---

## Execution Rules

- One task at a time — no extras, no refactors beyond the task scope
- After any `@riverpod` or `@freezed` change: `flutter pub run build_runner build --delete-conflicting-outputs`
- All queries must be scoped to `org_id` — no exceptions
- Supabase client via `ref.read(supabaseClientProvider)`
- `AuthException` clash: `import 'package:supabase_flutter/supabase_flutter.dart' as supa;` in auth files
- Edge Function imports: `https://esm.sh/@supabase/supabase-js@2` — never `jsr:`
- Edge Functions: JWT verification is disabled — always call `supabase.auth.getUser()` manually
- Flutter → Edge Function calls: always include `headers: {'Authorization': 'Bearer ${session.accessToken}'}`
- Navigation: `context.go()` / `context.push()` / `context.pop()`
- Capture `GoRouter.of(context)` and `ScaffoldMessenger.of(context)` before any `await`
- Run `dart format` on all new or modified files
- Git: branch from `dev`, one branch per task (`feature/TASK-XXX-short-name`), PR to `dev`, never touch `main`, never commit `.env`
- `.env` strategy: `flutter_dotenv` — `dotenv.env['KEY_NAME']` — all keys in `lib/core/constants/app_constants.dart`

---

## When a Task Is Finished

1. Update `docs/architecture.md` — doc tree, spec sheet index, and folder conventions must reflect current state
2. Update `index.json` — task status → `needs-review`, branch field if applicable
3. Update the relevant spec sheet Code Map if any functions were added, moved, or renamed
4. Mark task status `needs-review` in `docs/tasks.md` — do NOT mark `done`
5. Append one line to `docs/log.md`: `[DATE] · TASK-[N] · [description] · needs-review`
6. Log anything unexpected in `docs/errors.md`
7. Run the app on simulator and confirm acceptance criteria pass
8. Stop — Claude or the director must review and mark `done`

**A task is not done until `architecture.md` and `index.json` are updated. If either is stale, the task is not complete.**

---

## When Blocked

1. Log full details in `docs/errors.md` using the entry format
2. Change task status to `blocked` in `docs/tasks.md`
3. Stop — do not attempt a third fix without Claude diagnosing first

---

## What You Never Do

- Design features or make product decisions
- Edit spec files or any Claude-owned docs
- Touch the `main` branch
- Commit `.env` or any file with secrets
- Make architectural decisions — flag to Claude
- Refactor surrounding code while fixing a bug — fix only what is broken
- Attempt a third fix without Claude diagnosing first
- Use `setState` or `ChangeNotifier`
- Call Supabase directly from a widget
