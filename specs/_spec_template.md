# [Feature] Spec

> Copy this template when creating a new feature spec. Fill in all sections — no stubs.
> Add this spec to the Spec Sheet Index in `docs/architecture.md` when created.

---

## Overview

What this feature does and its role in the app. 2–4 sentences.

---

## Scope

**Included:**
- ...

**Explicitly out of scope:**
- ...

---

## User Stories

- As a [role], I can [action] so that [outcome]
- As a [role], I can [action] so that [outcome]

---

## Org / User Context

- **Data scoping:** All records scoped to `org_id`
- **Role access:**
  - Read: [who can read]
  - Write/Edit: [who can write]
  - Delete: [who can delete]
- **Permission keys:** `[feature].view`, `[feature].create`, `[feature].edit`, `[feature].delete`

---

## Page States

Each page in this feature can be in the following states:

| State | Description |
|---|---|
| Loading | Fetching data — show shimmer |
| Loaded | Data present — show content |
| Empty | No records exist — show empty state with CTA |
| Error | Fetch failed — show error view with retry |
| Editing | Form is open for create or edit |

---

## UI Behavior

### [Page Name]

**Loaded state:**
- ...

**Empty state:**
- Message: "..."
- Action: [button label]

**Interactions:**
- Tapping [X] does [Y]
- Long press [X] does [Y]

**Validation rules:**
- [field] is required
- [field] max length: X

**Edge cases:**
- ...

---

## Layouts

- **Mobile** — ...
- **Tablet** — ...

---

## Data

**Reads:**
- `[table_name]` — [what it reads and why]

**Writes:**
- `[table_name]` — [what it writes and when]

**Supabase tables involved:**
- `[table_name]` — ref: `docs/data_structure.md`

---

## AI Integration (if applicable)

- Prompt file: `assets/prompts/[feature]_[action].txt`
- Context injected: org, user, role, [relevant data]
- Response format: [json / plain text / structured]
- Handling: [how the response is used in the UI]

---

## Voice Integration (if applicable)

- Trigger: [tap button / wake word]
- Transcription: Deepgram STT → text field population
- Output: flutter_tts for [what responses get read aloud]

---

## Edge Cases & Rules

- ...

---

## Open Questions

> Remove this section before handing to Codex. All questions must be resolved first.

- [ ] ...

---

## Code Map

> Keep this section current. Updated whenever a function is added, moved, or renamed.
> This is how agents navigate to the right file without reading everything.

### Functions

- [Plain English concept] → `[file path]` → `functionName()`
- Example: Calculate line item subtotal → `helpers/[feature]_calculations.dart` → `calculateLineItemSubtotal()`

### Key Files

| File | Purpose |
|---|---|
| `lib/features/[feature]/[page]_provider.dart` | Riverpod state |
| `lib/features/[feature]/[page]_screen.dart` | Layout router (entry point) |
| `lib/features/[feature]/layouts/mobile/[page]_screen_mobile.dart` | Mobile UI |
| `lib/features/[feature]/layouts/tablet/[page]_screen_tablet.dart` | Tablet UI |
| `lib/features/[feature]/helpers/[feature]_calculations.dart` | Calculations |
| `lib/features/[feature]/helpers/[feature]_validators.dart` | Validation |
| `lib/services/supabase_service.dart` | DB calls — `relevantMethod()` |
