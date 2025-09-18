grant usage on schema app to authenticated;
grant usage on schema app to service_role;

grant execute on all functions in schema app to authenticated;
grant execute on all functions in schema app to service_role;

alter default privileges in schema app
  grant execute on functions to authenticated;

alter default privileges in schema app
  grant execute on functions to service_role;
