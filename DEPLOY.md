# Deploying to Vercel + Neon

This walks you through getting **tickets.horan.et** live in ~15 minutes.

## Overview

```
Browser  →  https://tickets.horan.et
              │
              ▼
            Vercel  ──── Postgres queries ────►  Neon (Postgres)
              │
              └──── SMS ────►  Twilio
```

You'll need three free accounts:

1. **Neon** — the database (`https://neon.tech`)
2. **Vercel** — hosts the website (`https://vercel.com`)
3. **Twilio** — sends SMS (`https://www.twilio.com`)

And one thing on Hahu Cloud:

4. A DNS record for `tickets.horan.et`

---

## 1. Create the Neon database

1. Sign up at https://console.neon.tech.
2. Create a new project → name it `hftfl` → region: pick the closest (e.g. **AWS Frankfurt** or **Singapore**).
3. After it's created, click **Connection Details**.
4. Copy the **pooled connection string**. It looks like:
   ```
   postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```
   Save this — you'll paste it into Vercel as `DATABASE_URL`.

## 2. Create your Twilio sender

1. Sign up at https://www.twilio.com.
2. From the Console, copy:
   - **Account SID** (starts with `AC...`)
   - **Auth Token**
3. Create a phone number (Phone Numbers → Manage → Buy a number) **or** register an Alphanumeric Sender ID (e.g. `HFTF`) under Messaging → Senders. Pick the cheapest country that can deliver to Ethiopian numbers.
4. Save the sender (number or alpha ID) as `TWILIO_FROM`.

> If Twilio doesn't deliver well to Ethiopian phones, swap to a local provider (Afromessage, Geezsms). Update `src/lib/sms.ts` to call their HTTP API instead of Twilio. Everything else in the app stays the same.

## 3. Push the database schema

From your laptop, with the Neon URL handy:

```bash
git clone <this-repo>
cd HFTFL
npm install
echo 'DATABASE_URL=postgresql://...your-neon-url...' > .env
npm run db:push
```

You should see `[✓] Changes applied`. Your tables are now on Neon.

## 4. Deploy to Vercel

1. Push this repo to GitHub (or GitLab/Bitbucket).
2. Go to https://vercel.com/new and import the repo.
3. Vercel auto-detects Next.js. Don't change build settings.
4. **Environment Variables** — add these for **Production** and **Preview**:

   | Name | Value |
   |---|---|
   | `DATABASE_URL` | your Neon pooled connection string |
   | `ADMIN_PASSWORD` | a strong shared password for staff |
   | `SESSION_SECRET` | run `openssl rand -base64 48` and paste the output |
   | `TWILIO_ACCOUNT_SID` | from Twilio |
   | `TWILIO_AUTH_TOKEN` | from Twilio |
   | `TWILIO_FROM` | your Twilio number or sender ID |
   | `NEXT_PUBLIC_APP_URL` | `https://tickets.horan.et` |

5. Click **Deploy**.
6. Once it's live, you'll see a `*.vercel.app` URL — open it and confirm the login screen appears.

## 5. Point tickets.horan.et at Vercel

1. In Vercel project → **Settings → Domains** → add `tickets.horan.et`.
2. Vercel shows you a CNAME record to add. It looks like:
   ```
   tickets   CNAME   cname.vercel-dns.com
   ```
3. In your **Hahu Cloud** dashboard:
   - Go to **Domains → horan.et → Manage → DNS**.
   - Add a new record:
     - **Type**: CNAME
     - **Name**: `tickets`
     - **Target / Value**: `cname.vercel-dns.com`
     - **TTL**: 300 (or default)
   - Save.
4. Wait 5–15 minutes. Vercel auto-issues an SSL certificate. The status changes from "Pending" to "Valid Configuration".
5. Open `https://tickets.horan.et` — sign in.

## 6. First-run checks

- Sign in at `/login` with `ADMIN_PASSWORD`.
- `/dashboard` shows zeros — expected.
- `/sponsors/new` → create a test sponsor → add a test guest with **your own phone number**.
- Click "SMS" — you should receive the ticket.
- Open the SMS link on your phone → tap **Share** to confirm everything renders.
- Open `/scan` on your phone → scan the QR from another phone → confirm green check + remembered count goes up on `/dashboard`.
- Try scanning the same QR again → should show amber **"Already checked in"**.
- Delete the test data when done.

## 7. Day-of-event checklist

- [ ] All sponsors entered (or imported via `/import`)
- [ ] Per-sponsor SMS sent (button on each sponsor page)
- [ ] (Optional) Day-before reminder: hit `POST /api/sms/reminder-all` from the dashboard once
- [ ] Staff phones bookmarked to `https://tickets.horan.et/scan`
- [ ] Front-desk laptop logged in, parked on `/guests` for fast manual search
- [ ] One staff member watching `/dashboard` for live counts

## Troubleshooting

**Camera doesn't open on `/scan`** — only works over HTTPS. The Vercel domain and `tickets.horan.et` both serve HTTPS automatically; `localhost` works as an exception. If you've added a custom domain and it's still not working, the SSL cert may not have provisioned yet — wait ~10 minutes.

**SMS not sending** — check Vercel logs (Project → Deployments → latest → Function logs). Most common: `TWILIO_FROM` doesn't match a real number/sender, or the destination country isn't enabled in Twilio's Geo Permissions (Messaging → Settings → Geo Permissions → enable Ethiopia).

**Schema changes** — edit `src/db/schema.ts`, then locally `npm run db:push` against the Neon URL. Or generate a migration with `npm run db:generate` and apply with `npm run db:migrate` on a build hook.
