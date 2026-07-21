import React, { useState } from 'react';
import { useAppStore } from '../store';
import { X, Calendar, Clock, Users, MessageSquare, Check, Ban, AlertCircle, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';

interface ReservationsDashboardProps {
  establishmentId: string;
  onClose: () => void;
}

export function ReservationsDashboard({ establishmentId, onClose }: ReservationsDashboardProps) {
  const { reservations, updateReservationStatus, establishments } = useAppStore();
  const [filterStatus, setFilterStatus] = useState<string>('tous');
  const [filterDate, setFilterDate] = useState<string>('');
  
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectMessage, setRejectMessage] = useState<string>('');

  const est = establishments.find(e => e.id === establishmentId);

  const establishmentReservations = reservations
    ? reservations.filter(r => r.establishmentId === establishmentId)
    : [];

  const sortedReservations = [...establishmentReservations].sort((a, b) => {
    return new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime();
  });

  const filteredReservations = sortedReservations.filter(res => {
    const matchStatus = filterStatus === 'tous' || res.status === filterStatus;
    const matchDate = !filterDate || res.date === filterDate;
    return matchStatus && matchDate;
  });

  const handleConfirm = async (id: string) => {
    try {
      await updateReservationStatus(id, 'confirmee');
    } catch (err) {
      console.error("Erreur confirmation réservation:", err);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingId) return;
    try {
      await updateReservationStatus(rejectingId, 'refusee', rejectMessage.trim() || undefined);
      setRejectingId(null);
      setRejectMessage('');
    } catch (err) {
      console.error("Erreur rejet réservation:", err);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Set clean styling
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(220, 95, 0); // Orange primary
    doc.text("LISTE DES CLIENTS ATTENDUS", 14, 20);

    doc.setFontSize(12);
    doc.setTextColor(50, 50, 50);
    doc.text(`Etablissement : ${est?.name || 'Restaurant'}`, 14, 28);
    
    const dateStr = filterDate 
      ? new Date(filterDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : "Toutes les dates";
    doc.text(`Date du rapport : ${dateStr}`, 14, 34);

    const statusMap: Record<string, string> = {
      tous: "Tous les statuts",
      en_attente: "En attente",
      confirmee: "Confirmee",
      refusee: "Refusee",
      annulee: "Annulee"
    };
    const statusStr = statusMap[filterStatus] || filterStatus;
    doc.text(`Filtre statut : ${statusStr}`, 14, 40);

    // Draw divider line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 44, 196, 44);

    // Table Headers
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    
    doc.text("Heure", 14, 52);
    doc.text("Client", 30, 52);
    doc.text("Couverts", 90, 52);
    doc.text("Telephone", 115, 52);
    doc.text("Statut", 150, 52);
    doc.text("Note / Motif", 175, 52);

    // Header line
    doc.line(14, 55, 196, 55);

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    let y = 62;
    let totalGuests = 0;
    
    filteredReservations.forEach((res) => {
      // Check page overflow
      if (y > 270) {
        doc.addPage();
        y = 20;
        doc.setFont("helvetica", "bold");
        doc.text("Suite de la liste des clients attendus", 14, y);
        y += 10;
        doc.setFont("helvetica", "normal");
      }

      doc.setFont("helvetica", "bold");
      doc.text(res.time || '--:--', 14, y);
      
      doc.setFont("helvetica", "normal");
      const nameLimit = res.clientName.substring(0, 25);
      doc.text(nameLimit, 30, y);
      
      doc.text(`${res.guestsCount} pers`, 90, y);
      doc.text(res.clientPhone || 'N/A', 115, y);
      
      const statusLabel = statusMap[res.status] || res.status;
      doc.text(statusLabel, 150, y);
      
      const notePreview = res.note ? res.note.substring(0, 12) : '';
      doc.text(notePreview, 175, y);

      totalGuests += res.guestsCount;
      y += 8;
    });

    // Footer summary
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y, 196, y);
    y += 8;
    doc.setFont("helvetica", "bold");
    doc.text(`Total clients attendus : ${totalGuests} personnes`, 14, y);

    doc.save(`reservations_${est?.name || 'restaurant'}_${filterDate || 'toutes_dates'}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-950 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-150 dark:border-gray-900 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/20">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white">Réservations de tables</h2>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-bold">{est?.name || 'Restaurant'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-[11px] uppercase tracking-wider rounded-xl cursor-pointer flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-3.5 h-3.5" /> Exporter en PDF
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-900 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-900 bg-gray-50/30 dark:bg-gray-900/10 grid grid-cols-1 sm:grid-cols-2 gap-3 flex-shrink-0">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Filtrer par statut</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-orange-500/20"
            >
              <option value="tous">Tous les statuts ({establishmentReservations.length})</option>
              <option value="en_attente">En attente ({establishmentReservations.filter(r => r.status === 'en_attente').length})</option>
              <option value="confirmee">Confirmées ({establishmentReservations.filter(r => r.status === 'confirmee').length})</option>
              <option value="refusee">Refusées ({establishmentReservations.filter(r => r.status === 'refusee').length})</option>
              <option value="annulee">Annulées ({establishmentReservations.filter(r => r.status === 'annulee').length})</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">Filtrer par date</label>
            <div className="relative">
              <input
                type="date"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none focus:ring-2 focus:ring-orange-500/20"
              />
              {filterDate && (
                <button 
                  onClick={() => setFilterDate('')}
                  className="absolute right-2.5 top-2 text-[10px] text-orange-600 font-bold hover:underline"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {filteredReservations.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/30 border border-gray-150 dark:border-gray-900 rounded-2xl">
              <AlertCircle className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 font-bold">Aucune réservation trouvée.</p>
              <p className="text-xs text-gray-400 font-medium">Modifiez vos filtres ou attendez de nouvelles demandes.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredReservations.map(res => {
                const isPending = res.status === 'en_attente';

                return (
                  <div 
                    key={res.id} 
                    className={`p-4 rounded-2xl border transition-all ${
                      isPending 
                        ? 'bg-amber-50/20 border-amber-200/50 dark:bg-amber-950/5 dark:border-amber-900/30' 
                        : 'bg-gray-50/50 border-gray-150 dark:bg-gray-900/20 dark:border-gray-900'
                    } flex flex-col gap-3.5`}
                  >
                    {/* Top Row: Client Info & Badge */}
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-black text-gray-900 dark:text-white text-sm">{res.clientName}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-bold mt-0.5">{res.clientPhone || 'Pas de numéro enregistré'}</p>
                      </div>

                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                        res.status === 'en_attente' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        res.status === 'confirmee' ? 'bg-green-50 text-green-700 border-green-200' :
                        res.status === 'refusee' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-gray-100 text-gray-600 border-gray-250'
                      }`}>
                        {res.status === 'en_attente' ? 'En attente' :
                         res.status === 'confirmee' ? 'Confirmée' :
                         res.status === 'refusee' ? 'Refusée' : 'Annulée'}
                      </span>
                    </div>

                    {/* Mid Row: Date, Guests, Note */}
                    <div className="grid grid-cols-2 gap-3 bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-150 dark:border-gray-900/50">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <div>
                          <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400">Date & Heure</p>
                          <p className="text-xs font-black text-gray-800 dark:text-gray-200">
                            {new Date(res.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à {res.time}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <div>
                          <p className="text-[9px] uppercase tracking-wider font-bold text-gray-400">Couverts</p>
                          <p className="text-xs font-black text-gray-800 dark:text-gray-200">{res.guestsCount} personnes</p>
                        </div>
                      </div>
                    </div>

                    {res.note && (
                      <div className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900/30 p-2.5 rounded-lg border border-gray-150 dark:border-gray-900">
                        <span className="text-[10px] font-bold text-gray-400 block uppercase mb-0.5">Note du client :</span>
                        "{res.note}"
                      </div>
                    )}

                    {res.managerMessage && (
                      <div className="text-xs text-orange-800 dark:text-orange-300 bg-orange-50/50 dark:bg-orange-950/10 p-2.5 rounded-lg border border-orange-100 dark:border-orange-900/50">
                        <span className="text-[10px] font-bold text-orange-600 block uppercase mb-0.5">Votre message :</span>
                        {res.managerMessage}
                      </div>
                    )}

                    {/* Actions */}
                    {isPending && rejectingId !== res.id && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setRejectingId(res.id)}
                          className="px-3.5 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700 font-bold text-[11px] uppercase tracking-wide rounded-xl active:scale-[0.98] transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Ban className="w-3.5 h-3.5" /> Refuser
                        </button>
                        <button
                          onClick={() => handleConfirm(res.id)}
                          className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white font-bold text-[11px] uppercase tracking-wide rounded-xl active:scale-[0.98] transition-all shadow-md shadow-green-600/10 flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" /> Confirmer
                        </button>
                      </div>
                    )}

                    {rejectingId === res.id && (
                      <form onSubmit={handleRejectSubmit} className="bg-red-50/40 dark:bg-red-950/10 p-3 rounded-xl border border-red-150 dark:border-red-950 space-y-2">
                        <label className="text-[10px] font-black uppercase text-red-700 dark:text-red-400">Motif du refus (optionnel)</label>
                        <textarea
                          rows={2}
                          placeholder="Ex: Restaurant complet, fermé exceptionnellement..."
                          value={rejectMessage}
                          onChange={e => setRejectMessage(e.target.value)}
                          className="w-full bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900 rounded-xl px-3 py-2 text-xs font-medium text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingId(null);
                              setRejectMessage('');
                            }}
                            className="px-3 py-1 bg-white border border-gray-200 text-gray-600 font-bold text-[10px] uppercase rounded-lg"
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] uppercase rounded-lg shadow-sm"
                          >
                            Valider le refus
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
