-- TASK-019: Crews and fleet schema + RLS

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists public.crews (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  crew_lead_id uuid references public.employees(id) on delete set null,
  is_active bool not null default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (org_id, name)
);

create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  type text not null check (type in ('truck', 'trailer', 'equipment', 'attachment')),
  make text,
  model text,
  year int,
  vin_serial text,
  license_plate text,
  dot_number text,
  registration_expiry date,
  insurance_expiry date,
  annual_inspection_due date,
  is_shareable bool not null default false,
  is_active bool not null default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.equipment_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  crew_id uuid not null references public.crews(id) on delete cascade,
  assigned_date date not null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.equipment_schedule (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  crew_id uuid references public.crews(id) on delete set null,
  job_id uuid,
  start_date date not null,
  end_date date,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint equipment_schedule_date_order_chk check (end_date is null or end_date >= start_date)
);

create table if not exists public.equipment_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  crew_id uuid not null references public.crews(id) on delete cascade,
  job_id uuid,
  requested_by uuid references public.employees(id) on delete set null,
  start_date date not null,
  end_date date,
  status text not null default 'pending' check (status in ('pending', 'approved', 'denied')),
  reviewed_by uuid references public.employees(id) on delete set null,
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint equipment_requests_date_order_chk check (end_date is null or end_date >= start_date)
);

create table if not exists public.equipment_maintenance (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  type text not null,
  performed_date date not null,
  mileage int,
  next_service_date date,
  next_service_mileage int,
  performed_by text,
  cost numeric,
  notes text,
  receipt_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.vehicle_inspections (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  equipment_id uuid not null references public.equipment(id) on delete cascade,
  driver_id uuid not null references public.employees(id) on delete cascade,
  inspection_type text not null check (inspection_type in ('pre_trip', 'post_trip')),
  inspection_date date not null,
  odometer int,
  passed bool not null,
  defects jsonb,
  driver_signature text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists ux_employees_id_org_id on public.employees (id, org_id);
create unique index if not exists ux_crews_id_org_id on public.crews (id, org_id);
create unique index if not exists ux_equipment_id_org_id on public.equipment (id, org_id);

alter table public.crews
  drop constraint if exists crews_crew_lead_id_fkey;
alter table public.crews
  add constraint crews_crew_lead_org_fk
  foreign key (crew_lead_id, org_id)
  references public.employees (id, org_id);

alter table public.equipment_assignments
  drop constraint if exists equipment_assignments_equipment_id_fkey;
alter table public.equipment_assignments
  add constraint equipment_assignments_equipment_org_fk
  foreign key (equipment_id, org_id)
  references public.equipment (id, org_id);

alter table public.equipment_assignments
  drop constraint if exists equipment_assignments_crew_id_fkey;
alter table public.equipment_assignments
  add constraint equipment_assignments_crew_org_fk
  foreign key (crew_id, org_id)
  references public.crews (id, org_id);

alter table public.equipment_schedule
  drop constraint if exists equipment_schedule_equipment_id_fkey;
alter table public.equipment_schedule
  add constraint equipment_schedule_equipment_org_fk
  foreign key (equipment_id, org_id)
  references public.equipment (id, org_id);

alter table public.equipment_schedule
  drop constraint if exists equipment_schedule_crew_id_fkey;
alter table public.equipment_schedule
  add constraint equipment_schedule_crew_org_fk
  foreign key (crew_id, org_id)
  references public.crews (id, org_id);

alter table public.equipment_requests
  drop constraint if exists equipment_requests_equipment_id_fkey;
alter table public.equipment_requests
  add constraint equipment_requests_equipment_org_fk
  foreign key (equipment_id, org_id)
  references public.equipment (id, org_id);

alter table public.equipment_requests
  drop constraint if exists equipment_requests_crew_id_fkey;
alter table public.equipment_requests
  add constraint equipment_requests_crew_org_fk
  foreign key (crew_id, org_id)
  references public.crews (id, org_id);

alter table public.equipment_requests
  drop constraint if exists equipment_requests_requested_by_fkey;
alter table public.equipment_requests
  add constraint equipment_requests_requested_by_org_fk
  foreign key (requested_by, org_id)
  references public.employees (id, org_id);

alter table public.equipment_requests
  drop constraint if exists equipment_requests_reviewed_by_fkey;
alter table public.equipment_requests
  add constraint equipment_requests_reviewed_by_org_fk
  foreign key (reviewed_by, org_id)
  references public.employees (id, org_id);

alter table public.equipment_maintenance
  drop constraint if exists equipment_maintenance_equipment_id_fkey;
alter table public.equipment_maintenance
  add constraint equipment_maintenance_equipment_org_fk
  foreign key (equipment_id, org_id)
  references public.equipment (id, org_id);

alter table public.vehicle_inspections
  drop constraint if exists vehicle_inspections_equipment_id_fkey;
alter table public.vehicle_inspections
  add constraint vehicle_inspections_equipment_org_fk
  foreign key (equipment_id, org_id)
  references public.equipment (id, org_id);

alter table public.vehicle_inspections
  drop constraint if exists vehicle_inspections_driver_id_fkey;
alter table public.vehicle_inspections
  add constraint vehicle_inspections_driver_org_fk
  foreign key (driver_id, org_id)
  references public.employees (id, org_id);

create or replace function public.has_equipment_schedule_conflict(
  check_org_id uuid,
  check_equipment_id uuid,
  check_start_date date,
  check_end_date date default null,
  exclude_schedule_id uuid default null
)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.equipment_schedule es
    join public.equipment e
      on e.id = es.equipment_id
     and e.org_id = es.org_id
    where es.org_id = check_org_id
      and es.equipment_id = check_equipment_id
      and e.is_shareable = false
      and (exclude_schedule_id is null or es.id <> exclude_schedule_id)
      and daterange(
        es.start_date,
        coalesce(es.end_date, es.start_date) + 1,
        '[)'
      ) && daterange(
        check_start_date,
        coalesce(check_end_date, check_start_date) + 1,
        '[)'
      )
  );
$$;

create or replace function public.enforce_equipment_schedule_conflict()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if public.has_equipment_schedule_conflict(
    new.org_id,
    new.equipment_id,
    new.start_date,
    new.end_date,
    new.id
  ) then
    raise exception 'Equipment schedule conflict detected for this date range.';
  end if;

  return new;
end;
$$;

create index if not exists idx_crews_org_id on public.crews(org_id);
create index if not exists idx_crews_lead_id on public.crews(crew_lead_id);

create index if not exists idx_equipment_org_id on public.equipment(org_id);
create index if not exists idx_equipment_org_type on public.equipment(org_id, type);
create index if not exists idx_equipment_org_active on public.equipment(org_id, is_active);

create index if not exists idx_equipment_assignments_org_id on public.equipment_assignments(org_id);
create index if not exists idx_equipment_assignments_equipment_id on public.equipment_assignments(equipment_id);
create index if not exists idx_equipment_assignments_crew_id on public.equipment_assignments(crew_id);

create index if not exists idx_equipment_schedule_org_id on public.equipment_schedule(org_id);
create index if not exists idx_equipment_schedule_equipment_id on public.equipment_schedule(equipment_id);
create index if not exists idx_equipment_schedule_crew_id on public.equipment_schedule(crew_id);
create index if not exists idx_equipment_schedule_range on public.equipment_schedule(equipment_id, start_date, end_date);
create index if not exists idx_equipment_schedule_org_equipment_daterange
on public.equipment_schedule
using gist (
  org_id,
  equipment_id,
  daterange(start_date, coalesce(end_date, start_date) + 1, '[)')
);

create index if not exists idx_equipment_requests_org_id on public.equipment_requests(org_id);
create index if not exists idx_equipment_requests_status on public.equipment_requests(org_id, status);
create index if not exists idx_equipment_requests_crew_id on public.equipment_requests(crew_id);

create index if not exists idx_equipment_maintenance_org_id on public.equipment_maintenance(org_id);
create index if not exists idx_equipment_maintenance_equipment_id on public.equipment_maintenance(equipment_id);
create index if not exists idx_equipment_maintenance_date on public.equipment_maintenance(equipment_id, performed_date desc);

create index if not exists idx_vehicle_inspections_org_id on public.vehicle_inspections(org_id);
create index if not exists idx_vehicle_inspections_equipment_id on public.vehicle_inspections(equipment_id);
create index if not exists idx_vehicle_inspections_date on public.vehicle_inspections(equipment_id, inspection_date desc);

alter table public.crews enable row level security;
alter table public.equipment enable row level security;
alter table public.equipment_assignments enable row level security;
alter table public.equipment_schedule enable row level security;
alter table public.equipment_requests enable row level security;
alter table public.equipment_maintenance enable row level security;
alter table public.vehicle_inspections enable row level security;

-- crews

drop policy if exists "crews_select_member" on public.crews;
create policy "crews_select_member"
on public.crews
for select
using (public.is_org_member(org_id));

drop policy if exists "crews_insert_admin_owner" on public.crews;
create policy "crews_insert_admin_owner"
on public.crews
for insert
to authenticated
with check (public.is_org_admin(org_id));

drop policy if exists "crews_update_admin_owner" on public.crews;
create policy "crews_update_admin_owner"
on public.crews
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "crews_delete_admin_owner" on public.crews;
create policy "crews_delete_admin_owner"
on public.crews
for delete
using (public.is_org_admin(org_id));

-- equipment

drop policy if exists "equipment_select_member" on public.equipment;
create policy "equipment_select_member"
on public.equipment
for select
using (public.is_org_member(org_id));

drop policy if exists "equipment_insert_admin_owner" on public.equipment;
create policy "equipment_insert_admin_owner"
on public.equipment
for insert
to authenticated
with check (public.is_org_admin(org_id));

drop policy if exists "equipment_update_admin_owner" on public.equipment;
create policy "equipment_update_admin_owner"
on public.equipment
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "equipment_delete_admin_owner" on public.equipment;
create policy "equipment_delete_admin_owner"
on public.equipment
for delete
using (public.is_org_admin(org_id));

-- equipment_assignments

drop policy if exists "equipment_assignments_select_member" on public.equipment_assignments;
create policy "equipment_assignments_select_member"
on public.equipment_assignments
for select
using (public.is_org_member(org_id));

drop policy if exists "equipment_assignments_insert_admin_owner" on public.equipment_assignments;
create policy "equipment_assignments_insert_admin_owner"
on public.equipment_assignments
for insert
to authenticated
with check (public.is_org_admin(org_id));

drop policy if exists "equipment_assignments_update_admin_owner" on public.equipment_assignments;
create policy "equipment_assignments_update_admin_owner"
on public.equipment_assignments
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "equipment_assignments_delete_admin_owner" on public.equipment_assignments;
create policy "equipment_assignments_delete_admin_owner"
on public.equipment_assignments
for delete
using (public.is_org_admin(org_id));

-- equipment_schedule

drop policy if exists "equipment_schedule_select_member" on public.equipment_schedule;
create policy "equipment_schedule_select_member"
on public.equipment_schedule
for select
using (public.is_org_member(org_id));

drop policy if exists "equipment_schedule_insert_admin_owner" on public.equipment_schedule;
create policy "equipment_schedule_insert_admin_owner"
on public.equipment_schedule
for insert
to authenticated
with check (public.is_org_admin(org_id));

drop policy if exists "equipment_schedule_update_admin_owner" on public.equipment_schedule;
create policy "equipment_schedule_update_admin_owner"
on public.equipment_schedule
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "equipment_schedule_delete_admin_owner" on public.equipment_schedule;
create policy "equipment_schedule_delete_admin_owner"
on public.equipment_schedule
for delete
using (public.is_org_admin(org_id));

-- equipment_requests

drop policy if exists "equipment_requests_select_member" on public.equipment_requests;
create policy "equipment_requests_select_member"
on public.equipment_requests
for select
using (public.is_org_member(org_id));

drop policy if exists "equipment_requests_insert_member" on public.equipment_requests;
create policy "equipment_requests_insert_member"
on public.equipment_requests
for insert
to authenticated
with check (public.is_org_member(org_id));

drop policy if exists "equipment_requests_update_admin_owner" on public.equipment_requests;
create policy "equipment_requests_update_admin_owner"
on public.equipment_requests
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "equipment_requests_delete_admin_owner" on public.equipment_requests;
create policy "equipment_requests_delete_admin_owner"
on public.equipment_requests
for delete
using (public.is_org_admin(org_id));

-- equipment_maintenance

drop policy if exists "equipment_maintenance_select_member" on public.equipment_maintenance;
create policy "equipment_maintenance_select_member"
on public.equipment_maintenance
for select
using (public.is_org_member(org_id));

drop policy if exists "equipment_maintenance_insert_member" on public.equipment_maintenance;
create policy "equipment_maintenance_insert_member"
on public.equipment_maintenance
for insert
to authenticated
with check (public.is_org_member(org_id));

drop policy if exists "equipment_maintenance_update_member" on public.equipment_maintenance;
create policy "equipment_maintenance_update_member"
on public.equipment_maintenance
for update
using (public.is_org_member(org_id))
with check (public.is_org_member(org_id));

drop policy if exists "equipment_maintenance_delete_admin_owner" on public.equipment_maintenance;
create policy "equipment_maintenance_delete_admin_owner"
on public.equipment_maintenance
for delete
using (public.is_org_admin(org_id));

-- vehicle_inspections

drop policy if exists "vehicle_inspections_select_member" on public.vehicle_inspections;
create policy "vehicle_inspections_select_member"
on public.vehicle_inspections
for select
using (public.is_org_member(org_id));

drop policy if exists "vehicle_inspections_insert_member" on public.vehicle_inspections;
create policy "vehicle_inspections_insert_member"
on public.vehicle_inspections
for insert
to authenticated
with check (public.is_org_member(org_id));

drop policy if exists "vehicle_inspections_update_member" on public.vehicle_inspections;
create policy "vehicle_inspections_update_member"
on public.vehicle_inspections
for update
using (public.is_org_member(org_id))
with check (public.is_org_member(org_id));

drop policy if exists "vehicle_inspections_delete_admin_owner" on public.vehicle_inspections;
create policy "vehicle_inspections_delete_admin_owner"
on public.vehicle_inspections
for delete
using (public.is_org_admin(org_id));

-- updated_at triggers

drop trigger if exists enforce_equipment_schedule_conflict on public.equipment_schedule;
create trigger enforce_equipment_schedule_conflict
before insert or update on public.equipment_schedule
for each row execute function public.enforce_equipment_schedule_conflict();

drop trigger if exists set_crews_updated_at on public.crews;
create trigger set_crews_updated_at
before update on public.crews
for each row execute function public.set_updated_at();

drop trigger if exists set_equipment_updated_at on public.equipment;
create trigger set_equipment_updated_at
before update on public.equipment
for each row execute function public.set_updated_at();

drop trigger if exists set_equipment_assignments_updated_at on public.equipment_assignments;
create trigger set_equipment_assignments_updated_at
before update on public.equipment_assignments
for each row execute function public.set_updated_at();

drop trigger if exists set_equipment_schedule_updated_at on public.equipment_schedule;
create trigger set_equipment_schedule_updated_at
before update on public.equipment_schedule
for each row execute function public.set_updated_at();

drop trigger if exists set_equipment_requests_updated_at on public.equipment_requests;
create trigger set_equipment_requests_updated_at
before update on public.equipment_requests
for each row execute function public.set_updated_at();

drop trigger if exists set_equipment_maintenance_updated_at on public.equipment_maintenance;
create trigger set_equipment_maintenance_updated_at
before update on public.equipment_maintenance
for each row execute function public.set_updated_at();

drop trigger if exists set_vehicle_inspections_updated_at on public.vehicle_inspections;
create trigger set_vehicle_inspections_updated_at
before update on public.vehicle_inspections
for each row execute function public.set_updated_at();

-- Link employees.crew_id to crews once crews table exists.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'employees_crew_id_fkey'
      and conrelid = 'public.employees'::regclass
  ) then
    alter table public.employees
      add constraint employees_crew_id_fkey
      foreign key (crew_id)
      references public.crews(id)
      on delete set null;
  end if;
end $$;
