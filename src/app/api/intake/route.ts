import { NextResponse } from "next/server";
import type { IntakeSubmission } from "@/lib/shop";
import { saveIntake } from "@/lib/store";

const str = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const list = (v: unknown) => (Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, 20) : []);

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Honeypot filled in: pretend success so bots don't retry
  if (body.company) return NextResponse.json({ ok: true });

  const data: IntakeSubmission = {
    vin: str(body.vin, 17),
    year: str(body.year, 4),
    make: str(body.make, 60),
    model: str(body.model, 120),
    mileage: str(body.mileage, 12),
    symptoms: list(body.symptoms),
    when: list(body.when),
    drivable: str(body.drivable, 30),
    description: str(body.description),
    name: str(body.name, 100),
    phone: str(body.phone, 30),
    email: str(body.email, 200),
    contactPref: str(body.contactPref, 10),
    location: str(body.location, 300),
    availability: str(body.availability, 200),
  };

  if (!data.make || !data.model || !data.year || !data.description || !data.name || !data.phone || !data.location) {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
  }

  try {
    const saved = await saveIntake(data);

    // Optional forward (alerts later via Make/Zapier); a failure here doesn't lose the saved request
    const webhook = process.env.INTAKE_WEBHOOK_URL;
    if (webhook) {
      await fetch(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(saved),
      }).catch((err) => console.error("[intake] webhook failed", err));
    }
  } catch (err) {
    console.error("[intake] save failed", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
