import { NextRequest, NextResponse } from "next/server";

import {
  createRandomCode,
  getExpiryDate,
  normalizeAlias,
  normalizeDestination,
} from "@/lib/links";
import { readSupabaseError, supabaseAdminFetch } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type CreateLinkBody = {
  destination?: unknown;
  alias?: unknown;
  expiresInDays?: unknown;
};

type LinkRow = {
  code: string;
  destination: string;
  click_count: number;
  expires_at: string | null;
  created_at: string;
};

function publicOrigin(request: NextRequest) {
  return (process.env.LINKCRAFT_PUBLIC_URL || request.nextUrl.origin).replace(/\/$/, "");
}

function isLinkCraftHost(request: NextRequest, destination: URL) {
  const ownHosts = new Set([request.nextUrl.host]);
  const configuredOrigin = process.env.LINKCRAFT_PUBLIC_URL;

  if (configuredOrigin) {
    try {
      ownHosts.add(new URL(configuredOrigin).host);
    } catch {
      // Invalid deployment configuration is handled by the fallback request origin.
    }
  }

  return ownHosts.has(destination.host);
}

export async function POST(request: NextRequest) {
  let body: CreateLinkBody;

  try {
    body = (await request.json()) as CreateLinkBody;
  } catch {
    return NextResponse.json({ error: "Send a valid JSON request." }, { status: 400 });
  }

  try {
    if (typeof body.destination !== "string") {
      return NextResponse.json({ error: "A destination URL is required." }, { status: 400 });
    }

    const destination = normalizeDestination(body.destination);
    const alias = typeof body.alias === "string" ? normalizeAlias(body.alias) : "";
    const expiresAt = getExpiryDate(body.expiresInDays);

    const destinationUrl = new URL(destination);
    if (isLinkCraftHost(request, destinationUrl)) {
      return NextResponse.json(
        { error: "LinkCraft links cannot redirect back to a LinkCraft host." },
        { status: 400 },
      );
    }

    const attempts = alias ? 1 : 6;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const code = alias || createRandomCode();
      const response = await supabaseAdminFetch(
        "links?select=code,destination,click_count,expires_at,created_at",
        {
          method: "POST",
          headers: { Prefer: "return=representation" },
          body: JSON.stringify({
            code,
            destination,
            custom_alias: Boolean(alias),
            expires_at: expiresAt,
          }),
        },
      );

      if (response.ok) {
        const rows = (await response.json()) as LinkRow[];
        const data = rows[0];

        if (!data) {
          return NextResponse.json(
            { error: "The database did not return the new short link." },
            { status: 500 },
          );
        }

        return NextResponse.json(
          {
            link: {
              ...data,
              shortUrl: `${publicOrigin(request)}/${data.code}`,
            },
          },
          { status: 201 },
        );
      }

      const error = await readSupabaseError(response);
      if (response.status === 409 || error.code === "23505") {
        if (alias) {
          return NextResponse.json(
            { error: "That custom alias is already in use." },
            { status: 409 },
          );
        }
        continue;
      }

      console.error("LinkCraft create-link error", error);
      return NextResponse.json(
        { error: "The short link could not be created." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Could not allocate a unique short code. Please try again." },
      { status: 503 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create the short link.";
    const status = message.includes("Supabase server credentials") ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
