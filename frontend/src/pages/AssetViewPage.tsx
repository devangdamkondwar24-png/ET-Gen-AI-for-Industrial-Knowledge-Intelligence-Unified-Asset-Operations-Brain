import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

interface AccordionSection {
  id: string;
  icon: string;
  label: string;
  content: React.ReactNode;
}

const assetData = {
  id: 'PUMP-P-101',
  serial: 'SN-2019-A1142',
  location: 'Sector G-4, Unit 3',
  status: 'OPERATIONAL',
  efficiency: 98,
  lastScan: '2026-07-13 08:00 UTC',
  manufacturer: 'Kirloskar Brothers Ltd.',
};

const AccordionItem: React.FC<{ section: AccordionSection; defaultOpen?: boolean }> = ({ section, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#333537] rounded overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#1e2022] hover:bg-[#282a2c] transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[#00f0ff] text-lg">{section.icon}</span>
          <span className="text-[#e2e2e5] font-bold text-sm font-mono">{section.label}</span>
        </div>
        <span className="material-symbols-outlined text-[#849495] text-sm transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          expand_more
        </span>
      </button>
      {open && (
        <div className="bg-[#1a1c1e] px-4 py-4 border-t border-[#333537]">
          {section.content}
        </div>
      )}
    </div>
  );
};

const AssetViewPage: React.FC = () => {
  const sections: AccordionSection[] = [
    {
      id: 'workorders',
      icon: 'construction',
      label: 'HISTORY & WORK ORDERS',
      content: (
        <div className="space-y-3">
          {[
            { id: 'WO-2026-0714', date: '2026-07-10', desc: 'Bearing lubrication — scheduled PM', status: 'CLOSED' },
            { id: 'WO-2026-0601', date: '2026-06-28', desc: 'Suction strainer cleaned after INC-2024-072', status: 'CLOSED' },
            { id: 'WO-2026-0812', date: '2026-07-20', desc: 'Vibration analysis — pending', status: 'OPEN' },
          ].map(wo => (
            <div key={wo.id} className="flex items-center justify-between py-2 border-b border-[#282a2c] last:border-0">
              <div>
                <span className="text-[#00f0ff] text-xs font-mono font-bold">{wo.id}</span>
                <p className="text-[#b9cacb] text-xs mt-0.5">{wo.desc}</p>
              </div>
              <div className="text-right">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${wo.status === 'OPEN' ? 'bg-[#ff8a00]/20 text-[#ffb77f]' : 'bg-[#4caf50]/20 text-[#4caf50]'}`}>
                  {wo.status}
                </span>
                <p className="text-[10px] text-[#849495] font-mono mt-0.5">{wo.date}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'documents',
      icon: 'description',
      label: 'LINKED DOCUMENTS',
      content: (
        <div className="space-y-2">
          {[
            { name: 'OISD-STD-105', type: 'OISD Manual', page: 42 },
            { name: 'Pump P-101 Technical Manual Rev.C', type: 'Technical Manual', page: 7 },
            { name: 'Factories Act 1948 — Sect 21', type: 'Regulatory', page: 21 },
          ].map(doc => (
            <div key={doc.name} className="flex items-center justify-between py-2 border-b border-[#282a2c] last:border-0">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#849495] text-base">article</span>
                <span className="text-[#e2e2e5] text-xs">{doc.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#00f0ff] border border-[#00f0ff]/30 px-2 py-0.5 rounded font-mono">{doc.type}</span>
                <span className="text-[10px] text-[#849495] font-mono">p.{doc.page}</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'incidents',
      icon: 'warning',
      label: 'INCIDENTS',
      content: (
        <div>
          <div className="border-l-4 border-[#ffb4ab] bg-[#ffb4ab]/5 rounded-r px-4 py-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold text-[#ffb4ab] font-mono">INC-2024-072</span>
              <span className="text-[10px] text-[#ffb4ab] border border-[#ffb4ab]/40 px-2 py-0.5 rounded font-mono">CRITICAL</span>
            </div>
            <p className="text-[#e2e2e5] text-xs font-bold">Pressure Drop Event</p>
            <p className="text-[#b9cacb] text-xs mt-1">Blocked suction strainer caused pressure drop below minimum operational threshold. Corrective action completed 2024-01-15.</p>
          </div>
          <p className="text-[#849495] text-xs font-mono mt-3">1 incident total — no open RCAs</p>
        </div>
      ),
    },
    {
      id: 'compliance',
      icon: 'verified',
      label: 'COMPLIANCE STATUS',
      content: (
        <div className="space-y-3">
          {[
            { framework: 'OISD-STD-105', status: 'CERTIFIED', expires: '2027-01-01', score: 0.94 },
            { framework: 'Factories Act 1948', status: 'OBSERVATION', expires: 'N/A', score: 0.78 },
            { framework: 'PESO SMPV Rules', status: 'CERTIFIED', expires: '2026-12-31', score: 0.91 },
          ].map(c => (
            <div key={c.framework} className="flex items-center justify-between py-2 border-b border-[#282a2c] last:border-0">
              <div>
                <span className="text-[#e2e2e5] text-xs font-bold">{c.framework}</span>
                <p className="text-[10px] text-[#849495] font-mono mt-0.5">Expires: {c.expires}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${c.status === 'CERTIFIED' ? 'bg-[#4caf50]/20 text-[#4caf50]' : 'bg-[#ffd602]/20 text-[#ffd602]'}`}>
                  {c.status}
                </span>
                <span className="text-[10px] text-[#849495] font-mono">{Math.round(c.score * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-[#121416]" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Sidebar />
      <main className="fixed top-0 right-0 w-full md:w-[calc(100%-240px)] h-full flex flex-col transition-all duration-300 pb-16 md:pb-0">
        {/* Header */}
        <header className="h-14 bg-[#1a1c1e] border-b border-[#333537] flex items-center justify-between px-4 md:px-6 z-20 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#00f0ff]">precision_manufacturing</span>
            <span className="text-[#00f0ff] font-bold text-[13px] hidden md:inline" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              ASSET VIEW
            </span>
          </div>
          <span className="text-[10px] text-[#4caf50] font-mono border border-[#4caf50]/30 px-2 py-0.5 rounded">● OPERATIONAL</span>
        </header>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          {/* Asset hero card */}
          <div className="bg-[#1a1c1e] border border-[#333537] rounded mb-6">
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-[#00f0ff] font-bold text-2xl font-mono">{assetData.id}</h1>
                  <p className="text-[#849495] text-xs font-mono mt-1">{assetData.manufacturer}</p>
                </div>
                <div className="text-right">
                  <div className="text-[#4caf50] font-bold text-3xl font-mono">{assetData.efficiency}%</div>
                  <p className="text-[10px] text-[#849495] font-mono">EFFICIENCY</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {[
                  { label: 'SERIAL', value: assetData.serial },
                  { label: 'LOCATION', value: assetData.location },
                  { label: 'LAST SCAN', value: assetData.lastScan },
                  { label: 'STATUS', value: assetData.status },
                ].map(field => (
                  <div key={field.label} className="bg-[#0c0e10] rounded p-2">
                    <p className="text-[#849495] font-mono text-[9px] uppercase">{field.label}</p>
                    <p className="text-[#e2e2e5] font-mono text-xs mt-0.5">{field.value}</p>
                  </div>
                ))}
              </div>
              {/* Efficiency bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[10px] font-mono text-[#849495] mb-1">
                  <span>HEALTH INDEX</span><span>{assetData.efficiency}%</span>
                </div>
                <div className="h-2 bg-[#282a2c] rounded-full overflow-hidden">
                  <div className="h-full bg-[#4caf50] transition-all" style={{ width: `${assetData.efficiency}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Relationship graph placeholder */}
          <div className="bg-[#1a1c1e] border border-[#333537] rounded mb-6 p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[#00f0ff] text-base">hub</span>
              <span className="text-[#e2e2e5] font-bold text-xs font-mono">ASSET RELATIONSHIPS</span>
            </div>
            <div className="bg-[#0c0e10] rounded p-4 flex flex-col items-center gap-3 min-h-[120px] justify-center relative overflow-hidden">
              {/* Simple visual graph */}
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded border-2 border-[#ffb4ab] bg-[#ffb4ab]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#ffb4ab] text-sm">warning</span>
                  </div>
                  <span className="text-[8px] font-mono text-[#849495]">INC-072</span>
                </div>
                <div className="flex flex-col gap-2 items-center">
                  <div className="h-px w-12 bg-[#333537]" />
                  <div className="w-16 h-16 rounded border-2 border-[#00f0ff] bg-[#00f0ff]/10 flex items-center justify-center shadow-[0_0_12px_#00f0ff33]">
                    <span className="material-symbols-outlined text-[#00f0ff]">settings</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#00f0ff] font-bold">PUMP P-101</span>
                  <div className="h-px w-12 bg-[#333537]" />
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { label: 'VALVE-A22', icon: 'valve' },
                    { label: 'MOTOR-M04', icon: 'electric_bolt' },
                  ].map(n => (
                    <div key={n.label} className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded border border-[#333537] bg-[#1e2022] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[#849495] text-sm">{n.icon}</span>
                      </div>
                      <span className="text-[8px] font-mono text-[#849495]">{n.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Accordion sections */}
          <div className="space-y-3">
            {sections.map((s, i) => <AccordionItem key={s.id} section={s} defaultOpen={i === 0} />)}
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-3 mt-6">
            <button className="flex items-center gap-2 bg-[#00f0ff] text-[#002022] px-4 py-2.5 rounded font-bold text-xs font-mono hover:bg-[#00dbe9] active:scale-95 transition-all">
              <span className="material-symbols-outlined text-sm">add_task</span>
              NEW WORK ORDER
            </button>
            <button className="flex items-center gap-2 border border-[#00f0ff] text-[#00f0ff] px-4 py-2.5 rounded font-bold text-xs font-mono hover:bg-[#00f0ff]/10 active:scale-95 transition-all">
              <span className="material-symbols-outlined text-sm">analytics</span>
              RUN RCA
            </button>
            <button className="flex items-center gap-2 border border-[#333537] text-[#b9cacb] px-4 py-2.5 rounded font-bold text-xs font-mono hover:border-[#00f0ff] hover:text-[#00f0ff] active:scale-95 transition-all">
              <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
              SCAN ASSET
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AssetViewPage;
