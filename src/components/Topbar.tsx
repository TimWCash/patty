"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconBuilding, IconKanban, IconUsers } from "./icons";
import { YearFilter } from "./YearFilter";

type Result = { type: string; label: string; sub: string; href: string };

const TYPE_ICON: Record<string, React.ReactNode> = {
  company: <IconBuilding width={14} height={14} />,
  person: <IconUsers width={14} height={14} />,
  engagement: <IconKanban width={14} height={14} />,
};

export function Topbar({ user, role, preview }: { user: { name: string; email: string }; role: string; preview: boolean }) {
  const initials = user.name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
  const router = useRouter();

  function viewAs(r: string) {
    document.cookie = `patty_viewas=${r}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data.results);
      setActive(0);
      setOpen(true);
    }, 140);
    return () => clearTimeout(t);
  }, [q]);

  const go = useCallback(
    (r: Result) => {
      setOpen(false);
      setQ("");
      router.push(r.href);
    },
    [router]
  );

  const onInputKey = (e: React.KeyboardEvent) => {
    if (!open || !results.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); go(results[active]); }
  };

  return (
    <div className="topbar">
      <div className="search-box" ref={boxRef}>
        <svg className="search-icon" viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="search"
          placeholder="Search companies, people, engagements..."
          aria-label="Global search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => results.length && setOpen(true)}
          onKeyDown={onInputKey}
        />
        <kbd>⌘K</kbd>
        {open && (
          <div className="palette" role="listbox">
            {results.length === 0 && <div className="palette-empty">No matches</div>}
            {results.map((r, i) => (
              <button
                key={r.href + r.label}
                role="option"
                aria-selected={i === active}
                className={`palette-item ${i === active ? "active" : ""}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
              >
                <span className="palette-icon">{TYPE_ICON[r.type]}</span>
                <span className="palette-label">{r.label}</span>
                <span className="palette-sub">{r.sub}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="topbar-right">
        {preview && (
          <label className="viewas" title="Preview the app as a different role">
            <span className="viewas-label">View as</span>
            <select value={role} onChange={(e) => viewAs(e.target.value)} aria-label="View as role">
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="contributor">Contributor</option>
              <option value="observer">Observer</option>
            </select>
          </label>
        )}
        <YearFilter />
        <span className="live-dot" aria-hidden="true" />
        <span className="topbar-status">Sample data · integrations stubbed</span>
        <span className="avatar teal topbar-avatar" title={user.name}>{initials}</span>
      </div>
    </div>
  );
}
