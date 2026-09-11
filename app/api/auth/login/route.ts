import { NextResponse } from "next/server";

import {
  LinkCraftAuthSession,
  readAuthError,
  setAuthCookies,
  supabaseAuthFetch,
} from "@/lib/supabase/auth";
import { getLinkCraftAuthEmail, normalizeLinkCraftEmail } from "@/lib/linkcraft-auth-identity";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: { email?: unknown; password?: unknown };

  try {
    body = (await request.json()) as { email?: unknown; password?: unknown };
  } catch {
    return NextResponse.json({ error: "Send a valid login request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? normalizeLinkCraftEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  try {
    const authResponse = await supabaseAuthFetch("token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({
        email: getLinkCraftAuthEmail(email),
        password,
      }),
    });

    if (!authResponse.ok) {
      return NextResponse.json(
        { error: await readAuthError(authResponse) },
        { status: authResponse.status === 400 ? 401 : authResponse.status },
      );
    }

    const session = (await authResponse.json()) as LinkCraftAuthSession;
    const response = NextResponse.json({ user: session.user ?? null });

    setAuthCookies(response, session);
    return response;
  } catch (error) {
    console.error("LinkCraft login error", error);
    return NextResponse.json({ error: "Login is temporarily unavailable." }, { status: 503 });
  }
}
