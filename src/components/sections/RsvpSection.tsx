"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useActionState, useEffect, useRef, useState, startTransition } from "react";
import { submitRsvp, type RsvpState } from "@/app/actions/rsvp";
import { EVENT } from "@/lib/event";
import { BLOOMS, Paper } from "../paper/Paper";
import { FoilMonogram, FoilRule, PRESS } from "../paper/foil";
import { RsvpForm } from "./RsvpForm";
import { Section } from "./Section";
import { Eyebrow } from "./ui";

const COPY = EVENT.copy.rsvp;
const RECEIVED = EVENT.copy.rsvp.received;
const ANOTHER = EVENT.copy.rsvp.another;
const OFFLINE = EVENT.copy.rsvp.offline;

const EASE = [0.22, 0, 0.1, 1] as const;

type Reply = { name: string; attending: boolean };

async function send(prev: RsvpState, form: FormData): Promise<RsvpState> {
  try {
    return await submitRsvp(prev, form);
  } catch {
    return { status: "error", error: OFFLINE };
  }
}

// Long names step down a size so they never run past the card.
function nameSize(name: string) {
  const n = [...name].length;
  return n > 40 ? "text-[6.5cqw]" : n > 22 ? "text-[7.5cqw]" : n > 14 ? "text-[8.4cqw]" : "text-[11cqw]";
}

// The copperplate's own ampersand reads as a squiggle; set it in the serif
// italic, as on the invitation.
function ScriptName({ name }: { name: string }) {
  return name.split(/(&)/).map((part, i) =>
    part === "&" ? (
      <span key={i} className="font-serif italic text-[0.8em]">
        &amp;
      </span>
    ) : (
      part
    ),
  );
}

function Thanks({ reply, onAnother }: { reply: Reply; onAnother: () => void }) {
  const reduce = useReducedMotion();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);

  const rise = (delay: number) => ({
    initial: { opacity: 0, transform: `translateY(${reduce ? 0 : 10}px)` },
    whileInView: { opacity: 1, transform: "translateY(0px)" },
    viewport: { once: true, amount: 0.4 },
    transition: { duration: 0.8, delay, ease: EASE },
  });

  return (
    <div className="absolute inset-[9.5cqw] flex flex-col items-center justify-center text-center [-webkit-tap-highlight-color:transparent]">
      {/* the monogram is pressed into the card, like a seal */}
      <motion.div
        initial={{ opacity: 0, transform: `scale(${reduce ? 1 : 1.18})` }}
        whileInView={{ opacity: 1, transform: "scale(1)" }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1, delay: 0.15, ease: EASE }}
      >
        <FoilMonogram className="w-[10cqw]" />
      </motion.div>

      <motion.div className="mt-[8cqw]" {...rise(0.45)}>
        <Eyebrow>{RECEIVED}</Eyebrow>
      </motion.div>

      <motion.h2
        ref={heading}
        tabIndex={-1}
        className={`mt-[3.5cqw] max-w-full px-[2cqw] font-script leading-[1.25] text-ink break-words [text-wrap:balance] outline-none ${nameSize(reply.name)}`}
        style={PRESS}
        {...rise(0.6)}
      >
        <ScriptName name={reply.name} />
      </motion.h2>

      <motion.p
        className="mt-[3cqw] max-w-[64cqw] font-serif italic text-[5.2cqw] leading-[1.45] text-ink [text-wrap:balance]"
        style={PRESS}
        {...rise(0.75)}
      >
        {reply.attending ? COPY.thanksAccept : COPY.thanksDecline}
      </motion.p>

      <motion.div
        className="mt-[7cqw]"
        initial={{ opacity: 0, transform: `scaleX(${reduce ? 1 : 0.3})` }}
        whileInView={{ opacity: 1, transform: "scaleX(1)" }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 1.1, delay: 0.95, ease: EASE }}
      >
        <FoilRule />
      </motion.div>

      <motion.div className="mt-[10cqw]" {...rise(1.2)}>
        <button
          type="button"
          onClick={onAnother}
          className="min-h-[44px] px-[3cqw] cursor-pointer font-sans text-[3.5cqw] tracking-[0.16em] uppercase text-ink-mid underline decoration-ink/30 decoration-1 underline-offset-[1.2cqw] transition-colors hover:text-ink hover:decoration-ink/60 focus-visible:text-ink focus-visible:decoration-silver outline-none"
        >
          {ANOTHER}
        </button>
      </motion.div>
    </div>
  );
}

export function RsvpSection() {
  const [state, dispatch, pending] = useActionState(send, { status: "idle" });
  // "Reply for someone else" sets aside the reply on screen until the next one is sent
  const [setAside, setSetAside] = useState<RsvpState | null>(null);

  // nothing is remembered between visits: the thank-you shows only right after sending
  const reply: Reply | null = state.status === "success" && state !== setAside ? state : null;
  const another = () => setSetAside(state);

  return (
    <Section id="rsvp" label="RSVP" tilt={0.5}>
      <Paper blooms={BLOOMS.topRight}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={reply ? `thanks:${reply.name}:${reply.attending}` : "form"}
            className="absolute inset-0"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE }}
          >
            {reply ? (
              <Thanks reply={reply} onAnother={another} />
            ) : (
              <div className="absolute inset-[9.5cqw]">
                <RsvpForm
                  state={state}
                  pending={pending}
                  onSend={(form) => startTransition(() => dispatch(form))}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Paper>
    </Section>
  );
}
