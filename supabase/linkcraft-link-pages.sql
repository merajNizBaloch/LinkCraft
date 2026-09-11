-- LinkCraft Link Pages backend
-- Designed to coexist inside the existing shared Supabase project.
-- Browser clients never receive service-role credentials.

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
  constraint linkcraft_profiles_username_format
    check (username ~ '^[a-z0-9][a-z0-9_-]{2,29}$'),
  constraint linkcraft_profiles_theme_check
    check (theme in ('minimal','coral','midnight','glass','aurora','studio','forest','sunset')),
  constraint linkcraft_profiles_accent_color_check
    check (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  constraint linkcraft_profiles_seo_title_length
    check (char_length(seo_title) <= 70),
  constraint linkcraft_profiles_seo_description_length
    check (char_length(seo_description) <= 160),
  constraint linkcraft_profiles_plan_check
    check (plan in ('free','pro')),
  constraint linkcraft_profiles_avatar_protocol
    check (avatar_url is null or avatar_url ~* '^https?://')
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
  constraint linkcraft_profile_links_title_length
    check (char_length(title) between 1 and 80),
  constraint linkcraft_profile_links_url_protocol
    check (url ~* '^https?://'),
  constraint linkcraft_profile_links_icon_check
    check (icon in (
      'link','globe','instagram','facebook','youtube','linkedin','twitter',
      'github','mail','phone','message','map-pin','shopping-bag','calendar',
      'file-text','briefcase','music','camera'
    )),
  constraint linkcraft_profile_links_position_nonnegative
    check (position >= 0)
);

create index if not exists linkcraft_profile_links_profile_position_idx
  on public.linkcraft_profile_links (profile_id, position);

-- Upgrade existing LinkCraft installations.
alter table public.linkcraft_profiles
  add column if not exists accent_color text not null default '#ff5c35',
  add column if not exists seo_title text not null default '',
  add column if not exists seo_description text not null default '';

alter table public.linkcraft_profile_links
  add column if not exists icon text not null default 'link',
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

alter table public.linkcraft_profiles enable row level security;
alter table public.linkcraft_profile_links enable row level security;

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

comment on table public.linkcraft_profiles is
  'LinkCraft Link Page profiles. Accessed only through trusted server routes.';
comment on table public.linkcraft_profile_links is
  'Ordered public links belonging to LinkCraft Link Page profiles.';
comment on column public.linkcraft_profiles.plan is
  'Subscription entitlement. Only trusted server/admin workflows should change this value.';
comment on column public.linkcraft_profiles.branding_enabled is
  'Controls LinkCraft footer branding. Intended to be disabled only by paid entitlement workflows.';

-- Profile avatars: public for display, tightly restricted for writes.
insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'linkcraft-avatars',
  'linkcraft-avatars',
  true,
  307200,
  array['image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "linkcraft_avatar_insert_own" on storage.objects;
create policy "linkcraft_avatar_insert_own"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'linkcraft-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "linkcraft_avatar_select_own" on storage.objects;
create policy "linkcraft_avatar_select_own"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'linkcraft-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "linkcraft_avatar_update_own" on storage.objects;
create policy "linkcraft_avatar_update_own"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'linkcraft-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'linkcraft-avatars'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

-- Public signup abuse protection.
create table if not exists public.linkcraft_signup_rate_limits (
  bucket text primary key,
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 0,
  updated_at timestamptz not null default now(),
  constraint linkcraft_signup_rate_limits_count_nonnegative
    check (attempt_count >= 0)
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
      when public.linkcraft_signup_rate_limits.window_started_at
        <= now() - make_interval(secs => p_window_seconds)
        then 1
      else public.linkcraft_signup_rate_limits.attempt_count + 1
    end,
    window_started_at = case
      when public.linkcraft_signup_rate_limits.window_started_at
        <= now() - make_interval(secs => p_window_seconds)
        then now()
      else public.linkcraft_signup_rate_limits.window_started_at
    end,
    updated_at = now()
  returning attempt_count into v_count;

  return v_count <= p_limit;
end;
$$;

revoke execute
on function public.linkcraft_consume_signup_rate_limit(text, integer, integer)
from public, anon, authenticated;

grant execute
on function public.linkcraft_consume_signup_rate_limit(text, integer, integer)
to service_role;


-- Link Page analytics.
create table if not exists public.linkcraft_page_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.linkcraft_profiles(id) on delete cascade,
  link_id uuid references public.linkcraft_profile_links(id) on delete set null,
  event_type text not null,
  link_title text,
  referrer_host text,
  device_type text not null default 'other',
  visitor_hash text,
  destination_host text,
  created_at timestamptz not null default now(),
  constraint linkcraft_page_events_type_check
    check (event_type in ('page_view','link_click')),
  constraint linkcraft_page_events_device_check
    check (device_type in ('mobile','tablet','desktop','other')),
  constraint linkcraft_page_events_link_title_length
    check (link_title is null or char_length(link_title) <= 80),
  constraint linkcraft_page_events_referrer_length
    check (referrer_host is null or char_length(referrer_host) <= 160),
  constraint linkcraft_page_events_destination_length
    check (destination_host is null or char_length(destination_host) <= 160)
);

create index if not exists linkcraft_page_events_profile_created_idx
  on public.linkcraft_page_events (profile_id, created_at desc);

create index if not exists linkcraft_page_events_profile_type_created_idx
  on public.linkcraft_page_events (profile_id, event_type, created_at desc);

create index if not exists linkcraft_page_events_link_created_idx
  on public.linkcraft_page_events (link_id, created_at desc)
  where link_id is not null;

create unique index if not exists linkcraft_page_events_view_dedupe_idx
  on public.linkcraft_page_events (visitor_hash)
  where event_type = 'page_view' and visitor_hash is not null;

alter table public.linkcraft_page_events enable row level security;

revoke all on table public.linkcraft_page_events from anon, authenticated;
grant select, insert, update, delete on table public.linkcraft_page_events to service_role;

drop policy if exists linkcraft_page_events_deny_public on public.linkcraft_page_events;
create policy linkcraft_page_events_deny_public
on public.linkcraft_page_events
for all
to anon, authenticated
using (false)
with check (false);

create or replace function public.linkcraft_analytics_summary(
  p_profile_id uuid,
  p_days integer default 30
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_days integer := greatest(1, least(coalesce(p_days, 30), 365));
  v_start timestamptz := now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 365)));
  v_views bigint;
  v_clicks bigint;
  v_lifetime_views bigint;
  v_lifetime_clicks bigint;
  v_daily jsonb;
  v_top_links jsonb;
  v_referrers jsonb;
  v_devices jsonb;
begin
  select count(*) filter (where event_type = 'page_view'),
         count(*) filter (where event_type = 'link_click')
  into v_views, v_clicks
  from public.linkcraft_page_events
  where profile_id = p_profile_id
    and created_at >= v_start;

  select count(*) filter (where event_type = 'page_view'),
         count(*) filter (where event_type = 'link_click')
  into v_lifetime_views, v_lifetime_clicks
  from public.linkcraft_page_events
  where profile_id = p_profile_id;

  select coalesce(jsonb_agg(to_jsonb(day_row) order by day_row.day), '[]'::jsonb)
  into v_daily
  from (
    select
      series::date as day,
      count(e.id) filter (where e.event_type = 'page_view')::int as views,
      count(e.id) filter (where e.event_type = 'link_click')::int as clicks
    from generate_series(
      date_trunc('day', now() - make_interval(days => v_days - 1)),
      date_trunc('day', now()),
      interval '1 day'
    ) series
    left join public.linkcraft_page_events e
      on e.profile_id = p_profile_id
     and e.created_at >= series
     and e.created_at < series + interval '1 day'
    group by series
  ) day_row;

  select coalesce(jsonb_agg(to_jsonb(link_row) order by link_row.clicks desc, link_row.title), '[]'::jsonb)
  into v_top_links
  from (
    select
      coalesce(nullif(link_title, ''), 'Untitled link') as title,
      count(*)::int as clicks
    from public.linkcraft_page_events
    where profile_id = p_profile_id
      and event_type = 'link_click'
      and created_at >= v_start
    group by coalesce(nullif(link_title, ''), 'Untitled link')
    order by count(*) desc
    limit 8
  ) link_row;

  select coalesce(jsonb_agg(to_jsonb(ref_row) order by ref_row.views desc, ref_row.source), '[]'::jsonb)
  into v_referrers
  from (
    select
      coalesce(nullif(referrer_host, ''), 'Direct / unknown') as source,
      count(*)::int as views
    from public.linkcraft_page_events
    where profile_id = p_profile_id
      and event_type = 'page_view'
      and created_at >= v_start
    group by coalesce(nullif(referrer_host, ''), 'Direct / unknown')
    order by count(*) desc
    limit 8
  ) ref_row;

  select coalesce(jsonb_agg(to_jsonb(device_row) order by device_row.views desc, device_row.device), '[]'::jsonb)
  into v_devices
  from (
    select
      device_type as device,
      count(*)::int as views
    from public.linkcraft_page_events
    where profile_id = p_profile_id
      and event_type = 'page_view'
      and created_at >= v_start
    group by device_type
    order by count(*) desc
  ) device_row;

  return jsonb_build_object(
    'rangeDays', v_days,
    'views', v_views,
    'clicks', v_clicks,
    'ctr', case when v_views > 0 then round((v_clicks::numeric / v_views::numeric) * 100, 1) else 0 end,
    'lifetimeViews', v_lifetime_views,
    'lifetimeClicks', v_lifetime_clicks,
    'lifetimeCtr', case when v_lifetime_views > 0 then round((v_lifetime_clicks::numeric / v_lifetime_views::numeric) * 100, 1) else 0 end,
    'daily', v_daily,
    'topLinks', v_top_links,
    'referrers', v_referrers,
    'devices', v_devices
  );
end;
$$;

revoke execute on function public.linkcraft_analytics_summary(uuid, integer)
  from public, anon, authenticated;
grant execute on function public.linkcraft_analytics_summary(uuid, integer)
  to service_role;
