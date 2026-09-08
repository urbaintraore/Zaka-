import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Establishment, CATEGORIES_LIST, Category, Publication } from '../types';
import { 
  Plus, Edit2, Trash2, Store, Calendar, ShoppingBag, LogOut, Star, 
  MessageSquare, TrendingUp, Sparkles, Download, Image as ImageIcon, 
  Users, Clock, HelpCircle, CheckCircle, Megaphone, FileText, Package, Boxes, AlertTriangle, Bell
} from 'lucide-react';
import { GerantFAB } from '../components/GerantFAB';
import { ActivityLogComponent } from '../components/ActivityLog';
import { ZakaAdsManager } from '../components/ads/ZakaAdsManager';
import { PointOfSaleView } from '../components/PointOfSaleView';
import { StockManagerView } from '../components/StockManagerView';
import { AccountingView } from '../components/AccountingView';
import { StaffPermissionManager } from '../components/StaffPermissionManager';
import { AddExpenseForm } from '../components/AddExpenseForm';
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
    publications,
    activityLogs,
    notifications,
    relationshipRequests 
  } = useAppStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [creationStep, setCreationStep] = useState<'category' | 'details'>('category');
  const [editingEst, setEditingEst] = useState<Establishment | null>(null);
  
  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<
    'pos' | 'stocks' | 'accounting' | 'reviews' | 'rh'
  >('pos');

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
  const [showExpenseModal, setShowExpenseModal] = useState(false);
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
    
    if (!editingEst && creationStep === 'category') {
      setCreationStep('details');
      return;
    }

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
    setCreationStep('category');
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
          {/* Notification Badge */}
          <button className="p-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl relative">
            <Bell size={18} />
            {notifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
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
      <ActivityLogComponent logs={activityLogs.filter(log => log.establishmentId === activeEstablishment?.id)} />
      <GerantFAB onAction={(action) => {
        if (action === 'expense') setShowExpenseModal(true);
        else alert(`Action triggered: ${action}`);
      }} />

      {/* Expense Modal */}
      {showExpenseModal && activeEstablishment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-3xl w-full max-w-md">
            <AddExpenseForm establishmentId={activeEstablishment.id} onClose={() => setShowExpenseModal(false)} />
          </div>
        </div>
      )}

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
      <div className="flex flex-col gap-4">
        {/* Navigation - Grouped */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-2 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {[
              { id: 'pos', label: 'Caisse', icon: ShoppingBag },
              { id: 'stocks', label: 'Stocks', icon: Boxes },
              { id: 'accounting', label: 'Dépenses', icon: TrendingUp },
              { id: 'reviews', label: 'Avis', icon: Star },
              { id: 'rh', label: 'Personnel', icon: Users },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`px-4 py-3 rounded-2xl text-xs font-black flex flex-col items-center gap-2 transition-colors cursor-pointer ${
                  activeSubTab === tab.id
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-gray-50 dark:bg-gray-950 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                }`}
              >
                <tab.icon size={20} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Sub-tabs if needed could be added here */}
      </div>

      {/* Caisse Tab */}
      {activeSubTab === 'pos' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
          <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingBag size={18} className="text-orange-600" />
            <span>Point de Vente (POS)</span>
          </h3>
          {activeEstablishment ? (
            <PointOfSaleView establishmentId={activeEstablishment.id} cashierName={currentUser?.name || "Caissier(e)"} />
          ) : <p>Veuillez configurer votre établissement.</p>}
        </div>
      )}

      {/* Stocks Tab */}
      {activeSubTab === 'stocks' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
          <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Boxes size={18} className="text-orange-600" />
            <span>Gestion des Stocks</span>
          </h3>
          {activeEstablishment ? (
            <StockManagerView establishmentId={activeEstablishment.id} />
          ) : <p>Veuillez configurer votre établissement.</p>}
        </div>
      )}

      {/* Dépenses/Comptabilité Tab */}
      {activeSubTab === 'accounting' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
          <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={18} className="text-orange-600" />
            <span>Comptabilité & Dépenses</span>
          </h3>
          {activeEstablishment ? (
            <AccountingView establishmentId={activeEstablishment.id} />
          ) : <p>Veuillez configurer votre établissement.</p>}
        </div>
      )}

      {/* Avis Tab */}
      {activeSubTab === 'reviews' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
          <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Star size={18} className="text-orange-600" />
            <span>Avis Clients</span>
          </h3>
          {activeEstablishment ? (
            <AvisUtilisateurs establishmentId={activeEstablishment.id} />
          ) : <p>Veuillez configurer votre établissement.</p>}
        </div>
      )}

      {/* Personnel Tab */}
      {activeSubTab === 'rh' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
          <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={18} className="text-orange-600" />
            <span>Staff & Permissions</span>
          </h3>
          <StaffPermissionManager staffMembers={relationshipRequests.filter(r => r.status === 'accepted').map(r => ({ id: r.fromUserId, name: r.fromUserName }))} />
          {activeEstablishment ? (
            <TableauDeBordRH 
              establishmentId={activeEstablishment.id} 
              establishmentName={activeEstablishment.name} 
            />
          ) : <p>Veuillez configurer votre établissement.</p>}
        </div>
      )}

    </div>
  );
}
