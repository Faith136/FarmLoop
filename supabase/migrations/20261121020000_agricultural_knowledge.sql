create extension if not exists vector with schema extensions;

create table if not exists public.agricultural_knowledge (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null,
  content text not null,
  embedding extensions.vector(768) not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.agricultural_knowledge enable row level security;

revoke all on public.agricultural_knowledge from public, anon;
grant select, insert on public.agricultural_knowledge to authenticated;

drop policy if exists "Active admins read agricultural knowledge"
  on public.agricultural_knowledge;
create policy "Active admins read agricultural knowledge"
  on public.agricultural_knowledge for select to authenticated
  using ((select public.is_admin()) and (select public.is_account_active()));

drop policy if exists "Active admins insert agricultural knowledge"
  on public.agricultural_knowledge;
create policy "Active admins insert agricultural knowledge"
  on public.agricultural_knowledge for insert to authenticated
  with check ((select public.is_admin()) and (select public.is_account_active()));
