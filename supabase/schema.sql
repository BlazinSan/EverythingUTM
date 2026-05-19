create table if not exists public.app_state (
  namespace text not null,
  storage_key text not null,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (namespace, storage_key)
);

create table if not exists public.user_profiles (
  id uuid primary key,
  email text unique,
  name text not null default '',
  sex text,
  profile jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.bug_reports (
  id uuid primary key default gen_random_uuid(),
  user_name text,
  user_email text,
  details text not null,
  reported_at timestamptz not null default now(),
  emailed boolean not null default false,
  email_error text
);

alter table public.app_state enable row level security;
alter table public.user_profiles enable row level security;
alter table public.bug_reports enable row level security;

drop policy if exists "EverythingUTM public read" on public.app_state;
drop policy if exists "EverythingUTM public insert" on public.app_state;
drop policy if exists "EverythingUTM public update" on public.app_state;
drop policy if exists "EverythingUTM profiles read" on public.user_profiles;
drop policy if exists "EverythingUTM profiles insert own" on public.user_profiles;
drop policy if exists "EverythingUTM profiles update own" on public.user_profiles;
drop policy if exists "EverythingUTM bug reports insert" on public.bug_reports;

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

create policy "EverythingUTM profiles read"
  on public.user_profiles
  for select
  using (true);

create policy "EverythingUTM profiles insert own"
  on public.user_profiles
  for insert
  with check (auth.uid() = id);

create policy "EverythingUTM profiles update own"
  on public.user_profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "EverythingUTM bug reports insert"
  on public.bug_reports
  for insert
  with check (true);

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'app_state'
  ) then
    alter publication supabase_realtime add table public.app_state;
  end if;
end $$;

create or replace function public.delete_everythingutm_current_user()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  delete from public.user_profiles
  where id = current_user_id;

  delete from public.app_state
  where storage_key = 'everything-utm:user-profile:' || current_user_id::text;

  delete from auth.users
  where id = current_user_id;
end;
$$;

revoke all on function public.delete_everythingutm_current_user() from public;
grant execute on function public.delete_everythingutm_current_user() to authenticated;

create or replace function public.handle_everythingutm_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_name text;
  profile_sex text;
begin
  profile_name := coalesce(
    new.raw_user_meta_data ->> 'name',
    new.raw_user_meta_data ->> 'full_name',
    ''
  );
  profile_sex := coalesce(new.raw_user_meta_data ->> 'sex', '');

  insert into public.user_profiles (id, email, name, sex, profile, updated_at)
  values (
    new.id,
    lower(new.email),
    profile_name,
    profile_sex,
    '{}'::jsonb,
    now()
  )
  on conflict (id) do update
    set email = excluded.email,
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists everythingutm_new_user_profile on auth.users;
create trigger everythingutm_new_user_profile
  after insert on auth.users
  for each row execute function public.handle_everythingutm_new_user();
