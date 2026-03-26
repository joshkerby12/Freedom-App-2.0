-- TASK-014: Clients schema, lookup tables, communications, notes/tasks, and RLS

create extension if not exists pgcrypto;

create table if not exists public.client_types (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  color text,
  sort_order int not null default 0,
  is_active bool not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (org_id, name)
);

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  color text,
  sort_order int not null default 0,
  is_active bool not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (org_id, name)
);

create table if not exists public.referral_funnels (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  requires_source bool not null default false,
  sort_order int not null default 0,
  is_active bool not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (org_id, name)
);

create table if not exists public.referral_sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  referral_funnel_id uuid not null references public.referral_funnels(id) on delete cascade,
  name text not null,
  is_active bool not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (org_id, referral_funnel_id, name)
);

create table if not exists public.payment_terms (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  days_until_due int not null,
  quickbooks_term_id text,
  sort_order int not null default 0,
  is_active bool not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (org_id, name)
);

alter table public.payment_terms add column if not exists created_at timestamptz default now();
alter table public.payment_terms add column if not exists updated_at timestamptz default now();

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  is_company bool not null default false,
  company_name text,
  first_name text not null,
  last_name text not null,
  display_name text,
  phone text,
  email text,
  quickbooks_customer_id text,
  client_type_id uuid references public.client_types(id) on delete set null,
  sales_lead uuid references public.employees(id) on delete set null,
  referral_funnel_id uuid references public.referral_funnels(id) on delete set null,
  referral_source_id uuid references public.referral_sources(id) on delete set null,
  payment_terms_id uuid references public.payment_terms(id) on delete set null,
  contact_frequency text check (
    contact_frequency in ('monthly', 'quarterly', 'bi-annually', 'annually', 'custom')
  ),
  contact_frequency_days int,
  last_contacted date,
  next_contact date,
  is_previous_customer bool not null default false,
  is_incomplete bool not null default true,
  has_portal_access bool not null default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.client_addresses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null,
  type text not null check (type in ('billing', 'job_site', 'both')),
  is_primary bool not null default false,
  street_address text not null,
  city text not null,
  state text not null,
  zip text not null,
  lat numeric,
  lng numeric,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null,
  first_name text not null,
  last_name text,
  phone text,
  email text,
  role text,
  is_primary bool not null default false,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.client_tags (
  org_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null,
  tag_id uuid not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (client_id, tag_id)
);

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (
    entity_type in ('client', 'estimate', 'job', 'employee', 'equipment', 'general')
  ),
  entity_id uuid not null,
  body text not null,
  author_id uuid references public.employees(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.note_attachments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  note_id uuid not null,
  file_url text not null,
  file_type text,
  file_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  entity_type text not null check (
    entity_type in ('client', 'estimate', 'job', 'employee', 'general')
  ),
  entity_id uuid,
  title text not null,
  description text,
  assignee_id uuid references public.employees(id) on delete set null,
  due_date date,
  priority text not null default 'medium' check (
    priority in ('low', 'medium', 'high', 'urgent')
  ),
  status text not null default 'pending' check (
    status in ('pending', 'in_progress', 'completed', 'cancelled')
  ),
  completed_at timestamptz,
  completed_by uuid references public.employees(id) on delete set null,
  created_by uuid references public.employees(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.task_followers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  task_id uuid not null,
  employee_id uuid not null references public.employees(id) on delete cascade,
  notified_on_update bool not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (task_id, employee_id)
);

create table if not exists public.communications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  client_id uuid not null,
  estimate_id uuid,
  job_id uuid,
  method text not null check (
    method in ('phone', 'email', 'text', 'in_person', 'portal_message')
  ),
  direction text not null check (direction in ('inbound', 'outbound')),
  result text check (
    result in ('spoke_with_client', 'left_voicemail', 'no_answer', 'email_sent', 'meeting_held', 'other')
  ),
  notes text,
  logged_by uuid references public.employees(id) on delete set null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.communication_attachments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  communication_id uuid not null,
  file_url text not null,
  file_type text,
  file_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create unique index if not exists ux_clients_id_org_id on public.clients (id, org_id);
create unique index if not exists ux_client_types_id_org_id on public.client_types (id, org_id);
create unique index if not exists ux_tags_id_org_id on public.tags (id, org_id);
create unique index if not exists ux_referral_funnels_id_org_id on public.referral_funnels (id, org_id);
create unique index if not exists ux_referral_sources_id_org_id on public.referral_sources (id, org_id);
create unique index if not exists ux_payment_terms_id_org_id on public.payment_terms (id, org_id);
create unique index if not exists ux_notes_id_org_id on public.notes (id, org_id);
create unique index if not exists ux_tasks_id_org_id on public.tasks (id, org_id);
create unique index if not exists ux_communications_id_org_id on public.communications (id, org_id);

alter table public.client_addresses
  drop constraint if exists client_addresses_client_org_fk;
alter table public.client_addresses
  add constraint client_addresses_client_org_fk
  foreign key (client_id, org_id)
  references public.clients (id, org_id)
  on delete cascade;

alter table public.client_contacts
  drop constraint if exists client_contacts_client_org_fk;
alter table public.client_contacts
  add constraint client_contacts_client_org_fk
  foreign key (client_id, org_id)
  references public.clients (id, org_id)
  on delete cascade;

alter table public.client_tags
  drop constraint if exists client_tags_client_org_fk;
alter table public.client_tags
  add constraint client_tags_client_org_fk
  foreign key (client_id, org_id)
  references public.clients (id, org_id)
  on delete cascade;

alter table public.client_tags
  drop constraint if exists client_tags_tag_org_fk;
alter table public.client_tags
  add constraint client_tags_tag_org_fk
  foreign key (tag_id, org_id)
  references public.tags (id, org_id)
  on delete cascade;

alter table public.referral_sources
  drop constraint if exists referral_sources_referral_funnel_id_fkey;
alter table public.referral_sources
  add constraint referral_sources_funnel_org_fk
  foreign key (referral_funnel_id, org_id)
  references public.referral_funnels (id, org_id)
  on delete cascade;

alter table public.note_attachments
  drop constraint if exists note_attachments_note_org_fk;
alter table public.note_attachments
  add constraint note_attachments_note_org_fk
  foreign key (note_id, org_id)
  references public.notes (id, org_id)
  on delete cascade;

alter table public.task_followers
  drop constraint if exists task_followers_task_org_fk;
alter table public.task_followers
  add constraint task_followers_task_org_fk
  foreign key (task_id, org_id)
  references public.tasks (id, org_id)
  on delete cascade;

alter table public.communications
  drop constraint if exists communications_client_org_fk;
alter table public.communications
  add constraint communications_client_org_fk
  foreign key (client_id, org_id)
  references public.clients (id, org_id)
  on delete cascade;

alter table public.communication_attachments
  drop constraint if exists communication_attachments_communication_org_fk;
alter table public.communication_attachments
  add constraint communication_attachments_communication_org_fk
  foreign key (communication_id, org_id)
  references public.communications (id, org_id)
  on delete cascade;

create index if not exists idx_client_types_org_id on public.client_types (org_id);
create index if not exists idx_tags_org_id on public.tags (org_id);
create index if not exists idx_referral_funnels_org_id on public.referral_funnels (org_id);
create index if not exists idx_referral_sources_org_id on public.referral_sources (org_id);
create index if not exists idx_referral_sources_funnel_id on public.referral_sources (referral_funnel_id);
create index if not exists idx_payment_terms_org_id on public.payment_terms (org_id);
create index if not exists idx_clients_org_id on public.clients (org_id);
create index if not exists idx_clients_display_name on public.clients (org_id, display_name);
create index if not exists idx_clients_company_name on public.clients (org_id, company_name);
create index if not exists idx_clients_contact_lookup on public.clients (org_id, email, phone);
create index if not exists idx_client_addresses_org_id on public.client_addresses (org_id);
create index if not exists idx_client_addresses_client_id on public.client_addresses (client_id);
create index if not exists idx_client_contacts_org_id on public.client_contacts (org_id);
create index if not exists idx_client_contacts_client_id on public.client_contacts (client_id);
create index if not exists idx_client_tags_org_id on public.client_tags (org_id);
create index if not exists idx_client_tags_tag_id on public.client_tags (tag_id);
create index if not exists idx_notes_org_id on public.notes (org_id);
create index if not exists idx_notes_entity on public.notes (org_id, entity_type, entity_id);
create index if not exists idx_note_attachments_org_id on public.note_attachments (org_id);
create index if not exists idx_note_attachments_note_id on public.note_attachments (note_id);
create index if not exists idx_tasks_org_id on public.tasks (org_id);
create index if not exists idx_tasks_entity on public.tasks (org_id, entity_type, entity_id);
create index if not exists idx_tasks_assignee_id on public.tasks (assignee_id);
create index if not exists idx_task_followers_org_id on public.task_followers (org_id);
create index if not exists idx_task_followers_task_id on public.task_followers (task_id);
create index if not exists idx_communications_org_id on public.communications (org_id);
create index if not exists idx_communications_client_id on public.communications (client_id);
create index if not exists idx_communications_occurred_at on public.communications (org_id, occurred_at desc);
create index if not exists idx_communication_attachments_org_id on public.communication_attachments (org_id);
create index if not exists idx_communication_attachments_communication_id on public.communication_attachments (communication_id);

drop trigger if exists set_client_types_updated_at on public.client_types;
create trigger set_client_types_updated_at
before update on public.client_types
for each row execute function public.set_updated_at();

drop trigger if exists set_tags_updated_at on public.tags;
create trigger set_tags_updated_at
before update on public.tags
for each row execute function public.set_updated_at();

drop trigger if exists set_referral_funnels_updated_at on public.referral_funnels;
create trigger set_referral_funnels_updated_at
before update on public.referral_funnels
for each row execute function public.set_updated_at();

drop trigger if exists set_referral_sources_updated_at on public.referral_sources;
create trigger set_referral_sources_updated_at
before update on public.referral_sources
for each row execute function public.set_updated_at();

drop trigger if exists set_payment_terms_updated_at on public.payment_terms;
create trigger set_payment_terms_updated_at
before update on public.payment_terms
for each row execute function public.set_updated_at();

drop trigger if exists set_clients_updated_at on public.clients;
create trigger set_clients_updated_at
before update on public.clients
for each row execute function public.set_updated_at();

drop trigger if exists set_client_addresses_updated_at on public.client_addresses;
create trigger set_client_addresses_updated_at
before update on public.client_addresses
for each row execute function public.set_updated_at();

drop trigger if exists set_client_contacts_updated_at on public.client_contacts;
create trigger set_client_contacts_updated_at
before update on public.client_contacts
for each row execute function public.set_updated_at();

drop trigger if exists set_client_tags_updated_at on public.client_tags;
create trigger set_client_tags_updated_at
before update on public.client_tags
for each row execute function public.set_updated_at();

drop trigger if exists set_notes_updated_at on public.notes;
create trigger set_notes_updated_at
before update on public.notes
for each row execute function public.set_updated_at();

drop trigger if exists set_note_attachments_updated_at on public.note_attachments;
create trigger set_note_attachments_updated_at
before update on public.note_attachments
for each row execute function public.set_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists set_task_followers_updated_at on public.task_followers;
create trigger set_task_followers_updated_at
before update on public.task_followers
for each row execute function public.set_updated_at();

drop trigger if exists set_communications_updated_at on public.communications;
create trigger set_communications_updated_at
before update on public.communications
for each row execute function public.set_updated_at();

drop trigger if exists set_communication_attachments_updated_at on public.communication_attachments;
create trigger set_communication_attachments_updated_at
before update on public.communication_attachments
for each row execute function public.set_updated_at();

alter table public.client_types enable row level security;
alter table public.tags enable row level security;
alter table public.referral_funnels enable row level security;
alter table public.referral_sources enable row level security;
alter table public.payment_terms enable row level security;
alter table public.clients enable row level security;
alter table public.client_addresses enable row level security;
alter table public.client_contacts enable row level security;
alter table public.client_tags enable row level security;
alter table public.notes enable row level security;
alter table public.note_attachments enable row level security;
alter table public.tasks enable row level security;
alter table public.task_followers enable row level security;
alter table public.communications enable row level security;
alter table public.communication_attachments enable row level security;

drop policy if exists "client_types_select_org_member" on public.client_types;
create policy "client_types_select_org_member"
on public.client_types
for select
using (public.is_org_member(org_id));

drop policy if exists "client_types_insert_org_admin" on public.client_types;
create policy "client_types_insert_org_admin"
on public.client_types
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "client_types_update_org_admin" on public.client_types;
create policy "client_types_update_org_admin"
on public.client_types
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "client_types_delete_org_admin" on public.client_types;
create policy "client_types_delete_org_admin"
on public.client_types
for delete
using (public.is_org_admin(org_id));

drop policy if exists "tags_select_org_member" on public.tags;
create policy "tags_select_org_member"
on public.tags
for select
using (public.is_org_member(org_id));

drop policy if exists "tags_insert_org_admin" on public.tags;
create policy "tags_insert_org_admin"
on public.tags
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "tags_update_org_admin" on public.tags;
create policy "tags_update_org_admin"
on public.tags
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "tags_delete_org_admin" on public.tags;
create policy "tags_delete_org_admin"
on public.tags
for delete
using (public.is_org_admin(org_id));

drop policy if exists "referral_funnels_select_org_member" on public.referral_funnels;
create policy "referral_funnels_select_org_member"
on public.referral_funnels
for select
using (public.is_org_member(org_id));

drop policy if exists "referral_funnels_insert_org_admin" on public.referral_funnels;
create policy "referral_funnels_insert_org_admin"
on public.referral_funnels
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "referral_funnels_update_org_admin" on public.referral_funnels;
create policy "referral_funnels_update_org_admin"
on public.referral_funnels
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "referral_funnels_delete_org_admin" on public.referral_funnels;
create policy "referral_funnels_delete_org_admin"
on public.referral_funnels
for delete
using (public.is_org_admin(org_id));

drop policy if exists "referral_sources_select_org_member" on public.referral_sources;
create policy "referral_sources_select_org_member"
on public.referral_sources
for select
using (public.is_org_member(org_id));

drop policy if exists "referral_sources_insert_org_admin" on public.referral_sources;
create policy "referral_sources_insert_org_admin"
on public.referral_sources
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "referral_sources_update_org_admin" on public.referral_sources;
create policy "referral_sources_update_org_admin"
on public.referral_sources
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "referral_sources_delete_org_admin" on public.referral_sources;
create policy "referral_sources_delete_org_admin"
on public.referral_sources
for delete
using (public.is_org_admin(org_id));

drop policy if exists "payment_terms_select_org_member" on public.payment_terms;
create policy "payment_terms_select_org_member"
on public.payment_terms
for select
using (public.is_org_member(org_id));

drop policy if exists "payment_terms_insert_org_admin" on public.payment_terms;
create policy "payment_terms_insert_org_admin"
on public.payment_terms
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "payment_terms_update_org_admin" on public.payment_terms;
create policy "payment_terms_update_org_admin"
on public.payment_terms
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "payment_terms_delete_org_admin" on public.payment_terms;
create policy "payment_terms_delete_org_admin"
on public.payment_terms
for delete
using (public.is_org_admin(org_id));

drop policy if exists "clients_select_org_member" on public.clients;
create policy "clients_select_org_member"
on public.clients
for select
using (public.is_org_member(org_id));

drop policy if exists "clients_insert_org_admin" on public.clients;
create policy "clients_insert_org_admin"
on public.clients
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "clients_update_org_admin" on public.clients;
create policy "clients_update_org_admin"
on public.clients
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "clients_delete_org_admin" on public.clients;
create policy "clients_delete_org_admin"
on public.clients
for delete
using (public.is_org_admin(org_id));

drop policy if exists "client_addresses_select_org_member" on public.client_addresses;
create policy "client_addresses_select_org_member"
on public.client_addresses
for select
using (public.is_org_member(org_id));

drop policy if exists "client_addresses_insert_org_admin" on public.client_addresses;
create policy "client_addresses_insert_org_admin"
on public.client_addresses
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "client_addresses_update_org_admin" on public.client_addresses;
create policy "client_addresses_update_org_admin"
on public.client_addresses
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "client_addresses_delete_org_admin" on public.client_addresses;
create policy "client_addresses_delete_org_admin"
on public.client_addresses
for delete
using (public.is_org_admin(org_id));

drop policy if exists "client_contacts_select_org_member" on public.client_contacts;
create policy "client_contacts_select_org_member"
on public.client_contacts
for select
using (public.is_org_member(org_id));

drop policy if exists "client_contacts_insert_org_admin" on public.client_contacts;
create policy "client_contacts_insert_org_admin"
on public.client_contacts
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "client_contacts_update_org_admin" on public.client_contacts;
create policy "client_contacts_update_org_admin"
on public.client_contacts
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "client_contacts_delete_org_admin" on public.client_contacts;
create policy "client_contacts_delete_org_admin"
on public.client_contacts
for delete
using (public.is_org_admin(org_id));

drop policy if exists "client_tags_select_org_member" on public.client_tags;
create policy "client_tags_select_org_member"
on public.client_tags
for select
using (public.is_org_member(org_id));

drop policy if exists "client_tags_insert_org_admin" on public.client_tags;
create policy "client_tags_insert_org_admin"
on public.client_tags
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "client_tags_update_org_admin" on public.client_tags;
create policy "client_tags_update_org_admin"
on public.client_tags
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "client_tags_delete_org_admin" on public.client_tags;
create policy "client_tags_delete_org_admin"
on public.client_tags
for delete
using (public.is_org_admin(org_id));

drop policy if exists "notes_select_org_member" on public.notes;
create policy "notes_select_org_member"
on public.notes
for select
using (public.is_org_member(org_id));

drop policy if exists "notes_insert_org_admin" on public.notes;
create policy "notes_insert_org_admin"
on public.notes
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "notes_update_org_admin" on public.notes;
create policy "notes_update_org_admin"
on public.notes
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "notes_delete_org_admin" on public.notes;
create policy "notes_delete_org_admin"
on public.notes
for delete
using (public.is_org_admin(org_id));

drop policy if exists "note_attachments_select_org_member" on public.note_attachments;
create policy "note_attachments_select_org_member"
on public.note_attachments
for select
using (public.is_org_member(org_id));

drop policy if exists "note_attachments_insert_org_admin" on public.note_attachments;
create policy "note_attachments_insert_org_admin"
on public.note_attachments
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "note_attachments_update_org_admin" on public.note_attachments;
create policy "note_attachments_update_org_admin"
on public.note_attachments
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "note_attachments_delete_org_admin" on public.note_attachments;
create policy "note_attachments_delete_org_admin"
on public.note_attachments
for delete
using (public.is_org_admin(org_id));

drop policy if exists "tasks_select_org_member" on public.tasks;
create policy "tasks_select_org_member"
on public.tasks
for select
using (public.is_org_member(org_id));

drop policy if exists "tasks_insert_org_admin" on public.tasks;
create policy "tasks_insert_org_admin"
on public.tasks
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "tasks_update_org_admin" on public.tasks;
create policy "tasks_update_org_admin"
on public.tasks
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "tasks_delete_org_admin" on public.tasks;
create policy "tasks_delete_org_admin"
on public.tasks
for delete
using (public.is_org_admin(org_id));

drop policy if exists "task_followers_select_org_member" on public.task_followers;
create policy "task_followers_select_org_member"
on public.task_followers
for select
using (public.is_org_member(org_id));

drop policy if exists "task_followers_insert_org_admin" on public.task_followers;
create policy "task_followers_insert_org_admin"
on public.task_followers
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "task_followers_update_org_admin" on public.task_followers;
create policy "task_followers_update_org_admin"
on public.task_followers
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "task_followers_delete_org_admin" on public.task_followers;
create policy "task_followers_delete_org_admin"
on public.task_followers
for delete
using (public.is_org_admin(org_id));

drop policy if exists "communications_select_org_member" on public.communications;
create policy "communications_select_org_member"
on public.communications
for select
using (public.is_org_member(org_id));

drop policy if exists "communications_insert_org_admin" on public.communications;
create policy "communications_insert_org_admin"
on public.communications
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "communications_update_org_admin" on public.communications;
create policy "communications_update_org_admin"
on public.communications
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "communications_delete_org_admin" on public.communications;
create policy "communications_delete_org_admin"
on public.communications
for delete
using (public.is_org_admin(org_id));

drop policy if exists "communication_attachments_select_org_member" on public.communication_attachments;
create policy "communication_attachments_select_org_member"
on public.communication_attachments
for select
using (public.is_org_member(org_id));

drop policy if exists "communication_attachments_insert_org_admin" on public.communication_attachments;
create policy "communication_attachments_insert_org_admin"
on public.communication_attachments
for insert
with check (public.is_org_admin(org_id));

drop policy if exists "communication_attachments_update_org_admin" on public.communication_attachments;
create policy "communication_attachments_update_org_admin"
on public.communication_attachments
for update
using (public.is_org_admin(org_id))
with check (public.is_org_admin(org_id));

drop policy if exists "communication_attachments_delete_org_admin" on public.communication_attachments;
create policy "communication_attachments_delete_org_admin"
on public.communication_attachments
for delete
using (public.is_org_admin(org_id));
