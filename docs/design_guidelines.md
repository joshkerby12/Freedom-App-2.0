# Design Guidelines · Freedom App 2.0

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

**Primary font: Montserrat** — sourced from Google Fonts. Used across all UI.

| Role | Font | Weight | Size |
|---|---|---|---|
| Display / Headings | Montserrat | 700 (Bold) | 24–32sp |
| Section Titles | Montserrat | 600 (SemiBold) | 18–20sp |
| Body | Montserrat | 300 (Light) | 14–16sp |
| Labels / Captions | Montserrat | 400 (Regular) | 12sp |
| Financial figures | Montserrat | 500 (Medium) | 14sp |

**Rules:**
- Never use more than 3 type sizes on one screen
- Financial figures (dollar amounts, quantities) always in Medium weight
- All-caps sparingly — status chips only

---

## Color Palette

Sourced directly from freedomlandscapes.co. Confirmed brand values — do not substitute.

### Light Mode

| Role | Hex | Notes |
|---|---|---|
| Primary | `#42AAE2` | Cyan-blue — main brand color, links, active states |
| Primary Dark | `#243252` | Dark navy — headers, strong emphasis |
| Accent Green | `#0B3D2C` | Forest green — success, link hover |
| Background | `#EDEDED` | Off-white — screen background |
| Surface | `#FFFFFF` | Cards, sheets, inputs |
| Surface Elevated | `#F5F5F5` | Slightly elevated surfaces |
| Divider | `#D8D8D8` | List dividers, borders |
| Error | `#D32F2F` | Red — standard |
| Warning | `#F57C00` | Orange |
| Success | `#0B3D2C` | Forest green (matches brand) |
| Text Primary | `#023D52` | Dark teal — headings |
| Text Body | `#2F2F2F` | Charcoal — body text |
| Text Secondary | `#7E7E7E` | Muted labels, captions |
| Text Disabled | `#BDBDBD` | Disabled state |
| Text On Primary | `#FFFFFF` | Text on primary-colored buttons/backgrounds |

### Dark Mode

| Role | Hex | Notes |
|---|---|---|
| Primary | `#42AAE2` | Same brand blue — stays consistent |
| Primary Dark | `#5B7FBF` | Lightened navy for dark surfaces |
| Background | `#0F1923` | Very dark navy — consistent with brand dark tones |
| Surface | `#1A2535` | Dark card/sheet surface |
| Surface Elevated | `#243048` | Slightly lifted surface in dark mode |
| Divider | `#2E3D52` | Subtle dark divider |
| Error | `#EF5350` | Lightened red for dark backgrounds |
| Warning | `#FFB74D` | Lightened orange |
| Success | `#66BB6A` | Lightened green |
| Text Primary | `#FFFFFF` | White — primary text |
| Text Body | `#E0E0E0` | Slightly muted body text |
| Text Secondary | `#9E9E9E` | Muted labels, captions |
| Text Disabled | `#4A4A4A` | Disabled state |
| Text On Primary | `#FFFFFF` | Text on primary-colored buttons |

### Dark Mode Toggle

- User-accessible toggle in app settings (Settings screen)
- Persists to `employee_preferences.notification_config` (jsonb — add `theme_mode` key)
- Default: follows system (`ThemeMode.system`)
- Options: System / Light / Dark
- Implemented via Riverpod provider watching `ThemeMode` — `MaterialApp.themeMode` wired to provider

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
- Primary: filled, rounded (radius 8), primary color, white text
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
- Background: `surface` color
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
- Font: 11sp, medium weight, all caps
- Background: status color at 15% opacity, text at full color
- Status colors defined per feature (see specs)

### Lists
- Dividers between items: 1dp, divider color
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
