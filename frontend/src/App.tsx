import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { DashboardHome } from './pages/DashboardHome';
import { RecordExplorer } from './pages/RecordExplorer';
import { RecurringIssues } from './pages/RecurringIssues';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="records" element={<RecordExplorer />} />
          <Route path="recurring-issues" element={<RecurringIssues />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
