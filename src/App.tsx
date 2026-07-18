import { useState } from 'react';
import { TopBar } from './components/TopBar';
import { BottomNav, Tab } from './components/BottomNav';
import { HomeView } from './views/HomeView';
import { ExploreView } from './views/ExploreView';
import { FavoritesView } from './views/FavoritesView';
import { RecruitmentsView } from './views/RecruitmentsView';
import { ProfileView } from './views/ProfileView';
import { MessagesView } from './views/MessagesView';
import { AppProvider, useAppStore } from './store';
import { Toast } from './components/Toast';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<Tab>('home');
  const [preselectedChatEstId, setPreselectedChatEstId] = useState<string | null>(null);
  const [preselectedChatRecipient, setPreselectedChatRecipient] = useState<'gerant' | 'dj'>('gerant');
  const [preselectedConvId, setPreselectedConvId] = useState<string | null>(null);
  const { currentUser, loading } = useAppStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const handleStartChat = (estId: string, recipient: 'gerant' | 'dj' = 'gerant') => {
    if (!currentUser) {
      setCurrentTab('profile');
      return;
    }
    setPreselectedChatEstId(estId);
    setPreselectedChatRecipient(recipient);
    setCurrentTab('messages');
  };

  const handleStartChatWithConv = (convId: string) => {
    setPreselectedConvId(convId);
    setCurrentTab('messages');
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 selection:bg-orange-100 selection:text-orange-900 pb-safe">
      <TopBar />
      
      <main className="w-full">
        {currentTab === 'home' && <HomeView onStartChat={handleStartChat} />}
        {currentTab === 'explore' && <ExploreView onStartChat={handleStartChat} onNavigate={setCurrentTab} />}
        {currentTab === 'favorites' && <FavoritesView onStartChat={handleStartChat} />}
        {currentTab === 'recruitments' && <RecruitmentsView onNavigate={setCurrentTab} onStartChatWithConv={handleStartChatWithConv} />}
        {currentTab === 'messages' && (
          <MessagesView 
            preselectedEstablishmentId={preselectedChatEstId} 
            preselectedRecipientType={preselectedChatRecipient}
            preselectedConvId={preselectedConvId}
            onClearPreselected={() => {
              setPreselectedChatEstId(null);
              setPreselectedChatRecipient('gerant');
              setPreselectedConvId(null);
            }} 
            onBackToHome={() => setCurrentTab('home')}
          />
        )}
        {currentTab === 'profile' && <ProfileView onNavigate={setCurrentTab} onStartChatWithConv={handleStartChatWithConv} />}
      </main>

      <BottomNav currentTab={currentTab} onChange={setCurrentTab} />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
