// The background song: one <audio> element for the whole visit, controlled
// from anywhere. Browsers only allow sound after the guest has touched the
// page, and iOS only for a play() made inside that touch — so the seal tap
// primes the element silently, and the song starts a beat later as the flap
// opens. The file itself carries a gentle fade-in and a fade-out before the
// loop point (iOS ignores volume changes from script, so fades can't be
// relied on in code).

export type MusicStatus = "idle" | "playing" | "paused";

const SRC = "/audio/nikkah-song.mp3";
const LEVEL = 0.6;

let audio: HTMLAudioElement | null = null;
let status: MusicStatus = "idle";
let started = false;
let pausedByPage = false;
let fadeFrame = 0;
const listeners = new Set<() => void>();

function set(next: MusicStatus) {
  if (status === next) return;
  status = next;
  listeners.forEach((l) => l());
}

function element() {
  if (audio) return audio;
  audio = new Audio(SRC);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = LEVEL;
  document.addEventListener("visibilitychange", () => {
    if (!audio || status !== "playing") return;
    if (document.hidden) {
      pausedByPage = true;
      audio.pause();
    } else if (pausedByPage) {
      pausedByPage = false;
      audio.play().catch(() => set("paused"));
    }
  });
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: "The Nikkah of Ali & Ariha",
      artwork: [{ src: "/icon.png", sizes: "512x512", type: "image/png" }],
    });
    navigator.mediaSession.setActionHandler("play", () => play());
    navigator.mediaSession.setActionHandler("pause", () => pause());
  }
  return audio;
}

// Volume ramps where the browser allows them (not iOS, where volume is fixed).
function fadeTo(target: number, ms: number, done?: () => void) {
  const el = element();
  cancelAnimationFrame(fadeFrame);
  const from = el.volume;
  const t0 = performance.now();
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / ms);
    el.volume = from + (target - from) * k;
    if (k < 1) fadeFrame = requestAnimationFrame(step);
    else done?.();
  };
  fadeFrame = requestAnimationFrame(step);
}

function play() {
  const el = element();
  el.muted = false;
  el.volume = 0;
  fadeTo(LEVEL, 900);
  set("playing");
  el.play().catch(() => set("paused"));
}

function pause() {
  const el = element();
  set("paused");
  fadeTo(0, 350, () => {
    if (status === "paused") el.pause();
  });
}

export const music = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getStatus: () => status,

  // start downloading once the page is otherwise ready
  preload() {
    element();
  },

  // Call synchronously inside the tap that opens the envelope.
  prime() {
    const el = element();
    el.muted = true;
    el.play()
      .then(() => {
        if (started) return;
        el.pause();
        el.currentTime = 0;
      })
      .catch(() => {})
      .finally(() => {
        if (!started) el.muted = false;
      });
  },

  start() {
    if (started) return;
    started = true;
    const el = element();
    el.currentTime = 0;
    el.muted = false;
    el.volume = LEVEL;
    set("playing");
    el.play().catch(() => set("paused"));
  },

  toggle() {
    started = true;
    if (status === "playing") pause();
    else play();
  },
};
