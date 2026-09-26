"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { removeRsvp } from "./actions";

const text = "min-h-[44px] px-2 font-sans text-[12px] tracking-[0.18em] uppercase transition-colors";
const focusRing = "outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-ink/60";

// Two steps, so a stray tap on a phone can't lose a guest's reply.
export function DeleteRsvp({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const deleteRef = useRef<HTMLButtonElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const moveFocus = useRef(false);

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    (confirming ? cancelRef : deleteRef).current?.focus();
  }, [confirming]);

  const ask = (next: boolean) => {
    moveFocus.current = true;
    setError(null);
    setConfirming(next);
  };

  const confirm = () =>
    start(async () => {
      const result = await removeRsvp(id);
      if (!result.ok) {
        setError(result.error);
        ask(false);
      }
    });

  if (pending) {
    return (
      <p data-deleting className="flex min-h-[44px] items-center font-sans text-[12px] tracking-[0.18em] uppercase text-ink-mid">
        Deleting…
      </p>
    );
  }

  return (
    <div className="-mr-2 flex flex-col items-end">
      {confirming ? (
        <div
          role="group"
          aria-label={`Delete the reply from ${name}?`}
          className="flex flex-wrap items-center justify-end lg:flex-col lg:items-end"
          onKeyDown={(e) => e.key === "Escape" && ask(false)}
        >
          <span className="px-2 font-serif italic text-[17px] text-ink lg:pt-2">Delete?</span>
          <span className="flex items-center">
            <button
              type="button"
              onClick={confirm}
              className={`${text} ${focusRing} font-medium text-ink underline decoration-silver underline-offset-[5px] hover:decoration-ink`}
            >
              Yes
            </button>
            <span aria-hidden className="font-serif text-[15px] text-silver">
              /
            </span>
            <button ref={cancelRef} type="button" onClick={() => ask(false)} className={`${text} ${focusRing} text-ink-mid hover:text-ink`}>
              Cancel
            </button>
          </span>
        </div>
      ) : (
        <button
          ref={deleteRef}
          type="button"
          onClick={() => ask(true)}
          aria-label={`Delete the reply from ${name}`}
          className={`${text} ${focusRing} text-ink-mid hover:text-ink hover:underline hover:decoration-silver hover:underline-offset-[5px]`}
        >
          Delete
        </button>
      )}
      {error && (
        <p role="alert" className="max-w-[16rem] pr-2 text-right font-serif italic text-[15px] leading-snug text-ink">
          {error}
        </p>
      )}
    </div>
  );
}
