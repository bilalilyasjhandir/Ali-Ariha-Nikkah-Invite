// Every fact and every line of wording on the invitation lives here, so text
// changes never mean hunting through components. Wording follows the couple's
// draft card unless noted.

export const EVENT = {
  groom: { name: "Ali Asghar", short: "Ali", parents: "Son of Mr. & Mrs. Nadeem Asghar" },
  bride: { name: "Ariha Maryam", short: "Ariha", parents: "Daughter of Mr. & Mrs. Muhammad Akram" },

  // 12:00 in Bradford. UK clocks go back on Sunday 25 October 2026, so the
  // day itself is on GMT (UTC+0) — this instant is correct for every guest,
  // wherever they are opening the link.
  startsAt: "2026-10-28T12:00:00Z",
  endsAt: "2026-10-28T16:00:00Z",
  date: {
    long: "Wednesday, 28 October 2026",
    weekday: "Wednesday",
    day: "28",
    month: "October",
    year: "2026",
    time: "12:00 PM onwards",
  },

  venue: {
    name: "The Emerald Bradford",
    address: "3 Tickhill St, Bradford BD3 9RY",
    mapsUrl: "https://www.google.com/maps?q=Hall,+Southend,+3+Tickhill+St,+Bradford+BD3+9RY",
    embedUrl: "https://www.google.com/maps?q=Hall,+Southend,+3+Tickhill+St,+Bradford+BD3+9RY&output=embed",
  },

  schedule: [
    { time: "12:00", period: "PM", title: "Guest Arrival", detail: "Drinks and snacks will be served" },
    { time: "12:30", period: "PM", title: "Nikkah", detail: "The nikkah ceremony will begin" },
    { time: "1:00", period: "PM", title: "Lunch", detail: "Guests will be requested to take their seats as lunch is served" },
  ],

  copy: {
    invitation:
      "With hearts full of joy and by the grace of the Almighty, we cordially invite you and your esteemed family to grace the auspicious occasion of our wedding ceremony and shower the couple with your love, blessings, and good wishes.",
    scratch: { eyebrow: "Save the Date", prompt: "Scratch to reveal the date", reveal: "or tap to reveal" },
    countdown: {
      title: "Counting Down To Forever",
      calendar: "Add to calendar",
      today: "Today is the day",
      after: "Thank you for celebrating with us",
    },
    schedule: { title: "The Day's Schedule" },
    venue: { eyebrow: "The Venue", button: "See On Google Maps", mapCredit: "Map data © Google" },
    // not on the draft card — the couple asked simply for a note about boxed gifts
    gift: {
      eyebrow: "A Gentle Request",
      body: "Your blessings mean the world to us. We kindly request that you do not bring boxed gifts.",
    },
    rsvp: {
      title: "Will You Join Us?",
      name: "Your name",
      attending: "Attending?",
      accept: "Joyfully accept",
      decline: "Regretfully decline",
      guests: "Guests",
      blessing: "Your blessings (optional)",
      submit: "Send RSVP",
      sending: "Sending…",
      received: "We’ve received your RSVP",
      another: "Reply for someone else",
      offline: "Sorry — that didn’t reach us. Please check your connection and try again.",
      thanksAccept: "Thank you — we can’t wait to celebrate with you.",
      thanksDecline: "Thank you for letting us know. You will be missed.",
    },
    closing: {
      body: "Your presence is the most precious gift we could ask for. We humbly request the honour of your company as we begin this beautiful journey together.",
      signoff: "Awaiting your gracious presence",
      again: "View the invitation again",
    },
  },
} as const;

export const SECTION_IDS = [
  "invitation",
  "date",
  "countdown",
  "schedule",
  "venue",
  "gifts",
  "rsvp",
  "closing",
] as const;
export type SectionId = (typeof SECTION_IDS)[number];
