import { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { BottomNav, Tab } from './components/BottomNav';
import { HomeView } from './views/HomeView';
import { ExploreView } from './views/ExploreView';
import { FavoritesView } from './views/FavoritesView';
import { RecruitmentsView } from './views/RecruitmentsView';
import { ProfileView } from './views/ProfileView';
import { MessagesView } from './views/MessagesView';
import { HelpView } from './views/HelpView';
import { AppProvider, useAppStore } from './store';
import { Toast } from './components/Toast';
import { BackToTop } from './components/BackToTop';
import { InstallPrompt } from './components/InstallPrompt';
import { requestNotificationPermission, sendPushNotification } from './utils/pushNotifications';
import { Database, Copy, Check, AlertTriangle, WifiOff, HardDrive } from 'lucide-react';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<Tab>('home');
  const [preselectedChatEstId, setPreselectedChatEstId] = useState<string | null>(null);
  const [preselectedChatRecipient, setPreselectedChatRecipient] = useState<'gerant' | 'dj'>('gerant');
  const [preselectedConvId, setPreselectedConvId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const { currentUser, loading, reservations, missingTables, setGlobalError, isOffline, offlineCachedCount } = useAppStore();

  const handleCopySQL = async () => {
    try {
      const response = await fetch('/supabase_schema.sql');
      const text = await response.text();
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setGlobalError({
        message: 'Le script SQL a été copié dans votre presse-papiers. Collez-le dans le SQL Editor de Supabase.',
        type: 'info',
        code: 'supabase/connected'
      });
      setTimeout(() => setIsCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy SQL:', err);
    }
  };

  // Logging rendering state
  console.log('[AppContent Render]', {
    currentTab,
    loading,
    currentUserExists: !!currentUser,
    userId: currentUser?.id,
    userRole: currentUser?.role,
    reservationsCount: reservations?.length,
    missingTablesCount: missingTables?.length
  });

  useEffect(() => {
    console.log('[AppContent Mounted]');
    // Request push notification permissions on mount
    requestNotificationPermission().then(granted => {
      console.log('Notification permission granted:', granted);
    }).catch((err) => {
      console.warn('Notification permission request ignored or failed in iframe:', err);
    });
  }, []);

  // Automated trigger: push reminder to client 2 hours before their reservation
  useEffect(() => {
    if (!currentUser || !reservations) {
      console.log('[AppContent] Skipping notification check: no user or no reservations loaded');
      return;
    }

    console.log('[AppContent] Setting up notification check for reservations...', reservations.length);
    let notifiedKeys = new Set<string>();
    try {
      const stored = localStorage.getItem('zaka_notified_reservations');
      if (stored) {
        notifiedKeys = new Set<string>(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Could not read zaka_notified_reservations from localStorage:", e);
    }

    const checkReservations = () => {
      const now = new Date();
      
      reservations.forEach(res => {
        // Only notify the client of their confirmed reservations
        if (res.clientId === currentUser.id && res.status === 'confirmee') {
          const key = `notified_2h_${res.id}`;
          if (notifiedKeys.has(key)) return;

          try {
            // res.date: YYYY-MM-DD, res.time: HH:MM
            const resDateParts = res.date.split('-');
            const resTimeParts = (res.time || '00:00').split(':');
            
            const resDateTime = new Date(
              parseInt(resDateParts[0]),
              parseInt(resDateParts[1]) - 1,
              parseInt(resDateParts[2]),
              parseInt(resTimeParts[0]),
              parseInt(resTimeParts[1])
            );
            
            const diffMs = resDateTime.getTime() - now.getTime();
            const diffMins = Math.round(diffMs / (1000 * 60));

            // If reservation is in 105 to 125 mins (approx 2h)
            if (diffMins >= 105 && diffMins <= 125) {
              sendPushNotification(
                "Rappel de réservation 🍽️",
                `Bonjour ${res.clientName}, votre table chez "${res.establishmentName}" est réservée dans 2 heures (${res.time}). Merci de confirmer votre venue !`,
                `#profile`
              );
              
              notifiedKeys.add(key);
              localStorage.setItem('zaka_notified_reservations', JSON.stringify(Array.from(notifiedKeys)));
            }
          } catch (e) {
            console.error("Erreur calcul de l'heure de notification :", e);
          }
        }
      });
    };

    // Run check immediately on mount/update
    checkReservations();

    // Check periodically every minute
    const interval = setInterval(checkReservations, 60000);
    return () => clearInterval(interval);
  }, [currentUser, reservations]);

  if (loading) {
    console.log('[AppContent] Render showing Spinner (loading is true)');
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const handleStartChat = (estId: string, recipient: 'gerant' | 'dj' = 'gerant') => {
    console.log('[AppContent] handleStartChat triggered:', { estId, recipient });
    if (!currentUser) {
      setCurrentTab('profile');
      return;
    }
    setPreselectedChatEstId(estId);
    setPreselectedChatRecipient(recipient);
    setCurrentTab('messages');
  };

  const handleStartChatWithConv = (convId: string) => {
    console.log('[AppContent] handleStartChatWithConv triggered:', { convId });
    setPreselectedConvId(convId);
    setCurrentTab('messages');
  };

  console.log('[AppContent] Rendering layout, currentTab =', currentTab);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 font-sans text-gray-900 dark:text-gray-100 selection:bg-orange-100 selection:text-orange-900 pb-safe">
      <TopBar onNavigate={setCurrentTab} />

      {isOffline && (
        <div className="bg-amber-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-sm animate-pulse">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <WifiOff className="w-4 h-4 shrink-0" />
            <span>
              Mode Hors-Ligne actif — Les établissements sont chargés et consultables directement depuis le stockage IndexedDB ({offlineCachedCount} établissements en cache).
            </span>
          </div>
        </div>
      )}
      
      {missingTables && missingTables.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800/50 p-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 dark:bg-amber-800/40 p-2 rounded-xl text-amber-600 dark:text-amber-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                  Action Requise : Mise à jour de la base de données
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-[10px] uppercase tracking-wider font-black">
                    Importante
                  </span>
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5 leading-relaxed">
                  {missingTables.some(t => t.includes('RLS')) 
                    ? "Mise à jour des politiques de sécurité RLS requise. Cliquez ci-contre pour copier le script et l'exécuter dans le SQL Editor de Supabase."
                    : `Des tables ou colonnes nécessitent une synchronisation (${missingTables.slice(0, 3).join(', ')}...). Copiez et exécutez le script SQL pour synchroniser.`
                  }
                </p>
              </div>
            </div>
            
            <button 
              onClick={handleCopySQL}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                isCopied 
                ? 'bg-emerald-500 text-white' 
                : 'bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/20'
              }`}
            >
              {isCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copié !
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier le Script SQL
                </>
              )}
            </button>
          </div>
        </div>
      )}

      <main className="w-full">
        {currentTab === 'home' && <HomeView onStartChat={handleStartChat} onNavigate={setCurrentTab} />}
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
        {currentTab === 'help' && <HelpView onNavigate={setCurrentTab} />}
      </main>

      <BackToTop />
      <BottomNav currentTab={currentTab} onChange={setCurrentTab} />
      <InstallPrompt />
      <Toast />
    </div>
  );
}

export default function App() {
  console.log('[App Mount] Rendering App component');
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
