import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import type { LinkPageTheme } from "@/lib/link-pages";
import { supabaseAdminFetch } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageContext = {
  params: Promise<{ username: string }>;
};

type ProfileRow = {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  theme: LinkPageTheme;
  branding_enabled: boolean;
  is_published: boolean;
};

type LinkRow = {
  id: string;
  title: string;
  url: string;
  position: number;
  is_active: boolean;
};

async function loadPublicProfile(username: string) {
  const safeUsername = username.trim().toLowerCase();
  if (!/^[a-z0-9][a-z0-9_-]{2,29}$/.test(safeUsername)) return null;

  const profileResponse = await supabaseAdminFetch(
    `linkcraft_profiles?select=id,username,display_name,bio,avatar_url,theme,branding_enabled,is_published&username=eq.${encodeURIComponent(safeUsername)}&is_published=eq.true&limit=1`,
  );

  if (!profileResponse.ok) return null;
  const profiles = (await profileResponse.json()) as ProfileRow[];
  const profile = profiles[0];
  if (!profile) return null;

  const linksResponse = await supabaseAdminFetch(
    `linkcraft_profile_links?select=id,title,url,position,is_active&profile_id=eq.${profile.id}&is_active=eq.true&order=position.asc`,
  );

  const links = linksResponse.ok ? ((await linksResponse.json()) as LinkRow[]) : [];
  return { profile, links };
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "LC"
  );
}

function themeClasses(theme: LinkPageTheme) {
  switch (theme) {
    case "coral":
      return {
        page: "bg-[#ffefe9] text-[#251713]",
        button: "bg-[#ff5c35] text-white",
        muted: "text-[#805d52]",
      };
    case "midnight":
      return {
        page: "bg-[#101014] text-white",
        button: "bg-white text-[#101014]",
        muted: "text-white/50",
      };
    case "glass":
      return {
        page: "bg-gradient-to-br from-[#1b2434] via-[#35263f] to-[#814a4c] text-white",
        button: "border border-white/20 bg-white/10 text-white backdrop-blur-xl",
        muted: "text-white/55",
      };
    default:
      return {
        page: "bg-[#f7f7f4] text-[#11110f]",
        button: "border border-[#d8d8d2] bg-white text-[#11110f]",
        muted: "text-[#777772]",
      };
  }
}

export async function generateMetadata(context: PageContext): Promise<Metadata> {
  const { username } = await context.params;
  return {
    title: `@${username} | LinkCraft`,
    description: `Open @${username}'s links on LinkCraft.`,
    robots: { index: true, follow: true },
  };
}

export default async function PublicLinkPage(context: PageContext) {
  const { username } = await context.params;
  const data = await loadPublicProfile(username);

  if (!data) notFound();

  const { profile, links } = data;
  const theme = themeClasses(profile.theme);

  return (
    <main className={`min-h-screen px-5 py-10 md:py-14 ${theme.page}`}>
      <div className="mx-auto max-w-[620px]">
        <section className="text-center">
          {profile.avatar_url ? (
            <div
              className="mx-auto h-28 w-28 rounded-full bg-cover bg-center shadow-[0_16px_45px_rgba(0,0,0,.12)] ring-4 ring-white/20"
              style={{ backgroundImage: `url("${profile.avatar_url.replace(/"/g, "%22")}")` }}
            />
          ) : (
            <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-[#ff5c35] text-3xl font-black text-white shadow-[0_16px_45px_rgba(0,0,0,.12)]">
              {initials(profile.display_name)}
            </div>
          )}

          <h1 className="mt-6 text-3xl font-black tracking-[-0.05em]">{profile.display_name}</h1>
          {profile.bio && <p className={`mx-auto mt-3 max-w-[500px] text-sm leading-6 md:text-base ${theme.muted}`}>{profile.bio}</p>}
        </section>

        <section className="mt-8 grid gap-3">
          {links.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex min-h-16 items-center justify-between rounded-[20px] px-5 py-4 text-sm font-black shadow-[0_8px_30px_rgba(0,0,0,.06)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_36px_rgba(0,0,0,.11)] ${theme.button}`}
            >
              <span className="truncate pr-4">{item.title}</span>
              <ExternalLink size={16} className="shrink-0 opacity-50 transition group-hover:opacity-100" />
            </a>
          ))}
        </section>

        {profile.branding_enabled && (
          <footer className="mt-10 text-center">
            <Link href="/link-page" className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] transition hover:opacity-100 ${theme.muted}`}>
              Made with <span>Link<span className="text-[#ff5c35]">Craft</span></span>
            </Link>
          </footer>
        )}
      </div>
    </main>
  );
}
