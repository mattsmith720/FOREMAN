import { NextResponse } from "next/server";

const leadSchema = {
  name: (v: unknown) => typeof v === "string" && v.trim().length >= 1 && v.length <= 200,
  company: (v: unknown) => typeof v === "string" && v.trim().length >= 1 && v.length <= 200,
  crewSize: (v: unknown) => typeof v === "string" && v.trim().length >= 1 && v.length <= 100,
  email: (v: unknown) =>
    typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) && v.length <= 320,
  phone: (v: unknown) => v === undefined || v === "" || (typeof v === "string" && v.length <= 40),
};

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (
    !leadSchema.name(body.name) ||
    !leadSchema.company(body.company) ||
    !leadSchema.crewSize(body.crewSize) ||
    !leadSchema.email(body.email) ||
    !leadSchema.phone(body.phone)
  ) {
    return NextResponse.json({ error: "Invalid lead payload" }, { status: 400 });
  }

  const backend = process.env.BACKEND_URL?.trim();
  const apiKey = process.env.FOREMAN_API_KEY?.trim();

  if (!backend || !apiKey) {
    return NextResponse.json(
      { error: "Lead capture is not configured on this deployment yet." },
      { status: 503 },
    );
  }

  const payload = {
    name: String(body.name).trim(),
    company: String(body.company).trim(),
    crewSize: String(body.crewSize).trim(),
    email: String(body.email).trim(),
    phone: body.phone ? String(body.phone).trim() : null,
    source: "landing",
  };

  try {
    const res = await fetch(`${backend.replace(/\/$/, "")}/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-foreman-api-key": apiKey,
      },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let parsed: { error?: string } = {};
    try {
      parsed = JSON.parse(text) as { error?: string };
    } catch {
      parsed = {};
    }
    if (!res.ok) {
      return NextResponse.json(
        { error: parsed.error ?? "Failed to save lead" },
        { status: res.status },
      );
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not reach the API" }, { status: 502 });
  }
}
