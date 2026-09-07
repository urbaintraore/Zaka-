import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Establishment, CATEGORIES_LIST, Category } from '../types';
import { Plus, Edit2, Trash2, Store, Calendar, ShoppingBag, LogOut, Star, MessageSquare, Filter } from 'lucide-react';

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
    reviews 
  } = useAppStore();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEst, setEditingEst] = useState<Establishment | null>(null);
  const [selectedReviewEstId, setSelectedReviewEstId] = useState<string>('all');

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('maquis');
  const [description, setDescription] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('Ouagadougou');
  const [country, setCountry] = useState('Burkina Faso');
  const [photoUrl, setPhotoUrl] = useState('');

  // Manager Establishments
  const myEstablishments = establishments.filter(e => e.ownerId === currentUser?.id || currentUser?.role === 'admin' || !e.ownerId);

  // Reviews for Manager Establishments
  const myEstablishmentIds = myEstablishments.map(e => e.id);
  const managerReviews = reviews.filter(r => 
    selectedReviewEstId === 'all' 
      ? myEstablishmentIds.includes(r.establishmentId) || myEstablishmentIds.length === 0
      : r.establishmentId === selectedReviewEstId
  );

  const averageRating = managerReviews.length > 0 
    ? (managerReviews.reduce((sum, r) => sum + r.rating, 0) / managerReviews.length).toFixed(1)
    : '5.0';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingEst) {
      updateEstablishment(editingEst.id, {
        name,
        category,
        description,
        neighborhood,
        city,
        country,
        photoUrl: photoUrl || editingEst.photoUrl
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
        photoUrl: photoUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800'
      });
    }

    setName('');
    setDescription('');
    setNeighborhood('');
    setPhotoUrl('');
    setShowAddModal(false);
  };

  const startEdit = (est: Establishment) => {
    setEditingEst(est);
    setName(est.name);
    setCategory(est.category);
    setDescription(est.description);
    setNeighborhood(est.neighborhood);
    setCity(est.city);
    setCountry(est.country);
    setPhotoUrl(est.photoUrl || '');
    setShowAddModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Tableau de bord Gérant</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Gérez vos établissements, réservations, avis clients et commandes</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setEditingEst(null);
              setName('');
              setDescription('');
              setNeighborhood('');
              setPhotoUrl('');
              setShowAddModal(true);
            }}
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors cursor-pointer shadow-md shadow-orange-600/15"
          >
            <Plus size={16} />
            <span>Ajouter un établissement</span>
          </button>
          {props.onLogout && (
            <button onClick={props.onLogout} className="p-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl cursor-pointer">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-orange-600 text-white rounded-xl">
            <Store size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-gray-900 dark:text-white">{myEstablishments.length}</div>
            <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Établissements</div>
          </div>
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-blue-600 text-white rounded-xl">
            <Calendar size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-gray-900 dark:text-white">{reservations.length}</div>
            <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Réservations</div>
          </div>
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-amber-500 text-white rounded-xl">
            <Star size={20} className="fill-white" />
          </div>
          <div>
            <div className="text-xl font-black text-gray-900 dark:text-white">{averageRating} / 5</div>
            <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">{managerReviews.length} Avis clients</div>
          </div>
        </div>

        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-emerald-600 text-white rounded-xl">
            <ShoppingBag size={20} />
          </div>
          <div>
            <div className="text-xl font-black text-gray-900 dark:text-white">{takeawayOrders.length}</div>
            <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Commandes POS</div>
          </div>
        </div>
      </div>

      {/* Establishments List */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Store size={18} className="text-orange-600" />
          <span>Vos établissements</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myEstablishments.map(est => {
            const estReviewsCount = reviews.filter(r => r.establishmentId === est.id).length;
            return (
              <div key={est.id} className="p-4 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-2xl flex gap-4 items-center shadow-2xs">
                <img src={est.photoUrl} alt={est.name} className="w-20 h-20 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">{est.name}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{est.neighborhood}, {est.city}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="inline-block px-2 py-0.5 bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 text-[10px] font-extrabold rounded-md uppercase">
                      {est.category}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      {est.rating || '5.0'} ({estReviewsCount} avis)
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(est)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-orange-600 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => deleteEstablishment(est.id)}
                    className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DEDICATED MANAGER REVIEWS SECTION */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare size={18} className="text-amber-500" />
              <span>Avis & Commentaires Clients</span>
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Consultez les notes et retours laissés par les visiteurs sur vos lieux.
            </p>
          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-950 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-800">
            <Filter size={14} className="text-gray-400" />
            <select
              value={selectedReviewEstId}
              onChange={e => setSelectedReviewEstId(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
            >
              <option value="all">Tous mes établissements</option>
              {myEstablishments.map(est => (
                <option key={est.id} value={est.id}>{est.name}</option>
              ))}
            </select>
          </div>
        </div>

        {managerReviews.length === 0 ? (
          <div className="py-8 text-center bg-gray-50 dark:bg-gray-950 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
            <MessageSquare size={32} className="mx-auto text-gray-300 dark:text-gray-700 mb-2" />
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Aucun avis enregistré pour cet établissement.</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Encouragez vos clients à laisser leur avis via l'application Zaka.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {managerReviews.map(review => {
              const est = establishments.find(e => e.id === review.establishmentId);
              return (
                <div key={review.id} className="p-4 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800/80 rounded-2xl flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-bold text-xs flex items-center justify-center">
                          {review.userName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white">{review.userName}</p>
                          <p className="text-[10px] text-gray-400">{new Date(review.createdAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 bg-amber-50 dark:bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-900/40">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span className="text-xs font-black text-amber-700 dark:text-amber-400">{review.rating}.0</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-700 dark:text-gray-300 font-medium italic bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-100 dark:border-gray-800">
                      "{review.comment}"
                    </p>
                  </div>

                  {est && (
                    <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 flex items-center justify-between border-t border-gray-100 dark:border-gray-800/60 pt-2">
                      <span>Lieu : <strong className="text-gray-900 dark:text-white">{est.name}</strong></span>
                      <span className="text-orange-600 dark:text-orange-400 font-extrabold">{est.neighborhood}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full space-y-4 border border-gray-200 dark:border-gray-800">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {editingEst ? 'Modifier l\'établissement' : 'Créer un établissement'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500">Nom</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl text-xs font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Catégorie</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as Category)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl text-xs font-medium outline-none focus:border-orange-500"
                >
                  {CATEGORIES_LIST.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl text-xs font-medium outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-500">Quartier</label>
                  <input
                    type="text"
                    value={neighborhood}
                    onChange={e => setNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl text-xs font-medium outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500">Ville</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl text-xs font-medium outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
