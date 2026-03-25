# Data Structure · Freedom App 2.0

> Full Supabase schema and RLS patterns. Claude reviews all schema changes before execution.
> Reference this before any DB interaction — RLS silently blocks writes.

---

## Org / User Architecture

Every project uses this model without exception.

```
auth.users              — Supabase managed
    ↓ trigger
profiles                — 1:1 with auth.users, auto-created
    ↓
org_members             — junction: which profile belongs to which org
    ↓
organizations           — the tenant
```

**Employee records** are the operational identity in this app. `employees.supabase_auth_uid` links to `auth.users`. All business records (estimates, jobs, clients) reference `employees`, not `profiles`.

---

## Standard Columns

Every table includes:
```sql
org_id      uuid        NOT NULL REFERENCES organizations(id)
created_at  timestamptz DEFAULT now()
updated_at  timestamptz DEFAULT now()  -- managed by trigger
```

---

## Core Auth Tables

### organizations
```sql
CREATE TABLE organizations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
```

### profiles
```sql
CREATE TABLE profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        text,
  full_name    text,
  avatar_url   text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
```

### org_members
```sql
CREATE TABLE org_members (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  profile_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role         text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at   timestamptz DEFAULT now(),
  UNIQUE(org_id, profile_id)
);
```

---

## Auto-Create Profile Trigger

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## RLS Policy Patterns

### Org-scoped SELECT (all members can read)
```sql
CREATE POLICY "org members can view"
ON [table_name] FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE profile_id = auth.uid()
  )
);
```

### Org-scoped INSERT/UPDATE (admin/owner only)
```sql
CREATE POLICY "admins can insert"
ON [table_name] FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT org_id FROM org_members
    WHERE profile_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);
```

### Own-profile UPDATE
```sql
CREATE POLICY "users can update own profile"
ON profiles FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
```

---

## Module Tables

---

### Employees & Permissions

#### roles
```sql
CREATE TABLE roles (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id),
  name        text NOT NULL,
  is_system   bool NOT NULL DEFAULT false,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);
```

**System roles seeded on org creation:** Owner, Executive, Operations Director, Manager, Sales/Estimator, Marketing, Crew Lead/PM, Fleet Manager, Driver, Field

#### role_permissions
```sql
CREATE TABLE role_permissions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id),
  role_id         uuid NOT NULL REFERENCES roles(id),
  permission_key  text NOT NULL,
  granted         bool NOT NULL DEFAULT true
);
```

#### employees
```sql
CREATE TABLE employees (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid NOT NULL REFERENCES organizations(id),
  supabase_auth_uid       uuid REFERENCES auth.users(id),
  role_id                 uuid NOT NULL REFERENCES roles(id),
  first_name              text NOT NULL,
  last_name               text NOT NULL,
  display_name            text,
  personal_email          text,
  company_email           text,
  phone                   text,
  address                 text,
  birthday                date,
  start_date              date,
  end_date                date,
  employee_title          text,
  employee_position       text,
  employment_type         text CHECK (employment_type IN ('full_time','part_time','temporary','temp_agency','contractor','seasonal')),
  employee_status         text NOT NULL DEFAULT 'active' CHECK (employee_status IN ('active','on_leave','terminated','resigned')),
  crew_id                 uuid,
  on_vehicle_insurance    bool NOT NULL DEFAULT false,
  has_company_card        bool NOT NULL DEFAULT false,
  company_card_last_four  text,
  is_sales                bool NOT NULL DEFAULT false,
  tracks_hours            bool NOT NULL DEFAULT true,
  drivers_license_number  text,
  drivers_license_state   text,
  drivers_license_class   text,
  drivers_license_expiry  date,
  medical_card_expiry     date,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);
```

#### employee_invites
```sql
CREATE TABLE employee_invites (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id),
  employee_id  uuid NOT NULL REFERENCES employees(id),
  email        text NOT NULL,
  token        text NOT NULL UNIQUE,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired','revoked')),
  invited_by   uuid REFERENCES employees(id),
  invited_at   timestamptz DEFAULT now(),
  accepted_at  timestamptz,
  expires_at   timestamptz NOT NULL
);
```

#### employee_permission_overrides
```sql
CREATE TABLE employee_permission_overrides (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id),
  employee_id     uuid NOT NULL REFERENCES employees(id),
  permission_key  text NOT NULL,
  granted         bool NOT NULL,
  UNIQUE(employee_id, permission_key)
);
```

#### employee_compensation
```sql
CREATE TABLE employee_compensation (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES organizations(id),
  employee_id    uuid NOT NULL REFERENCES employees(id),
  pay_type       text NOT NULL CHECK (pay_type IN ('hourly','salary')),
  pay_rate       numeric NOT NULL,
  effective_date date NOT NULL,
  end_date       date,
  reason         text,
  created_by     uuid REFERENCES employees(id),
  created_at     timestamptz DEFAULT now()
);
```

#### employee_preferences
```sql
CREATE TABLE employee_preferences (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES organizations(id),
  employee_id          uuid NOT NULL REFERENCES employees(id) UNIQUE,
  dashboard_config     jsonb,
  notification_config  jsonb,
  project_item_filter  jsonb,
  route_select         text,
  updated_at           timestamptz DEFAULT now()
);
```

#### custom_field_definitions
```sql
CREATE TABLE custom_field_definitions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id),
  entity_type  text NOT NULL CHECK (entity_type IN ('employee','client','estimate','job')),
  name         text NOT NULL,
  field_type   text NOT NULL CHECK (field_type IN ('boolean','enum','file','file_enum','text','date','number')),
  options      jsonb,
  is_required  bool NOT NULL DEFAULT false,
  sort_order   int NOT NULL DEFAULT 0,
  is_active    bool NOT NULL DEFAULT true,
  created_at   timestamptz DEFAULT now()
);
```

#### custom_field_values
```sql
CREATE TABLE custom_field_values (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                      uuid NOT NULL REFERENCES organizations(id),
  custom_field_definition_id  uuid NOT NULL REFERENCES custom_field_definitions(id),
  entity_type                 text NOT NULL,
  entity_id                   uuid NOT NULL,
  value_boolean               bool,
  value_enum                  text,
  value_text                  text,
  value_date                  date,
  value_number                numeric,
  file_url                    text,
  created_at                  timestamptz DEFAULT now(),
  updated_at                  timestamptz DEFAULT now()
);
```

---

### Crews

```sql
CREATE TABLE crews (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id),
  name         text NOT NULL,
  crew_lead_id uuid REFERENCES employees(id),
  is_active    bool NOT NULL DEFAULT true,
  notes        text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
```

---

### Equipment & Fleet

```sql
CREATE TABLE equipment (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL REFERENCES organizations(id),
  name                  text NOT NULL,
  type                  text NOT NULL CHECK (type IN ('truck','trailer','equipment','attachment')),
  make                  text,
  model                 text,
  year                  int,
  vin_serial            text,
  license_plate         text,
  dot_number            text,
  registration_expiry   date,
  insurance_expiry      date,
  annual_inspection_due date,
  is_shareable          bool NOT NULL DEFAULT false,
  is_active             bool NOT NULL DEFAULT true,
  notes                 text,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE TABLE equipment_assignments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES organizations(id),
  equipment_id   uuid NOT NULL REFERENCES equipment(id),
  crew_id        uuid NOT NULL REFERENCES crews(id),
  assigned_date  date NOT NULL,
  notes          text,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE equipment_schedule (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id),
  equipment_id uuid NOT NULL REFERENCES equipment(id),
  crew_id      uuid REFERENCES crews(id),
  job_id       uuid,
  start_date   date NOT NULL,
  end_date     date,
  notes        text,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE equipment_requests (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES organizations(id),
  equipment_id   uuid NOT NULL REFERENCES equipment(id),
  crew_id        uuid NOT NULL REFERENCES crews(id),
  job_id         uuid,
  requested_by   uuid REFERENCES employees(id),
  start_date     date NOT NULL,
  end_date       date,
  status         text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','denied')),
  reviewed_by    uuid REFERENCES employees(id),
  reviewed_at    timestamptz,
  notes          text,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE TABLE equipment_maintenance (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL REFERENCES organizations(id),
  equipment_id          uuid NOT NULL REFERENCES equipment(id),
  type                  text NOT NULL,
  performed_date        date NOT NULL,
  mileage               int,
  next_service_date     date,
  next_service_mileage  int,
  performed_by          text,
  cost                  numeric,
  notes                 text,
  receipt_url           text,
  created_at            timestamptz DEFAULT now()
);

CREATE TABLE vehicle_inspections (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(id),
  equipment_id     uuid NOT NULL REFERENCES equipment(id),
  driver_id        uuid NOT NULL REFERENCES employees(id),
  inspection_type  text NOT NULL CHECK (inspection_type IN ('pre_trip','post_trip')),
  inspection_date  date NOT NULL,
  odometer         int,
  passed           bool NOT NULL,
  defects          jsonb,
  driver_signature text,
  notes            text,
  created_at       timestamptz DEFAULT now()
);
```

---

### Clients

```sql
CREATE TABLE clients (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                 uuid NOT NULL REFERENCES organizations(id),
  is_company             bool NOT NULL DEFAULT false,
  company_name           text,
  first_name             text NOT NULL,
  last_name              text NOT NULL,
  display_name           text,
  phone                  text,
  email                  text,
  quickbooks_customer_id text,
  client_type_id         uuid,
  sales_lead             uuid REFERENCES employees(id),
  referral_funnel_id     uuid,
  referral_source_id     uuid,
  payment_terms_id       uuid,
  contact_frequency      text CHECK (contact_frequency IN ('monthly','quarterly','bi-annually','annually','custom')),
  contact_frequency_days int,
  last_contacted         date,
  next_contact           date,
  is_previous_customer   bool NOT NULL DEFAULT false,
  is_incomplete          bool NOT NULL DEFAULT true,
  has_portal_access      bool NOT NULL DEFAULT false,
  notes                  text,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

CREATE TABLE client_addresses (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES organizations(id),
  client_id      uuid NOT NULL REFERENCES clients(id),
  type           text NOT NULL CHECK (type IN ('billing','job_site','both')),
  is_primary     bool NOT NULL DEFAULT false,
  street_address text NOT NULL,
  city           text NOT NULL,
  state          text NOT NULL,
  zip            text NOT NULL,
  lat            numeric,
  lng            numeric,
  notes          text,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE client_contacts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id),
  client_id  uuid NOT NULL REFERENCES clients(id),
  first_name text NOT NULL,
  last_name  text,
  phone      text,
  email      text,
  role       text,
  is_primary bool NOT NULL DEFAULT false,
  notes      text,
  created_at timestamptz DEFAULT now()
);
```

### Lookup / Reference Tables

```sql
CREATE TABLE client_types (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id),
  name       text NOT NULL,
  color      text,
  sort_order int NOT NULL DEFAULT 0,
  is_active  bool NOT NULL DEFAULT true
);

CREATE TABLE tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id     uuid NOT NULL REFERENCES organizations(id),
  name       text NOT NULL,
  color      text,
  sort_order int NOT NULL DEFAULT 0,
  is_active  bool NOT NULL DEFAULT true
);

CREATE TABLE client_tags (
  client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  tag_id    uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (client_id, tag_id)
);

CREATE TABLE referral_funnels (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(id),
  name             text NOT NULL,
  requires_source  bool NOT NULL DEFAULT false,
  sort_order       int NOT NULL DEFAULT 0,
  is_active        bool NOT NULL DEFAULT true
);

CREATE TABLE referral_sources (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid NOT NULL REFERENCES organizations(id),
  referral_funnel_id uuid NOT NULL REFERENCES referral_funnels(id),
  name               text NOT NULL,
  is_active          bool NOT NULL DEFAULT true
);

CREATE TABLE payment_terms (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id              uuid NOT NULL REFERENCES organizations(id),
  name                text NOT NULL,
  days_until_due      int NOT NULL,
  quickbooks_term_id  text,
  sort_order          int NOT NULL DEFAULT 0,
  is_active           bool NOT NULL DEFAULT true
);
```

### Communications

```sql
CREATE TABLE communications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id),
  client_id    uuid NOT NULL REFERENCES clients(id),
  estimate_id  uuid,
  job_id       uuid,
  method       text NOT NULL CHECK (method IN ('phone','email','text','in_person','portal_message')),
  direction    text NOT NULL CHECK (direction IN ('inbound','outbound')),
  result       text CHECK (result IN ('spoke_with_client','left_voicemail','no_answer','email_sent','meeting_held','other')),
  notes        text,
  logged_by    uuid REFERENCES employees(id),
  occurred_at  timestamptz NOT NULL,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
```

---

### Org Settings

```sql
CREATE TABLE org_settings (
  id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                       uuid NOT NULL REFERENCES organizations(id) UNIQUE,
  company_name                 text,
  company_phone                text,
  company_email                text,
  company_website              text,
  company_address              text,
  logo_url                     text,
  primary_color                text,
  secondary_color              text,
  accent_color                 text,
  font_preference              text,
  estimate_footer_text         text,
  invoice_footer_text          text,
  equipment_approval_required  bool NOT NULL DEFAULT false,
  equipment_approval_role_id   uuid,
  portal_enabled               bool NOT NULL DEFAULT false,
  portal_subdomain             text,
  charges_tax                  bool NOT NULL DEFAULT false,
  default_tax_rate             numeric,
  labor_rate_install           numeric,
  labor_rate_equipment_op      numeric,
  labor_rate_design            numeric,
  material_markup_pct          numeric,
  subcontractor_markup_pct     numeric,
  updated_at                   timestamptz DEFAULT now()
);
```

---

### Notes & Tasks (Global)

```sql
CREATE TABLE notes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id),
  entity_type  text NOT NULL CHECK (entity_type IN ('client','estimate','job','employee','equipment','general')),
  entity_id    uuid NOT NULL,
  body         text NOT NULL,
  author_id    uuid REFERENCES employees(id),
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE TABLE note_attachments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id),
  note_id      uuid NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  file_url     text NOT NULL,
  file_type    text,
  file_name    text,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE tasks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id),
  entity_type  text CHECK (entity_type IN ('client','estimate','job','employee','general')),
  entity_id    uuid,
  title        text NOT NULL,
  description  text,
  assignee_id  uuid REFERENCES employees(id),
  due_date     date,
  priority     text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  completed_at timestamptz,
  completed_by uuid REFERENCES employees(id),
  created_by   uuid REFERENCES employees(id),
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
```

---

### Item Catalog & Suppliers

```sql
CREATE TABLE suppliers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id),
  name         text NOT NULL,
  contact_name text,
  phone        text,
  email        text,
  website      text,
  is_active    bool NOT NULL DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE supplier_locations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES organizations(id),
  supplier_id    uuid NOT NULL REFERENCES suppliers(id),
  name           text NOT NULL,
  street_address text,
  city           text,
  state          text,
  zip            text,
  lat            numeric,
  lng            numeric,
  phone          text,
  is_primary     bool NOT NULL DEFAULT false,
  is_active      bool NOT NULL DEFAULT true,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE catalog_items (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                      uuid NOT NULL REFERENCES organizations(id),
  name                        text NOT NULL,
  description                 text,
  unit                        text NOT NULL,
  default_cost                numeric,
  default_sell_price          numeric,
  default_markup_pct          numeric,
  waste_pct                   numeric NOT NULL DEFAULT 0,
  last_price_updated_at       date,
  price_review_frequency_days int,
  price_auto_increase_pct     numeric,
  price_auto_increase_months  int,
  price_next_increase_date    date,
  color                       text,
  quantity_type               text NOT NULL DEFAULT 'decimal' CHECK (quantity_type IN ('whole','decimal')),
  round_to                    numeric,
  minimum_qty                 numeric,
  package_unit                text,
  is_active                   bool NOT NULL DEFAULT true,
  sort_order                  int NOT NULL DEFAULT 0,
  created_at                  timestamptz DEFAULT now(),
  updated_at                  timestamptz DEFAULT now()
);

CREATE TABLE catalog_item_specs (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                   uuid NOT NULL REFERENCES organizations(id),
  catalog_item_id          uuid NOT NULL REFERENCES catalog_items(id),
  length_in                numeric,
  width_in                 numeric,
  height_depth_in          numeric,
  spread_rate_sqft_per_inch numeric,
  face_feet                numeric,
  extra_specs              jsonb,
  created_at               timestamptz DEFAULT now()
);

CREATE TABLE catalog_item_suppliers (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES organizations(id),
  catalog_item_id      uuid NOT NULL REFERENCES catalog_items(id),
  supplier_id          uuid NOT NULL REFERENCES suppliers(id),
  supplier_location_id uuid REFERENCES supplier_locations(id),
  is_preferred         bool NOT NULL DEFAULT false,
  supplier_sku         text,
  supplier_item_name   text,
  unit_cost            numeric,
  last_price_date      date,
  created_at           timestamptz DEFAULT now()
);

CREATE TABLE partners (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id       uuid NOT NULL REFERENCES organizations(id),
  company_name text NOT NULL,
  contact_name text,
  phone        text,
  email        text,
  trade_type   text,
  notes        text,
  is_active    bool NOT NULL DEFAULT true,
  created_at   timestamptz DEFAULT now()
);
```

---

### Product Catalog

```sql
CREATE TABLE material_configurations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id),
  name        text NOT NULL,
  config_type text NOT NULL CHECK (config_type IN ('paver_patio','wall','mulch_bed','sod','flagstone','rock_bed','turf')),
  color       text,
  is_active   bool NOT NULL DEFAULT true,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE material_configuration_roles (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(id),
  configuration_id uuid NOT NULL REFERENCES material_configurations(id),
  role_key         text NOT NULL,
  catalog_item_id  uuid NOT NULL REFERENCES catalog_items(id),
  area_pct         numeric,
  orientation      text CHECK (orientation IN ('soldier','sailor')),
  sort_order       int NOT NULL DEFAULT 0
);

CREATE TABLE product_catalog (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid NOT NULL REFERENCES organizations(id),
  name                    text NOT NULL,
  category                text NOT NULL CHECK (category IN ('hardscape','softscape','drainage','maintenance','snow','irrigation','other')),
  pricing_mode            text NOT NULL DEFAULT 'cost_plus' CHECK (pricing_mode IN ('cost_plus','flat_rate','per_sf','t_and_m')),
  install_rate            numeric,
  minimum_hours           numeric,
  flat_rate_price         numeric,
  labor_rate_override     numeric,
  equipment_rate_override numeric,
  default_description     text,
  quickbooks_item_code    text,
  is_system_template      bool NOT NULL DEFAULT false,
  is_active               bool NOT NULL DEFAULT true,
  sort_order              int NOT NULL DEFAULT 0,
  created_at              timestamptz DEFAULT now(),
  updated_at              timestamptz DEFAULT now()
);

CREATE TABLE product_catalog_inputs (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id             uuid NOT NULL REFERENCES organizations(id),
  product_catalog_id uuid NOT NULL REFERENCES product_catalog(id),
  label              text NOT NULL,
  input_type         text NOT NULL CHECK (input_type IN ('number','item_dropdown','color_dropdown','config_dropdown','custom_dropdown','text')),
  unit_label         text,
  is_required        bool NOT NULL DEFAULT true,
  default_value      text,
  custom_options     jsonb,
  sort_order         int NOT NULL DEFAULT 0
);

CREATE TABLE product_catalog_components (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid NOT NULL REFERENCES organizations(id),
  product_catalog_id      uuid NOT NULL REFERENCES product_catalog(id),
  label                   text NOT NULL,
  component_type          text NOT NULL CHECK (component_type IN ('catalog_item','material_configuration','labor','equipment','partner')),
  catalog_item_id         uuid REFERENCES catalog_items(id),
  input_ref               text,
  configuration_input_ref text,
  qty_formula             text NOT NULL,
  sort_order              int NOT NULL DEFAULT 0
);
```

---

### Estimates

```sql
CREATE TABLE estimate_types (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES organizations(id),
  name                 text NOT NULL,
  prefix               text NOT NULL,
  next_number          int NOT NULL DEFAULT 1,
  requires_signature   bool NOT NULL DEFAULT false,
  contract_template_id uuid,
  estimate_template_id uuid,
  is_active            bool NOT NULL DEFAULT true,
  sort_order           int NOT NULL DEFAULT 0
);

CREATE TABLE estimate_sub_statuses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES organizations(id),
  parent_status text NOT NULL CHECK (parent_status IN ('lead','estimate','approved','declined','on_hold','converted')),
  name          text NOT NULL,
  color         text,
  sort_order    int NOT NULL DEFAULT 0,
  is_active     bool NOT NULL DEFAULT true
);

CREATE TABLE estimates (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES organizations(id),
  estimate_number      text NOT NULL,
  estimate_type_id     uuid NOT NULL REFERENCES estimate_types(id),
  client_id            uuid NOT NULL REFERENCES clients(id),
  sales_lead_id        uuid REFERENCES employees(id),
  job_site_address_id  uuid REFERENCES client_addresses(id),
  billing_address_id   uuid REFERENCES client_addresses(id),
  main_status          text NOT NULL DEFAULT 'lead' CHECK (main_status IN ('lead','estimate','approved','declined','on_hold','converted')),
  sub_status_id        uuid REFERENCES estimate_sub_statuses(id),
  declined_reason      text,
  default_labor_rate   numeric,
  total_amount         numeric NOT NULL DEFAULT 0,
  requires_signature   bool NOT NULL DEFAULT false,
  signed_at            timestamptz,
  signed_by            text,
  signature_url        text,
  is_recurring         bool NOT NULL DEFAULT false,
  recurrence_type      text CHECK (recurrence_type IN ('weekly','bi_weekly','monthly','seasonal','annual')),
  recurrence_start     date,
  recurrence_end       date,
  expense_bucket_id    uuid,
  is_tax_exempt        bool NOT NULL DEFAULT false,
  quickbooks_estimate_id text,
  sent_at              timestamptz,
  approved_at          timestamptz,
  converted_at         timestamptz,
  converted_to_job_id  uuid,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE TABLE estimate_contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id),
  estimate_id uuid NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  contact_id  uuid NOT NULL REFERENCES client_contacts(id),
  role        text NOT NULL CHECK (role IN ('contact_only','contact_and_billing'))
);

CREATE TABLE change_orders (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id               uuid NOT NULL REFERENCES organizations(id),
  estimate_id          uuid NOT NULL REFERENCES estimates(id),
  change_order_number  text NOT NULL,
  description          text,
  amount_delta         numeric NOT NULL DEFAULT 0,
  status               text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','pending_approval','approved','declined')),
  approved_at          timestamptz,
  approved_by          uuid REFERENCES employees(id),
  quickbooks_id        text,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

CREATE TABLE estimate_product_lines (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id),
  estimate_id uuid NOT NULL REFERENCES estimates(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  sort_order  int NOT NULL DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE service_visits (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(id),
  product_line_id  uuid NOT NULL REFERENCES estimate_product_lines(id) ON DELETE CASCADE,
  estimate_id      uuid NOT NULL REFERENCES estimates(id),
  scheduled_date   date,
  completed_date   date,
  status           text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','skipped','cancelled')),
  price_override   numeric,
  notes            text,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
```

---

### Expense Buckets

```sql
CREATE TABLE expense_buckets (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(id),
  name             text NOT NULL,
  parent_bucket_id uuid REFERENCES expense_buckets(id),
  cost_model       text CHECK (cost_model IN ('project','bucket')),
  estimate_type_id uuid REFERENCES estimate_types(id),
  is_active        bool NOT NULL DEFAULT true,
  sort_order       int NOT NULL DEFAULT 0,
  created_at       timestamptz DEFAULT now()
);

CREATE TABLE expense_splits (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id),
  expense_id  uuid NOT NULL,
  target_type text NOT NULL CHECK (target_type IN ('sub_bucket','project_line')),
  target_id   uuid NOT NULL,
  amount      numeric NOT NULL,
  created_at  timestamptz DEFAULT now()
);
```

---

### EOS / Traction

```sql
CREATE TABLE eos_scorecard_metrics (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id),
  name            text NOT NULL,
  description     text,
  owner_id        uuid REFERENCES employees(id),
  data_source     text NOT NULL CHECK (data_source IN ('auto','manual')),
  auto_query_key  text,
  goal            numeric,
  goal_direction  text CHECK (goal_direction IN ('at_least','at_most','exactly')),
  unit            text,
  is_active       bool NOT NULL DEFAULT true,
  sort_order      int NOT NULL DEFAULT 0,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE eos_scorecard_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id),
  metric_id   uuid NOT NULL REFERENCES eos_scorecard_metrics(id),
  week_start  date NOT NULL,
  value       numeric NOT NULL,
  is_on_track bool NOT NULL,
  entered_by  uuid REFERENCES employees(id),
  notes       text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE(metric_id, week_start)
);

CREATE TABLE eos_rocks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id          uuid NOT NULL REFERENCES organizations(id),
  title           text NOT NULL,
  description     text,
  owner_id        uuid REFERENCES employees(id),
  quarter         text NOT NULL,
  status          text NOT NULL DEFAULT 'on_track' CHECK (status IN ('on_track','off_track','done','dropped')),
  is_company_rock bool NOT NULL DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE TABLE eos_todos (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                 uuid NOT NULL REFERENCES organizations(id),
  title                  text NOT NULL,
  owner_id               uuid REFERENCES employees(id),
  due_date               date,
  status                 text NOT NULL DEFAULT 'open' CHECK (status IN ('open','done','dropped')),
  created_in_meeting_id  uuid,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

CREATE TABLE eos_issues (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                uuid NOT NULL REFERENCES organizations(id),
  title                 text NOT NULL,
  description           text,
  owner_id              uuid REFERENCES employees(id),
  priority              text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  status                text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','solved','dropped')),
  entity_type           text,
  entity_id             uuid,
  resolved_in_meeting_id uuid,
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);

CREATE TABLE eos_meetings (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id         uuid NOT NULL REFERENCES organizations(id),
  meeting_date   date NOT NULL,
  facilitator_id uuid REFERENCES employees(id),
  started_at     timestamptz,
  ended_at       timestamptz,
  rating         int,
  notes          text,
  created_at     timestamptz DEFAULT now()
);

CREATE TABLE eos_meeting_attendees (
  meeting_id   uuid NOT NULL REFERENCES eos_meetings(id) ON DELETE CASCADE,
  employee_id  uuid NOT NULL REFERENCES employees(id),
  was_present  bool NOT NULL DEFAULT true,
  PRIMARY KEY (meeting_id, employee_id)
);

CREATE TABLE eos_seats (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id),
  name        text NOT NULL,
  description text,
  functions   jsonb,
  employee_id uuid REFERENCES employees(id),
  sort_order  int NOT NULL DEFAULT 0,
  is_active   bool NOT NULL DEFAULT true,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE eos_auto_issue_rules (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           uuid NOT NULL REFERENCES organizations(id),
  rule_key         text NOT NULL,
  is_enabled       bool NOT NULL DEFAULT true,
  threshold_value  numeric,
  description      text,
  UNIQUE(org_id, rule_key)
);
```

---

## Placeholder: Jobs & Scheduling Schema
> TBD — workshopping in progress. Do not build until spec is confirmed.

---

## Placeholder: Expenses / Plaid Schema
> TBD — Plaid integration design pending. Will include: `expense_entries`, `plaid_accounts`, `plaid_transactions`.

---

## Placeholder: Timesheets Schema
> TBD — workshopping in progress.
