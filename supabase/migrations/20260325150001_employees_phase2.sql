-- TASK-008: Employees, roles, permissions, invites, and custom fields schema + RLS

create extension if not exists pgcrypto;

create or replace function public.is_org_member(org_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_members om
    where om.org_id = org_uuid
      and om.profile_id = auth.uid()
  );
$$;

create or replace function public.is_org_admin(org_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_members om
    where om.org_id = org_uuid
      and om.profile_id = auth.uid()
      and om.role in ('owner', 'admin')
  );
$$;

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  is_system bool not null default false,
  sort_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (org_id, name)
);

create table if not exists public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_key text not null,
  granted bool not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (role_id, permission_key)
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  supabase_auth_uid uuid references auth.users(id) on delete set null,
  role_id uuid not null references public.roles(id),
  first_name text not null,
  last_name text not null,
  display_name text,
  personal_email text,
  company_email text,
  phone text,
  address text,
  birthday date,
  start_date date,
  end_date date,
  employee_title text,
  employee_position text,
  employment_type text check (
    employment_type in (
      'full_time',
      'part_time',
      'temporary',
      'temp_agency',
      'contractor',
      'seasonal'
    )
  ),
  employee_status text not null default 'active' check (
    employee_status in ('active', 'on_leave', 'terminated', 'resigned')
  ),
  crew_id uuid,
  on_vehicle_insurance bool not null default false,
  has_company_card bool not null default false,
  company_card_last_four text,
  is_sales bool not null default false,
  tracks_hours bool not null default true,
  drivers_license_number text,
  drivers_license_state text,
  drivers_license_class text,
  drivers_license_expiry date,
  medical_card_expiry date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.employee_permission_overrides (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  permission_key text not null,
  granted bool not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (employee_id, permission_key)
);

create table if not exists public.employee_compensation (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  pay_type text not null check (pay_type in ('hourly', 'salary')),
  pay_rate numeric not null,
  effective_date date not null,
  end_date date,
  reason text,
  created_by uuid references public.employees(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.employee_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  email text not null,
  token text not null unique,
  status text not null default 'pending' check (
    status in ('pending', 'accepted', 'expired', 'revoked')
  ),
  invited_by uuid references public.employees(id),
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.employee_preferences (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade unique,
  dashboard_config jsonb,
  notification_config jsonb,
  project_item_filter jsonb,
  route_select text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.custom_field_definitions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (
    entity_type in ('employee', 'client', 'estimate', 'job')
  ),
  name text not null,
  field_type text not null check (
    field_type in ('boolean', 'enum', 'file', 'file_enum', 'text', 'date', 'number')
  ),
  options jsonb,
  is_required bool not null default false,
  sort_order int not null default 0,
  is_active bool not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.custom_field_values (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  custom_field_definition_id uuid not null references public.custom_field_definitions(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  value_boolean bool,
  value_enum text,
  value_text text,
  value_date date,
  value_number numeric,
  file_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (custom_field_definition_id, entity_type, entity_id)
);

create or replace function public.current_employee_id(org_uuid uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select e.id
  from public.employees e
  where e.org_id = org_uuid
    and e.supabase_auth_uid = auth.uid()
  limit 1;
$$;

create or replace function public.has_employee_permission(
  org_uuid uuid,
  permission_key_text text
)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  employee_row record;
  override_granted boolean;
  role_granted boolean;
begin
  select e.id, e.role_id
  into employee_row
  from public.employees e
  where e.org_id = org_uuid
    and e.supabase_auth_uid = auth.uid()
  limit 1;

  if employee_row.id is null then
    return false;
  end if;

  select epo.granted
  into override_granted
  from public.employee_permission_overrides epo
  where epo.org_id = org_uuid
    and epo.employee_id = employee_row.id
    and epo.permission_key = permission_key_text
  limit 1;

  if override_granted is not null then
    return override_granted;
  end if;

  select rp.granted
  into role_granted
  from public.role_permissions rp
  where rp.org_id = org_uuid
    and rp.role_id = employee_row.role_id
    and rp.permission_key = permission_key_text
  limit 1;

  return coalesce(role_granted, false);
end;
$$;

create index if not exists idx_roles_org_id on public.roles(org_id);
create index if not exists idx_role_permissions_org_id on public.role_permissions(org_id);
create index if not exists idx_role_permissions_role_id on public.role_permissions(role_id);
create index if not exists idx_employees_org_id on public.employees(org_id);
create index if not exists idx_employees_auth_uid on public.employees(supabase_auth_uid);
create index if not exists idx_employee_overrides_org_id on public.employee_permission_overrides(org_id);
create index if not exists idx_employee_compensation_org_id on public.employee_compensation(org_id);
create index if not exists idx_employee_compensation_effective on public.employee_compensation(employee_id, effective_date desc);
create index if not exists idx_employee_invites_org_id on public.employee_invites(org_id);
create index if not exists idx_employee_invites_token on public.employee_invites(token);
create index if not exists idx_employee_preferences_org_id on public.employee_preferences(org_id);
create index if not exists idx_custom_field_definitions_org_id on public.custom_field_definitions(org_id);
create index if not exists idx_custom_field_values_org_id on public.custom_field_values(org_id);
create index if not exists idx_custom_field_values_entity on public.custom_field_values(entity_type, entity_id);

drop trigger if exists set_roles_updated_at on public.roles;
create trigger set_roles_updated_at
before update on public.roles
for each row execute function public.set_updated_at();

drop trigger if exists set_role_permissions_updated_at on public.role_permissions;
create trigger set_role_permissions_updated_at
before update on public.role_permissions
for each row execute function public.set_updated_at();

drop trigger if exists set_employees_updated_at on public.employees;
create trigger set_employees_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

drop trigger if exists set_employee_permission_overrides_updated_at on public.employee_permission_overrides;
create trigger set_employee_permission_overrides_updated_at
before update on public.employee_permission_overrides
for each row execute function public.set_updated_at();

drop trigger if exists set_employee_compensation_updated_at on public.employee_compensation;
create trigger set_employee_compensation_updated_at
before update on public.employee_compensation
for each row execute function public.set_updated_at();

drop trigger if exists set_employee_invites_updated_at on public.employee_invites;
create trigger set_employee_invites_updated_at
before update on public.employee_invites
for each row execute function public.set_updated_at();

drop trigger if exists set_employee_preferences_updated_at on public.employee_preferences;
create trigger set_employee_preferences_updated_at
before update on public.employee_preferences
for each row execute function public.set_updated_at();

drop trigger if exists set_custom_field_definitions_updated_at on public.custom_field_definitions;
create trigger set_custom_field_definitions_updated_at
before update on public.custom_field_definitions
for each row execute function public.set_updated_at();

drop trigger if exists set_custom_field_values_updated_at on public.custom_field_values;
create trigger set_custom_field_values_updated_at
before update on public.custom_field_values
for each row execute function public.set_updated_at();

alter table public.roles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.employees enable row level security;
alter table public.employee_permission_overrides enable row level security;
alter table public.employee_compensation enable row level security;
alter table public.employee_invites enable row level security;
alter table public.employee_preferences enable row level security;
alter table public.custom_field_definitions enable row level security;
alter table public.custom_field_values enable row level security;

drop policy if exists "roles_select_org_member" on public.roles;
create policy "roles_select_org_member"
on public.roles
for select
using (public.is_org_member(org_id));

drop policy if exists "roles_insert_org_admin" on public.roles;
create policy "roles_insert_org_admin"
on public.roles
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "roles_update_org_admin" on public.roles;
create policy "roles_update_org_admin"
on public.roles
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "roles_delete_org_admin" on public.roles;
create policy "roles_delete_org_admin"
on public.roles
for delete
using (public.is_org_admin(org_id));

drop policy if exists "role_permissions_select_org_member" on public.role_permissions;
create policy "role_permissions_select_org_member"
on public.role_permissions
for select
using (public.is_org_member(org_id));

drop policy if exists "role_permissions_insert_org_admin" on public.role_permissions;
create policy "role_permissions_insert_org_admin"
on public.role_permissions
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "role_permissions_update_org_admin" on public.role_permissions;
create policy "role_permissions_update_org_admin"
on public.role_permissions
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "role_permissions_delete_org_admin" on public.role_permissions;
create policy "role_permissions_delete_org_admin"
on public.role_permissions
for delete
using (public.is_org_admin(org_id));

drop policy if exists "employees_select_org_member" on public.employees;
create policy "employees_select_org_member"
on public.employees
for select
using (public.is_org_member(org_id));

drop policy if exists "employees_insert_org_admin" on public.employees;
create policy "employees_insert_org_admin"
on public.employees
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "employees_update_org_admin" on public.employees;
create policy "employees_update_org_admin"
on public.employees
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "employee_permission_overrides_select_org_member" on public.employee_permission_overrides;
create policy "employee_permission_overrides_select_org_member"
on public.employee_permission_overrides
for select
using (public.is_org_member(org_id));

drop policy if exists "employee_permission_overrides_insert_org_admin" on public.employee_permission_overrides;
create policy "employee_permission_overrides_insert_org_admin"
on public.employee_permission_overrides
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "employee_permission_overrides_update_org_admin" on public.employee_permission_overrides;
create policy "employee_permission_overrides_update_org_admin"
on public.employee_permission_overrides
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "employee_permission_overrides_delete_org_admin" on public.employee_permission_overrides;
create policy "employee_permission_overrides_delete_org_admin"
on public.employee_permission_overrides
for delete
using (public.is_org_admin(org_id));

drop policy if exists "employee_compensation_select_permission" on public.employee_compensation;
create policy "employee_compensation_select_permission"
on public.employee_compensation
for select
using (public.has_employee_permission(org_id, 'compensation.view'));

drop policy if exists "employee_compensation_insert_org_admin" on public.employee_compensation;
create policy "employee_compensation_insert_org_admin"
on public.employee_compensation
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "employee_compensation_update_org_admin" on public.employee_compensation;
create policy "employee_compensation_update_org_admin"
on public.employee_compensation
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "employee_compensation_delete_org_admin" on public.employee_compensation;
create policy "employee_compensation_delete_org_admin"
on public.employee_compensation
for delete
using (public.is_org_admin(org_id));

drop policy if exists "employee_invites_select_org_member" on public.employee_invites;
create policy "employee_invites_select_org_member"
on public.employee_invites
for select
using (public.is_org_member(org_id));

drop policy if exists "employee_invites_select_pending_token" on public.employee_invites;
create policy "employee_invites_select_pending_token"
on public.employee_invites
for select
to anon, authenticated
using (
  status = 'pending'
  and expires_at > now()
);

drop policy if exists "employee_invites_insert_org_admin" on public.employee_invites;
create policy "employee_invites_insert_org_admin"
on public.employee_invites
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "employee_invites_update_org_admin" on public.employee_invites;
create policy "employee_invites_update_org_admin"
on public.employee_invites
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "employee_invites_delete_org_admin" on public.employee_invites;
create policy "employee_invites_delete_org_admin"
on public.employee_invites
for delete
using (public.is_org_admin(org_id));

drop policy if exists "employee_preferences_select_org_member" on public.employee_preferences;
create policy "employee_preferences_select_org_member"
on public.employee_preferences
for select
using (public.is_org_member(org_id));

drop policy if exists "employee_preferences_insert_org_admin" on public.employee_preferences;
create policy "employee_preferences_insert_org_admin"
on public.employee_preferences
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "employee_preferences_update_org_admin" on public.employee_preferences;
create policy "employee_preferences_update_org_admin"
on public.employee_preferences
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "employee_preferences_delete_org_admin" on public.employee_preferences;
create policy "employee_preferences_delete_org_admin"
on public.employee_preferences
for delete
using (public.is_org_admin(org_id));

drop policy if exists "custom_field_definitions_select_org_member" on public.custom_field_definitions;
create policy "custom_field_definitions_select_org_member"
on public.custom_field_definitions
for select
using (public.is_org_member(org_id));

drop policy if exists "custom_field_definitions_insert_org_admin" on public.custom_field_definitions;
create policy "custom_field_definitions_insert_org_admin"
on public.custom_field_definitions
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "custom_field_definitions_update_org_admin" on public.custom_field_definitions;
create policy "custom_field_definitions_update_org_admin"
on public.custom_field_definitions
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "custom_field_definitions_delete_org_admin" on public.custom_field_definitions;
create policy "custom_field_definitions_delete_org_admin"
on public.custom_field_definitions
for delete
using (public.is_org_admin(org_id));

drop policy if exists "custom_field_values_select_org_member" on public.custom_field_values;
create policy "custom_field_values_select_org_member"
on public.custom_field_values
for select
using (public.is_org_member(org_id));

drop policy if exists "custom_field_values_insert_org_member" on public.custom_field_values;
create policy "custom_field_values_insert_org_member"
on public.custom_field_values
for insert
with check (
  public.is_org_admin(org_id)
  or (
    entity_type = 'employee'
    and entity_id = public.current_employee_id(org_id)
  )
);

drop policy if exists "custom_field_values_update_org_member" on public.custom_field_values;
create policy "custom_field_values_update_org_member"
on public.custom_field_values
for update
using (
  public.is_org_admin(org_id)
  or (
    entity_type = 'employee'
    and entity_id = public.current_employee_id(org_id)
  )
)
with check (
  public.is_org_admin(org_id)
  or (
    entity_type = 'employee'
    and entity_id = public.current_employee_id(org_id)
  )
);

drop policy if exists "custom_field_values_delete_org_member" on public.custom_field_values;
create policy "custom_field_values_delete_org_member"
on public.custom_field_values
for delete
using (
  public.is_org_admin(org_id)
  or (
    entity_type = 'employee'
    and entity_id = public.current_employee_id(org_id)
  )
);
