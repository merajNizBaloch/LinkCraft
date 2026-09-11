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

function getSecretKeys() {
  const raw = Deno.env.get("SUPABASE_SECRET_KEYS");
  if (!raw) return [] as string[];

  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return Object.values(parsed).filter(Boolean);
  } catch {
    return [] as string[];
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed." }, 405);
  }

  const providedKey = req.headers.get("apikey") || "";
  const validKeys = getSecretKeys();
  const fallbackSecret = Deno.env.get("SUPABASE_SECRET_KEY") || "";

  const authorized =
    Boolean(providedKey) &&
    (validKeys.includes(providedKey) ||
      (fallbackSecret && providedKey === fallbackSecret));

  if (!authorized) {
    return json({ error: "Invalid server credential." }, 401);
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "LinkCraft account service is not configured." }, 503);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

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
