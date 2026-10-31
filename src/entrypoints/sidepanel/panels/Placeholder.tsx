export function Placeholder({ title, sub = 'Coming soon.' }: { title: string; sub?: string }) {
  return (
    <div className="placeholder">
      <p className="placeholder-title">{title}</p>
      <p className="placeholder-sub">{sub}</p>
    </div>
  );
}
