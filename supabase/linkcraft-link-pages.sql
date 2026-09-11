-- LinkCraft Link Pages backend
-- Designed to coexist inside the existing shared Supabase project.
-- All objects are prefixed with linkcraft_ and are server-only through service_role.

create table if not exists public.linkcraft_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  bio text not null default '',
  avatar_url text,
  theme text not null default 'minimal',
  plan text not null default 'free',
  branding_enabled boolean not null default true,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint linkcraft_profiles_username_format check (username ~ '^[a-z0-9][a-z0-9_-]{2,29}$'),
  constraint linkcraft_profiles_theme_check check (theme in ('minimal', 'coral', 'midnight', 'glass')),
  constraint linkcraft_profiles_plan_check check (plan in ('free', 'pro')),
  constraint linkcraft_profiles_avatar_protocol check (avatar_url is null or avatar_url ~* '^https?://')
);

create index if not exists linkcraft_profiles_username_idx
  on public.linkcraft_profiles (username);

create table if not exists public.linkcraft_profile_links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.linkcraft_profiles(id) on delete cascade,
  title text not null,
  url text not null,
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint linkcraft_profile_links_title_length check (char_length(title) between 1 and 80),
  constraint linkcraft_profile_links_url_protocol check (url ~* '^https?://'),
  constraint linkcraft_profile_links_position_nonnegative check (position >= 0)
);

create index if not exists linkcraft_profile_links_profile_position_idx
  on public.linkcraft_profile_links (profile_id, position);

alter table public.linkcraft_profiles enable row level security;
alter table public.linkcraft_profile_links enable row level security;

-- Link Pages are accessed only through LinkCraft server routes.
-- The browser never receives service-role credentials.
revoke all on table public.linkcraft_profiles from anon, authenticated;
revoke all on table public.linkcraft_profile_links from anon, authenticated;

grant select, insert, update, delete on table public.linkcraft_profiles to service_role;
grant select, insert, update, delete on table public.linkcraft_profile_links to service_role;

drop policy if exists linkcraft_profiles_deny_public on public.linkcraft_profiles;
create policy linkcraft_profiles_deny_public
on public.linkcraft_profiles
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists linkcraft_profile_links_deny_public on public.linkcraft_profile_links;
create policy linkcraft_profile_links_deny_public
on public.linkcraft_profile_links
for all
to anon, authenticated
using (false)
with check (false);

comment on table public.linkcraft_profiles is 'LinkCraft Link Page profiles. Accessed only through server routes.';
comment on table public.linkcraft_profile_links is 'Ordered public links belonging to LinkCraft Link Page profiles.';
comment on column public.linkcraft_profiles.plan is 'Subscription entitlement. Only trusted server/admin workflows should change this value.';
comment on column public.linkcraft_profiles.branding_enabled is 'Controls LinkCraft footer branding. Intended to be disabled only by paid entitlement workflows.';
