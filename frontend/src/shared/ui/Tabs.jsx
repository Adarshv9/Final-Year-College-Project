// Reusable tab switcher component.

import { useState } from 'react';

// Render the tabs component.
export function Tabs({ tabs, defaultTab, className = '' }) {
  const [active, setActive] = useState(defaultTab || tabs[0]?.id);
  const current = tabs.find((t) => t.id === active);

  return (
    <div className={className}>
      <div className="flex gap-1 border-b border-slate-200 mb-6">
        {tabs.map((tab) =>
        <button
          key={tab.id}
          onClick={() => setActive(tab.id)}
          className={[
          'px-4 py-2.5 text-sm font-medium transition-all duration-150 border-b-2 -mb-px',
          active === tab.id ?
          'text-indigo-700 border-indigo-500' :
          'text-slate-500 border-transparent hover:text-slate-700'].
          join(' ')}>
          
            {tab.label}
          </button>
        )}
      </div>
      <div>{current?.content}</div>
    </div>);

}

export default Tabs;