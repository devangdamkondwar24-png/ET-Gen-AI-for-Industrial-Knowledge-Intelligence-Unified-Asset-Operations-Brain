import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { runRcaAnalysis, type RCAResponse, type RCAHypothesis } from '../api/agents';

const confidenceColors: Record<string, string> = {
  HIGH: 'bg-green-100 text-green-800 border-green-300',
  MEDIUM: 'bg-amber-100 text-amber-800 border-amber-300',
  LOW: 'bg-gray-100 text-gray-600 border-gray-300',
};

const HypothesisCard: React.FC<{
  hyp: RCAHypothesis;
  isActive: boolean;
  onClick: () => void;
}> = ({ hyp, isActive, onClick }) => (
  <div
    onClick={onClick}
    className={`p-4 border border-border-muted cursor-pointer transition-all rounded-lg ${
      isActive ? 'border-l-4 border-l-primary bg-primary-container/30' : 'hover:bg-surface'
    }`}
  >
    <div className="flex justify-between items-start mb-2">
      <span className="text-[10px] font-mono text-primary px-2 py-0.5 bg-primary-container rounded">
        {hyp.id}
      </span>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${confidenceColors[hyp.confidence_label]}`}>
        {hyp.confidence_label} CONFIDENCE
      </span>
    </div>
    <h4 className="font-semibold text-on-surface text-sm mb-1">{hyp.title}</h4>
    <p className="text-xs text-text-muted mb-3 leading-relaxed">{hyp.description}</p>
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-border-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full"
          style={{ width: `${hyp.confidence}%` }}
        />
      </div>
      <span className="text-xs font-mono text-primary">{hyp.confidence}%</span>
    </div>
    {hyp.citations?.length > 0 && (
      <div className="mt-2 flex flex-wrap gap-1">
        {hyp.citations.slice(0, 3).map((c, i) => (
          <span key={i} className="text-[10px] px-1.5 py-0.5 border border-primary/30 text-primary rounded font-mono">
            {c.doc_id} p.{c.page}
          </span>
        ))}
      </div>
    )}
  </div>
);

const RCAPage: React.FC = () => {
  const [assetId, setAssetId] = useState('P-101');
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<RCAResponse | null>(null);
  const [activeHypIdx, setActiveHypIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleRunAnalysis = async () => {
    if (!assetId.trim() || !query.trim()) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await runRcaAnalysis(assetId.trim(), query.trim());
      setResult(res);
      setActiveHypIdx(0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to run RCA analysis: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const activeHyp = result?.hypotheses?.[activeHypIdx];

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col">
        <Topbar title={`RCA Report: ${assetId || 'No Asset Selected'}`} />
        <main className="flex-1 pt-12 overflow-hidden flex flex-col">
          {/* Input Bar */}
          <div className="px-6 py-4 border-b border-border-muted bg-surface flex items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase font-semibold text-text-muted">Asset ID</label>
              <input
                id="rca-asset-id"
                type="text"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                placeholder="e.g. P-101"
                className="px-3 py-2 border border-border-muted rounded-lg text-sm w-36 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[11px] uppercase font-semibold text-text-muted">Failure Query</label>
              <input
                id="rca-query"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRunAnalysis()}
                placeholder="e.g. Why did pump P-101 experience a seal failure?"
                className="px-3 py-2 border border-border-muted rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              id="btn-run-rca"
              onClick={handleRunAnalysis}
              disabled={isLoading || !assetId.trim() || !query.trim()}
              className="px-5 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <><span className="material-symbols-outlined animate-spin text-sm">sync</span>Running...</>
              ) : (
                <><span className="material-symbols-outlined text-sm">analytics</span>Run Analysis</>
              )}
            </button>
          </div>

          {/* Content */}
          {error && (
            <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {!result && !isLoading && !error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-3">
                <span className="material-symbols-outlined text-6xl text-border-muted block">query_stats</span>
                <p className="text-on-surface font-semibold">No Analysis Run Yet</p>
                <p className="text-text-muted text-sm max-w-sm">Enter an Asset ID and a failure query above, then click "Run Analysis" to begin.</p>
              </div>
            </div>
          )}

          {result && (
            <div className="flex-1 overflow-hidden grid grid-cols-5 gap-0">
              {/* Hypotheses List */}
              <section className="col-span-2 border-r border-border-muted overflow-y-auto p-4 space-y-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">analytics</span>
                    Generated Hypotheses
                  </h3>
                  <span className="text-[10px] font-mono text-text-muted">
                    {result.hypotheses?.length ?? 0} RESULTS
                  </span>
                </div>
                {result.hypotheses?.length > 0 ? (
                  result.hypotheses.map((hyp, i) => (
                    <HypothesisCard
                      key={i}
                      hyp={hyp}
                      isActive={i === activeHypIdx}
                      onClick={() => setActiveHypIdx(i)}
                    />
                  ))
                ) : (
                  <p className="text-text-muted text-sm">No hypotheses generated.</p>
                )}
              </section>

              {/* Evidence Detail */}
              <section className="col-span-3 overflow-y-auto p-6">
                {activeHyp ? (
                  <div className="space-y-5">
                    <div className="pb-4 border-b border-border-muted">
                      <h2 className="text-xl font-semibold text-on-surface">{activeHyp.title}</h2>
                      <p className="text-text-muted text-sm mt-2 leading-relaxed">{activeHyp.description}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-on-surface mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary text-base">verified</span>
                        Evidence Sources
                      </h4>
                      {activeHyp.citations?.length > 0 ? (
                        <div className="space-y-2">
                          {activeHyp.citations.map((c, i) => (
                            <div key={i} className="p-3 bg-surface rounded-lg border border-border-muted">
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-[11px] font-mono text-primary">{c.doc_id} — Page {c.page}</span>
                                <span className="text-[10px] bg-primary-container text-primary px-2 py-0.5 rounded font-bold">
                                  Score: {c.score.toFixed(2)}
                                </span>
                              </div>
                              <p className="text-xs text-on-surface-variant leading-relaxed">
                                "{c.text_preview}"
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-text-muted text-sm">No evidence sources attached.</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-text-muted">Select a hypothesis from the left to view details.</p>
                  </div>
                )}
              </section>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default RCAPage;
