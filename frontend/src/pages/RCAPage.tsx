import React, { useState } from 'react';
import { runRcaAnalysis, type RCAResponse, type RCAHypothesis } from '../api/agents';

const confBadge: Record<string, string> = {
  HIGH: 'bg-primary-container text-on-primary-container',
  MEDIUM: 'bg-secondary-container text-on-secondary-container',
  LOW: 'bg-surface-container-highest text-on-surface-variant',
};

const HypCard: React.FC<{hyp: RCAHypothesis; active: boolean; onClick: () => void}> = ({hyp, active, onClick}) => (
  <div
    onClick={onClick}
    className={`technical-border cursor-pointer transition-all hover:bg-surface-container border-l-4 ${active ? 'active-module-border bg-surface-container border-l-primary-container' : 'bg-surface-container-low border-l-transparent'}`}
  >
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-start">
        <span className="font-label-sm text-label-sm text-primary-container bg-primary-container/10 px-2 py-0.5 border border-primary-container/20">{hyp.id}</span>
        <div className={`font-label-sm text-label-sm px-2 py-0.5 flex items-center gap-1 ${confBadge[hyp.confidence_label] ?? confBadge.LOW}`}>
          <span className="material-symbols-outlined text-[12px]">{hyp.confidence_label === 'HIGH' ? 'verified' : 'warning'}</span>
          {hyp.confidence_label}
        </div>
      </div>
      <h4 className="font-headline-md text-headline-md text-on-background text-[18px] leading-snug">{hyp.title}</h4>
      <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">{hyp.description}</p>
      <div className="flex items-center gap-3 pt-1">
        <div className="flex-1 h-1.5 bg-surface-container-highest overflow-hidden">
          <div className="bg-primary-container h-full transition-all" style={{width: `${hyp.confidence}%`}} />
        </div>
        <span className="font-label-sm text-label-sm text-primary-container shrink-0">{hyp.confidence}%</span>
        <span className="material-symbols-outlined text-primary-container text-sm">arrow_forward_ios</span>
      </div>
    </div>
  </div>
);

const RCAPage: React.FC = () => {
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
    } catch(e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const activeHyp = result?.hypotheses?.[activeIdx];

  return (
    <div className="flex-1 relative overflow-y-auto hide-scrollbar h-full">
      <main className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop pt-8 pb-32 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background">
              Root Cause Analysis
            </h1>
            <p className="font-label-sm text-label-sm text-primary-container uppercase tracking-widest mt-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">analytics</span>
              Asset: {assetId || '—'}
            </p>
          </div>
          {result && (
            <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low px-4 py-2 technical-border">
              <span className="material-symbols-outlined text-primary-container text-[18px]">analytics</span>
              {result.hypotheses?.length ?? 0} HYPOTHESES GENERATED
            </div>
          )}
        </div>

        {/* Query Bar */}
        <div className="bg-surface-container-low technical-border p-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-outline uppercase">Asset ID</label>
            <input id="rca-asset-id" type="text" value={assetId} onChange={e => setAssetId(e.target.value)}
              className="bg-surface border border-outline-variant px-3 py-2 font-label-sm text-label-sm text-on-surface outline-none focus:border-primary-container transition-colors w-32" />
          </div>
          <div className="flex-1 flex flex-col gap-1 min-w-[200px]">
            <label className="font-label-sm text-label-sm text-outline uppercase">Failure Query</label>
            <input id="rca-query" type="text" value={query} onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runAnalysis()}
              placeholder="e.g. Why did pump P-101 experience a seal failure?"
              className="bg-surface border border-outline-variant px-3 py-2 font-label-sm text-label-sm text-on-surface outline-none focus:border-primary-container transition-colors placeholder:text-outline" />
          </div>
          <button id="btn-run-rca" onClick={runAnalysis} disabled={isLoading || !assetId.trim() || !query.trim()}
            className="h-touch-target px-8 bg-primary-container text-on-primary-container font-label-md text-label-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
            {isLoading
              ? <><span className="material-symbols-outlined text-sm animate-spin">sync</span>Running…</>
              : <><span className="material-symbols-outlined text-sm">analytics</span>Run Analysis</>}
          </button>
        </div>

        {error && (
          <div className="bg-error-container/20 border border-error text-error px-4 py-3 font-label-sm text-label-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>{error}
          </div>
        )}

        {/* Idle state */}
        {!result && !isLoading && !error && (
          <div className="bg-surface-container-low technical-border p-16 flex flex-col items-center gap-4 text-center">
            <span className="material-symbols-outlined text-[64px] text-outline">analytics</span>
            <p className="font-headline-md text-headline-md text-on-surface-variant">No Analysis Run Yet</p>
            <p className="font-body-md text-on-surface-variant/60">Enter an Asset ID and failure query above, then click "Run Analysis".</p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div className="bg-surface-container-low technical-border p-16 flex flex-col items-center gap-4">
            <span className="material-symbols-outlined text-[64px] text-primary-container animate-spin">sync</span>
            <p className="font-label-md text-label-md text-primary-container">Running RCA Engine…</p>
          </div>
        )}

        {/* Results Grid */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter" style={{minHeight: '60vh'}}>
            {/* Hypotheses List */}
            <section className="lg:col-span-4 space-y-gutter">
              <h2 className="font-label-md text-label-md text-on-surface-variant border-l-2 border-primary-container pl-3">
                GENERATED HYPOTHESES [{result.hypotheses?.length ?? 0}]
              </h2>
              <div className="space-y-3 custom-scrollbar overflow-y-auto" style={{maxHeight: '65vh'}}>
                {result.hypotheses?.length > 0
                  ? result.hypotheses.map((h, i) => (
                      <HypCard key={i} hyp={h} active={i === activeIdx} onClick={() => setActiveIdx(i)} />
                    ))
                  : <p className="font-label-sm text-label-sm text-on-surface-variant p-4 technical-border">No hypotheses generated.</p>}
              </div>
            </section>

            {/* Evidence Panel */}
            <section className="lg:col-span-8">
              <div className="bg-surface-container-low technical-border flex flex-col" style={{minHeight: '65vh'}}>
                <div className="p-4 border-b border-outline-variant bg-surface-container flex items-center justify-between">
                  <h3 className="font-label-md text-label-md uppercase">Evidence & Citations</h3>
                  <button className="h-touch-target px-6 bg-primary-container text-on-primary-container font-label-md text-label-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">save</span>EXPORT REPORT
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {activeHyp ? (
                    <div className="space-y-6">
                      <div className="pb-4 border-b border-outline-variant">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="font-label-sm text-label-sm text-primary-container bg-primary-container/10 px-2 py-0.5 border border-primary-container/20">{activeHyp.id}</span>
                          <span className={`font-label-sm text-label-sm px-2 py-0.5 ${confBadge[activeHyp.confidence_label] ?? confBadge.LOW}`}>{activeHyp.confidence_label} CONFIDENCE</span>
                        </div>
                        <h2 className="font-headline-md text-headline-md text-on-background">{activeHyp.title}</h2>
                        <p className="font-body-md text-on-surface-variant mt-2 leading-relaxed">{activeHyp.description}</p>
                      </div>

                      <div>
                        <h4 className="font-label-md text-label-md text-on-surface-variant border-l-2 border-primary-container pl-3 mb-4">EVIDENCE SOURCES</h4>
                        {activeHyp.citations?.length > 0 ? (
                          <div className="space-y-3">
                            {activeHyp.citations.map((c, i) => (
                              <div key={i} className="bg-surface technical-border p-4">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-label-sm text-label-sm text-primary-container">{c.doc_id} — Page {c.page}</span>
                                  <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container-high px-2 py-0.5">Score: {c.score.toFixed(2)}</span>
                                </div>
                                <p className="font-body-md text-sm text-on-surface-variant leading-relaxed">"{c.text_preview}"</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-surface technical-border p-6 flex flex-col items-center gap-3 text-center">
                            <span className="material-symbols-outlined text-[40px] text-outline">article</span>
                            <p className="font-label-md text-label-md text-on-surface-variant">No evidence loaded yet</p>
                            <p className="font-label-sm text-label-sm text-outline">Run the analysis with a live asset query to populate evidence from Neo4j and Elasticsearch.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-[300px]">
                      <p className="font-label-md text-label-md text-on-surface-variant">Select a hypothesis from the left to view evidence.</p>
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
