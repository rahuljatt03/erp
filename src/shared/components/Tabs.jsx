import { useState } from 'react';

/**
 * Simple, reusable tab switcher.
 *
 * @param {object} props
 * @param {Array<{ key: string, label: React.ReactNode, badge?: React.ReactNode, content: React.ReactNode }>} props.tabs
 * @param {string} [props.initialKey]
 * @param {React.ReactNode} [props.leading] Rendered at the start of the tab bar,
 *   before the tabs (e.g. a drag-handle grip when the bar doubles as a header).
 */
export default function Tabs({ tabs, initialKey, leading }) {
  const [active, setActive] = useState(initialKey ?? tabs[0]?.key);
  const current = tabs.find((tab) => tab.key === active) ?? tabs[0];

  return (
    <div>
      <div className="mb-[18px] flex gap-0.5 border-b border-slate-200" role="tablist">
        {leading != null ? (
          <span className="inline-flex items-center pr-1.5">{leading}</span>
        ) : null}
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`-mb-px inline-flex cursor-pointer items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition-[color,border-color] ${
                isActive
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
              onClick={() => setActive(tab.key)}
            >
              {tab.label}
              {tab.badge != null ? (
                <span
                  className={`rounded-full px-2 py-px text-xs font-semibold tabular-nums ${
                    isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div role="tabpanel">{current?.content}</div>
    </div>
  );
}
