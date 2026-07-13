import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const Sidebar: React.FC = () => {
  const { isTechMode, setIsTechMode } = useAppContext();

  const links = [
    { to: '/',           icon: 'home',                 label: 'Home',           exact: true },
    { to: '/copilot',   icon: 'smart_toy',            label: 'Copilot' },
    { to: '/search',    icon: 'manage_search',         label: 'Evidence' },
    { to: '/assets',    icon: 'precision_manufacturing', label: 'Assets' },
    { to: '/compliance',icon: 'fact_check',            label: 'Compliance' },
    { to: '/rca',       icon: 'analytics',             label: 'RCA' },
    { to: '/lessons',   icon: 'school',                label: 'Lessons' },
  ];

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────── */}
      <aside
        className={`hidden md:flex fixed left-0 top-0 h-full ${isTechMode ? 'w-[80px]' : 'w-[240px]'} bg-[#0c0e10] border-r border-[#333537] flex-col py-6 z-30 transition-all duration-300`}
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        {/* Logo */}
        <div className={`px-4 mb-8 flex flex-col ${isTechMode ? 'items-center' : ''}`}>
          {isTechMode ? (
            <span className="material-symbols-outlined text-[#00f0ff] text-3xl">build_circle</span>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#00f0ff] text-xl">build_circle</span>
                <h1 className="text-[16px] font-bold text-[#e2e2e5] tracking-tight" style={{ fontFamily: 'Geist, sans-serif' }}>
                  TECH-OS
                </h1>
              </div>
              <p className="text-[10px] text-[#849495] uppercase tracking-widest mt-1 font-mono">v2.4 // Industrial Mode</p>
            </>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-0.5 px-2">
          {links.map(({ to, icon, label, exact }) => (
            <NavLink
              key={to}
              end={exact}
              to={to}
              className={({ isActive }) =>
                `flex items-center ${isTechMode ? 'justify-center px-0 py-3.5' : 'px-3 py-3'} rounded transition-colors duration-150 group ${
                  isActive
                    ? 'bg-[#00f0ff]/10 text-[#00f0ff] border-l-2 border-[#00f0ff]'
                    : 'text-[#849495] hover:bg-[#1e2022] hover:text-[#e2e2e5] border-l-2 border-transparent'
                }`
              }
            >
              <span className={`material-symbols-outlined text-xl ${isTechMode ? '' : 'mr-3'}`}>{icon}</span>
              {!isTechMode && (
                <span className="text-[12px] font-mono font-medium">{label}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className={`mt-auto ${isTechMode ? 'px-2' : 'px-4'} pt-4 border-t border-[#333537] flex flex-col items-center gap-3`}>
          <button
            onClick={() => setIsTechMode(!isTechMode)}
            className="flex items-center gap-2 text-[#849495] hover:text-[#00f0ff] transition-colors"
            title="Toggle Tech Mode"
          >
            <span className="material-symbols-outlined text-xl">{isTechMode ? 'desktop_windows' : 'phone_iphone'}</span>
            {!isTechMode && <span className="text-[11px] font-mono uppercase">Tech Mode</span>}
          </button>

          {!isTechMode && (
            <div className="flex items-center w-full gap-3 mt-2">
              <div className="w-9 h-9 bg-[#1e2022] border border-[#333537] rounded flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#849495] text-lg">person</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-[#e2e2e5] truncate font-mono">OPERATOR_042</p>
                <p className="text-[10px] text-[#849495] font-mono">AUTH: OMEGA</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile / Field bottom nav ─────────────────────── */}
      <nav className="md:hidden fixed bottom-0 w-full bg-[#0c0e10] border-t border-[#333537] z-50 flex justify-around">
        {links.slice(0, 5).map(({ to, icon, label, exact }) => (
          <NavLink
            key={to}
            end={exact}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center py-2.5 flex-1 transition-colors ${isActive ? 'text-[#00f0ff]' : 'text-[#849495]'}`
            }
          >
            <span className="material-symbols-outlined text-2xl">{icon}</span>
            <span className="text-[9px] font-mono mt-0.5 uppercase">{label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
