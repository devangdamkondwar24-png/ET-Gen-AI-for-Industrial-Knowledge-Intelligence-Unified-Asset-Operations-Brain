import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import CopilotPage from './pages/CopilotPage';
import RCAPage from './pages/RCAPage';
import CompliancePage from './pages/CompliancePage';
import LessonsPage from './pages/LessonsPage';
import EvidenceSearchPage from './pages/EvidenceSearchPage';
import AssetViewPage from './pages/AssetViewPage';
import Alerts from './components/Alerts';
import Topbar from './components/Topbar';
import Sidebar from './components/Sidebar';
import './index.css';

import { AppProvider } from './context/AppContext';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Alerts />
        <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body-md bg-grid">
          <Topbar />
          <main className="flex-1 overflow-y-auto mt-[48px] mb-[64px] relative">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/copilot" element={<CopilotPage />} />
              <Route path="/rca" element={<RCAPage />} />
              <Route path="/compliance" element={<CompliancePage />} />
              <Route path="/lessons" element={<LessonsPage />} />
              <Route path="/search" element={<EvidenceSearchPage />} />
              <Route path="/assets" element={<AssetViewPage />} />
            </Routes>
          </main>
          <Sidebar />
        </div>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
