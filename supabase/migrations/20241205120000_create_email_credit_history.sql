create table if not exists public.email_credit_history (
  email text primary key,
  credits_remaining integer not null default 2,
  updated_at timestamptz not null default now()
);

comment on table public.email_credit_history is 'Tracks the persistent credit history for each normalized email.';
comment on column public.email_credit_history.email is 'Normalized email address (lowercase, gmail aliases removed).';
comment on column public.email_credit_history.credits_remaining is 'Latest known credit balance associated with this email.';
comment on column public.email_credit_history.updated_at is 'Timestamp when credits_remaining was last updated.';
