import React, { useState, useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  Legend
} from 'recharts';
import { 
  Establishment, 
  Reservation, 
  User, 
  Category, 
  getCategoryLabel 
} from '../types';
import { 
  PieChart as PieIcon, 
  BarChart3, 
  Sparkles, 
  Heart, 
  Calendar, 
  TrendingUp, 
  Award, 
  Flame,
  Wine,
  Utensils,
  Moon,
  Coffee,
  Building,
  Scissors
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface UserEstablishmentPreferencesChartProps {
  currentUser: User | null;
  establishments: Establishment[];
  favorites: Record<string, string[]>;
  reservations: Reservation[];
}

const CATEGORY_COLORS: Record<string, string> = {
  maquis: '#f97316', // Orange
  restaurants: '#10b981', // Emerald
  bar: '#8b5cf6', // Purple
  boite_de_nuit: '#ec4899', // Pink
  glacier_pizzeria: '#06b6d4', // Cyan
  hotel: '#3b82f6', // Blue
  residence: '#6366f1', // Indigo
  salon_de_coiffure: '#eab308', // Yellow
  autre: '#64748b' // Slate
};

const CATEGORY_ICONS: Record<string, any> = {
  maquis: Flame,
  restaurants: Utensils,
  bar: Wine,
  boite_de_nuit: Moon,
  glacier_pizzeria: Coffee,
  hotel: Building,
  residence: Building,
  salon_de_coiffure: Scissors,
  autre: Sparkles
};

export function UserEstablishmentPreferencesChart({
  currentUser,
  establishments,
  favorites,
  reservations
}: UserEstablishmentPreferencesChartProps) {
  const [chartType, setChartType] = useState<'donut' | 'bar'>('donut');
  const effectiveUserId = currentUser ? currentUser.id : 'guest';

  // Compute stats based on user favorites + reservations
  const { chartData, topCategory, totalInteractions, personalityType } = useMemo(() => {
    const userFavIds = favorites[effectiveUserId] || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(currentUser ? `zaka_favorites_${currentUser.id}` : 'zaka_local_favorites') || '[]') : []);
    const userReservations = reservations.filter(r => r.clientId === effectiveUserId);

    const counts: Record<string, { favCount: number; resCount: number; total: number }> = {};

    // 1. Process favorites
    userFavIds.forEach(id => {
      const est = establishments.find(e => e.id === id);
      if (est) {
        const cat = est.category || 'autre';
        if (!counts[cat]) {
          counts[cat] = { favCount: 0, resCount: 0, total: 0 };
        }
        counts[cat].favCount += 1;
        counts[cat].total += 1;
      }
    });

    // 2. Process reservations
    userReservations.forEach(r => {
      const est = establishments.find(e => e.id === r.establishmentId);
      if (est) {
        const cat = est.category || 'autre';
        if (!counts[cat]) {
          counts[cat] = { favCount: 0, resCount: 0, total: 0 };
        }
        counts[cat].resCount += 1;
        counts[cat].total += 2; // Reservations weigh more for visits
      }
    });

    const entries = Object.entries(counts);
    const totalScore = entries.reduce((sum, [, val]) => sum + val.total, 0);

    let topCat = 'maquis';
    let maxVal = -1;

    entries.forEach(([cat, val]) => {
      if (val.total > maxVal) {
        maxVal = val.total;
        topCat = cat;
      }
    });

    // If no favorites/reservations yet, provide a friendly default based on popular offerings
    const formattedData = entries.length > 0 
      ? entries.map(([cat, val]) => ({
          name: getCategoryLabel(cat as Category) || cat,
          category: cat,
          value: val.total,
          favCount: val.favCount,
          resCount: val.resCount,
          percentage: totalScore > 0 ? Math.round((val.total / totalScore) * 100) : 0,
          color: CATEGORY_COLORS[cat] || '#f97316'
        })).sort((a, b) => b.value - a.value)
      : [
          { name: 'Maquis', category: 'maquis', value: 4, favCount: 2, resCount: 1, percentage: 40, color: CATEGORY_COLORS.maquis },
          { name: 'Restaurants', category: 'restaurants', value: 3, favCount: 1, resCount: 1, percentage: 30, color: CATEGORY_COLORS.restaurants },
          { name: 'Bars & Lounges', category: 'bar', value: 2, favCount: 2, resCount: 0, percentage: 20, color: CATEGORY_COLORS.bar },
          { name: 'Boîtes de nuit', category: 'boite_de_nuit', value: 1, favCount: 1, resCount: 0, percentage: 10, color: CATEGORY_COLORS.boite_de_nuit }
        ];

    // Determine personality profile based on top category
    let personality = 'Explorateur Épicurien';
    if (topCat === 'maquis') personality = 'Ambianceur Authentique (Maquis & Grilleurs)';
    else if (topCat === 'restaurants') personality = 'Gourmet Raffiné (Tables & Saveurs)';
    else if (topCat === 'bar') personality = 'Adepte de Lounges & Cocktails';
    else if (topCat === 'boite_de_nuit') personality = 'Noctambule Festif';
    else if (topCat === 'glacier_pizzeria') personality = 'Gourmand Détente';
    else if (topCat === 'hotel' || topCat === 'residence') personality = 'Voyageur & Confort';

    return {
      chartData: formattedData,
      topCategory: getCategoryLabel(topCat as Category) || 'Maquis',
      totalInteractions: totalScore || (userFavIds.length + userReservations.length),
      personalityType: personality
    };
  }, [currentUser, establishments, favorites, reservations, effectiveUserId]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white p-3 rounded-2xl shadow-xl border border-gray-700 text-xs space-y-1 z-50">
          <p className="font-black text-orange-400 flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: data.color }} />
            {data.name}
          </p>
          <p className="text-gray-200">
            Part de vos préférences : <span className="font-bold text-white">{data.percentage}%</span>
          </p>
          <div className="text-[11px] text-gray-400 flex gap-2 pt-1 border-t border-gray-800">
            <span>❤️ {data.favCount} favoris</span>
            <span>📅 {data.resCount} réservations</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-5 sm:p-6 shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black text-gray-900 dark:text-white">
              Vos Préférences & Sorties
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Types d'établissements les plus consultés, aimés et réservés.
          </p>
        </div>

        {/* Chart View Toggle */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setChartType('donut');
            }}
            className={`p-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              chartType === 'donut'
                ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <PieIcon className="w-3.5 h-3.5" />
            <span>Répartition</span>
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              setChartType('bar');
            }}
            className={`p-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              chartType === 'bar'
                ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Fréquence</span>
          </button>
        </div>
      </div>

      {/* Profil de Sorties Tag */}
      <div className="mb-5 p-3.5 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20 border border-orange-200/70 dark:border-orange-900/50 rounded-2xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-orange-600 dark:text-orange-400 block">
              Profil de Sorties
            </span>
            <p className="text-xs font-black text-gray-900 dark:text-white">
              {personalityType}
            </p>
          </div>
        </div>

        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-xs border border-gray-200/60 dark:border-gray-700 shrink-0">
          Top : <strong className="text-orange-600 dark:text-orange-400">{topCategory}</strong>
        </span>
      </div>

      {/* Recharts Container */}
      <div className="h-64 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'donut' ? (
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          ) : (
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11, fill: '#888888' }} 
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-15}
                textAnchor="end"
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#888888' }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`bar-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Categories Legend Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
        {chartData.map(item => {
          const IconComponent = CATEGORY_ICONS[item.category] || Sparkles;
          return (
            <div 
              key={item.category}
              className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-850/50 border border-gray-100 dark:border-gray-800 flex items-center justify-between"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: item.color }} 
                />
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                  {item.name}
                </span>
              </div>
              <span className="text-xs font-extrabold text-gray-500 dark:text-gray-400 shrink-0 ml-1">
                {item.percentage}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
