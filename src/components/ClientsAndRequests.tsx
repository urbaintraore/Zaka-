import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Check, X, MessageSquare, User, AlertCircle, Info, Send, Loader2, Award, Gift } from 'lucide-react';

export function ClientsAndRequests({ establishmentId, onNavigate, onStartChatWithConv }: { establishmentId: string; onNavigate?: (tab: any) => void; onStartChatWithConv?: (convId: string) => void }) {
  const { 
    currentUser, 
    relationshipRequests, 
    serviceRequests, 
    updateRelationshipRequest, 
    updateServiceRequest, 
    createRelationshipRequest,
    createConversation, 
    toggleDJStatus,
    staffReviews,
    updateStaffReviewStatus,
    staffAttendances,
    createStaffAttendance,
    deleteStaffAttendance,
    users, 
    establishments,
    loyaltyCards,
    consumeLoyaltyReward
  } = useAppStore();

  const [selectedClientId, setSelectedClientId] = useState('');
  const [managerMessage, setManagerMessage] = useState<Record<string, string>>({});
  const [reviewAmounts, setReviewAmounts] = useState<Record<string, string>>({});
  const [reviewBonusTypes, setReviewBonusTypes] = useState<Record<string, 'bonus' | 'sanction'>>({});
  
  // Staff attendance state
  const [attStaffId, setAttStaffId] = useState('');
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attPeriod, setAttPeriod] = useState<'matinée' | 'soirée'>('soirée');
  const [attLateMinutes, setAttLateMinutes] = useState('0');
  const [attEarlyMinutes, setAttEarlyMinutes] = useState('0');
  const [attJustification, setAttJustification] = useState('');
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSendingInvitation, setIsSendingInvitation] = useState(false);

  const est = establishments.find(e => e.id === establishmentId);
  
  // Filter relationship requests for this establishment
  const estRelRequests = relationshipRequests.filter(r => r.establishmentId === establishmentId);
  const joinRequests = estRelRequests.filter(r => r.type === 'client_join');
  const sentInvitations = estRelRequests.filter(r => r.type === 'gerant_invite');

  // Filter service requests
  const estServiceRequests = serviceRequests.filter(r => r.establishmentId === establishmentId);

  // Get members (accepted relationship requests)
  const acceptedRequests = relationshipRequests.filter(
    r => r.establishmentId === establishmentId && r.status === 'acceptee'
  );

  const staffMembers = acceptedRequests.filter(r => r.isDJ || (r.requestedRole && r.requestedRole !== 'client'));

  const members = acceptedRequests.map(r => {
    const memberId = r.type === 'client_join' ? r.initiatorId : r.targetId;
    const memberUser = users.find(u => u.id === memberId);
    return {
      requestId: r.id,
      clientId: memberId,
      user: memberUser,
      isDJ: r.isDJ || r.requestedRole === 'dj' || false,
      requestedRole: r.requestedRole || 'client'
    };
  });

  // Filter all clients that are registered on the app
  const allClients = users.filter(u => u.role === 'client');

  // Filter out clients that already have a pending or accepted request with this establishment
  const eligibleClients = allClients.filter(c => {
    const existing = estRelRequests.find(r => r.initiatorId === c.id || r.targetId === c.id);
    return !existing;
  });

  const startChat = async (clientId: string) => {
    const client = users.find(u => u.id === clientId);
    if (!client || !est) return;
    try {
      const convId = await createConversation(clientId, est.id, client.name, est.name, est.ownerId);
      if (onStartChatWithConv) {
        onStartChatWithConv(convId);
      } else if (onNavigate) {
        onNavigate('messages');
      }
    } catch (err) {
      console.error("Erreur lors de la création de la discussion :", err);
    }
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedClientId || !est) return;

    setIsSendingInvitation(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await createRelationshipRequest({
        initiatorId: currentUser.id,
        targetId: selectedClientId,
        establishmentId: est.id,
        type: 'gerant_invite'
      });
      
      const targetClient = users.find(u => u.id === selectedClientId);
      setSuccessMsg(`Invitation envoyée avec succès à ${targetClient?.name || 'Client'} !`);
      setSelectedClientId('');
    } catch (err: any) {
      console.error("Erreur d'invitation client:", err);
      setErrorMsg("Impossible d'envoyer l'invitation. Veuillez réessayer.");
    } finally {
      setIsSendingInvitation(false);
    }
  };

  const handleAcceptRequest = async (reqId: string, initiatorId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await updateRelationshipRequest(reqId, 'acceptee');
      setSuccessMsg("Demande acceptée ! Discussion initialisée.");
      await startChat(initiatorId);
    } catch (err: any) {
      console.error("Erreur acceptation demande:", err);
      setErrorMsg("Une erreur est survenue lors de l'acceptation.");
    }
  };

  const handleRefuseRequest = async (reqId: string) => {
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await updateRelationshipRequest(reqId, 'refusee');
      setSuccessMsg("La demande a été refusée.");
    } catch (err: any) {
      console.error("Erreur refus demande:", err);
      setErrorMsg("Une erreur est survenue lors du refus.");
    }
  };

  const getClientName = (id: string) => {
    const user = users.find(u => u.id === id);
    return user ? user.name : `Client (${id.slice(0, 5)})`;
  };

  return (
    <div className="flex flex-col gap-6 mt-6">
      
      {/* Alert / Feedback message */}
      {(successMsg || errorMsg) && (
        <div className={`p-4 rounded-xl flex items-start gap-3 border ${successMsg ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
          {successMsg ? <Info className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <div className="flex-1 text-xs font-bold">{successMsg || errorMsg}</div>
          <button onClick={() => { setSuccessMsg(null); setErrorMsg(null); }} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Inviter un nouveau client */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h4 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-2">
          <User className="w-4 h-4 text-orange-500" />
          Inviter un client
        </h4>
        <p className="text-xs text-gray-400 mb-4 font-medium">Invitez un client à rejoindre votre établissement pour commencer à échanger en direct.</p>
        
        {eligibleClients.length === 0 ? (
          <div className="p-3 bg-gray-50 rounded-xl text-center text-xs font-bold text-gray-400">
            Aucun client disponible pour invitation actuellement.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <select
                required
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold text-gray-700 focus:bg-white focus:border-orange-500"
              >
                <option value="">-- Sélectionnez un client --</option>
                {eligibleClients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone || c.email || 'Pas de contact'})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                disabled={!selectedClientId}
                onClick={() => startChat(selectedClientId)}
                className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs rounded-xl transition-colors active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Discuter directement
              </button>
              <button
                type="button"
                disabled={isSendingInvitation || !selectedClientId}
                onClick={(e) => {
                  e.preventDefault();
                  handleSendInvitation(e);
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl transition-colors active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isSendingInvitation ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                Inviter
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Requêtes d'adhésion reçues de clients */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h4 className="font-bold text-gray-900 text-sm mb-3">Requêtes d'Adhésion reçues</h4>
        {joinRequests.length === 0 && <p className="text-xs text-gray-400 font-medium">Aucune demande reçue pour l'instant.</p>}
        <div className="flex flex-col gap-2.5">
          {joinRequests.map(req => (
            <div key={req.id} className="flex items-center justify-between p-3.5 bg-gray-50/50 hover:bg-gray-50 rounded-xl border border-gray-100 transition-all">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center">
                  {getClientName(req.initiatorId).substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-black text-gray-900">{getClientName(req.initiatorId)}</div>
                  <div className="text-[10px] text-gray-400 font-semibold">
                    A demandé à vous rejoindre
                    {req.requestedRole && (
                      <span className="ml-1 inline-block px-1.5 py-0.5 rounded-sm bg-orange-100 text-orange-800 text-[9px] font-bold uppercase tracking-wider">
                        {req.requestedRole}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => startChat(req.initiatorId)} 
                  className="p-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100"
                  title="Discuter"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                {req.status === 'en_attente' ? (
                  <>
                    <button 
                      onClick={() => handleAcceptRequest(req.id, req.initiatorId)} 
                      className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                      title="Accepter"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleRefuseRequest(req.id)} 
                      className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                      title="Refuser"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${req.status === 'acceptee' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {req.status === 'acceptee' ? 'Acceptée' : 'Refusée'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Invitations envoyées aux clients */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h4 className="font-bold text-gray-900 text-sm mb-3">Invitations envoyées</h4>
        {sentInvitations.length === 0 && <p className="text-xs text-gray-400 font-medium">Aucune invitation envoyée pour l'instant.</p>}
        <div className="flex flex-col gap-2.5">
          {sentInvitations.map(req => (
            <div key={req.id} className="flex items-center justify-between p-3.5 bg-gray-50/50 hover:bg-gray-50 rounded-xl border border-gray-100 transition-all">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-xs flex items-center justify-center">
                  {getClientName(req.targetId).substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-xs font-black text-gray-900">{getClientName(req.targetId)}</div>
                  <div className="text-[10px] text-gray-400 font-semibold">Envoyée le {new Date(req.date).toLocaleDateString('fr-FR')}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                  req.status === 'en_attente' ? 'bg-yellow-100 text-yellow-800' : 
                  req.status === 'acceptee' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {req.status === 'en_attente' ? 'En attente' : req.status === 'acceptee' ? 'Acceptée' : 'Refusée'}
                </span>
                {req.status === 'acceptee' && (
                  <button 
                    onClick={() => startChat(req.targetId)} 
                    className="p-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100"
                    title="Discuter"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Service Requests & Réservations */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h4 className="font-bold text-gray-900 text-sm mb-4">Service & Réservations</h4>
        {estServiceRequests.length === 0 && <p className="text-xs text-gray-400 font-medium">Aucune requête de service.</p>}
        {estServiceRequests.map(req => (
          <div key={req.id} className="flex flex-col p-4 bg-gray-50 rounded-xl gap-3 mb-3 border border-gray-100">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-gray-900 uppercase tracking-wide bg-orange-100 text-orange-800 px-2.5 py-1 rounded-full">{req.type.toUpperCase()}</span>
                  <button 
                    onClick={() => startChat(req.clientId)}
                    className="p-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors cursor-pointer"
                    title="Discuter avec le client"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-[10px] text-gray-400 font-bold">Client: {getClientName(req.clientId)}</span>
              </div>
              {req.status === 'en_attente' && (
                <div className="flex flex-col gap-2 w-48">
                  <input 
                    type="text" 
                    placeholder="Message de réponse..." 
                    className="text-xs p-2 border rounded-lg bg-white outline-none focus:border-orange-500 font-medium"
                    onChange={(e) => setManagerMessage(prev => ({...prev, [req.id]: e.target.value}))}
                  />
                  <div className="flex gap-1.5 justify-end">
                    <button onClick={() => updateServiceRequest(req.id, 'validee', managerMessage[req.id] || 'Validée!')} className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 flex items-center gap-1 font-bold text-[10px]"><Check className="w-3.5 h-3.5" /> Valider</button>
                    <button onClick={() => updateServiceRequest(req.id, 'refusee', managerMessage[req.id] || 'Désolé.')} className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 flex items-center gap-1 font-bold text-[10px]"><X className="w-3.5 h-3.5" /> Refuser</button>
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-600 bg-white p-2.5 rounded-lg border border-gray-100 font-medium leading-relaxed">{req.details}</p>
            {req.status !== 'en_attente' && (
              <div className="text-[10px] font-bold uppercase p-2 bg-white rounded-lg border border-gray-100">
                Statut: <span className={req.status === 'validee' ? 'text-green-600' : 'text-red-600'}>{req.status === 'validee' ? 'Validée' : 'Refusée'}</span>
                {req.managerMessage && (
                  <div className="text-gray-500 font-medium normal-case mt-1 bg-gray-50 p-1.5 rounded-md border border-gray-50">
                    Réponse: {req.managerMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 5. Liste des clients de l'établissement */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h4 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-2">
          <User className="w-4 h-4 text-orange-500" />
          Clients / Membres de l'établissement
        </h4>
        <p className="text-xs text-gray-400 mb-4 font-medium">
          Gérez les membres officiels de votre établissement et attribuez le rôle de DJ.
        </p>
        
        {members.length === 0 ? (
          <p className="text-xs text-gray-400 font-medium text-center py-4 bg-gray-50 rounded-xl">
            Aucun membre officiel pour l'instant.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {members.map(member => {
              const clientLoyaltyCard = loyaltyCards.find(c => c.clientId === member.clientId && c.establishmentId === establishmentId);
              const isRewardUnlocked = clientLoyaltyCard && (clientLoyaltyCard.rewardUnlocked || (clientLoyaltyCard.visitCount >= (est?.loyaltyRequiredVisits || 5)));

              return (
              <div key={member.requestId} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-gray-50/50 hover:bg-gray-50 rounded-xl border border-gray-100 transition-all gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 font-bold text-xs flex items-center justify-center">
                    {(member.user?.name || 'Client').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-xs font-black text-gray-900 flex items-center gap-1.5 flex-wrap">
                      {member.user?.name || `Client (${member.clientId.slice(0, 5)})`}
                      {member.isDJ && (
                        <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded">
                          DJ Actif
                        </span>
                      )}
                      {!member.isDJ && member.requestedRole !== 'client' && (
                        <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded uppercase">
                          {member.requestedRole}
                        </span>
                      )}
                      {isRewardUnlocked && (
                        <span className="text-[10px] bg-amber-500 text-white font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs animate-pulse">
                          <Gift className="w-3 h-3" /> Récompense disponible ({clientLoyaltyCard?.visitCount} passages)
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400 font-semibold flex items-center gap-2">
                      <span>{member.user?.phone || member.user?.email || 'Pas de contact'}</span>
                      {clientLoyaltyCard && (
                        <span className="text-amber-600 font-extrabold">
                          • {clientLoyaltyCard.visitCount} / {est?.loyaltyRequiredVisits || 5} visites
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap">
                  {isRewardUnlocked && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await consumeLoyaltyReward(clientLoyaltyCard.id);
                          setSuccessMsg(`Récompense validée pour ${member.user?.name || 'le client'} !`);
                        } catch (err: any) {
                          setErrorMsg("Erreur lors de la validation de la récompense.");
                        }
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Award className="w-3.5 h-3.5" /> Valider récompense
                    </button>
                  )}

                  <button 
                    onClick={() => startChat(member.clientId)} 
                    className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors"
                    title="Discuter"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  
                  {member.isDJ ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await toggleDJStatus(member.requestId, false);
                          setSuccessMsg(`Le statut DJ a été retiré pour ${member.user?.name || 'le client'}.`);
                        } catch (err) {
                          setErrorMsg("Erreur lors du retrait du statut DJ.");
                        }
                      }}
                      className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                    >
                      Retirer le statut DJ
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await toggleDJStatus(member.requestId, true);
                          setSuccessMsg(`${member.user?.name || 'Le client'} a été promu DJ de l'établissement !`);
                        } catch (err) {
                          setErrorMsg("Erreur lors de la promotion en DJ.");
                        }
                      }}
                      className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-600 font-bold text-[10px] rounded-lg transition-colors cursor-pointer"
                    >
                      Promouvoir en DJ
                    </button>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>

      {/* Évaluations et Performances du Personnel (Bonus / Sanctions) */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm">
        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1 flex items-center gap-2">
          <span>⭐</span> Évaluations clients & Bonus/Sanctions du personnel
        </h4>
        <p className="text-xs text-gray-400 mb-4 font-medium">Validez les avis clients et gérez les bonifications ou sanctions pécuniaires de fin de mois de vos employés.</p>

        {staffReviews.filter(r => r.establishmentId === establishmentId).length === 0 ? (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl text-center text-xs font-bold text-gray-400">
            Aucun avis client sur le personnel pour l'instant.
          </div>
        ) : (
          <div className="space-y-4">
            {staffReviews.filter(r => r.establishmentId === establishmentId).map(review => {
              const staffUser = users.find(u => u.id === review.staffId);
              return (
                <div key={review.id} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white">Employé : {staffUser?.name || 'Employé'}</span>
                      <p className="text-[10px] text-gray-500">Client : {review.clientName} • Note : {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                      review.status === 'valide' ? 'bg-green-100 text-green-700' :
                      review.status === 'invalide' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {review.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 dark:text-gray-300 italic bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                    "{review.comment}"
                  </p>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={() => updateStaffReviewStatus(review.id, 'valide', review.managerNote, review.bonusOrSanction)}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Valider l'avis
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStaffReviewStatus(review.id, 'invalide', review.managerNote, review.bonusOrSanction)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      Invalider
                    </button>
                  </div>

                  {/* Bonus / Sanction Form */}
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                    <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-wider block">Notation gérant & Bonus / Sanction pécuniaire</span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select
                        value={reviewBonusTypes[review.id] || review.bonusOrSanction?.type || 'bonus'}
                        onChange={e => setReviewBonusTypes(prev => ({ ...prev, [review.id]: e.target.value as any }))}
                        className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                      >
                        <option value="bonus">🎁 Bonification (Bonus)</option>
                        <option value="sanction">⚠️ Sanction pécuniaire</option>
                      </select>
                      <input
                        type="number"
                        placeholder="Montant (FCFA)"
                        value={reviewAmounts[review.id] !== undefined ? reviewAmounts[review.id] : (review.bonusOrSanction?.amount || '')}
                        onChange={e => setReviewAmounts(prev => ({ ...prev, [review.id]: e.target.value }))}
                        className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const type = reviewBonusTypes[review.id] || review.bonusOrSanction?.type || 'bonus';
                          const amount = Number(reviewAmounts[review.id] !== undefined ? reviewAmounts[review.id] : (review.bonusOrSanction?.amount || 0));
                          updateStaffReviewStatus(review.id, review.status, review.managerNote, { type, amount, reason: review.comment });
                          setSuccessMsg("Sanction / Bonification enregistrée avec succès !");
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Enregistrer sanction/bonus
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Suivi des Présences, Retards & Départs (Maquis / Boîte de Nuit) */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-4">
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1 flex items-center gap-2">
            <span>⏱️</span> Suivi des Présences, Retards & Départs (Maquis / Boîte de Nuit)
          </h4>
          <p className="text-xs text-gray-400 font-medium">
            Enregistrez quotidiennement la période (matinée ou soirée), les retards, les départs anticipés et les justificatifs. Générez le rapport mensuel récapitulatif.
          </p>
        </div>

        {/* Formulaire d'enregistrement quotidien */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
          <span className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-wide block">Enregistrer un pointage / incident journalier</span>
          
          {staffMembers.length === 0 ? (
            <p className="text-xs text-gray-400 italic">Aucun employé dans cet établissement pour enregistrer un pointage. Recrutez d'abord du personnel.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">Employé</label>
                <select
                  value={attStaffId}
                  onChange={e => setAttStaffId(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionner un employé</option>
                  {staffMembers.map(m => {
                    const u = users.find(user => user.id === (m.type === 'client_join' ? m.initiatorId : m.targetId));
                    return (
                      <option key={m.id} value={u?.id || m.targetId}>
                        {u?.name || 'Employé'} ({m.isDJ ? 'DJ' : m.requestedRole})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">Date</label>
                <input
                  type="date"
                  value={attDate}
                  onChange={e => setAttDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">Période de travail</label>
                <select
                  value={attPeriod}
                  onChange={e => setAttPeriod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                >
                  <option value="soirée">🌙 Soirée (Boîte / Maquis Nuit)</option>
                  <option value="matinée">☀️ Matinée / Journée</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">Retard d'arrivée (minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={attLateMinutes}
                  onChange={e => setAttLateMinutes(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1">Départ anticipé (minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={attEarlyMinutes}
                  onChange={e => setAttEarlyMinutes(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-[10px] font-bold text-gray-500 mb-1">Justificatif (s'il y en a)</label>
                <input
                  type="text"
                  placeholder="Ex: Transport en panne, autorisation spéciale..."
                  value={attJustification}
                  onChange={e => setAttJustification(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
                />
              </div>
            </div>
          )}

          {staffMembers.length > 0 && (
            <button
              type="button"
              onClick={async () => {
                if (!attStaffId) {
                  setErrorMsg("Veuillez sélectionner un employé.");
                  return;
                }
                try {
                  await createStaffAttendance({
                    establishmentId,
                    staffId: attStaffId,
                    date: attDate,
                    period: attPeriod,
                    lateMinutes: Number(attLateMinutes) || 0,
                    earlyDepartureMinutes: Number(attEarlyMinutes) || 0,
                    justification: attJustification
                  });
                  setSuccessMsg("Pointage et rapport de présence enregistrés avec succès !");
                  setAttLateMinutes('0');
                  setAttEarlyMinutes('0');
                  setAttJustification('');
                  setTimeout(() => setSuccessMsg(null), 4000);
                } catch (err) {
                  console.error(err);
                  setErrorMsg("Erreur lors de l'enregistrement du pointage.");
                }
              }}
              className="mt-3 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              Enregistrer le pointage
            </button>
          )}
        </div>

        {/* Section Rapport Mensuel */}
        <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-wide block">Rapport Mensuel Récapitulatif</span>
              <p className="text-[10px] text-gray-400">Synthèse des retards et départs anticipés par employé pour le mois sélectionné.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={reportMonth}
                onChange={e => setReportMonth(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  const filtered = staffAttendances.filter(a => a.establishmentId === establishmentId && a.date.startsWith(reportMonth));
                  if (filtered.length === 0) {
                    alert("Aucune donnée de présence pour ce mois.");
                    return;
                  }
                  let csvContent = "data:text/csv;charset=utf-8,ID Employe;Nom Employe;Date;Periode;Retard (min);Depart Anticipe (min);Justificatif\n";
                  filtered.forEach(att => {
                    const memberUser = users.find(u => u.id === att.staffId);
                    csvContent += `${att.staffId};"${memberUser?.name || 'Inconnu'}";${att.date};${att.period};${att.lateMinutes};${att.earlyDepartureMinutes};"${att.justification || ''}"\n`;
                  });
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", `rapport_presence_${est?.name || 'etablissement'}_${reportMonth}.csv`);
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
              >
                📥 Exporter le fichier CSV mensuel
              </button>
            </div>
          </div>

          {/* Tableau récapitulatif du mois */}
          {staffAttendances.filter(a => a.establishmentId === establishmentId && a.date.startsWith(reportMonth)).length === 0 ? (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-xl text-center text-xs font-medium text-gray-400">
              Aucun pointage enregistré pour le mois de {reportMonth}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Employé</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Période</th>
                    <th className="p-3">Retard</th>
                    <th className="p-3">Départ Anticipé</th>
                    <th className="p-3">Justificatif</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {staffAttendances
                    .filter(a => a.establishmentId === establishmentId && a.date.startsWith(reportMonth))
                    .map(att => {
                      const memberUser = users.find(u => u.id === att.staffId);
                      return (
                        <tr key={att.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                          <td className="p-3 font-bold text-gray-900 dark:text-white">{memberUser?.name || 'Employé'}</td>
                          <td className="p-3 text-gray-600 dark:text-gray-300">{att.date}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${att.period === 'soirée' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>
                              {att.period}
                            </span>
                          </td>
                          <td className="p-3 font-bold text-orange-600">{att.lateMinutes} min</td>
                          <td className="p-3 font-bold text-red-600">{att.earlyDepartureMinutes} min</td>
                          <td className="p-3 text-gray-500 italic">{att.justification || 'Aucun'}</td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm("Voulez-vous supprimer ce pointage ?")) {
                                  await deleteStaffAttendance(att.id);
                                }
                              }}
                              className="text-red-500 hover:text-red-700 font-bold text-[10px] cursor-pointer"
                            >
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
