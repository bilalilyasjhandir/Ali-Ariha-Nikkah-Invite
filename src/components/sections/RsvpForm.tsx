"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode, type Ref } from "react";
import type { RsvpField, RsvpState } from "@/app/actions/rsvp";
import { EVENT } from "@/lib/event";
import { FOIL, FoilRule } from "../paper/foil";
import { BLESSING_MAX, GUESTS_MAX, NAME_MAX } from "./RsvpRules";
import { PaperButton, Reveal, RevealItem, ScriptTitle } from "./ui";

const COPY = EVENT.copy.rsvp;
const SENDING = EVENT.copy.rsvp.sending;

const CAPS = "font-sans text-[3.5cqw] leading-[1.4] tracking-[0.16em] uppercase text-ink-mid";
const NOTE = "font-serif italic text-[max(14px,4.4cqw)] leading-[1.3] text-ink";

type Choice = "yes" | "no" | "";
type Errors = Partial<Record<RsvpField, string>>;

const errorsOf = (s: RsvpState): Errors => (s.status === "invalid" ? s.fieldErrors : {});

// A field's printed caption. When the field needs attention the caption gives
// way to a short italic note in the same place, so nothing on the card shifts.
function Caption({
  htmlFor,
  errorId,
  error,
  children,
}: {
  htmlFor?: string;
  errorId: string;
  error?: string;
  children: ReactNode;
}) {
  const fade = "[grid-area:1/1] self-end transition-opacity duration-300";
  const caption = `${CAPS} ${fade} ${error ? "opacity-0" : ""}`;
  return (
    <div className="grid justify-items-center">
      {htmlFor ? (
        <label htmlFor={htmlFor} className={caption}>
          {children}
        </label>
      ) : (
        <span aria-hidden className={caption}>
          {children}
        </span>
      )}
      <p id={errorId} className={`${NOTE} ${fade} ${error ? "" : "opacity-0"}`}>
        {error || " "}
      </p>
    </div>
  );
}

// A silver foil rule that draws out from the centre under the focused field.
function FocusLine() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 -bottom-px h-[1.5px] origin-center scale-x-0 transition-transform duration-500 ease-[cubic-bezier(0.22,0,0.1,1)] peer-focus:scale-x-100"
      style={{ background: FOIL, backgroundSize: "300% 100%" }}
    />
  );
}

function Option({
  value,
  checked,
  onPick,
  inputRef,
  children,
}: {
  value: Exclude<Choice, "">;
  checked: boolean;
  onPick: (v: Exclude<Choice, "">) => void;
  inputRef?: Ref<HTMLInputElement>;
  children: ReactNode;
}) {
  return (
    <label className="flex items-center gap-[3.2cqw] min-h-[max(44px,12cqw)] cursor-pointer select-none">
      <input
        ref={inputRef}
        type="radio"
        name="attending"
        value={value}
        checked={checked}
        onChange={() => onPick(value)}
        className="peer sr-only"
      />
      {/* a hairline ring that takes a pressed silver dot when chosen */}
      <span
        aria-hidden
        className="grid place-items-center size-[max(17px,4.8cqw)] shrink-0 rounded-full border border-ink/40 transition-colors duration-300 peer-checked:border-ink/70 peer-focus-visible:border-ink peer-checked:*:scale-100"
      >
        <span
          className="size-[56%] rounded-full scale-0 transition-transform duration-400 ease-[cubic-bezier(0.22,0,0.1,1)]"
          style={{ background: FOIL, backgroundSize: "200% 100%", boxShadow: "0 0.5px 0 rgba(255,255,255,0.7)" }}
        />
      </span>
      <span className="font-serif italic text-[max(17px,5.4cqw)] leading-[1.2] text-ink-mid transition-colors duration-300 peer-checked:text-ink underline decoration-transparent decoration-1 underline-offset-[0.9cqw] peer-focus-visible:decoration-silver">
        {children}
      </span>
    </label>
  );
}

function StepButton({
  label,
  disabled,
  onClick,
  plus,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  plus?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="group grid place-items-center size-[max(44px,12cqw)] shrink-0 cursor-pointer disabled:cursor-default outline-none"
    >
      <span className="relative grid place-items-center size-[max(28px,8cqw)] rounded-full border border-silver/80 bg-paper-card/50 transition-colors duration-300 group-hover:bg-white/60 group-active:bg-white/80 group-focus-visible:border-ink/70 group-focus-visible:bg-white/70 group-disabled:opacity-40 group-disabled:group-hover:bg-paper-card/50">
        <span className="absolute h-px w-[40%] bg-ink/75" />
        {plus && <span className="absolute w-px h-[40%] bg-ink/75" />}
      </span>
    </button>
  );
}

export function RsvpForm({
  state,
  pending,
  onSend,
}: {
  state: RsvpState;
  pending: boolean;
  onSend: (form: FormData) => void;
}) {
  const id = useId();
  const [name, setName] = useState("");
  const [choice, setChoice] = useState<Choice>("");
  const [guests, setGuests] = useState(1);
  const [blessing, setBlessing] = useState("");

  // the server's notes stay until the guest touches that field
  const [errorsFrom, setErrorsFrom] = useState(state);
  const [errors, setErrors] = useState<Errors>(() => errorsOf(state));
  if (state !== errorsFrom) {
    setErrorsFrom(state);
    setErrors(errorsOf(state));
  }
  const clear = (f: RsvpField) => {
    if (!errors[f]) return;
    setErrors((e) => {
      const next = { ...e };
      delete next[f];
      return next;
    });
  };

  const nameRef = useRef<HTMLInputElement>(null);
  const firstOption = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (state.status !== "invalid") return;
    const target = state.fieldErrors.name ? nameRef.current : state.fieldErrors.attending ? firstOption.current : null;
    target?.focus({ preventScroll: true });
  }, [state]);

  const declining = choice === "no";
  const general = state.status === "error" ? state.error : "";

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pending) onSend(new FormData(e.currentTarget));
  };

  // "Go" on a phone keyboard would send a half-filled card: put the keyboard
  // away instead, so the choices below come into view.
  const nameKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
  };

  const ids = {
    name: `${id}-name`,
    nameErr: `${id}-name-err`,
    attErr: `${id}-att-err`,
    guests: `${id}-guests`,
    guestsErr: `${id}-guests-err`,
    blessing: `${id}-blessing`,
    blessErr: `${id}-bless-err`,
  };

  return (
    <form onSubmit={submit} noValidate className="h-full [-webkit-tap-highlight-color:transparent]" aria-label="RSVP">
      {/* the smallest cards (older and landscape phones) drop the title rule and sit
          a little higher, keeping room under the button for a note */}
      <Reveal className="h-full pb-[2cqw] @max-[312px]:pb-[6cqw] flex flex-col items-center justify-center text-center">
        <RevealItem>
          <ScriptTitle className="!text-[9.6cqw] whitespace-nowrap">{COPY.title}</ScriptTitle>
        </RevealItem>
        <RevealItem className="mt-[2.2cqw] @max-[312px]:hidden">
          <FoilRule width="7cqw" />
        </RevealItem>

        <RevealItem className="mt-[4.5cqw] w-[72cqw]">
          <Caption htmlFor={ids.name} errorId={ids.nameErr} error={errors.name}>
            {COPY.name}
          </Caption>
          <div className="relative">
            <input
              ref={nameRef}
              id={ids.name}
              name="name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                clear("name");
              }}
              onKeyDown={nameKey}
              maxLength={NAME_MAX}
              autoComplete="name"
              autoCapitalize="words"
              enterKeyHint="next"
              spellCheck={false}
              aria-invalid={!!errors.name || undefined}
              aria-describedby={errors.name ? ids.nameErr : undefined}
              className="peer block w-full h-[max(40px,10.5cqw)] appearance-none autofill:[transition:background-color_100000s] bg-transparent border-0 border-b border-ink/35 rounded-none px-[1cqw] text-center font-serif text-[max(16px,5.2cqw)] text-ink outline-none"
            />
            <FocusLine />
          </div>
        </RevealItem>

        <RevealItem className="mt-[4.5cqw]">
          <fieldset aria-describedby={errors.attending ? ids.attErr : undefined}>
            <legend className="sr-only">{COPY.attending}</legend>
            <Caption errorId={ids.attErr} error={errors.attending}>
              {COPY.attending}
            </Caption>
            <div className="mt-[0.4cqw] inline-flex flex-col items-start">
              <Option
                value="yes"
                checked={choice === "yes"}
                onPick={(v) => {
                  setChoice(v);
                  clear("attending");
                }}
                inputRef={firstOption}
              >
                {COPY.accept}
              </Option>
              <Option
                value="no"
                checked={declining}
                onPick={(v) => {
                  setChoice(v);
                  clear("attending");
                  clear("guests");
                }}
              >
                {COPY.decline}
              </Option>
            </div>
          </fieldset>
        </RevealItem>

        <RevealItem className="mt-[1.2cqw]">
          <div
            role="group"
            aria-labelledby={ids.guests}
            aria-describedby={errors.guests ? ids.guestsErr : undefined}
            aria-disabled={declining || undefined}
            className={`flex items-center justify-center transition-opacity duration-500 ${declining ? "opacity-30" : ""}`}
          >
            <span id={ids.guests} className={`${CAPS} mr-[2cqw] pt-[0.6cqw]`}>
              {COPY.guests}
            </span>
            <StepButton
              label="One fewer guest"
              disabled={declining || guests <= 1}
              onClick={() => {
                setGuests((g) => Math.max(1, g - 1));
                clear("guests");
              }}
            />
            <output
              aria-live="polite"
              className="w-[max(30px,9cqw)] text-center font-serif text-[max(20px,6.6cqw)] leading-none lining-nums tabular-nums text-ink"
            >
              {guests}
            </output>
            <StepButton
              label="One more guest"
              plus
              disabled={declining || guests >= GUESTS_MAX}
              onClick={() => {
                setGuests((g) => Math.min(GUESTS_MAX, g + 1));
                clear("guests");
              }}
            />
            <input type="hidden" name="guests" value={declining ? 0 : guests} />
          </div>
          {/* only reachable by a tampered request: the stepper can't leave 1–10 */}
          {errors.guests && (
            <p id={ids.guestsErr} className={NOTE}>
              {errors.guests}
            </p>
          )}
        </RevealItem>

        <RevealItem className="mt-[4cqw] w-[72cqw]">
          <Caption htmlFor={ids.blessing} errorId={ids.blessErr} error={errors.blessing}>
            {COPY.blessing}
          </Caption>
          <div className="relative mt-[0.6cqw]">
            <textarea
              id={ids.blessing}
              name="blessing"
              rows={2}
              value={blessing}
              onChange={(e) => {
                setBlessing(e.target.value);
                clear("blessing");
              }}
              maxLength={BLESSING_MAX}
              aria-invalid={!!errors.blessing || undefined}
              aria-describedby={errors.blessing ? ids.blessErr : undefined}
              className="peer block w-full resize-none appearance-none bg-transparent border-0 rounded-none p-0 px-[1cqw] font-serif text-[max(16px,5cqw)] leading-[1.65] text-ink outline-none"
              style={{
                height: "calc(1.65em * 2 + 1px)",
                // ruled writing lines that scroll with the text
                backgroundImage:
                  "repeating-linear-gradient(to bottom, transparent 0, transparent calc(1.65em - 1px), rgba(82,68,56,0.3) calc(1.65em - 1px), rgba(82,68,56,0.3) 1.65em)",
                backgroundAttachment: "local",
              }}
            />
            <FocusLine />
          </div>
        </RevealItem>

        <RevealItem className="relative mt-[5.5cqw] flex flex-col items-center">
          <PaperButton type="submit" disabled={pending} aria-busy={pending || undefined} className="min-w-[44cqw] outline-none focus-visible:border-ink/60 focus-visible:bg-white/70">
            {pending ? SENDING : COPY.submit}
          </PaperButton>
          {/* hangs in the margin below the button, so the card never reflows */}
          <p
            role="alert"
            className={`${NOTE} absolute top-full left-1/2 -translate-x-1/2 mt-[1.6cqw] w-[80cqw] !leading-[1.25] [text-wrap:balance] empty:hidden`}
          >
            {general}
          </p>
        </RevealItem>

        {/* for bots only: people never see or reach it */}
        <div aria-hidden className="absolute -left-[9999px] top-0 size-px overflow-hidden">
          <label>
            Website
            <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>
      </Reveal>
    </form>
  );
}
