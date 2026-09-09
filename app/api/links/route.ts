import { NextRequest, NextResponse } from "next/server";

import {
  createRandomCode,
  getExpiryDate,
  normalizeAlias,
  normalizeDestination,
} from "@/lib/links";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type CreateLinkBody = {
  destination?: unknown;
  alias?: unknown;
  expiresInDays?: unknown;
};

function publicOrigin(request: NextRequest) {
  return (process.env.LINKCRAFT_PUBLIC_URL || request.nextUrl.origin).replace(/\/$/, "");
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
    if (destinationUrl.host === request.nextUrl.host) {
      return NextResponse.json(
        { error: "LinkCraft links cannot redirect back to the same LinkCraft host." },
        { status: 400 },
      );
    }

    const supabase = getSupabaseAdmin();
    const attempts = alias ? 1 : 6;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      const code = alias || createRandomCode();
      const { data, error } = await supabase
        .from("links")
        .insert({
          code,
          destination,
          custom_alias: Boolean(alias),
          expires_at: expiresAt,
        })
        .select("code,destination,click_count,expires_at,created_at")
        .single();

      if (!error && data) {
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

      if (error?.code === "23505") {
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
