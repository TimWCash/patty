import Link from "next/link";
import { listEngagements } from "@/lib/queries";
import { getSelectedYear, yearFilter } from "@/lib/year";
import { getPerms } from "@/lib/access";
import { changeStage } from "@/lib/actions";
import { PageTitle, money, fmtDate } from "@/components/ui";
import { STAGES } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const selected = await getSelectedYear();
  const engagements = listEngagements(undefined, yearFilter(selected));
  const canMove = (await getPerms()).canPipeline;

  return (
    <>
      <PageTitle first="ENGAGEMENT" accent="PIPELINE" sub={selected === "all" ? "Every engagement by stage. Use the arrows to move work forward or back." : `Engagements active or closing in ${selected}.`} />

      <div className="board">
        {STAGES.map((stage, idx) => {
          const rows = engagements.filter((e) => e.stage === stage.key);
          const total = rows.reduce((a, b) => a + b.value, 0);
          const prev = STAGES[idx - 1]?.key;
          const next = STAGES[idx + 1]?.key;
          return (
            <div key={stage.key}>
              <div className="col-head">
                <span>{stage.label} ({rows.length})</span>
                <span className="sum">{money(total)}</span>
              </div>
              {rows.map((e) => (
                <div className="card eng-card" key={e.id}>
                  <div className="eng-name">{e.name}</div>
                  <div className="eng-co">
                    <Link href={`/companies/${e.company_id}`}>{e.company_name}</Link>
                  </div>
                  <div className="eng-meta">
                    <span className="eng-val">{money(e.value)}</span>
                    <span>{e.owner}</span>
                  </div>
                  {e.start_date && <div className="tl-meta" style={{ marginBottom: 8 }}>Started {fmtDate(e.start_date)}</div>}
                  {canMove && (
                    <div className="stage-btns">
                      {prev && (
                        <form action={changeStage.bind(null, e.id, prev)}>
                          <button className="btn ghost" type="submit" title={`Move to ${prev.replace("_", " ")}`}>&larr;</button>
                        </form>
                      )}
                      {next && (
                        <form action={changeStage.bind(null, e.id, next)}>
                          <button className="btn ghost" type="submit" title={`Move to ${next.replace("_", " ")}`}>&rarr;</button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {!rows.length && <div className="empty">Empty</div>}
            </div>
          );
        })}
      </div>
    </>
  );
}
