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
  CartesianGrid
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
  Calendar, 
  TrendingUp, 
  Award, 
  Flame,
  Wine,
  Utensils,
  Moon,
  Coffee,
  Building,
  Scissors,
  Users,
  Info,
  Compass
} from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface UserEstablishmentPreferencesChartProps {
  currentUser: User | null;
  establishments: Establishment[];
  favorites: Record<string, string[]>;
  reservations: Reservation[];
  onNavigateToExplore?: () => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  maquis: '#f97316', // Orange burkinabè
  restaurants: '#10b981', // Vert émeraude
  bar: '#8b5cf6', // Violet
  boite_de_nuit: '#ec4899', // Rose fuchsia
  glacier_pizzeria: '#06b6d4', // Cyan
  hotel: '#3b82f6', // Bleu
  residence: '#6366f1', // Indigo
  salon_de_coiffure: '#eab308', // Jaune doré
  autre: '#64748b' // Ardoise
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
  reservations,
  onNavigateToExplore
}: UserEstablishmentPreferencesChartProps) {
  const [chartType, setChartType] = useState<'donut' | 'bar'>('donut');
  const [dataSource, setDataSource] = useState<'reservations' | 'combined'>('reservations');
  const [showDemoIfEmpty, setShowDemoIfEmpty] = useState<boolean>(true);

  const effectiveUserId = currentUser ? currentUser.id : 'guest';

  // Compute reservations & visits breakdown
  const stats = useMemo(() => {
    // Identify user reservations: by clientId or matching user name/phone
    const userReservations = reservations.filter(r => {
      if (!currentUser) return r.clientId === 'guest';
      return (
        r.clientId === currentUser.id ||
        (currentUser.name && r.clientName && r.clientName.toLowerCase() === currentUser.name.toLowerCase()) ||
        (currentUser.phone && r.clientPhone && r.clientPhone === currentUser.phone)
      );
    });

    const userFavIds = favorites[effectiveUserId] || (
      typeof window !== 'undefined' 
        ? JSON.parse(localStorage.getItem(currentUser ? `zaka_favorites_${currentUser.id}` : 'zaka_local_favorites') || '[]') 
        : []
    );

    const hasRealReservations = userReservations.length > 0;
    const hasAnyActivity = hasRealReservations || userFavIds.length > 0;

    // Aggregate category metrics
    const counts: Record<string, { resCount: number; guestsCount: number; favCount: number; score: number }> = {};

    // 1. Tally from reservation history
    userReservations.forEach(r => {
      const est = establishments.find(e => e.id === r.establishmentId);
      const cat = est?.category || 'autre';
      if (!counts[cat]) {
        counts[cat] = { resCount: 0, guestsCount: 0, favCount: 0, score: 0 };
      }
      counts[cat].resCount += 1;
      counts[cat].guestsCount += (r.guestsCount || 1);
      counts[cat].score += 10; // High weight for bookings
    });

    // 2. Tally from favorites if combined mode
    if (dataSource === 'combined') {
      userFavIds.forEach(id => {
        const est = establishments.find(e => e.id === id);
        if (est) {
          const cat = est.category || 'autre';
          if (!counts[cat]) {
            counts[cat] = { resCount: 0, guestsCount: 0, favCount: 0, score: 0 };
          }
          counts[cat].favCount += 1;
          counts[cat].score += 3;
        }
      });
    }

    const totalRealReservations = userReservations.length;
    const totalGuests = userReservations.reduce((sum, r) => sum + (r.guestsCount || 1), 0);

    const entries = Object.entries(counts);

    // If no real bookings yet and user allows demo preview
    const isUsingDemo = !hasRealReservations && showDemoIfEmpty;

    let chartData: Array<{
      name: string;
      category: string;
      value: number;
      resCount: number;
      guestsCount: number;
      favCount: number;
      percentage: number;
      color: string;
    }> = [];

    if (entries.length > 0 && (hasRealReservations || dataSource === 'combined')) {
      const totalDenominator = entries.reduce((sum, [, v]) => sum + (dataSource === 'reservations' ? v.resCount : v.score), 0);

      chartData = entries
        .filter(([, v]) => (dataSource === 'reservations' ? v.resCount > 0 : v.score > 0))
        .map(([cat, v]) => {
          const val = dataSource === 'reservations' ? v.resCount : v.score;
          return {
            name: getCategoryLabel(cat as Category) || cat,
            category: cat,
            value: val,
            resCount: v.resCount,
            guestsCount: v.guestsCount,
            favCount: v.favCount,
            percentage: totalDenominator > 0 ? Math.round((val / totalDenominator) * 100) : 0,
            color: CATEGORY_COLORS[cat] || '#f97316'
          };
        })
        .sort((a, b) => b.value - a.value);
    } else if (isUsingDemo) {
      // Demo breakdown showcasing traditional Burkinabè outing habits: Maquis > Restos > Bars > Clubs
      chartData = [
        { name: 'Maquis', category: 'maquis', value: 6, resCount: 6, guestsCount: 18, favCount: 4, percentage: 50, color: CATEGORY_COLORS.maquis },
        { name: 'Restaurants', category: 'restaurants', value: 3, resCount: 3, guestsCount: 8, favCount: 2, percentage: 25, color: CATEGORY_COLORS.restaurants },
        { name: 'Bars & Lounges', category: 'bar', value: 2, resCount: 2, guestsCount: 5, favCount: 3, percentage: 17, color: CATEGORY_COLORS.bar },
        { name: 'Boîtes de nuit', category: 'boite_de_nuit', value: 1, resCount: 1, guestsCount: 4, favCount: 1, percentage: 8, color: CATEGORY_COLORS.boite_de_nuit }
      ];
    }

    const topItem = chartData[0];
    const topCategory = topItem ? topItem.name : 'Maquis';
    const topCategoryRaw = topItem ? topItem.category : 'maquis';
    const topPercentage = topItem ? topItem.percentage : 0;

    // Determine descriptive lifestyle tag based on the top frequented category
    let lifestyleProfile = 'Explorateur de la Nuit';
    if (topCategoryRaw === 'maquis') lifestyleProfile = 'Fidèle des Maquis & Grilleurs';
    else if (topCategoryRaw === 'restaurants') lifestyleProfile = 'Gourmet Raffiné (Tables & Saveurs)';
    else if (topCategoryRaw === 'bar') lifestyleProfile = 'Amateur de Lounges & Cocktails';
    else if (topCategoryRaw === 'boite_de_nuit') lifestyleProfile = 'Noctambule Festif';
    else if (topCategoryRaw === 'glacier_pizzeria') lifestyleProfile = 'Gourmandise & Détente';
    else if (topCategoryRaw === 'hotel' || topCategoryRaw === 'residence') lifestyleProfile = 'Voyageur & Séjour Confort';

    return {
      chartData,
      totalRealReservations,
      totalGuests,
      hasRealReservations,
      hasAnyActivity,
      isUsingDemo,
      topCategory,
      topCategoryRaw,
      topPercentage,
      lifestyleProfile
    };
  }, [currentUser, establishments, favorites, reservations, effectiveUserId, dataSource, showDemoIfEmpty]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-900 text-white p-3.5 rounded-2xl shadow-2xl border border-gray-700 text-xs space-y-1.5 z-50 min-w-[180px]">
          <div className="flex items-center gap-2 pb-1 border-b border-gray-800">
            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: data.color }} />
            <p className="font-black text-orange-400 text-sm">
              {data.name}
            </p>
          </div>
          
          <p className="text-gray-200 flex justify-between gap-2">
            <span>Fréquentation :</span>
            <strong className="text-white font-black">{data.percentage}%</strong>
          </p>

          <div className="text-[11px] text-gray-300 space-y-0.5 pt-1">
            <p className="flex justify-between">
              <span>📅 Réservations :</span>
              <strong className="text-orange-400 font-bold">{data.resCount}</strong>
            </p>
            {data.guestsCount > 0 && (
              <p className="flex justify-between">
                <span>👥 Convives accueillis :</span>
                <strong className="text-emerald-400 font-bold">{data.guestsCount}</strong>
              </p>
            )}
            {dataSource === 'combined' && data.favCount > 0 && (
              <p className="flex justify-between">
                <span>❤️ Favoris ajoutés :</span>
                <strong className="text-rose-400 font-bold">{data.favCount}</strong>
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div id="user-establishment-preferences" className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl p-5 sm:p-6 shadow-sm transition-all">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                Fréquentation des Établissements
                {stats.isUsingDemo && (
                  <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-extrabold px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    Aperçu Démo
                  </span>
                )}
              </h3>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Analyse des types de lieux (maquis, bars, restos) que vous fréquentez le plus, calculée via votre historique de réservations.
          </p>
        </div>

        {/* Action Controls: Donut vs Bar chart */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {/* Data Source Switch: Reservations vs Combined */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setDataSource('reservations');
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                dataSource === 'reservations'
                  ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              title="Calculé uniquement sur vos réservations"
            >
              Réservations
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setDataSource('combined');
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                dataSource === 'combined'
                  ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              title="Combine réservations et favoris"
            >
              + Favoris
            </button>
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setChartType('donut');
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'donut'
                  ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              title="Vue Donut"
            >
              <PieIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setChartType('bar');
              }}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
              title="Vue Histogramme"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Notice when user has 0 reservations yet */}
      {!stats.hasRealReservations && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-blue-800 dark:text-blue-300">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              {stats.isUsingDemo 
                ? "Exemple indicatif affiché : Réservez dès maintenant pour voir vos statistiques réelles se dessiner !"
                : "Aucune réservation enregistrée à ce jour pour générer l'historique."}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setShowDemoIfEmpty(!showDemoIfEmpty)}
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 underline hover:no-underline cursor-pointer"
            >
              {showDemoIfEmpty ? "Masquer la démo" : "Afficher l'exemple"}
            </button>
            {onNavigateToExplore && (
              <button
                type="button"
                onClick={onNavigateToExplore}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              >
                <Compass className="w-3 h-3" />
                Réserver un lieu
              </button>
            )}
          </div>
        </div>
      )}

      {/* Summary Highlights: Top Category & Outing Style */}
      {stats.chartData.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            {/* Top Visited Category */}
            <div className="p-3.5 bg-gradient-to-tr from-orange-500/10 via-amber-500/5 to-orange-500/10 dark:from-orange-950/30 dark:to-amber-950/20 border border-orange-200/80 dark:border-orange-900/50 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-black tracking-wider text-orange-600 dark:text-orange-400 block">
                  Lieu le plus fréquenté
                </span>
                <p className="text-sm font-black text-gray-900 dark:text-white truncate">
                  {stats.topCategory}
                </p>
                <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400">
                  {stats.topPercentage}% de vos sorties
                </span>
              </div>
            </div>

            {/* Total Reservations / Bookings */}
            <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-800 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-base shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-black tracking-wider text-gray-500 dark:text-gray-400 block">
                  Total Réservations
                </span>
                <p className="text-sm font-black text-gray-900 dark:text-white">
                  {stats.isUsingDemo ? '12 (démo)' : `${stats.totalRealReservations} sortie${stats.totalRealReservations > 1 ? 's' : ''}`}
                </p>
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  Historique Zaka+
                </span>
              </div>
            </div>

            {/* Lifestyle Persona */}
            <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 border border-gray-200/70 dark:border-gray-800 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-base shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-black tracking-wider text-gray-500 dark:text-gray-400 block">
                  Profil de Sortie
                </span>
                <p className="text-sm font-black text-gray-900 dark:text-white truncate" title={stats.lifestyleProfile}>
                  {stats.lifestyleProfile}
                </p>
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  Basé sur vos réservations
                </span>
              </div>
            </div>
          </div>

          {/* Recharts Visualization */}
          <div className="h-64 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'donut' ? (
                <PieChart>
                  <Pie
                    data={stats.chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    animationDuration={600}
                  >
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              ) : (
                <BarChart data={stats.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.12} />
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
                    allowDecimals={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Detailed Categories Breakdown Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            {stats.chartData.map(item => {
              const IconComponent = CATEGORY_ICONS[item.category] || Sparkles;
              return (
                <div 
                  key={item.category}
                  className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-850/60 border border-gray-100 dark:border-gray-800 flex flex-col justify-between gap-2"
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: item.color }} 
                      />
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                        {item.name}
                      </span>
                    </div>
                    <IconComponent className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  </div>

                  <div className="flex items-baseline justify-between mt-1 pt-1.5 border-t border-gray-150 dark:border-gray-800">
                    <span className="text-xs font-black text-gray-900 dark:text-white">
                      {item.resCount} rés.
                    </span>
                    <span 
                      className="text-xs font-black px-1.5 py-0.5 rounded-md"
                      style={{ color: item.color, backgroundColor: `${item.color}15` }}
                    >
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="py-12 text-center text-gray-400 dark:text-gray-500">
          <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-xs font-bold">Aucune donnée de réservation disponible</p>
          <button
            type="button"
            onClick={() => setShowDemoIfEmpty(true)}
            className="mt-2 text-xs text-orange-500 font-bold hover:underline cursor-pointer"
          >
            Afficher un exemple indicatif
          </button>
        </div>
      )}
    </div>
  );
}
