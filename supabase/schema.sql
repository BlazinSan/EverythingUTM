create table if not exists public.app_state (
  namespace text not null,
  storage_key text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (namespace, storage_key)
);

alter table public.app_state enable row level security;

drop policy if exists "EverythingUTM public read" on public.app_state;
drop policy if exists "EverythingUTM public insert" on public.app_state;
drop policy if exists "EverythingUTM public update" on public.app_state;

create policy "EverythingUTM public read"
  on public.app_state
  for select
  using (true);

create policy "EverythingUTM public insert"
  on public.app_state
  for insert
  with check (true);

create policy "EverythingUTM public update"
  on public.app_state
  for update
  using (true)
  with check (true);
