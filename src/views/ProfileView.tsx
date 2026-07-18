import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Role, Category } from '../types';
import { LogOut, User, Check, X, MessageSquare, Store, Sparkles, Calendar } from 'lucide-react';
import { GerantDashboard } from './GerantDashboard';
import { AdminDashboard } from './AdminDashboard';

interface ProfileViewProps {
  onNavigate?: (tab: any) => void;
  onStartChatWithConv?: (convId: string) => void;
}

export function ProfileView({ onNavigate, onStartChatWithConv }: ProfileViewProps) {
  const { 
    currentUser, 
    login, 
    register, 
    logout, 
    upgradeToGerant, 
    envoyerCodeOtp, 
    confirmerCodeOtp,
    relationshipRequests,
    establishments,
    serviceRequests,
    updateRelationshipRequest,
    createConversation
  } = useAppStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<Role>('client');
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  // Auth configuration fields
  const [authMethod, setAuthMethod] = useState<'email' | 'phone'>('email');
  const [error, setError] = useState('');

  // Email and Password fields
  const [identifier, setIdentifier] = useState(''); // Email
  const [password, setPassword] = useState('');

  // Phone and OTP fields
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isConfirmingOtp, setIsConfirmingOtp] = useState(false);

  // Client & Gerant registration details
  const [name, setName] = useState('');
  const [country, setCountry] = useState('Burkina Faso');
  const [city, setCity] = useState('');

  // Gerant Establishment fields
  const [estName, setEstName] = useState('');
  const [estCategory, setEstCategory] = useState<Category>('maquis');
  const [estNeighborhood, setEstNeighborhood] = useState('');
  const [estGeolocation, setEstGeolocation] = useState('');

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await upgradeToGerant({
        name: estName,
        category: estCategory,
        neighborhood: estNeighborhood,
        geolocation: estGeolocation
      });
      setIsUpgrading(false);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la mise à niveau');
    }
  };

  const resetPhoneAuth = () => {
    setIsOtpSent(false);
    setOtpCode('');
    setError('');
  };

  if (currentUser) {
    if (currentUser.role === 'admin') return <AdminDashboard onLogout={logout} />;
    if (currentUser.role === 'gerant') return <GerantDashboard onLogout={logout} onNavigate={onNavigate} onStartChatWithConv={onStartChatWithConv} />;
    
    if (isUpgrading) {
      return (
        <div className="p-4 max-w-md mx-auto pt-8">
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-orange-100/20 border border-gray-100">
            <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">Devenir Gérant</h2>
            {error && (
              <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-100">
                {error}
              </div>
            )}
            <form onSubmit={handleUpgrade} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Nom de l'établissement</label>
                <input type="text" placeholder="Nom du lieu" required value={estName} onChange={e => setEstName(e.target.value)} className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-orange-500 outline-none font-medium" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Type d'établissement</label>
                <select required value={estCategory} onChange={e => setEstCategory(e.target.value as Category)} className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-orange-500 outline-none font-medium text-gray-700">
                  <option value="maquis">Maquis</option>
                  <option value="bar">Bar</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="boite_de_nuit">Boîte de nuit</option>
                  <option value="glacier_pizzeria">Glacier - Pizzeria</option>
                  <option value="hotel">Hôtel</option>
                  <option value="residence">Résidence</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Quartier</label>
                <input type="text" placeholder="Quartier" required value={estNeighborhood} onChange={e => setEstNeighborhood(e.target.value)} className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-orange-500 outline-none font-medium" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Géolocalisation (Lien Maps - optionnel)</label>
                <input type="url" placeholder="https://maps.google.com/..." value={estGeolocation} onChange={e => setEstGeolocation(e.target.value)} className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-orange-500 outline-none font-medium" />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setIsUpgrading(false)} className="flex-1 py-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">Annuler</button>
                <button type="submit" className="flex-1 py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-all">Valider</button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    const clientRequests = relationshipRequests.filter(r => r.initiatorId === currentUser.id || r.targetId === currentUser.id);
    const invitationsReceived = clientRequests.filter(r => r.type === 'gerant_invite' && r.targetId === currentUser.id);
    const requestsSent = clientRequests.filter(r => r.type === 'client_join' && r.initiatorId === currentUser.id);
    const myServiceRequests = serviceRequests.filter(r => r.clientId === currentUser.id);

    const getEstablishmentName = (id: string) => {
      const est = establishments.find(e => e.id === id);
      return est ? est.name : `Établissement (${id.slice(0, 5)})`;
    };

    const handleAcceptInvitation = async (reqId: string, estId: string, estName: string, ownerId: string) => {
      try {
        await updateRelationshipRequest(reqId, 'acceptee');
        const convId = await createConversation(currentUser.id, estId, currentUser.name, estName, ownerId);
        if (onStartChatWithConv) {
          onStartChatWithConv(convId);
        } else if (onNavigate) {
          onNavigate('messages');
        }
      } catch (err: any) {
        console.error("Erreur acceptation d'invitation :", err);
      }
    };

    const handleRejectInvitation = async (reqId: string) => {
      try {
        await updateRelationshipRequest(reqId, 'refusee');
      } catch (err: any) {
        console.error("Erreur rejet d'invitation :", err);
      }
    };

    const handleStartChat = async (estId: string, estName: string, ownerId: string) => {
      try {
        const convId = await createConversation(currentUser.id, estId, currentUser.name, estName, ownerId);
        if (onStartChatWithConv) {
          onStartChatWithConv(convId);
        } else if (onNavigate) {
          onNavigate('messages');
        }
      } catch (err: any) {
        console.error("Erreur lancement discussion :", err);
      }
    };

    return (
      <div className="p-4 max-w-lg mx-auto pt-8 pb-24 flex flex-col gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-5">
            <User className="w-12 h-12 text-orange-500" />
          </div>
          <h2 className="text-2xl font-black text-gray-900">{currentUser.name}</h2>
          <p className="text-gray-500 font-medium">{currentUser.email || currentUser.phone}</p>
          <p className="text-gray-400 text-sm mt-1">{currentUser.city}, {currentUser.country}</p>
          <div className="mt-4 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wider">
            Compte {currentUser.role === 'gerant' ? 'Gérant' : currentUser.role === 'admin' ? 'Administrateur' : 'Client'}
          </div>

          <div className="mt-8 w-full flex flex-col gap-3">
            <button onClick={() => setIsUpgrading(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-600 font-bold rounded-xl hover:bg-orange-100 transition-colors cursor-pointer">
              Devenir Gérant (Ajouter un établissement)
            </button>
            <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors cursor-pointer">
              <LogOut className="w-5 h-5" />
              Déconnexion
            </button>
          </div>
        </div>

        {/* Invitations reçues */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-gray-900 mb-1 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-500" />
            Invitations reçues
          </h3>
          <p className="text-[10px] text-gray-400 font-semibold mb-4">Invitations envoyées par des gérants pour rejoindre leur club d'établissement.</p>

          {invitationsReceived.length === 0 ? (
            <p className="text-xs text-gray-400 font-bold py-3 text-center bg-gray-50 rounded-2xl">Aucune invitation reçue.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {invitationsReceived.map(inv => {
                const estDetail = establishments.find(e => e.id === inv.establishmentId);
                return (
                  <div key={inv.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        <Store className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-gray-900 truncate">{getEstablishmentName(inv.establishmentId)}</h4>
                        <p className="text-[10px] text-gray-400 font-semibold">Gérant vous invite à discuter</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {inv.status === 'en_attente' ? (
                        <>
                          <button 
                            onClick={() => handleAcceptInvitation(inv.id, inv.establishmentId, estDetail?.name || 'Établissement', estDetail?.ownerId || '')}
                            className="p-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg transition-colors cursor-pointer"
                            title="Accepter"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleRejectInvitation(inv.id)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Refuser"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${inv.status === 'acceptee' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {inv.status === 'acceptee' ? 'Acceptée' : 'Refusée'}
                        </span>
                      )}
                      {inv.status === 'acceptee' && estDetail && (
                        <button 
                          onClick={() => handleStartChat(inv.establishmentId, estDetail.name, estDetail.ownerId)}
                          className="p-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors cursor-pointer"
                          title="Ouvrir la discussion"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Demandes envoyées */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-gray-900 mb-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            Mes demandes d'adhésion
          </h3>
          <p className="text-[10px] text-gray-400 font-semibold mb-4">Suivez le statut de vos demandes de rejoindre envoyées aux établissements.</p>

          {requestsSent.length === 0 ? (
            <p className="text-xs text-gray-400 font-bold py-3 text-center bg-gray-50 rounded-2xl">Aucune demande envoyée.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {requestsSent.map(req => {
                const estDetail = establishments.find(e => e.id === req.establishmentId);
                return (
                  <div key={req.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                        <Store className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-gray-900 truncate">{getEstablishmentName(req.establishmentId)}</h4>
                        <p className="text-[10px] text-gray-400 font-semibold">Envoyée le {new Date(req.date).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                        req.status === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                        req.status === 'acceptee' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {req.status === 'en_attente' ? 'En attente' : req.status === 'acceptee' ? 'Acceptée' : 'Refusée'}
                      </span>
                      {req.status === 'acceptee' && estDetail && (
                        <button 
                          onClick={() => handleStartChat(req.establishmentId, estDetail.name, estDetail.ownerId)}
                          className="p-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors cursor-pointer"
                          title="Discuter"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mes réservations et commandes */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-gray-900 mb-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-pink-500" />
            Mes réservations & commandes
          </h3>
          <p className="text-[10px] text-gray-400 font-semibold mb-4">Suivez le statut de vos demandes de service et de vos réservations.</p>

          {myServiceRequests.length === 0 ? (
            <p className="text-xs text-gray-400 font-bold py-3 text-center bg-gray-50 rounded-2xl">Aucune demande de service en cours.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {myServiceRequests.map(req => {
                const estDetail = establishments.find(e => e.id === req.establishmentId);
                return (
                  <div key={req.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-gray-900 truncate">{getEstablishmentName(req.establishmentId)}</h4>
                          <span className="text-[9px] font-bold uppercase tracking-wide bg-pink-50 text-pink-600 px-2 py-0.5 rounded">
                            {req.type}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full ${
                          req.status === 'en_attente' ? 'bg-yellow-100 text-yellow-800' :
                          req.status === 'validee' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {req.status === 'en_attente' ? 'En attente' : req.status === 'validee' ? 'Acceptée' : 'Refusée'}
                        </span>
                        {estDetail && (
                          <button 
                            type="button"
                            onClick={() => handleStartChat(req.establishmentId, estDetail.name, estDetail.ownerId)}
                            className="p-1.5 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors cursor-pointer"
                            title="Discuter avec l'établissement"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 bg-white p-2.5 rounded-lg border border-gray-100 font-medium leading-relaxed">
                      {req.details}
                    </div>
                    {req.managerMessage && (
                      <div className="text-[10px] text-gray-500 font-bold bg-orange-50/50 p-2 rounded-lg border border-orange-100/30">
                        Réponse gérant: <span className="font-semibold text-gray-600 normal-case">{req.managerMessage}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (authMethod === 'email') {
      try {
        if (mode === 'login') {
          await login(identifier, password);
        } else {
          await register(
            { email: identifier, name, role, country, city, phone: '' },
            password,
            role === 'gerant' ? {
              name: estName,
              category: estCategory,
              neighborhood: estNeighborhood,
              geolocation: estGeolocation
            } : undefined
          );
        }
      } catch (err: any) {
        setError(err.message || 'Une erreur est survenue');
      }
    } else {
      // Phone Auth
      if (!isOtpSent) {
        if (!phone) {
          setError("Veuillez saisir votre numéro de téléphone.");
          return;
        }
        setIsSendingOtp(true);
        try {
          await envoyerCodeOtp(phone, 'recaptcha-container');
          setIsOtpSent(true);
        } catch (err: any) {
          setError(err.message || "Erreur lors de l'envoi du code de vérification SMS");
        } finally {
          setIsSendingOtp(false);
        }
      } else {
        if (!otpCode) {
          setError("Veuillez saisir le code reçu par SMS.");
          return;
        }
        setIsConfirmingOtp(true);
        try {
          if (mode === 'register') {
            await confirmerCodeOtp(otpCode, {
              name,
              role,
              country,
              city,
              phone,
              email: identifier || undefined,
              estData: role === 'gerant' ? {
                name: estName,
                category: estCategory,
                neighborhood: estNeighborhood,
                geolocation: estGeolocation
              } : undefined
            });
          } else {
            await confirmerCodeOtp(otpCode);
          }
        } catch (err: any) {
          setError(err.message || "Le code saisi est incorrect ou a expiré.");
        } finally {
          setIsConfirmingOtp(false);
        }
      }
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto pt-8">
      <div className="bg-white rounded-3xl p-6 shadow-xl shadow-orange-100/20 border border-gray-100">
        <h2 className="text-2xl font-black text-gray-900 mb-6 text-center">
          {mode === 'login' ? 'Connexion' : 'Créer un compte'}
        </h2>
        
        {/* Auth Method Selector */}
        {!isOtpSent && (
          <div className="flex gap-2 mb-6 p-1 bg-gray-100/80 rounded-xl">
            <button
              type="button"
              onClick={() => { setAuthMethod('email'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMethod === 'email' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Adresse E-mail
            </button>
            <button
              type="button"
              onClick={() => { setAuthMethod('phone'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMethod === 'phone' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
            >
              N° de Téléphone (SMS)
            </button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 text-sm rounded-2xl border border-red-100 flex flex-col gap-2">
            <span className="font-bold leading-snug">{error}</span>
            {error.includes('auth/unauthorized-domain') && (
              <div className="mt-2 pt-2 border-t border-red-100/60 text-xs text-red-600/90 flex flex-col gap-1.5 leading-relaxed">
                <span className="font-bold text-red-800 flex items-center gap-1">🛠️ Action Requise :</span>
                <span>L'adresse Internet actuelle de l'application n'est pas autorisée dans votre projet Firebase.</span>
                <span>Veuillez ajouter ce domaine dans vos configurations de connexion :</span>
                <span className="bg-red-100/75 px-2.5 py-1.5 rounded-lg font-mono break-all font-bold text-red-900 self-start mt-0.5">
                  {typeof window !== 'undefined' ? window.location.hostname : ''}
                </span>
                <span className="mt-1 text-[11px]">
                  <strong>Chemin d'accès :</strong> Console Firebase &gt; Authentication &gt; Paramètres &gt; Domaines autorisés &gt; Ajouter un domaine.
                </span>
              </div>
            )}
            {error.includes('auth/operation-not-allowed') && (
              <div className="mt-2 pt-2 border-t border-red-100/60 text-xs text-red-600/90 flex flex-col gap-1.5 leading-relaxed">
                <span className="font-bold text-red-800">🛠️ Configuration Firebase :</span>
                <span>La méthode d'authentification choisie n'est pas activée.</span>
                <span className="text-[11px]">
                  <strong>Chemin d'accès :</strong> Console Firebase &gt; Authentication &gt; Sign-in method &gt; Activer Email/Password ou Téléphone.
                </span>
              </div>
            )}
            {error.includes('auth/too-many-requests') && (
              <div className="mt-2 pt-2 border-t border-red-100/60 text-xs text-red-600/90 flex flex-col gap-1.5 leading-relaxed">
                <span className="font-bold text-red-800">💡 Conseil :</span>
                <span>Firebase bloque temporairement les requêtes répétées provenant d'une même adresse IP pour des raisons de sécurité. Patientez environ 5 minutes avant de réessayer.</span>
              </div>
            )}
            {error.includes('auth/invalid-credential') && (
              <div className="mt-2 pt-2 border-t border-red-100/60 text-xs text-red-600/90 flex flex-col gap-1.5 leading-relaxed">
                <span className="font-bold text-red-800">💡 Conseil :</span>
                <span>L'adresse e-mail, le mot de passe, ou le code de vérification saisi est incorrect.</span>
                <span>• Si vous n'avez pas encore de compte, veuillez cliquer sur <strong>"Pas encore de compte ? S'inscrire"</strong> ci-dessous pour créer votre compte.</span>
                <span>• Si vous possédez déjà un compte, vérifiez l'orthographe de votre e-mail et de votre mot de passe, ou assurez-vous que vous utilisez la bonne méthode de connexion (E-mail ou Téléphone).</span>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === 'register' && !isOtpSent && (
            <>
              <div className="flex gap-2 mb-2 p-1.5 bg-gray-100/80 rounded-xl">
                <button type="button" onClick={() => setRole('client')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${role === 'client' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}>Client</button>
                <button type="button" onClick={() => setRole('gerant')} className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${role === 'gerant' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}>Gérant</button>
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Nom complet</label>
                <input type="text" placeholder="Votre nom" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">Pays</label>
                  <input type="text" placeholder="Pays" required value={country} onChange={e => setCountry(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">Ville</label>
                  <input type="text" placeholder="Ville" required value={city} onChange={e => setCity(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium" />
                </div>
              </div>

              {role === 'gerant' && (
                <div className="mt-2 p-4 bg-orange-50/50 rounded-2xl border border-orange-100 flex flex-col gap-4">
                  <h3 className="font-bold text-gray-900 text-sm border-b border-orange-200/50 pb-2">Détails de l'établissement</h3>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Nom de l'établissement</label>
                    <input type="text" placeholder="Nom du lieu" required value={estName} onChange={e => setEstName(e.target.value)} className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-orange-500 outline-none font-medium" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Type d'établissement</label>
                    <select required value={estCategory} onChange={e => setEstCategory(e.target.value as Category)} className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-orange-500 outline-none font-medium text-gray-700">
                      <option value="maquis">Maquis</option>
                      <option value="bar">Bar</option>
                      <option value="restaurant">Restaurant</option>
                      <option value="boite_de_nuit">Boîte de nuit</option>
                      <option value="glacier_pizzeria">Glacier - Pizzeria</option>
                      <option value="hotel">Hôtel</option>
                      <option value="residence">Résidence</option>
                      <option value="autre">Autre</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Quartier</label>
                    <input type="text" placeholder="Quartier" required value={estNeighborhood} onChange={e => setEstNeighborhood(e.target.value)} className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-orange-500 outline-none font-medium" />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Géolocalisation (Lien Maps - optionnel)</label>
                    <input type="url" placeholder="https://maps.google.com/..." value={estGeolocation} onChange={e => setEstGeolocation(e.target.value)} className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-orange-500 outline-none font-medium" />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Email inputs */}
          {authMethod === 'email' && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Adresse E-mail</label>
                <input type="email" placeholder="exemple@email.com" required value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none transition-all font-medium" />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Mot de passe</label>
                <input type="password" placeholder="Mot de passe" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none transition-all font-medium" />
              </div>
            </>
          )}

          {/* Phone inputs */}
          {authMethod === 'phone' && (
            <>
              {!isOtpSent ? (
                <>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Numéro de Téléphone (ex: +22670000000)</label>
                    <input type="tel" placeholder="+22670000000" required value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none transition-all font-medium" />
                  </div>
                  {mode === 'register' && (
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-gray-500 ml-1">Adresse E-mail (Optionnelle)</label>
                      <input type="email" placeholder="exemple@email.com (Optionnel)" value={identifier} onChange={e => setIdentifier(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium" />
                    </div>
                  )}
                  {/* Container for invisible recaptcha */}
                  <div id="recaptcha-container" className="my-1"></div>
                </>
              ) : (
                <div className="p-4 bg-orange-50/40 rounded-2xl border border-orange-100 flex flex-col gap-4">
                  <p className="text-xs font-medium text-gray-700 text-center leading-relaxed">
                    Un code de vérification SMS a été envoyé au <strong className="text-orange-600 font-bold">{phone}</strong>. Saisissez-le ci-dessous.
                  </p>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Code de vérification (6 chiffres)</label>
                    <input 
                      type="text" 
                      placeholder="• • • • • •" 
                      maxLength={6}
                      required 
                      value={otpCode} 
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))} 
                      className="w-full text-center tracking-[0.5em] text-lg font-black px-4 py-3.5 bg-white rounded-xl border border-gray-200 focus:border-orange-500 outline-none" 
                    />
                  </div>

                  <button 
                    type="button" 
                    onClick={resetPhoneAuth}
                    className="text-xs font-bold text-gray-500 hover:text-orange-600 self-center transition-colors"
                  >
                    Retourner pour modifier le numéro
                  </button>
                </div>
              )}
            </>
          )}
          
          <button 
            type="submit" 
            disabled={isSendingOtp || isConfirmingOtp}
            className="w-full py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 active:scale-[0.98] transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {(isSendingOtp || isConfirmingOtp) && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            {authMethod === 'email' 
              ? (mode === 'login' ? 'Se connecter' : "S'inscrire") 
              : (isOtpSent 
                  ? 'Confirmer le code SMS' 
                  : 'Envoyer le code SMS par téléphone'
                )
            }
          </button>
        </form>

        <button 
          onClick={() => { 
            setMode(m => m === 'login' ? 'register' : 'login'); 
            setError(''); 
            resetPhoneAuth(); 
          }} 
          className="w-full mt-6 text-sm font-bold text-gray-500 hover:text-orange-600 transition-colors"
        >
          {mode === 'login' ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
        </button>
      </div>
    </div>
  );
}
