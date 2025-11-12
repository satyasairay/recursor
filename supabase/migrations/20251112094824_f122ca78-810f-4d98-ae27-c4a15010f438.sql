-- Create enum for user tiers
create type public.user_tier as enum ('free', 'premium');

-- Create user_tiers table (following security best practices)
create table public.user_tiers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  tier user_tier not null default 'free',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.user_tiers enable row level security;

-- Create security definer function to check user tier
create or replace function public.has_premium(check_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_tiers
    where user_id = check_user_id
      and tier = 'premium'
  )
$$;

-- RLS policies for user_tiers
create policy "Users can view their own tier"
on public.user_tiers
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own tier"
on public.user_tiers
for insert
to authenticated
with check (auth.uid() = user_id);

-- Trigger to create free tier on user signup
create or replace function public.handle_new_user_tier()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_tiers (user_id, tier)
  values (new.id, 'free');
  return new;
end;
$$;

create trigger on_auth_user_created_tier
  after insert on auth.users
  for each row execute procedure public.handle_new_user_tier();

-- Create updated_at trigger function
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Add updated_at trigger
create trigger update_user_tiers_updated_at
  before update on public.user_tiers
  for each row
  execute function public.handle_updated_at();