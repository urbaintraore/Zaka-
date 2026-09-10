import React, { useState, useEffect } from 'react';
import { 
  Scissors, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Sparkles, 
  DollarSign, 
  RefreshCw, 
  MessageCircle, 
  Home, 
  Store 
} from 'lucide-react';
import { 
  fetchClientAppointments, 
  updateAppointmentStatus, 
  subscribeToClientAppointments 
} from '../../lib/beautyService';
import { BeautyAppointment } from '../../types';
import { useAppStore } from '../../store';

interface ClientBeautyAppointmentsCardProps {
  clientId: string;
  clientPhone?: string;
}

export function ClientBeautyAppointmentsCard({ clientId, clientPhone }: ClientBeautyAppointmentsCardProps) {
  const [appointments, setAppointments] = useState<BeautyAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [latestAlert, setLatestAlert] = useState<{
    type: 'confirme' | 'annule' | 'termine';
    message: string;
    timestamp: number;
  } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchClientAppointments(clientId, clientPhone);
      setAppointments(data);
    } catch (err) {
      console.warn('Erreur chargement rendez-vous beauté:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // 1. Supabase Postgres Realtime subscription
    const unsubscribe = subscribeToClientAppointments(clientId, (updatedAppt, eventType) => {
      console.log('[Realtime Client]', eventType, updatedAppt);
      if (updatedAppt.statut === 'confirme') {
        setLatestAlert({
          type: 'confirme',
          message: `Votre rendez-vous chez "${updatedAppt.salonNom || 'le salon'}" le ${updatedAppt.dateRdv} à ${updatedAppt.heureRdv} a été validé ! ✨`,
          timestamp: Date.now()
        });
      } else if (updatedAppt.statut === 'annule') {
        setLatestAlert({
          type: 'annule',
          message: `Votre rendez-vous chez "${updatedAppt.salonNom || 'le salon'}" a été annulé.`,
          timestamp: Date.now()
        });
      }
      loadData();
    });

    // 2. Local Custom Event listener for in-session status updates
    const handleStatusChangeEvent = (e: CustomEvent) => {
      const detail = e.detail;
      if (detail && detail.appointment) {
        const appt: BeautyAppointment = detail.appointment;
        if (appt.clientId === clientId || (clientPhone && appt.telephoneClient === clientPhone)) {
          if (detail.statut === 'confirme') {
            setLatestAlert({
              type: 'confirme',
              message: `🎉 Rendez-vous confirmé chez "${appt.salonNom || 'votre salon'}" le ${appt.dateRdv} à ${appt.heureRdv} !`,
              timestamp: Date.now()
            });
          } else if (detail.statut === 'annule') {
            setLatestAlert({
              type: 'annule',
              message: `⚠️ Le rendez-vous chez "${appt.salonNom || 'votre salon'}" a été annulé.`,
              timestamp: Date.now()
            });
          }
          loadData();
        }
      }
    };

    window.addEventListener('beauty-appointment-status-change' as any, handleStatusChangeEvent);

    return () => {
      unsubscribe();
      window.removeEventListener('beauty-appointment-status-change' as any, handleStatusChangeEvent);
    };
  }, [clientId, clientPhone]);

  const handleCancelAppointment = async (appt: BeautyAppointment) => {
    if (!window.confirm(`Êtes-vous sûr(e) de vouloir annuler votre rendez-vous chez "${appt.salonNom}" ?`)) {
      return;
    }

    setCancellingId(appt.id);
    try {
      await updateAppointmentStatus(appt.id, 'annule', 'Annulé par le client');
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: "Rendez-vous annulé.", type: "info" }
      }));
      await loadData();
    } catch (e: any) {
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: "Erreur lors de l'annulation: " + (e.message || ''), type: "error" }
      }));
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-950 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-900 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white">
              Mes Rendez-vous Beauté & Salons
            </h3>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
              Suivi en temps réel de vos soins, coupes et prestations
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all cursor-pointer"
          title="Actualiser les rendez-vous"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-rose-600' : ''}`} />
        </button>
      </div>

      {/* Realtime Alert Banner if status just changed */}
      {latestAlert && (
        <div className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
          latestAlert.type === 'confirme'
            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800'
        }`}>
          <div className="flex items-center gap-2.5">
            {latestAlert.type === 'confirme' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-bold">{latestAlert.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setLatestAlert(null)}
            className="text-[10px] font-black uppercase text-gray-400 hover:text-gray-600"
          >
            Fermer
          </button>
        </div>
      )}

      {loading && appointments.length === 0 ? (
        <div className="py-6 text-center text-xs text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1.5 text-rose-500" />
          Chargement de vos rendez-vous...
        </div>
      ) : appointments.length === 0 ? (
        <div className="p-6 text-center bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2">
          <Scissors className="w-8 h-8 text-rose-300 dark:text-rose-800 mx-auto" />
          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
            Aucun rendez-vous beauté programmé.
          </p>
          <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
            Découvrez nos salons partenaires (coiffure, barbier, spa, onglerie) et réservez votre créneau en 1 clic.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map(appt => {
            const isConfirmed = appt.statut === 'confirme';
            const isPending = appt.statut === 'en_attente';
            const isCancelled = appt.statut === 'annule';
            const isFinished = appt.statut === 'termine';

            return (
              <div
                key={appt.id}
                className="p-4 bg-gray-50/80 dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col gap-3 hover:border-rose-200 dark:hover:border-rose-900/50 transition-all shadow-2xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 font-bold">
                      <Scissors className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-xs text-gray-900 dark:text-white truncate">
                        {appt.salonNom || 'Salon de Beauté'}
                      </h4>
                      <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-0.5">
                        <Sparkles size={11} /> {appt.serviceNom || 'Prestation Beauté'}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-500 dark:text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1 font-bold text-gray-800 dark:text-gray-200">
                          <Calendar size={11} className="text-orange-500" /> {appt.dateRdv}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-bold text-gray-800 dark:text-gray-200">
                          <Clock size={11} className="text-orange-500" /> {appt.heureRdv}
                        </span>
                        {appt.aDomicile && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold">
                              <Home size={11} /> À domicile
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      isConfirmed ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' :
                      isPending ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800' :
                      isFinished ? 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800' :
                      'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                    }`}>
                      {isConfirmed && <CheckCircle2 size={11} />}
                      {isPending && <Clock size={11} />}
                      {isCancelled && <XCircle size={11} />}
                      {isConfirmed ? 'Confirmé' : isPending ? 'En attente' : isFinished ? 'Effectué' : 'Annulé'}
                    </span>
                  </div>
                </div>

                {/* Details & Notes */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-150 dark:border-gray-800/80 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 font-bold">
                    <span className="text-gray-400 font-normal">Tarif :</span>
                    <span>{(appt.prixTotalFcfa || 0).toLocaleString()} FCFA</span>
                  </div>

                  {appt.notesSalon && (
                    <div className="text-[11px] text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-800">
                      Note salon : <span className="font-semibold">{appt.notesSalon}</span>
                    </div>
                  )}

                  {(isPending || isConfirmed) && (
                    <button
                      type="button"
                      onClick={() => handleCancelAppointment(appt)}
                      disabled={cancellingId === appt.id}
                      className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
                    >
                      {cancellingId === appt.id ? 'Annulation...' : 'Annuler le RDV'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
