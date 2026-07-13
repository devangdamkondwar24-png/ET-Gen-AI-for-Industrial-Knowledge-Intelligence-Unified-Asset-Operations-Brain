import React, { useState, useEffect } from 'react';
import { runComplianceCheck, type ComplianceResponse } from '../api/agents';
import { useAppContext } from '../context/AppContext';

const CompliancePage: React.FC = () => {
  const {} = useAppContext();
  const [plant, setPlant] = useState('Plant-101');
  const [standard, setStandard] = useState('Factory Act 1948');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ComplianceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const it = setInterval(() => {
      const now = new Date();
      setTimeStr(`${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,'0')}-${String(now.getUTCDate()).padStart(2,'0')} ${String(now.getUTCHours()).padStart(2,'0')}:${String(now.getUTCMinutes()).padStart(2,'0')}:${String(now.getUTCSeconds()).padStart(2,'0')}`);
    }, 1000);
    return () => clearInterval(it);
  }, []);

  const runCheck = async () => {
    if (!plant.trim() || !standard.trim()) return;
    setIsLoading(true); setError(null); setResult(null);
    try {
      const r = await runComplianceCheck(plant.trim(), [standard.trim()]);
      setResult(r);
    } catch(e: unknown) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  const gapCount = result?.gap_analysis?.filter(g => g.status !== 'COMPLIANT').length ?? 0;
  const totalCount = result?.gap_analysis?.length ?? 42;
  const compliantCount = totalCount - gapCount;
  const scorePercent = totalCount > 0 ? Math.round((compliantCount / totalCount) * 100) : 78;
  const filledSegments = Math.round((scorePercent / 100) * 10);

  return (
    <div className="flex-1 relative overflow-y-auto hide-scrollbar h-full">
      <main className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop pt-8 pb-32 space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-background">
              Compliance Mode
            </h1>
            <p className="font-label-sm text-label-sm text-primary-container uppercase tracking-widest mt-1 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings:"'FILL' 1"}}>verified_user</span>
              Active Framework: {standard}
            </p>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm bg-surface-container-low px-4 py-2 technical-border">
            <span className="material-symbols-outlined text-[18px]">history</span>
            LAST SCAN: {timeStr || '—'}
          </div>
        </div>

        {/* Query Controls */}
        <div className="bg-surface-container-low technical-border p-4 flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-outline uppercase">Plant ID</label>
            <input type="text" value={plant} onChange={e => setPlant(e.target.value)}
              className="bg-surface border border-outline-variant px-3 py-2 font-label-sm text-label-sm text-on-surface outline-none focus:border-primary-container transition-colors w-40" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-label-sm text-outline uppercase">Framework</label>
            <input type="text" value={standard} onChange={e => setStandard(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runCheck()}
              className="bg-surface border border-outline-variant px-3 py-2 font-label-sm text-label-sm text-on-surface outline-none focus:border-primary-container transition-colors w-56" />
          </div>
          <button onClick={runCheck} disabled={isLoading || !plant.trim() || !standard.trim()}
            className="h-touch-target px-8 bg-primary-container text-on-primary-container font-label-md text-label-md hover:brightness-110 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
            {isLoading
              ? <><span className="material-symbols-outlined text-sm animate-spin">sync</span>Scanning…</>
              : <><span className="material-symbols-outlined text-sm">fact_check</span>Run Audit Check</>}
          </button>
          {result && (
            <a href={`http://localhost:8000/api/compliance/report?plant=${plant}&framework=${standard}`}
              target="_blank" rel="noopener noreferrer"
              className="h-touch-target px-6 bg-secondary-container text-on-secondary-container font-label-md text-label-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-2 uppercase">
              <span className="material-symbols-outlined" style={{fontVariationSettings:"'FILL' 1"}}>picture_as_pdf</span>
              <span className="hidden sm:inline">Export PDF</span>
            </a>
          )}
        </div>

        {error && (
          <div className="bg-error-container/20 border border-error text-error px-4 py-3 font-label-sm text-label-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">error</span>{error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Overview Score */}
          <section className="lg:col-span-12">
            <div className="bg-surface-container-low technical-border p-6 relative overflow-hidden">
              <div className="absolute top-2 right-4 font-label-sm text-label-sm text-outline-variant">MOD-COMP-OVERVIEW</div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-4">
                  <h3 className="font-headline-md text-headline-md text-on-background">Overall Compliance Score</h3>
                  <div className="flex items-end gap-3">
                    <span className="font-headline-xl text-headline-xl text-primary-container">{scorePercent}%</span>
                    <span className="font-label-md text-label-md text-on-surface-variant pb-2">
                      {result ? `Compliant across ${compliantCount} of ${totalCount} parameters` : 'Compliant across 42 parameters'}
                    </span>
                  </div>
                </div>
                <div className="flex-1 max-w-2xl">
                  <div className="flex justify-between mb-2 font-label-sm text-label-sm text-on-surface-variant">
                    <span>PROGRESS TRACKER</span><span>GOAL: 100%</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({length: 10}, (_, i) => (
                      <div key={i} className={`flex-1 h-8 ${i < filledSegments ? 'bg-primary-container' : 'bg-primary-container/20 border border-primary-container/30'}`} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Gap Cards */}
          <section className="lg:col-span-8 space-y-gutter">
            <h2 className="font-label-md text-label-md text-on-surface-variant border-l-2 border-primary-container pl-3">
              IDENTIFIED COMPLIANCE GAPS [{String(result ? gapCount : '—').padStart(2, '0')}]
            </h2>

            {!result && !isLoading && (
              <>
                {[
                  { status: 'NON-COMPLIANT', title: 'Sect 21: Fencing of Machinery', conf: '94%', severity: 'error', evidence: '"Visual telemetry indicates absence of physical barriers on Unit-04 Lathe spindle assembly."', docs: ['2 Assets', 'Log-672'], action: 'REMEDIATE', filled: true },
                  { status: 'OBSERVATION', title: 'Sect 11: Cleanliness', conf: '81%', severity: 'tertiary', evidence: '"Cumulative dust buildup observed on non-operational surfaces in Zone-B."', docs: ['Clean_Log_V2'], action: 'ACKNOWLEDGE', filled: false },
                ].map((card, i) => (
                  <div key={i} className={`bg-surface-container-low technical-border hover:bg-surface-container border-l-4 transition-colors ${card.filled ? 'border-l-error' : 'border-l-tertiary-container'}`}>
                    <div className="p-6 space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`font-label-sm text-label-sm px-3 py-1 rounded-sm ${card.filled ? 'bg-error-container text-on-error-container' : 'bg-tertiary-container text-on-tertiary-container'}`}>{card.status}</span>
                          <h4 className="font-headline-md text-headline-md text-on-background mt-3">{card.title}</h4>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="font-label-sm text-label-sm text-on-surface-variant">CONFIDENCE</div>
                          <div className="font-headline-md text-headline-md text-primary-container">{card.conf}</div>
                        </div>
                      </div>
                      <div className="bg-surface-container-lowest p-4 border border-outline-variant/30 italic text-on-surface-variant border-l-2 border-l-outline">{card.evidence}</div>
                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-outline-variant">
                        <div className="flex items-center gap-4 font-label-sm text-label-sm text-on-surface-variant">
                          {card.docs.map(d => <span key={d} className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">description</span>{d}</span>)}
                        </div>
                        <button className={`h-touch-target px-8 font-label-md text-label-md active:scale-95 transition-all ${card.filled ? 'bg-primary-container text-on-primary-container hover:brightness-110' : 'border border-primary-container text-primary-container hover:bg-primary-container/10'}`}>{card.action}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {isLoading && (
              <div className="bg-surface-container-low technical-border p-12 flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-[48px] text-primary-container animate-spin">sync</span>
                <p className="font-label-md text-label-md text-primary-container">Scanning compliance database…</p>
              </div>
            )}

            {result?.gap_analysis?.map((gap, i) => {
              const isCritical = gap.severity === 'CRITICAL';
              const isObservation = gap.severity === 'HIGH';
              return (
                <div key={i} className={`bg-surface-container-low technical-border hover:bg-surface-container transition-colors border-l-4 ${isCritical ? 'border-l-error' : isObservation ? 'border-l-tertiary-container' : 'border-l-primary-container'}`}>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`font-label-sm text-label-sm px-3 py-1 rounded-sm ${isCritical ? 'bg-error-container text-on-error-container' : isObservation ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-primary-container/20 text-primary-container'}`}>{gap.status}</span>
                        <h4 className="font-headline-md text-headline-md text-on-background mt-3">{gap.regulation_id}: {gap.requirement?.slice(0, 60)}…</h4>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-label-sm text-label-sm text-on-surface-variant">SEVERITY</div>
                        <div className={`font-headline-md text-headline-md ${isCritical ? 'text-error' : isObservation ? 'text-tertiary-container' : 'text-primary-container'}`}>{gap.severity}</div>
                      </div>
                    </div>
                    {gap.recommended_action && (
                      <div className="bg-surface-container-lowest p-4 border border-outline-variant/30 italic text-on-surface-variant border-l-2 border-l-outline">
                        "{gap.recommended_action}"
                      </div>
                    )}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-outline-variant">
                      <div className="flex items-center gap-4 font-label-sm text-label-sm text-on-surface-variant">
                        {gap.evidence_doc && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">attach_file</span>{gap.evidence_doc}</span>}
                      </div>
                      <button className={`h-touch-target px-8 font-label-md text-label-md active:scale-95 transition-all ${isCritical ? 'bg-primary-container text-on-primary-container hover:brightness-110' : 'border border-primary-container text-primary-container hover:bg-primary-container/10'}`}>
                        {isCritical ? 'REMEDIATE' : 'ACKNOWLEDGE'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>

          {/* Evidence Locker */}
          <section className="lg:col-span-4 space-y-gutter">
            <h2 className="font-label-md text-label-md text-on-surface-variant border-l-2 border-primary-container pl-3">EVIDENCE LOCKER</h2>
            <div className="bg-surface-container-low technical-border divide-y divide-outline-variant overflow-hidden">
              {[
                { name: 'LATHE_U4_SAFETY.JPG', sub: 'Captured 09:30 AM', icon: 'image', action: 'open_in_new' },
                { name: 'SENSOR_LOG_R67.CSV', sub: 'Stream Data: 24h', icon: 'receipt_long', action: 'download' },
                { name: 'SAFETY_CERT_2023.PDF', sub: 'External Audit', icon: 'picture_as_pdf', action: 'verified' },
              ].map(item => (
                <div key={item.name} className="p-4 hover:bg-surface-container transition-colors group cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-container-highest flex items-center justify-center technical-border shrink-0">
                      <span className="material-symbols-outlined text-primary-container">{item.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-label-md text-label-md text-on-background truncate">{item.name}</div>
                      <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">{item.sub}</div>
                    </div>
                    <span className="material-symbols-outlined text-outline-variant group-hover:text-primary-container">{item.action}</span>
                  </div>
                </div>
              ))}
            </div>
            {/* Trend chart */}
            <div className="bg-surface-container-low technical-border p-4 h-48 flex flex-col justify-between">
              <div className="font-label-sm text-label-sm text-on-surface-variant uppercase flex justify-between">
                <span>Compliance Trend</span><span className="text-primary-container">LIVE</span>
              </div>
              <div className="flex items-end justify-between h-24 gap-1">
                {[0.5, 0.67, 0.5, 0.75, 1.0, 0.8].map((h, i) => (
                  <div key={i} className="w-full transition-colors hover:opacity-80"
                    style={{height: `${h * 100}%`, background: i === 4 ? '#00f0ff' : `rgba(0,240,255,${h * 0.6})`}} />
                ))}
              </div>
              <div className="font-label-sm text-label-sm text-outline-variant flex justify-between">
                <span>W12</span><span>W13</span><span>W14</span><span>NOW</span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CompliancePage;
