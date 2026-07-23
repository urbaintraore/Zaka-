import React, { useState } from 'react';
import { X, Calendar, Clock, Share2, Compass, FileText, MapPin, Save } from 'lucide-react';
import { Establishment } from '../types';
import { ReservationModal } from './ReservationModal';
import { AvisUtilisateurs } from './AvisUtilisateurs';
import { ReservationsDashboard } from './ReservationsDashboard';
import { useAppStore } from '../store';
import { shareContent } from '../utils/platform';

interface EstablishmentDetailModalProps {
  establishment: Establishment;
  onClose: () => void;
}

export function EstablishmentDetailModal({ establishment, onClose }: EstablishmentDetailModalProps) {
  const { createServiceRequest, addReservation, menusDuJour, currentUser, updateEstablishment } = useAppStore();
  const [showReservation, setShowReservation] = useState(false);
  const [showReservationsDashboard, setShowReservationsDashboard] = useState(false);
  const [isEditingGeo, setIsEditingGeo] = useState(false);
  const [geoInput, setGeoInput] = useState(establishment.geolocation || '');
  const [isSavingGeo, setIsSavingGeo] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);

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

  if (showReservationsDashboard) {
    return (
      <ReservationsDashboard
        establishmentId={establishment.id}
        onClose={() => setShowReservationsDashboard(false)}
      />
    );
  }

  if (showReservation) {
    return <ReservationModal establishmentName={establishment.name} onClose={() => setShowReservation(false)} onSubmit={handleReservationSubmit} />;
  }

  const allPhotos = establishment.photos.length > 0 
    ? establishment.photos 
    : ['https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800'];

  const latestMenu = menusDuJour
    ? menusDuJour
        .filter(m => m.establishmentId === establishment.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
    : null;

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
            <div className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">
              {establishment.category.replace(/_/g, ' ')}
            </div>
            <h2 className="text-2xl font-black text-gray-900 leading-tight mb-2">{establishment.name}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500 font-bold">
              <span className="text-yellow-500 text-lg">★</span>
              <span>{establishment.averageRating.toFixed(1)} avis</span>
              <span className="text-gray-300">•</span>
              <span>{establishment.neighborhood}</span>
            </div>
          </div>

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

          {/* Menu Fichiers et Images */}
          {(establishment.menuPdfUrl || (establishment.menuImages && establishment.menuImages.length > 0)) && (
            <div className="p-4 bg-orange-50/20 dark:bg-orange-950/10 rounded-2xl border border-orange-100 dark:border-orange-900/30 space-y-3">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <span>📖</span> La Carte & Menu
              </h3>
              
              {establishment.menuPdfUrl && (
                <a 
                  href={establishment.menuPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs font-bold text-orange-600 dark:text-orange-400 bg-white dark:bg-gray-900 p-3 rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm hover:bg-orange-50 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Voir le Menu complet (PDF)
                </a>
              )}

              {establishment.menuImages && establishment.menuImages.length > 0 && (
                <div className="flex gap-2 overflow-x-auto hide-scrollbar py-2">
                  {establishment.menuImages.map((img, idx) => (
                    <a key={idx} href={img} target="_blank" rel="noopener noreferrer" className="shrink-0 w-32 h-40 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm cursor-pointer hover:opacity-90 transition-opacity">
                      <img src={img} alt={`Menu ${idx + 1}`} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}
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
          
          <div className="sticky bottom-0 pt-4 bg-white dark:bg-gray-950 flex gap-3 z-10">
            {mapsUrl && (
              <a 
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 border-2 border-orange-200 dark:border-orange-900/60 text-orange-600 dark:text-orange-400 font-bold px-5 py-4 rounded-2xl hover:bg-orange-50 dark:hover:bg-orange-950/20 active:scale-[0.98] transition-all cursor-pointer"
                id={`itinerary-btn-${establishment.id}`}
              >
                <Compass className="w-5 h-5" />
                <span>Itinéraire</span>
              </a>
            )}
            <button 
              onClick={() => setShowReservation(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-orange-600 text-white font-bold py-4 rounded-2xl hover:bg-orange-700 active:scale-[0.98] transition-all shadow-lg shadow-orange-600/20 cursor-pointer"
            >
              <Calendar className="w-5 h-5" />
              {establishment.category === 'restaurant' ? 'Réserver une table' : 'Faire une réservation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
