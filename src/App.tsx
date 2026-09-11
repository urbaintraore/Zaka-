import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './store';
import { DashboardLayout } from './components/DashboardLayout';
import { HomeView } from './views/HomeView';
import { ExploreView } from './views/ExploreView';
import { FavoritesView } from './views/FavoritesView';
import { RecruitmentsView } from './views/RecruitmentsView';
import { MessagesView } from './views/MessagesView';
import { ProfileView } from './views/ProfileView';
import { GerantDashboard } from './views/GerantDashboard';
import { EntrepriseDashboard } from './views/EntrepriseDashboard';
import { AdminDashboard } from './views/AdminDashboard';
import { HelpView } from './views/HelpView';
import { ArtistPublicPage } from './views/ArtistPublicPage';
import { ArtistDashboard } from './views/ArtistDashboard';
import { PitchDeckView } from './components/PitchDeckView';
import { BeautyDashboardView } from './views/BeautyDashboardView';
import { SalonOnboarding } from './views/SalonOnboarding';
import { BeautySalonsList } from './components/beauty/BeautySalonsList';
import { BeautySalonPublicView } from './components/beauty/BeautySalonPublicView';

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Routes>
          <Route path="/pitch-deck" element={<PitchDeckView />} />
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<HomeView />} />
            <Route path="home" element={<HomeView />} />
            <Route path="explore" element={<ExploreView />} />
            
            {/* ZAKA BEAUTY MODULE - SINGLE SOURCE OF TRUTH */}
            <Route path="beauty" element={<BeautySalonsList />} />
            <Route path="beauty/:id" element={<BeautySalonPublicView />} />
            <Route path="beauty-dashboard" element={<BeautyDashboardView />} />
            <Route path="salon-onboarding" element={<SalonOnboarding />} />
            
            {/* LEGACY BEAUTY ROUTE REDIRECTS FOR UNIFIED STRUCTURE */}
            <Route path="salons" element={<Navigate to="/beauty" replace />} />
            <Route path="salons/:id" element={<Navigate to="/beauty" replace />} />
            <Route path="mon-salon" element={<Navigate to="/beauty-dashboard" replace />} />
            <Route path="beauty-salon" element={<Navigate to="/beauty-dashboard" replace />} />

            <Route path="favorites" element={<FavoritesView />} />
            <Route path="jobs" element={<RecruitmentsView />} />
            <Route path="messages" element={<MessagesView />} />
            <Route path="profile" element={<ProfileView />} />
            <Route path="my-establishments" element={<GerantDashboard />} />
            <Route path="entreprise-dashboard" element={<EntrepriseDashboard />} />
            <Route path="artist-dashboard" element={<ArtistDashboard />} />
            <Route path="artist/:id" element={<ArtistPublicPage />} />
            <Route path="admin-dashboard" element={<AdminDashboard />} />
            <Route path="help" element={<HelpView />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
