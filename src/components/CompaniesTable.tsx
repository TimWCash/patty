"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { CompanyWithLastEmail } from "@/lib/types";
import { Badge, fmtAgo } from "./ui";

const STATUSES = ["all", "active", "prospect", "past"] as const;
const PAGE_SIZE = 25;

export function CompaniesTable({ companies }: { companies: CompanyWithLastEmail[] }) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const needle = q.toLowerCase();
    return companies.filter(
      (c) =>
        (status === "all" || c.status === status) &&
        (!needle || c.name.toLowerCase().includes(needle) || (c.industry ?? "").toLowerCase().includes(needle))
    );
  }, [companies, q, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const rows = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  function setFilter(fn: () => void) {
    fn();
    setPage(0);
  }

  return (
    <>
      <div className="filter-row">
        <input
          type="search"
          placeholder="Filter companies..."
          aria-label="Filter companies"
          value={q}
          onChange={(e) => setFilter(() => setQ(e.target.value))}
        />
        <div className="chip-row" role="tablist" aria-label="Status filter">
          {STATUSES.map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={status === s}
              className={`chip ${status === s ? "active" : ""}`}
              onClick={() => setFilter(() => setStatus(s))}
            >
              {s === "all" ? "All" : s[0].toUpperCase() + s.slice(1)}
              <span className="chip-count">
                {s === "all" ? companies.length : companies.filter((c) => c.status === s).length}
              </span>
            </button>
          ))}
        </div>
        <span className="result-count">{filtered.length} {filtered.length === 1 ? "company" : "companies"}</span>
      </div>

      <div className="card anim-rise" style={{ padding: 0 }}>
        <table className="tbl">
          <thead>
            <tr>
              <th>Company</th>
              <th>Industry</th>
              <th>Status</th>
              <th>Contacts</th>
              <th>Last Email</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link href={`/companies/${c.id}`}><b>{c.name}</b></Link>
                  <div className="muted">{c.website}</div>
                </td>
                <td>{c.industry}</td>
                <td><Badge value={c.status} /></td>
                <td>{c.contact_count}</td>
                <td style={{ maxWidth: 420 }}>
                  {c.last_email_at ? (
                    <>
                      <b>{fmtAgo(c.last_email_at)}</b> · {c.last_email_subject}
                      <div className="muted truncate" style={{ maxWidth: 400 }}>{c.last_email_snippet}</div>
                    </>
                  ) : (
                    <span className="muted">No emails yet</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <div className="empty">No companies match.</div>}
      </div>

      {pageCount > 1 && (
        <div className="pager">
          <button className="btn ghost" disabled={current === 0} onClick={() => setPage(current - 1)}>&larr; Prev</button>
          <span className="tl-meta">Page {current + 1} of {pageCount}</span>
          <button className="btn ghost" disabled={current >= pageCount - 1} onClick={() => setPage(current + 1)}>Next &rarr;</button>
        </div>
      )}
    </>
  );
}
