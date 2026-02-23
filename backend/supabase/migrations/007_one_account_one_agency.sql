-- Enforce: one account can be linked to only one agency at a time.
-- Rule: changing profiles.agency_id from one non-null value to another non-null value is blocked.
-- To move account to another agency: set agency_id = NULL first, then set new agency_id.

create or replace function public.prevent_direct_agency_reassignment()
returns trigger
language plpgsql
as $$
begin
  if old.agency_id is not null
     and new.agency_id is not null
     and old.agency_id <> new.agency_id then
    raise exception 'one_account_one_agency: clear agency_id before reassigning profile %', old.id
      using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_direct_agency_reassignment on public.profiles;

create trigger trg_prevent_direct_agency_reassignment
before update of agency_id on public.profiles
for each row
execute function public.prevent_direct_agency_reassignment();
