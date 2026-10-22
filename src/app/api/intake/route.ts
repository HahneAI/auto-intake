import { NextResponse } from "next/server";
import type { IntakeSubmission } from "@/lib/shop";

export async function POST(req: Request) {
  let body: IntakeSubmission & { company?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Honeypot filled in: pretend success so bots don't retry
  if (body.company) return NextResponse.json({ ok: true });

  if (!body.make || !body.model || !body.year || !body.description || !body.name || !body.phone) {
    return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
  }

  const submission = { ...body, company: undefined, receivedAt: new Date().toISOString() };
  console.log("[intake]", JSON.stringify(submission));

  const webhook = process.env.INTAKE_WEBHOOK_URL;
  if (webhook) {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission),
    });
    if (!res.ok) {
      console.error("[intake] webhook failed", res.status);
      return NextResponse.json({ ok: false }, { status: 502 });
    }
  }

  return NextResponse.json({ ok: true });
}
