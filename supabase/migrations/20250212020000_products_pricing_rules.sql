alter table products
  rename column base_monthly_revenue to base_unit_price;

create table product_pricing_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  min_quantity numeric not null,
  max_quantity numeric,
  price numeric not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table product_pricing_rules enable row level security;

alter table product_pricing_rules
  add constraint product_pricing_rules_min_quantity_check
    check (min_quantity >= 0);

alter table product_pricing_rules
  add constraint product_pricing_rules_range_check
    check (max_quantity is null or max_quantity > min_quantity);

alter table product_pricing_rules
  add constraint product_pricing_rules_price_check
    check (price >= 0);

create index product_pricing_rules_product_idx on product_pricing_rules(product_id);
create index product_pricing_rules_org_idx on product_pricing_rules(org_id);

create policy "Product pricing rules access" on product_pricing_rules
for select using (org_id = app.current_org());

create policy "Product pricing rules manage" on product_pricing_rules
for all using (org_id = app.current_org())
with check (org_id = app.current_org());
