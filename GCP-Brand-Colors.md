# GCP Brand Color System

## Overview

Ground Control Pro uses an earthy, professional color palette built around warm creams, deep browns, and natural greens. The system supports both light and dark modes, and is fully customizable per company account via the Theme Settings page.

---

## Design Tokens

These are the source-of-truth values. Reference these throughout the app via CSS variables or Flutter `ThemeData`.

### Light Mode

| Token | Hex | Usage |
|---|---|---|
| `cream-base` | `#F2E8D9` | Page background |
| `cream-deep` | `#E6D5BE` | Cards, inputs, dividers |
| `brown-dark` | `#3D2B1F` | Nav bar, headings, primary buttons |
| `brown-mid` | `#6B4A35` | Secondary text, hover states |
| `green-dark` | `#1E3A2F` | CTA buttons, tags, highlights |

### Dark Mode

| Token | Hex | Usage |
|---|---|---|
| `black-base` | `#0D0D0B` | Page background |
| `near-black` | `#161612` | Cards, elevated surfaces |
| `brown-mid` | `#6B4A35` | Warm accent, borders, decorative elements |
| `green-light` | `#7AB87A` | CTA buttons, active nav, badges |
| `cream-base` | `#F2E8D9` | Body text, subtle UI elements |

---

## CSS Variables

Paste into your global stylesheet or design token file. Swap the variable values at the `:root[data-theme="dark"]` level for dark mode.

```css
:root {
  /* Surfaces */
  --color-surface:       #F2E8D9;
  --color-surface-2:     #E6D5BE;

  /* Brand */
  --color-primary:       #3D2B1F;
  --color-primary-mid:   #6B4A35;
  --color-accent:        #1E3A2F;

  /* Dark mode accents */
  --color-black:         #0D0D0B;
  --color-near-black:    #161612;
  --color-green-light:   #7AB87A;
}

:root[data-theme="dark"] {
  --color-surface:       #0D0D0B;
  --color-surface-2:     #161612;
  --color-primary:       #F2E8D9;
  --color-primary-mid:   #6B4A35;
  --color-accent:        #7AB87A;
}
```

---

## Flutter ThemeData (Reference)

```dart
// gcp_theme.dart

import 'package:flutter/material.dart';

const Color gcpCream       = Color(0xFFF2E8D9);
const Color gcpCreamDeep   = Color(0xFFE6D5BE);
const Color gcpBrownDark   = Color(0xFF3D2B1F);
const Color gcpBrownMid    = Color(0xFF6B4A35);
const Color gcpGreenDark   = Color(0xFF1E3A2F);
const Color gcpBlack       = Color(0xFF0D0D0B);
const Color gcpNearBlack   = Color(0xFF161612);
const Color gcpGreenLight  = Color(0xFF7AB87A);

ThemeData gcpLightTheme = ThemeData(
  brightness: Brightness.light,
  scaffoldBackgroundColor: gcpCream,
  primaryColor: gcpBrownDark,
  colorScheme: ColorScheme.light(
    primary: gcpBrownDark,
    secondary: gcpGreenDark,
    surface: gcpCreamDeep,
    onPrimary: gcpCream,
    onSecondary: gcpCream,
    onSurface: gcpBrownDark,
  ),
);

ThemeData gcpDarkTheme = ThemeData(
  brightness: Brightness.dark,
  scaffoldBackgroundColor: gcpBlack,
  primaryColor: gcpGreenLight,
  colorScheme: ColorScheme.dark(
    primary: gcpGreenLight,
    secondary: gcpBrownMid,
    surface: gcpNearBlack,
    onPrimary: gcpBlack,
    onSecondary: gcpCream,
    onSurface: gcpCream,
  ),
);
```

---

## Supabase Schema — Company Theme

The theme is stored as a single row per GCP account. Pulled on app load and injected into the theme context.

```sql
create table company_theme (
  id             uuid primary key default gen_random_uuid(),
  account_id     uuid references accounts(id) on delete cascade not null unique,

  -- Identity
  company_name   text not null,
  logo_url       text,

  -- Light mode
  color_surface  text not null default '#F2E8D9',
  color_primary  text not null default '#3D2B1F',
  color_accent   text not null default '#1E3A2F',

  -- Dark mode
  color_dark_surface text not null default '#0D0D0B',
  color_dark_warm    text not null default '#6B4A35',
  color_dark_accent  text not null default '#7AB87A',

  updated_at     timestamptz default now()
);
```

### Reset to Defaults Query

```sql
update company_theme set
  color_surface      = '#F2E8D9',
  color_primary      = '#3D2B1F',
  color_accent       = '#1E3A2F',
  color_dark_surface = '#0D0D0B',
  color_dark_warm    = '#6B4A35',
  color_dark_accent  = '#7AB87A',
  updated_at         = now()
where account_id = $1;
```

---

## Theme Settings Page

**File:** `gcp-theme-settings.html` (prototype — convert to Next.js settings route)

### Behavior

- Company-wide: one theme per GCP account, all users see the same branding.
- Customizable fields: company name, logo, all 6 color tokens.
- Live preview card updates in real time as user adjusts values.
- Preview toggle between light and dark mode.
- Save/Discard flow with unsaved changes indicator.
- Reset to GCP Defaults restores all original token values.

### Next.js Route Suggestion

```
/app/settings/theme
```

Fetch `company_theme` row on load. On save, `upsert` back to Supabase. Invalidate any cached theme context after save.

---

## Usage Guidelines

### Do
- Use `brown-dark` as the primary nav and header color in light mode.
- Use `green-light` (`#7AB87A`) as the primary CTA and interactive color in dark mode.
- Use `cream-base` as a warm near-white — never pure `#FFFFFF`.
- Keep `brown-mid` for decorative elements, borders, and warm hover states in dark mode.

### Don't
- Don't use `green-dark` on dark backgrounds — contrast is insufficient.
- Don't use pure black (`#000000`) — always use `black-base` (`#0D0D0B`) for warmth.
- Don't allow user-customized colors to override system status colors (error red, warning amber). Keep those separate from the theme system.

---

## Palette at a Glance

```
LIGHT MODE
  Background  #F2E8D9  ████████  cream-base
  Surface     #E6D5BE  ████████  cream-deep
  Primary     #3D2B1F  ████████  brown-dark
  Accent      #1E3A2F  ████████  green-dark

DARK MODE
  Background  #0D0D0B  ████████  black-base
  Surface     #161612  ████████  near-black
  Warm        #6B4A35  ████████  brown-mid
  Accent      #7AB87A  ████████  green-light
```
