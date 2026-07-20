import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { getAssetsList, type AssetSummary } from '../api/agents';

const AssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<AssetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const it = setInterval(() => {
      const now = new Date();
      setTimeStr(`${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2,'0')}-${String(now.getUTCDate()).padStart(2,'0')} // ${String(now.getUTCHours()).padStart(2,'0')}:${String(now.getUTCMinutes()).padStart(2,'0')}:${String(now.getUTCSeconds()).padStart(2,'0')} UTC`);
    }, 1000);
    return () => clearInterval(it);
  }, []);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const result = await getAssetsList();
        setAssets(result.assets);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA]" style={{fontFamily:'Inter,sans-serif'}}>
      <Sidebar />
      <main className="fixed top-0 right-0 w-[calc(100%-240px)] h-full flex flex-col">
        {/* Header */}
        <header className="h-14 bg-white border-b border-[#E0E0E0] flex items-center justify-between px-[24px] w-full z-20">
          <div className="flex items-center space-x-4">
            <span className="material-symbols-outlined text-[#004D40]">factory</span>
            <h2 className="text-[18px] font-bold text-[#212121] uppercase tracking-tight">Plant Assets</h2>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-[24px]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <span className="material-symbols-outlined text-[#004D40] text-[48px] animate-spin">sync</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 p-4 rounded border border-red-200 text-red-700">
              Error loading assets: {error}
            </div>
          ) : (
            <div className="bg-white border border-[#E0E0E0] rounded shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F5F5] border-b border-[#E0E0E0]">
                    <th className="px-6 py-3 font-[JetBrains_Mono,monospace] text-[11px] text-[#616161] uppercase tracking-widest">Asset ID</th>
                    <th className="px-6 py-3 font-[JetBrains_Mono,monospace] text-[11px] text-[#616161] uppercase tracking-widest">Name</th>
                    <th className="px-6 py-3 font-[JetBrains_Mono,monospace] text-[11px] text-[#616161] uppercase tracking-widest">Type</th>
                    <th className="px-6 py-3 font-[JetBrains_Mono,monospace] text-[11px] text-[#616161] uppercase tracking-widest">Plant</th>
                    <th className="px-6 py-3 font-[JetBrains_Mono,monospace] text-[11px] text-[#616161] uppercase tracking-widest text-right">Failures</th>
                    <th className="px-6 py-3 font-[JetBrains_Mono,monospace] text-[11px] text-[#616161] uppercase tracking-widest text-right">W/O</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E0E0]">
                  {assets.map((asset, i) => (
                    <tr key={i} className="hover:bg-[#FAFAFA] transition-colors cursor-pointer">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-['Roboto_Mono',monospace] text-[13px] px-2 py-0.5 rounded border bg-[#004D40]/5 text-[#004D40] border-[#004D40]/20 font-bold">
                          {asset.asset_id}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-[#212121]">{asset.name}</td>
                      <td className="px-6 py-4 text-[#616161] text-sm">{asset.asset_type}</td>
                      <td className="px-6 py-4 text-[#616161] text-sm">{asset.plant}</td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${asset.failure_count > 0 ? 'bg-[#FFEBEE] text-[#D32F2F]' : 'bg-[#F5F5F5] text-[#616161]'}`}>
                          {asset.failure_count}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full ${asset.work_order_count > 0 ? 'bg-[#FFF3E0] text-[#ED6C02]' : 'bg-[#F5F5F5] text-[#616161]'}`}>
                          {asset.work_order_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {assets.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[#757575]">
                        <span className="material-symbols-outlined text-[48px] text-[#E0E0E0] block mb-2">database</span>
                        No assets found in the knowledge graph.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="h-8 bg-white border-t border-[#E0E0E0] flex items-center justify-between px-6 z-20 shrink-0">
          <div className="flex items-center space-x-4">
            <span className="text-[9px] font-[JetBrains_Mono,monospace] text-[#616161] uppercase tracking-widest">System Status: <span className="text-[#004D40] font-bold">Nominal</span></span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-[9px] font-[JetBrains_Mono,monospace] text-[#616161] uppercase">{timeStr}</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default AssetsPage;
