import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { shop } from "@/lib/shop";
import { listIntakes, storageConfigured } from "@/lib/store";
import { logout } from "./actions";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";
export const metadata = { title: `Requests | ${shop.name}`, robots: { index: false } };

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return (
      <main className="mx-auto w-full max-w-sm px-4 pt-20">
        <h1 className="mb-1 text-2xl font-semibold">{shop.name}</h1>
        <p className="mb-6 text-sm text-muted">Sign in to see requests.</p>
        <LoginForm />
      </main>
    );
  }

  const items = await listIntakes();

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Requests</h1>
          <p className="text-sm text-muted">{items.length} total</p>
        </div>
        <form action={logout}>
          <button className="text-sm text-muted hover:text-white">Sign out</button>
        </form>
      </header>

      {!storageConfigured && (
        <p className="mb-4 rounded-xl bg-signal/10 p-3 text-xs text-signal">
          No database connected. Requests are saved to a local file, which won't persist on Vercel. Connect Upstash Redis in Vercel → Storage.
        </p>
      )}

      {items.length === 0 ? (
        <p className="rounded-2xl border border-line bg-panel p-6 text-center text-muted">No requests yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.id}>
              <Link
                href={`/admin/${i.id}`}
                className="block rounded-2xl border border-line bg-panel p-4 transition hover:border-signal/60"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {i.year} {i.make} {i.model}
                    </p>
                    <p className="truncate text-sm text-muted">
                      {i.name} · {i.location}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-muted">{timeAgo(i.receivedAt)}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-white/80">{i.description}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {i.drivable === "No, needs a tow" && <Tag tone="bad">Not drivable</Tag>}
                  {i.symptoms.map((s) => (
                    <Tag key={s}>{s}</Tag>
                  ))}
                  {i.notes && <Tag tone="ok">Has notes</Tag>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: "bad" | "ok" }) {
  const cls = tone === "bad" ? "border-bad/40 text-bad" : tone === "ok" ? "border-ok/40 text-ok" : "border-line text-muted";
  return <span className={`rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>{children}</span>;
}

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)}m ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
