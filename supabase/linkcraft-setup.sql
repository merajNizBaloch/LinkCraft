-- LinkCraft short-link backend
-- This schema is designed to coexist inside the Realstate-OS Supabase project.
-- All LinkCraft database objects are prefixed with linkcraft_ to avoid collisions.

create table if not exists public.linkcraft_links (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  destination text not null,
  custom_alias boolean not null default false,
  click_count bigint not null default 0,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  last_clicked_at timestamptz,
  is_active boolean not null default true,
  constraint linkcraft_links_code_format check (code ~ '^[A-Za-z0-9_-]{3,32}$'),
  constraint linkcraft_links_destination_protocol check (destination ~* '^https?://'),
  constraint linkcraft_links_click_count_nonnegative check (click_count >= 0)
);

create index if not exists linkcraft_links_active_expiry_idx
  on public.linkcraft_links (is_active, expires_at);

alter table public.linkcraft_links enable row level security;

-- The LinkCraft browser never accesses this table directly. Public roles are explicitly
-- denied and the trusted server-side secret key maps to service_role.
revoke all on table public.linkcraft_links from anon, authenticated;
grant select, insert, update, delete on table public.linkcraft_links to service_role;

drop policy if exists linkcraft_deny_public_access on public.linkcraft_links;
create policy linkcraft_deny_public_access
on public.linkcraft_links
for all
to anon, authenticated
using (false)
with check (false);

drop function if exists public.linkcraft_resolve_short_link(text);
create function public.linkcraft_resolve_short_link(p_code text)
returns table(destination text)
language plpgsql
security invoker
set search_path = ''
as $$
begin
  return query
  update public.linkcraft_links
     set click_count = click_count + 1,
         last_clicked_at = now()
   where code = p_code
     and is_active = true
     and (expires_at is null or expires_at > now())
  returning public.linkcraft_links.destination;
end;
$$;

revoke execute on function public.linkcraft_resolve_short_link(text) from public, anon, authenticated;
grant execute on function public.linkcraft_resolve_short_link(text) to service_role;

comment on table public.linkcraft_links is 'Persistent short links created by LinkCraft inside the shared Realstate-OS Supabase project.';
comment on function public.linkcraft_resolve_short_link(text) is 'Atomically resolves a LinkCraft short code and records one click.';
