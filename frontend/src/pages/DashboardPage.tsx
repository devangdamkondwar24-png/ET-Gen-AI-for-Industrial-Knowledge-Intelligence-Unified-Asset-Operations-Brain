import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [dataStreamVal, setDataStreamVal] = useState("98.4%");

  useEffect(() => {
    const interval = setInterval(() => {
      const val = (98 + Math.random() * 1.5).toFixed(1);
      setDataStreamVal(val + "%");
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="px-4 py-6 space-y-6">
      {/* Persistent Alert Toast (Plant Status) */}
      <div className="mt-4 bg-surface-container-low border border-outline-variant p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary-container opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-tertiary-container"></span>
          </div>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">System Status</span>
            <span className="font-body-md text-body-md font-bold text-on-surface">Plant 101: Normal</span>
          </div>
        </div>
        <div className="bg-tertiary-fixed-dim/20 px-3 py-1 border border-tertiary-fixed-dim flex items-center gap-2">
          <span className="font-label-sm text-label-sm text-tertiary-fixed-dim font-bold">OK</span>
          <span className="material-symbols-outlined text-[16px] text-tertiary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
        </div>
      </div>

      {/* Dashboard Identity Section */}
      <section className="space-y-1">
        <span className="font-label-sm text-label-sm text-outline uppercase tracking-tighter">Module ID: MOD-DASH-001</span>
        <h2 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Field Operations</h2>
      </section>

      {/* Visual Element: Interactive Shader/Visualizer */}
      <div className="relative h-32 w-full border border-outline-variant bg-surface-container overflow-hidden">
        <div className="absolute inset-0 flex flex-col justify-end p-4 bg-gradient-to-t from-surface to-transparent">
          <div className="flex justify-between items-end">
            <div>
              <div className="font-label-sm text-label-sm text-primary-fixed-dim">DATA_STREAM_01</div>
              <div className="font-headline-md text-headline-md text-primary-fixed-dim">{dataStreamVal}</div>
            </div>
            <div className="flex gap-1 h-8 items-end">
              <div className="w-1 bg-primary-fixed-dim h-full"></div>
              <div className="w-1 bg-primary-fixed-dim h-3/4"></div>
              <div className="w-1 bg-primary-fixed-dim h-1/2"></div>
              <div className="w-1 bg-primary-fixed-dim h-5/6"></div>
              <div className="w-1 bg-primary-fixed-dim h-1/3"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Grid (2x2) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Action 1: Scan Asset */}
        <button onClick={() => navigate('/assets')} className="relative h-40 flex flex-col items-center justify-center gap-4 bg-surface-container-high border-2 border-outline hover:border-primary-fixed-dim group transition-all active:brightness-75 overflow-hidden">
          <div className="scan-line opacity-0 group-hover:opacity-100"></div>
          <div className="bg-surface p-3 border border-outline-variant group-hover:border-primary-fixed-dim group-hover:text-primary-fixed-dim transition-colors">
            <span className="material-symbols-outlined text-[32px]">barcode_scanner</span>
          </div>
          <span className="font-label-md text-label-md uppercase font-bold tracking-widest text-on-surface group-hover:text-primary-fixed-dim transition-colors">Scan Asset</span>
          <span className="absolute top-1 right-1 text-[8px] font-label-sm text-outline opacity-40 uppercase">CAM-01</span>
        </button>

        {/* Action 2: Ask Question */}
        <button onClick={() => navigate('/copilot')} className="relative h-40 flex flex-col items-center justify-center gap-4 bg-surface-container-high border-2 border-outline hover:border-primary-fixed-dim group transition-all active:brightness-75">
          <div className="bg-surface p-3 border border-outline-variant group-hover:border-primary-fixed-dim group-hover:text-primary-fixed-dim transition-colors">
            <span className="material-symbols-outlined text-[32px]">smart_toy</span>
          </div>
          <span className="font-label-md text-label-md uppercase font-bold tracking-widest text-on-surface group-hover:text-primary-fixed-dim transition-colors">Ask Question</span>
          <span className="absolute top-1 right-1 text-[8px] font-label-sm text-outline opacity-40 uppercase">AI-COPILOT</span>
        </button>

        {/* Action 3: Check Compliance */}
        <button onClick={() => navigate('/compliance')} className="relative h-40 flex flex-col items-center justify-center gap-4 bg-surface-container-high border-2 border-outline hover:border-primary-fixed-dim group transition-all active:brightness-75">
          <div className="bg-surface p-3 border border-outline-variant group-hover:border-primary-fixed-dim group-hover:text-primary-fixed-dim transition-colors">
            <span className="material-symbols-outlined text-[32px]">verified_user</span>
          </div>
          <span className="font-label-md text-label-md uppercase font-bold tracking-widest text-on-surface group-hover:text-primary-fixed-dim transition-colors">Compliance</span>
          <span className="absolute top-1 right-1 text-[8px] font-label-sm text-outline opacity-40 uppercase">SEC-PROT</span>
        </button>

        {/* Action 4: View Alerts */}
        <button onClick={() => navigate('/alerts')} className="relative h-40 flex flex-col items-center justify-center gap-4 bg-surface-container-high border-2 border-outline hover:border-error group transition-all active:brightness-75">
          <div className="bg-surface p-3 border border-outline-variant group-hover:border-error group-hover:text-error transition-colors">
            <span className="material-symbols-outlined text-[32px]">warning</span>
          </div>
          <span className="font-label-md text-label-md uppercase font-bold tracking-widest text-on-surface group-hover:text-error transition-colors">View Alerts</span>
          <div className="absolute top-1 right-1 bg-error px-1.5 py-0.5">
            <span className="text-[10px] font-label-sm text-on-error font-bold uppercase">3 New</span>
          </div>
        </button>
      </div>

      {/* Secondary Information Card */}
      <div className="bg-surface-container-highest border border-outline-variant p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant pb-2">
          <span className="font-label-md text-label-md text-primary-fixed-dim font-bold uppercase">Recent Activity</span>
          <span className="material-symbols-outlined text-outline">history</span>
        </div>
        <div className="space-y-3">
          <div className="flex gap-4 items-start">
            <div className="mt-1 h-2 w-2 bg-outline shrink-0"></div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">08:42:01</span>
              <span className="font-body-md text-body-md text-on-surface">Generator B-12 Check Completed</span>
            </div>
          </div>
          <div className="flex gap-4 items-start">
            <div className="mt-1 h-2 w-2 bg-outline shrink-0"></div>
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">07:15:33</span>
              <span className="font-body-md text-body-md text-on-surface">Shift hand-over sequence initiated</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
