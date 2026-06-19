// Edge function: email the client when GXLD replies or changes their status.
//
// Hook this up as a Supabase Database Webhook (Database -> Webhooks):
//   * Table: ticket_replies, Event: INSERT  (fires on every reply)
//   * Table: tickets,        Event: UPDATE  (fires on status/delivery changes)
// Point both webhooks at this function's URL.
//
// Deploy:  supabase functions deploy notify-client
// Secrets: supabase secrets set RESEND_API_KEY=re_xxx FROM_EMAIL="GXLD <noreply@yourdomain>"
//
// Notes:
//   * Requires a verified sending domain in Resend (https://resend.com).
//   * Replies from the client themselves are ignored (only GXLD activity emails).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function sendEmail(to: string, subject: string, text: string) {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key || !to) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: Deno.env.get("FROM_EMAIL") ?? "GXLD <onboarding@resend.dev>", to, subject, text }),
  });
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const { table, type, record, old_record } = payload;

    // New GXLD reply -> notify the client on that ticket.
    if (table === "ticket_replies" && type === "INSERT" && record?.from_role === "GXLD") {
      const { data: ticket } = await admin.from("tickets").select("code, name, email").eq("id", record.ticket_id).single();
      if (ticket?.email) {
        await sendEmail(
          ticket.email,
          `GXLD replied to your ticket ${ticket.code}`,
          `Hi ${ticket.name},\n\nGXLD just replied to your commission ticket (${ticket.code}). Open your ticket on the site to read it and respond.\n\n- GXLD`,
        );
      }
    }

    // Status change -> notify the client.
    if (table === "tickets" && type === "UPDATE" && record?.status !== old_record?.status && record?.email) {
      await sendEmail(
        record.email,
        `Your GXLD ticket ${record.code} is now "${record.status}"`,
        `Hi ${record.name},\n\nYour commission ticket (${record.code}) status changed to "${record.status}".\n\nOpen your ticket on the site for details.\n\n- GXLD`,
      );
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
