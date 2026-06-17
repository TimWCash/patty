"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

const OPTIONS = ["all", "2025", "2026", "2027"] as const;

function readCookie(): string {
  if (typeof document === "undefined") return "all";
  const m = document.cookie.match(/(?:^|; )patty_year=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "all";
}

export function YearFilter() {
  const router = useRouter();
  const [value, setValue] = useState("all");
  const [, startTransition] = useTransition();

  useEffect(() => {
    setValue(readCookie());
  }, []);

  function select(v: string) {
    setValue(v);
    document.cookie = `patty_year=${v}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div className="year-filter" role="group" aria-label="Filter by year">
      {OPTIONS.map((o) => (
        <button
          key={o}
          className={`year-pill ${value === o ? "active" : ""}`}
          aria-pressed={value === o}
          onClick={() => select(o)}
        >
          {o === "all" ? "All" : o}
        </button>
      ))}
    </div>
  );
}
