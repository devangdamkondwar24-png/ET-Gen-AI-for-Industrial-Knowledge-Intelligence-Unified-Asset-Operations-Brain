import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const links = [
    { to: '/',           icon: 'home',                 label: 'Home',           exact: true },
    { to: '/copilot',   icon: 'smart_toy',            label: 'Copilot' },
    { to: '/search',    icon: 'search',               label: 'Search' },
    { to: '/assets',    icon: 'precision_manufacturing', label: 'Assets' },
    { to: '/compliance',icon: 'verified_user',        label: 'Compliance' },
    { to: '/rca',       icon: 'analytics',             label: 'RCA' },
    { to: '/alerts',    icon: 'warning',              label: 'Alerts' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-stretch h-[64px] bg-surface-container-lowest z-50 border-t border-outline-variant">
      {links.slice(0, 5).map(({ to, icon, label, exact }) => (
        <NavLink
          key={to}
          end={exact}
          to={to}
          className={({ isActive }) =>
            isActive
              ? "flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-none h-full w-full border-t-2 border-primary-container transition-transform duration-75 active:scale-95"
              : "flex flex-col items-center justify-center text-on-surface-variant h-full w-full hover:bg-surface-container-high transition-transform duration-75 active:scale-95"
          }
        >
          {({ isActive }) => (
            <>
              <span 
                className="material-symbols-outlined mb-0.5" 
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {icon}
              </span>
              <span className="font-label-sm text-label-sm uppercase">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default Sidebar;
