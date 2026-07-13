import React, { useState } from 'react';

interface SearchResult {
  title: string;
  doc_type: string;
  doc_format?: string;
  linked_asset: string;
  page: number | string;
  snippet: string;
  confidence: number;
  indexed_ago: string;
  highlight?: string;
}

const DEMO_RESULTS: SearchResult[] = [
  {
    title: 'OISD-STD-105: Work Permit System',
    doc_type: 'OISD Manual',
    doc_format: 'PDF',
    linked_asset: 'Pump P-101',
    page: 'Page 42',
    snippet: '...failure to comply with the Work Permit System protocol before maintenance on Pump P-101 can result in pressurized release...',
    confidence: 0.98,
    indexed_ago: '24h ago',
    highlight: 'Work Permit System,Pump P-101',
  },
  {
    title: 'API 570: Piping Inspection Code',
    doc_type: 'Standard',
    doc_format: 'DOCX',
    linked_asset: 'Tank T-502',
    page: 'Annex B-1',
    snippet: 'Visual inspection for external corrosion on the base of Tank T-502 must adhere to the Piping Inspection Code frequency specified...',
    confidence: 0.82,
    indexed_ago: '15m ago',
    highlight: 'Tank T-502,Piping Inspection Code',
  },
  {
    title: 'ISO-9001: Quality Systems Manual',
    doc_type: 'Internal Document',
    doc_format: 'PDF',
    linked_asset: 'Plant-Wide',
    page: 'Section 7.4',
    snippet: '...documentation for all Compliance audits must be stored within the evidence locker...',
    confidence: 0.65,
    indexed_ago: '2d ago',
    highlight: 'Compliance',
  },
];

const getDocTypeStyles = (type: string) => {
  switch (type) {
    case 'OISD Manual': return 'bg-secondary-container/20 border-secondary-container text-secondary';
    case 'Standard': return 'bg-tertiary-container/20 border-tertiary-container text-tertiary-fixed-dim';
    case 'Internal Document': return 'bg-primary-container/10 border-primary-container/30 text-on-surface-variant';
    default: return 'bg-surface-container-highest border-outline-variant text-on-surface-variant';
  }
};

const getConfStyles = (score: number) => {
  if (score > 0.9) return 'text-primary-container';
  if (score > 0.7) return 'text-on-surface';
  return 'text-error';
};

const highlightSnippet = (text: string, terms?: string) => {
  if (!terms) return <span>{text}</span>;
  const termList = terms.split(',');
  let parts: (string | React.ReactElement)[] = [text];

  termList.forEach(term => {
    const newParts: (string | React.ReactElement)[] = [];
    parts.forEach(part => {
      if (typeof part === 'string') {
        const regex = new RegExp(`(${term.trim()})`, 'gi');
        const split = part.split(regex);
        split.forEach((s, i) => {
          if (s.toLowerCase() === term.trim().toLowerCase()) {
            newParts.push(<span key={s + i} className="text-primary-container font-bold underline cyan-glow-text">{s}</span>);
          } else {
            newParts.push(s);
          }
        });
      } else {
        newParts.push(part);
      }
    });
    parts = newParts;
  });

  return <>{parts.map((p, i) => <React.Fragment key={i}>{p}</React.Fragment>)}</>;
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
    setTimeout(() => {
      setResults(DEMO_RESULTS);
      setLoading(false);
    }, 600);
  };

  return (
    <div className="flex-1 relative z-10 max-w-5xl mx-auto w-full px-margin-mobile md:px-margin-desktop py-base h-full overflow-y-auto hide-scrollbar pb-32">
      {/* Search Header */}
      <section className="mt-margin-mobile md:mt-8 mb-gutter">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-outline group-focus-within:text-primary-container transition-colors">search</span>
          </div>
          <input 
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full bg-surface-container-lowest border border-outline-variant h-[56px] pl-14 pr-4 font-label-md text-label-md text-on-surface placeholder:text-outline-variant focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all" 
            placeholder="Search documents, manuals, or assets..." 
            type="text"
          />
          <div className="absolute top-0 right-4 h-full flex items-center pointer-events-none">
            <span className="text-[10px] font-label-sm text-outline-variant uppercase tracking-widest">Input_Active</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="px-2 py-1 bg-surface-container border border-outline-variant text-[10px] font-label-sm text-outline uppercase cursor-pointer hover:border-primary-container" onClick={() => setQuery('OISD-STD-105')}>Recent: OISD-STD-105</span>
          <span className="px-2 py-1 bg-surface-container border border-outline-variant text-[10px] font-label-sm text-outline uppercase cursor-pointer hover:border-primary-container" onClick={() => setQuery('Valve-A22')}>Recent: Valve-A22</span>
          <span className="px-2 py-1 bg-surface-container border border-outline-variant text-[10px] font-label-sm text-outline uppercase cursor-pointer hover:border-primary-container">Filter: Manuals Only</span>
        </div>
      </section>

      {/* States */}
      {loading && (
        <div className="flex justify-center py-12">
          <div className="flex gap-2 items-center">
            <span className="w-2 h-2 bg-primary-container animate-pulse rounded-full"></span>
            <span className="text-outline-variant font-label-md uppercase tracking-widest">QUERYING INDEX...</span>
          </div>
        </div>
      )}

      {!loading && results.length === 0 && submitted && (
        <div className="flex flex-col items-center py-12 gap-3">
          <span className="material-symbols-outlined text-outline-variant text-5xl">search_off</span>
          <p className="text-outline-variant font-label-md uppercase tracking-widest">NO RESULTS FOR "{submitted}"</p>
        </div>
      )}

      {/* Search Results List */}
      {!loading && results.length > 0 && (
        <div className="flex flex-col gap-4">
          {results.map((r, i) => (
            <div key={i} className="bg-surface-container-low border border-outline-variant p-4 cursor-pointer hover:border-primary-container transition-all group card-hover-fx relative overflow-hidden">
              <div className="absolute top-0 right-0 p-1">
                <span className="font-label-sm text-[9px] text-outline-variant opacity-50">MOD-SEARCH-00{i+1}</span>
              </div>
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
                <h3 className="font-headline-md text-headline-md text-primary-container leading-tight">{r.title}</h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 border text-[10px] font-label-md uppercase tracking-wider ${getDocTypeStyles(r.doc_type)}`}>
                    {r.doc_type}
                  </span>
                  {r.doc_format && (
                    <span className="px-2 py-0.5 bg-surface-container-highest border border-outline-variant text-on-surface-variant text-[10px] font-label-md uppercase tracking-wider">
                      {r.doc_format}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-outline text-[18px]">
                    {r.linked_asset.includes('Pump') ? 'settings_input_component' : r.linked_asset.includes('Tank') ? 'hub' : 'verified_user'}
                  </span>
                  <span className="text-on-surface-variant font-label-sm text-label-sm uppercase">Linked Asset: <span className="text-on-surface font-bold">{r.linked_asset}</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-outline text-[18px]">menu_book</span>
                  <span className="text-on-surface-variant font-label-sm text-label-sm uppercase">Reference: <span className="text-on-surface font-bold">{r.page}</span></span>
                </div>
              </div>
              <div className={`bg-surface-container-lowest border-l-2 p-3 mb-4 ${i === 0 ? 'border-primary-container' : 'border-outline-variant'}`}>
                <p className="text-on-surface-variant font-body-md leading-relaxed italic">
                  {highlightSnippet(r.snippet, r.highlight)}
                </p>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
                <div className="flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-outline uppercase font-label-sm">Confidence Score</span>
                    <span className={`font-label-md text-label-md ${getConfStyles(r.confidence)}`}>{Math.round(r.confidence * 100)}%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-outline uppercase font-label-sm">Last Indexed</span>
                    <span className="text-on-surface font-label-md text-label-md">{r.indexed_ago}</span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-primary-container group-hover:translate-x-1 transition-all">chevron_right</span>
              </div>
            </div>
          ))}

          {/* System Pagination */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <div className="h-[1px] flex-1 bg-outline-variant"></div>
            <div className="px-4 py-2 border border-outline-variant font-label-sm text-label-sm text-outline flex items-center gap-4">
              <button className="hover:text-primary-container">PREV</button>
              <span className="text-primary-container">01 / 14</span>
              <button className="hover:text-primary-container">NEXT</button>
            </div>
            <div className="h-[1px] flex-1 bg-outline-variant"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvidenceSearchPage;
