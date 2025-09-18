alter table products enable row level security;
alter table product_pricing_rules enable row level security;
alter table product_rules enable row level security;

do $$
begin
  create policy "Products access" on products
    for select
    using (org_id = app.current_org());
exception when duplicate_object then
  null;
end $$;

do $$
begin
  create policy "Products manage" on products
    for all
    using (org_id = app.current_org())
    with check (org_id = app.current_org());
exception when duplicate_object then
  null;
end $$;

do $$
begin
  create policy "Product pricing rules access" on product_pricing_rules
    for select
    using (org_id = app.current_org());
exception when duplicate_object then
  null;
end $$;

do $$
begin
  create policy "Product pricing rules manage" on product_pricing_rules
    for all
    using (org_id = app.current_org())
    with check (org_id = app.current_org());
exception when duplicate_object then
  null;
end $$;

do $$
begin
  create policy "Product rules access" on product_rules
    for select
    using (org_id = app.current_org());
exception when duplicate_object then
  null;
end $$;

do $$
begin
  create policy "Product rules manage" on product_rules
    for all
    using (org_id = app.current_org())
    with check (org_id = app.current_org());
exception when duplicate_object then
  null;
end $$;
