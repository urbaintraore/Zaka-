import React, { useState } from 'react';
import { X, Calendar, Clock, Users, FileText, Send, CheckCircle2 } from 'lucide-react';

interface ReservationModalProps {
  establishmentName: string;
  onClose: () => void;
  onSubmit: (data: {
    reservationType: string;
    date: string;
    time: string;
    guests: number;
    details: string;
  }) => void;
}

export function ReservationModal({ establishmentName, onClose, onSubmit }: ReservationModalProps) {
  const [reservationType, setReservationType] = useState('en famille');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState(2);
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time) return;
    onSubmit({ reservationType, date, time, guests, details });
    setSubmitted(true);
    setTimeout(() => onClose(), 2000);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
        <div className="bg-white rounded-3xl w-full max-w-md p-8 flex flex-col items-center justify-center text-center shadow-2xl animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-black text-gray-900 mb-2">Demande envoyée !</h2>
          <p className="text-sm text-gray-500 font-medium">L'établissement {establishmentName} a bien reçu votre demande et vous répondra sous peu.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
          <div>
            <h2 className="text-lg font-black text-gray-900 leading-tight">Réserver</h2>
            <p className="text-xs text-orange-600 font-bold">{establishmentName}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500">Type de réservation</label>
            <div className="grid grid-cols-2 gap-2">
              {['seul', 'en famille', 'entre ami(e)s', 'anniversaire'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setReservationType(type)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    reservationType === type 
                      ? 'bg-orange-50 border-orange-200 text-orange-700 shadow-sm' 
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="capitalize">{type}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> Date
              </label>
              <input 
                type="date" 
                required
                min={new Date().toISOString().split('T')[0]}
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Heure
              </label>
              <input 
                type="time" 
                required
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Nombre de places
            </label>
            <div className="flex items-center">
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={guests}
                onChange={e => setGuests(parseInt(e.target.value))}
                className="flex-1 accent-orange-600"
              />
              <span className="ml-4 font-black text-gray-900 w-12 text-center bg-orange-50 text-orange-700 py-1 rounded-lg">
                {guests}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Détails ou commande
            </label>
            <textarea 
              rows={3}
              placeholder="Ex: Je souhaite commander un gâteau, ou 2 poulets braisés à l'avance..."
              value={details}
              onChange={e => setDetails(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none resize-none"
            />
          </div>

          <button 
            type="submit"
            disabled={!date || !time}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white font-bold py-3.5 rounded-xl hover:bg-orange-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:hover:bg-orange-600"
          >
            <Send className="w-5 h-5" />
            Envoyer la demande
          </button>
        </form>
      </div>
    </div>
  );
}
