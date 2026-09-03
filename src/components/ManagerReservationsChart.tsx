import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';
import { Calendar, TrendingUp, Users, CheckCircle2, Clock, Filter, BarChart3, Download, FileSpreadsheet } from 'lucide-react';
import { exportReservationsToCSV } from '../utils/exportReservationsCsv';

const MONTH_NAMES = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'
];

interface MonthlyStat {
  monthKey: string; // e.g. "2026-01"
  label: string;    // e.g. "Jan 2026"
  total: number;
  confirmees: number;
  enAttente: number;
  refuseesOrAnnulees: number;
  totalGuests: number;
}

export function ManagerReservationsChart() {
  const { currentUser, establishments, reservations } = useAppStore();
  const [chartType, setChartType] = useState<'bar' | 'area'>('bar');
  const [selectedEstId, setSelectedEstId] = useState<string>('all');

  // Filter establishments owned by current manager
  const myEsts = useMemo(() => {
    if (!currentUser) return [];
    return establishments.filter(e => e.ownerId === currentUser.id);
  }, [establishments, currentUser]);

  const myEstIds = useMemo(() => myEsts.map(e => e.id), [myEsts]);

  // Compute monthly data for the past 6 to 12 months
  const { monthlyData, totalPeriodReservations, totalPeriodGuests, confirmedRate } = useMemo(() => {
    // Determine which reservations belong to the manager
    const managerReservations = (reservations || []).filter(res => {
      if (selectedEstId === 'all') {
        return myEstIds.includes(res.establishmentId);
      }
      return res.establishmentId === selectedEstId;
    });

    // Build last 6 months buckets
    const now = new Date();
    const monthsMap: Record<string, MonthlyStat> = {};
    const monthsKeys: string[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthIdx = d.getMonth();
      const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
      const label = `${MONTH_NAMES[monthIdx]} ${String(year).slice(-2)}`;
      
      monthsKeys.push(monthKey);
      monthsMap[monthKey] = {
        monthKey,
        label,
        total: 0,
        confirmees: 0,
        enAttente: 0,
        refuseesOrAnnulees: 0,
        totalGuests: 0
      };
    }

    let totalCount = 0;
    let totalGuests = 0;
    let confirmedCount = 0;

    managerReservations.forEach(res => {
      if (!res.date) return;
      const resDate = new Date(res.date);
      if (isNaN(resDate.getTime())) return;

      const year = resDate.getFullYear();
      const monthIdx = resDate.getMonth();
      const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;

      if (monthsMap[monthKey]) {
        monthsMap[monthKey].total += 1;
        const guests = Number(res.guestsCount) || 1;
        monthsMap[monthKey].totalGuests += guests;

        totalCount += 1;
        totalGuests += guests;

        if (res.status === 'confirmee') {
          monthsMap[monthKey].confirmees += 1;
          confirmedCount += 1;
        } else if (res.status === 'en_attente') {
          monthsMap[monthKey].enAttente += 1;
        } else {
          monthsMap[monthKey].refuseesOrAnnulees += 1;
        }
      }
    });

    const data = monthsKeys.map(k => monthsMap[k]);
    const rate = totalCount > 0 ? Math.round((confirmedCount / totalCount) * 100) : 0;

    return {
      monthlyData: data,
      totalPeriodReservations: totalCount,
      totalPeriodGuests: totalGuests,
      confirmedRate: rate
    };
  }, [reservations, myEstIds, selectedEstId]);

  if (!currentUser || (currentUser.role !== 'gerant' && currentUser.role !== 'salon_coiffure' && currentUser.role !== 'admin')) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-950 rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-900 flex flex-col gap-5">
      {/* Header with Title and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black text-gray-900 dark:text-white">
              Réservations par mois
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Évolution mensuelle des demandes de réservation et du nombre de couverts
          </p>
        </div>

        {/* Controls: Establishment selector & Chart type toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {myEsts.length > 1 && (
            <select
              value={selectedEstId}
              onChange={(e) => setSelectedEstId(e.target.value)}
              aria-label="Filtrer par établissement"
              className="text-xs font-bold bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 outline-none focus:border-orange-500"
            >
              <option value="all">Tous mes établissements</option>
              {myEsts.map(est => (
                <option key={est.id} value={est.id}>{est.name}</option>
              ))}
            </select>
          )}

          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              Barres
            </button>
            <button
              onClick={() => setChartType('area')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                chartType === 'area'
                  ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              Courbe
            </button>
          </div>

          <button
            type="button"
            onClick={() => exportReservationsToCSV({
              reservations,
              establishments,
              managerEstablishmentIds: myEstIds,
              selectedEstablishmentId: selectedEstId,
              managerName: currentUser?.name
            })}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs rounded-xl border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer shadow-xs active:scale-95"
            title="Exporter les statistiques et réservations au format CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Pills */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 rounded-2xl p-3 flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">Total réservations</span>
          <span className="text-xl font-black text-gray-900 dark:text-white mt-0.5">{totalPeriodReservations}</span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">6 derniers mois</span>
        </div>

        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 rounded-2xl p-3 flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Total personnes</span>
          <span className="text-xl font-black text-gray-900 dark:text-white mt-0.5">{totalPeriodGuests}</span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">Couverts reçus</span>
        </div>

        <div className="bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-3 flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Taux validation</span>
          <span className="text-xl font-black text-gray-900 dark:text-white mt-0.5">{confirmedRate}%</span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">Confirmées</span>
        </div>
      </div>

      {/* Recharts Chart Container */}
      <div className="w-full h-64 sm:h-72 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'bar' ? (
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
              <XAxis 
                dataKey="label" 
                tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                allowDecimals={false}
                tick={{ fill: '#6B7280', fontSize: 11 }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '12px',
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)'
                }}
                labelStyle={{ fontWeight: 'bold', color: '#F97316' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
              />
              <Bar dataKey="confirmees" name="Confirmées" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="enAttente" name="En attente" fill="#F59E0B" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="refuseesOrAnnulees" name="Refusées / Annulées" fill="#EF4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          ) : (
            <AreaChart data={monthlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="totalReservationsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#EA580C" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#EA580C" stopOpacity={0.0}/>
                </linearGradient>
                <linearGradient id="totalGuestsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.5} />
              <XAxis 
                dataKey="label" 
                tick={{ fill: '#6B7280', fontSize: 11, fontWeight: 600 }} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                allowDecimals={false}
                tick={{ fill: '#6B7280', fontSize: 11 }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  borderRadius: '12px',
                  color: '#FFFFFF',
                  border: 'none',
                  fontSize: '12px'
                }}
                labelStyle={{ fontWeight: 'bold', color: '#F97316' }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontWeight: 600 }}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                name="Réservations" 
                stroke="#EA580C" 
                strokeWidth={2.5}
                fillOpacity={1} 
                fill="url(#totalReservationsGrad)" 
              />
              <Area 
                type="monotone" 
                dataKey="totalGuests" 
                name="Couverts (personnes)" 
                stroke="#10B981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#totalGuestsGrad)" 
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
