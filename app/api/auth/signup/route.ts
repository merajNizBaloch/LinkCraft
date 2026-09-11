import { NextResponse } from "next/server";

import {
  LinkCraftAuthSession,
  readAuthError,
  setAuthCookies,
  supabaseAuthAdminFetch,
  supabaseAuthFetch,
} from "@/lib/supabase/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
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
    const createResponse = await supabaseAuthAdminFetch("users", {
      method: "POST",
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
      }),
    });

    if (!createResponse.ok) {
      const message = await readAuthError(createResponse);
      const duplicate =
        createResponse.status === 422 ||
        /already|registered|exists|duplicate/i.test(message);

      return NextResponse.json(
        {
          error: duplicate
            ? "An account with this email already exists. Sign in instead."
            : message,
        },
        { status: duplicate ? 409 : createResponse.status },
      );
    }

    const signInResponse = await supabaseAuthFetch("token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (!signInResponse.ok) {
      console.error("LinkCraft instant signup sign-in failed", await readAuthError(signInResponse));
      return NextResponse.json(
        { error: "Your account was created, but LinkCraft could not sign you in automatically. Please sign in." },
        { status: 500 },
      );
    }

    const session = (await signInResponse.json()) as LinkCraftAuthSession;
    const response = NextResponse.json({ user: session.user ?? null });
    setAuthCookies(response, session);
    return response;
  } catch (error) {
    console.error("LinkCraft signup error", error);
    return NextResponse.json({ error: "Signup is temporarily unavailable." }, { status: 503 });
  }
}
