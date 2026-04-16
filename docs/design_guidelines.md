# Design Guidelines · Ground Control Pro

> Every agent reads this before building any UI. These are the rules — not suggestions.
> Updated whenever the director approves a new pattern or rejects something.

---

## General Feel

**Professional, clean, field-ready.**
- This is a tool used by people running a business, often in the field on a phone in sunlight
- Not trendy — reliable and clear
- Not corporate-sterile — warm enough to feel like a real company's app
- High contrast, legible at a glance, minimal tap targets never smaller than 44pt

---

## Typography

**Display font: DM Serif Display** — Google Fonts. Headings, logo wordmarks, hero text.
**Mono font: DM Mono** — Google Fonts. Tags, labels, status chips, monospaced data.
**Body font: DM Sans** — Google Fonts. All body copy, inputs, buttons, nav.

| Role | Font | Weight | Size |
|---|---|---|---|
| Display / Headings | DM Serif Display | Regular (400) | 24–32sp |
| Section Titles | DM Sans | SemiBold (600) | 18–20sp |
| Body | DM Sans | Light (300) | 14–16sp |
| Labels / Captions | DM Sans | Regular (400) | 12sp |
| Financial figures | DM Sans | Medium (500) | 14sp |
| Tags / Status | DM Mono | Regular (400) | 10–12sp |

**Rules:**
- Never use more than 3 type sizes on one screen
- Financial figures (dollar amounts, quantities) always in Medium weight
- All-caps via DM Mono only — status chips, page labels, section headers
- Serif (DM Serif Display) used for brand moments only — not body text

---

## Color Palette

Ground Control Pro uses an earthy, professional palette built around warm creams, deep browns, and natural greens. Do not substitute without director approval.

### Light Mode

| Token | Hex | Role |
|---|---|---|
| `cream-base` | `#F2E8D9` | Page background |
| `cream-deep` | `#E6D5BE` | Cards, inputs, dividers |
| `brown-dark` | `#3D2B1F` | Nav bar, headings, primary buttons |
| `brown-mid` | `#6B4A35` | Secondary text, hover states |
| `green-dark` | `#1E3A2F` | CTA buttons, tags, highlights |

### Dark Mode

| Token | Hex | Role |
|---|---|---|
| `black-base` | `#0D0D0B` | Page background |
| `near-black` | `#161612` | Cards, elevated surfaces |
| `brown-mid` | `#6B4A35` | Warm accent, borders, decorative elements |
| `green-light` | `#7AB87A` | CTA buttons, active nav, badges |
| `cream-base` | `#F2E8D9` | Body text, subtle UI elements |

### Status Colors (never theme-overridable)

| Role | Light | Dark |
|---|---|---|
| Error | `#D32F2F` | `#EF5350` |
| Warning | `#F57C00` | `#FFB74D` |
| Success | `#1E3A2F` (green-dark) | `#7AB87A` (green-light) |

### Do / Don't — Colors

- **Do:** Use `brown-dark` as the primary nav and header color in light mode
- **Do:** Use `green-light` (`#7AB87A`) as the primary CTA and interactive color in dark mode
- **Do:** Use `cream-base` as a warm near-white — never pure `#FFFFFF`
- **Do:** Keep `brown-mid` for decorative elements, borders, and warm hover states in dark mode
- **Don't:** Use `green-dark` on dark backgrounds — contrast is insufficient
- **Don't:** Use pure black (`#000000`) — always use `black-base` (`#0D0D0B`) for warmth
- **Don't:** Allow user-customized colors to override system status colors (error, warning)

---

## Spacing

**Base unit: 4dp**

| Name | Value | Use |
|---|---|---|
| xs | 4dp | Tight internal padding |
| sm | 8dp | Compact elements |
| md | 16dp | Standard padding — most common |
| lg | 24dp | Section separation |
| xl | 32dp | Screen-level breathing room |
| xxl | 48dp | Large vertical gaps |

- Screen horizontal padding: 16dp
- Card internal padding: 16dp
- List item vertical padding: 12dp
- Bottom nav height: 56dp
- App bar height: 56dp

---

## Component Rules

### Buttons
- Primary: filled, rounded (radius 8), `brown-dark` (light) / `green-light` (dark), contrasting text
- Secondary: outlined, primary color border and text
- Destructive: filled red (`error` color)
- Text button: for low-emphasis actions only (cancel, skip)
- Min width: 88dp. Min height: 44dp.
- Loading state: replace label with circular progress indicator (same size), disable tap

### Inputs
- Outlined text fields (not filled)
- Border radius: 8dp
- Label always floating (not inline placeholder only)
- Error state: red border + red helper text below
- Required fields: label ends with `*`
- Never disable a field without explaining why nearby

### Cards
- Background: `cream-deep` (light) / `near-black` (dark)
- Border radius: 12dp
- Elevation: subtle shadow (elevation 1–2)
- Padding: 16dp
- Never nest cards inside cards

### Bottom Sheets
- Prefer bottom sheets over dialogs for actions and confirmations on mobile
- Handle bar always shown at top
- Max height: 90% of screen
- Dismiss on drag down or tap outside

### Dialogs
- Use dialogs only for destructive confirmations ("Delete this client?")
- Two actions max: cancel + confirm
- Confirm button is always the destructive/primary action (right side)
- Never use dialogs for forms — use bottom sheets or full screens

### Chips / Status Tags
- Height: 24dp
- Border radius: 12dp (pill)
- Font: DM Mono, 10–11sp, all caps
- Background: status color at 15% opacity, text at full color
- Status colors defined per feature (see specs)

### Lists
- Dividers between items: 1dp, `cream-deep` (light) / `near-black` border (dark)
- Empty state: centered icon + message + action button (never just "No items")
- Loading state: shimmer placeholders matching item height

---

## Layout Rules

| Breakpoint | Width | Layout |
|---|---|---|
| Mobile | < 600dp | Single column, bottom nav |
| Tablet | 600–1200dp | Two-column where appropriate, bottom nav or rail |
| Web (Next.js) | > 1200dp | Full desktop layout — separate Next.js project |

- Max content width on tablet: 800dp, centered
- Bottom nav on mobile: 4–5 items max
- Never show more than 5 items in bottom nav
- Floating action button (FAB): use for primary create action on list screens

---

## Navigation Patterns

- **Mobile:** Bottom navigation bar (BottomNavigationBar or NavigationBar)
- **Tablet:** NavigationRail (left side)
- **Top-level routes:** Dashboard, Clients, Estimates, Schedule, More (expandable)
- Back navigation: system back button always works — never trap the user
- Modals and sheets never disable the back gesture

---

## Tone and Copy

- Labels: title case (`New Client`, `Add Product Line`)
- Error messages: plain English, actionable ("Please enter a phone number" not "Invalid input")
- Empty states: friendly + directive ("No estimates yet — tap + to create your first one")
- Confirmations: clear about what's happening ("Delete this estimate? This can't be undone.")
- Never use jargon the director hasn't confirmed (check with director on any new terminology)

---

## Do / Don't

### Do
- Use bottom sheets for create/edit flows that are short (< 6 fields)
- Use full screens for complex forms (estimates, employees)
- Surface the most important action on each screen with a FAB or primary button
- Show loading states — never let the UI look frozen
- Use color-coded status chips consistently
- Confirm destructive actions before executing

### Don't
- Don't use more than 2 colors per screen (plus neutrals)
- Don't use icons without labels in bottom nav
- Don't show empty lists without an empty state
- Don't clip text — use ellipsis or multi-line, never clip mid-character
- Don't use modals for information — use inline banners or snackbars
- Don't use snackbars for errors — use inline error states

---

## Reference Apps

- **Buildertrend** — reference for estimate and job flow structure (not the visual style)
- **Jobber** — reference for field-friendly mobile layout
- **Linear** — reference for clean list views and status management (not the dark theme)

> Director: add to this list as you see patterns you like or want to avoid.
