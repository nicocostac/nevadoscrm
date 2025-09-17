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

create index opportunity_products_opportunity_idx on opportunity_products(opportunity_id);
