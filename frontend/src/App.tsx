import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CopilotPage from './pages/CopilotPage';
import RCAPage from './pages/RCAPage';
import CompliancePage from './pages/CompliancePage';
import LessonsPage from './pages/LessonsPage';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CopilotPage />} />
        <Route path="/rca" element={<RCAPage />} />
        <Route path="/compliance" element={<CompliancePage />} />
        <Route path="/lessons" element={<LessonsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
