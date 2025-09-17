-- Enable required extensions
create extension if not exists "pgcrypto" with schema public;

-- Application schema helpers
create schema if not exists app;

-- ENUM definitions
create type app.user_role as enum ('admin', 'manager', 'rep');
create type app.activity_type as enum ('llamada', 'reunión', 'correo', 'tarea');
create type app.activity_status as enum ('pendiente', 'completada');
create type app.activity_priority as enum ('alta', 'media', 'baja');
create type app.lead_stage as enum ('Nuevo', 'Contactado', 'Calificado', 'En Negociación', 'Cerrado');
create type app.lead_status as enum ('nuevo', 'en_progreso', 'cerrado');
create type app.lead_source as enum ('Web', 'Evento', 'Referencia', 'Campaña', 'Inbound');
create type app.opportunity_stage as enum (
  'Prospección',
  'Descubrimiento',
  'Propuesta',
  'Negociación',
  'Cerrado Ganado',
  'Cerrado Perdido'
);

-- Helper functions
create or replace function app.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Core tables
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  org_id uuid references organizations(id) on delete set null,
  role app.user_role not null default 'rep',
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table teams (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table team_members (
  team_id uuid references teams(id) on delete cascade,
  profile_id uuid references profiles(id) on delete cascade,
  role app.user_role not null default 'rep',
  created_at timestamptz not null default timezone('utc', now()),
  primary key (team_id, profile_id)
);

create table accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  industry text,
  region text,
  health text,
  website text,
  annual_revenue numeric,
  owner_id uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  owner_id uuid references profiles(id) on delete set null,
  name text not null,
  email text,
  phone text,
  title text,
  last_interaction_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table leads (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  owner_id uuid references profiles(id) on delete set null,
  team_id uuid references teams(id) on delete set null,
  name text not null,
  company text,
  title text,
  email text,
  phone text,
  notes text,
  status app.lead_status not null default 'nuevo',
  stage app.lead_stage not null default 'Nuevo',
  source app.lead_source not null default 'Web',
  score integer,
  value numeric,
  last_activity_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table opportunities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  account_id uuid references accounts(id) on delete set null,
  owner_id uuid references profiles(id) on delete set null,
  team_id uuid references teams(id) on delete set null,
  name text not null,
  stage app.opportunity_stage not null default 'Prospección',
  amount numeric,
  probability numeric,
  close_date date,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create type app.pricing_mode as enum ('concesión', 'alquiler', 'venta');

create table products (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  category text not null,
  pricing_mode app.pricing_mode not null default 'venta',
  base_monthly_revenue numeric,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table opportunity_products (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  name text not null,
  category text,
  quantity numeric not null default 1,
  pricing_mode app.pricing_mode not null,
  monthly_revenue numeric not null,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  opportunity_id uuid references opportunities(id) on delete set null,
  owner_id uuid references profiles(id) on delete set null,
  team_id uuid references teams(id) on delete set null,
  subject text not null,
  notes text,
  type app.activity_type not null default 'tarea',
  status app.activity_status not null default 'pendiente',
  priority app.activity_priority not null default 'media',
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table attachments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  activity_id uuid references activities(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  opportunity_id uuid references opportunities(id) on delete set null,
  storage_path text not null,
  file_name text not null,
  content_type text,
  file_size integer,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);

-- Helper functions (now that tables exist)
create or replace function app.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid();
$$;

create or replace function app.current_org()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id
  from profiles
  where id = auth.uid();
$$;

create or replace function app.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select role = 'admin' from profiles where id = auth.uid()), false);
$$;

create or replace function app.has_team_access(entity_org uuid, entity_team uuid, entity_owner uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    app.current_org() = entity_org
    and (
      app.is_admin()
      or entity_owner = auth.uid()
      or (
        entity_team is not null
        and exists (
          select 1
          from team_members tm
          where tm.team_id = entity_team
            and tm.profile_id = auth.uid()
        )
      )
    );
$$;

-- Triggers
create trigger set_profiles_updated_at
before update on profiles
for each row
execute procedure app.set_updated_at();

create trigger set_teams_updated_at
before update on teams
for each row
execute procedure app.set_updated_at();

create trigger set_accounts_updated_at
before update on accounts
for each row
execute procedure app.set_updated_at();

create trigger set_contacts_updated_at
before update on contacts
for each row
execute procedure app.set_updated_at();

create trigger set_leads_updated_at
before update on leads
for each row
execute procedure app.set_updated_at();

create trigger set_opportunities_updated_at
before update on opportunities
for each row
execute procedure app.set_updated_at();

create trigger set_activities_updated_at
before update on activities
for each row
execute procedure app.set_updated_at();

-- Auto profile provisioning on new auth user
create or replace function app.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_org uuid;
  default_role app.user_role := 'rep';
begin
  select id into default_org
  from organizations
  order by created_at asc
  limit 1;

  if default_org is null then
    default_org := gen_random_uuid();
    insert into organizations (id, name, created_at, updated_at)
    values (default_org, coalesce(new.raw_user_meta_data->>'company', 'Nevados Org'), timezone('utc', now()), timezone('utc', now()));
    default_role := 'admin';
  end if;

  insert into profiles (id, org_id, role, full_name, email)
  values (new.id, default_org, default_role, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure app.handle_new_user();

-- Row Level Security
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table teams enable row level security;
alter table team_members enable row level security;
alter table accounts enable row level security;
alter table contacts enable row level security;
alter table leads enable row level security;
alter table opportunities enable row level security;
alter table activities enable row level security;
alter table attachments enable row level security;

-- Organizations: only members of org may view/update
create policy "Org members can view" on organizations
for select
using (id = app.current_org());

create policy "Admins manage organization" on organizations
for all
using (id = app.current_org() and app.is_admin())
with check (id = app.current_org());

-- Profiles
create policy "View own or same org profiles" on profiles
for select
using (
  id = auth.uid()
  or (org_id = app.current_org() and app.is_admin())
);

create policy "Update own profile" on profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "Admins manage profiles" on profiles
for all
using (org_id = app.current_org() and app.is_admin())
with check (org_id = app.current_org());

-- Teams
create policy "Team visibility" on teams
for select
using (org_id = app.current_org() and (app.is_admin() or exists (select 1 from team_members tm where tm.team_id = teams.id and tm.profile_id = auth.uid())));

create policy "Admins manage teams" on teams
for all
using (org_id = app.current_org() and app.is_admin())
with check (org_id = app.current_org());

-- Team members
create policy "View team membership" on team_members
for select
using (
  exists (select 1 from teams t where t.id = team_members.team_id and t.org_id = app.current_org())
  and (
    app.is_admin()
    or profile_id = auth.uid()
    or exists (select 1 from team_members tm2 where tm2.team_id = team_members.team_id and tm2.profile_id = auth.uid() and tm2.role in ('admin','manager'))
  )
);

create policy "Admins manage team members" on team_members
for all
using (
  exists (select 1 from teams t where t.id = team_members.team_id and t.org_id = app.current_org())
  and app.is_admin()
)
with check (
  exists (select 1 from teams t where t.id = team_members.team_id and t.org_id = app.current_org())
);

-- Accounts
create policy "Accounts access" on accounts
for select
using (app.has_team_access(org_id, null, owner_id));

create policy "Accounts write" on accounts
for all
using (app.has_team_access(org_id, null, owner_id))
with check (org_id = app.current_org());

-- Contacts
create policy "Contacts access" on contacts
for select
using (app.has_team_access(org_id, null, owner_id));

create policy "Contacts write" on contacts
for all
using (app.has_team_access(org_id, null, owner_id))
with check (org_id = app.current_org());

-- Leads
create policy "Leads access" on leads
for select
using (app.has_team_access(org_id, team_id, owner_id));

create policy "Leads write" on leads
for all
using (app.has_team_access(org_id, team_id, owner_id))
with check (org_id = app.current_org());

-- Opportunities
create policy "Opportunities access" on opportunities
for select
using (app.has_team_access(org_id, team_id, owner_id));

create policy "Opportunities write" on opportunities
for all
using (app.has_team_access(org_id, team_id, owner_id))
with check (org_id = app.current_org());

-- Activities
create policy "Activities access" on activities
for select
using (app.has_team_access(org_id, team_id, owner_id));

create policy "Activities write" on activities
for all
using (app.has_team_access(org_id, team_id, owner_id))
with check (org_id = app.current_org());

-- Attachments
create policy "Attachments access" on attachments
for select
using (app.has_team_access(org_id, null, created_by));

create policy "Attachments write" on attachments
for all
using (app.has_team_access(org_id, null, created_by))
with check (org_id = app.current_org());

-- Storage bucket for CRM attachments
insert into storage.buckets (id, name, public)
values ('crm-attachments', 'crm-attachments', false)
on conflict (id) do nothing;

-- Restrict storage access to authenticated users within org via policies
create or replace function app.attachment_path_matches_org(path text)
returns boolean
language sql
stable
security definer
as $$
  select path like (app.current_org()::text || '/%');
$$;

create policy "Allow authenticated upload" on storage.objects
for insert with check (
  bucket_id = 'crm-attachments'
  and auth.role() = 'authenticated'
  and app.attachment_path_matches_org(name)
);

create policy "Allow authenticated select" on storage.objects
for select using (
  bucket_id = 'crm-attachments'
  and auth.role() = 'authenticated'
  and app.attachment_path_matches_org(name)
);

create policy "Allow authenticated update" on storage.objects
for update using (
  bucket_id = 'crm-attachments'
  and auth.role() = 'authenticated'
  and app.attachment_path_matches_org(name)
)
with check (
  bucket_id = 'crm-attachments'
  and app.attachment_path_matches_org(name)
);

create policy "Allow authenticated delete" on storage.objects
for delete using (
  bucket_id = 'crm-attachments'
  and auth.role() = 'authenticated'
  and app.attachment_path_matches_org(name)
);
