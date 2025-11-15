create table if not exists public.early_access (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.early_access enable row level security;

drop policy if exists "Allow public early access inserts" on public.early_access;
create policy "Allow public early access inserts" on public.early_access
for insert
with check (true);
