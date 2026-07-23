import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Role, Category } from '../types';
import { LogOut, User, Check, X, MessageSquare, Store, Sparkles, Calendar, Download, Star } from 'lucide-react';
import { GerantDashboard } from './GerantDashboard';
import { AdminDashboard } from './AdminDashboard';
import { EntrepriseDashboard } from './EntrepriseDashboard';
import { useInstallApp } from '../hooks/useInstallApp';

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
    updateProfile,
    envoyerCodeOtp, 
    confirmerCodeOtp,
    relationshipRequests,
    establishments,
    serviceRequests,
    reservations,
    updateReservationStatus,
    updateRelationshipRequest,
    createConversation,
    theme,
    toggleTheme,
    applications
  } = useAppStore();
  const { isInstallable, promptInstall } = useInstallApp();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [role, setRole] = useState<Role>('client');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [subView, setSubView] = useState<'dashboard' | 'profile'>('dashboard');
  const [resActiveTab, setResActiveTab] = useState<'current' | 'history'>('current');

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editError, setEditError] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const startEditing = () => {
    setEditName(currentUser?.name || '');
    setEditCity(currentUser?.city || '');
    setEditCountry(currentUser?.country || '');
    setEditEmail(currentUser?.email || '');
    setEditPhone(currentUser?.phone || '');
    setEditError('');
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError('');
    setIsSavingProfile(true);
    try {
      if (!editName.trim()) {
        throw new Error("Le nom complet est obligatoire.");
      }
      if (!editCity.trim()) {
        throw new Error("La ville est obligatoire.");
      }
      if (!editCountry.trim()) {
        throw new Error("Le pays est obligatoire.");
      }
      await updateProfile({
        name: editName,
        city: editCity,
        country: editCountry,
        email: editEmail,
        phone: editPhone
      });
      setIsEditingProfile(false);
    } catch (err: any) {
      console.error("Erreur lors de la mise à jour du profil :", err);
      setEditError(err.message || 'Une erreur est survenue lors de la mise à jour du profil.');
    } finally {
      setIsSavingProfile(false);
    }
  };
  
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
  const [estDescription, setEstDescription] = useState('');
  const [estPhotoUrl, setEstPhotoUrl] = useState('');
  const [estTags, setEstTags] = useState('');
  const [estNeighborhood, setEstNeighborhood] = useState('');
  const [estGeolocation, setEstGeolocation] = useState('');

  // Entreprise registration details
  const [entSector, setEntSector] = useState('Boisson & Brasserie');
  const [entLogo, setEntLogo] = useState('');
  const [entDescription, setEntDescription] = useState('');
  const [entPhilosophy, setEntPhilosophy] = useState('');

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await upgradeToGerant({
        name: estName,
        category: estCategory,
        description: estDescription,
        photos: estPhotoUrl ? [estPhotoUrl] : [],
        tags: estTags.split(',').map(t => t.trim()).filter(t => t !== ''),
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

  const forceUpdate = async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      // Try to clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      window.location.reload();
    }
  };

  if (currentUser) {
    if (currentUser.role === 'entreprise') {
      return (
        <div className="pb-24">
          <EntrepriseDashboard onLogout={logout} />
        </div>
      );
    }
    if (currentUser.role === 'admin' || currentUser.role === 'gerant') {
      return (
        <div className="pb-24">
          {/* Sub Navigation for Dashboard/Profile */}
          <div className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
            <div className="max-w-md mx-auto px-4 flex">
              <button 
                onClick={() => {
                  setSubView('dashboard');
                  setIsEditingProfile(false);
                }}
                className={`flex-1 py-4 text-center font-bold text-sm border-b-2 transition-all ${subView === 'dashboard' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                {currentUser.role === 'gerant' ? 'Espace Gérant' : 'Administration'}
              </button>
              <button 
                onClick={() => {
                  setSubView('profile');
                  setEditName(currentUser.name || '');
                  setEditCity(currentUser.city || '');
                  setEditCountry(currentUser.country || '');
                  setEditEmail(currentUser.email || '');
                  setEditPhone(currentUser.phone || '');
                  setEditError('');
                  setIsEditingProfile(false);
                }}
                className={`flex-1 py-4 text-center font-bold text-sm border-b-2 transition-all ${subView === 'profile' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                Mon Profil
              </button>
            </div>
          </div>

          <div className="pt-2">
            {subView === 'dashboard' ? (
              currentUser.role === 'admin' ? (
                <AdminDashboard onLogout={logout} />
              ) : (
                <GerantDashboard onLogout={logout} onNavigate={onNavigate} onStartChatWithConv={onStartChatWithConv} />
              )
            ) : (
              <div className="p-4 max-w-lg mx-auto flex flex-col gap-6">
                {/* Profile Card */}
                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col">
                  {!isEditingProfile ? (
                    <div className="flex flex-col items-center">
                      <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-5">
                        <User className="w-12 h-12 text-orange-500" />
                      </div>
                      <h2 className="text-2xl font-black text-gray-900">{currentUser.name}</h2>
                      <p className="text-gray-500 font-medium">{currentUser.email || currentUser.phone}</p>
                      <p className="text-gray-400 text-sm mt-1">{currentUser.city}, {currentUser.country}</p>
                      <div className="mt-4 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wider">
                        Compte {currentUser.role === 'gerant' ? 'Gérant' : 'Administrateur'}
                      </div>

                      <div className="mt-8 w-full flex flex-col gap-3">
                        <button 
                          onClick={startEditing} 
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors cursor-pointer shadow-md shadow-orange-600/10"
                        >
                          Modifier le profil
                        </button>
                        <button onClick={toggleTheme} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors cursor-pointer">
                          {theme === 'dark' ? '☀️ Mode Clair' : '🌙 Mode Sombre'}
                        </button>
                        <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors cursor-pointer">
                          <LogOut className="w-5 h-5" />
                          Déconnexion
                        </button>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                      <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-3 text-center">Modifier mon profil</h3>
                      
                      {editError && (
                        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-100">
                          {editError}
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 ml-1">Nom complet</label>
                        <input 
                          type="text" 
                          required 
                          value={editName} 
                          onChange={e => setEditName(e.target.value)} 
                          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium transition-all" 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-500 ml-1">Ville</label>
                          <input 
                            type="text" 
                            required 
                            value={editCity} 
                            onChange={e => setEditCity(e.target.value)} 
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium transition-all" 
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-500 ml-1">Pays</label>
                          <input 
                            type="text" 
                            required 
                            value={editCountry} 
                            onChange={e => setEditCountry(e.target.value)} 
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium transition-all" 
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 ml-1">Adresse E-mail</label>
                        <input 
                          type="email" 
                          value={editEmail} 
                          onChange={e => setEditEmail(e.target.value)} 
                          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium transition-all" 
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-500 ml-1">N° de Téléphone</label>
                        <input 
                          type="tel" 
                          value={editPhone} 
                          onChange={e => setEditPhone(e.target.value)} 
                          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium transition-all" 
                        />
                      </div>

                      {/* Immutable Role field */}
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-bold text-gray-400 ml-1">Rôle (Non modifiable)</label>
                        <input 
                          type="text" 
                          disabled 
                          value={currentUser.role === 'gerant' ? 'Gérant' : 'Administrateur'} 
                          className="w-full px-4 py-3 bg-gray-100 text-gray-400 rounded-xl border border-gray-200 outline-none font-medium cursor-not-allowed select-none" 
                        />
                      </div>

                      <div className="flex gap-3 mt-4">
                        <button 
                          type="button" 
                          onClick={() => setIsEditingProfile(false)} 
                          disabled={isSavingProfile}
                          className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Annuler
                        </button>
                        <button 
                          type="submit" 
                          disabled={isSavingProfile}
                          className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          {isSavingProfile && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          )}
                          Enregistrer
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    
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
                <label className="text-xs font-bold text-gray-500 ml-1">Description de l'établissement</label>
                <textarea 
                  placeholder="Décrivez votre établissement (ambiance, spécialités...)" 
                  required 
                  value={estDescription} 
                  onChange={e => setEstDescription(e.target.value)} 
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-orange-500 outline-none font-medium min-h-[100px]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Image de description (URL)</label>
                <input 
                  type="url" 
                  placeholder="https://images.unsplash.com/..." 
                  value={estPhotoUrl} 
                  onChange={e => setEstPhotoUrl(e.target.value)} 
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-orange-500 outline-none font-medium" 
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Tags (séparés par des virgules)</label>
                <input 
                  type="text" 
                  placeholder="Wifi, Terrasse, Live music..." 
                  value={estTags} 
                  onChange={e => setEstTags(e.target.value)} 
                  className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-orange-500 outline-none font-medium" 
                />
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
    const myReservations = reservations ? reservations.filter(r => r.clientId === currentUser.id) : [];

    const canCancelReservation = (resDate: string, resTime: string) => {
      try {
        const reservationDateTime = new Date(`${resDate}T${resTime || '00:00'}`);
        return reservationDateTime > new Date();
      } catch {
        return true;
      }
    };

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
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col">
          {!isEditingProfile ? (
            <div className="flex flex-col items-center">
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
                <button 
                  onClick={startEditing} 
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors cursor-pointer shadow-md shadow-orange-600/10"
                >
                  Modifier le profil
                </button>
                {isInstallable && (
                  <button onClick={promptInstall} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 font-bold rounded-xl hover:bg-blue-100 transition-colors cursor-pointer">
                    <Download className="w-5 h-5" />
                    Installer l'application
                  </button>
                )}
                <button onClick={forceUpdate} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors cursor-pointer">
                  <Download className="w-5 h-5" />
                  Forcer la mise à jour (PWA)
                </button>
                {/* For iOS users who cannot use standard beforeinstallprompt but are on mobile and not standalone */}
                {(!isInstallable && 
                  typeof window !== 'undefined' && 
                  !window.matchMedia('(display-mode: standalone)').matches && 
                  /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())
                ) && (
                  <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 rounded-xl p-4 text-xs text-gray-700 dark:text-gray-300 flex flex-col gap-2">
                    <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      Comment installer Zaka+ sur iPhone :
                    </p>
                    <ol className="list-decimal list-inside flex flex-col gap-1.5 text-gray-600 dark:text-gray-400">
                      <li>Appuyez sur le bouton de <strong>Partage</strong> de Safari en bas de l'écran.</li>
                      <li>Faites défiler vers le bas et sélectionnez <strong>« Sur l'écran d'accueil »</strong>.</li>
                    </ol>
                  </div>
                )}
                {/* Thème avec sélection Manuelle / Auto */}
                <div className="flex flex-col gap-1.5 w-full">
                  <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl border border-gray-200 dark:border-gray-750">
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem('app-theme', 'light');
                        if (theme === 'dark') toggleTheme();
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        localStorage.getItem('app-theme') === 'light'
                          ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-xs font-black'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                    >
                      ☀️ Clair
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.setItem('app-theme', 'dark');
                        if (theme === 'light') toggleTheme();
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        localStorage.getItem('app-theme') === 'dark'
                          ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-xs font-black'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                    >
                      🌙 Sombre
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        localStorage.removeItem('app-theme');
                        const systemTheme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                        if (theme !== systemTheme) {
                          toggleTheme();
                        }
                      }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        localStorage.getItem('app-theme') === null
                          ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-xs font-black'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                    >
                      ⚙️ Auto
                    </button>
                  </div>
                </div>
                <button onClick={() => setIsUpgrading(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-50 text-orange-600 font-bold rounded-xl hover:bg-orange-100 transition-colors cursor-pointer">
                  Devenir Gérant (Ajouter un établissement)
                </button>
                <button onClick={logout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors cursor-pointer">
                  <LogOut className="w-5 h-5" />
                  Déconnexion
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <h3 className="text-lg font-black text-gray-900 border-b border-gray-100 pb-3 text-center">Modifier mon profil</h3>
              
              {editError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl font-medium border border-red-100">
                  {editError}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Nom complet</label>
                <input 
                  type="text" 
                  required 
                  value={editName} 
                  onChange={e => setEditName(e.target.value)} 
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium transition-all" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">Ville</label>
                  <input 
                    type="text" 
                    required 
                    value={editCity} 
                    onChange={e => setEditCity(e.target.value)} 
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium transition-all" 
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">Pays</label>
                  <input 
                    type="text" 
                    required 
                    value={editCountry} 
                    onChange={e => setEditCountry(e.target.value)} 
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium transition-all" 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Adresse E-mail</label>
                <input 
                  type="email" 
                  value={editEmail} 
                  onChange={e => setEditEmail(e.target.value)} 
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium transition-all" 
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 ml-1">N° de Téléphone</label>
                <input 
                  type="tel" 
                  value={editPhone} 
                  onChange={e => setEditPhone(e.target.value)} 
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium transition-all" 
                />
              </div>

              {/* Immutable Role field */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-400 ml-1">Rôle (Non modifiable)</label>
                <input 
                  type="text" 
                  disabled 
                  value={currentUser.role === 'gerant' ? 'Gérant' : currentUser.role === 'admin' ? 'Administrateur' : 'Client'} 
                  className="w-full px-4 py-3 bg-gray-100 text-gray-400 rounded-xl border border-gray-200 outline-none font-medium cursor-not-allowed select-none" 
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsEditingProfile(false)} 
                  disabled={isSavingProfile}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={isSavingProfile}
                  className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSavingProfile && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  Enregistrer
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Parrainage & Fidélité */}
        <div className="bg-white dark:bg-gray-950 rounded-3xl p-6 shadow-sm border border-orange-100 dark:border-orange-900/30 overflow-hidden relative">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-100 dark:bg-orange-900/20 rounded-full blur-2xl"></div>
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center text-white shadow-sm">
                <Star className="w-5 h-5 fill-current" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">Programme Fidélité</h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">Parrainez vos amis et gagnez des points</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-2xl">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Vos points virtuels</span>
                <span className="text-2xl font-black text-gray-900 dark:text-white">{currentUser.points || 0} <span className="text-sm text-gray-400 dark:text-gray-500">pts</span></span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Badge Actuel</span>
                <span className="text-sm font-black text-gray-900 dark:text-white mt-1 px-2.5 py-1 bg-white dark:bg-gray-900 rounded-lg shadow-xs border border-gray-100 dark:border-gray-800">
                  {(!currentUser.points || currentUser.points < 100) ? '🌱 Novice' : (currentUser.points < 500 ? '🔥 Habitué' : '👑 Ambassadeur')}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">Votre code de parrainage :</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-mono text-sm font-bold text-center text-gray-800 dark:text-gray-200">
                  {currentUser.referralCode || `ZAKA-${currentUser.name.substring(0,3).toUpperCase()}-${currentUser.id.substring(0,4).toUpperCase()}`}
                </code>
                <button 
                  onClick={() => {
                    const code = currentUser.referralCode || `ZAKA-${currentUser.name.substring(0,3).toUpperCase()}-${currentUser.id.substring(0,4).toUpperCase()}`;
                    navigator.clipboard.writeText(`Rejoins-moi sur Zaka+ ! Utilise mon code de parrainage: ${code} et gagne tes premiers points.`);
                    alert("Code de parrainage copié !");
                  }}
                  className="px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs transition-colors active:scale-95 cursor-pointer shadow-sm shadow-orange-600/20"
                >
                  Copier
                </button>
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-1">Partagez ce code avec vos amis pour gagner +50 points par inscription.</p>
            </div>
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

        {/* Mes réservations de table (Restaurants) */}
        <div className="bg-white dark:bg-gray-950 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-900">
          <h3 className="text-sm font-black text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-orange-500" />
            Mes réservations de table (Restaurants)
          </h3>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold mb-4">Suivez et gérez vos réservations de table dans les restaurants partenaires.</p>

          {myReservations && myReservations.length > 0 && (
            /* Sub-tabs: Actives vs Historique */
            <div className="flex bg-gray-50 dark:bg-gray-900 p-1 rounded-xl border border-gray-150 dark:border-gray-800 mb-4">
              <button
                type="button"
                onClick={() => setResActiveTab('current')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  resActiveTab === 'current'
                    ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-xs font-black'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                En cours ({myReservations.filter(res => {
                  const isPassed = !canCancelReservation(res.date, res.time);
                  return res.status !== 'annulee' && res.status !== 'refusee' && !isPassed;
                }).length})
              </button>
              <button
                type="button"
                onClick={() => setResActiveTab('history')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  resActiveTab === 'history'
                    ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-xs font-black'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Historique ({myReservations.filter(res => {
                  const isPassed = !canCancelReservation(res.date, res.time);
                  return res.status === 'annulee' || res.status === 'refusee' || isPassed;
                }).length})
              </button>
            </div>
          )}

          {(() => {
            const displayedReservations = myReservations.filter(res => {
              const isPassed = !canCancelReservation(res.date, res.time);
              const isHistory = res.status === 'annulee' || res.status === 'refusee' || isPassed;
              return resActiveTab === 'history' ? isHistory : !isHistory;
            });

            if (displayedReservations.length === 0) {
              return (
                <p className="text-xs text-gray-400 font-bold py-3 text-center bg-gray-50 dark:bg-gray-900/40 rounded-2xl">
                  {resActiveTab === 'history' 
                    ? "Aucun historique de réservation." 
                    : "Aucune réservation en cours."}
                </p>
              );
            }

            return (
              <div className="flex flex-col gap-3">
                {displayedReservations.map(res => {
                  const estDetail = establishments.find(e => e.id === res.establishmentId);
                  const isPassed = !canCancelReservation(res.date, res.time);
                  const clientCanCancel = res.status !== 'annulee' && res.status !== 'refusee' && !isPassed;

                  return (
                    <div key={res.id} className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800/60 flex flex-col gap-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-sm flex-shrink-0">
                            <span>🍽️</span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-gray-900 dark:text-white truncate">{res.establishmentName}</h4>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] font-black uppercase tracking-wide bg-orange-100/50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded">
                                {res.guestsCount} pers.
                              </span>
                              <span className="text-[9px] text-gray-500 dark:text-gray-400 font-bold">
                                {new Date(res.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {res.time}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
                            isPassed && res.status === 'confirmee' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-350 border-blue-200 dark:border-blue-900/50' :
                            res.status === 'en_attente' ? 'bg-yellow-100 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-350 border-yellow-200 dark:border-yellow-900/50' :
                            res.status === 'confirmee' ? 'bg-green-100 dark:bg-green-950/40 text-green-800 dark:text-green-350 border-green-200 dark:border-green-900/50' :
                            res.status === 'refusee' ? 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-350 border-red-200 dark:border-red-900/50' :
                            'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                          }`}>
                            {isPassed && res.status === 'confirmee' ? 'Terminée' :
                             res.status === 'en_attente' ? 'En attente' : 
                             res.status === 'confirmee' ? 'Confirmée' : 
                             res.status === 'refusee' ? 'Refusée' : 'Annulée'}
                          </span>
                          {estDetail && (
                            <button 
                              type="button"
                              onClick={() => handleStartChat(res.establishmentId, estDetail.name, estDetail.ownerId)}
                              className="p-1.5 bg-orange-50 hover:bg-orange-100 dark:bg-gray-800 dark:hover:bg-gray-700 text-orange-600 dark:text-orange-400 rounded-lg transition-colors cursor-pointer"
                              title="Discuter avec l'établissement"
                            >
                              <MessageSquare className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {res.note && (
                        <div className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900 p-2.5 rounded-lg border border-gray-100 dark:border-gray-800 font-medium">
                          <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 block uppercase mb-0.5">Votre note :</span>
                          {res.note}
                        </div>
                      )}

                      {res.managerMessage && (
                        <div className="text-xs text-amber-900 dark:text-amber-300 bg-amber-50/50 dark:bg-amber-955/20 p-2.5 rounded-lg border border-amber-100 dark:border-amber-900/40 font-medium">
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block uppercase mb-0.5">Message du gérant :</span>
                          {res.managerMessage}
                        </div>
                      )}

                      {clientCanCancel && (
                        <button
                          type="button"
                          onClick={() => updateReservationStatus(res.id, 'annulee')}
                          className="self-end text-[10px] font-black text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-350 hover:underline uppercase tracking-wide py-1 cursor-pointer"
                        >
                          Annuler la réservation
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Mes candidatures aux offres d'emploi */}
        <div id="my-applications-section" className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-black text-gray-900 mb-1 flex items-center gap-2">
            <User className="w-4 h-4 text-orange-500" />
            Mes candidatures d'emploi
          </h3>
          <p className="text-[10px] text-gray-400 font-semibold mb-4">Suivez en temps réel l'état de vos candidatures auprès des recruteurs.</p>

          {applications.filter(a => a.clientId === currentUser.id).length === 0 ? (
            <p className="text-xs text-gray-400 font-bold py-3 text-center bg-gray-50 rounded-2xl">Vous n'avez pas encore postulé à une offre.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {applications.filter(a => a.clientId === currentUser.id).map(app => {
                const estDetail = establishments.find(e => e.id === app.establishmentId);
                return (
                  <div key={app.id} id={`my-app-card-${app.id}`} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-xs text-gray-900 leading-tight">{app.publicationTitle}</h4>
                        <p className="text-[10px] text-orange-600 font-bold mt-0.5">{app.establishmentName}</p>
                      </div>

                      <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        app.status === 'acceptee' ? 'bg-green-100 text-green-700 border border-green-200/50' :
                        app.status === 'refusee' ? 'bg-red-100 text-red-700 border border-red-200/50' : 'bg-yellow-100 text-yellow-700 border border-yellow-200/50'
                      }`}>
                        {app.status === 'acceptee' ? 'Acceptée' : app.status === 'refusee' ? 'Refusée' : 'En attente'}
                      </span>
                    </div>

                    {app.message && (
                      <div className="text-xs text-gray-500 bg-white p-2.5 rounded-lg border border-gray-100 font-medium italic">
                        "{app.message}"
                      </div>
                    )}

                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-medium mt-1">
                      <span>Postulé le {new Date(app.createdAt).toLocaleDateString('fr-FR')}</span>
                      {estDetail && (
                        <button 
                          type="button"
                          onClick={() => handleStartChat(app.establishmentId, estDetail.name, estDetail.ownerId)}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg font-bold transition-all cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          Contacter le gérant
                        </button>
                      )}
                    </div>
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
            { email: identifier, name, role, country, city, phone: phone },
            password,
            role === 'gerant' ? {
              name: estName,
              category: estCategory,
              description: estDescription,
              photos: estPhotoUrl ? [estPhotoUrl] : [],
              tags: estTags.split(',').map(t => t.trim()).filter(t => t !== ''),
              neighborhood: estNeighborhood,
              geolocation: estGeolocation
            } : undefined,
            role === 'entreprise' ? {
              sector: entSector,
              logo: entLogo,
              philosophy: entPhilosophy,
              description: entDescription
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
                description: estDescription,
                photos: estPhotoUrl ? [estPhotoUrl] : [],
                tags: estTags.split(',').map(t => t.trim()).filter(t => t !== ''),
                neighborhood: estNeighborhood,
                geolocation: estGeolocation
              } : undefined,
              entrepriseData: role === 'entreprise' ? {
                sector: entSector,
                logo: entLogo,
                philosophy: entPhilosophy,
                description: entDescription
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
          <div className="mb-6">
            <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wider block mb-2 text-center">
              {mode === 'login' ? 'Se connecter via :' : "S'inscrire avec :"}
            </span>
            <div className="flex gap-2 p-1 bg-gray-100/80 rounded-xl">
              <button
                type="button"
                onClick={() => { setAuthMethod('email'); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMethod === 'email' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                📧 Adresse E-mail
              </button>
              <button
                type="button"
                onClick={() => { setAuthMethod('phone'); setError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${authMethod === 'phone' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                📱 Téléphone (SMS)
              </button>
            </div>
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
                <button type="button" onClick={() => setRole('client')} className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${role === 'client' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}>Client</button>
                <button type="button" onClick={() => setRole('gerant')} className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${role === 'gerant' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}>Gérant</button>
                <button type="button" onClick={() => setRole('entreprise')} className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${role === 'entreprise' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}>Entreprise</button>
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 ml-1">
                  {role === 'entreprise' ? "Nom de l'entreprise" : "Nom complet"}
                </label>
                <input type="text" placeholder={role === 'entreprise' ? "Ex: Brakina, Castel, Sobbra..." : "Votre nom"} required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium" />
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
                    <label className="text-xs font-bold text-gray-500 ml-1">Description de l'établissement</label>
                    <textarea 
                      placeholder="Décrivez votre établissement (ambiance, spécialités...)" 
                      required 
                      value={estDescription} 
                      onChange={e => setEstDescription(e.target.value)} 
                      className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-orange-500 outline-none font-medium min-h-[100px]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Image de description (URL)</label>
                    <input 
                      type="url" 
                      placeholder="https://images.unsplash.com/..." 
                      value={estPhotoUrl} 
                      onChange={e => setEstPhotoUrl(e.target.value)} 
                      className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-orange-500 outline-none font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Tags (séparés par des virgules)</label>
                    <input 
                      type="text" 
                      placeholder="Wifi, Terrasse, Live music..." 
                      value={estTags} 
                      onChange={e => setEstTags(e.target.value)} 
                      className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-orange-500 outline-none font-medium" 
                    />
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

              {role === 'entreprise' && (
                <div className="mt-2 p-4 bg-orange-50/50 rounded-2xl border border-orange-100 flex flex-col gap-4 animate-fadeIn">
                  <h3 className="font-bold text-gray-900 text-sm border-b border-orange-200/50 pb-2">Détails de l'entreprise</h3>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Secteur d'activité</label>
                    <select required value={entSector} onChange={e => setEntSector(e.target.value)} className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-orange-500 outline-none font-medium text-gray-700">
                      <option value="Boisson & Brasserie">Boisson & Brasserie</option>
                      <option value="Événementiel & Production">Événementiel & Production</option>
                      <option value="Média & Communication">Média & Communication</option>
                      <option value="Mode & Lifestyle">Mode & Lifestyle</option>
                      <option value="Culture & Art">Culture & Art</option>
                      <option value="Autre">Autre</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Logo (URL de l'image)</label>
                    <input 
                      type="url" 
                      placeholder="https://images.unsplash.com/... (ou vide pour par défaut)" 
                      value={entLogo} 
                      onChange={e => setEntLogo(e.target.value)} 
                      className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-orange-500 outline-none font-medium" 
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Description de l'entreprise</label>
                    <textarea 
                      placeholder="Décrivez votre entreprise, son activité et ses valeurs..." 
                      required 
                      value={entDescription} 
                      onChange={e => setEntDescription(e.target.value)} 
                      className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-orange-500 outline-none font-medium min-h-[90px]"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Pourquoi rejoignez-vous Zaka+ ?</label>
                    <textarea 
                      placeholder="Expliquez votre intérêt pour la convivialité, la culture locale et la philosophie Zaka+..." 
                      required 
                      value={entPhilosophy} 
                      onChange={e => setEntPhilosophy(e.target.value)} 
                      className="w-full px-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-orange-500 outline-none font-medium min-h-[90px]"
                    />
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

              {mode === 'register' && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 ml-1">N° de Téléphone (Optionnel - ex: +22670000000)</label>
                  <input type="tel" placeholder="+22670000000 (Optionnel)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none transition-all font-medium" />
                </div>
              )}
              
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
