alter table public.seller_listings
  drop constraint if exists seller_listings_quantity_available_check,
  add constraint seller_listings_quantity_available_check check (quantity_available >= 0);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.seller_listings (id) on delete set null,
  product_id uuid not null references public.catalogue_products (id) on delete restrict,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  buyer_name text not null,
  seller_name text not null,
  product_name text not null,
  unit text not null check (unit in ('kg', 'tonne', 'bag')),
  requested_quantity numeric not null check (requested_quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  estimated_total numeric not null check (estimated_total >= 0),
  buyer_message text check (buyer_message is null or char_length(buyer_message) <= 1000),
  seller_message text check (seller_message is null or char_length(seller_message) <= 1000),
  status text not null default 'pending' check (
    status in ('pending', 'countered', 'accepted', 'rejected', 'ready_for_collection', 'completed')
  ),
  proposed_quantity numeric check (proposed_quantity is null or proposed_quantity > 0),
  proposed_unit_price numeric check (proposed_unit_price is null or proposed_unit_price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);

create index orders_buyer_created_idx on public.orders (buyer_id, created_at desc);
create index orders_seller_created_idx on public.orders (seller_id, created_at desc);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  buyer_id uuid not null references public.profiles (id) on delete cascade,
  seller_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  check (buyer_id <> seller_id)
);

create index conversations_buyer_recent_idx on public.conversations (buyer_id, last_message_at desc);
create index conversations_seller_recent_idx on public.conversations (seller_id, last_message_at desc);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index messages_conversation_created_idx on public.messages (conversation_id, created_at);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  order_id uuid references public.orders (id) on delete cascade,
  conversation_id uuid references public.conversations (id) on delete cascade,
  notification_type text not null check (
    notification_type in (
      'order_request',
      'order_accepted',
      'order_rejected',
      'order_countered',
      'order_ready',
      'order_completed',
      'new_message'
    )
  ),
  title text not null check (char_length(title) between 1 and 160),
  body text not null check (char_length(body) between 1 and 500),
  href text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notifications_user_recent_idx on public.notifications (user_id, created_at desc);

create table public.order_timeline (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  event_type text not null,
  note text not null,
  occurred_at timestamptz not null default now()
);

create index order_timeline_order_time_idx on public.order_timeline (order_id, occurred_at);

create or replace function public.is_order_participant(target_order_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.orders
    where id = target_order_id
      and (select public.is_account_active())
      and ((buyer_id = (select auth.uid())) or (seller_id = (select auth.uid())))
  );
$$;

revoke all on function public.is_order_participant(uuid) from public, anon;
grant execute on function public.is_order_participant(uuid) to authenticated;

drop policy if exists "Users read their own profile and admins read all profiles" on public.profiles;
create policy "Users read their own profile and admins read all profiles"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select public.is_admin())
  );

alter table public.orders enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.order_timeline enable row level security;

create policy "Order participants read their orders"
  on public.orders for select to authenticated
  using (
    (select public.is_account_active())
    and (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()))
  );

create policy "Order participants read their conversations"
  on public.conversations for select to authenticated
  using (
    (select public.is_account_active())
    and (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()))
  );

create policy "Conversation participants read messages"
  on public.messages for select to authenticated
  using (
    (select public.is_account_active())
    and exists (
      select 1 from public.conversations
      where id = conversation_id
        and (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()))
    )
  );

create policy "Participants send messages on accepted orders"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and (select public.is_account_active())
    and exists (
      select 1
      from public.conversations as c
      join public.orders as o on o.id = c.order_id
      where c.id = conversation_id
        and (c.buyer_id = (select auth.uid()) or c.seller_id = (select auth.uid()))
        and o.status in ('accepted', 'ready_for_collection', 'completed')
    )
  );

create policy "Users read their notifications"
  on public.notifications for select to authenticated
  using (user_id = (select auth.uid()) and (select public.is_account_active()));

create policy "Users mark their notifications as read"
  on public.notifications for update to authenticated
  using (user_id = (select auth.uid()) and (select public.is_account_active()))
  with check (user_id = (select auth.uid()) and (select public.is_account_active()));

create policy "Order participants read their timeline"
  on public.order_timeline for select to authenticated
  using (
    (select public.is_account_active())
    and (select public.is_order_participant(order_id))
  );

revoke all on public.orders, public.conversations, public.messages, public.notifications, public.order_timeline
  from public, anon, authenticated;
grant select on public.orders, public.conversations, public.messages, public.notifications, public.order_timeline
  to authenticated;
grant insert (conversation_id, sender_id, body) on public.messages to authenticated;
grant update (read_at) on public.notifications to authenticated;

create or replace function public.create_order_request(
  p_listing_id uuid,
  p_quantity numeric,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_buyer_id uuid := auth.uid();
  v_listing public.seller_listings%rowtype;
  v_product public.catalogue_products%rowtype;
  v_buyer_name text;
  v_order_id uuid;
begin
  if v_buyer_id is null or not exists (
    select 1 from public.profiles
    where id = v_buyer_id and role = 'buyer' and not is_suspended
  ) then
    raise exception 'An active buyer account is required to request an order.';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Enter a quantity greater than zero.';
  end if;
  if p_message is not null and char_length(btrim(p_message)) > 1000 then
    raise exception 'The message must be 1000 characters or fewer.';
  end if;

  select * into v_listing
  from public.seller_listings
  where id = p_listing_id
  for update;

  if not found or v_listing.status <> 'active'
    or v_listing.quantity_available <= 0
    or v_listing.available_from > current_date
    or v_listing.available_until < current_date then
    raise exception 'This listing is no longer available.';
  end if;
  if v_listing.seller_id = v_buyer_id then
    raise exception 'You cannot request an order from your own listing.';
  end if;
  if p_quantity > v_listing.quantity_available then
    raise exception 'The requested quantity exceeds the currently available amount.';
  end if;

  select * into v_product
  from public.catalogue_products
  where id = v_listing.product_id and is_active;
  if not found then
    raise exception 'This product is no longer available in the catalogue.';
  end if;

  select display_name into v_buyer_name
  from public.profiles where id = v_buyer_id;

  insert into public.orders (
    listing_id, product_id, buyer_id, seller_id, buyer_name, seller_name,
    product_name, unit, requested_quantity, unit_price, estimated_total,
    buyer_message
  )
  values (
    v_listing.id, v_listing.product_id, v_buyer_id, v_listing.seller_id,
    v_buyer_name, v_listing.seller_name, v_product.name, v_listing.unit,
    p_quantity, v_listing.price_per_unit,
    round(p_quantity * v_listing.price_per_unit, 2), nullif(btrim(p_message), '')
  )
  returning id into v_order_id;

  insert into public.order_timeline (order_id, actor_id, event_type, note)
  values (v_order_id, v_buyer_id, 'requested', 'Buyer submitted an order request.');
  insert into public.notifications (user_id, order_id, notification_type, title, body, href)
  values (
    v_listing.seller_id, v_order_id, 'order_request', 'New order request',
    v_buyer_name || ' requested ' || p_quantity::text || ' ' || v_listing.unit || ' of ' || v_product.name || '.',
    '/orders/' || v_order_id::text
  );
  return v_order_id;
end;
$$;

create or replace function public.accept_order_request(p_order_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders%rowtype;
  v_listing public.seller_listings%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.seller_id <> v_user_id or v_order.status <> 'pending' then
    raise exception 'This order request cannot be accepted.';
  end if;
  if not exists (
    select 1 from public.profiles where id = v_user_id and role = 'seller' and not is_suspended
  ) then
    raise exception 'An active seller account is required.';
  end if;

  select * into v_listing from public.seller_listings where id = v_order.listing_id for update;
  if not found or v_listing.status <> 'active'
    or v_listing.quantity_available < v_order.requested_quantity
    or v_listing.available_from > current_date
    or v_listing.available_until < current_date then
    raise exception 'There is not enough available stock to accept this request.';
  end if;

  update public.seller_listings
  set quantity_available = quantity_available - v_order.requested_quantity,
      status = case when quantity_available - v_order.requested_quantity = 0 then 'sold_out' else status end,
      updated_at = now()
  where id = v_listing.id;

  update public.orders
  set status = 'accepted', updated_at = now()
  where id = p_order_id;

  insert into public.conversations (order_id, buyer_id, seller_id)
  values (p_order_id, v_order.buyer_id, v_order.seller_id)
  on conflict (order_id) do nothing;
  insert into public.order_timeline (order_id, actor_id, event_type, note)
  values (p_order_id, v_user_id, 'accepted', 'Seller accepted the request and reserved the requested quantity.');
  insert into public.notifications (user_id, order_id, notification_type, title, body, href)
  values (
    v_order.buyer_id, p_order_id, 'order_accepted', 'Order request accepted',
    v_order.seller_name || ' accepted your request for ' || v_order.product_name || '.',
    '/orders/' || p_order_id::text
  );
  return p_order_id;
end;
$$;

create or replace function public.reject_order_request(p_order_id uuid, p_explanation text default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.seller_id <> v_user_id or v_order.status <> 'pending' then
    raise exception 'This order request cannot be rejected.';
  end if;
  if p_explanation is not null and char_length(btrim(p_explanation)) > 1000 then
    raise exception 'The explanation must be 1000 characters or fewer.';
  end if;
  if not exists (
    select 1 from public.profiles where id = v_user_id and role = 'seller' and not is_suspended
  ) then
    raise exception 'An active seller account is required.';
  end if;

  update public.orders
  set status = 'rejected', seller_message = nullif(btrim(p_explanation), ''), updated_at = now()
  where id = p_order_id;
  insert into public.order_timeline (order_id, actor_id, event_type, note)
  values (
    p_order_id, v_user_id, 'rejected',
    coalesce(nullif(btrim(p_explanation), ''), 'Seller declined the request.')
  );
  insert into public.notifications (user_id, order_id, notification_type, title, body, href)
  values (
    v_order.buyer_id, p_order_id, 'order_rejected', 'Order request declined',
    coalesce(nullif(btrim(p_explanation), ''), v_order.seller_name || ' declined your request.'),
    '/orders/' || p_order_id::text
  );
  return p_order_id;
end;
$$;

create or replace function public.propose_order_change(
  p_order_id uuid,
  p_quantity numeric,
  p_unit_price numeric,
  p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders%rowtype;
  v_listing public.seller_listings%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.seller_id <> v_user_id or v_order.status <> 'pending' then
    raise exception 'This order request cannot be changed.';
  end if;
  if p_quantity is null or p_quantity <= 0 or p_unit_price is null or p_unit_price < 0 then
    raise exception 'Enter a valid proposed quantity and price.';
  end if;
  if p_message is not null and char_length(btrim(p_message)) > 1000 then
    raise exception 'The message must be 1000 characters or fewer.';
  end if;
  select * into v_listing
  from public.seller_listings where id = v_order.listing_id;
  if not found or v_listing.status <> 'active'
    or v_listing.available_from > current_date
    or v_listing.available_until < current_date
    or v_listing.quantity_available < p_quantity then
    raise exception 'The listing cannot support the proposed quantity.';
  end if;
  if not exists (
    select 1 from public.profiles where id = v_user_id and role = 'seller' and not is_suspended
  ) then
    raise exception 'An active seller account is required.';
  end if;

  update public.orders
  set status = 'countered',
      proposed_quantity = p_quantity,
      proposed_unit_price = p_unit_price,
      seller_message = nullif(btrim(p_message), ''),
      updated_at = now()
  where id = p_order_id;
  insert into public.order_timeline (order_id, actor_id, event_type, note)
  values (
    p_order_id, v_user_id, 'countered',
    'Seller proposed ' || p_quantity::text || ' ' || v_order.unit || ' at KSh ' || p_unit_price::text || ' per ' || v_order.unit || '.'
  );
  insert into public.notifications (user_id, order_id, notification_type, title, body, href)
  values (
    v_order.buyer_id, p_order_id, 'order_countered', 'Seller proposed a change',
    v_order.seller_name || ' proposed a different quantity or price for ' || v_order.product_name || '.',
    '/orders/' || p_order_id::text
  );
  return p_order_id;
end;
$$;

create or replace function public.respond_to_order_proposal(p_order_id uuid, p_accept boolean)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders%rowtype;
  v_listing public.seller_listings%rowtype;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.buyer_id <> v_user_id or v_order.status <> 'countered' then
    raise exception 'This proposal is no longer awaiting your response.';
  end if;
  if not exists (
    select 1 from public.profiles where id = v_user_id and role = 'buyer' and not is_suspended
  ) then
    raise exception 'An active buyer account is required.';
  end if;

  if p_accept then
    select * into v_listing from public.seller_listings where id = v_order.listing_id for update;
    if not found or v_listing.status <> 'active'
      or v_listing.quantity_available < v_order.proposed_quantity
      or v_listing.available_from > current_date
      or v_listing.available_until < current_date then
      raise exception 'There is not enough available stock to accept this proposal.';
    end if;
    update public.seller_listings
    set quantity_available = quantity_available - v_order.proposed_quantity,
        status = case when quantity_available - v_order.proposed_quantity = 0 then 'sold_out' else status end,
        updated_at = now()
    where id = v_listing.id;
    update public.orders
    set status = 'accepted',
        requested_quantity = proposed_quantity,
        unit_price = proposed_unit_price,
        estimated_total = round(proposed_quantity * proposed_unit_price, 2),
        proposed_quantity = null,
        proposed_unit_price = null,
        updated_at = now()
    where id = p_order_id;
    insert into public.conversations (order_id, buyer_id, seller_id)
    values (p_order_id, v_order.buyer_id, v_order.seller_id)
    on conflict (order_id) do nothing;
  else
    update public.orders
    set status = 'rejected', proposed_quantity = null, proposed_unit_price = null, updated_at = now()
    where id = p_order_id;
  end if;

  insert into public.order_timeline (order_id, actor_id, event_type, note)
  values (
    p_order_id, v_user_id,
    case when p_accept then 'proposal_accepted' else 'proposal_declined' end,
    case when p_accept then 'Buyer accepted the seller proposal; the quantity is reserved.'
      else 'Buyer declined the seller proposal.' end
  );
  insert into public.notifications (user_id, order_id, notification_type, title, body, href)
  values (
    v_order.seller_id, p_order_id,
    case when p_accept then 'order_accepted' else 'order_rejected' end,
    case when p_accept then 'Proposal accepted' else 'Proposal declined' end,
    v_order.buyer_name || case when p_accept then ' accepted your proposal.' else ' declined your proposal.' end,
    '/orders/' || p_order_id::text
  );
  return p_order_id;
end;
$$;

create or replace function public.set_order_fulfillment_status(p_order_id uuid, p_status text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_order public.orders%rowtype;
  v_event_type text;
  v_note text;
  v_title text;
begin
  if p_status is null or p_status not in ('ready_for_collection', 'completed') then
    raise exception 'Choose a valid fulfillment status.';
  end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found or v_order.seller_id <> v_user_id
    or (p_status = 'ready_for_collection' and v_order.status <> 'accepted')
    or (p_status = 'completed' and v_order.status <> 'ready_for_collection') then
    raise exception 'This order cannot move to the selected status.';
  end if;
  if not exists (
    select 1 from public.profiles where id = v_user_id and role = 'seller' and not is_suspended
  ) then
    raise exception 'An active seller account is required.';
  end if;

  update public.orders set status = p_status, updated_at = now() where id = p_order_id;
  v_event_type := case when p_status = 'ready_for_collection' then 'ready' else 'completed' end;
  v_note := case when p_status = 'ready_for_collection'
    then 'Seller marked the order ready for collection.'
    else 'Seller marked the order completed.' end;
  v_title := case when p_status = 'ready_for_collection' then 'Order ready for collection' else 'Order completed' end;
  insert into public.order_timeline (order_id, actor_id, event_type, note)
  values (p_order_id, v_user_id, v_event_type, v_note);
  insert into public.notifications (user_id, order_id, notification_type, title, body, href)
  values (
    v_order.buyer_id, p_order_id,
    case when p_status = 'ready_for_collection' then 'order_ready' else 'order_completed' end,
    v_title, v_order.seller_name || ' updated your order: ' || v_note,
    '/orders/' || p_order_id::text
  );
  return p_order_id;
end;
$$;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select public.is_account_active()) then
    raise exception 'An active account is required to access messages.';
  end if;
  if not exists (
    select 1 from public.conversations
    where id = p_conversation_id
      and (buyer_id = auth.uid() or seller_id = auth.uid())
  ) then
    raise exception 'Conversation not found.';
  end if;
  update public.messages
  set read_at = now()
  where conversation_id = p_conversation_id
    and sender_id <> auth.uid()
    and read_at is null;
  update public.notifications
  set read_at = now()
  where conversation_id = p_conversation_id
    and user_id = auth.uid()
    and notification_type = 'new_message'
    and read_at is null;
end;
$$;

create or replace function public.notify_conversation_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation public.conversations%rowtype;
  v_sender_name text;
  v_recipient_id uuid;
begin
  select * into v_conversation
  from public.conversations where id = new.conversation_id;
  if new.sender_id <> v_conversation.buyer_id and new.sender_id <> v_conversation.seller_id then
    raise exception 'Only conversation participants can send messages.';
  end if;
  if new.sender_id = v_conversation.buyer_id then
    v_recipient_id := v_conversation.seller_id;
  else
    v_recipient_id := v_conversation.buyer_id;
  end if;
  select display_name into v_sender_name from public.profiles where id = new.sender_id;
  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;
  insert into public.notifications (user_id, order_id, conversation_id, notification_type, title, body, href)
  values (
    v_recipient_id, v_conversation.order_id, new.conversation_id, 'new_message',
    'New message from ' || v_sender_name,
    left(new.body, 160),
    '/orders/' || v_conversation.order_id::text
  );
  return new;
end;
$$;

create trigger messages_notify_recipient
  after insert on public.messages
  for each row execute function public.notify_conversation_message();

revoke all on function public.create_order_request(uuid, numeric, text) from public, anon;
revoke all on function public.accept_order_request(uuid) from public, anon;
revoke all on function public.reject_order_request(uuid, text) from public, anon;
revoke all on function public.propose_order_change(uuid, numeric, numeric, text) from public, anon;
revoke all on function public.respond_to_order_proposal(uuid, boolean) from public, anon;
revoke all on function public.set_order_fulfillment_status(uuid, text) from public, anon;
revoke all on function public.mark_conversation_read(uuid) from public, anon;
revoke all on function public.notify_conversation_message() from public, anon, authenticated;
grant execute on function public.create_order_request(uuid, numeric, text) to authenticated;
grant execute on function public.accept_order_request(uuid) to authenticated;
grant execute on function public.reject_order_request(uuid, text) to authenticated;
grant execute on function public.propose_order_change(uuid, numeric, numeric, text) to authenticated;
grant execute on function public.respond_to_order_proposal(uuid, boolean) to authenticated;
grant execute on function public.set_order_fulfillment_status(uuid, text) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;

revoke select on public.seller_listings from anon, authenticated;
grant select (
  id, seller_id, seller_name, product_id, quantity_available, unit, price_per_unit,
  location, condition, available_from, available_until, status, created_at, updated_at
) on public.seller_listings to anon, authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
    ) then
      alter publication supabase_realtime add table public.messages;
    end if;
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
    ) then
      alter publication supabase_realtime add table public.notifications;
    end if;
  end if;
end;
$$;
