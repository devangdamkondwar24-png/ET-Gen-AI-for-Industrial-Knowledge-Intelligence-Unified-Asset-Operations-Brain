import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', icon: 'smart_toy', label: 'Copilot' },
  { to: '/rca', icon: 'query_stats', label: 'RCA Analysis' },
  { to: '/compliance', icon: 'gavel', label: 'Compliance' },
  { to: '/lessons', icon: 'school', label: 'Lessons Learned' },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="fixed left-0 top-0 h-full w-60 bg-surface border-r border-border-muted flex flex-col py-0 z-20">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-border-muted">
        <h1 className="font-bold text-lg text-primary tracking-tight">Industrial Cockpit</h1>
        <p className="text-text-muted text-[11px] uppercase tracking-widest mt-1">Knowledge Intelligence</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 pt-4">
        {navItems.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'border-l-4 border-primary bg-primary-container text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface hover:text-on-surface'
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">{icon}</span>
            <span className="text-sm">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-6 pb-6 border-t border-border-muted pt-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-sm">person</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-on-surface">Engineer</p>
            <p className="text-[11px] text-text-muted">Shift A Lead</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
