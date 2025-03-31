import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import SearchPage from './pages/SearchPage';
import LeadsPage from './pages/LeadsPage';
import CampaignsPage from './pages/CampaignsPage';
import SalesTrackerPage from './pages/SalesTrackerPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-neutral-900 to-black">
        <div className="text-center pt-4 sm:pt-8 mb-4 sm:mb-8 px-4">
          <h1 className="text-2xl sm:text-4xl font-bold">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">{"{{Company Name}}"}</span>
          </h1>
          <p className="text-sm sm:text-lg text-gray-400 mt-2">Lead Automation and Management</p>
        </div>
        <Navigation />
        <main className="py-4 sm:py-8">
          <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/leads" element={<LeadsPage />} />
            <Route path="/campaigns" element={<CampaignsPage />} />
            <Route path="/sales" element={<SalesTrackerPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;