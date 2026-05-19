create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image text not null,
  cost text not null,
  prep_time text not null,
  cook_time text,
  total_time text,
  tags text[] not null default '{}',
  difficulty text not null check (difficulty in ('Easy', 'Medium', 'Hard')),
  category text not null check (category in ('breakfast', 'lunch', 'dinner', 'snack', 'dessert')),
  cuisine text,
  servings integer,
  calories integer,
  ingredients jsonb not null default '[]'::jsonb,
  steps text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by text,
  source text default 'user-upload' check (source in ('user-upload', 'system', 'imported')),
  is_public boolean not null default true,
  rating numeric,
  times_cooked integer not null default 0,
  last_cooked_at timestamptz
);

alter table public.recipes enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert on public.recipes to anon, authenticated;

drop policy if exists "Anyone can read public recipes" on public.recipes;
create policy "Anyone can read public recipes"
on public.recipes
for select
using (is_public = true);

drop policy if exists "Anyone can add recipes" on public.recipes;
create policy "Anyone can add recipes"
on public.recipes
for insert
with check (is_public = true);
