import { useState, useEffect } from 'react';
import { X, Check, Clock, XCircle, Info, Calendar, UserPlus, Users, Scissors, CheckCircle, Sparkles, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../store';
import { AppNotification } from '../types';

interface NotificationsModalProps {
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export function NotificationsModal({ onClose, onNavigateTab }: NotificationsModalProps) {
  const { 
    currentUser, 
    notifications: storeNotifications = [],
    serviceRequests, 
    relationshipRequests, 
    establishments, 
    friendships, 
    users, 
    acceptFriendRequest, 
    declineFriendRequest 
  } = useAppStore();

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [localNotifs, setLocalNotifs] = useState<AppNotification[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('zaka_notifications');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setLocalNotifs(parsed);
        }
      }
    } catch {}
  }, []);

  if (!currentUser) return null;

  const myEsts = establishments.filter(e => e.ownerId === currentUser.id);
  const myEstIds = myEsts.map(e => e.id);

  // Pour les clients: status de leurs propres requêtes de service + invitations des gérants
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

  // Demandes d'amitié entrantes
  const incomingFriendRequests = (friendships || []).filter(
    f => (f.user1Id === currentUser.id || f.user2Id === currentUser.id) && 
         f.requesterId !== currentUser.id && 
         f.status === 'pending'
  );

  // App notifications specifically for current user or beauty appointment updates
  const combinedAppNotifs = [...storeNotifications, ...localNotifs].filter((n, idx, self) => 
    self.findIndex(t => t.id === n.id) === idx &&
    (!n.userId || n.userId === currentUser.id || currentUser.role === 'client')
  );

  const allNotifications = [
    ...combinedAppNotifs.map(n => ({ type: 'app_notification' as const, data: n, date: new Date(n.createdAt || Date.now()) })),
    ...incomingFriendRequests.map(req => ({ type: 'friend_request' as const, data: req, date: new Date(req.createdAt || Date.now()) })),
    ...relevantServiceRequests.map(req => ({ type: 'service' as const, data: req, date: new Date(req.date) })),
    ...relevantRelRequests.map(req => ({ type: 'relation' as const, data: req, date: new Date(req.date) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const handleAcceptFriend = async (friendshipId: string) => {
    setActionLoadingId(friendshipId);
    try {
      await acceptFriendRequest(friendshipId);
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: "Demande d'amitié acceptée ! Vous êtes désormais connecté(e)s.", type: "success" }
      }));
    } catch (err: any) {
      console.error("Erreur acceptation ami:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeclineFriend = async (friendshipId: string) => {
    setActionLoadingId(friendshipId);
    try {
      await declineFriendRequest(friendshipId);
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: "Demande d'amitié refusée.", type: "info" }
      }));
    } catch (err: any) {
      console.error("Erreur refus ami:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] shadow-2xl border border-gray-100 dark:border-gray-800">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg text-gray-900 dark:text-white">Centre de Notifications</h2>
            {allNotifications.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-extrabold text-xs">
                {allNotifications.length}
              </span>
            )}
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer"
            aria-label="Fermer les notifications"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {allNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-50 text-orange-500" />
              <p className="text-sm font-medium">Aucune notification pour le moment.</p>
              <p className="text-xs text-gray-400 mt-1">Vous recevrez ici les confirmations de vos rendez-vous et invitations.</p>
            </div>
          ) : (
            allNotifications.map((notif, idx) => {
              if (notif.type === 'app_notification') {
                const item = notif.data as any;
                const isBeauty = item.type === 'beauty_appointment_update' || item.title?.includes('Beauté') || item.title?.includes('Rendez-vous');
                const isConfirmed = item.title?.includes('confirmé') || item.message?.includes('confirmé');
                const isCancelled = item.title?.includes('annulé') || item.message?.includes('annulé');

                return (
                  <div 
                    key={`app-notif-${item.id || idx}`}
                    className={`rounded-2xl p-4 border shadow-xs transition-all ${
                      isConfirmed 
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                        : isCancelled
                        ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40'
                        : 'bg-orange-50/70 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl shrink-0 ${
                        isConfirmed 
                          ? 'bg-emerald-500 text-white' 
                          : isCancelled 
                          ? 'bg-rose-500 text-white' 
                          : 'bg-orange-500 text-white'
                      }`}>
                        {isBeauty ? <Scissors className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-black text-gray-900 dark:text-white truncate">
                            {item.title}
                          </h4>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            isConfirmed 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                              : isCancelled
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300'
                              : 'bg-orange-100 text-orange-800 dark:bg-orange-900/60 dark:text-orange-300'
                          }`}>
                            {isConfirmed ? 'Confirmé' : isCancelled ? 'Annulé' : 'Alerte RDV'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-1 leading-relaxed">
                          {item.message}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1.5 font-medium">
                          {new Date(notif.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              } else if (notif.type === 'friend_request') {
                const req = notif.data as any;
                const sender = users.find(u => u.id === req.requesterId) || {
                  id: req.requesterId,
                  name: 'Utilisateur ZAKA',
                  email: '',
                  phone: ''
                };
                return (
                  <div key={`friend-${req.id || idx}`} className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 rounded-2xl p-4 border border-amber-200 dark:border-amber-800/40 shadow-xs">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-black flex items-center justify-center text-sm shrink-0 shadow-sm">
                        {sender.name ? sender.name.charAt(0).toUpperCase() : <UserPlus className="w-5 h-5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-black text-gray-900 dark:text-white truncate">{sender.name}</p>
                          <span className="text-[10px] text-amber-700 dark:text-amber-300 font-semibold bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">Demande d'ami</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                          Souhaite devenir votre ami(e) sur Zaka+ pour partager sorties, discussions et bons plans.
                        </p>
                        {sender.phone && (
                          <p className="text-[10px] text-gray-400 mt-0.5">📞 {sender.phone}</p>
                        )}
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => handleAcceptFriend(req.id)}
                            disabled={actionLoadingId === req.id}
                            className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Accepter
                          </button>
                          <button
                            onClick={() => handleDeclineFriend(req.id)}
                            disabled={actionLoadingId === req.id}
                            className="py-1.5 px-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Refuser
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else if (notif.type === 'service') {
                const req = notif.data as any;
                const est = establishments.find(e => e.id === req.establishmentId);
                return (
                  <div key={`srv-${idx}`} className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        req.status === 'validee' ? 'bg-green-100 dark:bg-green-950/60 text-green-600' :
                        req.status === 'refusee' ? 'bg-red-100 dark:bg-red-950/60 text-red-600' :
                        'bg-orange-100 dark:bg-orange-950/60 text-orange-600'
                      }`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {currentUser.role === 'client' ? `Votre réservation chez ${est?.name || 'Inconnu'}` : `Nouvelle réservation de client`}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{req.details}</p>
                        {req.managerMessage && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-800 font-medium">"{req.managerMessage}"</p>
                        )}
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">Statut: <span className="uppercase">{req.status.replace('_', ' ')}</span></p>
                      </div>
                    </div>
                  </div>
                );
              } else {
                const req = notif.data as any;
                const est = establishments.find(e => e.id === req.establishmentId);
                return (
                  <div key={`rel-${idx}`} className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl shrink-0 bg-blue-100 dark:bg-blue-950/60 text-blue-600">
                        <Info className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Demande d'association</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {req.type === 'gerant_invite' 
                            ? `Invitation à rejoindre le club de ${est?.name || 'Inconnu'}` 
                            : `Demande d'un client pour rejoindre ${est?.name || 'Inconnu'}`}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">Statut: <span className="uppercase">{req.status.replace('_', ' ')}</span></p>
                      </div>
                    </div>
                  </div>
                );
              }
            })
          )}
        </div>
      </div>
    </div>
  );
}
