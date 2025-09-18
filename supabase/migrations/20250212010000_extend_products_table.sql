alter table products
  add column allow_sale boolean not null default true,
  add column allow_rental boolean not null default false,
  add column allow_concession boolean not null default false,
  add column min_concession_units numeric,
  add column rental_monthly_fee numeric,
  add column notes text;

alter table products
  add constraint products_min_concession_units_check
    check (min_concession_units is null or min_concession_units >= 0);

alter table products
  add constraint products_rental_monthly_fee_check
    check (rental_monthly_fee is null or rental_monthly_fee >= 0);

create unique index if not exists products_org_name_unique on products (org_id, lower(name));

create index if not exists products_org_active_idx on products (org_id, is_active);
