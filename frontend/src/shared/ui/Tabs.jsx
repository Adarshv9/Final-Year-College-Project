// Lightweight tabs component for swapping between related views.
import { useState } from 'react';

export function Tabs({ tabs, defaultTab, className = '' }) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);
  const current = tabs.find(t => t.id === active);

  return (
    <div className={className}>
      <div className="flex gap-1 border-b border-[#1e2a3d] mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={[
              'px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px',
              active === tab.id
                ? 'text-indigo-400 border-indigo-500'
                : 'text-[#64748b] border-transparent hover:text-[#94a3b8]',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{current?.content}</div>
    </div>
  );
}

export default Tabs;
