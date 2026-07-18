import { useState } from 'react';
import { MapPin, Bell, LogOut } from 'lucide-react';
import { useAppStore } from '../store';
import { NotificationsModal } from './NotificationsModal';

export function TopBar() {
  const { currentUser, logout, serviceRequests, relationshipRequests, establishments } = useAppStore();
  const [showNotifications, setShowNotifications] = useState(false);

  const myEsts = establishments.filter(e => e.ownerId === currentUser?.id);
  const myEstIds = myEsts.map(e => e.id);

  let unreadNotifications = 0;
  if (currentUser) {
    const relevantServiceRequests = serviceRequests.filter(req => {
      if (currentUser.role === 'client' && req.clientId === currentUser.id && req.status !== 'en_attente') return true;
      if (currentUser.role === 'gerant' && myEstIds.includes(req.establishmentId) && req.status === 'en_attente') return true;
      return false;
    });

    const relevantRelRequests = relationshipRequests.filter(req => {
      if (req.targetId === currentUser.id && req.status === 'en_attente') return true;
      if (currentUser.role === 'gerant' && myEstIds.includes(req.establishmentId) && req.status === 'en_attente' && req.type === 'client_join') return true;
      return false;
    });

    unreadNotifications = relevantServiceRequests.length + relevantRelRequests.length;
  }

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-orange-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-orange-600">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
            <img src="/logo.jpg" alt="Zaka+ Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="font-extrabold text-xl tracking-tight">Zaka+</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center text-xs font-medium text-gray-600 bg-gray-100 px-2.5 py-1.5 rounded-full">
            <MapPin className="w-3.5 h-3.5 mr-1 text-orange-500" />
            Ouaga
          </div>
          <button 
            onClick={() => setShowNotifications(true)}
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 border border-white rounded-full"></span>
            )}
          </button>
          {currentUser && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200">
              <span className="text-sm font-medium text-gray-700">{currentUser.name}</span>
              <button onClick={logout} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full" title="Déconnexion">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </header>

      {showNotifications && (
        <NotificationsModal onClose={() => setShowNotifications(false)} />
      )}
    </>
  );
}
