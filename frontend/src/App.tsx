import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import CopilotPage from './pages/CopilotPage';
import RCAPage from './pages/RCAPage';
import CompliancePage from './pages/CompliancePage';
import LessonsPage from './pages/LessonsPage';
import Alerts from './components/Alerts';
import './index.css';

import { AppProvider } from './context/AppContext';

function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Alerts />
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/copilot" element={<CopilotPage />} />
          <Route path="/rca" element={<RCAPage />} />
          <Route path="/compliance" element={<CompliancePage />} />
          <Route path="/lessons" element={<LessonsPage />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
