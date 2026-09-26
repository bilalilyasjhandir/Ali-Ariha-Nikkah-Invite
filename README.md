# Ali & Ariha — Nikkah Invitation

An interactive digital wedding invitation, built from the couple's own nikkah
certificate (floral blue/silver, ivory damask, calligraphic monogram).
Deployed on Vercel.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4** — tokens in [`src/app/globals.css`](src/app/globals.css)
- **Framer Motion** — every animation is driven by motion values

## The opening

A photographed-looking flat-lay: an ivory cotton envelope (laser-cut lace
flap, blind-embossed damask, silver-foil names) on blue-grey linen, sealed
with a dusty-blue wax seal pressed with the couple's monogram. Tapping the
seal presses it, a line of light cracks through the wax, light blooms out
from under it while the room dims, the flap unsticks and swings open over a
floral liner (the small cap of wax on the flap tip snaps off with it — the
monogram stays whole), the camera follows the deckle-edged card up out of
the pocket, and the envelope slides away as the card settles for reading.

**All realism is baked into images, not drawn in CSS.** The envelope layers,
wax seal, paper, liner, linen and card were rendered in Python (heightmaps,
relit with one shared window light from the upper-left) and live in
`public/images/opening/`. The web layer only stacks and animates them.
Geometry that ties the images together — every layer's frame and where the
seal sits — is in `src/components/opening/geometry.ts` and must match the
renders exactly.

| File | What it is |
| --- | --- |
| `env-interior`, `env-pocket` | inside of the envelope (with ground shadow) / the front pocket with the mouth cut out |
| `flap-front`, `flap-back` | the lace flap's outer face / its liner face (pre-flipped for the 3D back face) |
| `flap-shadow`, `flap-shadow-soft`, `flap-open-shadow` | closed flap's shadow, its blurred penumbra for when it lifts, and the open flap's shadow on the table |
| `seal`, `seal-body`, `seal-flap`, `seal-crumb-*` | whole seal, the two pieces it breaks into, wax crumbs |
| `seal-light`, `seal-halo` | the light escaping through the fracture (brightness baked as alpha — see below), and the glow spilling out around the seal (the seal itself cut out, so the wax never fogs) |
| `card`, `card-mask` | deckle-edged cotton card (text is live HTML over it) and its edge alpha |
| `backdrop` | tileable linen |

`src/components/opening/seal-crack.json` is the fracture path and crumb spawn
points in seal-canvas pixels.

### Things that look odd but are deliberate

- **No CSS blend modes on the seal light.** Every animated ancestor isolates
  blending, so a `screen` pass would composite its black background. The
  light pass is baked with brightness as alpha, which reproduces screen under
  normal blending.
- **Mid-animation switches are motion values, not React state** (which piece
  of the seal shows, the flap's and card's z-order). A re-render of this tree
  costs several frames on a phone.
- **The foil shimmer pauses while the envelope moves** (`[data-opening]` in
  `globals.css`): it animates a background gradient, which repaints and
  re-filters every frame.
- **Images are served unoptimised** (`next.config.ts`). They're already
  hand-tuned WebPs at the right size; the optimiser only softens the paper
  and wax textures, and it hung locally on Windows for some variants.
- **The linen doesn't move with the camera** — only the blossoms do, locked
  to the same zoom and lift as the envelope. A static tiled layer can never
  expose the page edge.
- **The camera is aimed relative to the card** (`focusOffset` in
  `OpeningScene.tsx`): it pulls back to frame the open flap, then eases onto
  the card as it rises, so the card never overshoots and comes back.
- **The card has a minimum reading width** (`--card-w` in `globals.css`). On
  a short laptop or a phone held sideways it is taller than the screen, lands
  top-anchored, and the page scrolls — rather than the text shrinking.
- **Layers that start invisible sit at opacity 0.003** (`WARM`): the browser
  doesn't rasterise fully transparent layers, and doing it mid-animation
  drops frames.
- **Frame-pacing numbers come from Chrome traces (`DrawFrame`), not the
  screencast** — CDP screencast capture stalls on its own at large sizes.

Measured under 4× CPU throttling (a mid-range Android), production build: no
dropped-frame gap above ~60 ms during the animation.

## Design system

| Token | Value | Source |
| --- | --- | --- |
| `--color-paper` | `#e6e2dc` | certificate background |
| `--color-paper-card` | `#f4f0e9` | card surfaces |
| `--color-ink` | `#524438` | certificate body text |
| `--color-ink-mid` | `#6a5b4d` | secondary text (clears 4.5:1 on the card) |
| `--color-silver` / `--color-silver-soft` | the certificate's grey monogram |

Fonts (Google Fonts via `next/font`): **Cormorant Garamond** (serif),
**Pinyon Script** (names — an engraved copperplate whose capital A can't be
misread), **Jost** (small caps), **Amiri** (Arabic).

`design/` holds the couple's original flower and monogram art (not served).
`Ali & Ariha.pdf` is the certificate the palette and the damask come from.

## After the opening: the sections

Eight full-screen sections, one card each, in a native CSS scroll-snap
container (`src/components/sections/Sections.tsx`): one swipe or one key press
moves one section. A mouse wheel tick or trackpad flick is turned into exactly
one step by a small wheel handler (natively it would snap back). Section dots
sit on the right on laptops.

1. Invitation (the card from the envelope)
2. Save the date — scratch card that reveals the date
3. Countdown, with add-to-calendar
4. The day's schedule
5. Venue, with the Google Maps location
6. A gentle request (no boxed gifts)
7. RSVP
8. Closing note

Every card is the same photoreal cotton card (`src/components/paper/Paper.tsx`)
with content laid out in `cqw` so it scales with the card. **All wording and
event facts live in `src/lib/event.ts`** — edit text there.

A link ending in a section id (e.g. `…/#rsvp`) skips the envelope and opens
straight on that section.

## RSVPs and /admin

RSVPs are stored by `src/lib/rsvp-store.ts`: in an **Upstash Redis** database
on Vercel, or in `.data/rsvps.json` when running locally without one.
`/admin` shows every RSVP and lets you delete them; it is protected by the
`ADMIN_PASSWORD` environment variable (locally in `.env.local`, which is not
committed).

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Known event details (confirmed)

- Ali Asghar, son of Mr. & Mrs. Nadeem Asghar
- Ariha Maryam, daughter of Mr. & Mrs. Muhammad Akram
- Wednesday, 28 October 2026, 12:00 PM (GMT — the UK clocks change on 25 Oct)
- The Emerald Bradford, 3 Tickhill St, Bradford BD3 9RY
- 12:00 Guest arrival · 12:30 Nikkah · 13:00 Lunch

## Deploying to Vercel

1. Push the repo to GitHub and import it into Vercel (framework: Next.js, no
   build settings to change).
2. **RSVP database:** in the Vercel project, open **Storage → Create
   Database → Upstash for Redis** (free tier is plenty) and connect it to the
   project. That adds the `KV_REST_API_URL` / `KV_REST_API_TOKEN` variables
   automatically. Without it, the RSVP form shows a polite "not open yet"
   message instead of saving.
3. **Admin password:** in **Settings → Environment Variables** add
   `ADMIN_PASSWORD` with the password for `/admin`.
4. Redeploy so the new variables are picked up. Then send a test RSVP and
   check it appears at `/admin`.
