import { cookies } from "next/headers";

export const YEARS = [2025, 2026, 2027] as const;
export type SelectedYear = number | "all";

const COOKIE = "patty_year";

export async function getSelectedYear(): Promise<SelectedYear> {
  const store = await cookies();
  const raw = store.get(COOKIE)?.value;
  if (!raw || raw === "all") return "all";
  const n = Number(raw);
  return (YEARS as readonly number[]).includes(n) ? n : "all";
}

/** Returns the numeric year to filter by, or undefined for "all". */
export function yearFilter(y: SelectedYear): number | undefined {
  return y === "all" ? undefined : y;
}
