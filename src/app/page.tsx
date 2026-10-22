import IntakeForm from "@/components/IntakeForm";
import { shop } from "@/lib/shop";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-col px-4 pb-16 pt-8 sm:pt-14">
      <header className="mb-6">
        <div className="mb-4 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-muted">
          <span className="inline-block h-2 w-2 rounded-full bg-signal shadow-[0_0_12px_var(--color-signal)]" />
          {shop.name}
        </div>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
          What&apos;s your car doing?
        </h1>
        <p className="mt-2 text-muted">{shop.tagline}</p>
      </header>

      <IntakeForm />

      <footer className="mt-10 text-center text-xs text-muted">
        Prefer to talk?{" "}
        <a className="text-signal underline-offset-4 hover:underline" href={`tel:${shop.phone.replace(/\D/g, "")}`}>
          {shop.phone}
        </a>
      </footer>
    </main>
  );
}
