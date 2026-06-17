"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PattyMark } from "./Logo";
import type { Perms } from "@/lib/roles";
import { ROLE_LABEL } from "@/lib/roles";
import {
  IconBuilding, IconDashboard, IconFolder, IconHome, IconInbox, IconKanban, IconMail, IconSettings, IconShield, IconTasks, IconUsers, IconVideo,
} from "./icons";

const NAV = [
  { href: "/", label: "Home", Icon: IconHome },
  { href: "/dashboard", label: "Dashboard", Icon: IconDashboard },
  { href: "/leads", label: "Leads", Icon: IconInbox },
  { href: "/companies", label: "Companies", Icon: IconBuilding },
  { href: "/people", label: "People", Icon: IconUsers },
  { href: "/pipeline", label: "Pipeline", Icon: IconKanban },
  { href: "/meetings", label: "Meetings", Icon: IconVideo },
  { href: "/emails", label: "Emails", Icon: IconMail },
  { href: "/documents", label: "Documents", Icon: IconFolder },
  { href: "/tasks", label: "Tasks", Icon: IconTasks },
];

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

export function Sidebar({ user, authed, leadCount = 0, perms }: { user: { name: string; email: string }; authed: boolean; leadCount?: number; perms: Perms }) {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <div className="brand">
        <PattyMark size={30} />
        <div>
          <div className="brand-name">Patty</div>
          <div className="brand-sub">by Service Physics</div>
        </div>
      </div>
      <div className="nav-label">Workspace</div>
      <nav>
        {NAV.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href} className={active ? "active" : ""}>
              <Icon className="nav-icon" />
              {label}
              {href === "/leads" && leadCount > 0 && <span className="nav-badge">{leadCount}</span>}
            </Link>
          );
        })}
      </nav>
      {(perms.canManageUsers || perms.canSettings) && (
        <>
          <div className="nav-label" style={{ marginTop: 18 }}>Admin</div>
          <nav>
            {perms.canManageUsers && (
              <Link href="/access" className={pathname.startsWith("/access") ? "active" : ""}>
                <IconShield className="nav-icon" />
                Access
              </Link>
            )}
            {perms.canSettings && (
              <Link href="/settings" className={pathname.startsWith("/settings") ? "active" : ""}>
                <IconSettings className="nav-icon" />
                Settings
              </Link>
            )}
          </nav>
        </>
      )}
      <div className="user-chip">
        <span className="avatar orange">{initials(user.name)}</span>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="user-name">{user.name}</div>
          <div className="user-role"><span className={`role-tag ${perms.role}`}>{ROLE_LABEL[perms.role]}</span></div>
        </div>
        {authed && (
          <a href="/api/auth/logout" className="signout-btn" title="Sign out" aria-label="Sign out">
            <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
          </a>
        )}
      </div>
    </aside>
  );
}
