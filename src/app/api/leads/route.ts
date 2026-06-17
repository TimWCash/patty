import { NextResponse } from "next/server";
import { createLeadFromForm } from "@/lib/leads";

export const dynamic = "force-dynamic";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  let data: Record<string, string> = {};
  const type = request.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      data = await request.json();
    } else {
      const form = await request.formData();
      form.forEach((v, k) => (data[k] = String(v)));
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Could not parse request body." }, { status: 400, headers: CORS });
  }

  // Honeypot: bots fill hidden fields. Accept silently without creating a lead.
  if (data.website || data._gotcha) {
    return NextResponse.json({ ok: true }, { headers: CORS });
  }

  const name = (data.name || data.fullname || "").trim();
  const email = (data.email || "").trim();
  if (!name && !email) {
    return NextResponse.json({ ok: false, error: "A name or email is required." }, { status: 400, headers: CORS });
  }

  try {
    const result = await createLeadFromForm({
      name: name || email,
      email,
      company: data.company || data.organization,
      phone: data.phone,
      message: data.message || data.comments || data.notes,
      source: data.source || "website",
    });
    return NextResponse.json({ ok: true, ...result }, { status: 201, headers: CORS });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not create the lead." }, { status: 500, headers: CORS });
  }
}
