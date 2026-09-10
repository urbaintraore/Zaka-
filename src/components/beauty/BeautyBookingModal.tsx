import React, { useState, useEffect } from 'react';
import {
  BeautySalon,
  BeautyService,
  BeautyAppointment
} from '../../types';
import {
  createBeautyAppointment,
  fetchSalonServices,
  formatFcfa,
  BEAUTY_CATEGORY_LABELS
} from '../../lib/beautyService';
import { useAppStore } from '../../store';
import {
  X,
  Calendar,
  Clock,
  CheckCircle,
  MapPin,
  Home,
  Store,
  Phone,
  MessageCircle,
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface BeautyBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  salon: BeautySalon;
  preselectedServiceId?: string;
  onBookingSuccess?: (appointment: BeautyAppointment) => void;
}

export function BeautyBookingModal({
  isOpen,
  onClose,
  salon,
  preselectedServiceId,
  onBookingSuccess
}: BeautyBookingModalProps) {
  const { currentUser, addNotification } = useAppStore();
  const [services, setServices] = useState<BeautyService[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);

  // Form state
  const [selectedServiceId, setSelectedServiceId] = useState<string>(preselectedServiceId || '');
  const [dateRdv, setDateRdv] = useState<string>(() => {
    const tomorrow = new Date(Date.now() + 86400000);
    return tomorrow.toISOString().split('T')[0];
  });
  const [heureRdv, setHeureRdv] = useState<string>('10:00');
  const [isADomicile, setIsADomicile] = useState<boolean>(false);
  const [adresseDomicile, setAdresseDomicile] = useState<string>('');
  const [nomClient, setNomClient] = useState<string>(currentUser?.name || '');
  const [telephoneClient, setTelephoneClient] = useState<string>(currentUser?.phone || '');
  const [notesClient, setNotesClient] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successAppointment, setSuccessAppointment] = useState<BeautyAppointment | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLoadingServices(true);
      fetchSalonServices(salon.id, true)
        .then(data => {
          setServices(data);
          if (!selectedServiceId && data.length > 0) {
            setSelectedServiceId(preselectedServiceId || data[0].id);
          }
        })
        .finally(() => setLoadingServices(false));
    }
  }, [isOpen, salon.id, preselectedServiceId]);

  useEffect(() => {
    if (currentUser) {
      if (!nomClient) setNomClient(currentUser.name);
      if (!telephoneClient && currentUser.phone) setTelephoneClient(currentUser.phone);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const selectedService = services.find(s => s.id === selectedServiceId);
  const minDate = new Date().toISOString().split('T')[0];

  // Available standard hour slots
  const timeSlots = [
    '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!nomClient.trim()) {
      setErrorMsg('Veuillez indiquer votre nom complet.');
      return;
    }
    if (!telephoneClient.trim()) {
      setErrorMsg('Veuillez indiquer votre numéro de téléphone (WhatsApp ou appel).');
      return;
    }
    if (!selectedService) {
      setErrorMsg('Veuillez sélectionner au moins une prestation.');
      return;
    }
    if (isADomicile && !adresseDomicile.trim()) {
      setErrorMsg('Veuillez préciser votre adresse ou quartier pour la prestation à domicile.');
      return;
    }

    setIsSubmitting(true);
    try {
      const newApp = await createBeautyAppointment({
        salonId: salon.id,
        salonNom: salon.nom,
        serviceId: selectedService.id,
        serviceNom: selectedService.nom,
        clientId: currentUser?.id,
        nomClient: nomClient.trim(),
        telephoneClient: telephoneClient.trim(),
        dateRdv,
        heureRdv,
        statut: 'en_attente',
        notesClient: notesClient.trim(),
        prixTotalFcfa: selectedService.prixFcfa,
        aDomicile: isADomicile,
        adresseDomicile: isADomicile ? adresseDomicile.trim() : undefined
      });

      setSuccessAppointment(newApp);

      // Notification au salon (système existant ZAKA+)
      const targetSalonUserId = salon.userId || 'u-pro-salon';
      addNotification({
        userId: targetSalonUserId,
        title: `Nouveau RDV : ${selectedService.nom} 💇✨`,
        message: `${nomClient.trim()} a réservé pour le ${dateRdv} à ${heureRdv}${isADomicile ? ' (à domicile)' : ''}. Prestation : ${selectedService.nom} (${selectedService.prixFcfa.toLocaleString('fr-FR')} FCFA). Téléphone : ${telephoneClient.trim()}.`,
        type: 'reservation_update',
        linkTab: 'beauty',
        relatedId: newApp.id
      });

      if (currentUser?.id) {
        addNotification({
          userId: currentUser.id,
          title: `Rendez-vous réservé chez ${salon.nom} ✨`,
          message: `Votre demande pour "${selectedService.nom}" le ${dateRdv} à ${heureRdv} a été transmise au salon.`,
          type: 'reservation_update',
          linkTab: 'beauty',
          relatedId: newApp.id
        });
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: {
            message: `✨ Rendez-vous réservé chez ${salon.nom} ! Une alerte a été transmise au salon.`,
            type: 'success'
          }
        }));
      }

      if (onBookingSuccess) onBookingSuccess(newApp);
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue lors de la réservation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openWhatsAppConfirmation = () => {
    if (!successAppointment) return;
    const phoneClean = salon.whatsapp?.replace(/[^0-9]/g, '') || salon.telephone?.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Bonjour *${salon.nom}*,\n\nJe viens de réserver un créneau sur Zaka Beauty :\n` +
      `📅 *Date :* ${successAppointment.dateRdv}\n` +
      `⏰ *Heure :* ${successAppointment.heureRdv}\n` +
      `💇 *Prestation :* ${successAppointment.serviceNom}\n` +
      `💰 *Tarif :* ${formatFcfa(successAppointment.prixTotalFcfa)}\n` +
      `👤 *Client(e) :* ${successAppointment.nomClient} (${successAppointment.telephoneClient})\n` +
      (successAppointment.aDomicile ? `🏡 *À domicile :* ${successAppointment.adresseDomicile}\n` : `🏢 *Au salon*\n`) +
      (successAppointment.notesClient ? `📝 *Notes :* ${successAppointment.notesClient}\n` : '') +
      `\nMerci de me confirmer la prise en charge !`
    );
    window.open(`https://wa.me/${phoneClean}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 text-white flex items-center justify-between">
          <div className="pr-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-0.5 rounded-full">
                ZAKA Beauty
              </span>
              <span className="text-xs text-rose-100 font-medium flex items-center gap-1">
                <Sparkles size={12} /> Réservation directe
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">{salon.nom}</h2>
            <p className="text-xs text-white/90 flex items-center gap-1 mt-0.5">
              <MapPin size={12} /> {salon.quartier ? `${salon.quartier}, ` : ''}{salon.ville}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
            title="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[75vh] overflow-y-auto">
          {successAppointment ? (
            <div className="py-4 text-center space-y-5">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle size={36} />
              </div>

              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">
                  Rendez-vous enregistré !
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
                  Votre demande a été transmise à <strong className="text-gray-800 dark:text-gray-200">{salon.nom}</strong>. Le salon va valider votre créneau.
                </p>
              </div>

              {/* Booking Recap Card */}
              <div className="bg-gray-50 dark:bg-gray-800/60 p-4 rounded-2xl border border-gray-200/60 dark:border-gray-700/60 text-left space-y-2.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Prestation :</span>
                  <span className="font-bold text-gray-900 dark:text-white">{successAppointment.serviceNom}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Date & Heure :</span>
                  <span className="font-bold text-gray-900 dark:text-white">{successAppointment.dateRdv} à {successAppointment.heureRdv}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-gray-500 dark:text-gray-400">Lieu :</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {successAppointment.aDomicile ? `À domicile (${successAppointment.adresseDomicile})` : 'Au salon'}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-700 dark:text-gray-300 font-bold">Tarif estimé :</span>
                  <span className="text-base font-black text-rose-600 dark:text-rose-400">
                    {formatFcfa(successAppointment.prixTotalFcfa)}
                  </span>
                </div>
              </div>

              {/* CTA Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-2">
                {(salon.whatsapp || salon.telephone) && (
                  <button
                    onClick={openWhatsAppConfirmation}
                    className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer active:scale-98"
                  >
                    <MessageCircle size={16} />
                    Envoyer le récapitulatif par WhatsApp au salon
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="w-full py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-2xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Service Selection */}
              <div>
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                  1. Choisissez une prestation
                </label>
                {loadingServices ? (
                  <div className="p-4 text-center text-xs text-gray-400">Chargement des prestations...</div>
                ) : services.length === 0 ? (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-xs text-gray-500 text-center">
                    Aucune prestation enregistrée pour ce salon. Vous pouvez tout de même prendre contact directement par téléphone.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-1">
                    {services.map(srv => {
                      const isSelected = selectedServiceId === srv.id;
                      const catInfo = BEAUTY_CATEGORY_LABELS[srv.categorie] || { icon: '✨', label: srv.categorie };
                      return (
                        <div
                          key={srv.id}
                          onClick={() => setSelectedServiceId(srv.id)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/30 ring-2 ring-rose-500/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-rose-300 dark:hover:border-rose-800 bg-white dark:bg-gray-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xl">{catInfo.icon}</span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                {srv.nom}
                              </p>
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                <Clock size={10} /> {srv.dureeMinutes} min
                                {srv.estPopulaire && (
                                  <span className="text-amber-600 dark:text-amber-400 font-extrabold text-[9px] bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.2 rounded">
                                    ★ Populaire
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-black text-rose-600 dark:text-rose-400 shrink-0">
                            {formatFcfa(srv.prixFcfa)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Location Type (Salon vs Domicile) */}
              {salon.aDomicile && (
                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    2. Lieu de la prestation
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setIsADomicile(false)}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        !isADomicile
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 font-black'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <Store size={15} />
                      <span>Au salon</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsADomicile(true)}
                      className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isADomicile
                          ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 font-black'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50'
                      }`}
                    >
                      <Home size={15} />
                      <span>À mon domicile</span>
                    </button>
                  </div>

                  {isADomicile && (
                    <div className="mt-2.5">
                      <input
                        type="text"
                        required
                        placeholder="Ex : Ouaga 2000, vers le rond-point des Martyrs, villa n°..."
                        value={adresseDomicile}
                        onChange={e => setAdresseDomicile(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-rose-500"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Date & Heure */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Date du RDV
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      min={minDate}
                      required
                      value={dateRdv}
                      onChange={e => setDateRdv(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-rose-500 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Heure souhaitée
                  </label>
                  <select
                    value={heureRdv}
                    onChange={e => setHeureRdv(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-rose-500 font-bold"
                  >
                    {timeSlots.map(time => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Client Info */}
              <div className="space-y-2.5 pt-1">
                <label className="block text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Vos coordonnées
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    placeholder="Votre nom complet"
                    value={nomClient}
                    onChange={e => setNomClient(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-rose-500 font-medium"
                  />
                  <input
                    type="tel"
                    required
                    placeholder="Téléphone / WhatsApp"
                    value={telephoneClient}
                    onChange={e => setTelephoneClient(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-rose-500 font-medium"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Notes particulières (ex : couleur de mèches souhaitée, cheveux sensibles, etc.)"
                  value={notesClient}
                  onChange={e => setNotesClient(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white outline-none focus:border-rose-500 resize-none font-normal"
                />
              </div>

              {/* Total & Submit */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 block">Total estimé</span>
                  <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                    {formatFcfa(selectedService?.prixFcfa)}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-xs hover:bg-gray-200 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedService}
                    className="px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-2xl font-black text-xs shadow-md shadow-rose-600/20 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Envoi...' : 'Confirmer le RDV'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
