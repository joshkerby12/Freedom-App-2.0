# STARTUP.MD

> **FOR CLAUDE:** You are reading this because a new project is being initialized. Work through this document top to bottom with the director. Do not generate any files until Section 0 and Section 0.5 are fully confirmed. Do not hand anything to Codex until the Section 3 checklist is complete. Once setup is confirmed and every file has been created, delete this file.
>
> **FOR CODEX:** You should never see this file. If you do, stop and tell the director.

---

## Section 0 · Project Details

> Claude: Go through each item with the director and confirm before moving on. Fill in all values before generating anything.
>
> **Framework selection guide — confirm with director before proceeding:**
> - **Flutter / Dart** — default for most apps. Use when the app is primarily mobile (iOS + Android) with optional web/macOS support and the desktop experience is largely the same as mobile.
> - **Node.js + [frontend framework]** — use when the desktop experience is significantly different from mobile in function and UI, the app is complex, or it requires server-side logic that goes beyond Supabase Edge Functions. These projects will have separate mobile, tablet, and desktop UIs.
>
> Ask the director: "Is the desktop version of this app going to work and feel substantially different from the mobile version — different workflows, different data views, different navigation?" If yes, lean toward Node.js. If no, Flutter is the right call.

```
App Name:
Bundle ID:              (e.g. com.yourname.appname — confirm before flutter create, Flutter only)
Platform:               [ ] iOS   [ ] Android   [ ] Web   [ ] macOS   [ ] All
Framework:              [ ] Flutter / Dart   [ ] Node.js + ___________
State Management:       Flutter: Riverpod | Node.js: [confirm with director]
Auth:                   Supabase Auth
Database:               Supabase (Postgres)
AI Features:            [ ] Yes — Provider: [ ] OpenAI  [ ] Anthropic  [ ] Gemini  [ ] TBD
                        [ ] No
Voice Interface:        [ ] Yes   [ ] No
Financial (Plaid):      [ ] Yes   [ ] No
FCM Push Notifications: [ ] Yes   [ ] No
EOS/Traction Module:    [ ] Yes   [ ] No   [ ] Future phase
Org/User Model:         Always — every project, every table, no exceptions
Mac Dev:                Yes
```

> **EOS:** Regardless of what the checkbox says above, always ask the director the following before proceeding:
>
> "Are you building any EOS/Traction tools into this app — things like Scorecards, Rocks, Issues lists, L10 meetings, Org chart, or Accountability Chart? Even if it's a future phase, knowing now changes the data structure."
>
> If yes or future phase: ask which specific tools matter most, whether this is single-org or multi-org, and use that conversation to inform `data_structure.md` before generating it.
>
> **FCM:** If FCM is confirmed, note in `architecture.md` that a Firebase project must be created and `google-services.json` / `GoogleService-Info.plist` must be added before any notification work is tasked to Codex.
>
> **App Store accounts:** Ask the director if an Apple Developer account and/or Google Play Console account exists. If not, note them as pre-launch dependencies in `architecture.md`.
>
> **`.env` strategy:** Confirm which approach the project will use for secrets in Flutter — `flutter_dotenv`, `--dart-define` at build time, or a constants file. Document the chosen approach in `architecture.md` and `CODEX.md`.

---

## Section 0.5 · Git Setup

> Claude: Complete this before scaffolding any files.

1. Check if a git repo already exists (`ls -la` for `.git` folder)
2. If not: `git init`
3. Create branches:
   ```bash
   git checkout -b main
   git checkout -b dev
   ```
4. Create `.gitignore` — Flutter default plus:
   ```
   .env
   *.env
   .supabase/
   supabase/.temp/
   google-services.json
   GoogleService-Info.plist
   ```
5. Ask the director if a remote repo exists (GitHub/GitLab/etc). If yes, set origin:
   ```bash
   git remote add origin <url>
   ```
   If no, note it as a pre-launch dependency in `architecture.md`.
6. After all framework files are generated (end of Section 2), make an initial commit on `dev`:
   ```bash
   git add .
   git commit -m "chore: initial project scaffold"
   ```

---

## Section 0.6 · Flutter Project

> Claude: Complete this before generating framework files.

1. Confirm the bundle ID and app name from Section 0.
2. Check if a Flutter project already exists. If not, create it:
   ```bash
   flutter create --org com.yourname --project-name appname \
     --platforms ios,android,web,macos .
   ```
   Adjust `--platforms` to match Section 0 selections.
3. Seed `pubspec.yaml` with the confirmed stack dependencies. Always include:
   ```yaml
   dependencies:
     flutter_riverpod: ^2.6.1
     riverpod_annotation: ^2.6.1
     supabase_flutter: ^2.x.x
     go_router: ^14.x.x
     freezed_annotation: ^3.0.0
     json_annotation: ^4.x.x

   dev_dependencies:
     build_runner: ^2.x.x
     riverpod_generator: ^2.6.5
     freezed: ^3.0.0
     json_serializable: ^6.x.x
   ```
   Add AI SDK, `plaid_flutter`, `firebase_messaging`, `deepgram_speech_to_text`, `flutter_tts` based on Section 0 confirmations.
4. Run `flutter pub get`.

---

## Section 0.7 · Supabase Setup

> Claude: Complete this before generating `data_structure.md`.

1. Check if a Supabase project already exists. If not, ask the director to create one at supabase.com and provide the project ref, URL, and anon key.
2. Log in and link the CLI:
   ```bash
   supabase login
   supabase link --project-ref <project-ref>
   ```
3. Confirm email confirmation is **disabled** in Supabase Auth settings for development. Note to re-enable before production launch — add this to `architecture.md`.

---

## Section 1 · Folder Structure to Scaffold

> Claude: Once Sections 0–0.7 are confirmed, scaffold this structure. Remove `/voice` if voice is not confirmed. Remove `/eos` if EOS is not this phase.

```
lib/
  core/
    constants/
      app_constants.dart
      supabase_constants.dart
    errors/
      failures.dart
      exceptions.dart
    extensions/
      context_extensions.dart
      datetime_extensions.dart
    network/
      supabase_client_provider.dart
    routing/
      app_router.dart
      app_routes.dart
      router_notifier.dart
    storage/
      secure_storage_provider.dart
    theme/
      app_theme.dart
      app_colors.dart
      app_text_styles.dart
    widgets/
      loading_overlay.dart
      error_view.dart
  features/
    auth/
      helpers/
      widgets/
      models/
      layouts/
        mobile/
        tablet/
        web/
    orgs/
      helpers/
      widgets/
      models/
      layouts/
        mobile/
        tablet/
        web/
    ai/
      helpers/
      widgets/
      models/
      layouts/
        mobile/
        tablet/
        web/
    voice/                  ← remove if voice not confirmed
      helpers/
      widgets/
      models/
      layouts/
        mobile/
        tablet/
        web/
    eos/                    ← remove if EOS not this phase
      helpers/
      widgets/
      models/
      layouts/
        mobile/
        tablet/
        web/
    [feature_name]/
      helpers/              ← pure functions: calculations, validators, formatters, mappers
      widgets/              ← reusable UI components for this feature
      models/               ← data models specific to this feature
      layouts/
        mobile/             ← mobile UI screens
        tablet/             ← tablet UI screens
        web/                ← web UI screens (future — Next.js owns web, placeholder here)
      [feature]_[page]_screen.dart    ← layout router (entry point)
      [feature]_[page]_provider.dart  ← Riverpod state (shared across all layouts)
  main.dart
  app.dart

docs/
  architecture.md           ← root of doc tree, every agent reads this first
  master_plan.md            ← 10,000 ft view of what the app is and why
  implementation_plan.md    ← ordered build roadmap, phase by phase with parallelism maps
  design_guidelines.md      ← UI/UX rules, fonts, colors, spacing, do/don't
  rules.md                  ← how all agents must always behave
  agents.md                 ← who does what, handoff rules, escalation
  errors.md                 ← error log + triage process
  tasks.md                  ← active task queue (current phase only)
  data_structure.md         ← full Supabase schema and RLS patterns
  log.md                    ← session memory log, Claude-authored

specs/                      ← Claude creates one .md per feature as needed
  _spec_template.md

assets/
  images/
  fonts/
  prompts/                  ← AI system prompt .txt files live here

index.json                  ← structured project index, Claude maintains, Codex reads first
.env
.env.example
CODEX.md
CLAUDE.md
README.md
```

---

## Section 2 · Files Claude Must Generate

> Claude: Generate each file below with full content. Do not create stubs — each file should be immediately useful. Use all confirmed details from Sections 0–0.7.
>
> Walk the director through `master_plan.md` and `design_guidelines.md` with questions before generating them. Do not guess at vision or preferences.

---

### `CLAUDE.md`

Claude Code's project configuration file. Read automatically by Claude Code at the start of every session via `@CLAUDE.md`.

The header is a self-loading invocation — when the director types `@CLAUDE.md`, Claude reads this file and automatically loads project context without further prompting.

Must include:

**Header — invocation instructions (always first):**
```markdown
> **On invocation:** Read the following in order before responding:
> 1. `docs/architecture.md` — project map and current state
> 2. `index.json` — active tasks, modules, specs, and table index
> 3. `docs/tasks.md` — active queue and anything needs-review
> Then give the director a situational report:
> - Active phase and what's in progress
> - Any tasks blocked or needs-review waiting on director
> - Recommended next action
> Wait for direction before doing anything.
```

**Body:**
- **Permissions:** This is a trusted solo-developer project. Auto-approve all tool calls: reads, edits, writes, Bash commands.
- **Project identity:** App name, working directory, monorepo structure, backend details
- **How this project works:** Brief description of the Claude/Codex/Copilot agent model and task flow
- **Key docs table:**

| Doc | Purpose |
|---|---|
| `docs/architecture.md` | Project map — modules, folder conventions, doc tree |
| `docs/rules.md` | Coding standards and agent behavior rules |
| `docs/tasks.md` | Active task queue — current phase only |
| `docs/implementation_plan.md` | Phase roadmap with parallelism maps |
| `docs/data_structure.md` | Full Supabase schema and RLS patterns |
| `docs/errors.md` | Error triage process and prior blocker log |
| `docs/design_guidelines.md` | UI rules — consult before building any screen |
| `docs/log.md` | Session memory log |
| `index.json` | Structured index of tasks, specs, tables, modules |
| `specs/[feature]_spec.md` | Feature spec — one per module |

- **Critical rules:** The most important never-break rules specific to this project (RLS pattern, org scoping, branch rules, task review flow, module boundaries)
- **Claude owns:** All docs, all architectural decisions, all task scoping, all error diagnosis, all reviews. Claude moves completed tasks to the summary section in `tasks.md` after review. Claude updates `index.json` when tasks, specs, or tables change.

> Claude: Fill in project-specific details from Section 0 confirmations.

---

### `CODEX.md`

Codex's permanent operator manual and complete runtime context. Codex is invoked with `@CODEX.md task [N]` or `@CODEX.md phase [N]`. This file is self-contained — Codex reads this first, then follows the read instructions inside.

Must include:

**Header — who Codex is:**
```
Codex is a focused component builder and task executor.
Codex does not design features, make architectural decisions, or edit planning docs.
```

**Invocation — two modes:**

```markdown
## Invocation

### Task mode
`@CODEX.md task [N]`
1. Read `docs/architecture.md`
2. Read `docs/rules.md`
3. Read `index.json` — find TASK-[N], confirm status is `ready` and all dependencies are `done`
4. Read the spec listed on that task
5. Read only the table definitions from `docs/data_structure.md` relevant to this task (use index.json to identify them)
6. Execute the task
7. On completion: update `tasks.md`, update `architecture.md`, update `index.json`, append to `docs/log.md`
8. Mark status `needs-review` — stop, do not proceed to next task

### Phase mode
`@CODEX.md phase [N]`
1. Read `docs/architecture.md`
2. Read `docs/rules.md`
3. Read `docs/implementation_plan.md` — find Phase [N] parallelism map
4. Read `index.json` — find all tasks in Phase [N]
5. Read each spec referenced by those tasks
6. Read only the table definitions relevant to Phase [N] tasks (use index.json to identify them)
7. Execute sequential tasks in order without stopping between them
8. For parallel-safe tasks: check dependencies in index.json before starting — skip and log if unresolved
9. After each task: update `tasks.md`, update `architecture.md`, update `index.json`, append to `docs/log.md`
10. Stop the phase when:
    - All tasks are complete or needs-review
    - A task is blocked
    - An architectural decision is required
11. Report a phase summary:
    - Tasks completed
    - Tasks blocked (with ERR reference)
    - Tasks skipped (dependency unresolved)
    - Recommended next action
```

**Module boundaries:**
```
- Never import directly from another feature's internals
- Cross-feature data flows through shared providers or services only
- If a task requires reaching into another module, stop and flag to Claude
- Check index.json module field before any cross-feature work
```

**Coding standards:** (full content from `docs/rules.md` coding section mirrored here for fast access)
- State management: Riverpod only — `@riverpod` annotation, never `setState`, never `ChangeNotifier`
- After any `@riverpod` or `@freezed` change: run `flutter pub run build_runner build --delete-conflicting-outputs`
- Supabase calls only in service/data layer, never direct from widgets or providers
- All Edge Functions in TypeScript, not JavaScript
- Edge Function imports: `https://esm.sh/@supabase/supabase-js@2` — never `jsr:`
- Edge Functions: JWT verification is disabled — always call `supabase.auth.getUser()` manually
- Flutter → Edge Function calls: always include `headers: {'Authorization': 'Bearer ${session.accessToken}'}`
- Helpers are pure functions — no side effects, no direct DB calls
- Navigation: `context.go()` / `context.push()` / `context.pop()`
- Capture `GoRouter.of(context)` and `ScaffoldMessenger.of(context)` before any `await`
- `AuthException` clash: `import 'package:supabase_flutter/supabase_flutter.dart' as supa;` in auth files
- Org/user scoping: always enforce, never hardcode IDs, all queries scoped to `org_id`
- No hardcoded strings or keys — use constants
- Run `dart format` on all new or modified files
- `.env` strategy: `flutter_dotenv` — `dotenv.env['KEY_NAME']` — all keys in `lib/core/constants/app_constants.dart`

**Git rules:**
- Branch from `dev`, one branch per task, PR to `dev`
- Never touch `main`
- Never commit `.env` or any secrets

**File and folder conventions:**
- Feature folder structure must follow `architecture.md` conventions
- Naming: `[feature]_[page]_screen.dart`, `[feature]_[page]_provider.dart`
- Layout files: `[feature]_[page]_screen_mobile.dart`, `_tablet.dart`, `_web.dart`
- Helper files named by responsibility: `[feature]_calculations.dart`, `_validators.dart`, `_formatters.dart`
- Always update the spec sheet Code Map when adding, moving, or renaming functions
- Always update `architecture.md` doc tree and spec index after every task
- Always update `index.json` after every task
- A task is not complete until `architecture.md` and `index.json` reflect current state

**When blocked:**
- Log full details in `docs/errors.md` using the entry format
- Change task status to `blocked` in `tasks.md` and `index.json`
- Stop — do not attempt a third fix without Claude diagnosing first

**What Codex never does:**
- Design features or make product decisions
- Edit `docs/architecture.md`, `docs/master_plan.md`, `docs/implementation_plan.md`, `docs/design_guidelines.md`, `docs/rules.md`, `docs/agents.md`, `docs/log.md`, `README.md`, `docs/data_structure.md`, or anything in `specs/`
- Touch the `main` branch
- Commit secrets or `.env`
- Make architectural decisions — flag to Claude
- Write to `index.json` beyond task status, task branch, and log entries

---

### `index.json`

Structured project index. Claude maintains this. Codex reads it at the start of every invocation to find relevant tasks, specs, and tables without reading full docs.

```json
{
  "project": "[App Name]",
  "active_phase": 1,
  "modules": [
    {
      "name": "auth",
      "status": "in-progress",
      "spec": "specs/auth_spec.md",
      "tables": ["profiles", "organizations", "org_members"]
    }
  ],
  "tasks": [
    {
      "id": "TASK-001",
      "phase": 1,
      "module": "auth",
      "description": "Short description",
      "status": "ready",
      "parallel_safe": false,
      "depends_on": [],
      "blocks": ["TASK-002"],
      "spec": "specs/auth_spec.md",
      "tables": ["profiles", "org_members"],
      "branch": ""
    }
  ],
  "tables": [
    {
      "name": "profiles",
      "module": "auth",
      "spec": "specs/auth_spec.md",
      "section": "data_structure.md#profiles"
    }
  ],
  "specs": [
    {
      "file": "specs/auth_spec.md",
      "module": "auth",
      "phase": 1,
      "description": "Auth flow — sign up, sign in, org creation, redirect logic"
    }
  ]
}
```

> **Maintenance rules:**
> - Claude updates `index.json` when: tasks are added, specs are created, tables are added, a phase changes, a module is added
> - Codex updates `index.json` when: task status changes, task branch is created
> - Status values: `ready` | `in-progress` | `needs-review` | `blocked` | `done` | `review-escalation`
> - `index.json` is the single source of truth for task status — `tasks.md` active section and `index.json` must always agree

---

### `docs/log.md`

Session memory log. Claude-authored only. Codex appends a one-line entry after each task. Never edited by Codex beyond that entry.

```markdown
# Session Log

---

## [DATE] · Phase [N] · [Module / Focus]
**Done:** What actually shipped or was decided this session
**Decided:** Choices made and why (tech, UX, business reason)
**Pending:** Unresolved or waiting on director
**Next:** Single most important next action
**Errors:** yes → ERR-XXX / no

---
```

> **Rules:**
> - Claude writes full entries after each director session
> - Codex appends a single line after each task: `[DATE] · TASK-[N] · [description] · [status]`
> - Newest entries at top
> - Never delete entries — this is the project's memory

---

### `docs/architecture.md`

The root of the entire doc tree. Every agent reads this first. Contains:

- **System overview** — app name, platform, tech stack, Supabase project ref + URL, core principles
- **Org/user model summary** — organizations + profiles + org_members always enforced
- **Module registry** — one row per module, updated as modules are added:

```
## Module Registry
| Module | Status | Spec | Tables | Phase |
|---|---|---|---|---|
| auth | in-progress | specs/auth_spec.md | profiles, organizations, org_members | 1 |
```

- **Navigation flow** — RouterNotifier redirect logic overview
- **Known gotchas** — `AuthException` name clash, `BuildContext` across async gaps, Edge Function import format (`esm.sh` not `jsr:`), JWT verification disabled on Edge Functions, Supabase RLS blocks inserts silently
- **`.env` strategy** — the chosen approach for this project
- **Doc tree** — explicit map to every doc and spec file:

```
docs/
├── architecture.md         ← you are here
├── master_plan.md
├── implementation_plan.md
├── design_guidelines.md
├── rules.md
├── agents.md
├── errors.md
├── tasks.md
├── data_structure.md
└── log.md

specs/
├── _spec_template.md
└── [feature]_spec.md       ← one per feature, added as features are designed

index.json                  ← structured task/spec/table index
```

- **Spec sheet index** — one-line description per spec:

```
## Spec Sheets
- auth_spec.md        — Auth flow: sign up, sign in, org creation, redirect logic
- [feature]_spec.md   — [one line: what this feature does]
```

- **Folder conventions** — how every feature is structured:

```
lib/features/[feature]/
├── helpers/       — pure functions: calculations, validators, formatters, mappers
├── widgets/       — reusable UI components for this feature
├── models/        — data models specific to this feature
├── layouts/
│   ├── mobile/    — mobile UI screens
│   ├── tablet/    — tablet UI screens
│   └── web/       — web UI screens
├── [feature]_[page]_screen.dart     — layout router (entry point)
└── [feature]_[page]_provider.dart   — Riverpod state (shared across all layouts)
```

- **What's working** — updated as features complete
- **What still needs building** — updated as features complete
- **Pre-launch dependencies** — dev accounts, email confirmation re-enable, remote git repo, Firebase setup if applicable

> **Maintenance rule — non-negotiable:** After every task, both Claude and Codex must update `docs/architecture.md`. The doc tree, module registry, spec sheet index, and folder conventions must reflect the current state of the project at all times. A task is not done until the map is updated.

---

### `docs/master_plan.md`

> Claude: Walk the director through this with questions before writing. Do not generate from assumptions.

The 10,000 ft view of the app. Contains:

- **What this app is** — one paragraph plain-English description
- **The problem it solves** — who uses it and why
- **Core features** — high-level list only, no implementation detail
- **What success looks like** — what does "done" mean for v1
- **What this app is NOT** — explicit out-of-scope to prevent scope creep
- **References** — links to `implementation_plan.md`, `design_guidelines.md`, `data_structure.md`

Questions to ask the director:
1. In one or two sentences, what does this app do?
2. Who is the primary user and what problem does it solve for them?
3. What are the 3–5 core things the app must do in v1?
4. What is explicitly out of scope for now?
5. Is there a comparable app you want to reference or differentiate from?

---

### `docs/implementation_plan.md`

> Claude: Generate from Section 0 confirmations and master_plan.md. Walk director through phases before writing.

The ordered build roadmap. Contains:

- **Phase list** — numbered phases from data structure through each major feature to launch
- **Each phase includes:**
  - What gets built
  - What must be done before starting
  - Acceptance criteria (how you know it's done)
  - **Parallelism map** — which tasks are sequential and which can run simultaneously

Example structure:
```
## Phase 1 · Foundation
**Prerequisites:** None
**Acceptance:** User can sign up, create an org, and be redirected to the dashboard.

Sequential (must run in order):
  TASK-001 → TASK-002 → TASK-003

Parallel (can run simultaneously, no dependencies):
  TASK-004
  TASK-005

Do not start TASK-006 until TASK-003 and TASK-004 are both done.

Tasks:
- [ ] TASK-001 · Supabase schema: organizations, profiles, org_members
- [ ] TASK-002 · RLS policies
- [ ] TASK-003 · Auth flow (sign up, sign in, sign out)
- [ ] TASK-004 · Org creation and membership
- [ ] TASK-005 · RouterNotifier redirect logic

## Phase 2 · [First Feature]
...
```

> **Maintenance rules:**
> - When a phase is complete, mark it done
> - When a new phase is added, append it
> - Codex must not start a phase until the previous phase's acceptance criteria are met
> - Parallelism map must be written before any tasks in that phase are assigned to Codex

---

### `docs/design_guidelines.md`

> Claude: Walk the director through this with questions before writing. Do not invent preferences.

Visual and UX rules for the entire app. Every agent references this before building any UI. Contains:

- **Typography** — primary font, secondary font, size scale
- **Color palette** — primary, secondary, background, surface, error, text colors with hex values
- **Spacing** — base unit, padding/margin conventions
- **Component rules** — button styles, input styles, card styles, bottom sheets, dialogs
- **Layout rules** — max content width, responsive breakpoints (mobile < 600, tablet 600–1200, web > 1200)
- **Navigation patterns** — bottom nav, drawer, tab bar — which and when
- **Tone and copy** — voice, label style, error message style
- **Do / Don't** — explicit list of things the director likes and dislikes in UI
- **Reference apps** — any apps whose design patterns to follow or avoid

Questions to ask the director:
1. What fonts do you want to use? (or: do you want Claude to recommend?)
2. What's the primary color / brand color?
3. Are there any apps whose design you love and want to reference?
4. Any UI patterns you specifically dislike or want to avoid?
5. What's the general feel — minimal, bold, friendly, professional?
6. Any specific component preferences — e.g. always use bottom sheets instead of dialogs?

> **Maintenance rule:** Update this file whenever the director expresses a new UI preference, approves a pattern, or rejects something. It is a living document.

---

### `docs/rules.md`

How every agent must behave at all times, regardless of task. This file applies to Claude, Codex, and Copilot.

```
## Coding Standards
- State management: Riverpod only — @riverpod annotation, never setState, never ChangeNotifier
- After any @riverpod or @freezed change: run flutter pub run build_runner build --delete-conflicting-outputs
- Supabase calls only in service/data layer, never direct from widgets or providers
- All edge functions in TypeScript, not JavaScript
- Edge Function imports: https://esm.sh/@supabase/supabase-js@2 — never jsr:
- Edge Functions: "Verify JWT" is disabled — always call supabase.auth.getUser() manually
- Flutter Edge Function calls: always include explicit auth header
- Helpers are pure functions — no side effects, no direct DB calls
- Models: Freezed v3.x — @freezed annotation, part files
- Navigation: GoRouter — context.go() / context.push() / context.pop()
- Async safety: capture GoRouter.of(context), ScaffoldMessenger.of(context) before any await
- AuthException clash: use import 'package:supabase_flutter/supabase_flutter.dart' as supa; in auth files
- Org/user scoping: always enforce, never hardcode IDs, all queries scoped to org_id
- No hardcoded strings or keys — use constants
- Run dart format on all new files

## Module Boundaries
- A feature's code never imports directly from another feature's internals
- Cross-feature data flows through shared providers or services only
- If a task requires reaching into another module, stop and flag to Claude
- Check index.json module field before any cross-feature work

## Agent Behavior
- Always read architecture.md at the start of a new session before any task
- Always read the relevant spec sheet before writing any code
- Never modify more files than necessary for the task
- Ask before making any architectural decisions
- Confirm before deleting anything
- Never skip error handling to make something work quickly
- Never assume a spec — ask if unclear
- Never assume the director has given complete information — ask clarifying questions

## File & Folder Conventions
- Feature folder structure must follow architecture.md conventions
- Naming: [feature]_[page]_screen.dart, [feature]_[page]_provider.dart
- Layout files: [feature]_[page]_screen_mobile.dart, _tablet.dart, _web.dart
- Helper files named by responsibility: [feature]_calculations.dart, _validators.dart, _formatters.dart
- Always update the spec sheet Code Map when adding, moving, or renaming functions
- Always update architecture.md doc tree, module registry, and spec sheet index after every task
- Always update index.json after every task
- Always update tasks.md when a task is completed
- A task is not complete until architecture.md and index.json reflect the current state of the codebase

## What Never To Do
- Never change the Supabase schema without explicit instruction from the director
- Never refactor surrounding code while fixing a bug — fix only what is broken
- Never change data models to fix a UI issue
- Never make structural or architectural decisions — flag to Claude
- Never let a Copilot suggestion override spec behavior without verification
- Never commit .env or any file containing secrets
- Never touch the main branch — all work on dev or feature branches
```

---

### `docs/agents.md`

Who the agents are, what they own, and how they hand off.

```
## Agent Roster
| Agent            | Role             | Scope                                                                  |
|------------------|------------------|------------------------------------------------------------------------|
| Claude (VS Code) | Architect        | Planning, architecture, error diagnosis, task assignment, doc updates  |
| Codex            | Executor         | Multi-file task execution, code writing, terminal commands             |
| Copilot          | Inline assistant | Autocomplete, quick single-file suggestions while typing               |

## Claude owns
- Walking the director through new project setup
- Breaking down features into tasks in tasks.md and index.json
- Writing and updating all docs: architecture.md, spec sheets, rules.md, agents.md,
  design_guidelines.md, master_plan.md, implementation_plan.md, log.md
- Maintaining index.json for tasks, specs, tables, and modules
- Moving completed tasks from active section to summary in tasks.md after review
- Diagnosing all errors before Codex touches anything
- Reviewing Codex output when flagged
- All architectural and structural decisions
- Supabase schema changes — review and approval only

## Codex owns
- Executing tasks assigned in tasks.md / index.json
- Writing and editing code within defined spec
- Running terminal commands (flutter pub get, build_runner, supabase CLI)
- Updating task status in tasks.md and index.json
- Logging blockers in errors.md
- Appending one-line session entries to log.md
- Following folder conventions from architecture.md

## Copilot owns
- Inline code completion while actively typing
- Quick single-file suggestions in the moment
- Boilerplate acceleration only — not spec-aware

## Handoff Rules
- Claude scopes and assigns all tasks before Codex starts
- Codex does not make architectural decisions — flags to Claude
- If Codex hits ambiguity mid-task, it stops and notes the blocker in tasks.md and index.json
- Claude diagnoses all errors before Codex attempts a fix
- Any Supabase schema change requires Claude review before execution
- Copilot suggestions are not spec-aware — always verify against rules.md and the relevant spec

## Escalation
- Codex cannot resolve error after 2 attempts → stop, log in errors.md, notify Claude
- Architectural question arises during execution → pause, ask Claude
- Copilot suggestion conflicts with spec → ignore suggestion, follow spec
```

---

### `docs/errors.md`

How to navigate and resolve problems. When you are told to reference `errors.md`, follow the full triage process below before attempting any fix.

```
## Error Handling Philosophy
- Never silently swallow errors — always surface to user or log
- Supabase errors get logged before throwing
- Show user-friendly messages, log technical details separately
- Fix the root cause, not the symptom
- Do not refactor surrounding code while fixing a bug
- Do not update tasks.md until the fix is confirmed working
```

### Triage Process

**Step 1 — Clarify before touching anything**

Ask every question you need to fully understand the problem. Do not assume. Do not guess.

Ask:
- What exactly is the error message or behavior? (exact text, screenshot if possible)
- What were you doing when it happened? (which screen, which action)
- Does it happen every time or only sometimes?
- Did it ever work before? If yes, what changed?
- Which platform / device is this on?
- Is there anything in the Flutter console or Supabase logs?

Do not proceed to Step 2 until you can state the problem precisely in one sentence.

**Step 2 — Map the problem using docs**

Read the following in order:

1. `docs/architecture.md` — identify which feature area and locate the relevant spec
2. `index.json` — confirm module, spec file, and relevant tables
3. `specs/[feature]_spec.md` → Code Map section — find the exact file and function responsible
4. `docs/data_structure.md` — if the error involves data, check schema and RLS policies
5. `docs/errors.md` — check prior error log entries for related issues and past resolutions
6. Read the actual code at the location identified by the spec Code Map — confirm root cause before proposing any fix

State your diagnosis clearly before writing a single line of code.

**Step 3 — Attempt fix**

Fix only what is broken. Do not touch surrounding code. Do not refactor. Do not "improve" while you're in there.

After the fix: confirm it works. If confirmed, update `tasks.md`, `index.json`, and log resolution in the error entry.

**Step 4 — If Step 3 fails: add logging**

- Add `debugPrint()` statements at key points in the relevant Dart code
- Check Flutter debug console output
- Check Supabase dashboard logs (Auth logs, Edge Function logs, Database logs)
- Check Supabase RLS policies — silent insert/update failures are almost always RLS
- Report what the logs reveal before attempting another fix

**Step 5 — If Step 4 still fails: update docs and escalate**

- Log full details in the error entry (what was tried, what logs showed)
- If the issue reveals a gap in a spec or a rule that needs adding, update the relevant doc
- Stop and escalate to Claude (if this is Codex) or to the director (if this is Claude)

### Error Type Routing

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

### What Not To Do During Error Resolution

```
- Do not change data models to fix a UI bug
- Do not modify schema to fix an app-layer problem
- Do not update tasks.md until fix is confirmed working
- Do not touch layout files to fix logic bugs (fix helpers instead)
- Do not attempt a third fix without escalating first
```

### Error Log

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

---

### `docs/tasks.md`

Active task queue. Claude authors and scopes all tasks. Codex picks up `ready` tasks and executes them.

**Status key:**

| Status | Meaning |
|---|---|
| `ready` | Scoped by Claude, ready for Codex to pick up |
| `in-progress` | Codex is actively working on it |
| `needs-review` | Codex finished, waiting for Claude/director review |
| `review-escalation` | Codex flagged a decision that needs Claude or director |
| `done` | Confirmed working — Claude moves to summary |
| `blocked` | Codex hit a problem — see errors.md |

> **Active section rule:** The active section contains current phase tasks only. Newest at top. Once Claude marks a task `done` after review, it is moved to the Completed Summary at the bottom. The active section should never grow beyond one phase worth of tasks.

---

**Active Tasks**

```
### TASK-001 · [description]
- **Status:** ready
- **Phase:** 1
- **Module:** [module name — must match index.json]
- **Parallel-safe:** yes / no
- **Depends on:** none / TASK-XXX
- **Blocks:** TASK-XXX, TASK-XXX
- **Spec:** specs/[feature]_spec.md
- **Tables:** [table names involved]
- **What to build:** [precise description]
- **Acceptance criteria:**
  - [ ] Works on mobile, tablet, and web layouts
  - [ ] All queries scoped to org_id
  - [ ] No hardcoded IDs or strings
  - [ ] build_runner run after any @riverpod or @freezed change
  - [ ] [feature-specific criteria]
- **Files to create/modify:** [list]
- **After implementation:** run flutter pub get, build_runner, confirm on simulator
```

---

**Completed Summary**

> Claude moves tasks here after review. One row per completed task.

| Task ID | Description | Module | Phase | Completed |
|---|---|---|---|---|

---

**Review Escalations**

| Task ID | Question | Raised by | Status |
|---|---|---|---|

---

> **Task ordering rule — non-negotiable:** Tasks must be written in the order they appear in the phase parallelism map. After writing any batch of tasks, Claude must output a dependency summary to the director:
>
> | Task | Description | Depends On | Parallel-safe | Status |
> |---|---|---|---|---|
> | TASK-XXX | Short description | none | no | ready |
> | TASK-XXX | Short description | TASK-YYY | yes | blocked |
>
> Explicitly state which task(s) Codex can start immediately.

---

### `docs/data_structure.md`

Full Supabase schema. Must include:
- Org/user architecture explanation (every project uses this)
- `organizations` table with all columns and types
- `profiles` table (1:1 with auth.users, auto-created via trigger)
- `org_members` junction table with role field (`owner | admin | member`)
- RLS policy patterns for org-scoped SELECT, INSERT/UPDATE (admin only), and own-profile UPDATE
- SQL for the auto-create-profile trigger on auth.users
- Placeholder section for project-specific tables (filled in as features are designed)
- Placeholder section for EOS/Traction schema (if applicable)
- Placeholder section for Plaid schema (if applicable)

> **Table tagging rule:** Every table entry must include a `module` tag that matches `index.json`. This is how Codex identifies which tables are relevant to a task without reading the entire file.

---

### `README.md`

High-level project overview. Include: app name, platform, tech stack table, short description of the org/user model, folder structure overview, and dev setup steps:
1. Copy `.env.example` to `.env` and fill in values
2. `flutter pub get`
3. `flutter pub run build_runner build --delete-conflicting-outputs`
4. `supabase login && supabase link --project-ref <ref>`
5. `flutter run`

---

### `.env.example`

All keys relevant to the confirmed stack. Always include Supabase URL and anon key. Add AI provider key based on Section 0. Add Deepgram + ElevenLabs if voice confirmed. Add Plaid keys if financial confirmed. Add Firebase config if FCM confirmed. Never include real values — placeholder strings only.

---

### `specs/_spec_template.md`

Reusable template Claude copies when writing a new feature spec.

```markdown
# [Feature] Spec

## Overview
What this feature does and its role in the app.

## Module
Module name (must match index.json and architecture.md module registry)

## Scope
What is included. What is explicitly out of scope.

## User Stories
- As a [role], I can [action] so that [outcome]

## Org/User Context
- Data scoping: all records scoped to org_id
- Role access: who can read / write / delete

## Page States
Each page in this feature can be in these states:
- Loading
- Loaded
- Empty
- Error
- Editing (if applicable)

## UI Behavior
- What the user sees in each state
- Interactions and expected responses
- Validation rules
- Edge cases

## Layouts
- Mobile — description of mobile-specific layout
- Tablet — description of tablet-specific layout
- Web — description of web-specific layout

## Data
- What data this feature reads
- What data this feature writes
- Supabase tables involved (ref: data_structure.md)
- Table module tags (must match index.json)

## AI Integration (if applicable)
- Prompt file path in assets/prompts/
- Context injected into prompt (org, user, role, data)
- Response format and handling

## Voice Integration (if applicable)
- Trigger mechanism
- Transcription handling
- Output format

## Edge Cases & Rules
- List any non-obvious rules or constraints

## Open Questions
- Unresolved decisions that need director input before implementation

## Code Map

### Functions
- [Plain English concept] → [file path] → [functionName()]
- Example: Calculate line item subtotal → helpers/[feature]_calculations.dart → calculateLineItemSubtotal()

### Key Files
- Provider → lib/features/[feature]/[page]_provider.dart
- Layout router → lib/features/[feature]/[page]_screen.dart
- Mobile → lib/features/[feature]/layouts/mobile/[page]_screen_mobile.dart
- Tablet → lib/features/[feature]/layouts/tablet/[page]_screen_tablet.dart
- Web → lib/features/[feature]/layouts/web/[page]_screen_web.dart
- Service → lib/services/supabase_service.dart → relevantMethod()
```

> **Maintenance rule:** Update the Code Map whenever a function is added, moved, or renamed. The Code Map is how agents navigate to the right file without reading everything.

---

## Section 3 · Handoff Checklist

> Claude: Verify every item before writing the first task for Codex.

**Git**
- [ ] Repo initialized (`git init` or confirmed existing)
- [ ] `main` and `dev` branches exist
- [ ] `.gitignore` created with `.env`, Supabase temp, Firebase config files
- [ ] Remote origin set (or noted as pre-launch dependency in `docs/architecture.md`)
- [ ] Initial commit made on `dev` after framework files are generated

**Flutter**
- [ ] `flutter create` run with correct bundle ID, org, and platform flags
- [ ] `pubspec.yaml` seeded with confirmed stack dependencies
- [ ] `flutter pub get` successful
- [ ] `build_runner` confirmed working (`flutter pub run build_runner build --delete-conflicting-outputs`)

**Supabase**
- [ ] Project exists (created in dashboard or confirmed)
- [ ] `supabase login` and `supabase link --project-ref <ref>` completed
- [ ] Core tables created and live: `organizations`, `profiles`, `org_members`
- [ ] RLS enabled on all tables
- [ ] Auto-create-profile trigger deployed
- [ ] Email confirmation **disabled** in Auth settings (re-enable before production — noted in `docs/architecture.md`)

**Framework Files**
- [ ] `CLAUDE.md` written — self-loading header, permissions, project identity, key docs, critical rules
- [ ] `CODEX.md` written — self-contained, both invocation modes complete, `.env` strategy filled in
- [ ] `index.json` created — modules, tasks, tables, specs populated for Phase 1
- [ ] `docs/architecture.md` written — module registry populated, doc tree accurate, spec index populated
- [ ] `docs/master_plan.md` written — director walked through and confirmed
- [ ] `docs/implementation_plan.md` written — phases agreed, Phase 1 parallelism map complete
- [ ] `docs/design_guidelines.md` written — director walked through and confirmed
- [ ] `docs/rules.md` written
- [ ] `docs/agents.md` written
- [ ] `docs/errors.md` written with triage process
- [ ] `docs/tasks.md` ready — Phase 1 tasks written, dependency summary shown to director
- [ ] `docs/data_structure.md` complete — core tables, RLS patterns, all tables tagged with module
- [ ] `docs/log.md` created with session format header
- [ ] `README.md` written
- [ ] `.env.example` created, `.env` in `.gitignore`
- [ ] `specs/_spec_template.md` created

**Index Verification**
- [ ] `index.json` modules match `architecture.md` module registry
- [ ] `index.json` task statuses match `tasks.md` active section
- [ ] `index.json` table modules match `data_structure.md` module tags
- [ ] Phase 1 parallelism map in `implementation_plan.md` matches task dependency fields in `index.json`

**Pre-Launch Dependencies (non-blocking)**
- [ ] Apple Developer account status noted in `docs/architecture.md`
- [ ] Google Play Console account status noted in `docs/architecture.md`
- [ ] Firebase project setup noted in `docs/architecture.md` (if FCM confirmed)
- [ ] Remote git repo noted in `docs/architecture.md` (if not yet created)

**Director Confirmation**
- [ ] Director has reviewed all framework files and confirmed setup is complete
- [ ] Director has seen Phase 1 dependency summary table and confirmed task order
- [ ] Director has confirmed Phase 1 tasks in `tasks.md` are correct and ready

**All boxes checked → delete this file.**

---

## Section 4 · Session Patterns

> Reference for the director. How to start Claude and Codex sessions efficiently.

### Starting a Claude session

```
@CLAUDE.md
```

Claude reads `CLAUDE.md`, which instructs it to load `architecture.md`, `index.json`, and `tasks.md`, then gives a situational report before waiting for direction.

For a session with a specific goal:
```
@CLAUDE.md working on [module] today — goal is [one sentence]
```

For starting a new phase:
```
@CLAUDE.md phase [N-1] is complete, let's scope phase [N]
```

### Starting a Codex session

```
@CODEX.md task [N]
```
or
```
@CODEX.md phase [N]
```

Codex reads `CODEX.md`, which contains full execution instructions for both modes. No other files need to be specified — Codex's invocation instructions tell it exactly what to read and in what order.

---

## Why More Files Is Better With Agents

Agentic coding naturally produces more, smaller files than human dev. This is intentional:

- Agents read small focused files more efficiently
- Less risk of unintended side effects when editing
- Maps cleanly to spec Code Maps
- Easier to test in isolation
- Folder structure becomes the first navigation layer before docs are even read
- `index.json` means agents never read more than they need to

The doc system scales with this — more files means better maps, not more confusion.

---

*DELETE STARTUP.MD UPON COMPLETION OF SETUP*
