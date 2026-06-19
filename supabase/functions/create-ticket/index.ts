// Edge function: spam-protected ticket creation.
//
// Verifies a Cloudflare Turnstile token, then inserts the ticket using the
// service-role key (which bypasses RLS). Pair this with revoking the anon grant
// on create_ticket (see ADVANCED_SETUP.md) so the ONLY way to create a ticket
// is through this function — which means every ticket passes the captcha.
//
// Deploy:  supabase functions deploy create-ticket --no-verify-jwt
// Secrets: supabase secrets set TURNSTILE_SECRET=xxxxx
//          (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  try {
    const { form, token } = await req.json();

    // 1. Verify Turnstile (skipped only if no secret is configured).
    const secret = Deno.env.get("TURNSTILE_SECRET");
    if (secret) {
      const verify = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ secret, response: token ?? "" }),
      });
      const outcome = await verify.json();
      if (!outcome.success) return json({ error: "Captcha verification failed." }, 400);
    }

    // 2. Basic validation + hard length caps.
    if (!form?.name || !form?.discord || !form?.brief) return json({ error: "Missing required fields." }, 400);
    const clip = (value: unknown, max: number) => String(value ?? "").slice(0, max);

    // 3. Insert via service role (bypasses RLS).
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await admin.rpc("create_ticket", {
      p_name: clip(form.name, 120),
      p_discord: clip(form.discord, 80),
      p_email: clip(form.email, 160),
      p_package: clip(form.packageType, 40),
      p_budget: clip(form.budget, 60),
      p_deadline: clip(form.deadline, 60),
      p_brief: clip(form.brief, 4000),
    });
    if (error) throw error;

    return json(data);
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
