import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { getIntake } from "@/lib/store";
import { saveNotes } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function IntakeDetail({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) redirect("/admin");
  const { id } = await params;
  const i = await getIntake(id);
  if (!i) notFound();

  const digits = i.phone.replace(/\D/g, "");
  const maps = `https://maps.google.com/?q=${encodeURIComponent(i.location)}`;

  return (
    <main className="mx-auto w-full max-w-xl space-y-4 px-4 pb-16 pt-6">
      <Link href="/admin" className="text-sm text-muted hover:text-white">
        ← All requests
      </Link>

      <header>
        <h1 className="text-2xl font-semibold">
          {i.year} {i.make} {i.model}
        </h1>
        <p className="text-sm text-muted">
          {new Date(i.receivedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </header>

      {/* Big thumb-friendly actions, he's working from his phone */}
      <div className="grid grid-cols-3 gap-2">
        <Action href={`tel:${digits}`}>Call</Action>
        <Action href={`sms:${digits}`}>Text</Action>
        <Action href={maps}>Directions</Action>
      </div>

      <Card title="Customer">
        <p className="font-medium">{i.name}</p>
        <p className="text-muted">
          {i.phone}
          {i.email && ` · ${i.email}`}
        </p>
        <p className="text-muted">Prefers {i.contactPref.toLowerCase()}</p>
      </Card>

      <Card title="Location">
        <p>{i.location}</p>
        {i.availability && <p className="text-muted">Available: {i.availability}</p>}
      </Card>

      <Card title="Problem">
        <p>{i.symptoms.join(", ")}</p>
        {i.when.length > 0 && <p className="text-muted">When: {i.when.join(", ")}</p>}
        <p className={i.drivable === "No, needs a tow" ? "text-bad" : "text-muted"}>Drivable: {i.drivable}</p>
        <p className="mt-2 whitespace-pre-wrap">{i.description}</p>
      </Card>

      <Card title="Vehicle">
        <p>
          {i.year} {i.make} {i.model}
        </p>
        {i.vin && <p className="font-mono text-muted">{i.vin}</p>}
        {i.mileage && <p className="text-muted">{i.mileage} miles</p>}
      </Card>

      <Card title="Your notes">
        <form action={saveNotes.bind(null, i.id)} className="space-y-2">
          <textarea
            name="notes"
            defaultValue={i.notes}
            placeholder="Quote, parts needed, what you found…"
            className="min-h-32 w-full rounded-xl border border-line bg-ink/60 p-3 text-white outline-none focus:border-signal focus:ring-2 focus:ring-signal/25"
          />
          <button className="h-11 w-full rounded-xl bg-signal font-semibold text-signal-ink">Save notes</button>
        </form>
      </Card>
    </main>
  );
}

function Action({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="grid h-12 place-items-center rounded-xl border border-line bg-panel text-sm font-medium transition hover:border-signal"
    >
      {children}
    </a>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-panel p-4 text-sm">
      <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted">{title}</h2>
      {children}
    </section>
  );
}
