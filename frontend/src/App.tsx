import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import CopilotPage from './pages/CopilotPage';
import RCAPage from './pages/RCAPage';
import CompliancePage from './pages/CompliancePage';
import LessonsPage from './pages/LessonsPage';
import AssetsPage from './pages/AssetsPage';
import ReportsPage from './pages/ReportsPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/copilot" element={<CopilotPage />} />
        <Route path="/rca" element={<RCAPage />} />
        <Route path="/compliance" element={<CompliancePage />} />
        <Route path="/lessons" element={<LessonsPage />} />
        <Route path="/assets" element={<AssetsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
