# LinkCraft

LinkCraft is a free link-utility workspace by TechCraft. Paste a URL once and reuse it across QR generation, cleaning, campaign building, inspection and sharing tools.

## Current tools

- Persistent URL shortener backend and `/shorten` creation screen
- QR code generator with SVG export and error-correction controls
- URL cleaner for UTM and common advertising click parameters
- UTM campaign builder
- WhatsApp click-to-chat link generator
- URL encoder / decoder
- Link inspector

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- `qrcode.react`
- Supabase Postgres for persistent short links

## Shortener architecture

The browser never receives a Supabase secret or a database write credential.

1. `POST /api/links` validates the destination, optional alias and expiration.
2. The Next.js server writes the link through Supabase's Data REST API using `SUPABASE_SECRET_KEY`.
3. `/{code}` calls the server-only `linkcraft_resolve_short_link` RPC.
4. The RPC atomically increments `click_count` and returns the active, non-expired destination.
5. LinkCraft sends an HTTP redirect to that destination.

LinkCraft shares the existing Realstate-OS Supabase project but remains isolated through prefixed database objects. RLS is enabled on `public.linkcraft_links`, public roles are explicitly denied, and the table/RPC are available only to the trusted `service_role` used by the server-side secret key.

## Supabase setup

LinkCraft currently uses the Realstate-OS Supabase project:

`https://sewnndspsnafutgfdhfy.supabase.co`

The required schema has already been applied to that project. The checked-in reference remains at:

`supabase/linkcraft-setup.sql`

It creates only LinkCraft-specific objects:

- `public.linkcraft_links`
- unique short codes
- optional custom aliases
- expiration support
- active/disabled state
- click count and last-click timestamp
- `public.linkcraft_resolve_short_link(text)`
- RLS, explicit public deny policy, and server-role grants

No existing Realstate-OS application tables are modified by LinkCraft.

## Environment variables

Copy `.env.example` to `.env.local` and configure:

```bash
SUPABASE_URL=https://sewnndspsnafutgfdhfy.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
LINKCRAFT_PUBLIC_URL=http://localhost:3000
```

For production, set `LINKCRAFT_PUBLIC_URL` to the final LinkCraft domain, for example `https://linkcraft.techcraftsolution.com`.

Never expose `SUPABASE_SECRET_KEY` through a `NEXT_PUBLIC_` variable or commit a real secret to GitHub.

## Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` for the toolbox or `http://localhost:3000/shorten` for the persistent shortener.

## Next backend milestones

- Ownership/auth model for saved links
- Private analytics dashboard
- Safe rate limiting / abuse controls
- Link enable/disable management
- Editable destinations for owned links
- Optional custom branded domains
