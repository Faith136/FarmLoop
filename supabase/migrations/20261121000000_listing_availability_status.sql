create or replace function public.sync_listing_status_on_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.quantity_available <= 0 then
    new.status := 'sold_out';
  elsif new.available_until < current_date then
    new.status := 'paused';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists seller_listings_sync_availability_status
  on public.seller_listings;

create trigger seller_listings_sync_availability_status
  before insert or update of quantity_available, available_until, status
  on public.seller_listings
  for each row execute function public.sync_listing_status_on_change();

create or replace function public.sync_expired_listing_statuses()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.seller_listings
  set status = 'sold_out',
      updated_at = now()
  where quantity_available <= 0
    and status is distinct from 'sold_out';

  update public.seller_listings
  set status = 'paused',
      updated_at = now()
  where quantity_available > 0
    and available_until < current_date
    and status is distinct from 'paused';
$$;

revoke all on function public.sync_expired_listing_statuses() from public, anon;
grant execute on function public.sync_expired_listing_statuses() to authenticated;

-- Normalize existing listings immediately.
select public.sync_expired_listing_statuses();

do $$
begin
  if exists (
    select 1
    from pg_available_extensions
    where name = 'pg_cron'
      and installed_version is not null
  ) then
    if not exists (
      select 1
      from cron.job
      where jobname = 'farmloop-sync-expired-listings'
    ) then
      perform cron.schedule(
        'farmloop-sync-expired-listings',
        '5 0 * * *',
        'select public.sync_expired_listing_statuses();'
      );
    end if;
  end if;
end;
$$;
