-- TASK-003: Core auth schema, triggers, and RLS

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz default now(),
  unique (org_id, profile_id)
);

create table if not exists public.org_settings (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) unique,
  company_name text,
  company_phone text,
  company_email text,
  company_website text,
  company_address text,
  logo_url text,
  primary_color text,
  secondary_color text,
  accent_color text,
  font_preference text,
  estimate_footer_text text,
  invoice_footer_text text,
  equipment_approval_required bool not null default false,
  equipment_approval_role_id uuid,
  portal_enabled bool not null default false,
  portal_subdomain text,
  charges_tax bool not null default false,
  default_tax_rate numeric,
  labor_rate_install numeric,
  labor_rate_equipment_op numeric,
  labor_rate_design numeric,
  material_markup_pct numeric,
  subcontractor_markup_pct numeric,
  updated_at timestamptz default now()
);

create index if not exists idx_org_members_profile_id on public.org_members(profile_id);
create index if not exists idx_org_members_org_id on public.org_members(org_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name'
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists set_organizations_updated_at on public.organizations;
create trigger set_organizations_updated_at
before update on public.organizations
for each row execute function public.set_updated_at();

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_org_settings_updated_at on public.org_settings;
create trigger set_org_settings_updated_at
before update on public.org_settings
for each row execute function public.set_updated_at();

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.org_members enable row level security;
alter table public.org_settings enable row level security;

drop policy if exists "organizations_select_member" on public.organizations;
create policy "organizations_select_member"
on public.organizations
for select
using (
  exists (
    select 1
    from public.org_members om
    where om.org_id = organizations.id
      and om.profile_id = auth.uid()
  )
);

drop policy if exists "organizations_insert_authenticated" on public.organizations;
create policy "organizations_insert_authenticated"
on public.organizations
for insert
to authenticated
with check (auth.uid() is not null);

drop policy if exists "organizations_update_owner" on public.organizations;
create policy "organizations_update_owner"
on public.organizations
for update
using (
  exists (
    select 1
    from public.org_members om
    where om.org_id = organizations.id
      and om.profile_id = auth.uid()
      and om.role = 'owner'
  )
)
with check (
  exists (
    select 1
    from public.org_members om
    where om.org_id = organizations.id
      and om.profile_id = auth.uid()
      and om.role = 'owner'
  )
);

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
using (id = auth.uid());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "org_members_select_member" on public.org_members;
create policy "org_members_select_member"
on public.org_members
for select
-- Simple direct check — the original subquery into org_members was
-- self-referential and caused infinite recursion during org creation.
using (profile_id = auth.uid());

drop policy if exists "org_members_insert_owner_or_self_owner" on public.org_members;
create policy "org_members_insert_owner_or_self_owner"
on public.org_members
for insert
to authenticated
with check (
  (
    profile_id = auth.uid()
    and role = 'owner'
  )
  or exists (
    select 1
    from public.org_members om
    where om.org_id = org_members.org_id
      and om.profile_id = auth.uid()
      and om.role = 'owner'
  )
);

drop policy if exists "org_members_update_owner" on public.org_members;
create policy "org_members_update_owner"
on public.org_members
for update
using (
  exists (
    select 1
    from public.org_members om
    where om.org_id = org_members.org_id
      and om.profile_id = auth.uid()
      and om.role = 'owner'
  )
)
with check (
  exists (
    select 1
    from public.org_members om
    where om.org_id = org_members.org_id
      and om.profile_id = auth.uid()
      and om.role = 'owner'
  )
);

drop policy if exists "org_members_delete_owner" on public.org_members;
create policy "org_members_delete_owner"
on public.org_members
for delete
using (
  exists (
    select 1
    from public.org_members om
    where om.org_id = org_members.org_id
      and om.profile_id = auth.uid()
      and om.role = 'owner'
  )
);

drop policy if exists "org_settings_select_member" on public.org_settings;
create policy "org_settings_select_member"
on public.org_settings
for select
using (
  exists (
    select 1
    from public.org_members om
    where om.org_id = org_settings.org_id
      and om.profile_id = auth.uid()
  )
);

drop policy if exists "org_settings_insert_admin_owner" on public.org_settings;
create policy "org_settings_insert_admin_owner"
on public.org_settings
for insert
to authenticated
with check (
  exists (
    select 1
    from public.org_members om
    where om.org_id = org_settings.org_id
      and om.profile_id = auth.uid()
      and om.role in ('owner', 'admin')
  )
);

drop policy if exists "org_settings_update_admin_owner" on public.org_settings;
create policy "org_settings_update_admin_owner"
on public.org_settings
for update
using (
  exists (
    select 1
    from public.org_members om
    where om.org_id = org_settings.org_id
      and om.profile_id = auth.uid()
      and om.role in ('owner', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.org_members om
    where om.org_id = org_settings.org_id
      and om.profile_id = auth.uid()
      and om.role in ('owner', 'admin')
  )
);
