import React from 'react';

const Topbar: React.FC = () => {
  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-gutter h-touch-target bg-surface border-b border-outline-variant transition-colors duration-150 ease-in-out">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary-fixed-dim" data-icon="terminal">terminal</span>
        <h1 className="font-label-md text-label-md tracking-widest text-primary-fixed-dim uppercase m-0">TECH-OS v2.4</h1>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 px-2 py-1 bg-surface-container-high border border-outline-variant">
          <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
          <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">Uplink Stable</span>
        </div>
        <button className="material-symbols-outlined text-primary-fixed-dim hover:bg-surface-container-high transition-colors p-2" data-icon="sensors">sensors</button>
      </div>
    </header>
  );
};

export default Topbar;
