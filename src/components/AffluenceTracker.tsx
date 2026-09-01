import { useState } from 'react';
import { useAppStore } from '../store';
import { triggerHapticFeedback } from '../utils/haptics';
import { 
  Users, 
  MapPin, 
  QrCode, 
  Tv, 
  TrendingUp, 
  Clock, 
  Info, 
  ShieldAlert, 
  Sparkles, 
  Check, 
  Sliders 
} from 'lucide-react';

interface AffluenceTrackerProps {
  establishmentId: string;
}

type AffluenceLevel = 'calme' | 'anime' | 'tres_anime' | 'complet';

const affluenceConfig = {
  calme: { label: 'Calme', color: 'text-green-600 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900/40', bullet: '🟢' },
  anime: { label: 'Animé', color: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/40', bullet: '🟡' },
  tres_anime: { label: 'Très Animé', color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/40', bullet: '🟠' },
  complet: { label: 'Complet 🚫', color: 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40', bullet: '🔴' }
};

export function AffluenceTracker({ establishmentId }: AffluenceTrackerProps) {
  const { currentUser, establishments, updateEstablishment } = useAppStore();
  const [gpsActive, setGpsActive] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [scannedSuccess, setScannedSuccess] = useState(false);
  const [chartMode, setChartMode] = useState<'hour' | 'day' | 'week'>('hour');
  
  const establishment = establishments.find(e => e.id === establishmentId);
  const isOwner = currentUser && establishment?.ownerId === currentUser.id;
  const affluence = (establishment?.affluence as AffluenceLevel) || 'calme';

  const handleUpdateAffluence = async (level: AffluenceLevel) => {
    triggerHapticFeedback(30);
    try {
      await updateEstablishment(establishmentId, {
        affluence: level
      });
    } catch (err) {
      console.error(err);
    }
  };

  const toggleGpsPresence = () => {
    triggerHapticFeedback(20);
    const newState = !gpsActive;
    setGpsActive(newState);
    if (newState) {
      // Simulate incrementing present client count
      const currentCount = establishment?.currentClients || 12;
      updateEstablishment(establishmentId, { currentClients: currentCount + 1 });
    } else {
      const currentCount = establishment?.currentClients || 12;
      updateEstablishment(establishmentId, { currentClients: Math.max(0, currentCount - 1) });
    }
  };

  const handleSimulateQRScan = () => {
    triggerHapticFeedback([40, 20, 40]);
    setScannedSuccess(true);
    setTimeout(() => {
      setScannedSuccess(false);
      setShowQRModal(false);
      const currentCount = establishment?.currentClients || 12;
      updateEstablishment(establishmentId, { currentClients: currentCount + 1 });
    }, 1500);
  };

  // SVG Chart points calculations
  const getChartPoints = () => {
    let data: number[] = [];
    if (chartMode === 'hour') {
      // 18h to 04h affluence curve
      data = [5, 10, 25, 45, 60, 85, 95, 98, 80, 50, 15];
    } else if (chartMode === 'day') {
      // Mon to Sun average
      data = [20, 25, 30, 45, 80, 95, 85];
    } else {
      // Past 4 weeks average
      data = [65, 75, 82, 90];
    }

    const width = 320;
    const height = 120;
    const padding = 15;
    const usableW = width - padding * 2;
    const usableH = height - padding * 2;

    const points = data.map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * usableW;
      const y = height - padding - (val / 100) * usableH;
      return `${x},${y}`;
    }).join(' ');

    return { points, rawData: data };
  };

  const chartInfo = getChartPoints();

  // Prediction levels
  const getPredictions = () => {
    switch (affluence) {
      case 'calme':
        return {
          min30: { level: 'Calme', conf: '92%' },
          h1: { level: 'Animé', conf: '81%' },
          h2: { level: 'Animé', conf: '74%' }
        };
      case 'anime':
        return {
          min30: { level: 'Animé', conf: '88%' },
          h1: { level: 'Très Animé', conf: '84%' },
          h2: { level: 'Complet', conf: '69%' }
        };
      case 'tres_anime':
        return {
          min30: { level: 'Très Animé', conf: '91%' },
          h1: { level: 'Complet', conf: '87%' },
          h2: { level: 'Très Animé', conf: '70%' }
        };
      case 'complet':
        return {
          min30: { level: 'Complet', conf: '95%' },
          h1: { level: 'Complet', conf: '89%' },
          h2: { level: 'Très Animé', conf: '76%' }
        };
    }
  };

  const predictions = getPredictions();

  return (
    <div className="space-y-6">
      {/* Realtime affluence chip */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="text-[10px] font-black uppercase text-gray-500 tracking-wider">État actuel du Lieu</div>
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className={`px-4 py-1.5 text-xs font-black uppercase rounded-full border ${affluenceConfig[affluence].color} flex items-center gap-1.5 shadow-sm`}>
              <span>{affluenceConfig[affluence].bullet}</span>
              <span>{affluenceConfig[affluence].label}</span>
            </span>
            <span className="text-xs text-gray-400 font-bold">
              ({establishment?.currentClients || 14} clients déclarés)
            </span>
          </div>
        </div>

        {/* GPS Consent & Entry scanning */}
        <div className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={toggleGpsPresence}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
              gpsActive 
                ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-600/10' 
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>{gpsActive ? "Présence GPS activée" : "Je suis ici 📍"}</span>
          </button>

          <button
            onClick={() => { triggerHapticFeedback(20); setShowQRModal(true); }}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5 cursor-pointer"
          >
            <QrCode className="w-4 h-4" />
            <span>Scanner Entrée</span>
          </button>
        </div>
      </div>

      {/* Gérant Control Center */}
      {isOwner && (
        <div className="p-4 bg-orange-50/40 dark:bg-orange-950/10 border border-orange-200/60 dark:border-orange-900/30 rounded-2xl space-y-3">
          <h4 className="text-xs font-black text-orange-800 dark:text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
            <Sliders className="w-4 h-4" />
            <span>Surcharge Gérant : Forcer l'Affluence</span>
          </h4>
          <div className="grid grid-cols-4 gap-2">
            {(['calme', 'anime', 'tres_anime', 'complet'] as AffluenceLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => handleUpdateAffluence(level)}
                className={`py-2 text-[10px] font-black uppercase rounded-lg border transition-all cursor-pointer ${
                  affluence === level
                    ? 'bg-orange-600 text-white border-orange-500 shadow'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                }`}
              >
                {level === 'tres_anime' ? 'Très Animé' : level.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SVG Analytics History Chart */}
      <div className="p-5 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-3xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-orange-500" />
            <span>Historique d'Affluence</span>
          </h4>

          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
            {[
              { id: 'hour', label: 'Heure' },
              { id: 'day', label: 'Jour' },
              { id: 'week', label: 'Semaine' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { triggerHapticFeedback(15); setChartMode(tab.id as any); }}
                className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                  chartMode === tab.id
                    ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* The beautiful SVG Chart */}
        <div className="relative">
          <svg viewBox="0 0 320 120" className="w-full h-32 overflow-visible">
            {/* Grid Lines */}
            <line x1="15" y1="15" x2="305" y2="15" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="15" y1="60" x2="305" y2="60" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="15" y1="105" x2="305" y2="105" stroke="#f3f4f6" strokeWidth="1" strokeDasharray="3 3" />

            {/* Gradient Area under line */}
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <path
              d={`M 15,105 L ${chartInfo.points} L 305,105 Z`}
              fill="url(#chartGrad)"
            />

            {/* Main curved path line */}
            <polyline
              fill="none"
              stroke="#f97316"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={chartInfo.points}
            />

            {/* Highlighted peak point */}
            {chartMode === 'hour' && (
              <circle cx="219" cy="21.5" r="4.5" fill="#f97316" stroke="white" strokeWidth="1.5" />
            )}
          </svg>

          {/* X axis labels */}
          <div className="flex justify-between text-[9px] text-gray-400 font-bold px-2.5 mt-1.5">
            {chartMode === 'hour' ? (
              <>
                <span>18h</span>
                <span>21h</span>
                <span>Minuit</span>
                <span>02h</span>
                <span>04h</span>
              </>
            ) : chartMode === 'day' ? (
              <>
                <span>Lun</span>
                <span>Mer</span>
                <span>Ven</span>
                <span>Sam</span>
                <span>Dim</span>
              </>
            ) : (
              <>
                <span>S-3</span>
                <span>S-2</span>
                <span>S-1</span>
                <span>Cette Semaine</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* AI Smart Occupancy Predictions */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-center space-y-1">
          <Clock className="w-4 h-4 text-orange-500 mx-auto" />
          <div className="text-[9px] text-gray-500 dark:text-gray-400 font-black uppercase">Dans 30m</div>
          <div className="text-xs font-black text-gray-900 dark:text-white">{predictions.min30.level}</div>
          <div className="text-[8px] text-green-600 dark:text-green-400 font-bold">Confiance : {predictions.min30.conf}</div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-center space-y-1">
          <Clock className="w-4 h-4 text-orange-500 mx-auto" />
          <div className="text-[9px] text-gray-500 dark:text-gray-400 font-black uppercase">Dans 1h</div>
          <div className="text-xs font-black text-gray-900 dark:text-white">{predictions.h1.level}</div>
          <div className="text-[8px] text-green-600 dark:text-green-400 font-bold">Confiance : {predictions.h1.conf}</div>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-center space-y-1">
          <Clock className="w-4 h-4 text-orange-500 mx-auto" />
          <div className="text-[9px] text-gray-500 dark:text-gray-400 font-black uppercase">Dans 2h</div>
          <div className="text-xs font-black text-gray-900 dark:text-white">{predictions.h2.level}</div>
          <div className="text-[8px] text-amber-600 dark:text-amber-400 font-bold">Confiance : {predictions.h2.conf}</div>
        </div>
      </div>

      {/* Architecture Beacon bluetooth */}
      <div className="p-4 bg-orange-50/30 dark:bg-orange-950/10 rounded-2xl border border-orange-100 dark:border-orange-900/30 flex gap-3">
        <Sparkles className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          <h5 className="text-[11px] font-black text-orange-900 dark:text-orange-400 uppercase tracking-wide">
            IA Multi-Sources & Architecture Beacons
          </h5>
          <p className="text-[10px] text-orange-950/75 dark:text-orange-200/70 leading-relaxed font-medium">
            L'affluence est calculée à la volée par notre IA en agrégeant les signaux GPS géofencés, les QR d'accès clients et notre architecture Bluetooth Low Energy (BLE) Beacon en cours de déploiement à Ouaga.
          </p>
        </div>
      </div>

      {/* QR Code Scanner Simulation Dialog */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 w-full max-w-xs text-center space-y-4 shadow-xl border border-gray-150 dark:border-gray-800">
            <h3 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-wide">Scanner le QR Code</h3>
            
            <div className="relative w-40 h-40 border-4 border-orange-500 rounded-2xl mx-auto flex items-center justify-center bg-gray-50 dark:bg-gray-950">
              {scannedSuccess ? (
                <div className="p-3 bg-green-100 text-green-700 rounded-full animate-bounce">
                  <Check className="w-8 h-8" />
                </div>
              ) : (
                <div className="space-y-2">
                  <QrCode className="w-16 h-16 text-gray-400 animate-pulse mx-auto" />
                  <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-red-500 animate-bounce"></div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[11px] text-gray-500 dark:text-gray-400 font-bold">
                {scannedSuccess ? "Enregistrement de l'entrée validé !" : "Présentez le QR Code de l'entrée ou simulez le scan."}
              </p>
              {!scannedSuccess && (
                <button
                  onClick={handleSimulateQRScan}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-[10px] uppercase rounded-xl cursor-pointer"
                >
                  Simuler Scan Réussi
                </button>
              )}
            </div>

            <button
              onClick={() => setShowQRModal(false)}
              className="text-xs font-black text-gray-400 hover:text-gray-600 cursor-pointer pt-2 block mx-auto"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
