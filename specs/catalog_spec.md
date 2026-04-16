# Item Catalog + Product Catalog Spec · Ground Control Pro

> Covers: TASK-024, TASK-025, TASK-026, TASK-027, TASK-028
> Phase 5 — runs parallel to Phases 2, 3, and 4. Only requires Phase 1 (org context).

---

## Overview

The catalog system is two layered modules. The **Item Catalog** stores individual materials, subcontractors (partners), and supplier pricing — the building blocks used in estimates. The **Product Catalog** is a form designer and formula engine — each product defines what inputs the estimator is asked, what materials/labor are calculated, and how they're priced. The system ships with pre-built templates covering all major landscaping service types. The formula engine uses `math_expressions` to evaluate quantity formulas at estimate time.

---

## Scope

**Included:**
- `catalog_items`, `catalog_item_specs`, `catalog_item_suppliers` schema + RLS
- `suppliers`, `supplier_locations` schema + RLS
- `partners` schema + RLS
- `material_configurations`, `material_configuration_roles` schema + RLS
- `product_catalog`, `product_catalog_inputs`, `product_catalog_components` schema + RLS
- CatalogItemService, SupplierService, PartnerService — full CRUD
- Pricing hierarchy resolution (4-step: flat sell price → supplier cost → default cost → org markup)
- Price review alert logic (overdue items surfaced)
- Auto price increase scheduler (advances `price_next_increase_date` and updates `default_cost`)
- Nearest supplier location calculation (by lat/lng proximity to job site)
- Item catalog list, detail, create, edit UI
- Supplier list, detail, create, edit UI + location management
- Partner list, detail, create, edit UI
- Price review workflow UI
- Material configuration builder UI
- ProductCatalogService — full CRUD
- FormulaEngine — wraps `math_expressions`, evaluates qty formula strings against input + spec variable maps
- System-seeded product templates (all categories — shell records, formulas filled in Backtrack P2)
- Product catalog list UI (grouped by category)
- Product catalog builder UI (form designer for inputs + components)

**Explicitly out of scope:**
- Estimate line item creation (Phase 6 — catalog feeds into estimates, not built here)
- Supplier run list aggregation (Phase 7 — job-level feature)
- QB item code sync (Phase 6)
- Inventory/stock tracking — not in scope v1
- Backtrack P2 (filling formula strings for seeded templates) — post-Phase 5 task, tracked separately

---

## User Stories

- As an estimator, I can browse the item catalog and find a material with its current pricing so I know what to include in an estimate
- As an estimator, I can see which catalog items have stale pricing so I can review and update them
- As an admin, I can add a new catalog item with specs, supplier pricing, and markup settings
- As an admin, I can manage suppliers and their locations including addresses and lat/lng for proximity routing
- As an estimator, I can browse the product catalog and see what inputs a product requires
- As an admin, I can build a product template by defining its inputs and components with formula strings
- As an admin, I can create a material configuration (e.g. paver patio with field + border items) and assign catalog items to each role
- As the system, I can evaluate a product formula given input values and return a calculated quantity

---

## Org / User Context

- **Data scoping:** All records scoped to `org_id`
- **Role access:**
  - Read: `catalog.view`
  - Write/Edit/Delete: `catalog.manage`
- **Permission keys:** `catalog.view`, `catalog.manage`

---

## Pricing Hierarchy

Resolved in this order for every catalog item in an estimate context:

```
1. If catalog_item.default_sell_price is set → use as flat sell price (skip markup)
2. Else if preferred supplier has unit_cost → unit_cost × (1 + markup_pct)
3. Else if catalog_item.default_cost is set → default_cost × (1 + markup_pct)
4. markup_pct = catalog_item.default_markup_pct → else org_settings.material_markup_pct
```

Implemented in `lib/features/item_catalog/helpers/pricing_helpers.dart` → `resolveItemPrice()`.

---

## Quantity Calculation Flow

```
calculated_qty = FormulaEngine.evaluate(formula_string, variable_map)
order_qty = calculated_qty × (1 + waste_pct / 100)
```

`variable_map` is built by combining:
- Input values (keyed by input label, lowercased + underscored)
- Item spec values (`length_in`, `width_in`, `height_depth_in`, `spread_rate_sqft_per_inch`, `face_feet`, plus any `extra_specs` keys)

---

## Material Configuration Types

System-defined config types. Math is pre-baked per type — Codex must implement each exactly.

| Config Type | Roles | Calc Logic |
|---|---|---|
| `paver_patio` | `field` (area_pct of sf), `border_soldier` (lf ÷ width_in/12), `border_sailor` (lf ÷ length_in/12) | field qty = area × area_pct; border qtys from LF input |
| `wall` | `block` (lf × height ÷ face_feet), `cap` (lf ÷ face_feet) | block and cap from LF + height inputs |
| `flagstone` | `field` (sf by area_pct), `border` (lf) | field qty = area × area_pct |
| `mulch_bed` | `mulch` (area ÷ spread_rate × depth), `edging` (lf) | mulch uses spread_rate_sqft_per_inch spec |
| `sod` | `sod` (sf), `soil_amendment` (area × depth) | straight area calculations |
| `rock_bed` | `rock` (area × depth / 27), `edging` (lf) | rock converted to cubic yards |
| `turf` | `turf` (sf), `infill` (sf), `edging` (lf) | straight area |

**Color auto-generation:** When items assigned to a config have `color` populated, the system generates a color picker dropdown from those values at estimate time. Selecting a color resolves to the specific catalog item for that role.

---

## Page States

| State | Description |
|---|---|
| Loading | Fetching — show shimmer list |
| Loaded | Data present — show content |
| Empty | No records — show empty state with CTA |
| Error | Fetch failed — show error view with retry |
| Editing | Form open for create or edit |
| Price Review | Overdue pricing items surfaced — show review prompt |

---

## UI Behavior

### Item Catalog List Screen

**Loaded state:**
- List of catalog items, searchable by name
- Filter by category/unit type
- Price review alert badge on items where `today > last_price_updated_at + price_review_frequency_days`
- "Needs Review" filter toggle — shows only overdue items

**Empty state:**
- Message: "No catalog items yet"
- Action: "Add Item"

**Interactions:**
- Tap item → navigate to detail
- Tap "Add Item" → navigate to create screen
- Tap "Needs Review" badge → opens price review workflow

---

### Item Catalog Detail Screen

**Loaded state:**
- Item name, unit, description
- Specs section (dimensions, spread rate, face feet, extra specs)
- Pricing section: default cost, sell price, markup %, waste %
- Supplier pricing list: each linked supplier with unit_cost, last_price_date, is_preferred badge
- Price review reminder info (frequency, last reviewed, next due)
- Auto-increase settings if configured
- Rounding rules (quantity_type, round_to, minimum_qty, package_unit)

**Interactions:**
- Tap supplier row → navigate to supplier detail
- Tap "Edit" → navigate to edit screen
- Tap "Mark Reviewed" (if overdue) → resets `last_price_updated_at` to today

---

### Item Catalog Create/Edit Screen

**Fields:**
- Name (required)
- Unit (required — text, e.g. "yard", "sf", "each")
- Description (optional)
- Default cost (numeric)
- Default sell price (numeric — if set, skips cost+markup)
- Default markup % (numeric — overrides org default)
- Waste % (numeric, default 0)
- Color (text, optional — used for auto color pickers in configs)
- Quantity type (whole / decimal toggle)
- Round to (numeric, optional)
- Minimum qty (numeric, optional)
- Package unit (text, optional)
- Price review frequency days (numeric, optional)
- Auto-increase % and months (numeric pair, optional)
- Specs section: length, width, height/depth, spread rate, face feet, extra specs (key/value pairs)
- Supplier links: add/remove suppliers with SKU, supplier item name, unit cost, is_preferred toggle

**Validation:**
- Name required
- Unit required
- Only one supplier can have `is_preferred = true`
- If `default_sell_price` is set, markup is ignored (show info hint)

---

### Price Review Workflow

- List of items where review is overdue, sorted by most overdue first
- Each row shows: item name, current cost, last reviewed date, days overdue
- Tap row → opens inline edit for cost/price → save resets `last_price_updated_at`
- "Mark All Reviewed" button (confirms current prices without editing)

---

### Supplier List Screen

**Loaded state:**
- List of suppliers with name, location count, active status
- Search by name

**Empty state:**
- Message: "No suppliers yet"
- Action: "Add Supplier"

---

### Supplier Detail Screen

- Supplier name, contact, phone, email, website
- Locations sub-list: each location with address, lat/lng, is_primary badge
- Items carried (reverse lookup from `catalog_item_suppliers`) — read only list

**Interactions:**
- Tap location → inline edit
- Tap "Add Location" → inline create form
- Tap "Edit" → edit supplier

---

### Supplier Create/Edit Screen

**Fields:**
- Name (required)
- Contact name, phone, email, website (all optional)
- Locations (add at least one recommended) — street, city, state, zip, lat/lng, is_primary, is_active

---

### Partner List + Detail + Create/Edit

Same pattern as suppliers — list, detail, create/edit. Fields: company name, contact name, phone, email, trade type, notes, is_active.

---

### Material Configuration Builder

**List screen:**
- Configs grouped by config_type
- Search by name
- Color swatch preview if color is populated

**Create/Edit screen:**
- Config type picker (system enum — drives available roles)
- Name
- For each role defined by the config type:
  - Catalog item picker (search + select from catalog_items)
  - area_pct field (for field roles)
  - Orientation picker (soldier/sailor — for border roles)
- Color field auto-populated from selected items' `color` values
- is_active toggle

**Validation:**
- All required roles for the config type must have a catalog item assigned before saving

---

### Product Catalog List Screen

**Loaded state:**
- Products grouped by category (Hardscape, Softscape, Drainage, Irrigation, Maintenance, Snow, Other)
- System templates visually distinct (labeled "System" or different background)
- Search by name
- Active/inactive toggle

**Empty state:**
- Message: "No products yet"
- Action: "Add Product"

---

### Product Catalog Detail Screen

- Name, category, pricing mode, install rate, minimum hours, labor/equipment rate overrides
- Inputs list: each input with label, type, unit, required
- Components list: each component with label, type, formula string
- "System Template" badge if `is_system_template = true`

---

### Product Catalog Create/Edit Screen (Form Designer)

**Header fields:**
- Name (required)
- Category (enum picker)
- Pricing mode (cost_plus / flat_rate / per_sf / t_and_m)
- Install rate (hrs per unit, optional)
- Minimum hours (optional)
- Flat rate price (only shown if pricing_mode = flat_rate)
- Labor rate override (optional)
- Equipment rate override (optional)
- Default description (optional — pre-fills estimate line item)
- QB item code (optional)
- is_active toggle

**Inputs builder:**
- Add / remove / reorder inputs (drag handle)
- Each input: label, input_type (number / item_dropdown / color_dropdown / config_dropdown / custom_dropdown / text), unit_label, is_required, default_value
- For `custom_dropdown`: inline list editor for options
- For `item_dropdown`: no extra config (item is selected at estimate time)
- For `config_dropdown`: config_type filter picker (limits which configs appear at estimate time)

**Components builder:**
- Add / remove / reorder components (drag handle)
- Each component: label, component_type (catalog_item / material_configuration / labor / equipment / partner), optional fixed catalog_item_id or input_ref (which input drives selection), qty_formula string
- Formula field: text input — user types formula referencing input labels and spec keys

**Validation:**
- Name required
- Each component must have a qty_formula
- Formula strings are not validated at save time — validated at evaluation time (FormulaEngine returns error state on bad formula)

**System template behavior:**
- All fields editable
- Delete button disabled — cannot delete system templates

---

## Formula Engine

`lib/features/product_catalog/helpers/formula_engine.dart`

**Interface:**
```dart
class FormulaEngine {
  static FormulaResult evaluate(String formula, Map<String, double> variables);
}

class FormulaResult {
  final double? value;   // null if error
  final String? error;   // null if success
}
```

**Variable map keys:**
- Input labels: lowercased, spaces → underscores (e.g. "Total Area" → `total_area`)
- Item spec keys: `length_in`, `width_in`, `height_depth_in`, `spread_rate_sqft_per_inch`, `face_feet`
- Extra specs: whatever keys are in the `extra_specs` jsonb map

**Behavior:**
- Uses `math_expressions` package to parse and evaluate formula string
- Returns `FormulaResult(value: result)` on success
- Returns `FormulaResult(error: "...")` if formula fails to parse or variable is missing
- Never throws — all errors caught and returned as `FormulaResult.error`
- Missing variable = error, not zero — prevents silent wrong calculations

**Example formulas:**
```
area / spread_rate_sqft_per_inch * depth    ← mulch
area * area_pct                             ← paver field
lf / (width_in / 12)                       ← border soldier
lf * height / face_feet                    ← wall block
area * depth / 27                          ← rock (cubic yards)
```

---

## System-Seeded Product Templates

All seeded as `is_system_template = true`. Formula strings and full inputs/components are Backtrack P2 — seeded here as shell records (name + category + pricing_mode only).

**Hardscape:** Paver Patio, Paver Walkway, Paver Driveway, Flagstone Patio, Flagstone Walkway, Flagstone Steps, Step Units, Retaining Wall (block), Boulder Wall, Seat Wall, Block Border, 3/4" Rock Bed, 1.5" Rock Bed, 2"+ Rock / Boulders, Breeze / Decomposed Granite Path, Breeze / Decomposed Granite Patio, Artificial Turf, Concrete (subcontractor), Site Prep / Demo, T&M Structure

**Softscape:** Mulch Bed, Sod Installation, Seeding, Plants #1, Plants #5, Plants #10–#25, Trees, Water Feature

**Drainage:** French Drain, Catch Basin, Dry Well, Downspout / Drain Tile, Dry Creek Bed

**Irrigation:** Irrigation Zone Installation, Irrigation Valve Replacement, Backflow Preventer, Head Replacement / Adjustment

**Maintenance:** Mowing, Spring Cleanup, Fall Cleanup, Fertilization / Treatment, Irrigation Blowout, Irrigation Activation

**Snow:** Plowing, Salting, Shoveling / Hand Work

Seed these via a Supabase migration (not Edge Function) — static data, no org_id dependency issues. Use `INSERT ... ON CONFLICT DO NOTHING` on name + is_system_template.

> Note: Irrigation and plant templates are marked complex — full inputs/formulas deferred to Backtrack P2.

---

## Data

**Reads:**
- `catalog_items` — list, search, pricing resolution
- `catalog_item_specs` — for formula variable injection
- `catalog_item_suppliers` — for pricing hierarchy and preferred vendor
- `suppliers`, `supplier_locations` — supplier management and proximity lookup
- `partners` — subcontractor management
- `material_configurations`, `material_configuration_roles` — config builder and estimate-time color picker
- `product_catalog`, `product_catalog_inputs`, `product_catalog_components` — form designer and formula evaluation
- `org_settings` — `material_markup_pct`, `subcontractor_markup_pct`, labor rates (for pricing defaults)

**Writes:**
- All tables above — full CRUD within org scope
- `catalog_items.last_price_updated_at` — reset on price review confirmation
- `catalog_items.default_cost` + `price_next_increase_date` — updated by auto-increase scheduler

**Supabase tables involved:**
- `catalog_items` — ref: `docs/data_structure.md#catalog_items`
- `catalog_item_specs` — ref: `docs/data_structure.md#catalog_item_specs`
- `catalog_item_suppliers` — ref: `docs/data_structure.md#catalog_item_suppliers`
- `suppliers` — ref: `docs/data_structure.md#suppliers`
- `supplier_locations` — ref: `docs/data_structure.md#supplier_locations`
- `partners` — ref: `docs/data_structure.md#partners`
- `material_configurations` — ref: `docs/data_structure.md#material_configurations`
- `material_configuration_roles` — ref: `docs/data_structure.md#material_configuration_roles`
- `product_catalog` — ref: `docs/data_structure.md#product_catalog`
- `product_catalog_inputs` — ref: `docs/data_structure.md#product_catalog_inputs`
- `product_catalog_components` — ref: `docs/data_structure.md#product_catalog_components`

---

## Edge Cases & Rules

- **Preferred supplier constraint:** Only one `catalog_item_suppliers` row per `catalog_item_id` can have `is_preferred = true`. Enforce in service layer — on setting a new preferred, clear the flag on all others for that item.
- **Formula missing variable:** FormulaEngine must return an error result, not crash and not return 0. The estimate UI will surface this as an inline error on the component row.
- **System templates:** `is_system_template = true` records cannot be deleted. Service layer must enforce this — return an error if delete is attempted on a system template.
- **Config type roles:** Each config type has a fixed set of required roles defined in the spec. Validation must ensure all required roles are assigned before a config can be saved.
- **Auto-increase:** Only applies to `default_cost` — never to `default_sell_price`. If both are set, auto-increase still only touches `default_cost`.
- **Supabase calls:** All DB calls in service layer only — never from widgets or providers directly.
- **build_runner:** Must run after any `@riverpod` or `@freezed` change.
- **Nearest supplier:** Distance calculation uses Haversine formula or simple Euclidean approximation on lat/lng — does not require a maps API. Used for suggestion only, not hard routing.

---

## Code Map

> Updated as code is written. Codex fills this in during TASK-024 through TASK-028.

### Functions

_(Codex adds entries here as functions are implemented)_

### Key Files

| File | Purpose |
|---|---|
| `lib/features/item_catalog/item_catalog_service.dart` | CRUD + list + pricing hierarchy resolution |
| `lib/features/item_catalog/supplier_service.dart` | Supplier + location CRUD, nearest location calc |
| `lib/features/item_catalog/partner_service.dart` | Partner CRUD |
| `lib/features/item_catalog/helpers/pricing_helpers.dart` | `resolveItemPrice()` — 4-step pricing hierarchy |
| `lib/features/item_catalog/helpers/supplier_helpers.dart` | Nearest supplier location by lat/lng |
| `lib/features/item_catalog/item_catalog_list_notifier.dart` | Riverpod — paginated item list |
| `lib/features/item_catalog/item_catalog_detail_notifier.dart` | Riverpod — single item with specs + suppliers |
| `lib/features/item_catalog/layouts/mobile/item_catalog_list_screen_mobile.dart` | Item list UI |
| `lib/features/item_catalog/layouts/mobile/item_catalog_detail_screen_mobile.dart` | Item detail UI |
| `lib/features/item_catalog/layouts/mobile/item_catalog_edit_screen_mobile.dart` | Item create/edit UI |
| `lib/features/item_catalog/layouts/mobile/price_review_screen_mobile.dart` | Price review workflow |
| `lib/features/item_catalog/layouts/mobile/supplier_list_screen_mobile.dart` | Supplier list UI |
| `lib/features/item_catalog/layouts/mobile/supplier_detail_screen_mobile.dart` | Supplier detail + locations |
| `lib/features/item_catalog/layouts/mobile/partner_list_screen_mobile.dart` | Partner list UI |
| `lib/features/product_catalog/product_catalog_service.dart` | Product catalog CRUD |
| `lib/features/product_catalog/material_config_service.dart` | Material config CRUD |
| `lib/features/product_catalog/helpers/formula_engine.dart` | FormulaEngine — math_expressions wrapper |
| `lib/features/product_catalog/product_catalog_list_notifier.dart` | Riverpod — product list by category |
| `lib/features/product_catalog/product_catalog_detail_notifier.dart` | Riverpod — single product with inputs + components |
| `lib/features/product_catalog/layouts/mobile/product_catalog_list_screen_mobile.dart` | Product list UI |
| `lib/features/product_catalog/layouts/mobile/product_catalog_edit_screen_mobile.dart` | Form designer UI |
| `lib/features/product_catalog/layouts/mobile/material_config_edit_screen_mobile.dart` | Config builder UI |
| `supabase/migrations/[timestamp]_catalog.sql` | All catalog + product catalog tables + RLS |
| `supabase/migrations/[timestamp]_catalog_seed.sql` | System-seeded product templates |
