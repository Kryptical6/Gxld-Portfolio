# Advanced setup (optional add-ons)

These three features are wired in code but need your own accounts/keys plus a
one-time edge-function deploy. They are all optional — the site works fully
without them. Do the base [SUPABASE_SETUP.md](SUPABASE_SETUP.md) first.

You'll need the Supabase CLI once:

```
npm i -g supabase
supabase login
supabase link --project-ref <your-project-ref>
```

---

## 1. Spam protection (Cloudflare Turnstile)

Stops bots from flooding your ticket form / inbox.

1. Create a free Turnstile widget at <https://dash.cloudflare.com/?to=/:account/turnstile>. You get a **site key** and a **secret key**.
2. Add the site key to your env (locally in `.env`, and on Vercel), then redeploy:
   ```
   VITE_TURNSTILE_SITE_KEY=0x4AAAAAAA...
   ```
3. Deploy the edge function and give it the secret:
   ```
   supabase functions deploy create-ticket --no-verify-jwt
   supabase secrets set TURNSTILE_SECRET=0x4AAAAAAA...secret
   ```
4. (Recommended) Lock down direct creation so every ticket must pass the captcha. In the SQL editor:
   ```sql
   revoke execute on function public.create_ticket(text,text,text,text,text,text,text) from anon;
   ```

Now the ticket form shows a captcha, and creation goes through the function
(`supabase/functions/create-ticket`), which verifies the token with service-role
access before inserting.

---

## 2. Email the client on replies / status changes (Resend)

Right now only **you** get an email (Formspree) on new tickets. This adds emails
to the **client** when you reply or change their status.

1. Sign up at <https://resend.com>, verify a sending domain, and create an API key.
2. Deploy the function and set secrets:
   ```
   supabase functions deploy notify-client
   supabase secrets set RESEND_API_KEY=re_xxx FROM_EMAIL="GXLD <noreply@yourdomain.com>"
   ```
3. In Supabase, go to **Database → Webhooks** and create two webhooks pointing at
   the `notify-client` function URL:
   - Table `ticket_replies`, event **INSERT**
   - Table `tickets`, event **UPDATE**

The function (`supabase/functions/notify-client`) ignores client replies and only
emails on GXLD activity.

---

## 3. Automatic PayPal release (advanced)

Turns the manual "Confirm payment & release" into an automatic release when
PayPal reports payment. This is a **scaffold** — finish + test it carefully
before relying on it, since money is involved.

1. Create an app at <https://developer.paypal.com>, add a webhook subscribed to
   `PAYMENT.CAPTURE.COMPLETED`, and note the **webhook ID**.
2. Deploy + set secrets:
   ```
   supabase functions deploy paypal-webhook --no-verify-jwt
   supabase secrets set PAYPAL_CLIENT_ID=xxx PAYPAL_SECRET=xxx PAYPAL_WEBHOOK_ID=xxx
   ```
3. Point the PayPal webhook at the `paypal-webhook` function URL.
4. Make buyers' payments carry the **ticket code** in PayPal's `custom_id` (or
   `invoice_id`) so the function can match the payment to the ticket. The
   function (`supabase/functions/paypal-webhook`) verifies the signature and, on a
   completed capture, marks that ticket **Delivered** (unlocking the files).

Until this is finished, keep using the manual release button — it's reliable and
covers both PayPal and Robux.
