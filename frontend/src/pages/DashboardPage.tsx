import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getDashboardSummary, type DashboardSummary } from '../api/agents';

const DashboardPage: React.FC = () => {
  const [timeStr, setTimeStr] = useState('');
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const it = setInterval(() => {
      const now = new Date();
      setTimeStr(`${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,'0')}-${String(now.getUTCDate()).padStart(2,'0')} // ${String(now.getUTCHours()).padStart(2,'0')}:${String(now.getUTCMinutes()).padStart(2,'0')}:${String(now.getUTCSeconds()).padStart(2,'0')} UTC`);
    }, 1000);
    return () => clearInterval(it);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getDashboardSummary();
        setData(result);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA]" style={{fontFamily:'Inter,sans-serif'}}>
      <Sidebar />
      <main className="fixed top-0 right-0 w-[calc(100%-240px)] h-full flex flex-col">
        {/* Header */}
        <header className="h-14 bg-white border-b border-[#E0E0E0] flex items-center justify-between px-[24px] w-full z-20">
          <div className="flex items-center space-x-4">
            <span className="material-symbols-outlined text-[#004D40]">dashboard</span>
            <h2 className="text-[18px] font-bold text-[#212121] uppercase tracking-tight">Plant Overview Dashboard</h2>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-4">
              <button className="material-symbols-outlined text-[#616161] hover:text-[#004D40] transition-colors">notifications</button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-[24px] space-y-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="material-symbols-outlined text-[#004D40] text-[48px] animate-spin">sync</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded border border-red-200 text-red-700">
              Error loading dashboard: {error}
            </div>
          ) : data ? (
            <div className="grid grid-cols-12 gap-6">
              {/* KPI Cards */}
              <div className="col-span-4 bg-white p-6 border border-[#E0E0E0] rounded shadow-sm">
                <h3 className="text-[13px] font-[JetBrains_Mono,monospace] text-[#004D40] uppercase font-bold mb-2">Overall Health Index</h3>
                <div className="text-[48px] font-bold text-[#2E7D32] leading-none mb-2">{data.system_health_pct.toFixed(1)}%</div>
                <div className="w-full bg-[#E0E0E0] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#2E7D32] h-full transition-all duration-1000" style={{width: `${data.system_health_pct}%`}}></div>
                </div>
              </div>
              
              <div className="col-span-4 bg-white p-6 border border-[#E0E0E0] rounded shadow-sm">
                <h3 className="text-[13px] font-[JetBrains_Mono,monospace] text-[#D32F2F] uppercase font-bold mb-2">Active Critical Alerts</h3>
                <div className="text-[48px] font-bold text-[#D32F2F] leading-none mb-2">{String(data.critical_alerts.length).padStart(2, '0')}</div>
                <p className="text-xs text-[#757575]">Requires immediate engineering review.</p>
              </div>
              
              <div className="col-span-4 bg-white p-6 border border-[#E0E0E0] rounded shadow-sm">
                <h3 className="text-[13px] font-[JetBrains_Mono,monospace] text-[#FFB300] uppercase font-bold mb-2">Pending Maintenance</h3>
                <div className="text-[48px] font-bold text-[#212121] leading-none mb-2">{data.pending_maintenance.length}</div>
                <p className="text-xs text-[#757575]">Open work orders across all systems.</p>
              </div>
              
              {/* Services Status */}
              <div className="col-span-12 bg-white p-6 border border-[#E0E0E0] rounded shadow-sm">
                <h3 className="text-[14px] font-bold text-[#212121] mb-4 uppercase">System Diagnostics</h3>
                <div className="grid grid-cols-3 gap-4">
                  {data.services.map((svc, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border border-[#E0E0E0] rounded bg-[#FAFAFA]">
                      <span className="font-semibold text-sm text-[#212121]">{svc.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${svc.status === 'up' ? 'bg-[#2E7D32]' : 'bg-[#D32F2F] animate-pulse'}`}></span>
                        <span className={`text-[10px] font-bold uppercase ${svc.status === 'up' ? 'text-[#2E7D32]' : 'text-[#D32F2F]'}`}>{svc.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Data Ingestion Status */}
              <div className="col-span-6 bg-white p-6 border border-[#E0E0E0] rounded shadow-sm">
                 <h3 className="text-[14px] font-bold text-[#212121] mb-4 uppercase">Knowledge Graph Entities</h3>
                 <ul className="space-y-3">
                   <li className="flex justify-between items-center text-sm border-b border-[#E0E0E0] pb-2">
                     <span className="text-[#616161]">Total Equipment</span>
                     <span className="font-bold font-[JetBrains_Mono,monospace]">{data.equipment_count}</span>
                   </li>
                   <li className="flex justify-between items-center text-sm border-b border-[#E0E0E0] pb-2">
                     <span className="text-[#616161]">Failure Modes</span>
                     <span className="font-bold font-[JetBrains_Mono,monospace]">{data.failure_count}</span>
                   </li>
                   <li className="flex justify-between items-center text-sm border-b border-[#E0E0E0] pb-2">
                     <span className="text-[#616161]">Incidents</span>
                     <span className="font-bold font-[JetBrains_Mono,monospace]">{data.incident_count}</span>
                   </li>
                 </ul>
              </div>

              <div className="col-span-6 bg-white p-6 border border-[#E0E0E0] rounded shadow-sm">
                 <h3 className="text-[14px] font-bold text-[#212121] mb-4 uppercase">Document Corpus</h3>
                 <div className="flex flex-col justify-center items-center h-[120px] bg-[#FAFAFA] border border-[#E0E0E0] border-dashed rounded">
                    <span className="text-[32px] font-bold text-[#004D40]">{data.document_count}</span>
                    <span className="text-xs text-[#757575] uppercase tracking-widest mt-1">Indexed Chunks</span>
                 </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <footer className="h-8 bg-white border-t border-[#E0E0E0] flex items-center justify-between px-6 z-20 shrink-0">
          <div className="flex items-center space-x-4">
            <span className="text-[9px] font-[JetBrains_Mono,monospace] text-[#616161] uppercase tracking-widest">System Status: <span className="text-[#004D40] font-bold">{data?.system_health_pct === 100 ? 'Nominal' : 'Degraded'}</span></span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[9px] font-[JetBrains_Mono,monospace] text-[#616161] uppercase">{timeStr}</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default DashboardPage;
