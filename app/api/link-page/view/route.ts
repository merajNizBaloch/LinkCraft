import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

import { supabaseAdminFetch } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ProfileRow = {
  id: string;
};

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function deviceType(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|kindle|silk/.test(ua)) return "tablet";
  if (/mobi|iphone|android/.test(ua)) return "mobile";
  if (ua) return "desktop";
  return "other";
}

function referrerHost(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    return new URL(value).hostname.slice(0, 160) || null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: unknown;
      referrer?: unknown;
    };

    const username =
      typeof body.username === "string"
        ? body.username.trim().toLowerCase()
        : "";

    if (!/^[a-z0-9][a-z0-9_-]{2,29}$/.test(username)) {
      return NextResponse.json({ ok: true });
    }

    const profileResponse = await supabaseAdminFetch(
      `linkcraft_profiles?select=id&username=eq.${encodeURIComponent(username)}&is_published=eq.true&limit=1`,
    );

    if (!profileResponse.ok) {
      return NextResponse.json({ ok: true });
    }

    const profile = ((await profileResponse.json()) as ProfileRow[])[0];
    if (!profile) return NextResponse.json({ ok: true });

    const userAgent = request.headers.get("user-agent") || "";
    const halfHourBucket = Math.floor(Date.now() / (30 * 60 * 1000));
    const seed = process.env.SUPABASE_SECRET_KEY || "linkcraft";
    const visitorHash = createHash("sha256")
      .update(
        `${profile.id}|${clientIp(request)}|${userAgent}|${halfHourBucket}|${seed}`,
      )
      .digest("hex");

    const insertResponse = await supabaseAdminFetch("linkcraft_page_events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        profile_id: profile.id,
        event_type: "page_view",
        referrer_host: referrerHost(body.referrer),
        device_type: deviceType(userAgent),
        visitor_hash: visitorHash,
      }),
    });

    if (!insertResponse.ok && insertResponse.status !== 409) {
      console.error(
        "LinkCraft analytics page-view insert failed",
        insertResponse.status,
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("LinkCraft analytics page-view error", error);
    return NextResponse.json({ ok: true });
  }
}
