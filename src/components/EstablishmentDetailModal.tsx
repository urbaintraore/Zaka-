import React, { useState } from 'react';
import { X, Calendar, Clock, Share2, Compass, FileText, MapPin, Save, Disc, Video, Users, ShoppingBag } from 'lucide-react';
import { Establishment, getCategoryLabel } from '../types';
import { ReservationModal } from './ReservationModal';
import { TakeawayOrderModal } from './TakeawayOrderModal';
import { AvisUtilisateurs } from './AvisUtilisateurs';
import { ReservationsDashboard } from './ReservationsDashboard';
import { LiveDAmbiance } from './LiveDAmbiance';
import { AffluenceTracker } from './AffluenceTracker';
import { PlaylistDJ } from './PlaylistDJ';
import { CashierDashboard } from './CashierDashboard';
import { CaissierView } from './CaissierView';
import { TableauDeBordRH } from './TableauDeBordRH';
import { AdPlacementBanner } from './AdPlacementBanner';
import { CrowdStatusBadge } from './CrowdStatusBadge';
import { LoyaltyAndPointsModule } from './LoyaltyAndPointsModule';
import { EstablishmentPhotoGallery } from './EstablishmentPhotoGallery';
import { EstablishmentPhotoGalleryManager } from './EstablishmentPhotoGalleryManager';
import { useAppStore } from '../store';
import { shareContent } from '../utils/platform';

interface EstablishmentDetailModalProps {
  establishment: Establishment;
  onClose: () => void;
}

export function EstablishmentDetailModal({ establishment, onClose }: EstablishmentDetailModalProps) {
  const { 
    createServiceRequest, 
    addReservation, 
    menusDuJour, 
    currentUser, 
    updateEstablishment, 
    trackEstablishmentView, 
    addCarnetEntry, 
    carnetEntrees,
    relationshipRequests,
    users,
    staffReviews,
    createStaffReview
  } = useAppStore();
  const [showReservation, setShowReservation] = useState(false);
  const [showTakeaway, setShowTakeaway] = useState(false);
  const [showReservationsDashboard, setShowReservationsDashboard] = useState(false);
  const [isEditingGeo, setIsEditingGeo] = useState(false);
  const [geoInput, setGeoInput] = useState(establishment.geolocation || '');
  const [isSavingGeo, setIsSavingGeo] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'galerie' | 'live' | 'affluence' | 'dj' | 'equipe' | 'rh' | 'stocks_ventes'>('info');
  const [showGalleryManager, setShowGalleryManager] = useState(false);
  const [justVisited, setJustVisited] = useState(false);
  const [ratingStaffId, setRatingStaffId] = useState<string | null>(null);
  const [staffRatingVal, setStaffRatingVal] = useState(5);
  const [staffComment, setStaffComment] = useState('');
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  const isOwner = currentUser && establishment.ownerId === currentUser.id;
  
  const isCaissier = currentUser && relationshipRequests.some(r => 
    r.establishmentId === establishment.id && 
    (r.initiatorId === currentUser.id || r.targetId === currentUser.id) &&
    r.status === 'acceptee' &&
    (r.isCaissier === true || r.requestedRole === 'caissier')
  );

  const visitCount = carnetEntrees 
    ? carnetEntrees.filter(e => e.establishmentId === establishment.id && e.type === 'visite').length
    : 0;

  const handleBeenHereClick = async () => {
    if (!currentUser) return;
    try {
      await addCarnetEntry({
        clientId: currentUser.id,
        establishmentId: establishment.id,
        type: 'visite',
        date: new Date().toISOString()
      });
      setJustVisited(true);
      setTimeout(() => setJustVisited(false), 3000);
    } catch (err) {
      console.error("Erreur ajout visite carnet:", err);
    }
  };

  React.useEffect(() => {
    trackEstablishmentView(establishment.id);
  }, [establishment.id, trackEstablishmentView]);

  const handleSaveGeo = async () => {
    try {
      setIsSavingGeo(true);
      await updateEstablishment(establishment.id, { geolocation: geoInput.trim() });
      setIsEditingGeo(false);
    } catch (err) {
      console.error("Erreur lors de la sauvegarde de la géolocalisation:", err);
    } finally {
      setIsSavingGeo(false);
    }
  };

  const handleShare = async () => {
    await shareContent({
      title: establishment.name,
      text: establishment.description || `Découvrez ${establishment.name} sur Zaka+`,
      url: window.location.href
    });
  };

  const handleReservationSubmit = (data: { reservationType: string, date: string, time: string, guests: number, details: string }) => {
    if (!currentUser) return;
    
    if (establishment.category === 'restaurant') {
      addReservation({
        establishmentId: establishment.id,
        establishmentName: establishment.name,
        clientId: currentUser.id,
        clientName: currentUser.name,
        clientPhone: currentUser.phone || '',
        date: data.date,
        time: data.time,
        guestsCount: data.guests,
        note: data.details
      });
    } else {
      const isAnniv = data.reservationType === 'anniversaire';
      createServiceRequest({
        clientId: currentUser.id,
        establishmentId: establishment.id,
        type: isAnniv ? 'anniversaire' : 'reservation',
        details: `Date: ${data.date} à ${data.time} | Places: ${data.guests} | Type: ${data.reservationType}${data.details ? ` | Note: ${data.details}` : ''}`
      });
    }
    setShowReservation(false);
  };

  const mapsUrl = establishment.geolocation 
    ? (establishment.geolocation.startsWith('http') ? establishment.geolocation : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(establishment.geolocation)}`) 
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(establishment.name + ' ' + (establishment.neighborhood || ''))}`;

  const latestMenu = menusDuJour
    ? menusDuJour
        .filter(m => m.establishmentId === establishment.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

  if (showReservationsDashboard) {
    return (
      <ReservationsDashboard
        establishmentId={establishment.id}
        onClose={() => setShowReservationsDashboard(false)}
      />
    );
  }

  if (showTakeaway) {
    return (
      <TakeawayOrderModal
        establishment={establishment}
        menuDuJour={latestMenu}
        onClose={() => setShowTakeaway(false)}
      />
    );
  }

  if (showReservation) {
    return (
      <ReservationModal 
        establishmentName={establishment.name} 
        isClosed={establishment.reservationsClosed}
        closedReason={establishment.reservationsClosedReason}
        establishmentPhone={establishment.phone}
        onClose={() => setShowReservation(false)} 
        onSubmit={handleReservationSubmit} 
      />
    );
  }

  const allPhotos = establishment.photos.length > 0 
    ? establishment.photos 
    : ['https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800'];

  const getMenuAgeText = (menuDateStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (menuDateStr === todayStr) {
      return "Menu d'aujourd'hui";
    }
    
    const menuDate = new Date(menuDateStr);
    menuDate.setHours(0, 0, 0, 0);
    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    
    const diffTime = Math.abs(todayDate.getTime() - menuDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return "Dernier menu publié hier";
    }
    return `Dernier menu publié il y a ${diffDays} jours`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="relative h-64 bg-gray-200 flex-shrink-0">
          <img 
            src={allPhotos[activePhoto]} 
            alt={establishment.name} 
            className="w-full h-full object-cover" 
          />
          <button 
            onClick={handleShare} 
            className="absolute top-4 right-16 p-2 bg-black/40 hover:bg-black/60 text-white backdrop-blur-md rounded-full transition-colors z-10"
            title="Partager"
          >
            <Share2 className="w-5 h-5" />
          </button>
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white backdrop-blur-md rounded-full transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {allPhotos.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {allPhotos.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActivePhoto(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${activePhoto === idx ? 'bg-white w-4' : 'bg-white/50'}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                {getCategoryLabel(establishment.category)}
              </span>
              <CrowdStatusBadge establishment={establishment} showControlForOwner={true} />
            </div>
            <h2 className="text-2xl font-black text-gray-900 leading-tight mb-2">{establishment.name}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
              <span className="text-yellow-500 text-lg">★</span>
              <span>{establishment.averageRating.toFixed(1)} avis</span>
              <span className="text-gray-300">•</span>
              <span>{establishment.neighborhood}</span>
            </div>

            {/* Loyalty and Points Module */}
            <LoyaltyAndPointsModule establishment={establishment} />

            {currentUser && currentUser.role === 'client' && (
              <button
                type="button"
                onClick={handleBeenHereClick}
                className={`mt-4 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-black uppercase transition-all duration-300 border-2 ${
                  justVisited 
                    ? 'bg-green-600 border-green-600 text-white animate-pulse'
                    : 'bg-white hover:bg-orange-50 border-orange-200 text-orange-600 dark:bg-gray-900 dark:border-gray-800 dark:text-orange-400 dark:hover:bg-gray-850'
                } cursor-pointer active:scale-95`}
              >
                {justVisited ? (
                  <>
                    <span>✅</span>
                    <span>Visite enregistrée !</span>
                  </>
                ) : (
                  <>
                    <span>📍</span>
                    <span>J'y suis allé {visitCount > 0 ? `(${visitCount} ${visitCount > 1 ? 'visites' : 'visite'})` : ''}</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Targeted Ad Placement */}
          <AdPlacementBanner placement="establishment_detail" cityFilter={establishment.city} />

          {currentUser && currentUser.id === establishment.ownerId && (
            <div className="p-4 bg-orange-50/70 dark:bg-orange-950/20 rounded-2xl border-2 border-orange-200 dark:border-orange-900/60 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-orange-800 dark:text-orange-400 uppercase tracking-wider flex items-center gap-2">
                  <span>⚙️</span> Espace Gérant d'Établissement
                </h4>
              </div>

              {/* Action 1: Gérer les réservations */}
              <button
                type="button"
                onClick={() => setShowReservationsDashboard(true)}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold py-3 px-4 rounded-xl active:scale-[0.98] transition-all shadow-md shadow-orange-600/10 cursor-pointer"
              >
                <Calendar className="w-5 h-5" />
                <span>Gérer les réservations</span>
              </button>

              {/* Action 2: Gestion géolocalisation */}
              <div className="border-t border-orange-100 dark:border-orange-900/40 pt-3">
                <div className="flex items-center justify-between mb-1">
                  <h5 className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-orange-500" />
                    <span>Géolocalisation</span>
                  </h5>
                  {!isEditingGeo && (
                    <button
                      type="button"
                      onClick={() => setIsEditingGeo(true)}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                    >
                      {establishment.geolocation ? "Modifier" : "Ajouter"}
                    </button>
                  )}
                </div>

                {isEditingGeo ? (
                  <div className="space-y-2 mt-2">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-normal">
                      Saisissez l'adresse de votre établissement ou collez un lien Google Maps (ex: https://maps.app.goo.gl/...)
                    </p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={geoInput}
                        onChange={e => setGeoInput(e.target.value)}
                        placeholder="Lien Google Maps ou Adresse"
                        className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500/20 outline-none text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleSaveGeo}
                        disabled={isSavingGeo}
                        className="px-3 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        {isSavingGeo ? "..." : <Save className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingGeo(false);
                          setGeoInput(establishment.geolocation || '');
                        }}
                        className="px-3 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-xl hover:bg-gray-200 cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {establishment.geolocation ? (
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 line-clamp-2 bg-white dark:bg-gray-900/50 p-2 rounded-lg border border-gray-150 dark:border-gray-900 mt-1">
                        {establishment.geolocation}
                      </p>
                    ) : (
                      <div className="p-3 bg-amber-50/60 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/40 rounded-xl mt-1">
                        <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                          ⚠️ Aucune géolocalisation enregistrée. Ajoutez un lien ou une adresse pour guider vos clients.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sub Tab Navigation */}
          {(() => {
            const tabs = [
              { id: 'info', label: 'ℹ️ Infos' },
              { id: 'galerie', label: '📸 Galerie' },
              { id: 'live', label: '📺 Live' },
              { id: 'affluence', label: '⚡ Affluence' },
              { id: 'dj', label: '🎵 Playlist DJ' },
              { id: 'equipe', label: '👥 Personnel' },
              { id: 'rh', label: '💼 Tableau RH' }
            ];
            if ((isOwner || isCaissier) && (establishment.category === 'maquis' || establishment.category === 'boite_de_nuit')) {
              tabs.push({ 
                id: 'stocks_ventes', 
                label: isOwner ? '🛒 Stocks & Ventes' : '🛒 Ma Caisse (POS)' 
              });
            }
            return (
              <div className="flex bg-gray-100 dark:bg-gray-900 rounded-2xl p-1 gap-1 border border-gray-150 dark:border-gray-800 flex-shrink-0 overflow-x-auto hide-scrollbar">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id as any)}
                    className={`flex-1 min-w-[70px] py-2 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer text-center ${
                      activeSubTab === tab.id
                        ? 'bg-orange-600 text-white shadow-sm font-extrabold'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            );
          })()}

          {activeSubTab === 'info' ? (
            <>
              <div className="p-4 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-sm font-black text-gray-900 dark:text-white mb-2 uppercase tracking-wide">À propos</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium leading-relaxed">
              {establishment.description || "Aucune description disponible pour cet établissement."}
            </p>
          </div>

          {establishment.openingHours && (
            <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-xs font-black text-orange-800 uppercase tracking-wide mb-1">Horaires d'ouverture</h3>
                <p className="text-sm text-orange-950 font-bold leading-relaxed">
                  {establishment.openingHours}
                </p>
              </div>
            </div>
          )}

          {establishment.tags && establishment.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {establishment.tags.map((tag, idx) => (
                <span 
                  key={idx} 
                  className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-black uppercase rounded-lg border border-gray-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Menu PDF */}
          {establishment.menuPdfUrl && (
            <div className="p-4 bg-orange-50/20 dark:bg-orange-950/10 rounded-2xl border border-orange-100 dark:border-orange-900/30 space-y-3">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <span>📖</span> La Carte & Menu
              </h3>
              
              <a 
                href={establishment.menuPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400 bg-white dark:bg-gray-900 p-3 rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm hover:bg-orange-50 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Voir le Menu complet (PDF)
              </a>
            </div>
          )}

          {/* Photos de l'établissement */}
          {establishment.menuImages && establishment.menuImages.length > 0 && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <span>📸</span> Photos de l'établissement
              </h3>
              <div className="flex gap-2 overflow-x-auto hide-scrollbar py-2">
                {establishment.menuImages.map((img, idx) => (
                  <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="shrink-0 w-32 h-32 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
                    <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Menu du jour section */}
          {establishment.category === 'restaurant' && (
            <div className="p-4 bg-orange-50/40 rounded-2xl border border-orange-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
                  <span>🍽️</span> Menu du jour
                </h3>
                {latestMenu ? (
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                    latestMenu.date === new Date().toISOString().split('T')[0]
                      ? 'bg-green-100 text-green-700 border border-green-200'
                      : 'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}>
                    {getMenuAgeText(latestMenu.date)}
                  </span>
                ) : null}
              </div>

              {latestMenu ? (
                <div className="space-y-3">
                  <div className="divide-y divide-orange-100">
                    {latestMenu.items.map((item, idx) => {
                      const getCategoryInfo = (cat: string) => {
                        const norm = cat?.toLowerCase() || '';
                        if (norm.includes('petit')) return { icon: '🍳', label: 'Petit Déjeuner', color: 'bg-amber-50 text-amber-700 border-amber-200' };
                        if (norm.includes('déjeuner') || norm.includes('dejeuner')) return { icon: '🌞', label: 'Déjeuner', color: 'bg-orange-50 text-orange-700 border-orange-200' };
                        if (norm.includes('dîner') || norm.includes('diner')) return { icon: '🌙', label: 'Dîner', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
                        if (norm.includes('entree') || norm.includes('entrée')) return { icon: '🥗', label: 'Entrée', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
                        if (norm.includes('plat')) return { icon: '🍛', label: 'Plat Principal', color: 'bg-red-50 text-red-700 border-red-200' };
                        if (norm.includes('dessert')) return { icon: '🍰', label: 'Dessert', color: 'bg-pink-50 text-pink-700 border-pink-200' };
                        if (norm.includes('boisson')) return { icon: '🥤', label: 'Boisson', color: 'bg-blue-50 text-blue-700 border-blue-200' };
                        return { icon: '🍽️', label: cat || 'Autre', color: 'bg-gray-50 text-gray-700 border-gray-200' };
                      };

                      const catInfo = getCategoryInfo(item.category || '');

                      return (
                        <div key={idx} className="py-3 flex justify-between items-start gap-4">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-black text-gray-900 text-sm">{item.name}</span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${catInfo.color} flex items-center gap-1`}>
                                <span>{catInfo.icon}</span>
                                <span>{catInfo.label}</span>
                              </span>
                            </div>
                            {item.photoUrl && (
                              <img 
                                src={item.photoUrl} 
                                alt={item.name} 
                                className="w-full max-w-[180px] h-28 object-cover rounded-xl border border-orange-100 mt-1 shadow-sm"
                                referrerPolicy="no-referrer"
                              />
                            )}
                          </div>
                          <span className="font-black text-xs text-white bg-orange-600 dark:bg-orange-700 px-3 py-1 rounded-full shadow-md shadow-orange-600/20 whitespace-nowrap flex-shrink-0">
                            {item.price} FCFA
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-500 font-medium italic">
                  Aucun menu du jour publié pour le moment.
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">Avis clients</h3>
            <AvisUtilisateurs establishmentId={establishment.id} />
          </div>
            </>
          ) : activeSubTab === 'galerie' ? (
            <EstablishmentPhotoGallery 
              establishment={establishment} 
              onOpenManager={() => setShowGalleryManager(true)} 
            />
          ) : activeSubTab === 'live' ? (
            <LiveDAmbiance establishmentId={establishment.id} establishmentName={establishment.name} />
          ) : activeSubTab === 'affluence' ? (
            <AffluenceTracker establishmentId={establishment.id} />
          ) : activeSubTab === 'dj' ? (
            <PlaylistDJ establishmentId={establishment.id} />
          ) : activeSubTab === 'stocks_ventes' ? (
            isOwner ? (
              <CashierDashboard establishmentId={establishment.id} />
            ) : (
              <CaissierView initialEstablishmentId={establishment.id} />
            )
          ) : activeSubTab === 'rh' ? (
            <TableauDeBordRH establishmentId={establishment.id} establishmentName={establishment.name} />
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">Équipe & Personnel</h3>
              <p className="text-xs text-gray-500 font-medium">Découvrez les employés de cet établissement et notez leurs prestations.</p>

              {reviewSuccessMsg && (
                <div className="p-3 bg-green-50 text-green-700 rounded-xl text-xs font-bold">
                  {reviewSuccessMsg}
                </div>
              )}

              {relationshipRequests.filter(r => r.establishmentId === establishment.id && r.status === 'acceptee' && (r.isDJ || (r.requestedRole && r.requestedRole !== 'client'))).length === 0 ? (
                <div className="p-6 bg-gray-50 dark:bg-gray-800/40 rounded-2xl text-center text-xs font-bold text-gray-400">
                  Aucun membre du personnel enregistré pour le moment.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {relationshipRequests
                    .filter(r => r.establishmentId === establishment.id && r.status === 'acceptee' && (r.isDJ || (r.requestedRole && r.requestedRole !== 'client')))
                    .map(r => {
                      const memberId = r.type === 'client_join' ? r.initiatorId : r.targetId;
                      const memberUser = users.find(u => u.id === memberId);
                      const staffReviewsList = staffReviews.filter(sr => sr.establishmentId === establishment.id && sr.staffId === memberId && sr.status === 'valide');
                      const avgRating = staffReviewsList.length > 0 
                        ? (staffReviewsList.reduce((acc, curr) => acc + curr.rating, 0) / staffReviewsList.length).toFixed(1)
                        : '0.0';

                      return (
                        <div key={r.id} className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                            {r.identityPhotoUrl || memberUser?.avatar ? (
                              <img src={r.identityPhotoUrl || memberUser?.avatar} alt="Personnel" className="w-12 h-12 rounded-xl object-cover border border-orange-200 shadow-sm" />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center font-black text-orange-600 text-sm">
                                {(memberUser?.name || 'P').substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                                {memberUser?.name || 'Employé'}
                                <span className="text-[9px] bg-orange-100 text-orange-700 font-extrabold px-2 py-0.5 rounded uppercase">
                                  {r.isDJ ? 'DJ' : r.requestedRole}
                                </span>
                              </h4>
                              <div className="flex items-center gap-1.5 text-xs text-yellow-500 font-bold mt-0.5">
                                <span>★</span>
                                <span>{avgRating} ({staffReviewsList.length} avis)</span>
                              </div>
                            </div>
                          </div>

                          {currentUser && currentUser.role === 'client' && (
                            <button
                              type="button"
                              onClick={() => setRatingStaffId(memberId)}
                              className="px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                            >
                              ⭐ Noter
                            </button>
                          )}
                        </div>
                      );
                    })}
                </div>
              )}

              {ratingStaffId && (
                <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                  <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Noter la prestation de l'employé</h3>
                    
                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Note (1 à 5 étoiles)</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setStaffRatingVal(star)}
                            className={`text-2xl ${staffRatingVal >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Votre avis / commentaire</label>
                      <textarea
                        value={staffComment}
                        onChange={e => setStaffComment(e.target.value)}
                        placeholder="Décrivez la qualité du service..."
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!currentUser) return;
                          try {
                            await createStaffReview({
                              establishmentId: establishment.id,
                              staffId: ratingStaffId,
                              clientId: currentUser.id,
                              clientName: currentUser.name,
                              rating: staffRatingVal,
                              comment: staffComment
                            });
                            setReviewSuccessMsg("Avis soumis avec succès ! En attente de validation par le gérant.");
                            setRatingStaffId(null);
                            setStaffComment('');
                            setTimeout(() => setReviewSuccessMsg(null), 4000);
                          } catch (err) {
                            console.error(err);
                            alert("Erreur lors de la soumission de l'avis.");
                          }
                        }}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer"
                      >
                        Soumettre l'avis
                      </button>
                      <button
                        type="button"
                        onClick={() => setRatingStaffId(null)}
                        className="px-4 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold py-3 rounded-xl text-xs cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="sticky bottom-0 pt-4 bg-white dark:bg-gray-950 flex flex-col sm:flex-row gap-3 z-10">
            <div className="flex gap-3 w-full">
              {mapsUrl && (
                <a 
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 border-2 border-orange-200 dark:border-orange-900/60 text-orange-600 dark:text-orange-400 font-bold px-5 py-4 rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-950/20 active:scale-[0.98] transition-all cursor-pointer"
                  id={`itinerary-btn-${establishment.id}`}
                >
                  <Compass className="w-5 h-5" />
                </a>
              )}
              {(establishment.category === 'restaurant' || establishment.category === 'restaurants' || establishment.category === 'glacier_pizzeria') && (
                <button 
                  onClick={() => setShowTakeaway(true)}
                  className="flex-1 flex items-center justify-center gap-2 font-bold py-4 rounded-2xl active:scale-[0.98] transition-all shadow-lg cursor-pointer bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Commander</span>
                </button>
              )}
              <button 
                onClick={() => setShowReservation(true)}
                className={`flex-1 flex items-center justify-center gap-2 font-bold py-4 rounded-2xl active:scale-[0.98] transition-all shadow-lg cursor-pointer ${
                  establishment.reservationsClosed
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                    : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20'
                }`}
              >
                <Calendar className="w-5 h-5" />
                {establishment.reservationsClosed ? (
                  <span>🔴 Réservations fermées</span>
                ) : (
                  <span>{establishment.category === 'restaurant' ? 'Réserver' : 'Réservation'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showGalleryManager && (
        <EstablishmentPhotoGalleryManager
          establishment={establishment}
          onClose={() => setShowGalleryManager(false)}
        />
      )}
    </div>
  );
}
