// Edge function: automatic PayPal payment verification (the deferred "auto-release").
//
// This is a SCAFFOLD. To finish it you need a PayPal app (developer.paypal.com),
// a webhook subscribed to PAYMENT.CAPTURE.COMPLETED, and the buyer's payment must
// carry the ticket code in `custom_id` / `invoice_id` so we can match it.
//
// Deploy:  supabase functions deploy paypal-webhook --no-verify-jwt
// Secrets: supabase secrets set PAYPAL_CLIENT_ID=xxx PAYPAL_SECRET=xxx PAYPAL_WEBHOOK_ID=xxx
//
// Flow once finished:
//   1. PayPal posts a webhook event here.
//   2. We verify the signature with PayPal (verify-webhook-signature API).
//   3. On a completed capture, read the ticket code from custom_id and mark the
//      ticket Delivered so the client's files unlock automatically.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function paypalAccessToken(): Promise<string> {
  const id = Deno.env.get("PAYPAL_CLIENT_ID")!;
  const secret = Deno.env.get("PAYPAL_SECRET")!;
  const res = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
    method: "POST",
    headers: { Authorization: `Basic ${btoa(`${id}:${secret}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  try {
    const event = await req.json();

    // 1. Verify the webhook signature with PayPal before trusting the event.
    const token = await paypalAccessToken();
    const verify = await fetch("https://api-m.paypal.com/v1/notifications/verify-webhook-signature", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_algo: req.headers.get("paypal-auth-algo"),
        cert_url: req.headers.get("paypal-cert-url"),
        transmission_id: req.headers.get("paypal-transmission-id"),
        transmission_sig: req.headers.get("paypal-transmission-sig"),
        transmission_time: req.headers.get("paypal-transmission-time"),
        webhook_id: Deno.env.get("PAYPAL_WEBHOOK_ID"),
        webhook_event: event,
      }),
    });
    const { verification_status } = await verify.json();
    if (verification_status !== "SUCCESS") {
      return new Response(JSON.stringify({ error: "signature check failed" }), { status: 400 });
    }

    // 2. On a completed capture, match the ticket and release it.
    if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
      const code = event.resource?.custom_id || event.resource?.invoice_id;
      if (code) {
        await admin
          .from("tickets")
          .update({ status: "Delivered", released_at: new Date().toISOString() })
          .eq("code", code);
      }
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
