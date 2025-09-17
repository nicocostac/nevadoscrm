alter table profiles add column if not exists requires_password_reset boolean not null default true;

update profiles set requires_password_reset = true where requires_password_reset is null;

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

  insert into profiles (id, org_id, role, full_name, email, requires_password_reset)
  values (
    new.id,
    default_org,
    default_role,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    true
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
