# Ali & Ariha — Nikkah Invitation

An interactive digital wedding invitation, built to mirror the couple's own
nikkah certificate (floral blue/silver, cream damask background, elegant
calligraphy). Deployed on Vercel.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** — theme tokens (colors, fonts) defined in
  [`src/app/globals.css`](src/app/globals.css), sourced directly from the
  couple's certificate PDF (`Ali & Ariha.pdf`)
- **Framer Motion** for all interaction/animation sequencing

## Design system

All colors and decorative artwork are pulled from the certificate itself:

| Token | Value | Source |
| --- | --- | --- |
| `--color-paper` | `#e6e2dc` | certificate background |
| `--color-paper-card` | `#f4f0e9` | card surfaces |
| `--color-ink` | `#524438` | certificate body text |
| `--color-ink-soft` | `#8a7b6b` | secondary text |
| `--color-petal-light/mid/deep` | blues sampled from the watercolor florals |
| `--color-silver` / `--color-silver-soft` | the certificate's grey calligraphic monogram |

Fonts (all Google Fonts, loaded via `next/font`):
- **Cormorant Garamond** — serif body/headings
- **Great Vibes** — script, couple's names
- **Jost** — light sans, labels/uppercase text
- **Amiri** — Arabic (Bismillah, ayah)

The florals and the grey monogram in `public/images/` are cropped directly
from the certificate PDF, with the cream background digitally removed
(saturation/brightness-based masking — see git history of this README for
the extraction approach if it ever needs redoing from a new certificate).

## What's built so far

- [x] Envelope open → wax seal breaks, flap lifts, letter rises and reveals
      the Bismillah/ayah + the couple's names (`src/components/envelope/`)
- [ ] Scratch card (reveals the date)
- [ ] Countdown
- [ ] Event-day timeline
- [ ] Venue + Google Maps
- [ ] Gift note ("no boxed gifts")
- [ ] RSVP form (name, attending yes/no, guest count, optional blessing)
- [ ] `/admin` — password-gated RSVP list with delete

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Known event details (confirmed)

- Ali Asghar, son of Mr. & Mrs. Nadeem Asghar
- Ariha Maryam, daughter of Mr. & Mrs. Muhammad Akram
- Wednesday, 28 October 2026
- The Emerald Bradford, BD3 9RY
- 12:00 Guest arrival · 12:30 Nikkah · 13:00 Lunch

## Env vars (once RSVP storage + admin are built)

See `.env.example`. `ADMIN_PASSWORD` gates `/admin`.

## Deploying

Push to GitHub, import into Vercel. No env vars are required yet for the
envelope-only build in this commit.
