-- LinkCraft short-link backend
-- Run this in the dedicated LinkCraft Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.links (
  id uuid primary key default gen_random_uuid(),
  code varchar(32) not null unique,
  destination text not null,
  custom_alias boolean not null default false,
  click_count bigint not null default 0,
  is_active boolean not null default true,
  expires_at timestamptz,
  last_clicked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint links_code_format check (code ~ '^[A-Za-z0-9_-]{3,32}$'),
  constraint links_destination_http check (destination ~* '^https?://'),
  constraint links_click_count_nonnegative check (click_count >= 0)
);

alter table public.links enable row level security;

-- LinkCraft does not access this table directly from browsers. There are deliberately
-- no anon/authenticated RLS policies. Only the trusted server role may use the table.
revoke all on table public.links from anon, authenticated;
grant select, insert, update on table public.links to service_role;

create or replace function public.resolve_short_link(p_code text)
returns table(destination text)
language sql
security invoker
set search_path = ''
as $$
  update public.links
  set
    click_count = click_count + 1,
    last_clicked_at = now()
  where code = p_code
    and is_active = true
    and (expires_at is null or expires_at > now())
  returning links.destination;
$$;

-- Functions receive EXECUTE from PUBLIC by default in Postgres. Remove that grant and
-- expose this RPC only to the trusted service role used by the Next.js server.
revoke all on function public.resolve_short_link(text) from public, anon, authenticated;
grant execute on function public.resolve_short_link(text) to service_role;

comment on table public.links is 'Persistent short links created by LinkCraft.';
comment on function public.resolve_short_link(text) is 'Atomically resolves a short code and records one click.';
