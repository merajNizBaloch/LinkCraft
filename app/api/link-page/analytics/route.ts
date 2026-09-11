import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { LINKCRAFT_ACCESS_COOKIE, getAuthUser } from "@/lib/supabase/auth";
import { supabaseAdminFetch } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type ProfileRow = {
  id: string;
  plan: "free" | "pro";
};

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(LINKCRAFT_ACCESS_COOKIE)?.value;
    const user = await getAuthUser(accessToken);

    if (!user) {
      return NextResponse.json({ error: "Sign in to view analytics." }, { status: 401 });
    }

    const profileResponse = await supabaseAdminFetch(
      `linkcraft_profiles?select=id,plan&user_id=eq.${user.id}&limit=1`,
    );

    if (!profileResponse.ok) {
      return NextResponse.json({ error: "Unable to load analytics." }, { status: 500 });
    }

    const profile = ((await profileResponse.json()) as ProfileRow[])[0];
    if (!profile) {
      return NextResponse.json({
        isPro: false,
        rangeDays: 7,
        views: 0,
        clicks: 0,
        ctr: 0,
        lifetimeViews: 0,
        lifetimeClicks: 0,
        lifetimeCtr: 0,
        daily: [],
        topLinks: [],
        referrers: [],
        devices: [],
      });
    }

    const url = new URL(request.url);
    const requestedDays = Number(url.searchParams.get("days") || "7");
    const days = profile.plan === "pro" && [7, 30, 90].includes(requestedDays)
      ? requestedDays
      : 7;

    const rpcResponse = await supabaseAdminFetch("rpc/linkcraft_analytics_summary", {
      method: "POST",
      body: JSON.stringify({
        p_profile_id: profile.id,
        p_days: days,
      }),
    });

    if (!rpcResponse.ok) {
      return NextResponse.json({ error: "Unable to load analytics." }, { status: 500 });
    }

    const summary = (await rpcResponse.json()) as Record<string, unknown>;

    if (profile.plan !== "pro") {
      return NextResponse.json({
        ...summary,
        isPro: false,
        rangeDays: 7,
        topLinks: [],
        referrers: [],
        devices: [],
      });
    }

    return NextResponse.json({ ...summary, isPro: true });
  } catch (error) {
    console.error("LinkCraft analytics dashboard error", error);
    return NextResponse.json({ error: "Unable to load analytics." }, { status: 500 });
  }
}
