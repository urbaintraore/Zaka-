import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Users, Calendar, Clock, Share2, Check, HelpCircle, XCircle, Plus, Trash2, Send, CheckCircle2, Sparkles, UserPlus, ShieldCheck } from 'lucide-react';
import { GroupOuting, User } from '../types';

interface GroupOutingModalProps {
  onClose: () => void;
  preselectedEstablishmentId?: string;
}

export function GroupOutingModal({ onClose, preselectedEstablishmentId }: GroupOutingModalProps) {
  const { 
    currentUser, 
    users,
    friendships,
    establishments, 
    groupOutings, 
    createGroupOuting, 
    respondGroupOuting, 
    deleteGroupOuting, 
    inviteFriendsToGroupOuting,
    addReservation 
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'mes_sorties' | 'creer'>('mes_sorties');
  const [selectedOutingId, setSelectedOutingId] = useState<string | null>(null);

  // Form states
  const [estId, setEstId] = useState(preselectedEstablishmentId || (establishments[0]?.id || ''));
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('20:00');
  const [note, setNote] = useState('');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [convertedReservationId, setConvertedReservationId] = useState<string | null>(null);
  const [showInviteMoreFriends, setShowInviteMoreFriends] = useState(false);
  const [moreFriendIds, setMoreFriendIds] = useState<string[]>([]);

  const selectedEst = establishments.find(e => e.id === estId);

  // User's accepted friends
  const myAcceptedFriendships = (friendships || []).filter(
    f => currentUser && (f.user1Id === currentUser.id || f.user2Id === currentUser.id) && f.status === 'accepted'
  );

  const myFriends: User[] = myAcceptedFriendships.map(f => {
    const friendId = f.user1Id === currentUser?.id ? f.user2Id : f.user1Id;
    return users.find(u => u.id === friendId) || {
      id: friendId,
      name: 'Ami(e) ZAKA',
      role: 'client' as const
    };
  });

  // User's group outings (creator or participant)
  const myOutings = currentUser ? groupOutings.filter(g => g.creatorId === currentUser.id || (g.responses && g.responses.some(r => r.userId === currentUser.id))) : [];
  const activeOuting = selectedOutingId ? groupOutings.find(g => g.id === selectedOutingId) : (myOutings[0] || null);

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriendIds(prev => 
      prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
    );
  };

  const toggleMoreFriendSelection = (friendId: string) => {
    setMoreFriendIds(prev => 
      prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!estId || !title || !date) return;

    try {
      setLoading(true);
      const est = establishments.find(e => e.id === estId);
      const outingId = await createGroupOuting({
        title,
        establishmentId: estId,
        establishmentName: est?.name || 'Établissement',
        date,
        time,
        note
      }, selectedFriendIds);

      setSelectedOutingId(outingId);
      setActiveTab('mes_sorties');
      setTitle('');
      setNote('');
      setSelectedFriendIds([]);
    } catch (err: any) {
      alert("Erreur lors de la création : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMoreFriends = async (outingId: string) => {
    if (moreFriendIds.length === 0) return;
    try {
      setLoading(true);
      await inviteFriendsToGroupOuting(outingId, moreFriendIds);
      setMoreFriendIds([]);
      setShowInviteMoreFriends(false);
      alert("Invitations envoyées à vos ami(e)s !");
    } catch (err: any) {
      alert("Erreur lors de l'envoi des invitations : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyShareLink = (shareCode: string) => {
    const text = `Rejoins ma sortie de groupe sur Zaka.bf ! Code invitation : ${shareCode}`;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleConvertToReservation = async (outing: GroupOuting) => {
    try {
      setLoading(true);
      const comingCount = (outing.responses || []).filter(r => r.status === 'je_viens').length;
      await addReservation({
        clientId: currentUser!.id,
        clientName: currentUser!.name,
        establishmentId: outing.establishmentId,
        establishmentName: outing.establishmentName,
        date: outing.date,
        time: outing.time,
        guestsCount: Math.max(1, comingCount),
        reservationType: 'entre ami(e)s',
        note: `Réservation issue de la sortie de groupe "${outing.title}". (${comingCount} confirmés)`
      });
      setConvertedReservationId(outing.id);
      alert("Réservation officielle envoyée au gérant de " + outing.establishmentName + " !");
    } catch (err: any) {
      alert("Erreur lors de la réservation : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-950 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between bg-gradient-to-r from-orange-500 to-amber-500 text-white">
          <div className="flex items-center gap-2.5">
            <Users className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-black leading-tight">Sorties de Groupe</h2>
              <p className="text-xs text-orange-100">Organisez vos événements & sondez vos ami(e)s</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full text-white transition-colors">
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40">
          <button
            onClick={() => setActiveTab('mes_sorties')}
            className={`flex-1 py-3 px-4 text-xs font-bold text-center border-b-2 transition-all ${
              activeTab === 'mes_sorties'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-white dark:bg-gray-900'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800'
            }`}
          >
            📋 Mes Sorties ({myOutings.length})
          </button>
          <button
            onClick={() => setActiveTab('creer')}
            className={`flex-1 py-3 px-4 text-xs font-bold text-center border-b-2 transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'creer'
                ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-white dark:bg-gray-900'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800'
            }`}
          >
            <Plus className="w-4 h-4" /> Organiser une sortie
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: CREATE OUTING */}
          {activeTab === 'creer' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Nom de l'événement / Titre
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ex: Soirée Anniversaire Karim, Afterwork Vendredi..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-900 text-sm font-medium text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Établissement
                  </label>
                  <select
                    value={estId}
                    onChange={e => setEstId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-900 text-xs font-bold text-gray-900 dark:text-white outline-none"
                  >
                    {establishments.map(e => (
                      <option key={e.id} value={e.id}>{e.name} ({e.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Date & Heure
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      required
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-900 text-xs font-bold text-gray-900 dark:text-white"
                    />
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={e => setTime(e.target.value)}
                      className="w-24 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-900 text-xs font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Message / Invitation aux amis
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Ex: On se retrouve là-bas pour fêter la fin des examens ! Confirmez vite votre présence."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 dark:bg-gray-900 text-xs font-medium text-gray-900 dark:text-white outline-none resize-none"
                />
              </div>

              {/* Friend Selector */}
              <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-500" />
                    Inviter mes ami(e)s ZAKA ({selectedFriendIds.length} sélectionné(s))
                  </label>
                  <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                    {myFriends.length} ami(e)s disponibles
                  </span>
                </div>

                {myFriends.length === 0 ? (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                    Vous n'avez pas encore d'ami(e)s ajoutés. Allez dans votre profil pour ajouter des ami(e)s et les inviter en un clic !
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1 pt-1">
                    {myFriends.map(friend => {
                      const isSelected = selectedFriendIds.includes(friend.id);
                      return (
                        <button
                          key={friend.id}
                          type="button"
                          onClick={() => toggleFriendSelection(friend.id)}
                          className={`flex items-center justify-between p-2 rounded-xl text-left border transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-full font-bold text-xs flex items-center justify-center ${
                              isSelected ? 'bg-white text-amber-600' : 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                            }`}>
                              {friend.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold truncate max-w-[120px]">{friend.name}</span>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-white" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Créer la sortie et envoyer les invitations
              </button>
            </form>
          )}

          {/* TAB 2: MY OUTINGS */}
          {activeTab === 'mes_sorties' && (
            <div className="space-y-6">
              {myOutings.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  <Users className="w-12 h-12 text-gray-300 mx-auto" />
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">Aucune sortie de groupe organisée pour l'instant.</p>
                  <button
                    onClick={() => setActiveTab('creer')}
                    className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700"
                  >
                    + Créer ma première sortie
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Sidebar list of outings */}
                  <div className="space-y-2 border-r border-gray-100 dark:border-gray-800 pr-2">
                    {myOutings.map(g => (
                      <button
                        key={g.id}
                        onClick={() => setSelectedOutingId(g.id)}
                        className={`w-full text-left p-3 rounded-2xl border transition-all ${
                          (activeOuting?.id === g.id)
                            ? 'bg-orange-50 dark:bg-orange-950/30 border-orange-300 dark:border-orange-800 shadow-xs'
                            : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <p className="font-extrabold text-xs text-gray-900 dark:text-white truncate">{g.title}</p>
                        <p className="text-[11px] text-orange-600 dark:text-orange-400 font-semibold">{g.establishmentName}</p>
                        <p className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {new Date(g.date).toLocaleDateString('fr-FR')} à {g.time}
                        </p>
                      </button>
                    ))}
                  </div>

                  {/* Active Outing Detail */}
                  {activeOuting && (
                    <div className="md:col-span-2 space-y-5 bg-gray-50 dark:bg-gray-900/40 p-5 rounded-2xl border border-gray-200 dark:border-gray-800">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/60 px-2.5 py-0.5 rounded-full uppercase">
                            Organisé par {activeOuting.creatorName}
                          </span>
                          <h3 className="font-extrabold text-base text-gray-900 dark:text-white mt-1">{activeOuting.title}</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">📍 {activeOuting.establishmentName}</p>
                          <p className="text-xs text-gray-500 font-medium flex items-center gap-1 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-orange-500" /> {new Date(activeOuting.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {activeOuting.time}
                          </p>
                        </div>

                        {currentUser?.id === activeOuting.creatorId && (
                          <button
                            onClick={() => deleteGroupOuting(activeOuting.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg text-xs"
                            title="Supprimer la sortie"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {activeOuting.note && (
                        <p className="text-xs italic text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                          "{activeOuting.note}"
                        </p>
                      )}

                      {/* Share Code Bar */}
                      <div className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase">Code de partage invitation</p>
                          <p className="font-mono font-extrabold text-sm text-orange-600 dark:text-orange-400 tracking-wider">{activeOuting.shareCode}</p>
                        </div>
                        <button
                          onClick={() => handleCopyShareLink(activeOuting.shareCode)}
                          className="px-3 py-1.5 bg-orange-100 dark:bg-orange-950/60 hover:bg-orange-200 text-orange-800 dark:text-orange-300 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          {copySuccess ? "Copié !" : "Partager"}
                        </button>
                      </div>

                      {/* Response Voting Controls */}
                      <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 space-y-2">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200">Mon statut pour cette sortie :</p>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => respondGroupOuting(activeOuting.id, 'je_viens')}
                            className="py-2 px-1 text-xs font-extrabold rounded-xl border bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 border-emerald-300 hover:bg-emerald-100 flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Je viens
                          </button>
                          <button
                            onClick={() => respondGroupOuting(activeOuting.id, 'peut_etre')}
                            className="py-2 px-1 text-xs font-extrabold rounded-xl border bg-amber-50 dark:bg-amber-950/40 text-amber-700 border-amber-300 hover:bg-amber-100 flex items-center justify-center gap-1"
                          >
                            <HelpCircle className="w-3.5 h-3.5" /> Peut-être
                          </button>
                          <button
                            onClick={() => respondGroupOuting(activeOuting.id, 'je_ne_peux_pas')}
                            className="py-2 px-1 text-xs font-extrabold rounded-xl border bg-rose-50 dark:bg-rose-950/40 text-rose-700 border-rose-300 hover:bg-rose-100 flex items-center justify-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Je ne peux pas
                          </button>
                        </div>
                      </div>

                      {/* Guest Responses Table */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                            Participants ({(activeOuting.responses || []).length})
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-600 font-extrabold text-[11px]">
                              🟢 {(activeOuting.responses || []).filter(r => r.status === 'je_viens').length} confirmés
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowInviteMoreFriends(!showInviteMoreFriends)}
                              className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                            >
                              <UserPlus className="w-3 h-3" />
                              Inviter des ami(e)s
                            </button>
                          </div>
                        </div>

                        {/* Invite Friends Panel */}
                        {showInviteMoreFriends && (
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/40 space-y-2">
                            <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">
                              Sélectionnez des ami(e)s à inviter à cette sortie :
                            </p>
                            {(() => {
                              const uninvitedFriends = myFriends.filter(
                                f => !(activeOuting.responses || []).some(r => r.userId === f.id)
                              );
                              if (uninvitedFriends.length === 0) {
                                return (
                                  <p className="text-[11px] text-slate-500 italic">
                                    Tous vos ami(e)s sont déjà invités à cette sortie !
                                  </p>
                                );
                              }
                              return (
                                <div className="space-y-2">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                                    {uninvitedFriends.map(friend => {
                                      const isSelected = moreFriendIds.includes(friend.id);
                                      return (
                                        <button
                                          key={friend.id}
                                          type="button"
                                          onClick={() => toggleMoreFriendSelection(friend.id)}
                                          className={`flex items-center justify-between p-1.5 rounded-lg text-left border text-xs font-semibold ${
                                            isSelected 
                                              ? 'bg-amber-500 text-white border-amber-600'
                                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
                                          }`}
                                        >
                                          <span>{friend.name}</span>
                                          {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <button
                                    onClick={() => handleInviteMoreFriends(activeOuting.id)}
                                    disabled={loading || moreFriendIds.length === 0}
                                    className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg disabled:opacity-50"
                                  >
                                    Envoyer l'invitation ({moreFriendIds.length})
                                  </button>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {(activeOuting.responses || []).map((resp, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                              <span className="font-semibold text-gray-900 dark:text-white">{resp.userName}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                resp.status === 'je_viens' ? 'bg-emerald-100 text-emerald-800' :
                                resp.status === 'peut_etre' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {resp.status === 'je_viens' ? 'Je viens 🟢' : resp.status === 'peut_etre' ? 'Peut-être 🟡' : 'Je ne peux pas 🔴'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Convert to Official Table Reservation */}
                      {currentUser?.id === activeOuting.creatorId && (
                        <div className="pt-2 border-t border-gray-200 dark:border-gray-800">
                          <button
                            onClick={() => handleConvertToReservation(activeOuting)}
                            disabled={loading || convertedReservationId === activeOuting.id}
                            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                          >
                            <Sparkles className="w-4 h-4" />
                            {convertedReservationId === activeOuting.id ? "Table réservée avec succès !" : "Convertir en vraie réservation de table"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
