create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 100),
  role text not null default 'buyer' check (role in ('buyer', 'seller', 'admin')),
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      split_part(coalesce(new.email, 'FarmLoop member'), '@', 1)
    ),
    case when requested_role in ('buyer', 'seller') then requested_role else 'buyer' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.prevent_self_role_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() = old.id and new.role is distinct from old.role then
    raise exception 'Account roles cannot be changed by the account owner.';
  end if;
  return new;
end;
$$;

create trigger profiles_prevent_self_role_change
  before update of role on public.profiles
  for each row execute function public.prevent_self_role_change();

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
  );
$$;

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
  );
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.is_seller() from public;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_admin() to anon;
grant execute on function public.is_seller() to authenticated;

create table public.catalogue_products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  category text not null check (
    category in (
      'Crop residue',
      'Animal manure',
      'Agricultural processing waste',
      'Compost'
    )
  ),
  description text not null check (char_length(description) between 5 and 500),
  icon text not null default '🌱',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.seller_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles (id) on delete cascade,
  seller_name text not null,
  seller_email text not null,
  product_id uuid not null references public.catalogue_products (id) on delete restrict,
  quantity_available numeric not null check (quantity_available > 0),
  unit text not null check (unit in ('kg', 'tonne', 'bag')),
  price_per_unit numeric not null check (price_per_unit >= 0),
  location text not null check (char_length(location) between 2 and 120),
  condition text not null check (char_length(condition) between 2 and 240),
  available_from date not null,
  available_until date not null,
  status text not null default 'active' check (status in ('active', 'paused', 'sold_out')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (available_until >= available_from)
);

create index seller_listings_seller_id_idx on public.seller_listings (seller_id);
create index seller_listings_product_id_idx on public.seller_listings (product_id);
create index seller_listings_active_idx on public.seller_listings (status, available_until);

create or replace function public.set_listing_seller_details()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  select profiles.display_name, users.email
    into new.seller_name, new.seller_email
  from public.profiles
  join auth.users as users on users.id = profiles.id
  where profiles.id = new.seller_id
    and profiles.role = 'seller';

  if not found then
    raise exception 'Listings must belong to a registered seller.';
  end if;

  return new;
end;
$$;

create trigger seller_listings_set_seller_details
  before insert or update of seller_id, seller_name, seller_email on public.seller_listings
  for each row execute function public.set_listing_seller_details();

alter table public.profiles enable row level security;
alter table public.catalogue_products enable row level security;
alter table public.seller_listings enable row level security;

create policy "Users read their own profile and admins read all profiles"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "Users update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "Anyone can read the product catalogue"
  on public.catalogue_products for select to anon, authenticated
  using (true);

create policy "Admins manage the product catalogue"
  on public.catalogue_products for all to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Anyone can read active listings and sellers read their own"
  on public.seller_listings for select to anon, authenticated
  using (
    (status = 'active' and quantity_available > 0 and available_until >= current_date)
    or seller_id = (select auth.uid())
    or (select public.is_admin())
  );

create policy "Sellers create their own listings"
  on public.seller_listings for insert to authenticated
  with check (
    seller_id = (select auth.uid())
    and (select public.is_seller())
  );

create policy "Sellers and admins update listings"
  on public.seller_listings for update to authenticated
  using (seller_id = (select auth.uid()) or (select public.is_admin()))
  with check (seller_id = (select auth.uid()) or (select public.is_admin()));

create policy "Sellers and admins delete listings"
  on public.seller_listings for delete to authenticated
  using (seller_id = (select auth.uid()) or (select public.is_admin()));

grant select on public.catalogue_products to anon, authenticated;
grant select on public.seller_listings to anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, last_login_at) on public.profiles to authenticated;
grant insert, update, delete on public.catalogue_products to authenticated;
grant insert, update, delete on public.seller_listings to authenticated;

insert into public.catalogue_products (name, category, description, icon)
values
  ('Maize stalks', 'Crop residue', 'Dried maize stalks suitable for animal feed and mulching.', '🌾'),
  ('Rice husks', 'Crop residue', 'Lightweight rice milling by-product for compost and bedding.', '🌱'),
  ('Poultry manure', 'Animal manure', 'A nutrient-rich soil amendment from poultry farms.', '🐔'),
  ('Dairy manure', 'Animal manure', 'Farmyard manure for composting and soil improvement.', '🐄'),
  ('Coffee husks', 'Agricultural processing waste', 'Coffee processing by-product for compost and mulch.', '☕'),
  ('Sugarcane bagasse', 'Agricultural processing waste', 'Fibrous sugarcane residue for composting and other uses.', '🌿');
