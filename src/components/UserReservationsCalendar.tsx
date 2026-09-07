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
  ArrowRight,
  Check,
  HelpCircle,
  XCircle,
  Share2,
  PartyPopper
} from 'lucide-react';
import { Reservation, Establishment, GroupOuting, User } from '../types';
import { triggerHaptic } from '../utils/haptics';

interface UserReservationsCalendarProps {
  reservations: Reservation[];
  groupOutings?: GroupOuting[];
  currentUser?: User | null;
  establishments: Establishment[];
  onStartChat?: (estId: string, estName: string, ownerId: string) => void;
  onCancelReservation?: (reservationId: string) => void;
  onRespondGroupOuting?: (outingId: string, status: 'je_viens' | 'peut_etre' | 'je_ne_peux_pas') => Promise<void>;
  onExplore?: () => void;
  onCreateGroupOuting?: () => void;
}

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS_OF_WEEK = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function UserReservationsCalendar({
  reservations,
  groupOutings = [],
  currentUser,
  establishments,
  onStartChat,
  onCancelReservation,
  onRespondGroupOuting,
  onExplore,
  onCreateGroupOuting
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
  const [typeFilter, setTypeFilter] = useState<'all' | 'reservations' | 'outings'>('all');
  const [respondingOutingId, setRespondingOutingId] = useState<string | null>(null);

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

  // Helper to check if a reservation is passed
  const isReservationPassed = (res: Reservation) => {
    try {
      const resDateTime = new Date(`${res.date}T${res.time || '00:00'}`);
      return resDateTime < new Date();
    } catch {
      return false;
    }
  };

  // Helper to check if a group outing is passed
  const isOutingPassed = (outing: GroupOuting) => {
    try {
      const outingDateTime = new Date(`${outing.date}T${outing.time || '00:00'}`);
      return outingDateTime < new Date();
    } catch {
      return false;
    }
  };

  // Filter relevant group outings (created by user or where user is in responses / invited)
  const myGroupOutings = useMemo(() => {
    if (!currentUser) return groupOutings;
    return groupOutings.filter(o => 
      o.creatorId === currentUser.id || 
      (o.responses && o.responses.some(r => r.userId === currentUser.id))
    );
  }, [groupOutings, currentUser]);

  // Build items map by date YYYY-MM-DD
  const eventsByDate = useMemo(() => {
    const map: Record<string, { reservations: Reservation[]; outings: GroupOuting[] }> = {};
    
    for (const res of reservations) {
      if (!res.date) continue;
      const d = res.date.slice(0, 10);
      if (!map[d]) map[d] = { reservations: [], outings: [] };
      map[d].reservations.push(res);
    }

    for (const outing of myGroupOutings) {
      if (!outing.date) continue;
      const d = outing.date.slice(0, 10);
      if (!map[d]) map[d] = { reservations: [], outings: [] };
      map[d].outings.push(outing);
    }

    return map;
  }, [reservations, myGroupOutings]);

  // Calendar days calculation
  const calendarGrid = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayIndexRaw = new Date(year, month, 1).getDay();
    const firstDayIndex = firstDayIndexRaw === 0 ? 6 : firstDayIndexRaw - 1; // Mon = 0, Sun = 6
    const prevMonthDays = new Date(year, month, 0).getDate();

    const cells: {
      dayNumber: number;
      dateStr: string;
      isCurrentMonth: boolean;
      isToday: boolean;
      reservations: Reservation[];
      outings: GroupOuting[];
    }[] = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevM = month === 0 ? 11 : month - 1;
      const prevY = month === 0 ? year - 1 : year;
      const mm = String(prevM + 1).padStart(2, '0');
      const dd = String(dayNum).padStart(2, '0');
      const dStr = `${prevY}-${mm}-${dd}`;
      const dayData = eventsByDate[dStr] || { reservations: [], outings: [] };
      cells.push({
        dayNumber: dayNum,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        reservations: dayData.reservations,
        outings: dayData.outings
      });
    }

    // Days in current month
    for (let day = 1; day <= daysInMonth; day++) {
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dStr = `${year}-${mm}-${dd}`;
      const dayData = eventsByDate[dStr] || { reservations: [], outings: [] };
      cells.push({
        dayNumber: day,
        dateStr: dStr,
        isCurrentMonth: true,
        isToday: dStr === todayStr,
        reservations: dayData.reservations,
        outings: dayData.outings
      });
    }

    // Trailing days to complete the 7-column grid
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextM = month === 11 ? 0 : month + 1;
      const nextY = month === 11 ? year + 1 : year;
      const mm = String(nextM + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dStr = `${nextY}-${mm}-${dd}`;
      const dayData = eventsByDate[dStr] || { reservations: [], outings: [] };
      cells.push({
        dayNumber: day,
        dateStr: dStr,
        isCurrentMonth: false,
        isToday: dStr === todayStr,
        reservations: dayData.reservations,
        outings: dayData.outings
      });
    }

    return cells;
  }, [year, month, eventsByDate, todayStr]);

  // Events in current selected month
  const currentMonthEvents = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const resList = reservations.filter(r => r.date && r.date.startsWith(prefix));
    const outingList = myGroupOutings.filter(o => o.date && o.date.startsWith(prefix));
    return { reservations: resList, outings: outingList };
  }, [reservations, myGroupOutings, year, month]);

  // Summary stats
  const stats = useMemo(() => {
    let upcomingCount = 0;
    let pastCount = 0;
    let invitationsCount = 0;

    for (const r of currentMonthEvents.reservations) {
      const passed = isReservationPassed(r);
      if (!passed && r.status !== 'annulee' && r.status !== 'refusee') {
        upcomingCount++;
      } else {
        pastCount++;
      }
    }

    for (const o of currentMonthEvents.outings) {
      const passed = isOutingPassed(o);
      if (currentUser && o.creatorId !== currentUser.id) {
        invitationsCount++;
      }
      if (!passed) {
        upcomingCount++;
      } else {
        pastCount++;
      }
    }

    return {
      totalReservations: currentMonthEvents.reservations.length,
      totalOutings: currentMonthEvents.outings.length,
      total: currentMonthEvents.reservations.length + currentMonthEvents.outings.length,
      upcomingCount,
      pastCount,
      invitationsCount
    };
  }, [currentMonthEvents, currentUser]);

  // Filtered displayed items for selected day or month
  const displayedItems = useMemo(() => {
    let resList: Reservation[] = [];
    let outList: GroupOuting[] = [];

    if (selectedDateStr) {
      const dayData = eventsByDate[selectedDateStr] || { reservations: [], outings: [] };
      resList = dayData.reservations;
      outList = dayData.outings;
    } else {
      resList = currentMonthEvents.reservations;
      outList = currentMonthEvents.outings;
    }

    if (typeFilter === 'reservations') {
      outList = [];
    } else if (typeFilter === 'outings') {
      resList = [];
    }

    const filteredRes = resList.filter(res => {
      const passed = isReservationPassed(res);
      if (statusFilter === 'upcoming') {
        return !passed && res.status !== 'annulee' && res.status !== 'refusee';
      }
      if (statusFilter === 'past') {
        return passed || res.status === 'annulee' || res.status === 'refusee';
      }
      return true;
    });

    const filteredOutings = outList.filter(o => {
      const passed = isOutingPassed(o);
      if (statusFilter === 'upcoming') {
        return !passed;
      }
      if (statusFilter === 'past') {
        return passed;
      }
      return true;
    });

    return {
      reservations: filteredRes.sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime()),
      outings: filteredOutings.sort((a, b) => new Date(`${b.date}T${b.time || '00:00'}`).getTime() - new Date(`${a.date}T${a.time || '00:00'}`).getTime())
    };
  }, [selectedDateStr, eventsByDate, currentMonthEvents, typeFilter, statusFilter]);

  const handleDayClick = (dateStr: string) => {
    triggerHaptic('light');
    if (selectedDateStr === dateStr) {
      setSelectedDateStr(null);
    } else {
      setSelectedDateStr(dateStr);
    }
  };

  const handleResponseSubmit = async (outingId: string, status: 'je_viens' | 'peut_etre' | 'je_ne_peux_pas') => {
    if (!onRespondGroupOuting) return;
    try {
      setRespondingOutingId(outingId);
      triggerHaptic('medium');
      await onRespondGroupOuting(outingId, status);
    } catch (err) {
      console.error("Erreur réponse sortie:", err);
    } finally {
      setRespondingOutingId(null);
    }
  };

  const getReservationStatusBadge = (res: Reservation) => {
    const passed = isReservationPassed(res);

    if (res.status === 'confirmee' && !passed) {
      return (
        <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Confirmée
        </span>
      );
    }
    if (res.status === 'en_attente') {
      return (
        <span className="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-500" /> En attente
        </span>
      );
    }
    if (passed && res.status === 'confirmee') {
      return (
        <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-blue-500" /> Terminée
        </span>
      );
    }
    if (res.status === 'refusee') {
      return (
        <span className="bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
          <X className="w-3 h-3 text-rose-500" /> Refusée
        </span>
      );
    }
    return (
      <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
        Annulée
      </span>
    );
  };

  const totalDisplayed = displayedItems.reservations.length + displayedItems.outings.length;

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
                {stats.total} sortie{stats.total > 1 ? 's' : ''} & réservation{stats.total > 1 ? 's' : ''} ce mois-ci
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
          <div className="bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 rounded-2xl p-2 text-center">
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 block">Invitations d'amis</span>
            <span className="text-base font-black text-purple-800 dark:text-purple-300">{stats.invitationsCount}</span>
          </div>
          <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl p-2 text-center">
            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 block">Historique</span>
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
            const hasOutings = cell.outings.length > 0;
            const hasEvents = hasReservations || hasOutings;

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

                {/* Event status dots */}
                <div className="flex items-center justify-center gap-0.5 min-h-[6px] w-full mt-0.5">
                  {hasEvents && (
                    <>
                      {hasReservations && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-orange-500'}`} title="Réservation de table" />
                      )}
                      {hasOutings && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-purple-600'}`} title="Sortie / Invitation d'amis" />
                      )}
                      {(cell.reservations.length + cell.outings.length) > 1 && (
                        <span className={`text-[8px] font-black leading-none ${isSelected ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                          +{cell.reservations.length + cell.outings.length}
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
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>Réservation de table</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-600" />
            <span>Invitation / Sortie de groupe</span>
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
                  Planning du {new Date(selectedDateStr).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </>
              ) : (
                <>Toutes les sorties de {MONTH_NAMES[month]} {year}</>
              )}
            </h4>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {selectedDateStr && (
              <button
                type="button"
                onClick={() => setSelectedDateStr(null)}
                className="text-[11px] font-extrabold text-orange-600 hover:text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded-lg bg-orange-50 dark:bg-orange-950/40 transition-colors cursor-pointer"
              >
                Voir tout le mois
              </button>
            )}

            {/* Type filter */}
            <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-xl text-[10px] font-extrabold">
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${typeFilter === 'all' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-xs font-black' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Tout
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('reservations')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${typeFilter === 'reservations' ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-xs font-black' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Tables
              </button>
              <button
                type="button"
                onClick={() => setTypeFilter('outings')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${typeFilter === 'outings' ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-xs font-black' : 'text-gray-500 dark:text-gray-400'}`}
              >
                Invitations d'amis
              </button>
            </div>

            {/* Status filter pills */}
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
                Passées
              </button>
            </div>
          </div>
        </div>

        {totalDisplayed === 0 ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl p-6 text-center shadow-xs">
            <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-950/50 text-orange-500 mx-auto flex items-center justify-center mb-2">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
              {selectedDateStr
                ? `Aucune sortie ni réservation pour le ${new Date(selectedDateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.`
                : `Aucun événement correspondant aux critères pour ce mois.`}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
              Envie de sortir entre amis ou de réserver une table dans vos lieux préférés ?
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              {onCreateGroupOuting && (
                <button
                  type="button"
                  onClick={onCreateGroupOuting}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Organiser une sortie</span>
                </button>
              )}
              {onExplore && (
                <button
                  type="button"
                  onClick={onExplore}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  <span>Découvrir les lieux</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* 1. Group Outing Invitations */}
            {displayedItems.outings.map(outing => {
              const isCreator = currentUser?.id === outing.creatorId;
              const userResponse = outing.responses?.find(r => r.userId === currentUser?.id);
              const myStatus = userResponse?.status;
              const passed = isOutingPassed(outing);

              const confirmedCount = outing.responses?.filter(r => r.status === 'je_viens').length || 0;
              const maybeCount = outing.responses?.filter(r => r.status === 'peut_etre').length || 0;
              const declinedCount = outing.responses?.filter(r => r.status === 'je_ne_peux_pas').length || 0;

              return (
                <div
                  key={outing.id}
                  className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-purple-100 dark:border-purple-900/40 shadow-xs flex flex-col gap-3 transition-all hover:border-purple-300 dark:hover:border-purple-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-amber-500 text-white flex items-center justify-center font-black text-base shrink-0 shadow-xs">
                        <PartyPopper className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded">
                            {isCreator ? 'Votre sortie' : `Invitation de ${outing.creatorName}`}
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate mt-0.5">
                          {outing.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          {outing.establishmentName && (
                            <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {outing.establishmentName}
                            </span>
                          )}
                          <span className="text-[11px] text-gray-500 dark:text-gray-400 font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3 text-purple-500" />
                            {new Date(outing.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à {outing.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status badge */}
                    <div className="shrink-0">
                      {isCreator ? (
                        <span className="bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          👑 Organisateur
                        </span>
                      ) : myStatus === 'je_viens' ? (
                        <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-500 stroke-[3]" /> Je viens
                        </span>
                      ) : myStatus === 'peut_etre' ? (
                        <span className="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-amber-500" /> Peut-être
                        </span>
                      ) : myStatus === 'je_ne_peux_pas' ? (
                        <span className="bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-500" /> Déclinée
                        </span>
                      ) : (
                        <span className="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          ⏳ En attente
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Note / Details */}
                  {outing.note && (
                    <div className="text-[11px] bg-purple-50/50 dark:bg-purple-950/20 rounded-xl p-2.5 border border-purple-100/60 dark:border-purple-900/30 text-gray-700 dark:text-gray-300">
                      <strong>Note :</strong> {outing.note}
                    </div>
                  )}

                  {/* Participants summary */}
                  <div className="flex items-center justify-between text-[11px] bg-gray-50 dark:bg-gray-800/40 px-3 py-1.5 rounded-xl border border-gray-100 dark:border-gray-800">
                    <span className="font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-purple-600" />
                      Participants ({outing.responses?.length || 0}) :
                    </span>
                    <div className="flex items-center gap-2 font-black text-[10px]">
                      <span className="text-emerald-600 dark:text-emerald-400">{confirmedCount} oui</span>
                      <span className="text-amber-600 dark:text-amber-400">{maybeCount} peut-être</span>
                      <span className="text-rose-600 dark:text-rose-400">{declinedCount} non</span>
                    </div>
                  </div>

                  {/* Interactive response actions: Confirmer ou Décliner */}
                  {!isCreator && !passed && onRespondGroupOuting && (
                    <div className="pt-2 border-t border-purple-50 dark:border-purple-900/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
                      <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Votre réponse à l'invitation :
                      </span>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={respondingOutingId === outing.id}
                          onClick={() => handleResponseSubmit(outing.id, 'je_viens')}
                          className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-black rounded-xl transition-all cursor-pointer ${
                            myStatus === 'je_viens'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirmer (Je viens)</span>
                        </button>

                        <button
                          type="button"
                          disabled={respondingOutingId === outing.id}
                          onClick={() => handleResponseSubmit(outing.id, 'peut_etre')}
                          className={`flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            myStatus === 'peut_etre'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                          }`}
                          title="Peut-être"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Peut-être</span>
                        </button>

                        <button
                          type="button"
                          disabled={respondingOutingId === outing.id}
                          onClick={() => handleResponseSubmit(outing.id, 'je_ne_peux_pas')}
                          className={`flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                            myStatus === 'je_ne_peux_pas'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                          }`}
                          title="Décliner"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Décliner</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 2. Restaurant Table Reservations */}
            {displayedItems.reservations.map(res => {
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
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-wider bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 px-2 py-0.5 rounded">
                            Réservation de table
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate mt-0.5">
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
                      {getReservationStatusBadge(res)}
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

