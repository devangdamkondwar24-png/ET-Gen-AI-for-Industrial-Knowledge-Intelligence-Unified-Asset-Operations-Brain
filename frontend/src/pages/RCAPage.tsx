import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import { runRcaAnalysis, type RCAResponse, type RCAHypothesis } from '../api/agents';
import { useAppContext } from '../context/AppContext';

// ── Confidence badge colors ────────────────────────────────────────────────────
const confBadge: Record<string, string> = {
  HIGH: 'bg-[#00f0ff] text-[#002022]',
  MEDIUM: 'bg-[#FFB300] text-[#e2e2e5]',
  LOW: 'bg-[#EEEEEE] text-[#849495]',
};

// ── Hypothesis card ──────────────────────────────────────────────────────────
const HypCard: React.FC<{hyp: RCAHypothesis; active: boolean; onClick: ()=>void}> = ({hyp, active, onClick}) => (
  <div onClick={onClick} style={active?{borderLeft:'4px solid #004D40', background:'#F1F8F7'}:{}}
    className={`p-4 border border-[#333537] cursor-pointer transition-all ${active?'':'bg-[#121416] hover:bg-[#EEEEEE]'}`}>
    <div className="flex justify-between items-start mb-2">
      <span className="text-[10px] text-[#00f0ff] px-2 py-0.5 bg-[#00f0ff]/10 rounded border border-[#00f0ff]/10" style={{fontFamily:'JetBrains Mono,monospace'}}>{hyp.id}</span>
      <div className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${confBadge[hyp.confidence_label]??confBadge.LOW}`}>
        <span className="material-symbols-outlined text-[12px]">{hyp.confidence_label==='HIGH'?'verified':'warning'}</span>
        {hyp.confidence_label} CONFIDENCE
      </div>
    </div>
    <h4 className="text-[16px] md:text-[18px] font-semibold text-[#e2e2e5] mb-1" style={{lineHeight:1.4}}>{hyp.title}</h4>
    <p className="text-[#849495] text-[12px] md:text-[13px] mb-4 leading-[1.5]">{hyp.description}</p>
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-24 md:w-32 h-1.5 bg-[#333537] rounded-full overflow-hidden">
          <div className="bg-[#00f0ff] h-full" style={{width:`${hyp.confidence}%`}}/>
        </div>
        <span className="text-[#00f0ff] text-[12px]" style={{fontFamily:'JetBrains Mono,monospace'}}>{hyp.confidence}%</span>
      </div>
      <span className="material-symbols-outlined text-[#00f0ff]">arrow_forward_ios</span>
    </div>
  </div>
);

// ── RCA Page ──────────────────────────────────────────────────────────────────
const RCAPage: React.FC = () => {
  const { isTechMode } = useAppContext();
  const [assetId, setAssetId] = useState('P-101');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RCAResponse | null>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    if (!assetId.trim() || !query.trim()) return;
    setIsLoading(true); setError(null); setResult(null);
    try {
      const r = await runRcaAnalysis(assetId.trim(), query.trim());
      setResult(r); setActiveIdx(0);
    } catch(e:unknown){ setError(e instanceof Error ? e.message : 'Unknown error'); }
    finally { setIsLoading(false); }
  };

  const activeHyp = result?.hypotheses?.[activeIdx];

  return (
    <div className="flex h-screen overflow-hidden" style={{fontFamily:'Inter,sans-serif', background:'#FFFFFF', color:'#212121'}}>
      <Sidebar />
      {/* Header */}
      <header className={`fixed top-0 right-0 w-full ${isTechMode ? 'md:w-[calc(100%-80px)]' : 'md:w-[calc(100%-240px)]'} h-12 bg-[#1a1c1e] border-b border-[#333537] flex justify-between items-center px-[16px] md:px-[24px] z-10 transition-all duration-300`}>
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-[#00f0ff]">search</span>
          <span className="text-[14px] text-[#849495]">RCA Report: {assetId || '—'}</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[10px] text-[#00f0ff] bg-[#00f0ff]/10 px-2 py-0.5 rounded border border-[#00f0ff]/20" style={{fontFamily:'JetBrains Mono,monospace'}}>SYSTEM STABLE</span>
          <div className="flex items-center gap-4 text-[#849495]">
            <span className="material-symbols-outlined hover:text-[#00f0ff] cursor-pointer transition-colors">notifications</span>
            <span className="material-symbols-outlined hover:text-[#00f0ff] cursor-pointer transition-colors">help_outline</span>
            <span className="material-symbols-outlined hover:text-[#00f0ff] cursor-pointer transition-colors">account_circle</span>
          </div>
          <span className="font-semibold text-[#e2e2e5] text-[14px]">RCA Engine v2.4</span>
        </div>
      </header>

      {/* Main */}
      <main className={`w-full ${isTechMode ? 'md:ml-[80px]' : 'md:ml-[240px]'} pt-12 min-h-screen p-[16px] md:p-[24px] bg-[#1a1c1e] flex flex-col transition-all duration-300 pb-20 md:pb-0`}>
        {/* Query bar (new for interactive version) */}
        <div className="mb-[16px] flex items-end gap-3 pb-4 border-b border-[#333537]">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase text-[#849495] font-bold" style={{fontFamily:'JetBrains Mono,monospace'}}>Asset ID</label>
            <input id="rca-asset-id" type="text" value={assetId} onChange={e=>setAssetId(e.target.value)}
              className="px-3 py-2 border border-[#333537] rounded text-sm w-32 outline-none focus:border-[#00f0ff] bg-[#121416]"/>
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-[10px] uppercase text-[#849495] font-bold" style={{fontFamily:'JetBrains Mono,monospace'}}>Failure Query</label>
            <input id="rca-query" type="text" value={query} onChange={e=>setQuery(e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&runAnalysis()}
              placeholder="e.g. Why did pump P-101 experience a seal failure?"
              className="px-3 py-2 border border-[#333537] rounded text-sm outline-none focus:border-[#00f0ff] bg-[#121416]"/>
          </div>
          <button id="btn-run-rca" onClick={runAnalysis} disabled={isLoading||!assetId.trim()||!query.trim()}
            className="bg-[#00f0ff] text-[#002022] px-5 py-2 rounded font-bold text-sm flex items-center gap-2 hover:bg-[#00695C] disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition-all shadow-sm">
            {isLoading
              ? <><span className="material-symbols-outlined text-sm animate-spin">sync</span>Running…</>
              : <><span className="material-symbols-outlined text-sm">analytics</span>Run Analysis</>}
          </button>
        </div>

        {/* Context header (matches Stitch) */}
        <div className="mb-[16px] flex items-end justify-between">
          <div>
            <nav className="flex text-[11px] text-[#849495] gap-2 mb-1 uppercase tracking-tighter">
              <span>Manufacturing</span><span>/</span><span>Fluid Handling</span><span>/</span>
              <span className="text-[#00f0ff] font-bold">{assetId}</span>
            </nav>
            <h2 className="text-[32px] font-semibold text-[#e2e2e5]" style={{letterSpacing:'-0.02em',lineHeight:1.2}}>
              {result ? 'Pump Assembly Analysis' : 'Enter a Query Above'}
            </h2>
          </div>
          {result && (
            <div className="flex gap-2">
              <div className="bg-[#121416] px-4 py-2 border border-[#333537] flex items-center gap-4">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#849495] uppercase">Hypotheses</span>
                  <span className="text-[#00f0ff] font-bold" style={{fontFamily:'JetBrains Mono,monospace'}}>{result.hypotheses?.length ?? 0}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>}

        {!result && !isLoading && !error && (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-3">
              <span className="material-symbols-outlined text-[64px] text-[#E0E0E0] block">analytics</span>
              <p className="text-[#e2e2e5] font-semibold">No Analysis Run Yet</p>
              <p className="text-[#849495] text-sm">Enter an Asset ID and failure query above, then click "Run Analysis".</p>
            </div>
          </div>
        )}

        {result && (
          <div className="grid grid-cols-12 gap-[16px]" style={{height:'calc(100vh - 280px)'}}>
            {/* Left: Hypotheses list */}
            <section className="col-span-4 flex flex-col gap-[16px]">
              <div className="bg-[#1a1c1e] border border-[#333537] p-[20px] flex-1 overflow-y-auto relative">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[18px] font-semibold text-[#e2e2e5] flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#00f0ff]">analytics</span>
                    Generated Hypotheses
                  </h3>
                  <span className="text-[10px] text-[#849495]" style={{fontFamily:'JetBrains Mono,monospace'}}>{result.hypotheses?.length ?? 0} RESULTS</span>
                </div>
                <div className="space-y-[16px]">
                  {result.hypotheses?.length > 0
                    ? result.hypotheses.map((h,i)=><HypCard key={i} hyp={h} active={i===activeIdx} onClick={()=>setActiveIdx(i)}/>)
                    : <p className="text-[#849495] text-sm">No hypotheses generated.</p>}
                </div>
                <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-white to-transparent pointer-events-none"/>
              </div>
            </section>

            {/* Right: Evidence panel */}
            <section className="col-span-8 h-full">
              <div className="bg-[#1a1c1e] border border-[#333537] h-full flex flex-col overflow-hidden">
                <div className="p-4 border-b border-[#333537] flex items-center justify-between bg-[#121416]">
                  <div className="flex items-center gap-4">
                    <h3 className="text-[18px] font-semibold text-[#e2e2e5]">Evidence & Citations</h3>
                  </div>
                  <button className="bg-[#00f0ff] text-[#002022] px-3 py-1 rounded text-[11px] font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[14px]">save</span>
                    EXPORT REPORT
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-[20px]">
                  {activeHyp ? (
                    <div className="space-y-5">
                      <div className="pb-4 border-b border-[#333537]">
                        <h2 className="text-[24px] font-semibold text-[#e2e2e5]">{activeHyp.title}</h2>
                        <p className="text-[#849495] text-[14px] mt-2 leading-[1.5]">{activeHyp.description}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-[#e2e2e5] mb-3 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[#00f0ff] text-base">verified</span>
                          Evidence Sources
                        </h4>
                        {activeHyp.citations?.length > 0 ? (
                          <div className="space-y-2">
                            {activeHyp.citations.map((c,i)=>(
                              <div key={i} className="p-3 bg-[#121416] rounded border border-[#333537]">
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-[11px] text-[#00f0ff]" style={{fontFamily:'JetBrains Mono,monospace'}}>{c.doc_id} — Page {c.page}</span>
                                  <span className="text-[10px] bg-[#00f0ff]/10 text-[#00f0ff] px-2 py-0.5 rounded font-bold border border-[#00f0ff]/10">Score: {c.score.toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-[#849495] leading-relaxed">"{c.text_preview}"</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          // Stitch-style "Work Order" placeholder card
                          <div className="bg-[#1a1c1e] border border-[#00f0ff]/20 p-4 rounded-xl shadow-md max-w-xs">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="material-symbols-outlined text-[#00f0ff] text-[18px]">verified</span>
                              <span className="font-bold text-[#e2e2e5] text-[13px]">No evidence loaded yet</span>
                            </div>
                            <p className="text-[11px] text-[#849495] leading-relaxed">Run the analysis with a live asset query to populate evidence from Neo4j and Elasticsearch.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-[#849495]">Select a hypothesis from the left to view evidence.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
};

export default RCAPage;
