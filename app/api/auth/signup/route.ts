import { NextRequest, NextResponse } from "next/server";

import {
  LinkCraftAuthSession,
  readAuthError,
  setAuthCookies,
  supabaseAuthFetch,
} from "@/lib/supabase/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { email?: unknown; password?: unknown };

  try {
    body = (await request.json()) as { email?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ error: "Send a valid signup request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Use at least 8 characters for your password." }, { status: 400 });
  }

  try {
    const redirectTo = new URL("/login?confirmed=1", request.nextUrl.origin).toString();
    const authResponse = await supabaseAuthFetch(
      `signup?redirect_to=${encodeURIComponent(redirectTo)}`,
      {
        method: "POST",
        body: JSON.stringify({ email, password }),
      },
    );

    if (!authResponse.ok) {
      return NextResponse.json(
        { error: await readAuthError(authResponse) },
        { status: authResponse.status },
      );
    }

    const session = (await authResponse.json()) as LinkCraftAuthSession;

    if (session.access_token && session.refresh_token) {
      const response = NextResponse.json({ user: session.user ?? null, needsConfirmation: false });
      setAuthCookies(response, session);
      return response;
    }

    return NextResponse.json({
      user: session.user ?? null,
      needsConfirmation: true,
      message: "Check your email to confirm your LinkCraft account.",
    });
  } catch (error) {
    console.error("LinkCraft signup error", error);
    return NextResponse.json({ error: "Signup is temporarily unavailable." }, { status: 503 });
  }
}
