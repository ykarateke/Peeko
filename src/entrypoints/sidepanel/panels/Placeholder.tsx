export function Placeholder({ title }: { title: string }) {
  return (
    <div className="placeholder">
      <p className="placeholder-title">{title}</p>
      <p className="placeholder-sub">Coming soon.</p>
    </div>
  );
}
