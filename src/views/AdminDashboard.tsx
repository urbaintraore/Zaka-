import React, { useState } from 'react';
import { useAppStore } from '../store';
import { ZakaAdsAdmin } from '../components/ads/ZakaAdsAdmin';
import { 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Download, 
  Building2, 
  Search, 
  Edit2, 
  Trash2, 
  SlidersHorizontal, 
  X, 
  MapPin, 
  Phone, 
  Compass, 
  ShieldAlert, 
  Check, 
  Eye, 
  EyeOff,
  Sparkles
} from 'lucide-react';
import { useInstallApp } from '../hooks/useInstallApp';
import { Establishment, Category, CATEGORIES_LIST } from '../types';

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const { 
    establishments, 
    validateEstablishment, 
    entreprises, 
    validateEntreprise, 
    updateEstablishment, 
    deleteEstablishment,
    users 
  } = useAppStore();

  const { isInstallable, promptInstall } = useInstallApp();

  // Navigation and filtering states
  const [activeTab, setActiveTab] = useState<'validation' | 'establishments' | 'zaka_ads'>('validation');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [selectedStatus, setSelectedStatus] = useState<string>('Tous');

  // Editing and Deleting modal states
  const [editingEst, setEditingEst] = useState<Establishment | null>(null);
  const [deletingEst, setDeletingEst] = useState<Establishment | null>(null);

  // Form states for edit modal
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<Category>('maquis');
  const [formDescription, setFormDescription] = useState('');
  const [formCountry, setFormCountry] = useState('Burkina Faso');
  const [formCity, setFormCity] = useState('Ouagadougou');
  const [formNeighborhood, setFormNeighborhood] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formGeolocation, setFormGeolocation] = useState('');
  const [formOpeningHours, setFormOpeningHours] = useState('');
  const [formTags, setFormTags] = useState('');
  const [formPhotos, setFormPhotos] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState('');
  const [formStatus, setFormStatus] = useState<'en_attente' | 'valide' | 'suspendu'>('en_attente');

  const pendingEsts = establishments.filter(e => e.status === 'en_attente');
  const pendingEnts = (entreprises || []).filter(e => e.status === 'en_attente');

  // Filter establishments for the second tab
  const filteredEsts = establishments.filter(est => {
    const matchesSearch = 
      est.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (est.neighborhood || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (est.address || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (est.city || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'Tous' || est.category === selectedCategory;
    const matchesStatus = selectedStatus === 'Tous' || est.status === selectedStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Open the edit modal with establishment data
  const handleEditClick = (est: Establishment) => {
    setEditingEst(est);
    setFormName(est.name || '');
    setFormCategory(est.category || 'maquis');
    setFormDescription(est.description || '');
    setFormCountry(est.country || 'Burkina Faso');
    setFormCity(est.city || 'Ouagadougou');
    setFormNeighborhood(est.neighborhood || '');
    setFormAddress(est.address || '');
    setFormPhone(est.phone || '');
    setFormGeolocation(est.geolocation || '');
    setFormOpeningHours(est.openingHours || '');
    setFormTags(est.tags ? est.tags.join(', ') : '');
    setFormPhotos(est.photos || []);
    setFormStatus(est.status || 'valide');
    setPhotoInput('');
  };

  // Submit edits
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEst) return;

    const updatedData: Partial<Establishment> = {
      name: formName.trim(),
      category: formCategory,
      description: formDescription.trim(),
      country: formCountry.trim(),
      city: formCity.trim(),
      neighborhood: formNeighborhood.trim(),
      address: formAddress.trim(),
      phone: formPhone.trim(),
      geolocation: formGeolocation.trim(),
      openingHours: formOpeningHours.trim(),
      tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
      photos: formPhotos,
      status: formStatus
    };

    try {
      await updateEstablishment(editingEst.id, updatedData);
      setEditingEst(null);
    } catch (err) {
      console.error("Erreur lors de la mise à jour de l'établissement :", err);
    }
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!deletingEst) return;
    try {
      await deleteEstablishment(deletingEst.id);
      setDeletingEst(null);
    } catch (err) {
      console.error("Erreur lors de la suppression de l'établissement :", err);
    }
  };

  const addPhoto = () => {
    if (photoInput.trim() && !formPhotos.includes(photoInput.trim())) {
      setFormPhotos([...formPhotos, photoInput.trim()]);
      setPhotoInput('');
    }
  };

  const removePhoto = (index: number) => {
    setFormPhotos(formPhotos.filter((_, i) => i !== index));
  };

  const categoriesList = CATEGORIES_LIST;

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24 flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white">Administration</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">Gestion et modération de Zaka+</p>
        </div>
        <div className="flex items-center gap-2">
          {isInstallable && (
            <button onClick={promptInstall} className="p-2.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/40 bg-gray-50 dark:bg-gray-700 rounded-2xl transition-all cursor-pointer" title="Installer l'application">
              <Download className="w-5 h-5" />
            </button>
          )}
          <button onClick={onLogout} className="p-2.5 text-gray-400 hover:text-red-500 bg-gray-50 dark:bg-gray-700 rounded-2xl transition-all cursor-pointer" title="Déconnexion">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-gray-100 dark:bg-gray-800/60 p-1.5 rounded-2xl gap-1">
        <button 
          onClick={() => setActiveTab('validation')}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'validation' ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
        >
          <span>Demandes</span>
          {(pendingEsts.length + pendingEnts.length) > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {pendingEsts.length + pendingEnts.length}
            </span>
          )}
        </button>
        <button 
          onClick={() => setActiveTab('establishments')}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'establishments' ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
        >
          <span>Établissements ({establishments.length})</span>
        </button>
        <button 
          onClick={() => setActiveTab('zaka_ads')}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${activeTab === 'zaka_ads' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>ZAKA Ads</span>
        </button>
      </div>

      {/* Tab 3: ZAKA Ads Admin */}
      {activeTab === 'zaka_ads' && <ZakaAdsAdmin />}

      {/* Tab 1: Validation */}
      {activeTab === 'validation' && (
        <div className="flex flex-col gap-6">
          {/* Establishments */}
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span>Établissements en attente</span>
              <span className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {pendingEsts.length}
              </span>
            </h3>

            <div className="flex flex-col gap-3">
              {pendingEsts.map(est => {
                const owner = users.find(u => u.id === est.ownerId);
                return (
                  <div key={est.id} className="bg-white dark:bg-gray-800 rounded-3xl border border-orange-100 dark:border-orange-950 p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-gray-900 dark:text-white text-base">{est.name}</h4>
                          <span className="text-[10px] font-black uppercase bg-orange-50 dark:bg-orange-900/40 text-orange-600 px-2 py-0.5 rounded-lg">
                            {est.category.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{est.description || 'Aucune description fournie.'}</p>
                      </div>
                      
                      {owner && (
                        <div className="bg-gray-50 dark:bg-gray-900/60 p-2.5 rounded-2xl text-[11px] text-gray-600 dark:text-gray-400 shrink-0">
                          <span className="font-extrabold block text-gray-700 dark:text-gray-300 mb-0.5">👤 Gérant : {owner.name}</span>
                          <div>{owner.email || 'Pas de mail'} • {owner.phone || 'Pas de tel'}</div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 border-t border-gray-50 dark:border-gray-700/50 pt-2.5 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span>{est.address || 'Adresse non spécifiée'}, {est.neighborhood}, {est.city}</span>
                      </div>
                      {est.phone && (
                        <div className="flex items-center gap-1.5 ml-auto md:ml-0">
                          <Phone className="w-3.5 h-3.5 text-gray-400" />
                          <span>{est.phone}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 border-t border-gray-50 dark:border-gray-700/50 pt-3">
                      <button 
                        onClick={() => handleEditClick(est)}
                        className="flex-1 md:flex-none px-4 py-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Modifier avant
                      </button>
                      <button 
                        onClick={() => validateEstablishment(est.id)} 
                        className="flex-1 md:flex-none px-4 py-2 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/50 font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ml-auto"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Valider
                      </button>
                      <button 
                        onClick={() => {
                          if(confirm("Voulez-vous rejeter et supprimer cet établissement ?")) {
                            deleteEstablishment(est.id);
                          }
                        }}
                        className="flex-1 md:flex-none px-4 py-2 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Rejeter
                      </button>
                    </div>
                  </div>
                );
              })}
              {pendingEsts.length === 0 && (
                <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/40 rounded-3xl border border-gray-100 dark:border-gray-750 text-gray-400 font-bold text-xs uppercase tracking-wider">
                  Aucun établissement en attente
                </div>
              )}
            </div>
          </section>

          {/* Enterprises */}
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span>Marques en attente</span>
              <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {pendingEnts.length}
              </span>
            </h3>

            <div className="flex flex-col gap-3">
              {pendingEnts.map(ent => (
                <div key={ent.id} className="bg-white dark:bg-gray-800 rounded-3xl border border-amber-100 dark:border-amber-950/50 p-4 shadow-sm flex flex-col gap-3">
                  <div className="flex items-start gap-3.5">
                    {ent.logo ? (
                      <img src={ent.logo} alt={ent.name} className="w-12 h-12 rounded-2xl object-cover border border-gray-100 flex-shrink-0" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-950 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-amber-500" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-gray-900 dark:text-white text-base leading-tight">{ent.name}</h4>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 text-amber-700 dark:text-amber-400 rounded-lg uppercase">
                          {ent.sector}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{ent.description}</p>
                    </div>
                  </div>

                  {ent.philosophy && (
                    <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-950/40 rounded-2xl p-3 text-xs text-gray-700 dark:text-gray-300">
                      <span className="font-extrabold text-amber-800 dark:text-amber-400 block mb-1">💡 Vision de la marque</span>
                      <p className="italic">"{ent.philosophy}"</p>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 border-t border-gray-50 dark:border-gray-700 pt-3">
                    <button onClick={() => validateEntreprise(ent.id)} className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/50 font-bold rounded-xl text-xs transition-colors cursor-pointer">
                      <CheckCircle className="w-3.5 h-3.5" /> Activer la marque
                    </button>
                  </div>
                </div>
              ))}
              {pendingEnts.length === 0 && (
                <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/40 rounded-3xl border border-gray-100 dark:border-gray-750 text-gray-400 font-bold text-xs uppercase tracking-wider">
                  Aucune entreprise en attente
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* Tab 2: Manage Establishments */}
      {activeTab === 'establishments' && (
        <div className="flex flex-col gap-4">
          {/* Filters Bar */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Rechercher un établissement..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-orange-500 rounded-2xl text-xs text-gray-900 dark:text-white font-medium"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Catégorie</span>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="flex-1 py-1.5 px-2 bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-orange-500 rounded-xl text-xs text-gray-800 dark:text-gray-200 font-bold"
                >
                  <option value="Tous">Toutes les catégories</option>
                  {categoriesList.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 flex items-center gap-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider whitespace-nowrap">Statut</span>
                <select 
                  value={selectedStatus} 
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="flex-1 py-1.5 px-2 bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-orange-500 rounded-xl text-xs text-gray-800 dark:text-gray-200 font-bold"
                >
                  <option value="Tous">Tous les statuts</option>
                  <option value="valide">Valide / Actif</option>
                  <option value="en_attente">En attente</option>
                  <option value="suspendu">Suspendu / Inactif</option>
                </select>
              </div>
            </div>
          </div>

          {/* Establishments List */}
          <div className="flex flex-col gap-3">
            {filteredEsts.map(est => {
              const owner = users.find(u => u.id === est.ownerId);
              return (
                <div key={est.id} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700/60 p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {est.photos && est.photos.length > 0 ? (
                        <img src={est.photos[0]} alt={est.name} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 text-gray-400">
                          <MapPin className="w-6 h-6" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-gray-900 dark:text-white text-base">{est.name}</h4>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg ${
                            est.status === 'valide' ? 'bg-green-50 dark:bg-green-950/30 text-green-600' :
                            est.status === 'en_attente' ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-600' :
                            'bg-red-50 dark:bg-red-950/30 text-red-600'
                          }`}>
                            {est.status === 'valide' ? 'Actif' : est.status === 'en_attente' ? 'En attente' : 'Suspendu'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <span className="font-bold text-orange-600 uppercase text-[10px]">{est.category.replace('_', ' ')}</span>
                          <span>•</span>
                          <span>{est.neighborhood || 'Quartier non spécifié'}, {est.city}</span>
                        </div>
                      </div>
                    </div>

                    {owner && (
                      <div className="bg-gray-50 dark:bg-gray-900 p-2.5 rounded-2xl text-[11px] text-gray-600 dark:text-gray-400 self-start shrink-0">
                        <span className="font-extrabold block text-gray-700 dark:text-gray-300">👤 {owner.name}</span>
                        <div>{owner.email || 'Pas d\'email'} • {owner.phone || 'Pas de tel'}</div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 italic px-1">
                    "{est.description || 'Pas de description.'}"
                  </p>

                  <div className="flex items-center gap-2 border-t border-gray-50 dark:border-gray-700/50 pt-3">
                    {est.status !== 'valide' ? (
                      <button 
                        onClick={() => updateEstablishment(est.id, { status: 'valide' })}
                        className="px-3 py-1.5 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/50 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Activer
                      </button>
                    ) : (
                      <button 
                        onClick={() => updateEstablishment(est.id, { status: 'suspendu' })}
                        className="px-3 py-1.5 bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <EyeOff className="w-3.5 h-3.5" /> Suspendre
                      </button>
                    )}

                    <button 
                      onClick={() => handleEditClick(est)}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Modifier
                    </button>

                    <button 
                      onClick={() => setDeletingEst(est)}
                      className="ml-auto px-3 py-1.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 font-bold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredEsts.length === 0 && (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/40 rounded-3xl border border-gray-150 dark:border-gray-750 text-gray-400 font-bold text-xs uppercase tracking-wider">
                Aucun établissement trouvé
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: Edit Establishment */}
      {editingEst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-50 dark:border-gray-700 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Modifier l'Établissement</h3>
                <p className="text-xs text-gray-500">ID: {editingEst.id}</p>
              </div>
              <button 
                onClick={() => setEditingEst(null)}
                className="p-1.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-300" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleEditSubmit} className="p-5 overflow-y-auto flex flex-col gap-4 text-xs">
              {/* Name & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Nom de l'établissement</label>
                  <input 
                    type="text" 
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="p-2.5 bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-orange-500 rounded-xl text-gray-900 dark:text-white font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Catégorie</label>
                  <select 
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as Category)}
                    className="p-2.5 bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-orange-500 rounded-xl text-gray-900 dark:text-white font-bold"
                  >
                    {categoriesList.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Description</label>
                <textarea 
                  rows={3}
                  required
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="p-2.5 bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-orange-500 rounded-xl text-gray-900 dark:text-white font-medium"
                />
              </div>

              {/* Country, City & Neighborhood */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Pays</label>
                  <input 
                    type="text" 
                    required
                    value={formCountry}
                    onChange={(e) => setFormCountry(e.target.value)}
                    className="p-2.5 bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-orange-500 rounded-xl text-gray-900 dark:text-white font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Ville</label>
                  <input 
                    type="text" 
                    required
                    value={formCity}
                    onChange={(e) => setFormCity(e.target.value)}
                    className="p-2.5 bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-orange-500 rounded-xl text-gray-900 dark:text-white font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Quartier</label>
                  <input 
                    type="text" 
                    required
                    value={formNeighborhood}
                    onChange={(e) => setFormNeighborhood(e.target.value)}
                    className="p-2.5 bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-orange-500 rounded-xl text-gray-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* Address & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Adresse précise</label>
                  <input 
                    type="text" 
                    value={formAddress}
                    onChange={(e) => setFormAddress(e.target.value)}
                    className="p-2.5 bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-orange-500 rounded-xl text-gray-900 dark:text-white font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Téléphone de contact</label>
                  <input 
                    type="text" 
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="p-2.5 bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-orange-500 rounded-xl text-gray-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              {/* Geolocation & Hours */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1">
                    <span>Coordonnées géographiques</span>
                    <Compass className="w-3 h-3 text-gray-400" />
                  </label>
                  <input 
                    type="text" 
                    placeholder="ex: 12.3714,-1.5197"
                    value={formGeolocation}
                    onChange={(e) => setFormGeolocation(e.target.value)}
                    className="p-2.5 bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-orange-500 rounded-xl text-gray-900 dark:text-white font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Horaires d'ouverture</label>
                  <input 
                    type="text" 
                    placeholder="ex: Lun-Dim 16h-03h"
                    value={formOpeningHours}
                    onChange={(e) => setFormOpeningHours(e.target.value)}
                    className="p-2.5 bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-orange-500 rounded-xl text-gray-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              {/* Tags & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Tags / Ambiance (séparés par des virgules)</label>
                  <input 
                    type="text" 
                    placeholder="ex: Climatisation, Terrasse, DJ Live"
                    value={formTags}
                    onChange={(e) => setFormTags(e.target.value)}
                    className="p-2.5 bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-orange-500 rounded-xl text-gray-900 dark:text-white font-bold"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Statut d'approbation</label>
                  <select 
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="p-2.5 bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-orange-500 rounded-xl text-gray-900 dark:text-white font-bold"
                  >
                    <option value="en_attente">En attente</option>
                    <option value="valide">Valide / Actif</option>
                    <option value="suspendu">Suspendu / Inactif</option>
                  </select>
                </div>
              </div>

              {/* Photos management */}
              <div className="flex flex-col gap-2 border-t border-gray-50 dark:border-gray-700 pt-3">
                <label className="font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Photos (URLs)</label>
                <div className="flex gap-2">
                  <input 
                    type="url" 
                    placeholder="https://images.unsplash.com/..."
                    value={photoInput}
                    onChange={(e) => setPhotoInput(e.target.value)}
                    className="flex-1 p-2.5 bg-gray-50 dark:bg-gray-900 border-0 focus:ring-2 focus:ring-orange-500 rounded-xl text-gray-900 dark:text-white font-medium"
                  />
                  <button 
                    type="button" 
                    onClick={addPhoto}
                    className="px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl cursor-pointer"
                  >
                    Ajouter
                  </button>
                </div>

                {formPhotos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {formPhotos.map((url, idx) => (
                      <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                        <img src={url} alt="Establishment view" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <button 
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 p-1 rounded-full text-white cursor-pointer opacity-90 hover:opacity-100 transition-all"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-3 border-t border-gray-50 dark:border-gray-700 pt-4 mt-2 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setEditingEst(null)}
                  className="flex-1 py-3 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-650 text-gray-700 dark:text-gray-200 font-extrabold rounded-2xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl transition-colors cursor-pointer shadow-md"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Establishment Confirmation */}
      {deletingEst && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col gap-4">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center self-center">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="font-black text-gray-900 dark:text-white text-lg">Supprimer l'établissement</h3>
              <p className="text-xs text-gray-500 mt-2">
                Êtes-vous sûr de vouloir supprimer définitivement l'établissement <span className="font-extrabold text-gray-800 dark:text-gray-200">"{deletingEst.name}"</span> ?
              </p>
              <p className="text-[10px] text-red-500 dark:text-red-400 font-bold mt-1.5 bg-red-50 dark:bg-red-950/20 p-2 rounded-xl border border-red-100/30">
                ⚠️ Cette action est irréversible et supprimera toutes les données liées.
              </p>
            </div>

            <div className="flex gap-2.5 mt-2">
              <button 
                onClick={() => setDeletingEst(null)}
                className="flex-1 py-3 bg-gray-50 dark:bg-gray-750 hover:bg-gray-100 text-gray-700 dark:text-gray-200 font-extrabold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-2xl text-xs transition-colors cursor-pointer shadow-sm"
              >
                Oui, supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
