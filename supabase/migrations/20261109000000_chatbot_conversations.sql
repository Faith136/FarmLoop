create table public.chatbot_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  messages jsonb not null default '[]'::jsonb
    check (jsonb_typeof(messages) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.chatbot_conversations enable row level security;

create policy "Users read their own chatbot conversations"
  on public.chatbot_conversations for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users create their own chatbot conversations"
  on public.chatbot_conversations for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users update their own chatbot conversations"
  on public.chatbot_conversations for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update on public.chatbot_conversations to authenticated;
