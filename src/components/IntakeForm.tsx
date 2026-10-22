"use client";

import { useState } from "react";
import {
  contactOptions,
  drivableOptions,
  shop,
  symptomOptions,
  whenOptions,
  type IntakeSubmission,
} from "@/lib/shop";

const steps = ["Vehicle", "Problem", "You", "Review"] as const;

const empty: IntakeSubmission = {
  vin: "",
  year: "",
  make: "",
  model: "",
  mileage: "",
  symptoms: [],
  when: [],
  drivable: "",
  description: "",
  name: "",
  phone: "",
  email: "",
  contactPref: "Text",
  location: "",
  availability: "",
};

const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/; // VINs never use I, O or Q

const years = Array.from({ length: new Date().getFullYear() + 2 - 1980 }, (_, i) =>
  String(new Date().getFullYear() + 1 - i),
);

type Errors = Partial<Record<keyof IntakeSubmission, string>>;

function validate(step: number, d: IntakeSubmission): Errors {
  const e: Errors = {};
  if (step === 0) {
    if (d.vin && !VIN_RE.test(d.vin)) e.vin = "VINs are 17 characters, no I, O or Q.";
    if (!d.year) e.year = "Pick a year.";
    if (!d.make.trim()) e.make = "Enter the make.";
    if (!d.model.trim()) e.model = "Enter the model.";
  }
  if (step === 1) {
    if (d.symptoms.length === 0) e.symptoms = "Pick at least one.";
    if (!d.drivable) e.drivable = "Let us know if it's drivable.";
    if (d.description.trim().length < 20) e.description = "A sentence or two helps the mechanic (20+ characters).";
  }
  if (step === 2) {
    if (!d.name.trim()) e.name = "Enter your name.";
    if (d.phone.replace(/\D/g, "").length < 10) e.phone = "Enter a 10-digit phone number.";
    if (d.location.trim().length < 3) e.location = "Let us know where the vehicle is.";
    if (d.contactPref === "Email" && !/^\S+@\S+\.\S+$/.test(d.email)) e.email = "Enter an email to be contacted by email.";
  }
  return e;
}

export default function IntakeForm() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<IntakeSubmission>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [decoding, setDecoding] = useState(false);
  const [decodeMsg, setDecodeMsg] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [honeypot, setHoneypot] = useState("");

  const set = <K extends keyof IntakeSubmission>(k: K, v: IntakeSubmission[K]) =>
    setData((d) => ({ ...d, [k]: v }));

  const toggle = (k: "symptoms" | "when", v: string) =>
    setData((d) => ({ ...d, [k]: d[k].includes(v) ? d[k].filter((x) => x !== v) : [...d[k], v] }));

  async function decodeVin() {
    if (!VIN_RE.test(data.vin)) {
      setErrors({ vin: "VINs are 17 characters, no I, O or Q." });
      return;
    }
    setDecoding(true);
    setDecodeMsg("");
    try {
      // Free NHTSA decoder, no key needed
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${data.vin}?format=json`);
      const r = (await res.json()).Results?.[0];
      if (r?.Make) {
        setData((d) => ({
          ...d,
          year: r.ModelYear || d.year,
          make: titleCase(r.Make),
          model: [r.Model, r.Trim].filter(Boolean).join(" "),
        }));
        setErrors({});
        setDecodeMsg(`Found: ${r.ModelYear} ${titleCase(r.Make)} ${r.Model}`);
      } else {
        setDecodeMsg("Couldn't match that VIN. Fill in the details below.");
      }
    } catch {
      setDecodeMsg("Lookup is unavailable right now. Fill in the details below.");
    } finally {
      setDecoding(false);
    }
  }

  function next() {
    const e = validate(step, data);
    setErrors(e);
    if (Object.keys(e).length === 0) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  async function submit() {
    setStatus("sending");
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, company: honeypot }),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-line bg-panel p-6 text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-ok/15 text-2xl text-ok">✓</div>
        <h2 className="text-xl font-semibold">Got it, {data.name.split(" ")[0]}.</h2>
        <p className="mt-2 text-muted">
          I'll look over your {data.year} {data.make} and reach out by {data.contactPref.toLowerCase()}.{" "}
          {shop.responseTime}.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-panel/80 p-5 shadow-2xl shadow-black/40 backdrop-blur sm:p-6">
      {/* Progress */}
      <ol className="mb-6 grid grid-cols-4 gap-2">
        {steps.map((label, i) => (
          <li key={label} className="flex flex-col gap-1.5">
            <span
              className={`h-1.5 rounded-full transition-colors ${
                i < step ? "bg-signal" : i === step ? "bg-signal/70" : "bg-line"
              }`}
            />
            <span className={`text-[11px] font-medium uppercase tracking-wider ${i <= step ? "text-white" : "text-muted"}`}>
              {label}
            </span>
          </li>
        ))}
      </ol>

      {/* Honeypot: hidden from people, bots fill it */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
      />

      {step === 0 && (
        <section className="space-y-4">
          <Field label="VIN" hint="Bottom of the windshield, driver's side, or door jamb. Optional." error={errors.vin}>
            <div className="flex gap-2">
              <input
                className={`${inputCls} font-mono uppercase tracking-widest`}
                value={data.vin}
                maxLength={17}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                placeholder="1HGCM82633A004352"
                onChange={(e) => set("vin", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
              />
              <button
                type="button"
                onClick={decodeVin}
                disabled={decoding || data.vin.length !== 17}
                className="shrink-0 rounded-xl border border-line px-4 text-sm font-medium transition hover:border-signal disabled:opacity-40"
              >
                {decoding ? "…" : "Look up"}
              </button>
            </div>
            <div className="mt-1.5 flex justify-between text-xs text-muted">
              <span className={decodeMsg.startsWith("Found") ? "text-ok" : ""}>{decodeMsg}</span>
              <span className="font-mono">{data.vin.length}/17</span>
            </div>
          </Field>

          <div className="grid grid-cols-[7rem_1fr] gap-3">
            <Field label="Year" error={errors.year}>
              <select className={inputCls} value={data.year} onChange={(e) => set("year", e.target.value)}>
                <option value="">—</option>
                {years.map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </Field>
            <Field label="Make" error={errors.make}>
              <input className={inputCls} value={data.make} placeholder="Toyota" onChange={(e) => set("make", e.target.value)} />
            </Field>
          </div>
          <Field label="Model" error={errors.model}>
            <input className={inputCls} value={data.model} placeholder="Camry SE" onChange={(e) => set("model", e.target.value)} />
          </Field>
          <Field label="Mileage" hint="Rough is fine. Optional.">
            <input
              className={inputCls}
              inputMode="numeric"
              value={data.mileage}
              placeholder="120,000"
              onChange={(e) => set("mileage", e.target.value.replace(/[^\d,]/g, ""))}
            />
          </Field>
        </section>
      )}

      {step === 1 && (
        <section className="space-y-5">
          <Field label="What's going on?" hint="Pick all that apply." error={errors.symptoms}>
            <Chips options={symptomOptions} selected={data.symptoms} onToggle={(v) => toggle("symptoms", v)} />
          </Field>
          <Field label="When does it happen?" hint="Optional.">
            <Chips options={whenOptions} selected={data.when} onToggle={(v) => toggle("when", v)} />
          </Field>
          <Field label="Is it safe to drive?" error={errors.drivable}>
            <Chips options={drivableOptions} selected={[data.drivable]} onToggle={(v) => set("drivable", v)} />
          </Field>
          <Field label="Describe it" hint="Sounds, smells, lights, when it started, anything you've tried." error={errors.description}>
            <textarea
              className={`${inputCls} min-h-36 resize-y py-3`}
              value={data.description}
              placeholder="Grinding noise from the front right when I brake, started last week. Gets worse when it rains."
              onChange={(e) => set("description", e.target.value)}
            />
          </Field>
        </section>
      )}

      {step === 2 && (
        <section className="space-y-4">
          <Field label="Your name" error={errors.name}>
            <input className={inputCls} autoComplete="name" value={data.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <input
              className={inputCls}
              type="tel"
              autoComplete="tel"
              inputMode="tel"
              value={data.phone}
              placeholder="(555) 123-4567"
              onChange={(e) => set("phone", e.target.value)}
            />
          </Field>
          <Field label="Email" hint={data.contactPref === "Email" ? undefined : "Optional."} error={errors.email}>
            <input
              className={inputCls}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={data.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field
            label="Where's the vehicle?"
            hint="Address, cross streets, or a meeting spot like a parking lot."
            error={errors.location}
          >
            <input
              className={inputCls}
              autoComplete="street-address"
              value={data.location}
              placeholder="123 Main St, or Walmart lot on 5th"
              onChange={(e) => set("location", e.target.value)}
            />
          </Field>
          <Field label="When works for you?" hint="Optional.">
            <input
              className={inputCls}
              value={data.availability}
              placeholder="Weekday evenings, Saturday morning"
              onChange={(e) => set("availability", e.target.value)}
            />
          </Field>
          <Field label="Best way to reach you">
            <Chips options={contactOptions} selected={[data.contactPref]} onToggle={(v) => set("contactPref", v)} />
          </Field>
        </section>
      )}

      {step === 3 && (
        <section className="space-y-4 text-sm">
          <Summary title="Vehicle" onEdit={() => setStep(0)}>
            <p className="text-base font-medium">
              {data.year} {data.make} {data.model}
            </p>
            {data.vin && <p className="font-mono text-muted">{data.vin}</p>}
            {data.mileage && <p className="text-muted">{data.mileage} miles</p>}
          </Summary>
          <Summary title="Problem" onEdit={() => setStep(1)}>
            <p>{data.symptoms.join(", ")}</p>
            {data.when.length > 0 && <p className="text-muted">When: {data.when.join(", ")}</p>}
            <p className="text-muted">Drivable: {data.drivable}</p>
            <p className="mt-2 whitespace-pre-wrap">{data.description}</p>
          </Summary>
          <Summary title="You" onEdit={() => setStep(2)}>
            <p>{data.name}</p>
            <p className="text-muted">
              {data.phone}
              {data.email && ` · ${data.email}`} · prefers {data.contactPref.toLowerCase()}
            </p>
            <p className="mt-2">{data.location}</p>
            {data.availability && <p className="text-muted">Available: {data.availability}</p>}
          </Summary>
          {status === "error" && (
            <p className="rounded-xl bg-bad/10 p-3 text-bad">
              Something went wrong sending this. Try again, or call {shop.phone}.
            </p>
          )}
        </section>
      )}

      {/* Nav */}
      <div className="mt-6 flex gap-3">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="h-12 rounded-xl border border-line px-5 font-medium text-muted transition hover:text-white"
          >
            Back
          </button>
        )}
        <button
          type="button"
          onClick={step === 3 ? submit : next}
          disabled={status === "sending"}
          className="h-12 flex-1 rounded-xl bg-signal font-semibold text-signal-ink shadow-[0_8px_30px_-8px_var(--color-signal)] transition active:scale-[0.98] disabled:opacity-60"
        >
          {step === 3 ? (status === "sending" ? "Sending…" : "Send request") : "Continue"}
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "h-12 w-full rounded-xl border border-line bg-ink/60 px-3.5 text-white placeholder:text-muted/50 outline-none transition focus:border-signal focus:ring-2 focus:ring-signal/25";

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {hint && <span className="-mt-1 mb-2 block text-xs text-muted">{hint}</span>}
      {children}
      {error && <span className="mt-1.5 block text-xs text-bad">{error}</span>}
    </label>
  );
}

function Chips({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(o)}
            className={`min-h-10 rounded-full border px-3.5 text-sm transition ${
              on ? "border-signal bg-signal/15 text-signal" : "border-line text-white/80 hover:border-white/30"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Summary({ title, onEdit, children }: { title: string; onEdit: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted">{title}</span>
        <button type="button" onClick={onEdit} className="text-xs text-signal">
          Edit
        </button>
      </div>
      {children}
    </div>
  );
}

function titleCase(s: string) {
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}
