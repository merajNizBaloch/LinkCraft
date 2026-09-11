import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  LinkPageIcon,
  LinkPageItem,
  LinkPageTheme,
  isPremiumTheme,
  isValidLinkPageIcon,
  isValidLinkPageUsername,
  normalizeLinkPageUsername,
  normalizePublicLink,
} from "@/lib/link-pages";
import { LINKCRAFT_ACCESS_COOKIE, getAuthUser } from "@/lib/supabase/auth";
import { readSupabaseError, supabaseAdminFetch } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ProfileRow = {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string | null;
  theme: LinkPageTheme;
  accent_color: string;
  seo_title: string;
  seo_description: string;
  plan: "free" | "pro";
  branding_enabled: boolean;
  is_published: boolean;
};

type LinkRow = {
  id: string;
  title: string;
  url: string;
  icon: LinkPageIcon;
  position: number;
  is_active: boolean;
  is_featured: boolean;
};

async function authenticatedUser() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(LINKCRAFT_ACCESS_COOKIE)?.value;
  const user = await getAuthUser(accessToken);
  return { user, accessToken };
}

async function getProfile(userId: string) {
  const response = await supabaseAdminFetch(
    `linkcraft_profiles?select=id,user_id,username,display_name,bio,avatar_url,theme,accent_color,seo_title,seo_description,plan,branding_enabled,is_published&user_id=eq.${userId}&limit=1`,
  );

  if (!response.ok) {
    throw new Error((await readSupabaseError(response)).message || "Unable to load profile.");
  }

  const rows = (await response.json()) as ProfileRow[];
  return rows[0] ?? null;
}

async function getLinks(profileId: string) {
  const response = await supabaseAdminFetch(
    `linkcraft_profile_links?select=id,title,url,icon,position,is_active,is_featured&profile_id=eq.${profileId}&order=position.asc`,
  );

  if (!response.ok) {
    throw new Error((await readSupabaseError(response)).message || "Unable to load profile links.");
  }

  return (await response.json()) as LinkRow[];
}

export async function GET() {
  try {
    const { user } = await authenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in to manage your Link Page." }, { status: 401 });
    }

    const profile = await getProfile(user.id);

    if (!profile) {
      return NextResponse.json({
        profile: {
          username: "",
          displayName: "",
          bio: "",
          avatarUrl: "",
          theme: "minimal",
          accentColor: "#ff5c35",
          seoTitle: "",
          seoDescription: "",
          plan: "free",
          brandingEnabled: true,
          isPublished: true,
          links: [],
        },
      });
    }

    const links = await getLinks(profile.id);

    return NextResponse.json({
      profile: {
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        bio: profile.bio,
        avatarUrl: profile.avatar_url || "",
        theme: profile.theme,
        accentColor: profile.accent_color || "#ff5c35",
        seoTitle: profile.seo_title || "",
        seoDescription: profile.seo_description || "",
        plan: profile.plan,
        brandingEnabled: profile.branding_enabled,
        isPublished: profile.is_published,
        links: links.map((link) => ({
          id: link.id,
          title: link.title,
          url: link.url,
          icon: link.icon || "link",
          isActive: link.is_active,
          isFeatured: link.is_featured === true,
        })),
      },
    });
  } catch (error) {
    console.error("LinkCraft Link Page load error", error);
    return NextResponse.json({ error: "Unable to load your Link Page." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { user } = await authenticatedUser();

    if (!user) {
      return NextResponse.json({ error: "Your session has expired. Sign in again." }, { status: 401 });
    }

    const body = (await request.json()) as {
      username?: unknown;
      displayName?: unknown;
      bio?: unknown;
      avatarUrl?: unknown;
      theme?: unknown;
      accentColor?: unknown;
      seoTitle?: unknown;
      seoDescription?: unknown;
      brandingEnabled?: unknown;
      isPublished?: unknown;
      links?: unknown;
    };

    const username = normalizeLinkPageUsername(typeof body.username === "string" ? body.username : "");
    const displayName = typeof body.displayName === "string" ? body.displayName.trim().slice(0, 80) : "";
    const bio = typeof body.bio === "string" ? body.bio.trim().slice(0, 240) : "";
    const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl.trim().slice(0, 600) : "";
    const requestedTheme = typeof body.theme === "string" ? body.theme : "minimal";
    const requestedAccentColor = typeof body.accentColor === "string" ? body.accentColor.trim() : "#ff5c35";
    const requestedSeoTitle = typeof body.seoTitle === "string" ? body.seoTitle.trim().slice(0, 70) : "";
    const requestedSeoDescription = typeof body.seoDescription === "string" ? body.seoDescription.trim().slice(0, 160) : "";
    const requestedBrandingEnabled = body.brandingEnabled !== false;
    const isPublished = body.isPublished !== false;

    if (!isValidLinkPageUsername(username)) {
      return NextResponse.json(
        { error: "Use 3–30 lowercase letters, numbers, hyphens or underscores for your username." },
        { status: 400 },
      );
    }

    if (!displayName) {
      return NextResponse.json({ error: "Add a display name." }, { status: 400 });
    }

    if (avatarUrl) {
      try {
        normalizePublicLink(avatarUrl);
      } catch {
        return NextResponse.json({ error: "Profile image must be a valid HTTP or HTTPS URL." }, { status: 400 });
      }
    }

    const existing = await getProfile(user.id);

    const usernameResponse = await supabaseAdminFetch(
      `linkcraft_profiles?select=user_id&username=eq.${encodeURIComponent(username)}&limit=1`,
    );

    if (!usernameResponse.ok) {
      throw new Error((await readSupabaseError(usernameResponse)).message || "Unable to check username.");
    }

    const usernameRows = (await usernameResponse.json()) as { user_id: string }[];
    if (usernameRows[0] && usernameRows[0].user_id !== user.id) {
      return NextResponse.json({ error: "That LinkCraft username is already taken." }, { status: 409 });
    }

    const allowedThemes = new Set<LinkPageTheme>(["minimal", "coral", "midnight", "glass", "aurora", "studio", "forest", "sunset"]);
    const theme = allowedThemes.has(requestedTheme as LinkPageTheme)
      ? (requestedTheme as LinkPageTheme)
      : "minimal";

    const plan = existing?.plan ?? "free";
    if (plan !== "pro" && isPremiumTheme(theme)) {
      return NextResponse.json({ error: "That theme is available on LinkCraft Pro." }, { status: 403 });
    }

    if (!/^#[0-9A-Fa-f]{6}$/.test(requestedAccentColor)) {
      return NextResponse.json({ error: "Accent color must be a valid 6-digit hex color." }, { status: 400 });
    }

    const accentColor = plan === "pro" ? requestedAccentColor : "#ff5c35";
    const seoTitle = plan === "pro" ? requestedSeoTitle : "";
    const seoDescription = plan === "pro" ? requestedSeoDescription : "";
    const brandingEnabled = plan === "pro" ? requestedBrandingEnabled : true;

    const profilePayload = {
      username,
      display_name: displayName,
      bio,
      avatar_url: avatarUrl || null,
      theme,
      accent_color: accentColor,
      seo_title: seoTitle,
      seo_description: seoDescription,
      branding_enabled: brandingEnabled,
      is_published: isPublished,
      updated_at: new Date().toISOString(),
    };

    let savedProfile: ProfileRow;

    if (existing) {
      const response = await supabaseAdminFetch(
        `linkcraft_profiles?user_id=eq.${user.id}&select=id,user_id,username,display_name,bio,avatar_url,theme,accent_color,seo_title,seo_description,plan,branding_enabled,is_published`,
        {
          method: "PATCH",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify(profilePayload),
        },
      );

      if (!response.ok) {
        throw new Error((await readSupabaseError(response)).message || "Unable to update profile.");
      }

      savedProfile = ((await response.json()) as ProfileRow[])[0];
    } else {
      const response = await supabaseAdminFetch(
        "linkcraft_profiles?select=id,user_id,username,display_name,bio,avatar_url,theme,accent_color,seo_title,seo_description,plan,branding_enabled,is_published",
        {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({ user_id: user.id, ...profilePayload }),
        },
      );

      if (!response.ok) {
        const detail = await readSupabaseError(response);
        if (detail.code === "23505") {
          return NextResponse.json({ error: "That LinkCraft username is already taken." }, { status: 409 });
        }
        throw new Error(detail.message || "Unable to create profile.");
      }

      savedProfile = ((await response.json()) as ProfileRow[])[0];
    }

    if (!savedProfile) {
      throw new Error("The database did not return the saved profile.");
    }

    const incomingLinks = Array.isArray(body.links) ? body.links.slice(0, 50) : [];
    const links: LinkPageItem[] = [];

    for (const entry of incomingLinks) {
      if (!entry || typeof entry !== "object") continue;
      const item = entry as { title?: unknown; url?: unknown; icon?: unknown; isActive?: unknown; isFeatured?: unknown };
      const title = typeof item.title === "string" ? item.title.trim().slice(0, 80) : "";
      const rawUrl = typeof item.url === "string" ? item.url : "";
      const requestedIcon = typeof item.icon === "string" ? item.icon : "link";
      const icon: LinkPageIcon = isValidLinkPageIcon(requestedIcon) ? requestedIcon : "link";

      if (!title || !rawUrl.trim()) continue;

      try {
        links.push({
          title,
          url: normalizePublicLink(rawUrl),
          icon,
          isActive: item.isActive !== false,
          isFeatured: plan === "pro" && item.isFeatured === true,
        });
      } catch {
        return NextResponse.json({ error: `“${title}” has an invalid URL.` }, { status: 400 });
      }
    }

    const featuredCount = links.filter((link) => link.isFeatured).length;
    if (featuredCount > 3) {
      return NextResponse.json({ error: "LinkCraft Pro supports up to 3 featured links." }, { status: 400 });
    }

    const deleteResponse = await supabaseAdminFetch(
      `linkcraft_profile_links?profile_id=eq.${savedProfile.id}`,
      {
        method: "DELETE",
        headers: { Prefer: "return=minimal" },
      },
    );

    if (!deleteResponse.ok) {
      throw new Error((await readSupabaseError(deleteResponse)).message || "Unable to replace links.");
    }

    if (links.length) {
      const insertResponse = await supabaseAdminFetch(
        "linkcraft_profile_links",
        {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify(
            links.map((link, position) => ({
              profile_id: savedProfile.id,
              title: link.title,
              url: link.url,
              icon: link.icon,
              position,
              is_active: link.isActive,
              is_featured: link.isFeatured,
            })),
          ),
        },
      );

      if (!insertResponse.ok) {
        throw new Error((await readSupabaseError(insertResponse)).message || "Unable to save links.");
      }
    }

    return NextResponse.json({
      ok: true,
      publicUrl: `/u/${savedProfile.username}`,
      profile: {
        username: savedProfile.username,
        displayName: savedProfile.display_name,
        bio: savedProfile.bio,
        avatarUrl: savedProfile.avatar_url || "",
        theme: savedProfile.theme,
        accentColor: savedProfile.accent_color || "#ff5c35",
        seoTitle: savedProfile.seo_title || "",
        seoDescription: savedProfile.seo_description || "",
        plan: savedProfile.plan,
        brandingEnabled: savedProfile.branding_enabled,
        isPublished: savedProfile.is_published,
        links,
      },
    });
  } catch (error) {
    console.error("LinkCraft Link Page save error", error);
    return NextResponse.json({ error: "Unable to save your Link Page." }, { status: 500 });
  }
}
