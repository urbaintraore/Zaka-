import React from 'react';
import { Users, UserPlus, Check, X } from 'lucide-react';
import { useAppStore } from '../store';

export function FriendsModule({ onStartChatWithConv, onInviteFriendToOuting }: { onStartChatWithConv?: (convId: string) => void; onInviteFriendToOuting?: (friendId: any) => void }) {
  const { users, currentUser, relationshipRequests, sendFriendRequest, acceptFriendRequest, declineFriendRequest } = useAppStore();

  const pendingRequests = relationshipRequests.filter(r => r.status === 'pending' || r.status === 'en_attente');

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="text-orange-600" size={18} />
        <h3 className="text-sm font-bold text-gray-900">Réseau & Amis</h3>
      </div>

      {pendingRequests.length > 0 && (
        <div className="p-3 bg-orange-50 border border-orange-100 rounded-xl space-y-2">
          <h4 className="text-xs font-bold text-orange-900">Demandes en attente</h4>
          {pendingRequests.map(req => (
            <div key={req.id} className="flex items-center justify-between py-1">
              <span className="text-xs text-gray-800">{req.fromUserName}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => acceptFriendRequest(req.id)}
                  className="p-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  <Check size={14} />
                </button>
                <button
                  onClick={() => declineFriendRequest(req.id)}
                  className="p-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-xs font-bold text-gray-700">Membres suggérés</h4>
        <div className="divide-y divide-gray-100">
          {users.filter(u => u.id !== currentUser?.id).map(u => (
            <div key={u.id} className="py-2 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-gray-900">{u.name}</p>
                <p className="text-[10px] text-gray-500">{u.city}, {u.country}</p>
              </div>
              <button
                onClick={() => sendFriendRequest(u.id)}
                className="px-2.5 py-1 bg-gray-100 hover:bg-orange-100 hover:text-orange-600 text-gray-700 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1"
              >
                <UserPlus size={12} />
                <span>Ajouter</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
