export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Loading">
      <div className="skel skel-title" />
      <div className="skel skel-sub" />
      <div className="card">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <div className="skel skel-row" key={i} />
        ))}
      </div>
    </div>
  );
}
