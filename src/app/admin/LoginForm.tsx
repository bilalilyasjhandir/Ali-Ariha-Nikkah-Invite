"use client";

import { useActionState, useState } from "react";
import { login, type LoginState } from "./actions";

const focusRing = "outline-none focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-ink/60";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { error: null });
  const [shown, setShown] = useState(false);

  return (
    <form action={action} className="mt-9 text-left">
      {/* lets password managers file the saved password under a name */}
      <input type="text" name="username" autoComplete="username" defaultValue="Ali & Ariha" hidden readOnly />

      <label htmlFor="admin-password" className="font-sans text-[12px] tracking-[0.18em] uppercase text-ink-mid">
        Password
      </label>
      <div className="relative mt-1.5">
        <input
          id="admin-password"
          name="password"
          type={shown ? "text" : "password"}
          autoComplete="current-password"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          required
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "admin-error" : undefined}
          className="block w-full min-h-[48px] rounded-none border-0 border-b border-silver bg-transparent pl-0.5 pr-16 font-sans text-[17px] tracking-[0.06em] text-ink outline-none transition-colors focus:border-ink"
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-pressed={shown}
          aria-label={shown ? "Hide password" : "Show password"}
          className={`absolute right-0 top-0 flex h-full min-w-[44px] items-center justify-end font-sans text-[11px] tracking-[0.18em] uppercase text-ink-mid transition-colors hover:text-ink ${focusRing}`}
        >
          {shown ? "Hide" : "Show"}
        </button>
      </div>

      <p id="admin-error" role="alert" className="mt-3 min-h-[1.4em] font-serif italic text-[17px] leading-snug text-ink">
        {state.error}
      </p>

      <button
        type="submit"
        disabled={pending}
        className={`mt-4 flex w-full min-h-[48px] items-center justify-center rounded-full border border-silver/80 bg-paper-card/60 font-sans text-[13px] tracking-[0.2em] uppercase text-ink transition-colors hover:bg-white/70 active:bg-white/90 disabled:cursor-default disabled:opacity-60 ${focusRing}`}
        style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.85) inset, 0 1px 2px rgba(40,34,28,0.12)" }}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
