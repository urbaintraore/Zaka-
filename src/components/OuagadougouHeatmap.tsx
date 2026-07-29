import { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { triggerHapticFeedback } from '../utils/haptics';
import { 
  Flame, 
  MapPin, 
  Filter, 
  Sparkles, 
  Clock, 
  Info, 
  Tv, 
  Users, 
  Layers 
} from 'lucide-react';

interface NeighborhoodData {
  id: string;
  name: string;
  livesCount: number;
  storiesCount: number;
  participants: number;
  gpsPresence: number;
  svgPath: string; // Coordinate bounds for drawing
  textCoords: { x: number; y: number }; // coordinate to print label
}

// Custom defined polygon outlines for Ouagadougou districts
const neighborhoodsList: NeighborhoodData[] = [
  {
    id: 'ouaga_2000',
    name: 'Ouaga 2000',
    livesCount: 3,
    storiesCount: 8,
    participants: 240,
    gpsPresence: 145,
    svgPath: 'M 140,240 L 220,240 L 240,310 L 160,310 Z',
    textCoords: { x: 190, y: 275 }
  },
  {
    id: 'patte_d_oie',
    name: "Patte d'Oie",
    livesCount: 1,
    storiesCount: 4,
    participants: 110,
    gpsPresence: 82,
    svgPath: 'M 70,220 L 140,220 L 140,270 L 70,270 Z',
    textCoords: { x: 105, y: 245 }
  },
  {
    id: 'gounghin',
    name: 'Gounghin',
    livesCount: 0,
    storiesCount: 2,
    participants: 45,
    gpsPresence: 30,
    svgPath: 'M 20,130 L 90,130 L 90,200 L 20,200 Z',
    textCoords: { x: 55, y: 165 }
  },
  {
    id: 'koulouba',
    name: 'Koulouba',
    livesCount: 2,
    storiesCount: 6,
    participants: 180,
    gpsPresence: 115,
    svgPath: 'M 90,120 L 160,120 L 160,180 L 90,180 Z',
    textCoords: { x: 125, y: 150 }
  },
  {
    id: 'paspanga',
    name: 'Paspanga',
    livesCount: 1,
    storiesCount: 5,
    participants: 95,
    gpsPresence: 64,
    svgPath: 'M 160,110 L 230,110 L 230,170 L 160,170 Z',
    textCoords: { x: 195, y: 140 }
  },
  {
    id: 'wemtenga',
    name: 'Wemtenga',
    livesCount: 2,
    storiesCount: 7,
    participants: 195,
    gpsPresence: 130,
    svgPath: 'M 160,170 L 230,170 L 220,240 L 140,240 Z',
    textCoords: { x: 185, y: 205 }
  },
  {
    id: 'dassasgho',
    name: 'Dassasgho',
    livesCount: 0,
    storiesCount: 3,
    participants: 50,
    gpsPresence: 40,
    svgPath: 'M 230,140 L 300,140 L 300,210 L 230,210 Z',
    textCoords: { x: 265, y: 175 }
  },
  {
    id: 'somgande',
    name: 'Somgandé',
    livesCount: 1,
    storiesCount: 2,
    participants: 60,
    gpsPresence: 35,
    svgPath: 'M 200,30 L 280,30 L 280,100 L 200,100 Z',
    textCoords: { x: 240, y: 65 }
  },
  {
    id: 'zone_du_bois',
    name: 'Zone du Bois',
    livesCount: 3,
    storiesCount: 9,
    participants: 280,
    gpsPresence: 190,
    svgPath: 'M 120,40 L 200,40 L 200,110 L 120,110 Z',
    textCoords: { x: 160, y: 75 }
  }
];

export function OuagadougouHeatmap() {
  const { establishments } = useAppStore();
  const [selectedDistrict, setSelectedDistrict] = useState<NeighborhoodData | null>(neighborhoodsList[0]);
  const [catFilter, setCatFilter] = useState<'all' | 'maquis' | 'discotheque' | 'bar'>('all');
  const [timeFilter, setTimeFilter] = useState<'early' | 'midnight' | 'late'>('midnight');
  const [affluenceMultiplier, setAffluenceMultiplier] = useState(1.0);

  // Trigger feedback on choosing district
  const handleSelectDistrict = (district: NeighborhoodData) => {
    triggerHapticFeedback(25);
    setSelectedDistrict(district);
  };

  // Adjust parameters dynamically based on selected filters
  useEffect(() => {
    let mult = 1.0;
    if (timeFilter === 'early') mult = 0.6;
    if (timeFilter === 'late') mult = 1.3;
    if (catFilter === 'maquis') mult *= 0.8;
    if (catFilter === 'discotheque') mult *= 1.2;
    setAffluenceMultiplier(mult);
  }, [catFilter, timeFilter]);

  // Calculate composite ambiance index (0 to 100)
  const getAmbianceScore = (d: NeighborhoodData) => {
    const score = (d.livesCount * 25 + d.storiesCount * 12 + d.participants * 0.2 + d.gpsPresence * 0.4) * affluenceMultiplier;
    return Math.min(100, Math.round(score));
  };

  // Map Ambiance Score to premium Tailwind heat colors
  const getHeatColor = (score: number) => {
    if (score < 25) return 'fill-emerald-500/80 stroke-emerald-600 hover:fill-emerald-400';
    if (score < 55) return 'fill-yellow-500/85 stroke-yellow-600 hover:fill-yellow-400';
    if (score < 80) return 'fill-orange-500/90 stroke-orange-600 hover:fill-orange-400';
    return 'fill-red-600/90 stroke-red-700 hover:fill-red-500 animate-pulse-slow';
  };

  // Get current AI trend recommendation report
  const getAiReportText = () => {
    if (timeFilter === 'early') {
      return "🌇 Début de soirée calme. Les maquis traditionnels s'animent progressivement. Zone du Bois est en tête d'affluence pour l'happy hour.";
    }
    if (timeFilter === 'late') {
      return "⚡ Fièvre de fin de nuit ! Report massif vers les discothèques de Ouaga 2000 et Wemtenga. Attendez-vous à des files d'attente importantes chez Ali & aux platines de DJ Carlos.";
    }
    return "🔥 Ambiance générale très élevée ! Wemtenga et Zone du Bois sont en surchauffe totale. Gounghin est anormalement calme ce soir, préférez Patte d'Oie pour vos sorties.";
  };

  return (
    <div className="space-y-6">
      {/* Title & Stats description */}
      <div className="flex flex-col md:flex-row items-start justify-between gap-4 p-5 bg-gradient-to-br from-gray-900 to-gray-950 text-white rounded-3xl border border-gray-800 shadow-xl relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <span className="text-[9px] font-black uppercase text-orange-400 tracking-widest block">🔴 NOUVEAU : SUIVI EN DIRECT</span>
          <h3 className="text-lg font-black tracking-tight flex items-center gap-1.5">
            <Flame className="w-5 h-5 text-red-500 animate-pulse" />
            <span>Carte Thermique d'Ambiance de Ouaga</span>
          </h3>
          <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
            Visualisez la ferveur des quartiers en temps réel. Les zones d'affluence sont mises à jour d'après les Lives, les GPS anonymisés et les Stories actives.
          </p>
        </div>

        {/* Info panel */}
        <div className="flex gap-2 text-xs shrink-0 bg-white/5 p-2 rounded-xl border border-white/5">
          <div className="text-center px-2 border-r border-white/10">
            <div className="text-[8px] text-gray-400 font-bold uppercase">Vert</div>
            <div className="font-black text-green-400">Calme</div>
          </div>
          <div className="text-center px-2 border-r border-white/10">
            <div className="text-[8px] text-gray-400 font-bold uppercase">Jaune</div>
            <div className="font-black text-yellow-400">Animé</div>
          </div>
          <div className="text-center px-2 border-r border-white/10">
            <div className="text-[8px] text-gray-400 font-bold uppercase">Orange</div>
            <div className="font-black text-orange-400">Chaud</div>
          </div>
          <div className="text-center px-2">
            <div className="text-[8px] text-gray-400 font-bold uppercase">Rouge</div>
            <div className="font-black text-red-500 animate-pulse">Surchauffe</div>
          </div>
        </div>
      </div>

      {/* Categories & Time filters */}
      <div className="grid grid-cols-2 gap-3">
        {/* Category Filters */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl space-y-2 text-left">
          <div className="text-[9px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1">
            <Filter className="w-3 h-3 text-orange-500" />
            <span>Filtre d'Établissements</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'Tout' },
              { id: 'maquis', label: 'Maquis' },
              { id: 'discotheque', label: 'Boîtes' },
              { id: 'bar', label: 'Bars' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => { triggerHapticFeedback(15); setCatFilter(cat.id as any); }}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  catFilter === cat.id
                    ? 'bg-orange-600 text-white shadow'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Time Filters */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl space-y-2 text-left">
          <div className="text-[9px] font-black uppercase text-gray-500 tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-orange-500" />
            <span>Créneau Horaire</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'early', label: '19h - 22h' },
              { id: 'midnight', label: '23h - 02h' },
              { id: 'late', label: '03h - 06h' }
            ].map(time => (
              <button
                key={time.id}
                onClick={() => { triggerHapticFeedback(15); setTimeFilter(time.id as any); }}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  timeFilter === time.id
                    ? 'bg-orange-600 text-white shadow'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {time.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Map Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* The SVG Map panel */}
        <div className="lg:col-span-8 p-5 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-3xl flex flex-col items-center shadow-sm">
          <div className="text-[10px] font-black uppercase text-gray-400 tracking-wider mb-3 block">
            Carte Interactive de Ouagadougou 🗺️ (Tapez un quartier)
          </div>

          <div className="relative w-full max-w-sm aspect-[4/3] bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-2 border border-gray-150 dark:border-gray-850">
            <svg 
              viewBox="0 0 320 340" 
              className="w-full h-full overflow-visible"
            >
              {neighborhoodsList.map((district) => {
                const score = getAmbianceScore(district);
                const colorClass = getHeatColor(score);
                const isSelected = selectedDistrict?.id === district.id;

                return (
                  <g key={district.id}>
                    {/* Outline Path */}
                    <path
                      d={district.svgPath}
                      className={`transition-all duration-300 stroke-2 cursor-pointer ${colorClass} ${
                        isSelected 
                          ? 'stroke-gray-950 dark:stroke-white stroke-[3.5px] scale-[1.02] filter drop-shadow' 
                          : 'stroke-white/45'
                      }`}
                      onClick={() => handleSelectDistrict(district)}
                    />

                    {/* Neighborhood Label Text */}
                    <text
                      x={district.textCoords.x}
                      y={district.textCoords.y}
                      textAnchor="middle"
                      className={`text-[8px] font-black pointer-events-none tracking-tight transition-all select-none ${
                        isSelected 
                          ? 'fill-gray-950 dark:fill-white font-extrabold text-[9px]' 
                          : 'fill-gray-800/80 dark:fill-gray-200'
                      }`}
                    >
                      {district.name}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Selected District Realtime Statistics Panel */}
        <div className="lg:col-span-4 space-y-4">
          {selectedDistrict ? (
            <div className="p-5 bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-3xl text-left space-y-4 shadow-sm animate-in fade-in zoom-in-95 duration-150">
              <div className="border-b border-gray-100 dark:border-gray-800 pb-3">
                <span className="text-[9px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-widest block">Quartier Sélectionné</span>
                <h4 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-1">
                  <MapPin className="w-5 h-5 text-orange-600" />
                  <span>{selectedDistrict.name}</span>
                </h4>
              </div>

              {/* Stats parameters */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-bold flex items-center gap-1.5">
                    <Tv className="w-4 h-4 text-purple-500" />
                    <span>LIVES d'ambiance actifs</span>
                  </span>
                  <span className="font-black text-gray-900 dark:text-white">
                    {Math.round(selectedDistrict.livesCount * affluenceMultiplier)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-bold flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>Stories éphémères actives</span>
                  </span>
                  <span className="font-black text-gray-900 dark:text-white">
                    {Math.round(selectedDistrict.storiesCount * affluenceMultiplier)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-bold flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span>Participants aux événements</span>
                  </span>
                  <span className="font-black text-gray-900 dark:text-white">
                    {Math.round(selectedDistrict.participants * affluenceMultiplier)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 font-bold flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <span>Présence GPS Active</span>
                  </span>
                  <span className="font-black text-gray-900 dark:text-white">
                    {Math.round(selectedDistrict.gpsPresence * affluenceMultiplier)}
                  </span>
                </div>
              </div>

              {/* Composite Index Score bar */}
              <div className="pt-2">
                <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 mb-1.5">
                  <span>Indice Ambiance ZAKA</span>
                  <span>{getAmbianceScore(selectedDistrict)} / 100</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-red-600 rounded-full transition-all duration-300"
                    style={{ width: `${getAmbianceScore(selectedDistrict)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl text-center italic text-xs text-gray-400 py-12">
              Veuillez sélectionner un quartier sur la carte pour afficher les statistiques en direct.
            </div>
          )}
        </div>

      </div>

      {/* AI Smart Predictive Report Footer */}
      <div className="p-4.5 bg-orange-50/30 dark:bg-orange-950/10 rounded-2xl border border-orange-100 dark:border-orange-900/30 flex gap-3.5 text-left items-start">
        <Sparkles className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <h5 className="text-xs font-black text-orange-950 dark:text-orange-400 uppercase tracking-wide">
            Rapport d'Analyse Prédictif IA
          </h5>
          <p className="text-[11px] text-orange-900/80 dark:text-orange-200/70 leading-relaxed font-bold">
            {getAiReportText()}
          </p>
        </div>
      </div>
    </div>
  );
}
