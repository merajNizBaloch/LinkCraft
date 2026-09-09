import { NextRequest, NextResponse } from "next/server";

import { RESERVED_CODES } from "@/lib/links";
import { readSupabaseError, supabaseAdminFetch } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ code: string }>;
};

type ResolveRow = { destination: string };

export async function GET(_request: NextRequest, context: RouteContext) {
  const { code } = await context.params;

  if (!/^[A-Za-z0-9_-]{3,32}$/.test(code) || RESERVED_CODES.has(code.toLowerCase())) {
    return new NextResponse("Short link not found.", { status: 404 });
  }

  try {
    const response = await supabaseAdminFetch("rpc/linkcraft_resolve_short_link", {
      method: "POST",
      body: JSON.stringify({ p_code: code }),
    });

    if (!response.ok) {
      const error = await readSupabaseError(response);
      console.error("LinkCraft redirect error", error);
      return new NextResponse("Unable to resolve this short link.", { status: 500 });
    }

    const rows = (await response.json()) as ResolveRow[];
    const destination = rows[0]?.destination;

    if (!destination) {
      return new NextResponse("This short link does not exist, is disabled, or has expired.", {
        status: 404,
      });
    }

    return NextResponse.redirect(destination, 302);
  } catch (error) {
    console.error("LinkCraft redirect configuration error", error);
    return new NextResponse("LinkCraft short links are not configured yet.", { status: 503 });
  }
}
