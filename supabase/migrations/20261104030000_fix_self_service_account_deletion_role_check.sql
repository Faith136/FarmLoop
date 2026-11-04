create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  account_role text;
begin
  if current_user_id is null then
    raise exception 'Authentication is required to delete an account.';
  end if;

  select role
    into account_role
  from public.profiles
  where id = current_user_id;

  if account_role is null or account_role not in ('buyer', 'seller') then
    raise exception 'Only buyer and seller accounts can be deleted.';
  end if;

  delete from auth.users
  where id = current_user_id;

  if not found then
    raise exception 'The account could not be found.';
  end if;
end;
$$;
