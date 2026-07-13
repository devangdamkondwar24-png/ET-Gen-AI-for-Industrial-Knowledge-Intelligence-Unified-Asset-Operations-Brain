import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { runComplianceCheck, type ComplianceResponse } from '../api/agents';
import { useAppContext } from '../context/AppContext';

const STATUS_STYLES: Record<string, string> = {
  COMPLIANT: 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]/10',
  GAP: 'bg-[#FFEBEE] text-[#ffb4ab] border-[#D32F2F]/10',
  MISSING: 'bg-[#FFF3E0] text-[#ED6C02] border-[#ED6C02]/10',
};

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: 'text-[#ffb4ab] border-[#D32F2F]/30 bg-[#FFEBEE]',
  HIGH: 'text-[#ED6C02] border-[#ED6C02]/30 bg-[#FFF3E0]',
  MEDIUM: 'text-[#849495] border-[#333537] bg-[#121416]',
};

// ── Compliance Page ──────────────────────────────────────────────────────────
const CompliancePage: React.FC = () => {
  const { isTechMode } = useAppContext();
  const [plant, setPlant] = useState('Plant-101');
  const [standard, setStandard] = useState('ISO 55001');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ComplianceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [timeStr, setTimeStr] = useState('');
  useEffect(() => {
    const it = setInterval(() => {
      const now = new Date();
      setTimeStr(`${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,'0')}-${String(now.getUTCDate()).padStart(2,'0')} // ${String(now.getUTCHours()).padStart(2,'0')}:${String(now.getUTCMinutes()).padStart(2,'0')}:${String(now.getUTCSeconds()).padStart(2,'0')} UTC`);
    }, 1000);
    return () => clearInterval(it);
  }, []);

  const runCheck = async () => {
    if (!plant.trim() || !standard.trim()) return;
    setIsLoading(true); setError(null); setResult(null);
    try {
      const r = await runComplianceCheck(plant.trim(), [standard.trim()]);
      setResult(r);
    } catch(e:unknown){ setError(e instanceof Error ? e.message : 'Unknown error'); }
    finally { setIsLoading(false); }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{fontFamily:'Inter,sans-serif', backgroundColor:'#FFFFFF', color:'#212121'}}>
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: 'linear-gradient(#E0E0E0 1px, transparent 1px), linear-gradient(90deg, #E0E0E0 1px, transparent 1px)',
        backgroundSize: '40px 40px', opacity: 0.1
      }}></div>
      
      <Sidebar />

      <main className={`w-full ${isTechMode ? 'md:ml-[80px]' : 'md:ml-[240px]'} flex-1 flex flex-col h-full relative z-10 transition-all duration-300 pb-16 md:pb-0`}>
        <header className="h-14 bg-[#1a1c1e] border-b border-[#333537] flex items-center justify-between px-[16px] md:px-[24px] w-full z-20 shrink-0">
          <div className="flex items-center space-x-4">
            <span className="material-symbols-outlined text-[#00f0ff]">verified_user</span>
            <h2 className="text-[16px] md:text-[18px] font-bold text-[#e2e2e5] uppercase tracking-tight truncate max-w-[150px] md:max-w-none">Compliance: {standard}</h2>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative flex items-center bg-[#121416] border border-[#333537] px-3 py-1.5 rounded w-64 group focus-within:ring-1 focus-within:ring-[#004D40] transition-all">
              <span className="material-symbols-outlined text-[#849495] text-sm mr-2">search</span>
              <input className="bg-transparent border-none p-0 text-xs text-[#e2e2e5] focus:ring-0 placeholder:text-[#849495]/50 w-full font-[JetBrains_Mono,monospace] outline-none" placeholder="Search Regulation..." type="text"/>
            </div>
            <div className="flex items-center space-x-4">
              <button className="material-symbols-outlined text-[#849495] hover:text-[#00f0ff] transition-colors">notifications</button>
              <button className="material-symbols-outlined text-[#849495] hover:text-[#00f0ff] transition-colors">settings</button>
              <div className="h-6 w-px bg-[#333537]"></div>
              <div className="flex items-center space-x-2 cursor-pointer active:opacity-80">
                <span className="text-[11px] font-[JetBrains_Mono,monospace] text-[#849495]">ASSET: PT-0019</span>
                <span className="material-symbols-outlined text-xs text-[#00f0ff]">hub</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-[24px] space-y-6">
          
          {/* Controls */}
          <div className="flex items-end gap-3 pb-4 border-b border-[#333537]">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase text-[#849495] font-bold font-[JetBrains_Mono,monospace]">Plant ID</label>
              <input type="text" value={plant} onChange={e=>setPlant(e.target.value)}
                className="px-3 py-2 border border-[#333537] rounded text-sm w-48 outline-none focus:border-[#00f0ff] bg-[#121416] font-[JetBrains_Mono,monospace]"/>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase text-[#849495] font-bold font-[JetBrains_Mono,monospace]">Standard</label>
              <input type="text" value={standard} onChange={e=>setStandard(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&runCheck()}
                className="px-3 py-2 border border-[#333537] rounded text-sm w-48 outline-none focus:border-[#00f0ff] bg-[#121416] font-[JetBrains_Mono,monospace]"/>
            </div>
            <button onClick={runCheck} disabled={isLoading||!plant.trim()||!standard.trim()}
              className="bg-[#00f0ff] text-[#002022] px-5 py-2 rounded font-bold text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm">
              {isLoading
                ? <><span className="material-symbols-outlined text-sm animate-spin">sync</span>Scanning…</>
                : <><span className="material-symbols-outlined text-sm">fact_check</span>Run Audit Check</>}
            </button>
          </div>

          {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

          {/* KPI Dashboard */}
          {result && (
            <div className="grid grid-cols-12 gap-[16px]">
              <div className="col-span-8 bg-[#1a1c1e] p-[20px] border border-[#333537] rounded flex flex-col relative overflow-hidden h-48 shadow-sm">
                <div className="flex justify-between items-start mb-4 z-10">
                  <div>
                    <h3 className="text-[13px] font-[JetBrains_Mono,monospace] text-[#00f0ff] uppercase font-medium">Compliance Pulse Index</h3>
                    <p className="text-xs text-[#849495]">Last 30 Days Trend Analysis</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-[#00f0ff]"></span><span className="text-[10px] font-[JetBrains_Mono,monospace] text-[#849495]">REGULATORY</span></div>
                    <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-[#ED6C02]"></span><span className="text-[10px] font-[JetBrains_Mono,monospace] text-[#849495]">OPERATIONAL</span></div>
                  </div>
                </div>
                <div className="flex-1 mt-2 relative bg-[#121416]/30 rounded border border-dashed border-[#333537] flex items-center justify-center">
                  <span className="text-[10px] font-[JetBrains_Mono,monospace] text-[#849495]/40 italic">Dynamic Pulse Graph Data Rendering...</span>
                </div>
              </div>
              <div className="col-span-4 bg-[#1a1c1e] border border-[#D32F2F] p-[20px] rounded flex flex-col justify-center items-center relative overflow-hidden group shadow-sm">
                <span className="text-[13px] font-[JetBrains_Mono,monospace] text-[#ffb4ab] uppercase tracking-[0.2em] font-bold">System State</span>
                <div className="text-[64px] font-bold text-[#ffb4ab] leading-none mt-2">
                  {String(result.gap_analysis.filter(g=>g.status!=='COMPLIANT').length).padStart(2,'0')}
                </div>
                <div className="text-[18px] text-[#e2e2e5] font-extrabold uppercase mt-1">Total Gaps Detected</div>
                <div className="mt-4 px-3 py-1 bg-[#FFEBEE] border border-[#D32F2F]/20 text-[10px] font-bold text-[#ffb4ab] flex items-center uppercase tracking-widest rounded-full">
                  <span className="material-symbols-outlined text-xs mr-1" style={{fontVariationSettings:"'FILL' 1"}}>warning</span>
                  Action Required
                </div>
              </div>
            </div>
          )}

          {/* Data Table */}
          {result && (
            <div className="bg-[#1a1c1e] border border-[#333537] rounded overflow-hidden flex flex-col shadow-sm">
              <div className="bg-[#121416] px-6 py-4 border-b border-[#333537] flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-1 h-6 bg-[#00f0ff]"></div>
                  <h3 className="text-[18px] text-[#e2e2e5] font-bold">Non-Conformance Registry</h3>
                </div>
                <div className="flex space-x-2">
                  <button className="px-4 py-1.5 bg-[#1a1c1e] border border-[#333537] rounded text-[11px] font-[JetBrains_Mono,monospace] text-[#849495] hover:text-[#e2e2e5] flex items-center transition-all shadow-sm">
                    <span className="material-symbols-outlined text-sm mr-2">filter_alt</span> FILTER
                  </button>
                  <a href={`http://localhost:8000/api/compliance/report?plant=${plant}&framework=${standard}`} target="_blank" rel="noopener noreferrer" 
                    className="px-4 py-1.5 bg-[#00f0ff] text-[#002022] font-bold rounded text-[11px] font-[JetBrains_Mono,monospace] flex items-center hover:opacity-90 active:scale-95 transition-all shadow-sm">
                    <span className="material-symbols-outlined text-sm mr-2">download</span> EXPORT REPORT
                  </a>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#333537] bg-[#121416]/50">
                      <th className="px-6 py-3 font-[JetBrains_Mono,monospace] text-[11px] text-[#849495] uppercase">Clause ID</th>
                      <th className="px-6 py-3 font-[JetBrains_Mono,monospace] text-[11px] text-[#849495] uppercase">Requirement Summary</th>
                      <th className="px-6 py-3 font-[JetBrains_Mono,monospace] text-[11px] text-[#849495] uppercase">Status</th>
                      <th className="px-6 py-3 font-[JetBrains_Mono,monospace] text-[11px] text-[#849495] uppercase text-center">Severity</th>
                      <th className="px-6 py-3 font-[JetBrains_Mono,monospace] text-[11px] text-[#849495] uppercase">Evidence</th>
                      <th className="px-6 py-3 font-[JetBrains_Mono,monospace] text-[11px] text-[#849495] uppercase">Recommended Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0E0E0]">
                    {result.gap_analysis.map((gap, i) => (
                      <tr key={i} className={`hover:bg-[#121416] transition-colors ${gap.status==='COMPLIANT'?'opacity-70':''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-['Roboto_Mono',monospace] text-[13px] px-2 py-0.5 rounded border ${gap.status==='COMPLIANT'?'bg-[#121416] text-[#849495] border-[#333537]':'bg-[#00f0ff]/20 text-[#00f0ff] border-[#00f0ff]/20'}`}>
                            {gap.regulation_id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className={`max-w-xs font-medium ${gap.status==='COMPLIANT'?'text-[#849495]':'text-[#e2e2e5]'}`}>{gap.requirement}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${STATUS_STYLES[gap.status]||STATUS_STYLES.MISSING}`}>
                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${gap.status==='COMPLIANT'?'bg-[#2E7D32]':gap.status==='GAP'?'bg-[#D32F2F]':'bg-[#ED6C02]'}`}></span>
                            {gap.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-[JetBrains_Mono,monospace] text-[11px] px-2 py-1 border rounded ${SEVERITY_STYLES[gap.severity]||SEVERITY_STYLES.MEDIUM} ${gap.severity==='CRITICAL'?'font-extrabold':gap.severity==='HIGH'?'font-bold':'font-normal'}`}>
                            {gap.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {gap.evidence_doc ? (
                            <div className="flex flex-wrap gap-1">
                                <span className="bg-[#121416] border border-[#333537] px-2 py-0.5 rounded-full text-[10px] font-[JetBrains_Mono,monospace] flex items-center text-[#849495]">
                                  <span className="material-symbols-outlined text-[10px] mr-1">attach_file</span> {gap.evidence_doc}
                                </span>
                            </div>
                          ) : (
                            <span className="text-[#849495]/40 italic text-[10px]">No document attached</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className={`text-[12px] italic ${gap.status==='COMPLIANT'?'text-[#849495]/60':'text-[#849495]'}`}>{gap.recommended_action}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-[#121416] px-6 py-3 border-t border-[#333537] flex justify-between items-center">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#2E7D32]"></span>
                    <span className="text-[10px] font-[JetBrains_Mono,monospace] text-[#849495]">CONFORMANCE: 84.2%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
        
        {/* Footer */}
        <footer className="h-8 bg-[#121416] border-t border-[#333537] flex items-center justify-between px-6 z-20 shrink-0">
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

export default CompliancePage;
