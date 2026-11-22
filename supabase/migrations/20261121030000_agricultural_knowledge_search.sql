drop policy if exists "Active admins read agricultural knowledge"
  on public.agricultural_knowledge;
drop policy if exists "Active users read agricultural knowledge"
  on public.agricultural_knowledge;

create policy "Active users read agricultural knowledge"
  on public.agricultural_knowledge for select to authenticated
  using ((select public.is_account_active()));

create or replace function public.match_agricultural_knowledge(
  query_embedding extensions.vector,
  match_threshold real,
  match_count integer
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    knowledge.id,
    knowledge.document_id,
    knowledge.content,
    knowledge.metadata,
    1 - (
      knowledge.embedding operator(extensions.<=>) query_embedding
    ) as similarity
  from public.agricultural_knowledge as knowledge
  where 1 - (
    knowledge.embedding operator(extensions.<=>) query_embedding
  ) >= match_threshold
  order by knowledge.embedding operator(extensions.<=>) query_embedding
  limit greatest(1, least(match_count, 20));
$$;

revoke all on function public.match_agricultural_knowledge(
  extensions.vector,
  real,
  integer
) from public, anon;
grant execute on function public.match_agricultural_knowledge(
  extensions.vector,
  real,
  integer
) to authenticated;
