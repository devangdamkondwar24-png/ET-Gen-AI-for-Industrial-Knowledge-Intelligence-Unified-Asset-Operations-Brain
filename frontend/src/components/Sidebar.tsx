import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const Sidebar: React.FC = () => {
  const { isTechMode, setIsTechMode } = useAppContext();
  const links = [
    { to: '/', icon: 'dashboard', label: 'Dashboard', exact: true },
    { to: '/copilot', icon: 'smart_toy', label: 'Copilot' },
    { to: '/rca', icon: 'analytics', label: 'RCA Analysis' },
    { to: '/compliance', icon: 'fact_check', label: 'Compliance' },
    { to: '/assets', icon: 'factory', label: 'Assets' },
    { to: '/reports', icon: 'description', label: 'Reports' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex fixed left-0 top-0 h-full ${isTechMode ? 'w-[80px]' : 'w-[240px]'} bg-[#F5F5F5] border-r border-[#E0E0E0] flex-col py-6 z-30 transition-all duration-300`} style={{fontFamily:'Inter,sans-serif'}}>
        <div className={`px-6 mb-8 flex flex-col ${isTechMode ? 'items-center' : ''}`}>
          {isTechMode ? (
            <span className="material-symbols-outlined text-[#004D40] text-3xl">build</span>
          ) : (
            <>
              <h1 className="text-[20px] font-bold text-[#004D40] tracking-tight" style={{lineHeight:1.3}}>Industrial Cockpit</h1>
              <p className="text-[11px] font-[JetBrains_Mono,monospace] text-[#616161] uppercase tracking-widest mt-1 font-medium">Reliability Engineer</p>
            </>
          )}
        </div>
        
        <nav className="flex-1 space-y-1">
          {links.map(({to, icon, label, exact}) => (
            <NavLink key={to} end={exact} to={to}
              className={({isActive})=>`flex items-center ${isTechMode ? 'justify-center px-0 py-4' : 'px-6 py-3'} transition-colors duration-200 group active:scale-[0.98] ${isActive?'border-l-4 border-[#004D40] bg-[#004D40]/5 text-[#004D40] font-bold':'text-[#616161] hover:bg-white border-l-4 border-transparent'}`}>
              <span className={`material-symbols-outlined ${isTechMode ? '' : 'mr-3'}`}>{icon}</span>
              {!isTechMode && <span className="text-[13px] font-[JetBrains_Mono,monospace] font-medium">{label}</span>}
            </NavLink>
          ))}
        </nav>
        
        <div className={`mt-auto ${isTechMode ? 'px-2' : 'px-6'} pt-6 border-t border-[#E0E0E0] flex flex-col items-center space-y-4`}>
          <button onClick={() => setIsTechMode(!isTechMode)} className="flex items-center text-[#616161] hover:text-[#004D40] transition-colors duration-200" title="Toggle Field Tech Mode">
            <span className="material-symbols-outlined font-bold">{isTechMode ? 'desktop_windows' : 'phone_iphone'}</span>
            {!isTechMode && <span className="text-[12px] font-[JetBrains_Mono,monospace] font-medium ml-2 uppercase">Tech Mode</span>}
          </button>
          {!isTechMode && (
            <div className="flex items-center w-full space-x-3 mt-4">
              <div className="w-10 h-10 bg-white rounded border border-[#E0E0E0] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#004D40]">person</span>
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-[#212121] truncate">OPERATOR_042</p>
                <p className="text-[10px] text-[#616161] font-[JetBrains_Mono,monospace]">AUTH: OMEGA</p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile / Tech Mode Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-[#E0E0E0] z-50 flex justify-around pb-safe">
        {links.slice(0, 5).map(({to, icon, exact}) => (
          <NavLink key={to} end={exact} to={to}
            className={({isActive})=>`flex flex-col items-center py-3 flex-1 ${isActive?'text-[#004D40]':'text-[#616161]'}`}>
            <span className="material-symbols-outlined text-[24px]">{icon}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
