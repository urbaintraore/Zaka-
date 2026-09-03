import { useState } from 'react';
import { MapPin, Bell, LogOut, BookOpen, Sun, Moon, HelpCircle } from 'lucide-react';
import { useAppStore } from '../store';
import { NotificationsModal } from './NotificationsModal';
import { UserGuideModal } from './UserGuideModal';
import { Tab } from './BottomNav';
import logoImg from '../assets/images/zaka_black_z_logo_1784458806560.jpg';

interface TopBarProps {
  onNavigate?: (tab: Tab) => void;
}

export function TopBar({ onNavigate }: TopBarProps) {
  const { currentUser, logout, serviceRequests, relationshipRequests, establishments, theme, toggleTheme } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  const myEsts = establishments.filter(e => e.ownerId === currentUser?.id);
  const myEstIds = myEsts.map(e => e.id);

  let unreadNotifications = 0;
  if (currentUser) {
    const relevantServiceRequests = serviceRequests.filter(req => {
      if (currentUser.role === 'client' && req.clientId === currentUser.id && req.status !== 'en_attente') return true;
      if ((currentUser.role === 'gerant' || currentUser.role === 'salon_coiffure') && myEstIds.includes(req.establishmentId) && req.status === 'en_attente') return true;
      return false;
    });

    const relevantRelRequests = relationshipRequests.filter(req => {
      if (req.targetId === currentUser.id && req.status === 'en_attente') return true;
      if ((currentUser.role === 'gerant' || currentUser.role === 'salon_coiffure') && myEstIds.includes(req.establishmentId) && req.status === 'en_attente' && req.type === 'client_join') return true;
      return false;
    });

    unreadNotifications = relevantServiceRequests.length + relevantRelRequests.length;
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-orange-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between transition-colors">
        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-500">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
            <img src={logoImg} alt="Zaka+ Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-extrabold text-xl tracking-tight">Zaka+</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5 rounded-full">
            <MapPin className="w-3.5 h-3.5 mr-1 text-orange-500" />
            Ouaga
          </div>
          <button 
            onClick={toggleTheme}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
            title={theme === 'dark' ? "Passer au thème clair" : "Passer au thème sombre"}
            aria-label="Basculer le thème"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>
          <button 
            onClick={() => onNavigate ? onNavigate('help') : setShowGuideModal(true)}
            className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-full flex items-center gap-1 font-bold text-xs transition-colors"
            title="Aide & FAQ Réservations Gérants"
          >
            <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline">Aide</span>
          </button>
          <button 
            onClick={() => setShowGuideModal(true)}
            className="p-2 text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/40 rounded-full flex items-center gap-1 font-bold text-xs transition-colors"
            title="Guide d'utilisation Zaka+"
          >
            <BookOpen className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span className="hidden sm:inline">Guide</span>
          </button>
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border border-white dark:border-gray-900 rounded-full"></span>
            )}
          </button>
          {currentUser && (
            <div className="flex items-center gap-2 ml-1 sm:ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:inline">{currentUser.name}</span>
              <button onClick={logout} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-full transition-colors" title="Déconnexion">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {showNotifications && (
        <NotificationsModal onClose={() => setShowNotifications(false)} />
      )}

      {showGuideModal && (
        <UserGuideModal onClose={() => setShowGuideModal(false)} />
      )}
    </>
  );
}
