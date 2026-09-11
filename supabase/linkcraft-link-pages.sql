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
  accent_color text not null default '#ff5c35',
  seo_title text not null default '',
  seo_description text not null default '',
  plan text not null default 'free',
  branding_enabled boolean not null default true,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint linkcraft_profiles_username_format check (username ~ '^[a-z0-9][a-z0-9_-]{2,29}$'),
  constraint linkcraft_profiles_theme_check check (theme in ('minimal', 'coral', 'midnight', 'glass', 'aurora', 'studio', 'forest', 'sunset')),
  constraint linkcraft_profiles_accent_color_check check (accent_color ~ '^#[0-9A-Fa-f]{6}
  constraint linkcraft_profiles_avatar_protocol check (avatar_url is null or avatar_url ~* '^https?://')
);

create index if not exists linkcraft_profiles_username_idx
  on public.linkcraft_profiles (username);

create table if not exists public.linkcraft_profile_links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.linkcraft_profiles(id) on delete cascade,
  title text not null,
  url text not null,
  icon text not null default 'link',
  position integer not null default 0,
  is_active boolean not null default true,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint linkcraft_profile_links_title_length check (char_length(title) between 1 and 80),
  constraint linkcraft_profile_links_url_protocol check (url ~* '^https?://'),
  constraint linkcraft_profile_links_icon_check check (icon in (
    'link','globe','instagram','facebook','youtube','linkedin','twitter',
    'github','mail','phone','message','map-pin','shopping-bag','calendar',
    'file-text','briefcase','music','camera'
  )),
  constraint linkcraft_profile_links_position_nonnegative check (position >= 0)
);



-- Backfill icon support when upgrading an existing LinkCraft schema.
alter table public.linkcraft_profile_links
  add column if not exists icon text not null default 'link';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'linkcraft_profile_links_icon_check'
      and conrelid = 'public.linkcraft_profile_links'::regclass
  ) then
    alter table public.linkcraft_profile_links
      add constraint linkcraft_profile_links_icon_check
      check (icon in (
        'link','globe','instagram','facebook','youtube','linkedin','twitter',
        'github','mail','phone','message','map-pin','shopping-bag','calendar',
        'file-text','briefcase','music','camera'
      ));
  end if;
end $$;

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




-- Pro customization fields for existing LinkCraft installations.
alter table public.linkcraft_profiles
  add column if not exists accent_color text not null default '#ff5c35',
  add column if not exists seo_title text not null default '',
  add column if not exists seo_description text not null default '';

alter table public.linkcraft_profile_links
  add column if not exists is_featured boolean not null default false;

alter table public.linkcraft_profiles
  drop constraint if exists linkcraft_profiles_theme_check;
alter table public.linkcraft_profiles
  add constraint linkcraft_profiles_theme_check
  check (theme in ('minimal','coral','midnight','glass','aurora','studio','forest','sunset'));

alter table public.linkcraft_profiles
  drop constraint if exists linkcraft_profiles_accent_color_check;
alter table public.linkcraft_profiles
  add constraint linkcraft_profiles_accent_color_check
  check (accent_color ~ '^#[0-9A-Fa-f]{6}$');

alter table public.linkcraft_profiles
  drop constraint if exists linkcraft_profiles_seo_title_length;
alter table public.linkcraft_profiles
  add constraint linkcraft_profiles_seo_title_length
  check (char_length(seo_title) <= 70);

alter table public.linkcraft_profiles
  drop constraint if exists linkcraft_profiles_seo_description_length;
alter table public.linkcraft_profiles
  add constraint linkcraft_profiles_seo_description_length
  check (char_length(seo_description) <= 160);

-- Public signup protection for the LinkCraft confirmed-user Edge Function.
create table if not exists public.linkcraft_signup_rate_limits (
  bucket text primary key,
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint linkcraft_signup_rate_limits_count_nonnegative check (attempt_count >= 0)
);

alter table public.linkcraft_signup_rate_limits enable row level security;

revoke all on table public.linkcraft_signup_rate_limits from anon, authenticated;
grant select, insert, update, delete on table public.linkcraft_signup_rate_limits to service_role;

drop policy if exists linkcraft_signup_rate_limits_deny_public on public.linkcraft_signup_rate_limits;
create policy linkcraft_signup_rate_limits_deny_public
on public.linkcraft_signup_rate_limits
for all
to anon, authenticated
using (false)
with check (false);

drop function if exists public.linkcraft_consume_signup_rate_limit(text, integer, integer);
create function public.linkcraft_consume_signup_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit configuration';
  end if;

  insert into public.linkcraft_signup_rate_limits (
    bucket,
    window_started_at,
    attempt_count,
    updated_at
  )
  values (
    p_bucket,
    now(),
    1,
    now()
  )
  on conflict (bucket) do update
  set
    attempt_count = case
      when public.linkcraft_signup_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
        then 1
      else public.linkcraft_signup_rate_limits.attempt_count + 1
    end,
    window_started_at = case
      when public.linkcraft_signup_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
        then now()
      else public.linkcraft_signup_rate_limits.window_started_at
    end,
    updated_at = now()
  returning attempt_count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke execute on function public.linkcraft_consume_signup_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.linkcraft_consume_signup_rate_limit(text, integer, integer) to service_role;
),
  constraint linkcraft_profiles_seo_title_length check (char_length(seo_title) <= 70),
  constraint linkcraft_profiles_seo_description_length check (char_length(seo_description) <= 160),
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
  icon text not null default 'link',
  position integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint linkcraft_profile_links_title_length check (char_length(title) between 1 and 80),
  constraint linkcraft_profile_links_url_protocol check (url ~* '^https?://'),
  constraint linkcraft_profile_links_icon_check check (icon in (
    'link','globe','instagram','facebook','youtube','linkedin','twitter',
    'github','mail','phone','message','map-pin','shopping-bag','calendar',
    'file-text','briefcase','music','camera'
  )),
  constraint linkcraft_profile_links_position_nonnegative check (position >= 0)
);



-- Backfill icon support when upgrading an existing LinkCraft schema.
alter table public.linkcraft_profile_links
  add column if not exists icon text not null default 'link';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'linkcraft_profile_links_icon_check'
      and conrelid = 'public.linkcraft_profile_links'::regclass
  ) then
    alter table public.linkcraft_profile_links
      add constraint linkcraft_profile_links_icon_check
      check (icon in (
        'link','globe','instagram','facebook','youtube','linkedin','twitter',
        'github','mail','phone','message','map-pin','shopping-bag','calendar',
        'file-text','briefcase','music','camera'
      ));
  end if;
end $$;

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


-- Public signup protection for the LinkCraft confirmed-user Edge Function.
create table if not exists public.linkcraft_signup_rate_limits (
  bucket text primary key,
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint linkcraft_signup_rate_limits_count_nonnegative check (attempt_count >= 0)
);

alter table public.linkcraft_signup_rate_limits enable row level security;

revoke all on table public.linkcraft_signup_rate_limits from anon, authenticated;
grant select, insert, update, delete on table public.linkcraft_signup_rate_limits to service_role;

drop policy if exists linkcraft_signup_rate_limits_deny_public on public.linkcraft_signup_rate_limits;
create policy linkcraft_signup_rate_limits_deny_public
on public.linkcraft_signup_rate_limits
for all
to anon, authenticated
using (false)
with check (false);

drop function if exists public.linkcraft_consume_signup_rate_limit(text, integer, integer);
create function public.linkcraft_consume_signup_rate_limit(
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit configuration';
  end if;

  insert into public.linkcraft_signup_rate_limits (
    bucket,
    window_started_at,
    attempt_count,
    updated_at
  )
  values (
    p_bucket,
    now(),
    1,
    now()
  )
  on conflict (bucket) do update
  set
    attempt_count = case
      when public.linkcraft_signup_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
        then 1
      else public.linkcraft_signup_rate_limits.attempt_count + 1
    end,
    window_started_at = case
      when public.linkcraft_signup_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds)
        then now()
      else public.linkcraft_signup_rate_limits.window_started_at
    end,
    updated_at = now()
  returning attempt_count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke execute on function public.linkcraft_consume_signup_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.linkcraft_consume_signup_rate_limit(text, integer, integer) to service_role;
