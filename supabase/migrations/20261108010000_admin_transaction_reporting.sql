alter table public.orders
  add column confirmed_at timestamptz;

update public.orders as orders
set confirmed_at = coalesce(
  (
    select min(timeline.occurred_at)
    from public.order_timeline as timeline
    where timeline.order_id = orders.id
      and timeline.event_type in ('accepted', 'proposal_accepted')
  ),
  orders.updated_at
)
where orders.status in ('accepted', 'ready_for_collection', 'completed');

create or replace function public.set_order_confirmation_timestamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status in ('accepted', 'ready_for_collection', 'completed')
    and new.confirmed_at is null then
    new.confirmed_at := now();
  end if;
  return new;
end;
$$;

create trigger orders_set_confirmation_timestamp
  before insert or update of status on public.orders
  for each row execute function public.set_order_confirmation_timestamp();

revoke all on function public.set_order_confirmation_timestamp() from public, anon, authenticated;

create policy "Admins read all orders"
  on public.orders for select to authenticated
  using ((select public.is_admin()));

create policy "Admins read all order timelines"
  on public.order_timeline for select to authenticated
  using ((select public.is_admin()));
