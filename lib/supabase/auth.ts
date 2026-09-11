import "server-only";

import { NextResponse } from "next/server";

export const LINKCRAFT_ACCESS_COOKIE = "linkcraft_access_token";
export const LINKCRAFT_REFRESH_COOKIE = "linkcraft_refresh_token";

export type LinkCraftAuthUser = {
  id: string;
  email?: string;
  created_at?: string;
};

export type LinkCraftAuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in?: number;
  token_type?: string;
  user?: LinkCraftAuthUser;
};

function getSupabaseConfig() {
  const baseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
  const secretKey = process.env.SUPABASE_SECRET_KEY;

  if (!baseUrl || !secretKey) {
    throw new Error("Supabase server credentials are not configured.");
  }

  return { baseUrl, secretKey };
}

export async function supabaseAuthFetch(path: string, init: RequestInit = {}) {
  const { baseUrl, secretKey } = getSupabaseConfig();
  const headers = new Headers(init.headers);

  headers.set("apikey", secretKey);
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${baseUrl}/auth/v1/${path.replace(/^\//, "")}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function supabaseSecretFunctionFetch(name: string, init: RequestInit = {}) {
  const { baseUrl, secretKey } = getSupabaseConfig();
  const headers = new Headers(init.headers);

  headers.set("apikey", secretKey);
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${baseUrl}/functions/v1/${name.replace(/^\//, "")}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}


export async function getAuthUser(accessToken: string | undefined) {
  if (!accessToken) return null;

  const response = await supabaseAuthFetch("user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) return null;
  return (await response.json()) as LinkCraftAuthUser;
}

export function setAuthCookies(response: NextResponse, session: LinkCraftAuthSession) {
  const secure = process.env.NODE_ENV === "production";
  const accessMaxAge = Math.max(60, Number(session.expires_in || 3600));

  response.cookies.set(LINKCRAFT_ACCESS_COOKIE, session.access_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: accessMaxAge,
  });

  response.cookies.set(LINKCRAFT_REFRESH_COOKIE, session.refresh_token, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(LINKCRAFT_ACCESS_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  response.cookies.set(LINKCRAFT_REFRESH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function readAuthError(response: Response) {
  try {
    const payload = (await response.json()) as {
      msg?: string;
      message?: string;
      error_description?: string;
      error?: string;
    };

    return (
      payload.msg ||
      payload.message ||
      payload.error_description ||
      payload.error ||
      "Authentication request failed."
    );
  } catch {
    return "Authentication request failed.";
  }
}
