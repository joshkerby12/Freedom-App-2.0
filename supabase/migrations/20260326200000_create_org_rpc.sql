-- create_org(name)
-- SECURITY DEFINER: runs as the function owner (postgres), bypassing RLS.
-- Required because the org_members SELECT policy is self-referential —
-- checking org_members membership to read org_members causes infinite
-- recursion when no row exists yet (i.e. during first-time org creation).
-- The Flutter app avoids this by using the service role key in an Edge Function.
-- This RPC gives the web layer the same capability safely.

create or replace function public.create_org(org_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_user_id uuid;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'Authentication required';
  end if;

  v_org_id := gen_random_uuid();

  insert into public.organizations (id, name)
  values (v_org_id, trim(org_name));

  insert into public.org_members (org_id, profile_id, role)
  values (v_org_id, v_user_id, 'owner');

  insert into public.org_settings (org_id, company_name)
  values (v_org_id, trim(org_name));

  return v_org_id;
end;
$$;

-- Only authenticated users can call this
revoke all on function public.create_org(text) from public;
grant execute on function public.create_org(text) to authenticated;
