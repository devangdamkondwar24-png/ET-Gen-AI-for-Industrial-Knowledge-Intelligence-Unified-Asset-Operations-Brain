import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import { runComplianceCheck, type ComplianceResponse, type ComplianceGap } from '../api/agents';

const statusStyles: Record<string, { row: string; badge: string }> = {
  COMPLIANT: {
    row: 'bg-green-50',
    badge: 'bg-green-100 text-green-800 border border-green-300',
  },
  GAP: {
    row: 'bg-amber-50',
    badge: 'bg-amber-100 text-amber-800 border border-amber-300',
  },
  MISSING: {
    row: 'bg-red-50',
    badge: 'bg-red-100 text-red-800 border border-red-300',
  },
};

const severityStyles: Record<string, string> = {
  LOW: 'text-gray-500',
  MEDIUM: 'text-amber-600 font-semibold',
  HIGH: 'text-orange-600 font-bold',
  CRITICAL: 'text-red-600 font-bold',
};

const GapRow: React.FC<{ gap: ComplianceGap }> = ({ gap }) => {
  const styles = statusStyles[gap.status] ?? statusStyles.GAP;
  return (
    <tr className={`border-b border-border-muted hover:brightness-95 transition-all ${styles.row}`}>
      <td className="px-4 py-3 text-xs font-mono text-primary">{gap.regulation_id}</td>
      <td className="px-4 py-3 text-xs font-mono text-on-surface-variant">{gap.clause}</td>
      <td className="px-4 py-3 text-sm text-on-surface max-w-xs">{gap.requirement}</td>
      <td className="px-4 py-3">
        <span className={`text-[11px] font-bold px-2 py-1 rounded ${styles.badge}`}>
          {gap.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs font-mono text-text-muted">{gap.evidence_doc ?? '—'}</td>
      <td className={`px-4 py-3 text-xs ${severityStyles[gap.severity]}`}>{gap.severity}</td>
      <td className="px-4 py-3 text-xs text-on-surface-variant max-w-xs">{gap.recommended_action}</td>
    </tr>
  );
};

const CompliancePage: React.FC = () => {
  const [plantFilter, setPlantFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ComplianceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const handleRunCheck = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await runComplianceCheck(plantFilter.trim() || undefined);
      setResult(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to run compliance check: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGaps = result?.gap_analysis?.filter(
    (g) => filterStatus === 'ALL' || g.status === filterStatus
  ) ?? [];

  const counts = {
    COMPLIANT: result?.gap_analysis?.filter((g) => g.status === 'COMPLIANT').length ?? 0,
    GAP: result?.gap_analysis?.filter((g) => g.status === 'GAP').length ?? 0,
    MISSING: result?.gap_analysis?.filter((g) => g.status === 'MISSING').length ?? 0,
  };

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="flex-1 ml-60 flex flex-col">
        <Topbar title="Regulatory Compliance: ISO 55001" />
        <main className="flex-1 pt-12 overflow-auto">
          {/* Control Bar */}
          <div className="px-6 py-4 border-b border-border-muted bg-surface flex items-end gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] uppercase font-semibold text-text-muted">Plant Filter</label>
              <input
                id="compliance-plant"
                type="text"
                value={plantFilter}
                onChange={(e) => setPlantFilter(e.target.value)}
                placeholder="e.g. Pune_Pilot (leave blank for all)"
                className="px-3 py-2 border border-border-muted rounded-lg text-sm w-64 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <button
              id="btn-run-compliance"
              onClick={handleRunCheck}
              disabled={isLoading}
              className="px-5 py-2 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 disabled:opacity-40 transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <><span className="material-symbols-outlined animate-spin text-sm">sync</span>Checking...</>
              ) : (
                <><span className="material-symbols-outlined text-sm">gavel</span>Run Check</>
              )}
            </button>

            {/* Summary Cards */}
            {result && (
              <div className="ml-auto flex gap-3">
                {Object.entries(counts).map(([status, count]) => (
                  <button
                    key={status}
                    id={`filter-${status.toLowerCase()}`}
                    onClick={() => setFilterStatus(filterStatus === status ? 'ALL' : status)}
                    className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${
                      filterStatus === status
                        ? statusStyles[status]?.badge + ' shadow-sm'
                        : 'bg-white border-border-muted text-on-surface-variant hover:bg-surface'
                    }`}
                  >
                    {status}: <span className="ml-1">{count}</span>
                  </button>
                ))}
                <button
                  id="filter-all"
                  onClick={() => setFilterStatus('ALL')}
                  className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${
                    filterStatus === 'ALL'
                      ? 'bg-primary-container border-primary text-primary'
                      : 'bg-white border-border-muted text-on-surface-variant hover:bg-surface'
                  }`}
                >
                  Total: {result.gap_analysis?.length ?? 0}
                </button>
              </div>
            )}
          </div>

          {error && (
            <div className="mx-6 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {!result && !isLoading && !error && (
            <div className="flex-1 flex items-center justify-center min-h-[60vh]">
              <div className="text-center space-y-3">
                <span className="material-symbols-outlined text-6xl text-border-muted block">gavel</span>
                <p className="text-on-surface font-semibold">No Compliance Check Run Yet</p>
                <p className="text-text-muted text-sm max-w-sm">
                  Optionally set a plant filter, then click "Run Check" to analyse regulatory gaps.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="px-6 py-4">
              <div className="overflow-x-auto rounded-xl border border-border-muted">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface border-b border-border-muted">
                      {['Regulation', 'Clause', 'Requirement', 'Status', 'Evidence Doc', 'Severity', 'Recommended Action'].map(
                        (h) => (
                          <th key={h} className="px-4 py-3 text-[11px] uppercase text-text-muted font-bold tracking-wide">
                            {h}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGaps.length > 0 ? (
                      filteredGaps.map((gap, i) => <GapRow key={i} gap={gap} />)
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-text-muted text-sm">
                          No items match the current filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CompliancePage;
