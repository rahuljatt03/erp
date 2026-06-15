import { useState } from 'react';

/**
 * Simple, reusable tab switcher.
 *
 * @param {object} props
 * @param {Array<{ key: string, label: React.ReactNode, badge?: React.ReactNode, content: React.ReactNode }>} props.tabs
 * @param {string} [props.initialKey]
 */
export default function Tabs({ tabs, initialKey }) {
  const [active, setActive] = useState(initialKey ?? tabs[0]?.key);
  const current = tabs.find((tab) => tab.key === active) ?? tabs[0];

  return (
    <div>
      <div className="tabs" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === active}
            className={`tab ${tab.key === active ? 'is-active' : ''}`}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
            {tab.badge != null ? <span className="tab__badge">{tab.badge}</span> : null}
          </button>
        ))}
      </div>
      <div role="tabpanel">{current?.content}</div>
    </div>
  );
}
