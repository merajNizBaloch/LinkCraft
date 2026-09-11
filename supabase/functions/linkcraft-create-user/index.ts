import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

type SignupBody = {
  email?: unknown;
  password?: unknown;
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function sha256(value: string) {
  const encoded = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "";
  return req.headers.get("cf-connecting-ip") || req.headers.get("x-real-ip") || "";
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "LinkCraft account service is not configured." }, 503);
  }

  let body: SignupBody;
  try {
    body = (await req.json()) as SignupBody;
  } catch {
    return json({ error: "Send a valid JSON request." }, 400);
  }

  const email =
    typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return json({ error: "Enter a valid email address." }, 400);
  }

  if (password.length < 8) {
    return json({ error: "Use at least 8 characters for your password." }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const emailBucket = `email:${await sha256(email)}`;
  const { data: emailAllowed, error: emailRateError } = await admin.rpc(
    "linkcraft_consume_signup_rate_limit",
    {
      p_bucket: emailBucket,
      p_limit: 5,
      p_window_seconds: 3600,
    },
  );

  if (emailRateError) {
    console.error("LinkCraft signup email rate-limit error", emailRateError);
    return json({ error: "Signup is temporarily unavailable." }, 503);
  }

  if (!emailAllowed) {
    return json({ error: "Too many signup attempts for this email. Try again later." }, 429);
  }

  const clientIp = getClientIp(req);
  if (clientIp) {
    const ipBucket = `ip:${await sha256(clientIp)}`;
    const { data: ipAllowed, error: ipRateError } = await admin.rpc(
      "linkcraft_consume_signup_rate_limit",
      {
        p_bucket: ipBucket,
        p_limit: 20,
        p_window_seconds: 3600,
      },
    );

    if (ipRateError) {
      console.error("LinkCraft signup IP rate-limit error", ipRateError);
      return json({ error: "Signup is temporarily unavailable." }, 503);
    }

    if (!ipAllowed) {
      return json({ error: "Too many signup attempts from this network. Try again later." }, 429);
    }
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    const duplicate =
      error.status === 422 ||
      /already|registered|exists|duplicate/i.test(error.message);

    return json(
      {
        error: duplicate
          ? "An account with this email already exists. Sign in instead."
          : error.message,
      },
      duplicate ? 409 : error.status || 500,
    );
  }

  return json({
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  });
});
