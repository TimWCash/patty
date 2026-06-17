/* Dependency-free SVG charts, server-rendered. */
import { money } from "./ui";

export function StageBars({ data }: { data: { label: string; value: number; accent?: boolean }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="stage-bars" role="img" aria-label="Pipeline value by stage">
      {data.map((d) => (
        <div className="stage-bar-row" key={d.label}>
          <span className="stage-bar-label">{d.label}</span>
          <span className="stage-bar-track">
            <span
              className={`stage-bar-fill ${d.accent ? "accent" : ""}`}
              style={{ width: `${Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0)}%` }}
            />
          </span>
          <span className="stage-bar-value">{money(d.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function ActivitySpark({ data, height = 56 }: { data: { day: string; count: number }[]; height?: number }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const w = 100 / data.length;
  return (
    <div className="spark-wrap" role="img" aria-label={`Email volume, last ${data.length} days`}>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: "100%", height }}>
        {data.map((d, i) => {
          const h = Math.max((d.count / max) * (height - 8), d.count > 0 ? 3 : 1.5);
          return (
            <rect
              key={d.day}
              x={i * w + w * 0.18}
              y={height - h}
              width={w * 0.64}
              height={h}
              rx={1.2}
              fill={i === data.length - 1 ? "var(--orange)" : "var(--light-teal)"}
              opacity={d.count > 0 ? 0.9 : 0.35}
            >
              <title>{`${d.day}: ${d.count} emails`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="spark-axis">
        <span>{data[0]?.day}</span>
        <span>today</span>
      </div>
    </div>
  );
}
