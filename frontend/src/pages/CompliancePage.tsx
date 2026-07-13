import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { runComplianceCheck, type ComplianceResponse } from '../api/agents';

const STATUS_STYLES: Record<string, string> = {
  COMPLIANT: 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]/10',
  GAP: 'bg-[#FFEBEE] text-[#D32F2F] border-[#D32F2F]/10',
  MISSING: 'bg-[#FFF3E0] text-[#ED6C02] border-[#ED6C02]/10',
};

const SEVERITY_STYLES: Record<string, string> = {
  CRITICAL: 'text-[#D32F2F] border-[#D32F2F]/30 bg-[#FFEBEE]',
  HIGH: 'text-[#ED6C02] border-[#ED6C02]/30 bg-[#FFF3E0]',
  MEDIUM: 'text-[#616161] border-[#E0E0E0] bg-[#FAFAFA]',
};

// ── Compliance Page ──────────────────────────────────────────────────────────
const CompliancePage: React.FC = () => {
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

      <main className="ml-[240px] flex-1 flex flex-col h-full relative z-10">
        <header className="h-14 bg-white border-b border-[#E0E0E0] flex items-center justify-between px-[24px] w-full z-20">
          <div className="flex items-center space-x-4">
            <span className="material-symbols-outlined text-[#004D40]">verified_user</span>
            <h2 className="text-[18px] font-bold text-[#212121] uppercase tracking-tight">Regulatory Compliance: {standard}</h2>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative flex items-center bg-[#F5F5F5] border border-[#E0E0E0] px-3 py-1.5 rounded w-64 group focus-within:ring-1 focus-within:ring-[#004D40] transition-all">
              <span className="material-symbols-outlined text-[#616161] text-sm mr-2">search</span>
              <input className="bg-transparent border-none p-0 text-xs text-[#212121] focus:ring-0 placeholder:text-[#616161]/50 w-full font-[JetBrains_Mono,monospace] outline-none" placeholder="Search Regulation..." type="text"/>
            </div>
            <div className="flex items-center space-x-4">
              <button className="material-symbols-outlined text-[#616161] hover:text-[#004D40] transition-colors">notifications</button>
              <button className="material-symbols-outlined text-[#616161] hover:text-[#004D40] transition-colors">settings</button>
              <div className="h-6 w-px bg-[#E0E0E0]"></div>
              <div className="flex items-center space-x-2 cursor-pointer active:opacity-80">
                <span className="text-[11px] font-[JetBrains_Mono,monospace] text-[#616161]">ASSET: PT-0019</span>
                <span className="material-symbols-outlined text-xs text-[#004D40]">hub</span>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-[24px] space-y-6">
          
          {/* Controls */}
          <div className="flex items-end gap-3 pb-4 border-b border-[#E0E0E0]">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase text-[#757575] font-bold font-[JetBrains_Mono,monospace]">Plant ID</label>
              <input type="text" value={plant} onChange={e=>setPlant(e.target.value)}
                className="px-3 py-2 border border-[#E0E0E0] rounded text-sm w-48 outline-none focus:border-[#004D40] bg-[#FAFAFA] font-[JetBrains_Mono,monospace]"/>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase text-[#757575] font-bold font-[JetBrains_Mono,monospace]">Standard</label>
              <input type="text" value={standard} onChange={e=>setStandard(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&runCheck()}
                className="px-3 py-2 border border-[#E0E0E0] rounded text-sm w-48 outline-none focus:border-[#004D40] bg-[#FAFAFA] font-[JetBrains_Mono,monospace]"/>
            </div>
            <button onClick={runCheck} disabled={isLoading||!plant.trim()||!standard.trim()}
              className="bg-[#004D40] text-white px-5 py-2 rounded font-bold text-sm flex items-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm">
              {isLoading
                ? <><span className="material-symbols-outlined text-sm animate-spin">sync</span>Scanning…</>
                : <><span className="material-symbols-outlined text-sm">fact_check</span>Run Audit Check</>}
            </button>
          </div>

          {error && <div className="px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

          {/* KPI Dashboard */}
          {result && (
            <div className="grid grid-cols-12 gap-[16px]">
              <div className="col-span-8 bg-white p-[20px] border border-[#E0E0E0] rounded flex flex-col relative overflow-hidden h-48 shadow-sm">
                <div className="flex justify-between items-start mb-4 z-10">
                  <div>
                    <h3 className="text-[13px] font-[JetBrains_Mono,monospace] text-[#004D40] uppercase font-medium">Compliance Pulse Index</h3>
                    <p className="text-xs text-[#616161]">Last 30 Days Trend Analysis</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-[#004D40]"></span><span className="text-[10px] font-[JetBrains_Mono,monospace] text-[#616161]">REGULATORY</span></div>
                    <div className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-[#ED6C02]"></span><span className="text-[10px] font-[JetBrains_Mono,monospace] text-[#616161]">OPERATIONAL</span></div>
                  </div>
                </div>
                <div className="flex-1 mt-2 relative bg-[#F5F5F5]/30 rounded border border-dashed border-[#E0E0E0] flex items-center justify-center">
                  <span className="text-[10px] font-[JetBrains_Mono,monospace] text-[#616161]/40 italic">Dynamic Pulse Graph Data Rendering...</span>
                </div>
              </div>
              <div className="col-span-4 bg-white border border-[#D32F2F] p-[20px] rounded flex flex-col justify-center items-center relative overflow-hidden group shadow-sm">
                <span className="text-[13px] font-[JetBrains_Mono,monospace] text-[#D32F2F] uppercase tracking-[0.2em] font-bold">System State</span>
                <div className="text-[64px] font-bold text-[#D32F2F] leading-none mt-2">
                  {String(result.gap_analysis.filter(g=>g.status!=='COMPLIANT').length).padStart(2,'0')}
                </div>
                <div className="text-[18px] text-[#212121] font-extrabold uppercase mt-1">Total Gaps Detected</div>
                <div className="mt-4 px-3 py-1 bg-[#FFEBEE] border border-[#D32F2F]/20 text-[10px] font-bold text-[#D32F2F] flex items-center uppercase tracking-widest rounded-full">
                  <span className="material-symbols-outlined text-xs mr-1" style={{fontVariationSettings:"'FILL' 1"}}>warning</span>
                  Action Required
                </div>
              </div>
            </div>
          )}

          {/* Data Table */}
          {result && (
            <div className="bg-white border border-[#E0E0E0] rounded overflow-hidden flex flex-col shadow-sm">
              <div className="bg-[#FAFAFA] px-6 py-4 border-b border-[#E0E0E0] flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-1 h-6 bg-[#004D40]"></div>
                  <h3 className="text-[18px] text-[#212121] font-bold">Non-Conformance Registry</h3>
                </div>
                <div className="flex space-x-2">
                  <button className="px-4 py-1.5 bg-white border border-[#E0E0E0] rounded text-[11px] font-[JetBrains_Mono,monospace] text-[#616161] hover:text-[#212121] flex items-center transition-all shadow-sm">
                    <span className="material-symbols-outlined text-sm mr-2">filter_alt</span> FILTER
                  </button>
                  <button className="px-4 py-1.5 bg-[#004D40] text-white font-bold rounded text-[11px] font-[JetBrains_Mono,monospace] flex items-center hover:opacity-90 active:scale-95 transition-all shadow-sm">
                    <span className="material-symbols-outlined text-sm mr-2">download</span> EXPORT REPORT
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#E0E0E0] bg-[#F5F5F5]/50">
                      <th className="px-6 py-3 font-[JetBrains_Mono,monospace] text-[11px] text-[#616161] uppercase">Clause ID</th>
                      <th className="px-6 py-3 font-[JetBrains_Mono,monospace] text-[11px] text-[#616161] uppercase">Requirement Summary</th>
                      <th className="px-6 py-3 font-[JetBrains_Mono,monospace] text-[11px] text-[#616161] uppercase">Status</th>
                      <th className="px-6 py-3 font-[JetBrains_Mono,monospace] text-[11px] text-[#616161] uppercase text-center">Severity</th>
                      <th className="px-6 py-3 font-[JetBrains_Mono,monospace] text-[11px] text-[#616161] uppercase">Evidence</th>
                      <th className="px-6 py-3 font-[JetBrains_Mono,monospace] text-[11px] text-[#616161] uppercase">Recommended Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E0E0E0]">
                    {result.gap_analysis.map((gap, i) => (
                      <tr key={i} className={`hover:bg-[#F5F5F5] transition-colors ${gap.status==='COMPLIANT'?'opacity-70':''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`font-['Roboto_Mono',monospace] text-[13px] px-2 py-0.5 rounded border ${gap.status==='COMPLIANT'?'bg-[#FAFAFA] text-[#616161] border-[#E0E0E0]':'bg-[#004D40]/10 text-[#004D40] border-[#004D40]/20'}`}>
                            {gap.regulation_id}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className={`max-w-xs font-medium ${gap.status==='COMPLIANT'?'text-[#616161]':'text-[#212121]'}`}>{gap.requirement}</p>
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
                                <span className="bg-[#F5F5F5] border border-[#E0E0E0] px-2 py-0.5 rounded-full text-[10px] font-[JetBrains_Mono,monospace] flex items-center text-[#616161]">
                                  <span className="material-symbols-outlined text-[10px] mr-1">attach_file</span> {gap.evidence_doc}
                                </span>
                            </div>
                          ) : (
                            <span className="text-[#616161]/40 italic text-[10px]">No document attached</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className={`text-[12px] italic ${gap.status==='COMPLIANT'?'text-[#616161]/60':'text-[#616161]'}`}>{gap.recommended_action}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-[#F5F5F5] px-6 py-3 border-t border-[#E0E0E0] flex justify-between items-center">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-[#2E7D32]"></span>
                    <span className="text-[10px] font-[JetBrains_Mono,monospace] text-[#616161]">CONFORMANCE: 84.2%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
        
        {/* Footer */}
        <footer className="h-8 bg-[#F5F5F5] border-t border-[#E0E0E0] flex items-center justify-between px-6 z-20 shrink-0">
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

export default CompliancePage;
