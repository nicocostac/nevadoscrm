do $$
begin
  drop policy if exists "Products access" on products;
  drop policy if exists "Products manage" on products;
exception when undefined_object then
  null;
end $$;

do $$
begin
  drop policy if exists "Product pricing rules access" on product_pricing_rules;
  drop policy if exists "Product pricing rules manage" on product_pricing_rules;
exception when undefined_object then
  null;
end $$;

do $$
begin
  drop policy if exists "Product rules access" on product_rules;
  drop policy if exists "Product rules manage" on product_rules;
exception when undefined_object then
  null;
end $$;

create policy "Products access" on products
  for select using (
    exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.org_id = products.org_id
    )
  );

create policy "Products manage" on products
  for all using (
    exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.org_id = products.org_id
    )
  )
  with check (
    exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.org_id = products.org_id
    )
  );

create policy "Product pricing rules access" on product_pricing_rules
  for select using (
    exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.org_id = product_pricing_rules.org_id
    )
  );

create policy "Product pricing rules manage" on product_pricing_rules
  for all using (
    exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.org_id = product_pricing_rules.org_id
    )
  )
  with check (
    exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.org_id = product_pricing_rules.org_id
    )
  );

create policy "Product rules access" on product_rules
  for select using (
    exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.org_id = product_rules.org_id
    )
  );

create policy "Product rules manage" on product_rules
  for all using (
    exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.org_id = product_rules.org_id
    )
  )
  with check (
    exists (
      select 1
      from profiles p
      where p.id = auth.uid()
        and p.org_id = product_rules.org_id
    )
  );
