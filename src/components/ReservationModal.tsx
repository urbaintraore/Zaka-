import React, { useState } from 'react';
import { X, Calendar, Clock, Users, FileText, Send, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [guests, setGuests] = useState(2);
  const [details, setDetails] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Custom interactive calendar states
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  const monthNames = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];

  const daysOfWeek = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => {
    const day = new Date(y, m, 1).getDay();
    // Align so Mon = 0, Sun = 6
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  const handlePrevMonth = () => {
    setCurrentCalendarDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentCalendarDate(new Date(year, month + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    setSelectedDate(`${year}-${mm}-${dd}`);
  };

  const timeSlots = [
    "12:00", "13:00", "14:00", "16:00", "18:00", "19:00", "19:30", "20:00", "20:30", "21:00", "22:00", "23:00"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;
    onSubmit({ 
      reservationType, 
      date: selectedDate, 
      time: selectedTime, 
      guests, 
      details 
    });
    setSubmitted(true);
    setTimeout(() => onClose(), 2000);
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md p-8 flex flex-col items-center justify-center text-center shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-950/50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Demande envoyée !</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">L'établissement {establishmentName} a bien reçu votre demande de table et vous répondra sous peu.</p>
        </div>
      </div>
    );
  }

  // Generate calendar cells
  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(<div key={`empty-${i}`} className="h-9" />);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(year, month, day);
    const isPast = cellDate < today;
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const cellDateStr = `${year}-${mm}-${dd}`;
    const isSelected = selectedDate === cellDateStr;

    calendarCells.push(
      <button
        key={`day-${day}`}
        type="button"
        disabled={isPast}
        onClick={() => handleDateSelect(day)}
        className={`h-9 w-9 text-xs font-bold rounded-xl flex items-center justify-center transition-all cursor-pointer ${
          isPast 
            ? 'text-gray-300 dark:text-gray-700 cursor-not-allowed line-through' 
            : isSelected 
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20' 
              : 'text-gray-800 dark:text-gray-200 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:text-orange-600 dark:hover:text-orange-400'
        }`}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-gray-950 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-900 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/30 flex-shrink-0">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white leading-tight">Réserver une table</h2>
            <p className="text-xs text-orange-600 dark:text-orange-400 font-bold">{establishmentName}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Reservation Type */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">Type de réservation</label>
            <div className="grid grid-cols-2 gap-2">
              {['seul', 'en famille', 'entre ami(e)s', 'anniversaire'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setReservationType(type)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    reservationType === type 
                      ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/20 dark:border-orange-900 dark:text-orange-400 shadow-sm' 
                      : 'bg-white border-gray-200 text-gray-600 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <span className="capitalize">{type}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Interactive Calendar */}
          <div className="space-y-2">
            <label className="text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Choisir une date
            </label>
            <div className="bg-gray-50 dark:bg-gray-900/60 border border-gray-150 dark:border-gray-900 p-4 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-black text-gray-800 dark:text-white capitalize">
                  {monthNames[month]} {year}
                </span>
                <div className="flex items-center gap-1">
                  <button 
                    type="button"
                    onClick={handlePrevMonth}
                    disabled={month === today.getMonth() && year === today.getFullYear()}
                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 gap-1 text-center mb-1">
                {daysOfWeek.map(day => (
                  <span key={day} className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">
                    {day}
                  </span>
                ))}
              </div>

              {/* Grid of Days */}
              <div className="grid grid-cols-7 gap-1 justify-items-center">
                {calendarCells}
              </div>
            </div>
            {selectedDate && (
              <p className="text-xs text-orange-600 dark:text-orange-400 font-bold ml-1">
                Date sélectionnée : {new Date(selectedDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            )}
          </div>

          {/* Custom Time Slot Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Choisir une heure
            </label>
            <div className="grid grid-cols-4 gap-2">
              {timeSlots.map(time => {
                const isSelected = selectedTime === time;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-orange-600 border-orange-600 text-white shadow-md shadow-orange-600/10'
                        : 'bg-white border-gray-200 text-gray-700 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Guest Count */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Nombre de couverts (places)
            </label>
            <div className="flex items-center">
              <input 
                type="range" 
                min="1" 
                max="30" 
                value={guests}
                onChange={e => setGuests(parseInt(e.target.value))}
                className="flex-1 accent-orange-600"
              />
              <span className="ml-4 font-black text-gray-900 dark:text-white w-12 text-center bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 py-1 rounded-lg">
                {guests}
              </span>
            </div>
          </div>

          {/* Details / Order Info */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Instructions spéciales ou commande anticipée
            </label>
            <textarea 
              rows={3}
              placeholder="Ex: Près de la terrasse, ou déjà commander 2 bouteilles et poulet..."
              value={details}
              onChange={e => setDetails(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 dark:bg-gray-900 dark:border-gray-800 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all outline-none resize-none placeholder:text-gray-400"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={!selectedDate || !selectedTime}
            className="w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-black py-4 rounded-2xl active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-orange-600/10 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            Confirmer ma réservation
          </button>
        </form>
      </div>
    </div>
  );
}
