create table if not exists signup_emails (
  email text primary key,
  created_at timestamptz not null default now()
);
