"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ContactWithLastEmail } from "@/lib/types";
import { Avatar, fmtAgo } from "./ui";

type SortKey = "name" | "company" | "last_email";

export function PeopleTable({ people }: { people: ContactWithLastEmail[] }) {
  const [q, setQ] = useState("");
  const [company, setCompany] = useState("all");
  const [sort, setSort] = useState<SortKey>("last_email");
  const [dir, setDir] = useState<1 | -1>(1);

  const companies = useMemo(
    () => [...new Set(people.map((p) => p.company_name))].sort(),
    [people]
  );

  const rows = useMemo(() => {
    const needle = q.toLowerCase();
    const filtered = people.filter(
      (p) =>
        (company === "all" || p.company_name === company) &&
        (!needle ||
          p.name.toLowerCase().includes(needle) ||
          (p.email ?? "").toLowerCase().includes(needle) ||
          (p.title ?? "").toLowerCase().includes(needle) ||
          p.company_name.toLowerCase().includes(needle))
    );
    const cmp = (a: ContactWithLastEmail, b: ContactWithLastEmail) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "company") return a.company_name.localeCompare(b.company_name);
      return (b.last_email_at ?? "").localeCompare(a.last_email_at ?? "");
    };
    return filtered.sort((a, b) => cmp(a, b) * dir);
  }, [people, q, company, sort, dir]);

  const sortBy = (key: SortKey) => {
    if (sort === key) setDir((d) => (d === 1 ? -1 : 1));
    else { setSort(key); setDir(1); }
  };
  const arrow = (key: SortKey) => (sort === key ? (dir === 1 ? " ↓" : " ↑") : "");

  return (
    <>
      <div className="filter-row">
        <input
          type="search"
          placeholder="Filter by name, title, email, or company..."
          aria-label="Filter people"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={company} onChange={(e) => setCompany(e.target.value)} aria-label="Filter by company">
          <option value="all">All companies</option>
          {companies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span className="result-count">{rows.length} of {people.length}</span>
      </div>

      <div className="card anim-rise" style={{ padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th><button className="th-sort" onClick={() => sortBy("name")}>Name{arrow("name")}</button></th>
              <th>Title</th>
              <th><button className="th-sort" onClick={() => sortBy("company")}>Company{arrow("company")}</button></th>
              <th>Email</th>
              <th>Phone</th>
              <th><button className="th-sort" onClick={() => sortBy("last_email")}>Last Email{arrow("last_email")}</button></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/people/${p.id}`} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    <Avatar name={p.name} />
                    <b>{p.name}</b>
                  </Link>
                </td>
                <td>{p.title}</td>
                <td><Link href={`/companies/${p.company_id}`}>{p.company_name}</Link></td>
                <td><a href={`mailto:${p.email}`}>{p.email}</a></td>
                <td className="muted">{p.phone}</td>
                <td style={{ maxWidth: 300 }}>
                  {p.last_email_at ? (
                    <>
                      <b>{fmtAgo(p.last_email_at)}</b>
                      <div className="muted truncate" style={{ maxWidth: 280 }}>{p.last_email_subject}</div>
                    </>
                  ) : (
                    <span className="muted">Never</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div className="empty">No people match.</div>}
      </div>
    </>
  );
}
