import { NextResponse } from "next/server";

import { supabaseAdminFetch } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type LinkRow = {
  id: string;
  profile_id: string;
  title: string;
  url: string;
  is_active: boolean;
};

function deviceType(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|kindle|silk/.test(ua)) return "tablet";
  if (/mobi|iphone|android/.test(ua)) return "mobile";
  if (ua) return "desktop";
  return "other";
}

function hostFromUrl(value: string) {
  try {
    return new URL(value).hostname.slice(0, 160) || null;
  } catch {
    return null;
  }
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.redirect(new URL("/link-page", request.url), 302);
  }

  const linkResponse = await supabaseAdminFetch(
    `linkcraft_profile_links?select=id,profile_id,title,url,is_active&id=eq.${encodeURIComponent(id)}&is_active=eq.true&limit=1`,
  );

  if (!linkResponse.ok) {
    return NextResponse.redirect(new URL("/link-page", request.url), 302);
  }

  const link = ((await linkResponse.json()) as LinkRow[])[0];
  if (!link) {
    return NextResponse.redirect(new URL("/link-page", request.url), 302);
  }

  const profileResponse = await supabaseAdminFetch(
    `linkcraft_profiles?select=id&id=eq.${link.profile_id}&is_published=eq.true&limit=1`,
  );

  if (!profileResponse.ok) {
    return NextResponse.redirect(new URL("/link-page", request.url), 302);
  }

  const profiles = (await profileResponse.json()) as { id: string }[];
  if (!profiles[0]) {
    return NextResponse.redirect(new URL("/link-page", request.url), 302);
  }

  try {
    await supabaseAdminFetch("linkcraft_page_events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        profile_id: link.profile_id,
        link_id: link.id,
        event_type: "link_click",
        link_title: link.title.slice(0, 80),
        device_type: deviceType(request.headers.get("user-agent") || ""),
        destination_host: hostFromUrl(link.url),
      }),
    });
  } catch (error) {
    console.error("LinkCraft click analytics error", error);
  }

  return NextResponse.redirect(link.url, 302);
}
