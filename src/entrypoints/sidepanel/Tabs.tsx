export const TABS = ['Styles', 'Assets', 'Inspect', 'Design'] as const;
export type Tab = (typeof TABS)[number];

interface Props {
  active: Tab;
  onChange: (tab: Tab) => void;
  badges?: Partial<Record<Tab, number>>;
}

export function Tabs({ active, onChange, badges }: Props) {
  return (
    <div className="tabs" role="tablist">
      {TABS.map((tab) => (
        <button
          key={tab}
          role="tab"
          aria-selected={active === tab}
          className={`tab${active === tab ? ' is-active' : ''}`}
          onClick={() => onChange(tab)}
        >
          {tab}
          {badges?.[tab] !== undefined && <span className="tab-badge">{badges[tab]}</span>}
        </button>
      ))}
    </div>
  );
}
