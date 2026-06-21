-- Run this entire file once in your Supabase project's SQL editor
-- (Dashboard -> SQL Editor -> New query -> paste -> Run).
-- It sets up everything the app needs: profiles, subscription status,
-- and saved calculation history, all protected by row-level security
-- so users can only ever see their own data.

-- 1. Profiles table — one row per user, extends Supabase's built-in auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  plan text not null default 'free' check (plan in ('free', 'pro', 'team')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_subscription_status text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatically create a profile row whenever someone signs up
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Saved calculations — Pro feature, history of past calculator runs
create table public.calculations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  calculator_slug text not null,
  calculator_name text not null,
  inputs jsonb not null,
  result jsonb not null,
  patient_label text,
  created_at timestamptz not null default now()
);

alter table public.calculations enable row level security;

create policy "Users can view their own calculations"
  on public.calculations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own calculations"
  on public.calculations for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own calculations"
  on public.calculations for delete
  using (auth.uid() = user_id);

create index calculations_user_id_idx on public.calculations(user_id);
create index calculations_created_at_idx on public.calculations(created_at desc);

-- 3. AI explanation usage tracking — lets free users try a few before paywalling
create table public.ai_explanation_usage (
  user_id uuid references public.profiles(id) on delete cascade primary key,
  count_used integer not null default 0,
  last_used_at timestamptz
);

alter table public.ai_explanation_usage enable row level security;

create policy "Users can view their own usage"
  on public.ai_explanation_usage for select
  using (auth.uid() = user_id);
