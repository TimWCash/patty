"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { TaskRow } from "@/lib/types";
import { TASK_STATUSES } from "@/lib/types";
import { moveTask, addTaskComment } from "@/lib/actions";
import { Badge, fmtDate } from "./ui";
import { IconArrowRight, IconNote } from "./icons";

export function TaskItem({ task, canMove = true, canNote = true }: { task: TaskRow; canMove?: boolean; canNote?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [commenting, setCommenting] = useState(false);
  const [comment, setComment] = useState("");
  const [commentPending, startComment] = useTransition();

  const idx = TASK_STATUSES.findIndex((s) => s.key === task.status);
  const next = TASK_STATUSES[idx + 1];

  return (
    <>
      <tr className={pending ? "task-row-pending" : ""}>
        <td style={{ width: "36%" }}>
          <b>{task.title}</b>
          {task.clickup_task_id && (
            <> <span className="badge clickup">ClickUp {task.clickup_task_id}</span></>
          )}
        </td>
        <td>
          {task.company_id ? (
            <Link href={`/companies/${task.company_id}`}>{task.company_name}</Link>
          ) : (
            <span className="muted">Internal</span>
          )}
          {task.engagement_name && <div className="muted">{task.engagement_name}</div>}
        </td>
        <td>
          {canMove ? (
            <select
              className="task-status-select"
              value={task.status}
              disabled={pending}
              aria-label={`Status for ${task.title}`}
              onChange={(e) =>
                startTransition(() => {
                  moveTask(task.id, e.target.value as TaskRow["status"]);
                })
              }
            >
              {TASK_STATUSES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          ) : (
            <span className={`badge ${task.status}`}>{TASK_STATUSES.find((s) => s.key === task.status)?.label}</span>
          )}
        </td>
        <td className="muted">Due {fmtDate(task.due_date)}</td>
        <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
          {canMove && next && (
            <button
              className="btn ghost"
              disabled={pending}
              title={`Move to ${next.label}`}
              onClick={() => startTransition(() => moveTask(task.id, next.key))}
            >
              {next.label} <IconArrowRight width={12} height={12} />
            </button>
          )}
          {canNote && (
            <button
              className="btn ghost"
              style={{ marginLeft: 6 }}
              aria-expanded={commenting}
              onClick={() => setCommenting((c) => !c)}
              title="Add note (posts to ClickUp)"
            >
              <IconNote width={12} height={12} />
            </button>
          )}
        </td>
      </tr>
      {commenting && (
        <tr className="task-comment-row">
          <td colSpan={5}>
            <form
              className="task-comment-form"
              action={(fd) =>
                startComment(async () => {
                  await addTaskComment(task.id, fd);
                  setComment("");
                  setCommenting(false);
                })
              }
            >
              <input
                name="body"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={task.clickup_task_id ? "Add a note — posts to ClickUp as a comment" : "Add a note"}
                aria-label="Task note"
                autoFocus
              />
              <button className="btn orange" type="submit" disabled={commentPending || !comment.trim()}>
                {commentPending ? <span className="spinner" /> : "Post"}
              </button>
            </form>
          </td>
        </tr>
      )}
    </>
  );
}

export function StatusLozenge({ status }: { status: TaskRow["status"] }) {
  return <Badge value={status} />;
}
