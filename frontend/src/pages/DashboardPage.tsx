import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAppContext } from '../context/AppContext';

const DashboardPage: React.FC = () => {
  const { isTechMode } = useAppContext();
  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    const it = setInterval(() => {
      const now = new Date();
      setTimeStr(`${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,'0')}-${String(now.getUTCDate()).padStart(2,'0')} // ${String(now.getUTCHours()).padStart(2,'0')}:${String(now.getUTCMinutes()).padStart(2,'0')}:${String(now.getUTCSeconds()).padStart(2,'0')} UTC`);
    }, 1000);
    return () => clearInterval(it);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#121416]" style={{fontFamily:'Inter,sans-serif'}}>
      <Sidebar />
      <main className={`fixed top-0 right-0 w-full ${isTechMode ? 'md:w-[calc(100%-80px)]' : 'md:w-[calc(100%-240px)]'} h-full flex flex-col transition-all duration-300 pb-16 md:pb-0`}>
        {/* Header */}
        <header className="h-14 bg-[#1a1c1e] border-b border-[#333537] flex items-center justify-between px-[16px] md:px-[24px] w-full z-20">
          <div className="flex items-center space-x-4">
            <span className="material-symbols-outlined text-[#00f0ff]">dashboard</span>
            <h2 className="text-[16px] md:text-[18px] font-bold text-[#e2e2e5] uppercase tracking-tight">Plant Overview</h2>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <button className="material-symbols-outlined text-[#849495] hover:text-[#00f0ff] transition-colors">notifications</button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-[24px] space-y-6">
          <div className="grid grid-cols-12 gap-6">
            {/* KPI Cards */}
            <div className="col-span-4 bg-[#1a1c1e] p-6 border border-[#333537] rounded shadow-sm">
              <h3 className="text-[13px] font-[JetBrains_Mono,monospace] text-[#00f0ff] uppercase font-bold mb-2">Overall Health Index</h3>
              <div className="text-[48px] font-bold text-[#2E7D32] leading-none mb-2">92.4%</div>
              <div className="w-full bg-[#333537] h-1.5 rounded-full overflow-hidden">
                <div className="bg-[#2E7D32] h-full" style={{width: '92.4%'}}></div>
              </div>
            </div>
            
            <div className="col-span-4 bg-[#1a1c1e] p-6 border border-[#333537] rounded shadow-sm">
              <h3 className="text-[13px] font-[JetBrains_Mono,monospace] text-[#ffb4ab] uppercase font-bold mb-2">Active Critical Alerts</h3>
              <div className="text-[48px] font-bold text-[#ffb4ab] leading-none mb-2">03</div>
              <p className="text-xs text-[#849495]">Requires immediate engineering review.</p>
            </div>
            
            <div className="col-span-4 bg-[#1a1c1e] p-6 border border-[#333537] rounded shadow-sm">
              <h3 className="text-[13px] font-[JetBrains_Mono,monospace] text-[#FFB300] uppercase font-bold mb-2">Pending Maintenance</h3>
              <div className="text-[48px] font-bold text-[#e2e2e5] leading-none mb-2">14</div>
              <p className="text-xs text-[#849495]">Scheduled within the next 48 hours.</p>
            </div>
            
            {/* Main graph placeholder */}
            <div className="col-span-12 bg-[#1a1c1e] p-6 border border-[#333537] rounded shadow-sm min-h-[300px] flex flex-col justify-center items-center">
              <span className="material-symbols-outlined text-[#E0E0E0] text-[64px] mb-4">monitoring</span>
              <p className="text-[#849495] font-[JetBrains_Mono,monospace] uppercase tracking-widest text-sm">Telemetry Feed Analytics Engine</p>
              <p className="text-[#849495] text-xs mt-2">Plant-wide sensor aggregation initializing...</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="h-8 bg-[#1a1c1e] border-t border-[#333537] flex items-center justify-between px-6 z-20 shrink-0">
          <div className="flex items-center space-x-4">
            <span className="text-[9px] font-[JetBrains_Mono,monospace] text-[#849495] uppercase tracking-widest">System Status: <span className="text-[#00f0ff] font-bold">Nominal</span></span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[9px] font-[JetBrains_Mono,monospace] text-[#849495] uppercase">{timeStr}</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default DashboardPage;
