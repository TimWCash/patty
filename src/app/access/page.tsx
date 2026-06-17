import { redirect } from "next/navigation";
import { listUsers } from "@/lib/queries";
import { getCurrentUser } from "@/lib/access";
import { addUser } from "@/lib/actions";
import { permsFor, ROLES, ROLE_LABEL, ROLE_DESCRIPTION } from "@/lib/roles";
import { PageTitle, Avatar, fmtDate } from "@/components/ui";
import { RoleSelect } from "@/components/RoleSelect";
import { SubmitButton } from "@/components/SubmitButton";

export const dynamic = "force-dynamic";

export default async function AccessPage() {
  const current = await getCurrentUser();
  if (!permsFor(current.role).canManageUsers) redirect("/");
  const users = listUsers();

  return (
    <>
      <PageTitle first="TEAM" accent="ACCESS" sub="Assign access levels. New people who sign in with Microsoft start as Observer until promoted." />

      <div className="grid two-col" style={{ alignItems: "start" }}>
        <div className="card" style={{ padding: 0 }}>
          <table className="tbl">
            <thead>
              <tr><th>Person</th><th>Email</th><th>Added</th><th>Role</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.email}>
                  <td>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={u.name ?? u.email} />
                      <b>{u.name ?? u.email.split("@")[0]}</b>
                    </span>
                  </td>
                  <td className="muted">{u.email}</td>
                  <td className="muted">{fmtDate(u.created_at)}</td>
                  <td>
                    <RoleSelect email={u.email} role={u.role} disabled={u.email.toLowerCase() === current.email.toLowerCase()} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <div className="empty">No users yet. People appear here after they first sign in, or add them on the right.</div>}
          {current.preview && (
            <div className="banner" style={{ margin: 16 }}>
              <b>Preview mode.</b> Real roles activate once Microsoft sign-in is enabled. Use the &quot;View as&quot; switcher in the top bar to preview each level now.
            </div>
          )}
        </div>

        <div>
          <div className="card">
            <div className="section-h" style={{ marginTop: 0 }}>Add a person</div>
            <p className="page-sub" style={{ marginBottom: 12 }}>Pre-assign a role by email before they sign in.</p>
            <form action={addUser}>
              <label className="kv"><b>Email</b>
                <input type="text" name="email" placeholder="name@servicephysics.com" required />
              </label>
              <label className="kv" style={{ display: "block", marginTop: 10 }}><b>Name</b>
                <input type="text" name="name" placeholder="Full name (optional)" />
              </label>
              <label className="kv" style={{ display: "block", marginTop: 10 }}><b>Role</b>
                <select name="role" defaultValue="member">
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </select>
              </label>
              <div style={{ marginTop: 12 }}><SubmitButton>Add person</SubmitButton></div>
            </form>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <div className="section-h" style={{ marginTop: 0 }}>What each level can do</div>
            {ROLES.map((r) => (
              <div key={r} className="due-item">
                <div>
                  <span className={`role-tag ${r}`}>{ROLE_LABEL[r]}</span>
                </div>
                <span className="tl-meta" style={{ flex: 1, textAlign: "right" }}>{ROLE_DESCRIPTION[r]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
