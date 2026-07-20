import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { getReportsSummary, type ReportSummary } from '../api/agents';

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const it = setInterval(() => {
      const now = new Date();
      setTimeStr(`${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,'0')}-${String(now.getUTCDate()).padStart(2,'0')} // ${String(now.getUTCHours()).padStart(2,'0')}:${String(now.getUTCMinutes()).padStart(2,'0')}:${String(now.getUTCSeconds()).padStart(2,'0')} UTC`);
    }, 1000);
    return () => clearInterval(it);
  }, []);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const result = await getReportsSummary();
        setData(result);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA]" style={{fontFamily:'Inter,sans-serif'}}>
      <Sidebar />
      <main className="fixed top-0 right-0 w-[calc(100%-240px)] h-full flex flex-col">
        {/* Header */}
        <header className="h-14 bg-white border-b border-[#E0E0E0] flex items-center justify-between px-[24px] w-full z-20">
          <div className="flex items-center space-x-4">
            <span className="material-symbols-outlined text-[#004D40]">description</span>
            <h2 className="text-[18px] font-bold text-[#212121] uppercase tracking-tight">Reports & Analysis</h2>
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
              Error loading reports: {error}
            </div>
          ) : data ? (
            <>
              {/* Report Types */}
              <div>
                <h3 className="text-[14px] font-bold text-[#212121] mb-4 uppercase tracking-widest border-b border-[#E0E0E0] pb-2">Analysis Engines</h3>
                <div className="grid grid-cols-3 gap-6">
                  {data.report_types.map((rt) => (
                    <div key={rt.id} 
                         onClick={() => navigate(rt.route)}
                         className="bg-white border border-[#E0E0E0] p-6 rounded shadow-sm hover:shadow-md cursor-pointer transition-all group hover:border-[#004D40]/30">
                      <div className="flex items-start justify-between mb-4">
                        <span className="material-symbols-outlined text-[32px] text-[#004D40]">{rt.icon}</span>
                        <span className="material-symbols-outlined text-[#E0E0E0] group-hover:text-[#004D40] transition-colors">arrow_forward</span>
                      </div>
                      <h4 className="text-[16px] font-bold text-[#212121] mb-2">{rt.title}</h4>
                      <p className="text-[13px] text-[#616161] leading-relaxed">{rt.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Recent Compliance Audits */}
                <div className="bg-white border border-[#E0E0E0] rounded shadow-sm overflow-hidden flex flex-col h-[400px]">
                  <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#E0E0E0] flex items-center justify-between">
                    <h3 className="text-[13px] font-bold text-[#212121] uppercase font-[JetBrains_Mono,monospace]">Recent Non-Conformances</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {data.compliance_history.length > 0 ? (
                      data.compliance_history.map((nc, i) => (
                        <div key={i} className="p-3 border border-[#E0E0E0] rounded bg-[#FAFAFA]">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[11px] font-[JetBrains_Mono,monospace] font-bold text-[#004D40]">{nc.nc_id}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${nc.status === 'Open' ? 'bg-[#FFEBEE] text-[#D32F2F]' : 'bg-[#E8F5E9] text-[#2E7D32]'}`}>
                              {nc.status}
                            </span>
                          </div>
                          <p className="text-[13px] text-[#212121] mb-2">{nc.description}</p>
                          <span className="text-[10px] text-[#757575] bg-[#E0E0E0]/50 px-2 py-0.5 rounded">
                            Violates: {nc.regulation_id}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-[#757575]">
                         <span className="material-symbols-outlined text-[32px] mb-2 text-[#E0E0E0]">verified_user</span>
                         <p className="text-sm">No recent non-conformances found.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Lessons Learned Insights */}
                <div className="bg-white border border-[#E0E0E0] rounded shadow-sm overflow-hidden flex flex-col h-[400px]">
                  <div className="bg-[#F5F5F5] px-4 py-3 border-b border-[#E0E0E0] flex items-center justify-between">
                    <h3 className="text-[13px] font-bold text-[#212121] uppercase font-[JetBrains_Mono,monospace]">Lessons Learned Insights</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {data.insights.length > 0 ? (
                      data.insights.map((insight, i) => (
                        <div key={i} className="p-3 border border-[#E0E0E0] rounded bg-[#FAFAFA]">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-[11px] font-[JetBrains_Mono,monospace] font-bold text-[#ED6C02]">PATTERN: {insight.failure_name}</span>
                          </div>
                          <p className="text-[13px] text-[#212121] mb-2">{insight.summary}</p>
                          <p className="text-[11px] text-[#616161] italic">Recommendation: {insight.recommendation}</p>
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-[#757575]">
                         <span className="material-symbols-outlined text-[32px] mb-2 text-[#E0E0E0]">school</span>
                         <p className="text-sm">No lessons learned insights generated yet.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <footer className="h-8 bg-white border-t border-[#E0E0E0] flex items-center justify-between px-6 z-20 shrink-0">
          <div className="flex items-center space-x-4">
            <span className="text-[9px] font-[JetBrains_Mono,monospace] text-[#616161] uppercase tracking-widest">System Status: <span className="text-[#004D40] font-bold">Nominal</span></span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[9px] font-[JetBrains_Mono,monospace] text-[#616161] uppercase">{timeStr}</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default ReportsPage;
