alter table public.orders
  drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (
    status in (
      'pending',
      'countered',
      'accepted',
      'rejected',
      'cancelled',
      'ready_for_collection',
      'completed'
    )
  );

create or replace function public.cancel_order_request(p_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders%rowtype;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found
    or v_order.buyer_id <> v_user_id
    or v_order.status not in ('pending', 'countered') then
    raise exception 'This order request cannot be cancelled.';
  end if;

  if not (select public.is_account_active()) then
    raise exception 'An active buyer account is required.';
  end if;

  update public.orders
  set status = 'cancelled',
      proposed_quantity = null,
      proposed_unit_price = null,
      updated_at = now()
  where id = p_order_id;

  insert into public.order_timeline (order_id, actor_id, event_type, note)
  values (
    p_order_id,
    v_user_id,
    'cancelled',
    'Buyer cancelled the order request.'
  );

  insert into public.notifications (
    user_id,
    order_id,
    notification_type,
    title,
    body,
    href
  )
  values (
    v_order.seller_id,
    p_order_id,
    'order_rejected',
    'Order request cancelled',
    v_order.buyer_name || ' cancelled the order request.',
    '/orders/' || p_order_id::text
  );

  return p_order_id;
end;
$$;

revoke all on function public.cancel_order_request(uuid) from public, anon;
grant execute on function public.cancel_order_request(uuid) to authenticated;
