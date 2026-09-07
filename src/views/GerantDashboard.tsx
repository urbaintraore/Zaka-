import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Establishment, CATEGORIES_LIST, Category, Publication } from '../types';
import { 
  Plus, Edit2, Trash2, Store, Calendar, ShoppingBag, LogOut, Star, 
  MessageSquare, TrendingUp, Sparkles, Download, Image as ImageIcon, 
  Users, Clock, HelpCircle, CheckCircle, Megaphone, FileText, Package, Boxes, AlertTriangle
} from 'lucide-react';
import { ZakaAdsManager } from '../components/ads/ZakaAdsManager';
import { PointOfSaleView } from '../components/PointOfSaleView';
import { StockManagerView } from '../components/StockManagerView';
import { AccountingView } from '../components/AccountingView';
import { ClientsAndRequests } from '../components/ClientsAndRequests';
import { TableauDeBordRH } from '../components/TableauDeBordRH';
import { AvisUtilisateurs } from '../components/AvisUtilisateurs';

export function GerantDashboard(props: {
  onLogout?: () => void;
  onNavigate?: (tab: any) => void;
  onStartChatWithConv?: (convId: string) => void;
  [key: string]: any;
}) {
  const { 
    currentUser,
    establishments, 
    addEstablishment, 
    updateEstablishment, 
    deleteEstablishment, 
    reservations, 
    takeawayOrders,
    reviews,
    publications 
  } = useAppStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEst, setEditingEst] = useState<Establishment | null>(null);
  
  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<
    'profil' | 'pos' | 'stocks' | 'accounting' | 'rh' | 'clients' | 'marketing' | 'reviews'
  >('profil');

  // Active establishment for management
  const activeEstablishment = establishments.find(
    e => e.ownerId === currentUser?.id || e.gerantId === currentUser?.id
  ) || establishments[0];

  const [showBoostModal, setShowBoostModal] = useState(false);
  const [selectedEstForBoost, setSelectedEstForBoost] = useState<Establishment | null>(null);

  // New Establishment Form States
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('maquis');
  const [description, setDescription] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('Ouagadougou');
  const [country, setCountry] = useState('Burkina Faso');
  const [photoUrl, setPhotoUrl] = useState('');
  const [openingHours, setOpeningHours] = useState('');
  const [tags, setTags] = useState('');
  const [geolocation, setGeolocation] = useState('');
  const [menuPdfUrl, setMenuPdfUrl] = useState('');
  const [secondaryPhoto, setSecondaryPhoto] = useState('');

  // Publications state
  const [localPublications, setLocalPublications] = useState<Publication[]>(() => {
    try {
      const saved = localStorage.getItem('zaka_gerant_publications');
      return saved ? JSON.parse(saved) : publications;
    } catch {
      return publications;
    }
  });

  // Publication Modal States
  const [showPubModal, setShowPubModal] = useState(false);
  const [pubTitle, setPubTitle] = useState('');
  const [pubType, setPubType] = useState<'promo' | 'evenement' | 'recrutement' | 'communique'>('promo');
  const [pubContent, setPubContent] = useState('');
  const [pubMediaUrl, setPubMediaUrl] = useState('');

  // FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const myPublications = activeEstablishment 
    ? localPublications.filter(p => p.establishmentId === activeEstablishment.id)
    : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const photosArray = secondaryPhoto ? [secondaryPhoto] : [];

    if (editingEst) {
      updateEstablishment(editingEst.id, {
        name,
        category,
        description,
        neighborhood,
        city,
        country,
        photoUrl: photoUrl || editingEst.photoUrl,
        openingHours,
        tags: tagsArray,
        geolocation,
        menuPdfUrl,
        photos: photosArray.length > 0 ? photosArray : editingEst.photos
      });
      setEditingEst(null);
    } else {
      addEstablishment({
        name,
        category,
        description,
        neighborhood,
        city,
        country,
        ownerId: currentUser?.id,
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800',
        openingHours,
        tags: tagsArray,
        geolocation,
        menuPdfUrl,
        photos: photosArray
      });
    }

    setName('');
    setDescription('');
    setNeighborhood('');
    setPhotoUrl('');
    setOpeningHours('');
    setTags('');
    setGeolocation('');
    setMenuPdfUrl('');
    setSecondaryPhoto('');
    setShowAddModal(false);
  };

  const startEdit = (est: Establishment) => {
    setEditingEst(est);
    setName(est.name);
    setCategory(est.category);
    setDescription(est.description || '');
    setNeighborhood(est.neighborhood || '');
    setCity(est.city || 'Ouagadougou');
    setCountry(est.country || 'Burkina Faso');
    setPhotoUrl(est.photoUrl || '');
    setOpeningHours(typeof est.openingHours === 'string' ? est.openingHours : '');
    setTags(est.tags ? est.tags.join(', ') : '');
    setGeolocation(est.geolocation || '');
    setMenuPdfUrl(est.menuPdfUrl || '');
    setSecondaryPhoto(est.photos?.[0] || '');
    setShowAddModal(true);
  };

  const handleCreatePublication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubTitle.trim() || !activeEstablishment) return;

    const newPub: Publication = {
      id: 'pub-' + Date.now(),
      establishmentId: activeEstablishment.id,
      establishmentName: activeEstablishment.name,
      title: pubTitle,
      type: pubType,
      description: pubContent,
      imageUrl: pubMediaUrl || activeEstablishment.photoUrl,
      status: 'published',
      createdAt: new Date().toISOString()
    };

    const updated = [newPub, ...localPublications];
    setLocalPublications(updated);
    try {
      localStorage.setItem('zaka_gerant_publications', JSON.stringify(updated));
    } catch {}

    setPubTitle('');
    setPubContent('');
    setPubMediaUrl('');
    setShowPubModal(false);
  };

  const handleDeletePublication = (id: string) => {
    const updated = localPublications.filter(p => p.id !== id);
    setLocalPublications(updated);
    try {
      localStorage.setItem('zaka_gerant_publications', JSON.stringify(updated));
    } catch {}
  };

  const faqList = [
    {
      q: "Comment enregistrer et suivre mes stocks de boissons et grillades ?",
      a: "Dans l'onglet 'Caisse & Stocks', vous pouvez enregistrer vos boissons en casier ou en unités (ex: 12 ou 24 bouteilles par casier). Le système calcule automatiquement le stock total en unités et déduit les ventes enregistrées au Point de Vente."
    },
    {
      q: "Comment imprimer un reçu ou un ticket de caisse ?",
      a: "Lors de la validation d'une vente dans le Point de Vente ('Caisse & Stocks'), un reçu officiel au format ticket de caisse est généré instantanément avec possibilité d'impression directe ou de téléchargement en image."
    },
    {
      q: "Comment publier une promo, un événement ou un recrutement ?",
      a: "Rendez-vous dans l'onglet 'Publications' de votre établissement. Vous pouvez créer des annonces de type Promo / Bon Plan, Évènement, Recrutement ou Communiqué instantanément visibles par tous les clients."
    },
    {
      q: "Comment gérer le pointage du personnel et exporter le rapport ?",
      a: "L'onglet 'Pointage & RH' vous permet de suivre les arrivées, retards et départs de votre équipe (serveurs, cuisiniers, DJ, caissiers) et d'exporter le rapport mensuel complet aux formats PDF et CSV."
    },
    {
      q: "Comment promouvoir un membre du staff ou répondre aux demandes d'adhésion ?",
      a: "Dans l'onglet 'Relation Client & Staff', vous pouvez accepter les demandes d'adhésion des clients, envoyer des invitations VIP, et promouvoir des rôles spécifiques (DJ, Serveur/Serveuse, Caissier)."
    }
  ];

  // Logic for low stock notification
  const { stocks } = useAppStore();
  const lowStockItems = activeEstablishment 
    ? stocks.filter(s => s.establishmentId === activeEstablishment.id && s.quantity <= (s.minQuantity || s.stock_faible || 5))
    : [];

  return (
    <div className="space-y-6 pb-20">
      {/* Low Stock Banner */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-800">Alerte Stock Faible !</h3>
            <p className="text-xs text-amber-700 mt-1">
              {lowStockItems.length} article(s) en dessous du seuil minimum pour {activeEstablishment?.name} :
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {lowStockItems.slice(0, 5).map(item => (
                <span key={item.id} className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md text-[10px] font-bold">
                  {item.name} ({item.quantity} restants)
                </span>
              ))}
              {lowStockItems.length > 5 && (
                <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md text-[10px] font-bold">
                  + {lowStockItems.length - 5} autres
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Header & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
        <div>
          <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider block mb-1">
            Espace Gérant & Établissements
          </span>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            Bienvenue, {currentUser?.name || 'Urbain TRAORE'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Gérez vos stocks, caisses, publications, staff et relations clients en toute simplicité.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeEstablishment && (
            <div className="px-3.5 py-2.5 bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-200 font-bold text-xs rounded-xl flex items-center gap-2">
              <Store size={16} />
              <span>{activeEstablishment.name}</span>
            </div>
          )}
          <button
            onClick={() => alert("Exportation globale du rapport de gestion en cours...")}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl cursor-pointer transition-colors"
            title="Exporter le rapport"
          >
            <Download size={18} />
          </button>
          {props.onLogout && (
            <button 
              onClick={props.onLogout} 
              className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl cursor-pointer transition-colors"
              title="Déconnexion"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl flex items-center justify-between shadow-xs">
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">1</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Établissement</div>
          </div>
          <div className="w-12 h-12 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 rounded-2xl flex items-center justify-center font-black">
            <Store size={22} />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl flex items-center justify-between shadow-xs">
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">{myPublications.length}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Publications</div>
          </div>
          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center font-black">
            <Megaphone size={22} />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl flex items-center justify-between shadow-xs">
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">
              {activeEstablishment ? reviews.filter(r => r.establishmentId === activeEstablishment.id).length : 0}
            </div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Avis Clients</div>
          </div>
          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center font-black">
            <Star size={22} className="fill-amber-400" />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl flex items-center justify-between shadow-xs">
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">Actif</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Statut Caisse</div>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center font-black">
            <ShoppingBag size={22} />
          </div>
        </div>
      </div>

      {/* Main Sub Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200 dark:border-gray-800">
        {[
          { id: 'profil', label: 'Profil de l\'établissement', icon: Store },
          { id: 'pos', label: 'Caisse (POS)', icon: ShoppingBag },
          { id: 'stocks', label: 'Gestion des Stocks', icon: Boxes },
          { id: 'accounting', label: 'Comptabilité & Bilan', icon: TrendingUp },
          { id: 'rh', label: 'Personnel & RH', icon: Clock },
          { id: 'clients', label: 'Clients & Commandes', icon: Users },
          { id: 'marketing', label: 'Marketing & Pubs', icon: Megaphone },
          { id: 'reviews', label: 'Avis Clients', icon: Star }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeSubTab === tab.id
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
            }`}
          >
            <tab.icon size={15} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 1. PROFIL TAB */}
      {activeSubTab === 'profil' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Store size={18} className="text-orange-600" />
              <span>Profil de l'Établissement</span>
            </h3>
            <button
              onClick={() => {
                setEditingEst(null);
                setName('');
                setDescription('');
                setNeighborhood('');
                setPhotoUrl('');
                setShowAddModal(true);
              }}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-orange-600/15"
            >
              <Plus size={16} />
              <span>Ajouter un établissement</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {activeEstablishment && (
              <div key={activeEstablishment.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600 dark:text-orange-400 font-black overflow-hidden flex-shrink-0">
                      {activeEstablishment.photoUrl || activeEstablishment.photos?.[0] ? (
                        <img src={activeEstablishment.photoUrl || activeEstablishment.photos?.[0]} alt={activeEstablishment.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store size={28} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-base font-black text-gray-900 dark:text-white">{activeEstablishment.name}</h4>
                        <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-md uppercase tracking-wider">
                          Validé
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-0.5">
                        {activeEstablishment.category} • {activeEstablishment.neighborhood || 'Quartier'}, {activeEstablishment.city || 'Ouagadougou'} {activeEstablishment.country ? `(${activeEstablishment.country})` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedEstForBoost(activeEstablishment);
                        setShowBoostModal(true);
                      }}
                      className="px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Sparkles size={14} />
                      <span>Booster</span>
                    </button>
                    <button
                      onClick={() => startEdit(activeEstablishment)}
                      className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Edit2 size={14} />
                      <span>Modifier</span>
                    </button>
                    <button
                      onClick={() => deleteEstablishment(activeEstablishment.id)}
                      className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 size={14} />
                      <span>Supprimer</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="p-3 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950 text-orange-600 flex items-center justify-center">
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Affluence</div>
                      <div className="text-xs font-black text-gray-800 dark:text-gray-200">Normale</div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center">
                      <Star size={16} className="fill-amber-400" />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Note Client</div>
                      <div className="text-xs font-black text-gray-800 dark:text-gray-200">
                        { (() => {
                          const estReviews = reviews.filter(r => r.establishmentId === activeEstablishment.id);
                          return estReviews.length > 0 ? `${(estReviews.reduce((s, r) => s + r.rating, 0) / estReviews.length).toFixed(1)} (${estReviews.length})` : 'Aucun avis';
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Réservations</div>
                      <div className="text-xs font-black text-gray-800 dark:text-gray-200">
                        Ouvertes ({reservations.filter(r => r.establishmentId === activeEstablishment.id).length})
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center">
                      <ImageIcon size={16} />
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-400 uppercase font-bold">Galerie</div>
                      <div className="text-xs font-black text-gray-800 dark:text-gray-200">
                        {activeEstablishment.photos?.length || 0} photo{(activeEstablishment.photos?.length || 0) > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. ESPACE CAISSE & STOCKS TAB */}
      {(activeSubTab === 'pos' || activeSubTab === 'stocks' || activeSubTab === 'accounting') && (
        <div className="space-y-8">
          {activeEstablishment ? (
            <div className="space-y-10">
              <div className="p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-900/50 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase">Établissement actif</span>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">{activeEstablishment.name}</h4>
                </div>
                <div className="text-xs text-gray-500">
                  {activeEstablishment.category} • {activeEstablishment.neighborhood || 'Quartier'}
                </div>
              </div>

              {activeSubTab === 'pos' && (
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
                  <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <ShoppingBag size={18} className="text-orange-600" />
                    <span>Point de Vente (POS) & Reçus</span>
                  </h3>
                  <PointOfSaleView establishmentId={activeEstablishment.id} cashierName={currentUser?.name || "Caissier(e)"} />
                </div>
              )}

              {activeSubTab === 'stocks' && (
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
                  <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Boxes size={18} className="text-orange-600" />
                    <span>Gestion des Stocks</span>
                  </h3>
                  <StockManagerView establishmentId={activeEstablishment.id} />
                </div>
              )}

              {activeSubTab === 'accounting' && (
                <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
                  <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp size={18} className="text-orange-600" />
                    <span>Comptabilité & Bilan</span>
                  </h3>
                  <AccountingView establishmentId={activeEstablishment.id} />
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800">
              <Store size={40} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Veuillez d'abord créer un établissement pour accéder à la caisse et aux stocks.</p>
            </div>
          )}
        </div>
      )}

      {/* 3. PUBLICATIONS TAB */}
      {activeSubTab === 'marketing' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Megaphone size={18} className="text-orange-600" />
                <span>Publications : Promo / Bon Plan, Évènement, Recrutement, Communiqué</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">Diffusez vos annonces pour Maquis, Bars, Restaurants, Hôtels, Boîtes et Salons de coiffure/beauté.</p>
            </div>
            {activeEstablishment && (
              <button
                onClick={() => setShowPubModal(true)}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-orange-600/15"
              >
                <Plus size={16} />
                <span>Nouvelle Publication</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {myPublications.length > 0 ? (
              myPublications.map(pub => (
                <div key={pub.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-black text-[10px] rounded-lg uppercase tracking-wider">
                      {pub.type || 'Promo'}
                    </span>
                    <button
                      onClick={() => handleDeletePublication(pub.id)}
                      className="text-gray-400 hover:text-red-600 font-bold text-xs cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  {pub.imageUrl && (
                    <div className="w-full h-36 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-950">
                      <img src={pub.imageUrl} alt={pub.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">{pub.title}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3">{pub.description}</p>
                </div>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800">
                <Megaphone size={36} className="mx-auto text-gray-400 mb-2" />
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400">Aucune publication active pour le moment. Cliquez sur "Nouvelle Publication" pour en créer une.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. RELATION CLIENT & STAFF TAB */}
      {activeSubTab === 'clients' && (
        <div className="space-y-6">
          {activeEstablishment ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Users size={18} className="text-orange-600" />
                <span>Relation Client & Staff : Messagerie, Invitations & Rôles (DJ, Serveur, Caissier)</span>
              </h3>
              <ClientsAndRequests 
                establishmentId={activeEstablishment.id} 
                onNavigate={props.onNavigate}
                onStartChatWithConv={props.onStartChatWithConv}
              />
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800">
              <Store size={40} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Veuillez d'abord sélectionner ou créer un établissement.</p>
            </div>
          )}
        </div>
      )}

      {/* 5. POINTAGE & RH TAB */}
      {activeSubTab === 'rh' && (
        <div className="space-y-6">
          {activeEstablishment ? (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Clock size={18} className="text-orange-600" />
                <span>Système de Pointage du Personnel & Export de Rapport (RH)</span>
              </h3>
              <TableauDeBordRH 
                establishmentId={activeEstablishment.id} 
                establishmentName={activeEstablishment.name} 
              />
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800">
              <Store size={40} className="mx-auto text-gray-400 mb-2" />
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Veuillez d'abord sélectionner ou créer un établissement.</p>
            </div>
          )}
        </div>
      )}

      {/* 6. AVIS & FAQ TAB */}
      {activeSubTab === 'reviews' && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Star size={18} className="text-amber-500 fill-amber-400" />
              <span>Visibilité des Avis Clients</span>
            </h3>
            {activeEstablishment ? (
              <AvisUtilisateurs establishmentId={activeEstablishment.id} />
            ) : (
              <p className="text-xs text-gray-500">Sélectionnez un établissement pour voir ses avis.</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <HelpCircle size={18} className="text-orange-600" />
              <span>Foire Aux Questions (FAQ Gérant & Établissements)</span>
            </h3>
            <div className="space-y-3">
              {faqList.map((item, idx) => (
                <div key={idx} className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-950">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full px-4 py-3.5 text-left font-bold text-xs text-gray-900 dark:text-white flex items-center justify-between cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <span className="text-orange-600 font-bold">{openFaqIndex === idx ? '−' : '+'}</span>
                  </button>
                  {openFaqIndex === idx && (
                    <div className="px-4 pb-4 text-xs text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-800 pt-3 leading-relaxed">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Establishment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-xl w-full space-y-5 border border-gray-200 dark:border-gray-800 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span>{editingEst ? 'Modifier l\'établissement' : 'Nouvel Établissement'}</span>
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Nom de l'établissement</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Le Verdun, VIP Club..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Type d'établissement</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as Category)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-medium outline-none focus:border-orange-500"
                >
                  {CATEGORIES_LIST.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Description de l'établissement (optionnel)</label>
                <textarea
                  rows={3}
                  placeholder="Décrivez brièvement votre établissement..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Image de couverture (URL ou fichier)</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={photoUrl}
                    onChange={e => setPhotoUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-medium outline-none focus:border-orange-500"
                  />
                  <label className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
                    📁 Choisir
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const reader = new FileReader();
                          reader.onload = (uploadEvent) => {
                            if (uploadEvent.target?.result) {
                              setPhotoUrl(uploadEvent.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Pays</label>
                  <input
                    type="text"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-medium outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Ville</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-medium outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Quartier</label>
                <input
                  type="text"
                  placeholder="Ex: KOURITENGA, Ouaga 2000"
                  value={neighborhood}
                  onChange={e => setNeighborhood(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="submit"
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl cursor-pointer shadow-lg shadow-orange-600/20"
                >
                  {editingEst ? 'Mettre à jour l\'établissement' : 'Créer l\'établissement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Publication Modal */}
      {showPubModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-lg w-full space-y-4 border border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Megaphone className="text-orange-600" size={18} />
                <span>Nouvelle Publication</span>
              </h3>
              <button onClick={() => setShowPubModal(false)} className="text-gray-400 font-bold text-lg cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleCreatePublication} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Type de publication</label>
                <select
                  value={pubType}
                  onChange={e => setPubType(e.target.value as any)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-medium outline-none"
                >
                  <option value="promo">Promo / Bon Plan</option>
                  <option value="evenement">Évènement</option>
                  <option value="recrutement">Recrutement</option>
                  <option value="communique">Communiqué</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Titre de l'annonce</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Soirée Live DJ ce samedi !"
                  value={pubTitle}
                  onChange={e => setPubTitle(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-medium outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Contenu / Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Détails de l'offre, de l'événement ou du poste..."
                  value={pubContent}
                  onChange={e => setPubContent(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-medium outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">URL de l'image (optionnel)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={pubMediaUrl}
                  onChange={e => setPubMediaUrl(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-medium outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl cursor-pointer shadow-lg shadow-orange-600/20"
              >
                Publier l'annonce
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Boost Modal */}
      {showBoostModal && selectedEstForBoost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-lg w-full space-y-4 border border-gray-200 dark:border-gray-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="text-orange-600" size={18} />
                <span>Booster {selectedEstForBoost.name}</span>
              </h3>
              <button onClick={() => setShowBoostModal(false)} className="text-gray-400 font-bold text-lg cursor-pointer">✕</button>
            </div>
            <ZakaAdsManager />
          </div>
        </div>
      )}
    </div>
  );
}
