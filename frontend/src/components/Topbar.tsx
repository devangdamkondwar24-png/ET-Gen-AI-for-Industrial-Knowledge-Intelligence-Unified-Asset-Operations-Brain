import React from 'react';

interface TopbarProps {
  title: string;
  status?: string;
}

const Topbar: React.FC<TopbarProps> = ({ title, status = 'SYSTEM STABLE' }) => {
  return (
    <header className="fixed top-0 right-0 w-[calc(100%-240px)] h-12 bg-[#1a1c1e] border-b border-border-muted flex justify-between items-center px-6 z-10">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined text-primary text-lg">search</span>
        <span className="text-sm text-on-surface-variant font-medium">{title}</span>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-[10px] font-mono text-primary bg-primary-container px-2 py-0.5 rounded border border-primary/20">
          {status}
        </span>
        <div className="flex items-center gap-4 text-on-surface-variant">
          <span className="material-symbols-outlined text-xl hover:text-primary cursor-pointer transition-colors">notifications</span>
          <span className="material-symbols-outlined text-xl hover:text-primary cursor-pointer transition-colors">help_outline</span>
          <span className="material-symbols-outlined text-xl hover:text-primary cursor-pointer transition-colors">account_circle</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
