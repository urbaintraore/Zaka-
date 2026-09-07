import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store';
import { DashboardLayout } from './components/DashboardLayout';
import { ExploreView } from './views/ExploreView';
import { GerantDashboard } from './views/GerantDashboard';
import { ProfileView } from './views/ProfileView';

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<ExploreView />} />
            <Route path="explore" element={<ExploreView />} />
            <Route path="my-establishments" element={<GerantDashboard />} />
            <Route path="profile" element={<ProfileView />} />
            <Route path="*" element={<Navigate to="/explore" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
