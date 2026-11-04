alter table public.profiles
  add column email text,
  add column is_suspended boolean not null default false;

update public.profiles
set email = users.email
from auth.users as users
where users.id = profiles.id;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, display_name, role, email)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(coalesce(new.email, 'FarmLoop member'), '@', 1)
    ),
    case when requested_role in ('buyer', 'seller') then requested_role else 'buyer' end,
    new.email
  );
  return new;
end;
$$;

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;
  return new;
end;
$$;

revoke all on function public.sync_profile_email() from public, anon, authenticated;

create trigger auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.sync_profile_email();

create table public.account_activity (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  event_type text not null check (
    event_type in ('account_created', 'signed_in', 'suspended', 'reactivated')
  ),
  occurred_at timestamptz not null default now()
);

create index account_activity_profile_time_idx
  on public.account_activity (profile_id, occurred_at desc);

insert into public.account_activity (profile_id, event_type, occurred_at)
select id, 'account_created', created_at
from public.profiles;

insert into public.account_activity (profile_id, actor_id, event_type, occurred_at)
select id, id, 'signed_in', last_login_at
from public.profiles
where last_login_at is not null;

create table public.admin_action_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid not null references public.profiles (id) on delete restrict,
  action text not null,
  target_type text not null check (target_type in ('account', 'listing', 'catalogue')),
  target_id uuid,
  occurred_at timestamptz not null default now()
);

create index admin_action_log_time_idx
  on public.admin_action_log (occurred_at desc);

alter table public.account_activity enable row level security;
alter table public.admin_action_log enable row level security;

create policy "Admins read account activity"
  on public.account_activity for select to authenticated
  using ((select public.is_admin()));

create policy "Admins read admin action history"
  on public.admin_action_log for select to authenticated
  using ((select public.is_admin()));

revoke all on public.account_activity, public.admin_action_log from public, anon, authenticated;
grant select on public.account_activity, public.admin_action_log to authenticated;

revoke update on public.profiles from public, anon, authenticated;
revoke update (display_name, last_login_at, role, email, is_suspended)
  on public.profiles from authenticated;
grant update (display_name, last_login_at) on public.profiles to authenticated;

create or replace function public.is_account_active()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and not is_suspended
  );
$$;

revoke all on function public.is_account_active() from public;
grant execute on function public.is_account_active() to authenticated;

drop policy if exists "Users update their own profile" on public.profiles;
create policy "Active users update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) and (select public.is_account_active()))
  with check (id = (select auth.uid()) and (select public.is_account_active()));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
      and not is_suspended
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to anon;

create or replace function public.is_seller()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'seller'
      and not is_suspended
  );
$$;

revoke all on function public.is_seller() from public;
grant execute on function public.is_seller() to authenticated;

create or replace function public.is_marketplace_seller_active(target_seller_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = target_seller_id
      and role = 'seller'
      and not is_suspended
  );
$$;

revoke all on function public.is_marketplace_seller_active(uuid) from public;
grant execute on function public.is_marketplace_seller_active(uuid) to anon, authenticated;

create or replace function public.log_profile_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  activity_event text;
begin
  if tg_op = 'INSERT' then
    insert into public.account_activity (profile_id, event_type)
    values (new.id, 'account_created');
    return new;
  end if;

  if new.last_login_at is distinct from old.last_login_at
    and new.last_login_at is not null then
    insert into public.account_activity (profile_id, actor_id, event_type)
    values (new.id, new.id, 'signed_in');
  end if;

  if new.is_suspended is distinct from old.is_suspended then
    activity_event := case
      when new.is_suspended then 'suspended'
      else 'reactivated'
    end;

    insert into public.account_activity (profile_id, actor_id, event_type)
    values (new.id, auth.uid(), activity_event);

    if public.is_admin() then
      insert into public.admin_action_log (actor_id, action, target_type, target_id)
      values (auth.uid(), activity_event, 'account', new.id);
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.log_profile_activity() from public, anon, authenticated;

create trigger profiles_log_activity
  after insert or update of last_login_at, is_suspended on public.profiles
  for each row execute function public.log_profile_activity();

create or replace function public.admin_set_account_suspended(
  target_user_id uuid,
  suspend_account boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Administrator access is required.';
  end if;

  update public.profiles
  set is_suspended = suspend_account
  where id = target_user_id
    and role in ('buyer', 'seller');

  if not found then
    raise exception 'Buyer or seller account not found.';
  end if;
end;
$$;

revoke all on function public.admin_set_account_suspended(uuid, boolean) from public;
grant execute on function public.admin_set_account_suspended(uuid, boolean) to authenticated;

drop policy if exists "Sellers and admins update listings" on public.seller_listings;
create policy "Active sellers and admins update listings"
  on public.seller_listings for update to authenticated
  using (
    (seller_id = (select auth.uid()) and (select public.is_account_active()))
    or (select public.is_admin())
  )
  with check (
    (seller_id = (select auth.uid()) and (select public.is_account_active()))
    or (select public.is_admin())
  );

drop policy if exists "Anyone can read active listings and sellers read their own"
  on public.seller_listings;
create policy "Anyone can read available listings from active sellers"
  on public.seller_listings for select to anon, authenticated
  using (
    (
      status = 'active'
      and quantity_available > 0
      and available_until >= current_date
      and public.is_marketplace_seller_active(seller_id)
    )
    or (seller_id = (select auth.uid()) and (select public.is_account_active()))
    or (select public.is_admin())
  );

drop policy if exists "Sellers and admins delete listings" on public.seller_listings;
create policy "Active sellers and admins delete listings"
  on public.seller_listings for delete to authenticated
  using (
    (seller_id = (select auth.uid()) and (select public.is_account_active()))
    or (select public.is_admin())
  );

create or replace function public.log_admin_catalogue_action()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  action_name text;
  target_id uuid;
begin
  if not public.is_admin() then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    action_name := 'catalogue_product_created';
    target_id := new.id;
  elsif tg_op = 'DELETE' then
    action_name := 'catalogue_product_deleted';
    target_id := old.id;
  else
    action_name := 'catalogue_product_updated';
    target_id := new.id;
  end if;

  insert into public.admin_action_log (actor_id, action, target_type, target_id)
  values (auth.uid(), action_name, 'catalogue', target_id);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.log_admin_catalogue_action() from public, anon, authenticated;

create trigger catalogue_products_log_admin_actions
  after insert or update or delete on public.catalogue_products
  for each row execute function public.log_admin_catalogue_action();

create or replace function public.log_admin_listing_action()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  action_name text;
  target_id uuid;
begin
  if not public.is_admin() then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    action_name := 'listing_deleted';
    target_id := old.id;
  elsif new.status is distinct from old.status then
    action_name := 'listing_status_changed';
    target_id := new.id;
  else
    return new;
  end if;

  insert into public.admin_action_log (actor_id, action, target_type, target_id)
  values (auth.uid(), action_name, 'listing', target_id);

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function public.log_admin_listing_action() from public, anon, authenticated;

create trigger seller_listings_log_admin_actions
  after update or delete on public.seller_listings
  for each row execute function public.log_admin_listing_action();
