import React, { useState } from 'react';
import { GroupOuting, User } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, AlertTriangle, Users, CheckCircle2, HelpCircle, XCircle } from 'lucide-react';

interface GroupOutingCalendarProps {
  outings: GroupOuting[];
  currentUser: User | null;
  onSelectOuting: (outingId: string) => void;
}

export function GroupOutingCalendar({ outings, currentUser, onSelectOuting }: GroupOutingCalendarProps) {
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayLabels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  // Calculate calendar grid
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  // Convert Sunday (0) to 6, Monday (1) to 0 for European/Burkinabè calendar starting on Monday
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startingDayOfWeek < 0) startingDayOfWeek = 6;

  const daysInMonth = lastDayOfMonth.getDate();

  const prevMonthLastDay = new Date(year, month, 0).getDate();

  // Helper to format YYYY-MM-DD
  const formatDateString = (y: number, m: number, d: number) => {
    const mm = (m + 1).toString().padStart(2, '0');
    const dd = d.toString().padStart(2, '0');
    return `${y}-${mm}-${dd}`;
  };

  // Group outings by date YYYY-MM-DD
  const outingsByDate: Record<string, GroupOuting[]> = {};
  outings.forEach(outing => {
    if (!outingsByDate[outing.date]) {
      outingsByDate[outing.date] = [];
    }
    outingsByDate[outing.date].push(outing);
  });

  // Check scheduling conflicts across all outings
  // Conflict if 2+ outings on same day or within 2 hours
  const conflictsByDate: Record<string, { outing1: GroupOuting; outing2: GroupOuting }[]> = {};
  Object.entries(outingsByDate).forEach(([dateStr, list]) => {
    if (list.length >= 2) {
      conflictsByDate[dateStr] = [];
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const o1 = list[i];
          const o2 = list[j];
          conflictsByDate[dateStr].push({ outing1: o1, outing2: o2 });
        }
      }
    }
  });

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDateStr(today.toISOString().split('T')[0]);
  };

  const selectedDayOutings = outingsByDate[selectedDateStr] || [];
  const selectedDayConflicts = conflictsByDate[selectedDateStr] || [];

  return (
    <div className="space-y-5">
      {/* Calendar Header / Month Switcher */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-black text-slate-900 dark:text-white">
            {monthNames[month]} {year}
          </h3>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold">
            {outings.length} sortie(s)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleToday}
            className="px-3 py-1.5 text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-all"
          >
            Aujourd'hui
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
              title="Mois précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
              title="Mois suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Conflicts Overview Banner */}
      {Object.keys(conflictsByDate).length > 0 && (
        <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 rounded-2xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <p className="font-extrabold text-rose-800 dark:text-rose-300">
              Conflit(s) d'horaires détecté(s) ({Object.keys(conflictsByDate).length} date(s) concernée(s))
            </p>
            <p className="text-rose-700 dark:text-rose-400 font-medium">
              Plusieurs sorties de groupe sont programmées sur la même plage horaire ou le même jour. Vérifiez les dates surlignées en rouge dans le calendrier.
            </p>
          </div>
        </div>
      )}

      {/* Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 text-center mb-2">
          {dayLabels.map((day, idx) => (
            <div key={idx} className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1.5">
          {/* Previous month padding days */}
          {Array.from({ length: startingDayOfWeek }).map((_, idx) => {
            const prevDayNum = prevMonthLastDay - startingDayOfWeek + idx + 1;
            return (
              <div
                key={`prev-${idx}`}
                className="h-20 sm:h-24 p-1.5 bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100/50 dark:border-slate-800/30 rounded-xl text-slate-300 dark:text-slate-700 text-xs font-semibold"
              >
                {prevDayNum}
              </div>
            );
          })}

          {/* Current month days */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = formatDateString(year, month, dayNum);
            const dayOutings = outingsByDate[dateStr] || [];
            const hasConflict = !!conflictsByDate[dateStr];
            const isSelected = selectedDateStr === dateStr;

            const todayStr = new Date().toISOString().split('T')[0];
            const isToday = todayStr === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`h-20 sm:h-24 p-1.5 rounded-xl border text-left transition-all flex flex-col justify-between relative overflow-hidden group cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-amber-500 border-amber-500 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs'
                    : hasConflict
                    ? 'border-rose-300 dark:border-rose-800 bg-rose-50/40 dark:bg-rose-950/20'
                    : dayOutings.length > 0
                    ? 'border-amber-200 dark:border-amber-800/60 bg-amber-50/20 dark:bg-amber-950/10 hover:border-amber-400'
                    : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                {/* Day number & Today indicator */}
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs font-extrabold ${
                    isToday
                      ? 'w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[11px]'
                      : isSelected
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}>
                    {dayNum}
                  </span>

                  {hasConflict && (
                    <span className="text-[9px] font-extrabold px-1 bg-rose-500 text-white rounded-full flex items-center gap-0.5">
                      ⚠️ Conflit
                    </span>
                  )}
                </div>

                {/* Outing Badges */}
                <div className="space-y-1 w-full overflow-hidden">
                  {dayOutings.slice(0, 2).map((o) => (
                    <div
                      key={o.id}
                      className={`text-[9px] font-bold p-1 rounded-md truncate transition-all ${
                        hasConflict
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                          : 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100'
                      }`}
                      title={`${o.time} - ${o.title}`}
                    >
                      {o.time} {o.title}
                    </div>
                  ))}

                  {dayOutings.length > 2 && (
                    <p className="text-[9px] font-extrabold text-amber-600 dark:text-amber-400 pl-0.5">
                      +{dayOutings.length - 2} autre(s)
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Details Panel */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
              Sorties prévues le {new Date(selectedDateStr + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h4>
          </div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            {selectedDayOutings.length} sortie(s)
          </span>
        </div>

        {/* Conflict Warning for Selected Day */}
        {selectedDayConflicts.length > 0 && (
          <div className="p-3 bg-rose-100/70 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl space-y-1 text-xs">
            <p className="font-extrabold text-rose-800 dark:text-rose-200 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Attention : Risque de chevauchement d'horaires ce jour-là !
            </p>
            {selectedDayConflicts.map((c, idx) => (
              <p key={idx} className="text-rose-700 dark:text-rose-300 text-[11px] font-semibold pl-5">
                • "{c.outing1.title}" ({c.outing1.time}) et "{c.outing2.title}" ({c.outing2.time})
              </p>
            ))}
          </div>
        )}

        {selectedDayOutings.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 italic py-3 text-center">
            Aucune sortie de groupe programmée pour cette date.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {selectedDayOutings.map((outing) => {
              const myResponse = currentUser 
                ? (outing.responses || []).find(r => r.userId === currentUser.id)?.status 
                : null;

              const comingCount = (outing.responses || []).filter(r => r.status === 'je_viens').length;
              const maybeCount = (outing.responses || []).filter(r => r.status === 'peut_etre').length;
              const noCount = (outing.responses || []).filter(r => r.status === 'je_ne_peux_pas').length;

              return (
                <div
                  key={outing.id}
                  onClick={() => onSelectOuting(outing.id)}
                  className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 transition-all cursor-pointer space-y-2 shadow-2xs group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                        {outing.time}
                      </span>
                      <h5 className="font-extrabold text-xs text-slate-900 dark:text-white mt-1 group-hover:text-amber-600 transition-colors">
                        {outing.title}
                      </h5>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center gap-1 font-medium">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    {outing.establishmentName || 'Lieu non spécifié'}
                  </p>

                  <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Par {outing.creatorName}
                    </span>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className="text-emerald-600">🟢 {comingCount}</span>
                      <span className="text-amber-600">🟡 {maybeCount}</span>
                      <span className="text-rose-600">🔴 {noCount}</span>
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
