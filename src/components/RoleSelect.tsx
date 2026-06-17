"use client";

import { useTransition } from "react";
import { setUserRole } from "@/lib/actions";
import { ROLES, ROLE_LABEL } from "@/lib/roles";

export function RoleSelect({ email, role, disabled }: { email: string; role: string; disabled?: boolean }) {
  const [pending, start] = useTransition();
  return (
    <select
      className="task-status-select"
      defaultValue={role}
      disabled={disabled || pending}
      aria-label={`Role for ${email}`}
      onChange={(e) => start(() => setUserRole(email, e.target.value))}
    >
      {ROLES.map((r) => (
        <option key={r} value={r}>{ROLE_LABEL[r]}</option>
      ))}
    </select>
  );
}
