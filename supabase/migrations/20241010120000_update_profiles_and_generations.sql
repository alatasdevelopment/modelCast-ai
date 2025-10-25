alter table profiles
  add column if not exists plan text default 'free',
  add column if not exists is_studio boolean default false;

update profiles
  set plan = case
    when is_pro = true then 'pro'
    else 'free'
  end
where plan is null;

create table if not exists generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  image_url text not null,
  mode text not null default 'preview',
  plan text not null default 'free',
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists generations_user_created_idx
  on generations (user_id, created_at desc);
