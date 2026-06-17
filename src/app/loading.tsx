export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="skel skel-title" />
      <div className="skel skel-sub" />
      <div className="grid kpis">
        {[0, 1, 2, 3].map((i) => (
          <div className="card" key={i}>
            <div className="skel skel-label" />
            <div className="skel skel-value" />
          </div>
        ))}
      </div>
      <div className="card">
        {[0, 1, 2, 3, 4].map((i) => (
          <div className="skel skel-row" key={i} />
        ))}
      </div>
    </div>
  );
}
