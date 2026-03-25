# Agents · Freedom App 2.0

> Who the agents are, what they own, and how they hand off.

---

## Agent Roster

| Agent | Role | Scope |
|---|---|---|
| Claude (VS Code) | Architect | Planning, architecture, error diagnosis, task assignment, doc updates |
| Codex | Executor | Multi-file task execution, code writing, terminal commands |
| Copilot | Inline assistant | Autocomplete, quick single-file suggestions while typing |

---

## Claude Owns

- Walking the director through new project setup and feature design
- Breaking down features into tasks in `tasks.md` and `index.json`
- Writing and updating all docs: `architecture.md`, spec sheets, `rules.md`, `agents.md`, `design_guidelines.md`, `master_plan.md`, `implementation_plan.md`, `log.md`
- Maintaining `index.json` — tasks, specs, tables, and modules
- Moving completed tasks from active section to Completed Summary in `tasks.md` after review
- Diagnosing all errors before Codex touches anything
- Reviewing Codex output when flagged
- All architectural and structural decisions
- Supabase schema — review and approval before any execution
- Interpreting backtrack items and open questions from README

---

## Codex Owns

- Executing tasks assigned in `tasks.md` / `index.json`
- Writing and editing code within defined spec
- Running terminal commands (`flutter pub get`, `build_runner`, `supabase` CLI)
- Updating task status in `tasks.md` and `index.json` (status and branch fields only)
- Logging blockers in `errors.md`
- Appending one-line session entries to `log.md` after each task
- Following folder conventions from `architecture.md`
- Updating `architecture.md` doc tree and spec Code Maps after each task

---

## Copilot Owns

- Inline code completion while actively typing
- Quick single-file suggestions in the moment
- Boilerplate acceleration only — not spec-aware
- Copilot suggestions must always be verified against `rules.md` and the relevant spec

---

## Handoff Rules

- Claude scopes and assigns all tasks in `tasks.md` before Codex starts
- Codex does not make architectural decisions — flags to Claude
- If Codex hits ambiguity mid-task, it stops and notes the blocker in `tasks.md` and `index.json`
- Claude diagnoses all errors before Codex attempts a fix
- Any Supabase schema change requires Claude review before execution
- Copilot suggestions are not spec-aware — always verify against `rules.md` and the relevant spec

---

## Escalation

| Situation | Action |
|---|---|
| Codex cannot resolve error after 2 attempts | Stop, log in `errors.md`, notify Claude |
| Architectural question arises during execution | Pause, ask Claude |
| Copilot suggestion conflicts with spec | Ignore suggestion, follow spec |
| Schema change needed | Stop, flag to Claude — never execute without approval |
| Task scope is unclear | Stop, ask Claude to clarify before writing any code |
