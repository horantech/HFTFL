# HFTF Ticketing & Check-in

Guest registration, QR ticket delivery, and on-site check-in for the
**Hope for the Fatherless Donation Dinner** (April 30, 2026 · Hilton Hotel).

Built for one staff workflow:

1. **Before the event** — admin registers sponsors (companies / CEOs / individuals) over the phone, adds their guests, and sends a ticket SMS to each phone.
2. **On event day** — staff opens `/scan` on a phone or laptop, scans QR codes at the door, and uses `/guests` to find and check in anyone without their QR.

## Stack

- **Next.js 16** (App Router) + TypeScript + Tailwind v4
- **Postgres** via [Neon](https://neon.tech) + Drizzle ORM
- **iron-session** for the shared staff password
- **Twilio** for SMS
- **html5-qrcode** for in-browser scanning, **qrcode** for generation

## Quick start (local)

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Fill in DATABASE_URL, ADMIN_PASSWORD, SESSION_SECRET, TWILIO_*, NEXT_PUBLIC_APP_URL

# 3. Push schema to DB
npm run db:push

# 4. (Optional) Seed a demo sponsor
npm run seed

# 5. Run
npm run dev
```

Then open `http://localhost:3000`, sign in with `ADMIN_PASSWORD`.

## Routes

| Path | Purpose |
|---|---|
| `/login` | Shared staff sign-in |
| `/dashboard` | Live counts and quick actions |
| `/sponsors` | List of buyers (companies / CEOs / individuals) |
| `/sponsors/new` | Create a new sponsor |
| `/sponsors/[id]` | Sponsor detail · add guests · send SMS · manual check-in |
| `/guests` | Front-desk search by guest, phone, or sponsor name |
| `/scan` | Camera-based QR scanning (entrance) |
| `/import` | Bulk CSV upload |
| `/t/[code]` | Public ticket page (sharable; opens on phone) |

## Deployment

See [DEPLOY.md](./DEPLOY.md) for step-by-step Vercel + Neon setup with `tickets.horan.et`.
