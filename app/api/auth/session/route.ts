import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  LINKCRAFT_ACCESS_COOKIE,
  LINKCRAFT_REFRESH_COOKIE,
  LinkCraftAuthSession,
  clearAuthCookies,
  getAuthUser,
  setAuthCookies,
  supabaseAuthFetch,
} from "@/lib/supabase/auth";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(LINKCRAFT_ACCESS_COOKIE)?.value;
  const refreshToken = cookieStore.get(LINKCRAFT_REFRESH_COOKIE)?.value;

  try {
    const user = await getAuthUser(accessToken);
    if (user) {
      return NextResponse.json({ user });
    }

    if (!refreshToken) {
      const response = NextResponse.json({ error: "Not signed in." }, { status: 401 });
      clearAuthCookies(response);
      return response;
    }

    const refreshResponse = await supabaseAuthFetch("token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!refreshResponse.ok) {
      const response = NextResponse.json({ error: "Your session has expired." }, { status: 401 });
      clearAuthCookies(response);
      return response;
    }

    const session = (await refreshResponse.json()) as LinkCraftAuthSession;
    const response = NextResponse.json({ user: session.user ?? null });
    setAuthCookies(response, session);
    return response;
  } catch (error) {
    console.error("LinkCraft session error", error);
    return NextResponse.json({ error: "Unable to verify your session." }, { status: 503 });
  }
}
