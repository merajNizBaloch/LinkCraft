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
- Account-based Link Pages at `/u/[username]` with a live editor and Free/Pro entitlements

## Stack

- Next.js App Router
- React + TypeScript
- Tailwind CSS
- `qrcode.react`
- Supabase Postgres for persistent short links
- Cloudflare Workers through OpenNext

## Shortener architecture

The browser never receives a Supabase secret or a database write credential.

1. `POST /api/links` validates the destination, optional alias and expiration.
2. The server writes the link through Supabase's Data REST API using `SUPABASE_SECRET_KEY`.
3. `/{code}` calls the server-only `linkcraft_resolve_short_link` RPC.
4. The RPC atomically increments `click_count` and returns the active, non-expired destination.
5. LinkCraft sends an HTTP redirect to that destination.

LinkCraft shares the existing Realstate-OS Supabase project but remains isolated through prefixed database objects. RLS is enabled on `public.linkcraft_links`, public roles are explicitly denied, and the table/RPC are available only to the trusted `service_role` used by the server-side secret key.

## Link Pages architecture

Link Pages use the same server-only Supabase access pattern as the shortener:

- `/login` proxies Supabase Auth through LinkCraft server routes and stores session tokens in HTTP-only cookies.
- `/link-page/dashboard` is the authenticated editor with live preview, theme selection, publishing controls and ordered links.
- `/u/[username]` renders the public profile server-side.
- `public.linkcraft_profiles` and `public.linkcraft_profile_links` are isolated with the `linkcraft_` prefix.
- Public and authenticated database roles are denied direct table access; trusted server routes use the existing server secret.
- `plan` and `branding_enabled` are server-controlled fields so Free users cannot self-upgrade by changing browser payloads.

The checked-in setup SQL is:

`supabase/linkcraft-link-pages.sql`

## Supabase setup

LinkCraft currently uses the Realstate-OS Supabase project:

`https://sewnndspsnafutgfdhfy.supabase.co`

The required schema has already been applied to that project. The checked-in reference remains at:

`supabase/linkcraft-setup.sql`

It creates only LinkCraft-specific objects:

- `public.linkcraft_links`
- `public.linkcraft_profiles`
- `public.linkcraft_profile_links`
- unique short codes
- optional custom aliases
- expiration support
- active/disabled state
- click count and last-click timestamp
- `public.linkcraft_resolve_short_link(text)`
- RLS, explicit public deny policy, and server-role grants

No existing Realstate-OS application tables are modified by LinkCraft.

## Environment variables

For local Next.js development, copy `.env.example` to `.env.local` and configure:

```bash
SUPABASE_URL=https://sewnndspsnafutgfdhfy.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
LINKCRAFT_PUBLIC_URL=http://localhost:3000
```

On Cloudflare Workers, `SUPABASE_URL` is already defined as a non-secret variable in `wrangler.jsonc`. Add `SUPABASE_SECRET_KEY` as an encrypted Worker secret in the Cloudflare dashboard. `LINKCRAFT_PUBLIC_URL` is optional because LinkCraft falls back to the current request origin; add it later when assigning a custom domain such as `https://linkcraft.techcraftsolution.com`.

Never expose `SUPABASE_SECRET_KEY` through a `NEXT_PUBLIC_` variable or commit a real secret to GitHub.

## Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` for the toolbox, `http://localhost:3000/shorten` for the persistent shortener, or `http://localhost:3000/link-page` for Link Pages.

## Cloudflare Workers

The repository includes:

- `wrangler.jsonc`
- `open-next.config.ts`
- `@opennextjs/cloudflare`
- Wrangler
- `nodejs_compat`

Useful commands:

```bash
npm run cf:build
npm run preview
npm run deploy
```

For Cloudflare Workers Builds with GitHub:

- Repository: `merajNizBaloch/LinkCraft`
- Production branch: `main`
- Root directory: `/`
- Build command: `npm run cf:build`
- Deploy command: `npx wrangler deploy`

After the Worker exists, add `SUPABASE_SECRET_KEY` under the Worker's Variables and Secrets settings as a Secret and deploy the settings change.

## Next backend milestones

- Ownership/auth model for saved links
- Private analytics dashboard
- Safe rate limiting / abuse controls
- Link enable/disable management
- Editable destinations for owned links
- Optional custom branded domains
