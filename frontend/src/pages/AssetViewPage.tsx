import React, { useState } from 'react';

interface AccordionSection {
  id: string;
  label: string;
  isUrgent?: boolean;
  content: React.ReactNode;
}

const assetData = {
  id: 'PUMP P-101',
  serial: '88-XQ-9012',
  location: 'SECTOR_G4',
  status: 'OPERATIONAL',
  efficiency: 98,
  lastScan: '2023-11-04 14:02:11',
  assetClass: 'ROTARY_PUMP',
};

const AccordionItem: React.FC<{ section: AccordionSection; defaultOpen?: boolean }> = ({ section, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  
  return (
    <div className={`accordion-item border-b border-outline-variant ${open ? 'accordion-open' : ''}`}>
      <button 
        className={`w-full h-touch-target flex items-center justify-between px-4 transition-colors text-left ${section.isUrgent ? 'bg-surface-container-high/50 hover:bg-surface-container-high' : 'hover:bg-surface-container-high'}`}
        onClick={() => setOpen(!open)}
      >
        <span className={`font-label-md text-label-md ${section.isUrgent ? 'text-error' : ''}`}>{section.label}</span>
        <span className={`material-symbols-outlined transition-transform ${open ? 'rotate-180' : ''} ${section.isUrgent ? 'text-error' : 'text-outline'}`}>expand_more</span>
      </button>
      <div 
        className="accordion-content overflow-hidden transition-all duration-300 ease-in-out" 
        style={{ maxHeight: open ? '1000px' : '0' }}
      >
        <div className="p-4">
          {section.content}
        </div>
      </div>
    </div>
  );
};

const AssetViewPage: React.FC = () => {
  const sections: AccordionSection[] = [
    {
      id: 'workorders',
      label: 'HISTORY & WORK ORDERS',
      content: (
        <div className="flex flex-col gap-3">
          {[
            { id: 'WO-9012', date: '2023-10-28', desc: 'Bearing Lubrication & Gasket Check', isActive: true },
            { id: 'WO-8841', date: '2023-09-15', desc: 'Routine Filter Replacement', isActive: false },
          ].map(wo => (
            <div key={wo.id} className={`p-3 border-l-2 ${wo.isActive ? 'bg-surface-container-high border-primary-container' : 'bg-surface-container border-outline'}`}>
              <div className="flex justify-between font-label-sm text-label-sm mb-1">
                <span className={wo.isActive ? 'text-primary-container' : 'text-on-surface'}>{wo.id}</span>
                <span className="text-outline">{wo.date}</span>
              </div>
              <p className={wo.isActive ? 'text-on-surface text-sm' : 'text-on-surface-variant text-sm'}>{wo.desc}</p>
            </div>
          ))}
        </div>
      ),
    },
    {
      id: 'documents',
      label: 'LINKED DOCUMENTS',
      content: (
        <div className="grid grid-cols-1 gap-2">
          {[
            { name: 'OISD-STD-105', icon: 'picture_as_pdf' },
            { name: 'TECHNICAL MANUAL', icon: 'menu_book' },
          ].map(doc => (
            <a key={doc.name} className="flex items-center justify-between p-3 border border-outline-variant hover:border-primary-container transition-colors group cursor-pointer">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-outline group-hover:text-primary-container">{doc.icon}</span>
                <span className="font-label-sm text-label-sm">{doc.name}</span>
              </div>
              <span className="material-symbols-outlined text-sm">open_in_new</span>
            </a>
          ))}
        </div>
      ),
    },
    {
      id: 'incidents',
      label: 'INCIDENTS',
      isUrgent: true,
      content: (
        <div className="bg-error-container/20 border-2 border-error p-4 glow-red animate-pulse-subtle">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-error" style={{fontVariationSettings: "'FILL' 1"}}>warning</span>
            <div>
              <span className="font-label-sm text-label-sm text-error block font-bold mb-1">CRITICAL ALERT: INCIDENT-072</span>
              <p className="font-body-md text-on-surface">Pressure Drop Detected in Secondary Valve Chamber.</p>
              <div className="mt-3 flex gap-2">
                <button className="bg-error text-on-error px-4 py-2 font-label-sm text-label-sm uppercase font-bold hover:brightness-110 active:scale-95 transition-all h-touch-target flex items-center gap-2">
                  ACKNOWLEDGE
                </button>
                <button className="border border-error text-error px-4 py-2 font-label-sm text-label-sm uppercase h-touch-target hover:bg-error/10 active:scale-95 transition-all">
                  DETAILS
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'compliance',
      label: 'COMPLIANCE STATUS',
      content: (
        <div className="flex items-center gap-4 bg-surface-container-high p-4 border border-outline-variant">
          <span className="material-symbols-outlined text-4xl text-primary-container" style={{fontVariationSettings: "'FILL' 1"}}>verified_user</span>
          <div>
            <span className="font-headline-md text-headline-md text-on-surface block">CERTIFIED</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant">EXP: 2024-12-31</span>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="flex-1 relative pb-32 grid-overlay overflow-y-auto hide-scrollbar h-full">
      {/* Asset Header Module */}
      <section className="px-margin-mobile md:px-margin-desktop pt-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-surface-container-low border border-outline-variant p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2 opacity-20 pointer-events-none">
            <span className="font-label-sm text-[80px] leading-none text-outline-variant select-none">P-101</span>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-label-sm text-label-sm text-primary-container bg-on-primary-container/10 px-2 py-0.5 border border-primary-container/20">ASSET_CLASS: {assetData.assetClass}</span>
            </div>
            <h1 className="font-headline-xl text-headline-xl text-primary md:text-headline-xl">{assetData.id}</h1>
            <div className="mt-2 font-label-sm text-label-sm text-on-surface-variant flex flex-wrap gap-4">
              <span>S/N: {assetData.serial}</span>
              <span>LOC: {assetData.location}</span>
              <span>LAST_SCAN: {assetData.lastScan}</span>
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-3 z-10">
            <div className="flex items-center gap-3 px-4 py-3 bg-surface-container-high border-2 border-primary-container glow-cyan">
              <div className="w-3 h-3 rounded-full bg-primary-container animate-pulse"></div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-primary-container font-bold">{assetData.status}</span>
                <span className="font-headline-md text-headline-md text-on-surface leading-none">{assetData.efficiency}% <span className="text-label-sm">Efficiency</span></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Relationship Graph & Grid Section */}
      <section className="px-margin-mobile md:px-margin-desktop py-gutter grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Relationship Graph Canvas */}
        <div className="lg:col-span-8 flex flex-col gap-base">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">RELATIONSHIP_MAP: MOD-001</span>
            <span className="font-label-sm text-label-sm text-outline">AUTO-REFRESH: 5s</span>
          </div>
          <div className="technical-border bg-surface flex items-center justify-center p-4 relative min-h-[400px] md:min-h-[500px]">
            <img alt="Asset Relationship Diagram" className="max-w-full h-auto" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkg76lSfZmf2SihfbDUG6pyHfzI-TANL1xy5h9qEWLZ-0l4gXQz-VZ3MG_xwNFIc5XF-_CjWnkqlTbNcSbioUf2fIfMCoH04_YjBV0rmpXaBgR62sjSxCafDTiIeHG5n2z7l-yDITr_fc8VpyKM3dK_GWHeH5LYqa4wK44wHCMNBWYL41he6k9eHSEnmS0JNymUJS0e1vYPzC3vuafCs7zz18Lg4o9N--08XHIJqQX1Git5AiRq3TIz1d6k_ULIr3a8RPPpUf4kCA" />
            <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
              <div className="w-16 h-[1px] bg-primary-container/50"></div>
              <div className="w-12 h-[1px] bg-primary-container/30"></div>
              <div className="w-20 h-[1px] bg-primary-container/40"></div>
            </div>
          </div>
        </div>

        {/* Side Controls / Quick Data */}
        <div className="lg:col-span-4 flex flex-col gap-gutter">
          {/* Accordion Module */}
          <div className="technical-border bg-surface-container-low flex flex-col">
            <div className="p-4 border-b border-outline-variant bg-surface-container flex items-center justify-between">
              <span className="font-label-md text-label-md uppercase tracking-wider">Asset Context</span>
              <span className="font-label-sm text-label-sm text-outline">ID: CTX_82</span>
            </div>
            {sections.map((s) => (
              <AccordionItem key={s.id} section={s} defaultOpen={s.id === 'incidents'} />
            ))}
          </div>

          {/* Technical Specs Box */}
          <div className="technical-border bg-surface p-4 flex flex-col gap-4">
            <h3 className="font-label-md text-label-md text-primary-container border-b border-primary-container/20 pb-2">TELEMETRY_LOG</h3>
            <div className="flex flex-col gap-2 font-label-sm text-label-sm">
              <div className="flex justify-between py-1 border-b border-outline-variant/30">
                <span className="text-outline">RPM_ACTUAL</span>
                <span className="text-on-surface">1,745.2</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/30">
                <span className="text-outline">PSI_OUT</span>
                <span className="text-on-surface">64.12</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/30">
                <span className="text-outline">TEMP_BEARING</span>
                <span className="text-secondary">42.5°C</span>
              </div>
              <div className="flex justify-between py-1 border-b border-outline-variant/30">
                <span className="text-outline">VIB_INDEX</span>
                <span className="text-on-surface">0.02 mm/s</span>
              </div>
            </div>
            <button className="w-full h-touch-target border border-primary-container text-primary-container font-label-md text-label-md hover:bg-primary-container/10 transition-colors uppercase tracking-widest mt-2 active:scale-95">
              Download Full Log
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AssetViewPage;
