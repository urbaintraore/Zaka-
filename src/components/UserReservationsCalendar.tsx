import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Users, 
  MapPin, 
  MessageSquare, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  CalendarDays,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Reservation, Establishment } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface UserReservationsCalendarProps {
  reservations: Reservation[];
  establishments: Establishment[];
  onStartChat?: (estId: string, estName: string, ownerId: string) => void;
  onCancelReservation?: (reservationId: string) => void;
  onExplore?: () => void;
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function UserReservationsCalendar({
  reservations,
  establishments,
  onStartChat,
  onCancelReservation,
  onExplore
}: UserReservationsCalendarProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const todayStr = useMemo(() => {
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [today]);

  // Current calendar view month/year
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    triggerHaptic('light');
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    triggerHaptic('light');
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    triggerHaptic('medium');
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(todayStr);
  };

  // Build reservations map by date YYYY-MM-DD
  const reservationsByDate = useMemo(() => {
    const map: Record<string, Reservation[]> = {};
    for (const res of reservations) {
      if (!res.date) continue;
      // Normalise date string YYYY-MM-DD
      const d = res.date.slice(0, 10);
      if (!map[d]) {
        map[d] = [];
      }
      map[d].push(res);
    }
    return map;
  }, [reservations]);

  // Helper to check if a reservation is passed
  const isReservationPassed = (res: Reservation) => {
    try {
      const resDateTime = new Date(`${res.date}T${res.time || '00:00'}`);
      return resDateTime < new Date();
    } catch {
      return false;
    }
  };

  // Calendar days calculation
  const calendarGrid = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // 0 = Sun, 1 = Mon ...
    const firstDayIndexRaw = new Date(year, month, 1).getDay();
    const firstDayIndex = firstDayIndexRaw === 0 ? 6 : firstDayIndexRaw - 1; // Mon = 0, Sun = 6

    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: {
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      reservations: Reservation[];
    }[] = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const mm = String(prevM + 1).padStart(2, '0');
      const dd = String(dayNum).padStart(2, '0');
      const dStr = `${prevY}-${mm}-${dd}`;
      cells.push({
        dayNumber: dayNum,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        reservations: reservationsByDate[dStr] || []
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dStr = `${year}-${mm}-${dd}`;
      cells.push({
        dayNumber: day,
        dateStr: dStr,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        reservations: reservationsByDate[dStr] || []
      });
    }

    // Trailing days to complete the 7-column grid (up to 35 or 42 cells)
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const mm = String(nextM + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dStr = `${nextY}-${mm}-${dd}`;
      cells.push({
        dayNumber: day,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        reservations: reservationsByDate[dStr] || []
      });
    }

    return cells;
  }, [year, month, reservationsByDate, todayStr]);

  // Reservations in current selected month
  const currentMonthReservations = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return reservations.filter(r => r.date && r.date.startsWith(prefix));
  }, [reservations, year, month]);

  // Summary counts
  const stats = useMemo(() => {
    let upcomingCount = 0;
    let pastCount = 0;
    let pendingCount = 0;

    for (const r of currentMonthReservations) {
      const passed = isReservationPassed(r);
      if (r.status === 'en_attente') {
        pendingCount++;
      }
      if (!passed && r.status !== 'annulee' && r.status !== 'refusee') {
        upcomingCount++;
      } else {
        pastCount++;
      }
    }

    return {
      total: currentMonthReservations.length,
      upcomingCount,
      pastCount,
      pendingCount
    };
  }, [currentMonthReservations]);

  // Filtered displayed reservations for the list below
  const displayedReservations = useMemo(() => {
    let list: Reservation[];

    if (selectedDateStr) {
      list = reservationsByDate[selectedDateStr] || [];
    } else {
      // If no specific date selected, show all for current month, sorted by date
      list = currentMonthReservations;
    }

    // Apply status filter
    return list.filter(res => {
      const passed = isReservationPassed(res);
      if (statusFilter === 'upcoming') {
        return !passed && res.status !== 'annulee' && res.status !== 'refusee';
      }
      if (statusFilter === 'past') {
        return passed || res.status === 'annulee' || res.status === 'refusee';
      }
      return true;
    }).sort((a, b) => {
      return new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime();
    });
  }, [selectedDateStr, reservationsByDate, currentMonthReservations, statusFilter]);

  const handleDayClick = (dateStr: string) => {
    triggerHaptic('light');
    if (selectedDateStr === dateStr) {
      setSelectedDateStr(null); // toggle off
    } else {
      setSelectedDateStr(dateStr);
    }
  };

  const getStatusBadge = (res: Reservation) => {
    const passed = isReservationPassed(res);

    if (res.status === 'confirmee' && !passed) {
      return (
        <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Confirmée
        </span>
      );
    }
    if (res.status === 'en_attente') {
      return (
        <span className="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-500" /> En attente
        </span>
      );
    }
    if (passed && res.status === 'confirmee') {
      return (
        <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-blue-500" /> Terminée
        </span>
      );
    }
    if (res.status === 'refusee') {
      return (
        <span className="bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
          <X className="w-3 h-3 text-rose-500" /> Refusée
        </span>
      );
    }
    return (
      <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
        Annulée
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Interactive Calendar Card */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-5 shadow-xs transition-all">
        {/* Header navigation */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 dark:text-white capitalize leading-tight">
                {MONTH_NAMES[month]} {year}
              </h3>
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">
                {stats.total} réservation{stats.total > 1 ? 's' : ''} ce mois-ci
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
              title="Aller à aujourd'hui"
            >
              Aujourd'hui
            </button>
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              title="Mois précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              title="Mois suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Month Quick Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl p-2 text-center">
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 block">À venir</span>
            <span className="text-base font-black text-emerald-800 dark:text-emerald-300">{stats.upcomingCount}</span>
          </div>
          <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 rounded-2xl p-2 text-center">
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 block">En attente</span>
            <span className="text-base font-black text-amber-800 dark:text-amber-300">{stats.pendingCount}</span>
          </div>
          <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-2 text-center">
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 block">Passées</span>
            <span className="text-base font-black text-blue-800 dark:text-blue-300">{stats.pastCount}</span>
          </div>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {DAYS_OF_WEEK.map((d, i) => (
            <div key={d} className={`text-[10px] font-black uppercase py-1 ${i >= 5 ? 'text-orange-500/80' : 'text-gray-400 dark:text-gray-500'}`}>
              {d}
            </div>
          ))}
        </div>

        {/* Calendar Grid Cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarGrid.map((cell, idx) => {
            const isSelected = selectedDateStr === cell.dateStr;
            const hasReservations = cell.reservations.length > 0;

            // Determine dot colors
            const hasConfirmedUpcoming = cell.reservations.some(r => r.status === 'confirmee' && !isReservationPassed(r));
            const hasPending = cell.reservations.some(r => r.status === 'en_attente');
            const hasPassed = cell.reservations.some(r => isReservationPassed(r) && r.status === 'confirmee');

            return (
              <button
                key={`${cell.dateStr}-${idx}`}
                type="button"
                onClick={() => handleDayClick(cell.dateStr)}
                className={`min-h-[44px] sm:min-h-[48px] p-1 rounded-xl flex flex-col items-center justify-between transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-orange-600 text-white font-black shadow-md shadow-orange-600/20 ring-2 ring-orange-500/50 scale-[1.02] z-10'
                    : cell.isToday
                    ? 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 font-extrabold border border-orange-200 dark:border-orange-850'
                    : cell.isCurrentMonth
                    ? 'hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-800 dark:text-gray-200'
                    : 'text-gray-300 dark:text-gray-600 hover:bg-gray-50/40 dark:hover:bg-gray-850/30'
                }`}
              >
                <div className="flex items-center justify-center w-full">
                  <span className={`text-xs ${isSelected ? 'text-white font-black' : cell.isToday ? 'font-black' : 'font-medium'}`}>
                    {cell.dayNumber}
                  </span>
                </div>

                {/* Reservation status dots */}
                <div className="flex items-center justify-center gap-0.5 min-h-[6px] w-full mt-0.5">
                  {hasReservations && (
                    <>
                      {hasConfirmedUpcoming && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`} />
                      )}
                      {hasPending && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/80' : 'bg-amber-400'}`} />
                      )}
                      {hasPassed && !hasConfirmedUpcoming && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/70' : 'bg-blue-400'}`} />
                      )}
                      {cell.reservations.length > 1 && (
                        <span className={`text-[8px] font-black leading-none ${isSelected ? 'text-white' : 'text-orange-600 dark:text-orange-400'}`}>
                          +{cell.reservations.length}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-3 mt-3 border-t border-gray-100 dark:border-gray-800 text-[10px] text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Confirmée</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>En attente</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>Terminée</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-orange-500 bg-orange-100 dark:bg-orange-950" />
            <span>Aujourd'hui</span>
          </div>
        </div>
      </div>

      {/* Selected day or Month reservation list */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-orange-500" />
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
              {selectedDateStr ? (
                <>
                  Réservations du {new Date(selectedDateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </>
              ) : (
                <>Toutes les réservations de {MONTH_NAMES[month]} {year}</>
              )}
            </h4>
          </div>

          <div className="flex items-center gap-1.5">
            {selectedDateStr && (
              <button
                type="button"
                onClick={() => setSelectedDateStr(null)}
                className="text-[11px] font-extrabold text-orange-600 hover:text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 transition-colors cursor-pointer"
              >
                Voir tout le mois
              </button>
            )}

            {/* Filter pills */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl text-[10px] font-extrabold">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${statusFilter === 'all' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs font-black' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Toutes
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('upcoming')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${statusFilter === 'upcoming' ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-black' : 'text-gray-500 dark:text-gray-400'}`}
              >
                À venir
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('past')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${statusFilter === 'past' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-xs font-black' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Historique
              </button>
            </div>
          </div>
        </div>

        {displayedReservations.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 text-center shadow-xs">
            <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-500 mx-auto flex items-center justify-center mb-2">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {selectedDateStr
                ? `Aucune réservation pour le ${new Date(selectedDateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.`
                : `Aucune réservation correspondant aux critères pour ce mois.`}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
              Envie de sortir ou de réserver une table dans vos lieux préférés ?
            </p>
            {onExplore && (
              <button
                type="button"
                onClick={onExplore}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Découvrir les lieux</span>
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayedReservations.map(res => {
              const estDetail = establishments.find(e => e.id === res.establishmentId);
              const passed = isReservationPassed(res);
              const canCancel = res.status !== 'annulee' && res.status !== 'refusee' && !passed;

              return (
                <div
                  key={res.id}
                  className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-xs flex flex-col gap-3 transition-all hover:border-orange-200 dark:hover:border-orange-900/60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold text-base shrink-0">
                        🍽️
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                          {res.establishmentName}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-black uppercase tracking-wide bg-orange-100/50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded">
                            {res.guestsCount} pers.
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-orange-500" />
                            {new Date(res.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à {res.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {getStatusBadge(res)}
                    </div>
                  </div>

                  {/* Notes / details */}
                  {(res.allergiesOrDiet || res.note) && (
                    <div className="text-[11px] bg-gray-50 dark:bg-gray-800/40 rounded-xl p-2 space-y-0.5 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300">
                      {res.allergiesOrDiet && (
                        <p><strong className="text-amber-700 dark:text-amber-400">Régime/Allergies :</strong> {res.allergiesOrDiet}</p>
                      )}
                      {res.note && (
                        <p><strong className="text-gray-500 dark:text-gray-400">Note :</strong> {res.note}</p>
                      )}
                    </div>
                  )}

                  {/* Manager message */}
                  {res.managerMessage && (
                    <div className="text-[11px] bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-xl p-2 text-amber-800 dark:text-amber-300">
                      <strong>Message du gérant :</strong> {res.managerMessage}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-gray-800">
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">
                      Réf: #{res.id.slice(-6).toUpperCase()}
                    </div>

                    <div className="flex items-center gap-2">
                      {estDetail && onStartChat && (
                        <button
                          type="button"
                          onClick={() => onStartChat(res.establishmentId, estDetail.name, estDetail.ownerId)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 rounded-lg transition-colors cursor-pointer"
                          title="Envoyer un message au responsable"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Discuter</span>
                        </button>
                      )}

                      {canCancel && onCancelReservation && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Êtes-vous sûr de vouloir annuler cette réservation ?")) {
                              triggerHaptic('warning');
                              onCancelReservation(res.id);
                            }
                          }}
                          className="text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                        >
                          Annuler
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
