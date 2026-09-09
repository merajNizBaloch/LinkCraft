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
3. `/{code}` calls the server-only `resolve_short_link` RPC.
4. The RPC atomically increments `click_count` and returns the active, non-expired destination.
5. LinkCraft sends an HTTP redirect to that destination.

RLS is enabled on the `links` table and no `anon` or `authenticated` policies are created. The table and redirect RPC are granted only to Supabase's trusted `service_role` used by the server-side secret key.

## Supabase setup

Create a dedicated Supabase project for LinkCraft, then run:

`supabase/linkcraft-setup.sql`

The schema creates:

- `public.links`
- unique short codes
- optional custom aliases
- expiration support
- active/disabled state
- click count and last-click timestamp
- the atomic `resolve_short_link(text)` RPC
- RLS and explicit server-role grants

## Environment variables

Copy `.env.example` to `.env.local` and configure:

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
LINKCRAFT_PUBLIC_URL=http://localhost:3000
```

For production, set `LINKCRAFT_PUBLIC_URL` to the final LinkCraft domain, for example `https://linkcraft.techcraftsolution.com`.

Never expose `SUPABASE_SECRET_KEY` through a `NEXT_PUBLIC_` variable.

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
