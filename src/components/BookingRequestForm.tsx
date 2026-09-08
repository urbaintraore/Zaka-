import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, DollarSign, Users, Phone, MessageCircle, Send } from 'lucide-react';
import { ArtistProfile } from '../types';
import { createArtistBooking } from '../lib/artistService';
import { useAppStore } from '../store';

interface BookingRequestFormProps {
  artist: ArtistProfile;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BookingRequestForm: React.FC<BookingRequestFormProps> = ({
  artist,
  isOpen,
  onClose,
  onSuccess
}) => {
  const { currentUser, establishments } = useAppStore();

  const [eventName, setEventName] = useState('');
  const [eventType, setEventType] = useState('Concert / Festival');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState(artist.ville || 'Ouagadougou');
  const [requesterName, setRequesterName] = useState(currentUser?.name || '');
  const [requesterPhone, setRequesterPhone] = useState(currentUser?.phone || '');
  const [requesterWhatsapp, setRequesterWhatsapp] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');
  const [estimatedAttendees, setEstimatedAttendees] = useState('');
  const [selectedEstId, setSelectedEstId] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  // Filter establishments owned by current user if they are a gerant
  const myEstablishments = establishments.filter(
    e => e.ownerId === currentUser?.id || e.gerantId === currentUser?.id
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!eventName.trim() || !date || !requesterPhone.trim()) {
      setError('Veuillez remplir les informations obligatoires (Nom événement, date, téléphone).');
      return;
    }

    setLoading(true);
    try {
      const selectedEst = establishments.find(e => e.id === selectedEstId);

      await createArtistBooking({
        artistId: artist.id,
        artistName: artist.nomArtiste,
        requesterId: currentUser?.id || `guest-${Date.now()}`,
        requesterName: requesterName || 'Organisateur anonyme',
        requesterPhone: requesterPhone,
        requesterWhatsapp: requesterWhatsapp || requesterPhone,
        establishmentId: selectedEst?.id,
        establishmentName: selectedEst?.name,
        eventName,
        eventType,
        date,
        time,
        location: location || selectedEst?.name || 'À préciser',
        city,
        budget,
        description,
        estimatedAttendees
      });

      setIsSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi de la demande de booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between z-10">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Demande de Prestation
            </span>
            <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <span>Booking pour</span>
              <span className="text-orange-600">{artist.nomArtiste}</span>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto rounded-full flex items-center justify-center text-3xl">
              ✓
            </div>
            <h4 className="text-lg font-black text-gray-900 dark:text-white">Demande de Booking envoyée !</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              Votre proposition a bien été transmise à <strong>{artist.nomArtiste}</strong>. Vous serez contacté rapidement par téléphone ou WhatsApp.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-600 text-xs font-bold rounded-xl">
                {error}
              </div>
            )}

            {/* Event Name & Type */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Nom de l'événement *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Soirée Live Acoustique, Mariage, Festival..."
                value={eventName}
                onChange={e => setEventName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:border-orange-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Type d'événement
                </label>
                <select
                  value={eventType}
                  onChange={e => setEventType(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:border-orange-500 outline-none"
                >
                  <option value="Concert / Festival">Concert / Festival</option>
                  <option value="Prestation Maquis / Bar / Club">Prestation Maquis / Bar / Club</option>
                  <option value="Résidence Artistique">Résidence Artistique</option>
                  <option value="Mariage / Cérémonie">Mariage / Cérémonie</option>
                  <option value="Anniversaire / Événement Privé">Anniversaire / Événement Privé</option>
                  <option value="Événement d'Entreprise / Gala">Événement d'Entreprise / Gala</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Users size={14} /> Participants estimés
                </label>
                <input
                  type="text"
                  placeholder="Ex: 50-100 personnes"
                  value={estimatedAttendees}
                  onChange={e => setEstimatedAttendees(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            {/* Date & Heure */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Calendar size={14} /> Date souhaitée *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:border-orange-500 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Clock size={14} /> Heure
                </label>
                <input
                  type="time"
                  value={time}
                  onChange={e => setTime(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            {/* If user is Gérant, option to link to their establishment */}
            {myEstablishments.length > 0 && (
              <div className="space-y-1.5 p-3 bg-orange-50/50 dark:bg-orange-950/30 rounded-2xl border border-orange-100 dark:border-orange-900/50">
                <label className="text-xs font-bold text-orange-900 dark:text-orange-300">
                  Lier à votre établissement (Optionnel)
                </label>
                <select
                  value={selectedEstId}
                  onChange={e => {
                    setSelectedEstId(e.target.value);
                    const found = myEstablishments.find(est => est.id === e.target.value);
                    if (found) {
                      setLocation(found.name + ' - ' + (found.neighborhood || found.city));
                      setCity(found.city || 'Ouagadougou');
                    }
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-orange-200 dark:border-orange-800 rounded-xl text-xs font-semibold text-gray-800 dark:text-gray-200 outline-none"
                >
                  <option value="">-- Aucun / Lieu externe --</option>
                  {myEstablishments.map(est => (
                    <option key={est.id} value={est.id}>
                      {est.name} ({est.city})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Lieu & Ville */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <MapPin size={14} /> Lieu précis
                </label>
                <input
                  type="text"
                  placeholder="Ex: Maquis Le Calao, Salle des Fêtes..."
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:border-orange-500 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Ville
                </label>
                <input
                  type="text"
                  placeholder="Ouagadougou, Bobo-Dioulasso..."
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            {/* Organisateur & Contacts */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Nom de l'organisateur / Structure *
              </label>
              <input
                type="text"
                required
                placeholder="Votre nom ou le nom de votre entreprise"
                value={requesterName}
                onChange={e => setRequesterName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:border-orange-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Phone size={14} /> Téléphone *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+226 70 00 00 00"
                  value={requesterPhone}
                  onChange={e => setRequesterPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:border-orange-500 outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <MessageCircle size={14} /> WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="+226 70 00 00 00"
                  value={requesterWhatsapp}
                  onChange={e => setRequesterWhatsapp(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:border-orange-500 outline-none"
                />
              </div>
            </div>

            {/* Budget indicatif */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                <DollarSign size={14} /> Budget indicatif (FCFA)
              </label>
              <input
                type="text"
                placeholder="Ex: 150 000 FCFA ou À négocier"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:border-orange-500 outline-none"
              />
            </div>

            {/* Description / Attentes */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Description du projet / Besoins particuliers
              </label>
              <textarea
                rows={3}
                placeholder="Détaillez le déroulement, le style attendu, la durée de la prestation..."
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-white focus:border-orange-500 outline-none resize-none"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 font-bold text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg shadow-orange-600/20 flex items-center gap-2 cursor-pointer transition-all"
              >
                <Send size={15} />
                <span>{loading ? 'Envoi en cours...' : 'Envoyer la demande'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
