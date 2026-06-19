# Supabase setup (real shared tickets)

The site works out of the box in **offline fallback mode** — tickets are saved
only in each visitor's own browser. To make tickets real and shared (a client
opens a ticket on their device, you see and manage it on yours, and releasing
files unlocks the download for them), connect a free Supabase project.

It takes ~10 minutes. You write nothing — just click through the dashboard and
paste two values.

---

## 1. Create a Supabase project

1. Go to <https://supabase.com> and sign up (free tier is plenty).
2. **New project** → give it a name, set a strong database password, pick a region close to you.
3. Wait ~2 minutes for it to provision.

## 2. Create the database

1. In the project, open **SQL Editor** → **New query**.
2. Open [`supabase/schema.sql`](supabase/schema.sql) from this repo, copy everything, paste it in, and click **Run**.
3. You should see "Success". This creates the `tickets` and `ticket_replies` tables, security rules, and the functions visitors use.

## 3. Get your two keys

1. Open **Project Settings** (gear) → **API**.
2. Copy the **Project URL** (looks like `https://abcd1234.supabase.co`).
3. Copy the **anon public** key (a long string). This one is safe to expose in a website build — the database security rules are what protect your data.

## 4. Create your owner login

1. Open **Authentication** → **Users** → **Add user** → **Create new user**.
2. Enter the email + password you want to log into the Admin Desk with. (Tick "Auto Confirm User" so you can log in immediately.)
3. Open **Authentication** → **Sign In / Providers** (or **Settings**) and **turn OFF public sign-ups** ("Allow new users to sign up" / "Enable email signups"). This ensures only the owner account you just made can ever log in and see tickets.

## 5. Add the keys to the site

**Local development** — create a file named `.env` in the project root (copy `.env.example`):

```
VITE_SUPABASE_URL=https://abcd1234.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

Then restart `npm run dev`.

**Your live host** (Vercel / Netlify / Cloudflare Pages) — add the same two
variables in the host's **Environment Variables** settings, then redeploy.
(Vite only reads variables prefixed with `VITE_`, and only at build time, so a
redeploy is required after changing them.)

## 6. Verify

1. Open the site, click **Open Ticket → Open Website Ticket**, and create a test ticket. Note the code.
2. On a **different device or browser**, click **Open Ticket → Administration**, log in with your owner email + password — the test ticket should be listed.
3. Set a quote, paste a delivery link, and click **Confirm payment & release**.
4. Back on the client side, open the ticket by its code and refresh — the **Download your files** button should appear.

---

## How security works (plain version)

- **Visitors are anonymous.** They can only *create* a ticket and *open one they
  know the code for* (codes are random, ~4 billion combinations). They cannot
  list or read anyone else's ticket.
- **You log in** with a real account. The database only lets a logged-in user
  read/manage tickets, and you keep sign-ups disabled so you're the only account.
- The **anon key in the build is meant to be public**; it grants nothing beyond
  the rules above.

## Notes

- Tickets created before you connected Supabase lived only in browsers'
  localStorage and won't migrate — they were a demo. Real tickets start once keys are set.
- Email notifications (Formspree) still fire on new tickets in both modes.
- **Automatic PayPal verification** is intentionally not wired yet. The current
  flow is: you confirm payment manually, which releases the files. When you want
  auto-release, it can be added later with a Supabase Edge Function listening to
  PayPal webhooks — the data model is already shaped for it.
