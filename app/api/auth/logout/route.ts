import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import {
  LINKCRAFT_ACCESS_COOKIE,
  clearAuthCookies,
  supabaseAuthFetch,
} from "@/lib/supabase/auth";

export const runtime = "nodejs";

export async function POST() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(LINKCRAFT_ACCESS_COOKIE)?.value;

  if (accessToken) {
    try {
      await supabaseAuthFetch("logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch {
      // Local cookie clearing still signs the browser out if Supabase is unavailable.
    }
  }

  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
