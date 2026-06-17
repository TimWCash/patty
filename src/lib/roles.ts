export const ROLES = ["admin", "member", "contributor", "observer"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABEL: Record<Role, string> = {
  admin: "Admin",
  member: "Member",
  contributor: "Contributor",
  observer: "Observer",
};

export const ROLE_DESCRIPTION: Record<Role, string> = {
  admin: "Full access, integrations/Settings, and user management.",
  member: "Day-to-day editing: notes, tasks, pipeline, leads.",
  contributor: "Log notes and review leads only.",
  observer: "Read-only across the whole hub.",
};

export interface Perms {
  role: Role;
  canNotes: boolean;     // add notes / task comments
  canLeads: boolean;     // mark leads reviewed
  canTasks: boolean;     // move/sync tasks
  canPipeline: boolean;  // change engagement stage
  canSync: boolean;      // push ClickUp sync
  canSettings: boolean;  // view + edit Settings
  canManageUsers: boolean;
  canEdit: boolean;      // any editing at all (false for observer)
}

export function permsFor(role: Role): Perms {
  const admin = role === "admin";
  const member = role === "member";
  const contributor = role === "contributor";
  return {
    role,
    canNotes: admin || member || contributor,
    canLeads: admin || member || contributor,
    canTasks: admin || member,
    canPipeline: admin || member,
    canSync: admin || member,
    canSettings: admin,
    canManageUsers: admin,
    canEdit: admin || member || contributor,
  };
}

export function isRole(v: string | undefined | null): v is Role {
  return !!v && (ROLES as readonly string[]).includes(v);
}
