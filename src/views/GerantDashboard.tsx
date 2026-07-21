import React, { useState } from 'react';
import { RichTextEditor } from '../components/RichTextEditor';
import { ClientsAndRequests } from '../components/ClientsAndRequests';
import { GerantAnalytics } from '../components/GerantAnalytics';
import { useAppStore } from '../store';
import { LogOut, Plus, Store, Eye, MousePointerClick, X, Megaphone, Calendar, Users, FileText, Image as ImageIcon, MessageSquare, Download, Settings, ChefHat } from 'lucide-react';
import { Category, PubType } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { useInstallApp } from '../hooks/useInstallApp';
import { ReservationsDashboard } from '../components/ReservationsDashboard';
import { MenuDuJourForm } from '../components/MenuDuJourForm';

export function GerantDashboard({ onLogout, onNavigate, onStartChatWithConv }: { onLogout: () => void; onNavigate?: (tab: any) => void; onStartChatWithConv?: (convId: string) => void }) {
  const { 
    currentUser, 
    establishments, 
    publications, 
    unreadCount, 
    addEstablishment, 
    updateEstablishment,
    addPublication,
    applications,
    updateApplicationStatus,
    createConversation,
    reviews,
    replyToReview,
    reservations,
    updateReservationStatus,
    menusDuJour,
    addMenuDuJour
  } = useAppStore();
  const myEsts = establishments.filter(e => e.ownerId === currentUser?.id);
  const { isInstallable, promptInstall } = useInstallApp();
  
  const [isAdding, setIsAdding] = useState(false);
  const [reviewReplies, setReviewReplies] = useState<Record<string, string>>({});

  // Restaurant Menu & Reservations modal states
  const [showResModal, setShowResModal] = useState(false);
  const [resActiveEstId, setResActiveEstId] = useState<string | null>(null);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [menuActiveEstId, setMenuActiveEstId] = useState<string | null>(null);
  
  // Est Form state
  const [estName, setEstName] = useState('');
  const [estCategory, setEstCategory] = useState<Category>('maquis');
  const [estCountry, setEstCountry] = useState(currentUser?.country || 'Burkina Faso');
  const [estCity, setEstCity] = useState(currentUser?.city || '');
  const [estNeighborhood, setEstNeighborhood] = useState('');
  const [estGeolocation, setEstGeolocation] = useState('');
  const [estDescription, setEstDescription] = useState('');
  const [estPhotoUrl, setEstPhotoUrl] = useState('');
  const [estOpeningHours, setEstOpeningHours] = useState('');
  const [estTags, setEstTags] = useState('');
  const [editingEstId, setEditingEstId] = useState<string | null>(null);

  // Pub Form State
  const [pubModalEstId, setPubModalEstId] = useState<string | null>(null);
  const [pubModalType, setPubModalType] = useState<PubType | null>(null);
  const [pubTitle, setPubTitle] = useState('');
  const [pubDesc, setPubDesc] = useState('');
  const [pubImage, setPubImage] = useState('');
  const [pubStartDate, setPubStartDate] = useState('');
  const [pubEndDate, setPubEndDate] = useState('');
  const [pubWhatsApp, setPubWhatsApp] = useState('');
  const [pubApplyEmail, setPubApplyEmail] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmittingPub, setIsSubmittingPub] = useState(false);
  const [pubError, setPubError] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        setIsUploadingImage(true);
        const base64 = await compressImage(e.target.files[0], 800, 800, 0.7);
        setPubImage(base64);
      } catch (error) {
        console.error("Failed to compress image", error);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    
    const photos = estPhotoUrl ? [estPhotoUrl] : [];
    const tags = estTags.split(',').map(t => t.trim()).filter(t => t !== '');

    const estData = {
      ownerId: currentUser.id,
      name: estName,
      category: estCategory,
      country: estCountry,
      city: estCity,
      neighborhood: estNeighborhood,
      address: '', // default
      phone: currentUser.phone || currentUser.email || '',
      description: estDescription,
      photos,
      tags,
      geolocation: estGeolocation,
      openingHours: estOpeningHours
    };

    try {
      if (editingEstId) {
        await updateEstablishment(editingEstId, estData);
      } else {
        await addEstablishment(estData);
      }
    } catch (err) {
      console.error("Error saving establishment:", err);
    }
    
    setIsAdding(false);
    setEditingEstId(null);
    // Reset form
    setEstName('');
    setEstCategory('maquis');
    setEstCountry(currentUser?.country || 'Burkina Faso');
    setEstCity(currentUser?.city || '');
    setEstNeighborhood('');
    setEstGeolocation('');
    setEstDescription('');
    setEstPhotoUrl('');
    setEstOpeningHours('');
    setEstTags('');
  };

  const handlePubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubModalEstId || !pubModalType) return;
    try {
      setIsSubmittingPub(true);
      setPubError(null);
      await addPublication({
        establishmentId: pubModalEstId,
        type: pubModalType,
        title: pubTitle,
        description: pubDesc,
        imageUrl: pubImage || undefined,
        startDate: pubStartDate || undefined,
        endDate: pubEndDate || undefined,
        status: 'active',
        whatsapp: pubModalType === 'recrutement' ? (pubWhatsApp || undefined) : undefined,
        applyEmail: pubModalType === 'recrutement' ? (pubApplyEmail || undefined) : undefined
      });
      closePubModal();
    } catch(err: any) {
      console.error(err);
      setPubError("Une erreur est survenue lors de la publication. Veuillez réessayer.");
    } finally {
      setIsSubmittingPub(false);
    }
  };

  const closePubModal = () => {
    setPubModalEstId(null);
    setPubModalType(null);
    setPubTitle('');
    setPubDesc('');
    setPubImage('');
    setPubStartDate('');
    setPubEndDate('');
    setPubWhatsApp('');
    setPubApplyEmail('');
    setPubError(null);
  };

  const getPubTypeLabel = (type: PubType) => {
    switch (type) {
      case 'promo': return 'Promo / Bon plan';
      case 'evenement': return 'Événement';
      case 'recrutement': return 'Recrutement';
      case 'annonce': return 'Communiqué';
      default: return type;
    }
  };

  if (isAdding) {
    return (
      <div className="p-4 max-w-3xl mx-auto pb-24">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-gray-900">
            {editingEstId ? "Modifier l'Établissement" : "Nouvel Établissement"}
          </h2>
          <button 
            onClick={() => {
              setIsAdding(false);
              setEditingEstId(null);
              // Reset
              setEstName('');
              setEstCategory('maquis');
              setEstCountry(currentUser?.country || 'Burkina Faso');
              setEstCity(currentUser?.city || '');
              setEstNeighborhood('');
              setEstGeolocation('');
              setEstDescription('');
              setEstPhotoUrl('');
              setEstOpeningHours('');
              setEstTags('');
            }} 
            className="p-2 text-gray-400 hover:text-gray-600 bg-white rounded-full shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAddSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 ml-1">Nom de l'établissement</label>
            <input type="text" required value={estName} onChange={e => setEstName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 ml-1">Type d'établissement</label>
            <select required value={estCategory} onChange={e => setEstCategory(e.target.value as Category)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium text-gray-700">
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
            <label className="text-xs font-bold text-gray-500 ml-1">Description de l'établissement (ambiance, spécialités...)</label>
            <textarea 
              required 
              value={estDescription} 
              onChange={e => setEstDescription(e.target.value)} 
              placeholder="Décrivez brièvement votre établissement..."
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium min-h-[100px] resize-none" 
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 ml-1">Image de description (URL)</label>
            <input 
              type="url" 
              placeholder="https://images.unsplash.com/..." 
              value={estPhotoUrl} 
              onChange={e => setEstPhotoUrl(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium" 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 ml-1">Pays</label>
              <input type="text" required value={estCountry} onChange={e => setEstCountry(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 ml-1">Ville</label>
              <input type="text" required value={estCity} onChange={e => setEstCity(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium" />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 ml-1">Quartier</label>
            <input type="text" required value={estNeighborhood} onChange={e => setEstNeighborhood(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium" />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 ml-1">Horaires d'ouverture hebdomadaires</label>
            <input 
              type="text" 
              placeholder="Ex: Lun - Dim : 16h00 - 02h00" 
              value={estOpeningHours} 
              onChange={e => setEstOpeningHours(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium" 
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 ml-1">Tags (séparés par des virgules)</label>
            <input 
              type="text" 
              placeholder="Wifi, Terrasse, Live music..." 
              value={estTags} 
              onChange={e => setEstTags(e.target.value)} 
              className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium" 
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 ml-1">Géolocalisation (Lien Maps - optionnel)</label>
            <input type="url" placeholder="https://maps.google.com/..." value={estGeolocation} onChange={e => setEstGeolocation(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium" />
          </div>

          <button type="submit" className="w-full mt-4 py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 active:scale-[0.98] transition-all shadow-md shadow-orange-600/10">
            {editingEstId ? "Enregistrer les modifications" : "Créer l'établissement"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Espace Gérant</h2>
          <p className="text-gray-500 text-sm">Bienvenue, {currentUser?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {isInstallable && (
            <button onClick={promptInstall} className="p-2 text-blue-600 hover:bg-blue-50 bg-white rounded-full shadow-sm" title="Installer l'application">
              <Download className="w-5 h-5" />
            </button>
          )}
          <button onClick={onLogout} className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-full shadow-sm" title="Déconnexion">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-black text-orange-600 mb-1">{myEsts.length}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Établissements</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
          <div className="text-2xl font-black text-blue-600 mb-1">
            {myEsts.reduce((acc, est) => acc + publications.filter(p => p.establishmentId === est.id).length, 0)}
          </div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Publications</div>
        </div>
        <button 
          onClick={() => onNavigate && onNavigate('messages')}
          disabled={!onNavigate}
          className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center relative hover:bg-orange-50/20 active:scale-95 transition-all group cursor-pointer"
        >
          {unreadCount > 0 ? (
            <div className="relative">
              <div className="text-2xl font-black text-orange-600 mb-1 animate-bounce">{unreadCount}</div>
              <span className="absolute -top-1 -right-2 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500"></span>
              </span>
            </div>
          ) : (
            <div className="text-2xl font-black text-gray-500 mb-1">0</div>
          )}
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider group-hover:text-orange-600 transition-colors">Messages</div>
        </button>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Mes Établissements</h3>
        <button onClick={() => setIsAdding(true)} className="flex items-center gap-1.5 text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg hover:bg-orange-100">
          <Plus className="w-4 h-4" /> Ajouter
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {myEsts.map(est => (
          <div key={est.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                  <Store className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{est.name}</h4>
                  <p className="text-xs text-gray-500 capitalize">{est.category} • {est.city}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-bold ${est.status === 'valide' ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                {est.status === 'valide' ? 'Validé' : 'En attente'}
              </div>
            </div>
            
              <div className="border-t border-gray-100 pt-3 mt-3">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Actions rapides</h5>
                  <button 
                    onClick={() => {
                      setEditingEstId(est.id);
                      setEstName(est.name);
                      setEstCategory(est.category);
                      setEstCountry(est.country || 'Burkina Faso');
                      setEstCity(est.city);
                      setEstNeighborhood(est.neighborhood);
                      setEstGeolocation(est.geolocation || '');
                      setEstDescription(est.description || '');
                      setEstPhotoUrl(est.photos && est.photos[0] ? est.photos[0] : '');
                      setEstOpeningHours(est.openingHours || '');
                      setEstTags(est.tags ? est.tags.join(', ') : '');
                      setIsAdding(true);
                    }}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Settings className="w-3 h-3" /> Modifier les infos
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button onClick={() => { setPubModalEstId(est.id); setPubModalType('promo'); }} className="flex flex-col items-center justify-center p-3 bg-orange-50 text-orange-600 hover:bg-orange-100 font-bold text-xs rounded-xl transition-colors text-center tracking-wide gap-1">
                    <Megaphone className="w-5 h-5" />
                    Promo / Bon plan
                  </button>
                  <button onClick={() => { setPubModalEstId(est.id); setPubModalType('evenement'); }} className="flex flex-col items-center justify-center p-3 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-xl transition-colors text-center tracking-wide gap-1">
                    <Calendar className="w-5 h-5" />
                    Événement
                  </button>
                  <button onClick={() => { setPubModalEstId(est.id); setPubModalType('recrutement'); }} className="flex flex-col items-center justify-center p-3 bg-green-50 text-green-600 hover:bg-green-100 font-bold text-xs rounded-xl transition-colors text-center tracking-wide gap-1">
                    <Users className="w-5 h-5" />
                    Recrutement
                  </button>
                  <button onClick={() => { setPubModalEstId(est.id); setPubModalType('annonce'); }} className="flex flex-col items-center justify-center p-3 bg-purple-50 text-purple-600 hover:bg-purple-100 font-bold text-xs rounded-xl transition-colors text-center tracking-wide gap-1">
                    <FileText className="w-5 h-5" />
                    Communiqué
                  </button>
                </div>

                {est.category === 'restaurant' && (
                  <div className="bg-orange-50/40 border border-orange-100 rounded-2xl p-4 mb-4 space-y-3 animate-in fade-in duration-200">
                    <h5 className="text-xs font-black text-orange-800 uppercase tracking-wider flex items-center gap-1.5">
                      <span>🍽️</span> Restaurant - Menu & Réservations
                    </h5>
                    
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setResActiveEstId(est.id);
                          setShowResModal(true);
                        }}
                        className="py-2.5 px-3 bg-white hover:bg-orange-50 text-orange-700 font-extrabold text-[11px] uppercase tracking-wider rounded-xl border border-orange-250 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                      >
                        <Calendar className="w-4 h-4 text-orange-600" />
                        Réservations
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          setMenuActiveEstId(est.id);
                          setShowMenuModal(true);
                        }}
                        className="py-2.5 px-3 bg-white hover:bg-orange-50 text-orange-700 font-extrabold text-[11px] uppercase tracking-wider rounded-xl border border-orange-250 shadow-sm flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                      >
                        <ChefHat className="w-4 h-4 text-orange-600" />
                        Menu du jour
                      </button>
                    </div>
                  </div>
                )}
                
                <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Publications récentes</h5>
                <div className="flex flex-col gap-2">
                  {publications.filter(p => p.establishmentId === est.id).map(pub => (
                    <div key={pub.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="text-sm font-bold text-gray-900 line-clamp-1">{pub.title}</div>
                        <div className="text-[10px] font-bold tracking-wider text-orange-500 uppercase">{pub.type.replace('_', ' ')}</div>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-medium text-gray-400">
                        <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5"/> {pub.views}</span>
                        <span className="flex items-center gap-1"><MousePointerClick className="w-3.5 h-3.5"/> {pub.clicks}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-3.5 mt-4 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Discussions Clients</span>
                  <button 
                    onClick={() => onNavigate && onNavigate('messages')}
                    className="flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100/80 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Ouvrir la messagerie
                  </button>
                </div>
                <div className="mt-4">
                  <GerantAnalytics establishmentId={est.id} />
                  <ClientsAndRequests establishmentId={est.id} onNavigate={onNavigate} onStartChatWithConv={onStartChatWithConv} />

                  {/* Avis et commentaires des clients */}
                  <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-4 animate-in fade-in duration-250">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquare className="w-4 h-4 text-orange-500" />
                      <h5 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                        Avis des clients ({reviews.filter(r => r.establishmentId === est.id).length})
                      </h5>
                    </div>
                    <div className="flex flex-col gap-3">
                      {reviews.filter(r => r.establishmentId === est.id).length === 0 ? (
                        <p className="text-xs text-gray-400 font-medium italic">Aucun avis laissé pour le moment.</p>
                      ) : (
                        reviews.filter(r => r.establishmentId === est.id).map(rev => (
                          <div key={rev.id} className="p-3.5 bg-gray-50 dark:bg-gray-900/40 border border-gray-100 dark:border-gray-800 rounded-xl flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-gray-800 dark:text-gray-200">Avis Client</span>
                                <div className="flex text-yellow-400">
                                  {[...Array(rev.rating)].map((_, i) => (
                                    <span key={i} className="text-xs">★</span>
                                  ))}
                                </div>
                              </div>
                              <span className="text-[9px] text-gray-400 font-bold">
                                {new Date(rev.date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic">"{rev.comment}"</p>
                            
                            {/* Render reply if already exists */}
                            {(rev as any).reply ? (
                              <div className="bg-orange-50/60 dark:bg-orange-950/20 border-l-2 border-orange-500 p-2.5 rounded-r-lg mt-1 text-xs">
                                <p className="font-extrabold text-orange-800 dark:text-orange-400 mb-0.5 uppercase tracking-wide text-[10px]">Votre Réponse :</p>
                                <p className="text-gray-700 dark:text-gray-300 italic font-medium">"{(rev as any).reply}"</p>
                              </div>
                            ) : (
                              /* Type answer input if no reply exists */
                              <div className="mt-2 flex gap-2">
                                <input
                                  type="text"
                                  placeholder="Répondre à cet avis..."
                                  value={reviewReplies[rev.id] || ''}
                                  onChange={e => setReviewReplies(prev => ({ ...prev, [rev.id]: e.target.value }))}
                                  className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none placeholder:text-gray-400 dark:text-white font-medium"
                                />
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const text = reviewReplies[rev.id];
                                    if (!text || !text.trim()) return;
                                    await replyToReview(rev.id, text.trim());
                                    setReviewReplies(prev => ({ ...prev, [rev.id]: '' }));
                                  }}
                                  className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer"
                                >
                                  Répondre
                                </button>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  
                  {applications.filter(a => a.establishmentId === est.id).length > 0 && (
                    <div id={`applications-section-${est.id}`} className="mt-6 border-t border-gray-100 pt-4 animate-in fade-in duration-250">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-orange-500" />
                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Candidatures reçues ({applications.filter(a => a.establishmentId === est.id).length})</h5>
                      </div>
                      <div className="flex flex-col gap-3">
                        {applications.filter(a => a.establishmentId === est.id).map(app => (
                          <div key={app.id} id={`app-card-${app.id}`} className="p-4 bg-gray-50 border border-gray-100/50 rounded-xl flex flex-col gap-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-bold text-gray-900 text-sm">{app.clientName}</div>
                                <div className="text-[10px] font-bold text-orange-600 uppercase mt-0.5">{app.publicationTitle}</div>
                              </div>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wider ${
                                app.status === 'acceptee'
                                  ? 'bg-green-100 text-green-700 border border-green-200/50'
                                  : app.status === 'refusee'
                                  ? 'bg-red-100 text-red-700 border border-red-200/50'
                                  : 'bg-yellow-100 text-yellow-700 border border-yellow-200/50'
                              }`}>
                                {app.status === 'acceptee' ? 'Acceptée' : app.status === 'refusee' ? 'Refusée' : 'En attente'}
                              </span>
                            </div>

                            {app.message && (
                              <p className="text-xs text-gray-600 bg-white p-3 rounded-lg border border-gray-100/50 italic leading-relaxed">
                                "{app.message}"
                              </p>
                            )}

                            <div className="text-[10px] text-gray-400 font-medium">
                              Reçue le {new Date(app.createdAt).toLocaleDateString('fr-FR')} à {new Date(app.createdAt).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                            </div>

                            <div className="flex gap-2">
                              {app.status === 'en_attente' && (
                                <>
                                  <button
                                    id={`app-accept-${app.id}`}
                                    onClick={() => updateApplicationStatus(app.id, 'acceptee')}
                                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] uppercase tracking-wider rounded-lg active:scale-95 transition-all cursor-pointer"
                                  >
                                    Accepter
                                  </button>
                                  <button
                                    id={`app-reject-${app.id}`}
                                    onClick={() => updateApplicationStatus(app.id, 'refusee')}
                                    className="flex-1 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[10px] uppercase tracking-wider rounded-lg active:scale-95 transition-all cursor-pointer"
                                  >
                                    Refuser
                                  </button>
                                </>
                              )}
                              <button
                                id={`app-contact-${app.id}`}
                                onClick={async () => {
                                  try {
                                    const convId = await createConversation(app.clientId, est.id, app.clientName, est.name, currentUser!.id);
                                    if (onStartChatWithConv) {
                                      onStartChatWithConv(convId);
                                    } else if (onNavigate) {
                                      onNavigate('messages');
                                    }
                                  } catch (err) {
                                    console.error("Error creating convo with candidate:", err);
                                  }
                                }}
                                className="flex-1 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold text-[10px] uppercase tracking-wider rounded-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                Contacter
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {myEsts.length === 0 && (
            <div className="text-center p-8 bg-gray-50 rounded-2xl border border-gray-100">
              <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Vous n'avez pas encore d'établissement.</p>
            </div>
          )}
        </div>
        
        {/* Pub Modal */}
      {pubModalEstId && pubModalType && (
        <div className="fixed inset-0 z-50 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-900">
                Publier : {getPubTypeLabel(pubModalType)}
              </h2>
              <button onClick={closePubModal} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handlePubSubmit} className="p-5 overflow-y-auto flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Titre de la publication</label>
                <input type="text" required value={pubTitle} onChange={e => setPubTitle(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium" placeholder="Ex: Soirée spéciale, Recrutement Serveur..." />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Description détaillée</label>
                <RichTextEditor value={pubDesc} onChange={setPubDesc} placeholder="Donnez tous les détails utiles (menu, artistes, conditions...)" />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 ml-1">Image de la publication (optionnel)</label>
                {pubImage ? (
                  <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200">
                    <img src={pubImage} alt="Preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setPubImage('')} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full hover:bg-white text-gray-700 shadow-sm">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-orange-500 hover:bg-orange-50/50 transition-colors bg-gray-50">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      {isUploadingImage ? (
                         <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                      ) : (
                         <>
                           <ImageIcon className="w-6 h-6 text-gray-400 mb-2" />
                           <p className="text-xs font-medium text-gray-500">Cliquez pour ajouter une image</p>
                         </>
                      )}
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} />
                  </label>
                )}
              </div>

              {pubModalType === 'recrutement' && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Numéro WhatsApp de contact (optionnel)</label>
                    <input type="tel" placeholder="Ex: +22670000000" value={pubWhatsApp} onChange={e => setPubWhatsApp(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium text-sm" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">E-mail pour postuler (optionnel)</label>
                    <input type="email" placeholder="Ex: rh@etablissement.com" value={pubApplyEmail} onChange={e => setPubApplyEmail(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium text-sm" />
                  </div>
                </div>
              )}

              {(pubModalType === 'promo' || pubModalType === 'evenement') && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Date de début</label>
                    <input type="date" value={pubStartDate} onChange={e => setPubStartDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">Date de fin</label>
                    <input type="date" value={pubEndDate} onChange={e => setPubEndDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 focus:bg-white focus:border-orange-500 outline-none font-medium" />
                  </div>
                </div>
              )}

              {pubError && (
                <div className="p-3 bg-red-50 text-red-600 text-sm font-medium rounded-xl border border-red-100">
                  {pubError}
                </div>
              )}

              <button type="submit" disabled={isSubmittingPub || isUploadingImage} className="w-full mt-2 py-4 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isSubmittingPub && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>}
                Publier
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Restaurant Reservation Modal */}
      {showResModal && resActiveEstId && (
        <ReservationsDashboard
          establishmentId={resActiveEstId}
          onClose={() => {
            setShowResModal(false);
            setResActiveEstId(null);
          }}
        />
      )}

      {/* Restaurant Menu Modal */}
      {showMenuModal && menuActiveEstId && (
        <MenuDuJourForm
          establishmentId={menuActiveEstId}
          onClose={() => {
            setShowMenuModal(false);
            setMenuActiveEstId(null);
          }}
        />
      )}
    </div>
  );
}
