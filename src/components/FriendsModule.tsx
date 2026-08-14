import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Users, UserPlus, Search, Check, X, MessageSquare, UserX, Clock, ShieldCheck } from 'lucide-react';
import { User } from '../types';

interface FriendsModuleProps {
  onStartChatWithUser?: (userId: string) => void;
}

export function FriendsModule({ onStartChatWithUser }: FriendsModuleProps) {
  const { 
    currentUser, 
    users, 
    friendships, 
    sendFriendRequest, 
    acceptFriendRequest, 
    declineFriendRequest, 
    removeFriend,
    createConversation
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'my_friends' | 'requests' | 'find'>('my_friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!currentUser) return null;

  // Helper to find friendship record between currentUser and targetUserId
  const getFriendshipWith = (targetUserId: string) => {
    const u1 = currentUser.id < targetUserId ? currentUser.id : targetUserId;
    const u2 = currentUser.id < targetUserId ? targetUserId : currentUser.id;
    return friendships.find(f => f.user1Id === u1 && f.user2Id === u2);
  };

  // Get accepted friends
  const myAcceptedFriendships = friendships.filter(
    f => (f.user1Id === currentUser.id || f.user2Id === currentUser.id) && f.status === 'accepted'
  );

  const myFriends: { friendUser: User; friendshipId: string }[] = myAcceptedFriendships.map(f => {
    const friendId = f.user1Id === currentUser.id ? f.user2Id : f.user1Id;
    const friendUser = users.find(u => u.id === friendId) || {
      id: friendId,
      name: 'Utilisateur ZAKA',
      role: 'client'
    };
    return { friendUser, friendshipId: f.id };
  });

  // Incoming pending requests
  const incomingRequests = friendships.filter(
    f => (f.user1Id === currentUser.id || f.user2Id === currentUser.id) && 
         f.requesterId !== currentUser.id && 
         f.status === 'pending'
  );

  // Sent pending requests
  const outgoingRequests = friendships.filter(
    f => (f.user1Id === currentUser.id || f.user2Id === currentUser.id) && 
         f.requesterId === currentUser.id && 
         f.status === 'pending'
  );

  // Search filter for "My Friends"
  const filteredMyFriends = myFriends.filter(({ friendUser }) =>
    friendUser.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (friendUser.email && friendUser.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (friendUser.phone && friendUser.phone.includes(searchQuery))
  );

  // Search for new users to add
  const otherUsers = users.filter(u => u.id !== currentUser.id);
  const filteredSearchUsers = otherUsers.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.phone && u.phone.includes(searchQuery)) ||
    (u.city && u.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const handleSendRequest = async (targetUserId: string) => {
    setLoadingActionId(targetUserId);
    try {
      await sendFriendRequest(targetUserId);
      showFeedback('success', "Demande d'amitié envoyée !");
    } catch (err: any) {
      showFeedback('error', err.message || "Impossible d'envoyer la demande.");
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleAccept = async (friendshipId: string) => {
    setLoadingActionId(friendshipId);
    try {
      await acceptFriendRequest(friendshipId);
      showFeedback('success', "Demande d'amitié acceptée !");
    } catch (err: any) {
      showFeedback('error', err.message || "Erreur lors de l'acceptation.");
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDecline = async (friendshipId: string) => {
    setLoadingActionId(friendshipId);
    try {
      await declineFriendRequest(friendshipId);
      showFeedback('success', "Demande d'amitié refusée.");
    } catch (err: any) {
      showFeedback('error', err.message || "Erreur lors du refus.");
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleRemove = async (friendshipId: string, friendName: string) => {
    if (!window.confirm(`Voulez-vous vraiment retirer ${friendName} de vos ami(e)s ?`)) return;
    setLoadingActionId(friendshipId);
    try {
      await removeFriend(friendshipId);
      showFeedback('success', `${friendName} à été retiré(e) de vos ami(e)s.`);
    } catch (err: any) {
      showFeedback('error', err.message || "Erreur lors de la suppression.");
    } finally {
      setLoadingActionId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-5 md:p-6 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            Mes Ami(e)s & Réseau ZAKA
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Liez-vous avec vos proches pour organiser facilement des sorties de groupe.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            onClick={() => { setActiveTab('my_friends'); setSearchQuery(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'my_friends'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Ami(e)s ({myFriends.length})
          </button>

          <button
            onClick={() => { setActiveTab('requests'); setSearchQuery(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 relative ${
              activeTab === 'requests'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Demandes
            {incomingRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full font-bold">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('find'); setSearchQuery(''); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'find'
                ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Trouver
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {feedbackMsg && (
        <div className={`mb-4 p-3 rounded-xl text-xs font-medium flex items-center justify-between transition-all ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: MY FRIENDS */}
      {activeTab === 'my_friends' && (
        <div>
          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher parmi mes ami(e)s..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {filteredMyFriends.length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {searchQuery ? "Aucun ami trouvé pour cette recherche" : "Vous n'avez pas encore d'amis sur ZAKA"}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
                Liez-vous avec vos proches pour pouvoir les inviter en un clic à vos sorties et partager vos avis !
              </p>
              <button
                onClick={() => setActiveTab('find')}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl text-xs font-semibold shadow-sm hover:from-amber-600 hover:to-amber-700 transition-all inline-flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Trouver des ami(e)s
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredMyFriends.map(({ friendUser, friendshipId }) => (
                <div 
                  key={friendshipId}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-800/40 bg-white dark:bg-slate-800/80 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center text-sm border border-amber-200 dark:border-amber-800/30">
                      {friendUser.avatar ? (
                        <img src={friendUser.avatar} alt={friendUser.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        friendUser.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                        {friendUser.name}
                        {friendUser.role === 'gerant' && (
                          <span className="px-1.5 py-0.5 text-[9px] bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 rounded font-semibold">Gérant</span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {friendUser.city || 'Burkina Faso'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleRemove(friendshipId, friendUser.name)}
                      disabled={loadingActionId === friendshipId}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all"
                      title="Retirer cet ami"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REQUESTS */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Incoming requests */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Demandes reçues ({incomingRequests.length})
            </h4>

            {incomingRequests.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                Aucune demande d'amitié reçue pour le moment.
              </p>
            ) : (
              <div className="space-y-2">
                {incomingRequests.map(req => {
                  const sender = users.find(u => u.id === req.requesterId) || {
                    id: req.requesterId,
                    name: 'Utilisateur ZAKA',
                    role: 'client'
                  };

                  return (
                    <div 
                      key={req.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-amber-100 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 font-bold flex items-center justify-center text-xs">
                          {sender.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">{sender.name}</h5>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400">Souhaite vous ajouter à ses amis</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAccept(req.id)}
                          disabled={loadingActionId === req.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accepter
                        </button>
                        <button
                          onClick={() => handleDecline(req.id)}
                          disabled={loadingActionId === req.id}
                          className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Outgoing requests */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
              Demandes envoyées en attente ({outgoingRequests.length})
            </h4>

            {outgoingRequests.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl">
                Vous n'avez aucune invitation en attente.
              </p>
            ) : (
              <div className="space-y-2">
                {outgoingRequests.map(req => {
                  const targetId = req.user1Id === currentUser.id ? req.user2Id : req.user1Id;
                  const recipient = users.find(u => u.id === targetId) || {
                    id: targetId,
                    name: 'Utilisateur ZAKA',
                    role: 'client'
                  };

                  return (
                    <div 
                      key={req.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs">
                          {recipient.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-slate-900 dark:text-white">{recipient.name}</h5>
                          <p className="text-[10px] text-slate-400">Invitation envoyée</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDecline(req.id)}
                        disabled={loadingActionId === req.id}
                        className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all"
                      >
                        Annuler
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FIND FRIENDS */}
      {activeTab === 'find' && (
        <div>
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, e-mail ou téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {filteredSearchUsers.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 dark:text-slate-400">
              Aucun autre utilisateur trouvé correspondant à votre recherche.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {filteredSearchUsers.map(otherUser => {
                const friendship = getFriendshipWith(otherUser.id);
                const isAccepted = friendship?.status === 'accepted';
                const isPending = friendship?.status === 'pending';
                const isIncoming = isPending && friendship.requesterId !== currentUser.id;

                return (
                  <div 
                    key={otherUser.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-white dark:bg-slate-800/80 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-sm border border-slate-200 dark:border-slate-700">
                        {otherUser.avatar ? (
                          <img src={otherUser.avatar} alt={otherUser.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          otherUser.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {otherUser.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {otherUser.city || 'Burkina Faso'}
                        </p>
                      </div>
                    </div>

                    <div>
                      {isAccepted ? (
                        <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800/40 inline-flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Ami(e)
                        </span>
                      ) : isIncoming ? (
                        <button
                          onClick={() => handleAccept(friendship.id)}
                          disabled={loadingActionId === friendship.id}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold rounded-lg shadow-sm transition-all inline-flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          Accepter
                        </button>
                      ) : isPending ? (
                        <span className="px-2.5 py-1 text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-800/30 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          En attente
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(otherUser.id)}
                          disabled={loadingActionId === otherUser.id}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1 shadow-sm"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          Ajouter
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
