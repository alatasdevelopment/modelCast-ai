-- Adds a Pro plan flag to profiles if it does not already exist.
alter table profiles
add column if not exists is_pro boolean default false;
