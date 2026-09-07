import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Establishment, CATEGORIES_LIST, Category } from '../types';
import { Plus, Edit2, Trash2, Store, Calendar, ShoppingBag, LogOut, Star, MessageSquare, TrendingUp, Sparkles, Download, Image as ImageIcon } from 'lucide-react';
import { ZakaAdsManager } from '../components/ads/ZakaAdsManager';

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
  const [selectedReviewEstId, setSelectedReviewEstId] = useState<string>('all');
  const [activeSubTab, setActiveSubTab] = useState<'establishments' | 'accounting' | 'stats' | 'reservations' | 'gallery'>('establishments');
  const [showBoostModal, setShowBoostModal] = useState(false);
  const [selectedEstForBoost, setSelectedEstForBoost] = useState<Establishment | null>(null);

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

  // Manager Establishments
  const myEstablishments = establishments.filter(e => e.ownerId === currentUser?.id || currentUser?.role === 'admin' || !e.ownerId);
  const myEstablishmentIds = myEstablishments.map(e => e.id);

  // Publications count for my establishments
  const myPublications = publications.filter(p => myEstablishmentIds.includes(p.establishmentId) || p.advertiserId === currentUser?.id);
  
  // Reviews for Manager Establishments
  const managerReviews = reviews.filter(r => 
    selectedReviewEstId === 'all' 
      ? myEstablishmentIds.includes(r.establishmentId) || myEstablishmentIds.length === 0
      : r.establishmentId === selectedReviewEstId
  );

  const averageRating = managerReviews.length > 0 
    ? (managerReviews.reduce((sum, r) => sum + r.rating, 0) / managerReviews.length).toFixed(1)
    : '0.0';

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

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
        <div>
          <span className="text-xs font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider block mb-1">
            Espace Gérant
          </span>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">
            Bienvenue, {currentUser?.name || 'Urbain TRAORE'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Gérez vos établissements, boostez vos ventes et suivez vos performances en temps réel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert("Exportation du rapport de gestion en cours...")}
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

      {/* KPI Cards (3 items as in screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl flex items-center justify-between shadow-xs">
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">{myEstablishments.length}</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Établissements</div>
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
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl flex items-center justify-between shadow-xs">
          <div>
            <div className="text-2xl font-black text-gray-900 dark:text-white">0</div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Messages</div>
          </div>
          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center font-black">
            <MessageSquare size={22} />
          </div>
        </div>
      </div>

      {/* Zaka Ads Express Banner */}
      <div className="bg-linear-to-r from-orange-500/10 via-amber-500/10 to-orange-600/5 dark:from-orange-950/30 dark:to-amber-950/20 border border-orange-200/60 dark:border-orange-900/40 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black bg-orange-600 text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Zaka Ads Express • En 2 minutes
            </span>
          </div>
          <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="text-orange-600" size={20} />
            <span>Boostez votre établissement</span>
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 max-w-xl font-medium">
            Vous voulez attirer plus de clients ce week-end ? Une photo + quelques mots = ZAKA AI crée et diffuse votre publicité auprès de milliers de clients.
          </p>
        </div>
        <button
          onClick={() => {
            if (myEstablishments.length > 0) {
              setSelectedEstForBoost(myEstablishments[0]);
              setShowBoostModal(true);
            } else {
              setShowAddModal(true);
            }
          }}
          className="px-5 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-2xl flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer shadow-lg shadow-orange-600/20 whitespace-nowrap"
        >
          <Sparkles size={16} />
          <span>Booster mon établissement</span>
        </button>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActiveSubTab('establishments')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'establishments'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
          }`}
        >
          <Store size={15} />
          <span>Établissements</span>
        </button>

        <button
          onClick={() => setActiveSubTab('accounting')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'accounting'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
          }`}
        >
          <span>📊 Comptabilité Simplifiée</span>
        </button>

        <button
          onClick={() => setActiveSubTab('stats')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'stats'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
          }`}
        >
          <span>⚡ Fréquentation & Stats</span>
        </button>

        <button
          onClick={() => setActiveSubTab('reservations')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'reservations'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
          }`}
        >
          <span>📅 Réservations</span>
        </button>

        <button
          onClick={() => setActiveSubTab('gallery')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
            activeSubTab === 'gallery'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800'
          }`}
        >
          <span>🖼️ Galeries Photos</span>
        </button>
      </div>

      {/* Main Content Based on Active Sub Tab */}
      {activeSubTab === 'establishments' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Store size={18} className="text-orange-600" />
              <span>Mes Établissements</span>
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
              <span>Ajouter</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {myEstablishments.map(est => {
              const estReviews = reviews.filter(r => r.establishmentId === est.id);
              const estRating = estReviews.length > 0 ? (estReviews.reduce((s, r) => s + r.rating, 0) / estReviews.length).toFixed(1) : null;
              const estReservationsCount = reservations.filter(r => r.establishmentId === est.id).length;

              return (
                <div key={est.id} className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 p-5 space-y-4 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600 dark:text-orange-400 font-black overflow-hidden flex-shrink-0">
                        {est.photoUrl || est.photos?.[0] ? (
                          <img src={est.photoUrl || est.photos?.[0]} alt={est.name} className="w-full h-full object-cover" />
                        ) : (
                          <Store size={28} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base font-black text-gray-900 dark:text-white">{est.name}</h4>
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-md uppercase tracking-wider">
                            Validé
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mt-0.5">
                          {est.category} • {est.neighborhood || 'Quartier'}, {est.city || 'Ouagadougou'} {est.country ? `(${est.country})` : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedEstForBoost(est);
                          setShowBoostModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Sparkles size={14} />
                        <span>Booster</span>
                      </button>
                      <button
                        onClick={() => startEdit(est)}
                        className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Edit2 size={14} />
                        <span>Modifier</span>
                      </button>
                      <button
                        onClick={() => deleteEstablishment(est.id)}
                        className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        <span>Supprimer</span>
                      </button>
                    </div>
                  </div>

                  {/* 4 Cards / Pills inside establishment */}
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
                          {estRating ? `${estRating} (${estReviews.length})` : 'Aucun avis'}
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
                          Ouvertes ({estReservationsCount})
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
                          {est.photos?.length || 0} photo{(est.photos?.length || 0) > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Action Banners inside establishment */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      onClick={() => setActiveSubTab('stats')}
                      className="p-3 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-colors cursor-pointer border border-orange-200/60 dark:border-orange-900/40"
                    >
                      <span>⚡ FRÉQUENTATION & STATISTIQUES</span>
                    </button>
                    <button
                      onClick={() => setActiveSubTab('gallery')}
                      className="p-3 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-2xl text-xs font-black flex items-center justify-center gap-2 transition-colors cursor-pointer border border-purple-200/60 dark:border-purple-900/40"
                    >
                      <span>🖼️ GALERIE PHOTOS & AMBIANCE {est.photos?.length || 0}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSubTab === 'accounting' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 space-y-4">
          <h3 className="text-base font-black text-gray-900 dark:text-white">📊 Comptabilité Simplifiée & Recettes</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Suivi des encaissements, ventes POS et rapports financiers de vos établissements.</p>
          <div className="p-6 bg-gray-50 dark:bg-gray-950 rounded-2xl text-center border border-dashed border-gray-200 dark:border-gray-800">
            <ShoppingBag size={32} className="mx-auto text-gray-400 mb-2" />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Aucune transaction enregistrée pour ce mois.</p>
          </div>
        </div>
      )}

      {activeSubTab === 'stats' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 space-y-4">
          <h3 className="text-base font-black text-gray-900 dark:text-white">⚡ Fréquentation & Statistiques en direct</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Analyse du taux d'affluence, pics horaires et profils des visiteurs.</p>
          <div className="p-6 bg-gray-50 dark:bg-gray-950 rounded-2xl text-center border border-dashed border-gray-200 dark:border-gray-800">
            <TrendingUp size={32} className="mx-auto text-orange-500 mb-2" />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Données de fréquentation en cours de collecte (Affluence Normale).</p>
          </div>
        </div>
      )}

      {activeSubTab === 'reservations' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 space-y-4">
          <h3 className="text-base font-black text-gray-900 dark:text-white">📅 Gestion des Réservations</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Validez ou refusez les demandes de réservation de tables pour vos clients.</p>
          {reservations.length === 0 ? (
            <div className="p-6 bg-gray-50 dark:bg-gray-950 rounded-2xl text-center border border-dashed border-gray-200 dark:border-gray-800">
              <Calendar size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Aucune réservation active pour le moment.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map(res => (
                <div key={res.id} className="p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">{res.clientName || res.userName || 'Client'} ({res.guestsCount || 1} personnes)</p>
                    <p className="text-[11px] text-gray-500">{res.date} à {res.time}</p>
                  </div>
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-black rounded-lg">En attente</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'gallery' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 space-y-4">
          <h3 className="text-base font-black text-gray-900 dark:text-white">🖼️ Galeries Photos & Ambiance</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Ajoutez des photos de vos plats, boissons et de l'ambiance de votre établissement.</p>
          <div className="p-6 bg-gray-50 dark:bg-gray-950 rounded-2xl text-center border border-dashed border-gray-200 dark:border-gray-800">
            <ImageIcon size={32} className="mx-auto text-purple-500 mb-2" />
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Aucune photo supplémentaire dans la galerie.</p>
            <button 
              onClick={() => {
                if (myEstablishments.length > 0) startEdit(myEstablishments[0]);
              }}
              className="mt-3 px-4 py-2 bg-orange-600 text-white font-bold text-xs rounded-xl cursor-pointer"
            >
              Ajouter une photo
            </button>
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
                  placeholder="Ex: WAGUESS"
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
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Image de couverture / description (URL ou fichier - optionnel)</label>
                <div className="flex gap-2 mt-1">
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/... (optionnel)"
                    value={photoUrl}
                    onChange={e => setPhotoUrl(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-medium outline-none focus:border-orange-500"
                  />
                  <label className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl text-xs font-bold cursor-pointer flex items-center gap-1.5 whitespace-nowrap">
                    📁 Choisir une photo
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
                  placeholder="Ex: KOURITENGA"
                  value={neighborhood}
                  onChange={e => setNeighborhood(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Horaires d'ouverture hebdomadaires</label>
                <input
                  type="text"
                  placeholder="Ex: Lun - Dim : 16h00 - 02h00"
                  value={openingHours}
                  onChange={e => setOpeningHours(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Tags (séparés par des virgules)</label>
                <input
                  type="text"
                  placeholder="Wifi, Terrasse, Live music..."
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Géolocalisation (Lien Maps - optionnel)</label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/..."
                  value={geolocation}
                  onChange={e => setGeolocation(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Lien PDF du Menu (optionnel)</label>
                <input
                  type="url"
                  placeholder="https://exemple.com/menu.pdf"
                  value={menuPdfUrl}
                  onChange={e => setMenuPdfUrl(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-2xl text-xs font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Photo de l'établissement (optionnel)</label>
                <div className="mt-1 flex items-center justify-between px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs">
                  <span className="text-gray-500 truncate max-w-[220px]">
                    {secondaryPhoto ? 'Photo sélectionnée' : 'Aucun fichier n\'a été sélectionné'}
                  </span>
                  <label className="px-3 py-1.5 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl cursor-pointer">
                    Choisir des fichiers
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
                              setSecondaryPhoto(uploadEvent.target.result as string);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }} 
                    />
                  </label>
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="submit"
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl cursor-pointer shadow-lg shadow-orange-600/20 transition-transform hover:scale-[1.01]"
                >
                  {editingEst ? 'Mettre à jour l\'établissement' : 'Créer l\'établissement'}
                </button>
              </div>
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
              <button onClick={() => setShowBoostModal(false)} className="text-gray-400 font-bold text-lg">✕</button>
            </div>
            <ZakaAdsManager />
          </div>
        </div>
      )}
    </div>
  );
}
