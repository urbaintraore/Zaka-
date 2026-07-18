import { X, Check, Clock, XCircle, Info, Calendar } from 'lucide-react';
import { useAppStore } from '../store';

interface NotificationsModalProps {
  onClose: () => void;
}

export function NotificationsModal({ onClose }: NotificationsModalProps) {
  const { currentUser, serviceRequests, relationshipRequests, establishments } = useAppStore();

  if (!currentUser) return null;

  const myEsts = establishments.filter(e => e.ownerId === currentUser.id);
  const myEstIds = myEsts.map(e => e.id);

  // Pour les clients: status de leurs propres requêtes de service + invitations des gérants
  // Pour les gérants: nouvelles demandes de services sur leurs établissements + requêtes pour rejoindre
  
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

  const allNotifications = [
    ...relevantServiceRequests.map(req => ({ type: 'service', data: req, date: new Date(req.date) })),
    ...relevantRelRequests.map(req => ({ type: 'relation', data: req, date: new Date(req.date) }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] shadow-2xl">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <h2 className="font-bold text-lg text-gray-900">Notifications</h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {allNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Aucune notification pour le moment.</p>
            </div>
          ) : (
            allNotifications.map((notif, idx) => {
              if (notif.type === 'service') {
                const req = notif.data as any;
                const est = establishments.find(e => e.id === req.establishmentId);
                return (
                  <div key={idx} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        req.status === 'validee' ? 'bg-green-100 text-green-600' :
                        req.status === 'refusee' ? 'bg-red-100 text-red-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {currentUser.role === 'client' ? `Votre réservation chez ${est?.name || 'Inconnu'}` : `Nouvelle réservation de client`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{req.details}</p>
                        {req.managerMessage && (
                          <p className="text-xs text-gray-600 mt-2 bg-white p-2 rounded-lg border border-gray-100 font-medium">"{req.managerMessage}"</p>
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
                  <div key={idx} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl shrink-0 bg-blue-100 text-blue-600">
                        <Info className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">Demande d'association</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
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
