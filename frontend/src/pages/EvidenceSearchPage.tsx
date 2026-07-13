import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

interface SearchResult {
  title: string;
  doc_type: string;
  linked_asset: string;
  page: number;
  snippet: string;
  confidence: number;
  indexed_ago: string;
  highlight?: string;
}

const DEMO_RESULTS: SearchResult[] = [
  {
    title: 'OISD-STD-105: Work Permit System',
    doc_type: 'OISD Manual',
    linked_asset: 'Pump P-101',
    page: 42,
    snippet: 'A Hot Work Permit must be issued before any welding or cutting operations in a hazardous area. The permit is valid for a maximum of 24 hours and must be renewed daily.',
    confidence: 0.98,
    indexed_ago: '24h ago',
    highlight: 'Hot Work Permit',
  },
  {
    title: 'Factories Act 1948 — Chapter IV: Safety',
    doc_type: 'Regulatory',
    linked_asset: 'Plant General',
    page: 21,
    snippet: 'Section 21 mandates that every dangerous part of machinery shall be securely fenced by safeguards of substantial construction kept in position while the machinery is in motion.',
    confidence: 0.94,
    indexed_ago: '3d ago',
    highlight: 'fenced by safeguards',
  },
  {
    title: 'Pump P-101 Maintenance Manual Rev. C',
    doc_type: 'Technical Manual',
    linked_asset: 'Pump P-101',
    page: 7,
    snippet: 'Bearing temperature must not exceed 85°C during continuous operation. If temperature exceeds 80°C, reduce load and inspect lubrication immediately.',
    confidence: 0.87,
    indexed_ago: '12h ago',
    highlight: '85°C',
  },
  {
    title: 'Incident Report — INC-2024-072',
    doc_type: 'Incident Report',
    linked_asset: 'Tank T-502',
    page: 3,
    snippet: 'Pressure drop event on 14-Jan-2024. Root cause identified as blocked suction strainer on Pump P-101. Corrective action: strainer cleaned and standby pump activated.',
    confidence: 0.91,
    indexed_ago: '7d ago',
    highlight: 'blocked suction strainer',
  },
];

const DOC_TYPE_COLORS: Record<string, string> = {
  'OISD Manual': 'text-[#00f0ff] border-[#00f0ff]/40 bg-[#00f0ff]/10',
  'Regulatory': 'text-[#ffd602] border-[#ffd602]/40 bg-[#ffd602]/10',
  'Technical Manual': 'text-[#ffb77f] border-[#ffb77f]/40 bg-[#ffb77f]/10',
  'Incident Report': 'text-[#ffb4ab] border-[#ffb4ab]/40 bg-[#ffb4ab]/10',
};

const ConfBadge: React.FC<{ score: number }> = ({ score }) => {
  const pct = Math.round(score * 100);
  const color = score > 0.9 ? 'text-[#4caf50] bg-[#4caf50]/10 border-[#4caf50]/30' : score > 0.7 ? 'text-[#ffd602] bg-[#ffd602]/10 border-[#ffd602]/30' : 'text-[#ffb4ab] bg-[#ffb4ab]/10 border-[#ffb4ab]/30';
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${color}`}>{pct}% CONF</span>;
};

const highlightSnippet = (text: string, term?: string) => {
  if (!term) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${term})`, 'gi'));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === term.toLowerCase()
          ? <mark key={i} className="bg-[#00f0ff]/20 text-[#00f0ff] not-italic px-0.5 rounded">{p}</mark>
          : <span key={i}>{p}</span>
      )}
    </>
  );
};

const EvidenceSearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    if (!query.trim()) return;
    setLoading(true);
    setSubmitted(query.trim());
    // Simulate search delay
    setTimeout(() => {
      setResults(DEMO_RESULTS);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#121416]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <main className="fixed top-0 right-0 w-full md:w-[calc(100%-240px)] h-full flex flex-col transition-all duration-300 pb-16 md:pb-0">
        {/* Header */}
        <header className="h-14 bg-[#1a1c1e] border-b border-[#333537] flex items-center justify-between px-4 md:px-6 z-20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#00f0ff]">manage_search</span>
            <span className="text-[#00f0ff] font-bold text-[13px] hidden md:inline" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              EVIDENCE SEARCH
            </span>
          </div>
          <span className="text-[10px] text-[#849495] font-mono">{results.length > 0 ? `${results.length} RESULTS` : 'READY'}</span>
        </header>

        {/* Search bar */}
        <div className="bg-[#1a1c1e] border-b border-[#333537] px-4 md:px-6 py-4">
          <div className="max-w-3xl mx-auto flex gap-3 items-center">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#849495]">search</span>
              <input
                id="evidence-search-input"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search documents, manuals, or assets..."
                className="w-full bg-[#0c0e10] border border-[#333537] rounded text-[#e2e2e5] pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-[#00f0ff] transition-all"
              />
            </div>
            <button
              id="evidence-search-btn"
              onClick={handleSearch}
              disabled={loading}
              className="bg-[#00f0ff] text-[#002022] px-5 py-3 rounded font-bold text-sm font-mono flex items-center gap-2 hover:bg-[#00dbe9] active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <span className="material-symbols-outlined text-sm animate-spin">sync</span> : <span className="material-symbols-outlined text-sm">search</span>}
              SEARCH
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          {loading && (
            <div className="flex justify-center py-12">
              <span className="text-[#849495] text-sm font-mono animate-pulse">SEARCHING KNOWLEDGE BASE...</span>
            </div>
          )}

          {!loading && results.length === 0 && submitted && (
            <div className="flex flex-col items-center py-12 gap-3">
              <span className="material-symbols-outlined text-[#333537] text-5xl">search_off</span>
              <p className="text-[#849495] text-sm font-mono">NO RESULTS FOR "{submitted}"</p>
            </div>
          )}

          {!loading && results.length === 0 && !submitted && (
            <div className="flex flex-col items-center py-16 gap-4">
              <span className="material-symbols-outlined text-[#333537] text-6xl">find_in_page</span>
              <p className="text-[#849495] font-mono text-sm uppercase tracking-widest">Search documents, incidents, manuals</p>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {['OISD permit system', 'pump P-101 maintenance', 'Factories Act Section 21', 'pressure drop incident'].map(s => (
                  <button key={s} onClick={() => { setQuery(s); }} className="border border-[#333537] text-[#b9cacb] px-3 py-1.5 rounded text-xs font-mono hover:border-[#00f0ff] hover:text-[#00f0ff] transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="max-w-3xl mx-auto flex flex-col gap-4">
              {results.map((r, i) => (
                <div key={i} className="bg-[#1a1c1e] border border-[#333537] rounded hover:border-[#00f0ff]/50 transition-all group">
                  <div className="p-4">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border font-mono ${DOC_TYPE_COLORS[r.doc_type] || 'text-[#b9cacb] border-[#333537]'}`}>
                        {r.doc_type}
                      </span>
                      <span className="text-[10px] text-[#849495] border border-[#333537] px-2 py-0.5 rounded font-mono">
                        {r.linked_asset}
                      </span>
                      <span className="text-[10px] text-[#849495] border border-[#333537] px-2 py-0.5 rounded font-mono">
                        p.{r.page}
                      </span>
                      <ConfBadge score={r.confidence} />
                    </div>
                    <h3 className="text-[#e2e2e5] font-bold text-sm mb-2 group-hover:text-[#00f0ff] transition-colors">{r.title}</h3>
                    <p className="text-[#b9cacb] text-xs leading-relaxed">
                      {highlightSnippet(r.snippet, r.highlight)}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#282a2c]">
                      <span className="text-[10px] text-[#849495] font-mono">INDEXED: {r.indexed_ago}</span>
                      <div className="flex gap-2">
                        <button className="text-[10px] text-[#849495] border border-[#333537] px-3 py-1 rounded font-mono hover:border-[#00f0ff] hover:text-[#00f0ff] transition-all">
                          OPEN DOC
                        </button>
                        <button className="text-[10px] text-[#849495] border border-[#333537] px-3 py-1 rounded font-mono hover:border-[#00f0ff] hover:text-[#00f0ff] transition-all">
                          ADD TO RCA
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default EvidenceSearchPage;
