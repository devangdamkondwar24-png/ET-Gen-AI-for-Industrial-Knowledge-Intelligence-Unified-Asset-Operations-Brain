import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar: React.FC = () => {
  const links = [
    { to: '/', icon: 'dashboard', label: 'Dashboard', exact: true },
    { to: '/copilot', icon: 'smart_toy', label: 'Copilot' },
    { to: '/rca', icon: 'analytics', label: 'RCA Analysis' },
    { to: '/compliance', icon: 'fact_check', label: 'Compliance' },
    { to: '/assets', icon: 'factory', label: 'Assets' },
    { to: '/reports', icon: 'description', label: 'Reports' },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[240px] bg-[#F5F5F5] border-r border-[#E0E0E0] flex flex-col py-6 z-30" style={{fontFamily:'Inter,sans-serif'}}>
      <div className="px-6 mb-8">
        <h1 className="text-[20px] font-bold text-[#004D40] tracking-tight" style={{lineHeight:1.3}}>Industrial Cockpit</h1>
        <p className="text-[11px] font-[JetBrains_Mono,monospace] text-[#616161] uppercase tracking-widest mt-1 font-medium">Reliability Engineer</p>
      </div>
      
      <nav className="flex-1 space-y-1">
        {links.map(({to, icon, label, exact}) => (
          <NavLink key={to} end={exact} to={to}
            className={({isActive})=>`flex items-center px-6 py-3 transition-colors duration-200 group active:scale-[0.98] ${isActive?'border-l-4 border-[#004D40] bg-[#004D40]/5 text-[#004D40] font-bold':'text-[#616161] hover:bg-white'}`}>
            <span className="material-symbols-outlined mr-3">{icon}</span>
            <span className="text-[13px] font-[JetBrains_Mono,monospace] font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
      
      <div className="mt-auto px-6 pt-6 border-t border-[#E0E0E0] space-y-1">
        <div className="flex items-center py-3 text-[#616161] hover:text-[#212121] transition-colors duration-200 cursor-pointer">
          <span className="material-symbols-outlined mr-3">settings</span>
          <span className="text-[13px] font-[JetBrains_Mono,monospace] font-medium">Settings</span>
        </div>
        <div className="mt-6 flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded border border-[#E0E0E0] flex items-center justify-center overflow-hidden">
            <span className="material-symbols-outlined text-[#004D40]">person</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-[#212121] truncate">OPERATOR_042</p>
            <p className="text-[10px] text-[#616161] font-[JetBrains_Mono,monospace]">AUTH_LEVEL: OMEGA</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
