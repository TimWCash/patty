import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });
  const db = getDb();
  const like = `%${q}%`;
  const companies = db
    .prepare("SELECT id, name, industry FROM companies WHERE name LIKE ? LIMIT 5")
    .all(like) as { id: number; name: string; industry: string }[];
  const people = db
    .prepare(
      `SELECT ct.id, ct.name, ct.title, co.name AS company FROM contacts ct
       JOIN companies co ON co.id = ct.company_id
       WHERE ct.name LIKE ? OR ct.email LIKE ? LIMIT 5`
    )
    .all(like, like) as { id: number; name: string; title: string; company: string }[];
  const engagements = db
    .prepare(
      `SELECT e.id, e.name, e.company_id, co.name AS company FROM engagements e
       JOIN companies co ON co.id = e.company_id WHERE e.name LIKE ? LIMIT 4`
    )
    .all(like) as { id: number; name: string; company_id: number; company: string }[];

  return NextResponse.json({
    results: [
      ...companies.map((c) => ({ type: "company", label: c.name, sub: c.industry, href: `/companies/${c.id}` })),
      ...people.map((p) => ({ type: "person", label: p.name, sub: `${p.title} · ${p.company}`, href: `/people/${p.id}` })),
      ...engagements.map((e) => ({ type: "engagement", label: e.name, sub: e.company, href: `/companies/${e.company_id}?tab=engagements` })),
    ],
  });
}
