-- TASK-024: Item catalog, suppliers, and product catalog schema + RLS

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_name text,
  phone text,
  email text,
  website text,
  is_active bool not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.supplier_locations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  name text not null,
  street_address text,
  city text,
  state text,
  zip text,
  lat numeric,
  lng numeric,
  phone text,
  is_primary bool not null default false,
  is_active bool not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  unit text not null,
  default_cost numeric,
  default_sell_price numeric,
  default_markup_pct numeric,
  waste_pct numeric not null default 0,
  last_price_updated_at date,
  price_review_frequency_days int,
  price_auto_increase_pct numeric,
  price_auto_increase_months int,
  price_next_increase_date date,
  color text,
  quantity_type text not null default 'decimal' check (quantity_type in ('whole', 'decimal')),
  round_to numeric,
  minimum_qty numeric,
  package_unit text,
  is_active bool not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.catalog_item_specs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  catalog_item_id uuid not null references public.catalog_items(id) on delete cascade,
  length_in numeric,
  width_in numeric,
  height_depth_in numeric,
  spread_rate_sqft_per_inch numeric,
  face_feet numeric,
  extra_specs jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (catalog_item_id)
);

create table if not exists public.catalog_item_suppliers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  catalog_item_id uuid not null references public.catalog_items(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id) on delete cascade,
  supplier_location_id uuid references public.supplier_locations(id) on delete set null,
  is_preferred bool not null default false,
  supplier_sku text,
  supplier_item_name text,
  unit_cost numeric,
  last_price_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  company_name text not null,
  contact_name text,
  phone text,
  email text,
  trade_type text,
  notes text,
  is_active bool not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.material_configurations (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  config_type text not null check (config_type in ('paver_patio', 'wall', 'mulch_bed', 'sod', 'flagstone', 'rock_bed', 'turf')),
  color text,
  is_active bool not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.material_configuration_roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  configuration_id uuid not null references public.material_configurations(id) on delete cascade,
  role_key text not null,
  catalog_item_id uuid not null references public.catalog_items(id),
  area_pct numeric,
  orientation text check (orientation in ('soldier', 'sailor')),
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (configuration_id, role_key)
);

create table if not exists public.product_catalog (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text not null check (category in ('hardscape', 'softscape', 'drainage', 'maintenance', 'snow', 'irrigation', 'other')),
  pricing_mode text not null default 'cost_plus' check (pricing_mode in ('cost_plus', 'flat_rate', 'per_sf', 't_and_m')),
  install_rate numeric,
  minimum_hours numeric,
  flat_rate_price numeric,
  labor_rate_override numeric,
  equipment_rate_override numeric,
  default_description text,
  quickbooks_item_code text,
  is_system_template bool not null default false,
  is_active bool not null default true,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.product_catalog_inputs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_catalog_id uuid not null references public.product_catalog(id) on delete cascade,
  label text not null,
  input_type text not null check (input_type in ('number', 'item_dropdown', 'color_dropdown', 'config_dropdown', 'custom_dropdown', 'text')),
  unit_label text,
  is_required bool not null default true,
  default_value text,
  custom_options jsonb,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.product_catalog_components (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  product_catalog_id uuid not null references public.product_catalog(id) on delete cascade,
  label text not null,
  component_type text not null check (component_type in ('catalog_item', 'material_configuration', 'labor', 'equipment', 'partner')),
  catalog_item_id uuid references public.catalog_items(id),
  input_ref text,
  configuration_input_ref text,
  qty_formula text not null,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists ux_catalog_item_suppliers_preferred_per_item
on public.catalog_item_suppliers (org_id, catalog_item_id)
where is_preferred;

create unique index if not exists ux_product_catalog_name_system_template
on public.product_catalog (org_id, name, is_system_template);

create index if not exists idx_suppliers_org_id on public.suppliers (org_id);
create index if not exists idx_supplier_locations_org_id on public.supplier_locations (org_id);
create index if not exists idx_supplier_locations_supplier_id on public.supplier_locations (supplier_id);
create index if not exists idx_catalog_items_org_id on public.catalog_items (org_id);
create index if not exists idx_catalog_item_specs_org_id on public.catalog_item_specs (org_id);
create index if not exists idx_catalog_item_specs_item_id on public.catalog_item_specs (catalog_item_id);
create index if not exists idx_catalog_item_suppliers_org_id on public.catalog_item_suppliers (org_id);
create index if not exists idx_catalog_item_suppliers_item_id on public.catalog_item_suppliers (catalog_item_id);
create index if not exists idx_catalog_item_suppliers_supplier_id on public.catalog_item_suppliers (supplier_id);
create index if not exists idx_partners_org_id on public.partners (org_id);
create index if not exists idx_material_configurations_org_id on public.material_configurations (org_id);
create index if not exists idx_material_configuration_roles_org_id on public.material_configuration_roles (org_id);
create index if not exists idx_material_configuration_roles_config_id on public.material_configuration_roles (configuration_id);
create index if not exists idx_product_catalog_org_id on public.product_catalog (org_id);
create index if not exists idx_product_catalog_inputs_org_id on public.product_catalog_inputs (org_id);
create index if not exists idx_product_catalog_inputs_product_id on public.product_catalog_inputs (product_catalog_id);
create index if not exists idx_product_catalog_components_org_id on public.product_catalog_components (org_id);
create index if not exists idx_product_catalog_components_product_id on public.product_catalog_components (product_catalog_id);

create or replace function public._is_org_member(check_org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.org_members om
    where om.org_id = check_org_id
      and om.profile_id = auth.uid()
  );
$$;

create or replace function public._is_org_admin_or_owner(check_org_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.org_members om
    where om.org_id = check_org_id
      and om.profile_id = auth.uid()
      and om.role in ('owner', 'admin')
  );
$$;

alter table public.suppliers enable row level security;
alter table public.supplier_locations enable row level security;
alter table public.catalog_items enable row level security;
alter table public.catalog_item_specs enable row level security;
alter table public.catalog_item_suppliers enable row level security;
alter table public.partners enable row level security;
alter table public.material_configurations enable row level security;
alter table public.material_configuration_roles enable row level security;
alter table public.product_catalog enable row level security;
alter table public.product_catalog_inputs enable row level security;
alter table public.product_catalog_components enable row level security;

-- suppliers

drop policy if exists "suppliers_select_member" on public.suppliers;
create policy "suppliers_select_member"
on public.suppliers
for select
using (public._is_org_member(org_id));

drop policy if exists "suppliers_insert_admin_owner" on public.suppliers;
create policy "suppliers_insert_admin_owner"
on public.suppliers
for insert
to authenticated
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "suppliers_update_admin_owner" on public.suppliers;
create policy "suppliers_update_admin_owner"
on public.suppliers
for update
using (public._is_org_admin_or_owner(org_id))
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "suppliers_delete_admin_owner" on public.suppliers;
create policy "suppliers_delete_admin_owner"
on public.suppliers
for delete
using (public._is_org_admin_or_owner(org_id));

-- supplier_locations

drop policy if exists "supplier_locations_select_member" on public.supplier_locations;
create policy "supplier_locations_select_member"
on public.supplier_locations
for select
using (public._is_org_member(org_id));

drop policy if exists "supplier_locations_insert_admin_owner" on public.supplier_locations;
create policy "supplier_locations_insert_admin_owner"
on public.supplier_locations
for insert
to authenticated
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "supplier_locations_update_admin_owner" on public.supplier_locations;
create policy "supplier_locations_update_admin_owner"
on public.supplier_locations
for update
using (public._is_org_admin_or_owner(org_id))
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "supplier_locations_delete_admin_owner" on public.supplier_locations;
create policy "supplier_locations_delete_admin_owner"
on public.supplier_locations
for delete
using (public._is_org_admin_or_owner(org_id));

-- catalog_items

drop policy if exists "catalog_items_select_member" on public.catalog_items;
create policy "catalog_items_select_member"
on public.catalog_items
for select
using (public._is_org_member(org_id));

drop policy if exists "catalog_items_insert_admin_owner" on public.catalog_items;
create policy "catalog_items_insert_admin_owner"
on public.catalog_items
for insert
to authenticated
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "catalog_items_update_admin_owner" on public.catalog_items;
create policy "catalog_items_update_admin_owner"
on public.catalog_items
for update
using (public._is_org_admin_or_owner(org_id))
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "catalog_items_delete_admin_owner" on public.catalog_items;
create policy "catalog_items_delete_admin_owner"
on public.catalog_items
for delete
using (public._is_org_admin_or_owner(org_id));

-- catalog_item_specs

drop policy if exists "catalog_item_specs_select_member" on public.catalog_item_specs;
create policy "catalog_item_specs_select_member"
on public.catalog_item_specs
for select
using (public._is_org_member(org_id));

drop policy if exists "catalog_item_specs_insert_admin_owner" on public.catalog_item_specs;
create policy "catalog_item_specs_insert_admin_owner"
on public.catalog_item_specs
for insert
to authenticated
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "catalog_item_specs_update_admin_owner" on public.catalog_item_specs;
create policy "catalog_item_specs_update_admin_owner"
on public.catalog_item_specs
for update
using (public._is_org_admin_or_owner(org_id))
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "catalog_item_specs_delete_admin_owner" on public.catalog_item_specs;
create policy "catalog_item_specs_delete_admin_owner"
on public.catalog_item_specs
for delete
using (public._is_org_admin_or_owner(org_id));

-- catalog_item_suppliers

drop policy if exists "catalog_item_suppliers_select_member" on public.catalog_item_suppliers;
create policy "catalog_item_suppliers_select_member"
on public.catalog_item_suppliers
for select
using (public._is_org_member(org_id));

drop policy if exists "catalog_item_suppliers_insert_admin_owner" on public.catalog_item_suppliers;
create policy "catalog_item_suppliers_insert_admin_owner"
on public.catalog_item_suppliers
for insert
to authenticated
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "catalog_item_suppliers_update_admin_owner" on public.catalog_item_suppliers;
create policy "catalog_item_suppliers_update_admin_owner"
on public.catalog_item_suppliers
for update
using (public._is_org_admin_or_owner(org_id))
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "catalog_item_suppliers_delete_admin_owner" on public.catalog_item_suppliers;
create policy "catalog_item_suppliers_delete_admin_owner"
on public.catalog_item_suppliers
for delete
using (public._is_org_admin_or_owner(org_id));

-- partners

drop policy if exists "partners_select_member" on public.partners;
create policy "partners_select_member"
on public.partners
for select
using (public._is_org_member(org_id));

drop policy if exists "partners_insert_admin_owner" on public.partners;
create policy "partners_insert_admin_owner"
on public.partners
for insert
to authenticated
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "partners_update_admin_owner" on public.partners;
create policy "partners_update_admin_owner"
on public.partners
for update
using (public._is_org_admin_or_owner(org_id))
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "partners_delete_admin_owner" on public.partners;
create policy "partners_delete_admin_owner"
on public.partners
for delete
using (public._is_org_admin_or_owner(org_id));

-- material_configurations

drop policy if exists "material_configurations_select_member" on public.material_configurations;
create policy "material_configurations_select_member"
on public.material_configurations
for select
using (public._is_org_member(org_id));

drop policy if exists "material_configurations_insert_admin_owner" on public.material_configurations;
create policy "material_configurations_insert_admin_owner"
on public.material_configurations
for insert
to authenticated
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "material_configurations_update_admin_owner" on public.material_configurations;
create policy "material_configurations_update_admin_owner"
on public.material_configurations
for update
using (public._is_org_admin_or_owner(org_id))
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "material_configurations_delete_admin_owner" on public.material_configurations;
create policy "material_configurations_delete_admin_owner"
on public.material_configurations
for delete
using (public._is_org_admin_or_owner(org_id));

-- material_configuration_roles

drop policy if exists "material_configuration_roles_select_member" on public.material_configuration_roles;
create policy "material_configuration_roles_select_member"
on public.material_configuration_roles
for select
using (public._is_org_member(org_id));

drop policy if exists "material_configuration_roles_insert_admin_owner" on public.material_configuration_roles;
create policy "material_configuration_roles_insert_admin_owner"
on public.material_configuration_roles
for insert
to authenticated
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "material_configuration_roles_update_admin_owner" on public.material_configuration_roles;
create policy "material_configuration_roles_update_admin_owner"
on public.material_configuration_roles
for update
using (public._is_org_admin_or_owner(org_id))
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "material_configuration_roles_delete_admin_owner" on public.material_configuration_roles;
create policy "material_configuration_roles_delete_admin_owner"
on public.material_configuration_roles
for delete
using (public._is_org_admin_or_owner(org_id));

-- product_catalog

drop policy if exists "product_catalog_select_member" on public.product_catalog;
create policy "product_catalog_select_member"
on public.product_catalog
for select
using (public._is_org_member(org_id));

drop policy if exists "product_catalog_insert_admin_owner" on public.product_catalog;
create policy "product_catalog_insert_admin_owner"
on public.product_catalog
for insert
to authenticated
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "product_catalog_update_admin_owner" on public.product_catalog;
create policy "product_catalog_update_admin_owner"
on public.product_catalog
for update
using (public._is_org_admin_or_owner(org_id))
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "product_catalog_delete_admin_owner" on public.product_catalog;
create policy "product_catalog_delete_admin_owner"
on public.product_catalog
for delete
using (public._is_org_admin_or_owner(org_id));

-- product_catalog_inputs

drop policy if exists "product_catalog_inputs_select_member" on public.product_catalog_inputs;
create policy "product_catalog_inputs_select_member"
on public.product_catalog_inputs
for select
using (public._is_org_member(org_id));

drop policy if exists "product_catalog_inputs_insert_admin_owner" on public.product_catalog_inputs;
create policy "product_catalog_inputs_insert_admin_owner"
on public.product_catalog_inputs
for insert
to authenticated
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "product_catalog_inputs_update_admin_owner" on public.product_catalog_inputs;
create policy "product_catalog_inputs_update_admin_owner"
on public.product_catalog_inputs
for update
using (public._is_org_admin_or_owner(org_id))
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "product_catalog_inputs_delete_admin_owner" on public.product_catalog_inputs;
create policy "product_catalog_inputs_delete_admin_owner"
on public.product_catalog_inputs
for delete
using (public._is_org_admin_or_owner(org_id));

-- product_catalog_components

drop policy if exists "product_catalog_components_select_member" on public.product_catalog_components;
create policy "product_catalog_components_select_member"
on public.product_catalog_components
for select
using (public._is_org_member(org_id));

drop policy if exists "product_catalog_components_insert_admin_owner" on public.product_catalog_components;
create policy "product_catalog_components_insert_admin_owner"
on public.product_catalog_components
for insert
to authenticated
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "product_catalog_components_update_admin_owner" on public.product_catalog_components;
create policy "product_catalog_components_update_admin_owner"
on public.product_catalog_components
for update
using (public._is_org_admin_or_owner(org_id))
with check (public._is_org_admin_or_owner(org_id));

drop policy if exists "product_catalog_components_delete_admin_owner" on public.product_catalog_components;
create policy "product_catalog_components_delete_admin_owner"
on public.product_catalog_components
for delete
using (public._is_org_admin_or_owner(org_id));

-- updated_at triggers

drop trigger if exists set_suppliers_updated_at on public.suppliers;
create trigger set_suppliers_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

drop trigger if exists set_supplier_locations_updated_at on public.supplier_locations;
create trigger set_supplier_locations_updated_at
before update on public.supplier_locations
for each row execute function public.set_updated_at();

drop trigger if exists set_catalog_items_updated_at on public.catalog_items;
create trigger set_catalog_items_updated_at
before update on public.catalog_items
for each row execute function public.set_updated_at();

drop trigger if exists set_catalog_item_specs_updated_at on public.catalog_item_specs;
create trigger set_catalog_item_specs_updated_at
before update on public.catalog_item_specs
for each row execute function public.set_updated_at();

drop trigger if exists set_catalog_item_suppliers_updated_at on public.catalog_item_suppliers;
create trigger set_catalog_item_suppliers_updated_at
before update on public.catalog_item_suppliers
for each row execute function public.set_updated_at();

drop trigger if exists set_partners_updated_at on public.partners;
create trigger set_partners_updated_at
before update on public.partners
for each row execute function public.set_updated_at();

drop trigger if exists set_material_configurations_updated_at on public.material_configurations;
create trigger set_material_configurations_updated_at
before update on public.material_configurations
for each row execute function public.set_updated_at();

drop trigger if exists set_material_configuration_roles_updated_at on public.material_configuration_roles;
create trigger set_material_configuration_roles_updated_at
before update on public.material_configuration_roles
for each row execute function public.set_updated_at();

drop trigger if exists set_product_catalog_updated_at on public.product_catalog;
create trigger set_product_catalog_updated_at
before update on public.product_catalog
for each row execute function public.set_updated_at();

drop trigger if exists set_product_catalog_inputs_updated_at on public.product_catalog_inputs;
create trigger set_product_catalog_inputs_updated_at
before update on public.product_catalog_inputs
for each row execute function public.set_updated_at();

drop trigger if exists set_product_catalog_components_updated_at on public.product_catalog_components;
create trigger set_product_catalog_components_updated_at
before update on public.product_catalog_components
for each row execute function public.set_updated_at();
