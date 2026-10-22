"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginForm() {
  const [error, action, pending] = useActionState(login, null);
  return (
    <form action={action} className="space-y-3">
      <input
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Password"
        required
        className="h-12 w-full rounded-xl border border-line bg-ink/60 px-3.5 text-white outline-none focus:border-signal focus:ring-2 focus:ring-signal/25"
      />
      {error && <p className="text-xs text-bad">{error}</p>}
      <button disabled={pending} className="h-12 w-full rounded-xl bg-signal font-semibold text-signal-ink disabled:opacity-60">
        {pending ? "Checking…" : "Sign in"}
      </button>
    </form>
  );
}
