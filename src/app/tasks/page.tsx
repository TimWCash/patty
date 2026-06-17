import Link from "next/link";
import { listTasks, clickupLastResult } from "@/lib/queries";
import { getSelectedYear, yearFilter } from "@/lib/year";
import { getPerms } from "@/lib/access";
import { clickupStatus } from "@/lib/integrations/clickup";
import { syncClickUp } from "@/lib/actions";
import { PageTitle, fmtAgo } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { TaskItem } from "@/components/TaskItem";
import { TASK_STATUSES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const selected = await getSelectedYear();
  const tasks = listTasks(undefined, yearFilter(selected));
  const perms = await getPerms();
  const cu = clickupStatus();
  const lastSync = tasks.find((t) => t.synced_at)?.synced_at;
  const result = clickupLastResult();

  return (
    <>
      <PageTitle first="DELIVERY" accent="TASKS" sub={selected === "all" ? "Move a task or add a note here and it pushes straight to your ClickUp board." : `Tasks due in ${selected}. Move or note one and it pushes to ClickUp.`} />

      <div className="banner">
        {cu.configured ? (
          <>
            <b>ClickUp connected.</b> Status changes and notes sync to your board automatically.
          </>
        ) : (
          <>
            <b>ClickUp not connected.</b> Changes stay in Patty until you add an API token in{" "}
            <Link href="/settings" style={{ fontWeight: 700, color: "var(--orange)" }}>Settings</Link>.
          </>
        )}
        {result && (
          <span className={`sync-result ${result.ok ? "ok" : "err"}`}>
            {result.detail} · {fmtAgo(result.at)}
          </span>
        )}
        {!result && lastSync && <span className="tl-meta">Last sync: {fmtAgo(lastSync)}</span>}
        {perms.canSync && (
          <form action={syncClickUp} style={{ marginLeft: "auto" }}>
            <SubmitButton pendingText="Syncing...">Sync all to ClickUp</SubmitButton>
          </form>
        )}
      </div>

      {tasks.length === 0 && <div className="card"><div className="empty">No tasks in {selected}.</div></div>}

      {TASK_STATUSES.map((s) => {
        const rows = tasks.filter((t) => t.status === s.key);
        if (!rows.length) return null;
        return (
          <div key={s.key}>
            <div className="section-h">{s.label} ({rows.length})</div>
            <div className="card anim-rise" style={{ padding: 0 }}>
              <table className="tbl">
                <tbody>
                  {rows.map((t) => (
                    <TaskItem key={t.id} task={t} canMove={perms.canTasks} canNote={perms.canNotes} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </>
  );
}
