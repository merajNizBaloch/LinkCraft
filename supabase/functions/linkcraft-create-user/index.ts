import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { withSupabase } from "npm:@supabase/server";

type SignupBody = {
  email?: unknown;
  password?: unknown;
};

export default {
  fetch: withSupabase({ auth: "secret" }, async (req, ctx) => {
    if (req.method !== "POST") {
      return Response.json({ error: "Method not allowed." }, { status: 405 });
    }

    let body: SignupBody;
    try {
      body = (await req.json()) as SignupBody;
    } catch {
      return Response.json({ error: "Send a valid JSON request." }, { status: 400 });
    }

    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return Response.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    if (password.length < 8) {
      return Response.json(
        { error: "Use at least 8 characters for your password." },
        { status: 400 },
      );
    }

    const { data, error } = await ctx.supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      const duplicate =
        error.status === 422 ||
        /already|registered|exists|duplicate/i.test(error.message);

      return Response.json(
        {
          error: duplicate
            ? "An account with this email already exists. Sign in instead."
            : error.message,
        },
        { status: duplicate ? 409 : error.status || 500 },
      );
    }

    return Response.json({
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  }),
};
