create table product_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_category text,
  service_type text,
  coverage_zone text,
  name text not null,
  description text,
  priority integer not null default 100,
  conditions jsonb not null,
  effects jsonb not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table product_rules enable row level security;

alter table product_rules
  add constraint product_rules_priority_check
    check (priority >= 0);

create index product_rules_org_idx on product_rules(org_id);
create index product_rules_product_idx on product_rules(product_id);
create index product_rules_active_idx on product_rules(org_id, is_active);
create index product_rules_conditions_idx on product_rules using gin (conditions);
create index product_rules_effects_idx on product_rules using gin (effects);

create policy "Product rules access" on product_rules
for select using (org_id = app.current_org());

create policy "Product rules manage" on product_rules
for all using (org_id = app.current_org())
with check (org_id = app.current_org());

alter table opportunities
  add column has_contract boolean,
  add column contract_term_months integer,
  add column coverage_zone text,
  add column service_type text;

alter table opportunity_products
  add column unit_price numeric,
  add column total_price numeric,
  add column benefits text[] default '{}',
  add column extra_charges numeric,
  add column applied_rule_ids uuid[] default '{}',
  add column rule_snapshot jsonb;

alter table opportunity_products
  add constraint opportunity_products_unit_price_check
    check (unit_price is null or unit_price >= 0);

alter table opportunity_products
  add constraint opportunity_products_total_price_check
    check (total_price is null or total_price >= 0);
