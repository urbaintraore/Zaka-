import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, onSnapshot, query, where, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useAppStore } from '../store';
import { Publication, Establishment, EventParticipation } from '../types';
import { Heart, CheckCircle2, MapPin, Eye, Users, Info, QrCode, ShieldAlert, Sparkles, Zap } from 'lucide-react';

interface ParticipationProps {
  event: Publication;
  establishment: Establishment | null;
}

export function ParticipationButtons({ event, establishment }: ParticipationProps) {
  const { currentUser, setGlobalError } = useAppStore();
  const [participations, setParticipations] = useState<EventParticipation[]>([]);
  const [myStatus, setMyStatus] = useState<'interested' | 'going' | 'present' | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [simProximity, setSimProximity] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  const [showParticipantsList, setShowParticipantsList] = useState(false);

  // Load participations for this event
  useEffect(() => {
    const q = query(
      collection(db, 'event_participations'),
      where('eventId', '==', event.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: EventParticipation[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as EventParticipation);
      });
      setParticipations(list);

      // Resolve my own status
      if (currentUser) {
        const mine = list.find(p => p.userId === currentUser.id);
        setMyStatus(mine ? mine.status : null);
        if (mine) setIsVisible(mine.isVisible);
      }
    }, (error) => {
      console.error("Error loading participations:", error);
    });

    return () => unsubscribe();
  }, [event.id, currentUser]);

  // Aggregate counts
  const interestedCount = participations.filter(p => p.status === 'interested').length;
  const goingCount = participations.filter(p => p.status === 'going').length;
  const presentCount = participations.filter(p => p.status === 'present').length;

  // Real-time simulated active viewers/consultants (e.g. random number between 15 and 45 based on clicks or static seed)
  const viewersCount = (event.views || 0) + 12;

  // Formula for popularity score
  const score = ((event.views || 0) * 1) + 
                (interestedCount * 3) + 
                (goingCount * 5) + 
                (presentCount * 10) + 
                ((event.clicks || 0) * 4);

  // Generate appropriate Badge based on score
  let badge: { label: string; icon: string; style: string } | null = null;
  if (score > 100) {
    badge = { label: "⭐ Très populaire", icon: "⭐", style: "bg-yellow-50 text-yellow-700 border-yellow-200" };
  } else if (score > 50) {
    badge = { label: "🔥 Tendance", icon: "🔥", style: "bg-red-50 text-red-700 border-red-200" };
  } else if (presentCount > 15) {
    badge = { label: "🎉 En cours d'enjaillement", icon: "🎉", style: "bg-indigo-50 text-indigo-700 border-indigo-200" };
  }

  // Calculate distance in meters to target establishment
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in meters
  };

  // Perform "Je suis ici" check-in
  const handlePresentCheckIn = () => {
    if (!currentUser) {
      setGlobalError({ message: "Veuillez vous connecter pour signaler votre présence.", type: "warning" });
      return;
    }

    if (simProximity) {
      // Bypassed check via simulator toggle
      submitParticipation('present');
      return;
    }

    // Geolocation check
    if (!navigator.geolocation) {
      setGlobalError({ message: "La géolocalisation n'est pas supportée par votre navigateur. Utilisez l'option Simuler ci-dessous.", type: "warning" });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userLat = position.coords.latitude;
        const userLon = position.coords.longitude;

        // Parse establishment geolocation "latitude,longitude"
        let estLat = 12.3714; // Default Ouagadougou lat
        let estLon = -1.5197; // Default Ouagadougou lon

        if (establishment?.geolocation) {
          const parts = establishment.geolocation.split(',');
          if (parts.length === 2) {
            estLat = parseFloat(parts[0]);
            estLon = parseFloat(parts[1]);
          }
        }

        const distance = calculateDistance(userLat, userLon, estLat, estLon);

        if (distance <= 150) { // Under 150 meters
          submitParticipation('present');
        } else {
          setGlobalError({ 
            message: `Vous êtes trop éloigné de l'établissement (${Math.round(distance)}m). Pour vous enregistrer à distance, scannez le QR Code ou simulez la proximité GPS !`, 
            type: "warning" 
          });
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setGlobalError({ message: "Impossible d'accéder à votre GPS. Activez l'option Simuler la proximité ou scannez le QR Code !", type: "warning" });
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  // Generic status update
  const submitParticipation = async (status: 'interested' | 'going' | 'present') => {
    if (!currentUser) return;

    const docId = `${event.id}_${currentUser.id}`;
    const partRef = doc(db, 'event_participations', docId);

    // If clicking same button, delete status (deselect)
    if (myStatus === status) {
      try {
        await deleteDoc(partRef);
        setMyStatus(null);
        return;
      } catch (err) {
        console.error(err);
      }
    }

    const payload: EventParticipation = {
      id: docId,
      eventId: event.id,
      userId: currentUser.id,
      userName: currentUser.name || 'Anonyme',
      userPhoto: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150`, // Mock default avatar
      status,
      timestamp: new Date().toISOString(),
      isVisible
    };

    try {
      await setDoc(partRef, payload);
      
      // Haptic Feedback trigger
      import('../utils/haptics').then(m => m.triggerHapticFeedback([50, 30, 50]));

      // Check if viral alert should be sent to gérant
      const totalParticipants = interestedCount + goingCount + presentCount + 1;
      if (totalParticipants >= 10 && establishment?.ownerId) {
        import('../utils/pushNotifications').then(({ sendPushNotification }) => {
          sendPushNotification(
            `🔥 Événement populaire chez ${establishment.name} !`,
            `Déjà ${totalParticipants} personnes s'enregistrent pour "${event.title}". Bravo !`
          );
        });
      }
    } catch (err) {
      console.error("Error setting participation:", err);
      setGlobalError({ message: "Erreur lors de l'enregistrement de votre participation.", type: "error" });
    }
  };

  // Update privacy visibility toggle
  const handleToggleVisibility = async (checked: boolean) => {
    setIsVisible(checked);
    if (currentUser && myStatus) {
      const docId = `${event.id}_${currentUser.id}`;
      const partRef = doc(db, 'event_participations', docId);
      try {
        await setDoc(partRef, { isVisible: checked }, { merge: true });
      } catch (e) {
        console.error(e);
      }
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 border border-gray-100 dark:border-gray-900 rounded-3xl p-5 bg-white dark:bg-gray-950/20 shadow-xs">
      
      {/* Real-time Counter Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-900/60 pb-3">
        <div className="flex items-center gap-1.5 text-xs font-extrabold text-orange-600 dark:text-orange-400">
          <Eye className="w-4 h-4 text-orange-500 animate-pulse" />
          <span>{viewersCount} personnes consultent l'événement</span>
        </div>

        {badge && (
          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${badge.style}`}>
            {badge.icon} {badge.label}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2.5 text-center bg-gray-50 dark:bg-gray-900/40 p-3 rounded-2xl border border-gray-100/50 dark:border-gray-900/30">
        <div>
          <div className="text-lg font-black text-gray-900 dark:text-white">{interestedCount}</div>
          <div className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Intéressés</div>
        </div>
        <div>
          <div className="text-lg font-black text-gray-900 dark:text-white">{goingCount}</div>
          <div className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">J'y vais</div>
        </div>
        <div>
          <div className="text-lg font-black text-gray-900 dark:text-white">{presentCount}</div>
          <div className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">Sur place</div>
        </div>
      </div>

      {/* Button controls */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          {/* Interested Button */}
          <button
            onClick={() => submitParticipation('interested')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer border ${
              myStatus === 'interested'
                ? 'bg-orange-600 border-orange-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            <Heart className={`w-4 h-4 ${myStatus === 'interested' ? 'fill-current text-white' : ''}`} />
            <span>Intéressé</span>
          </button>

          {/* Going Button */}
          <button
            onClick={() => submitParticipation('going')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer border ${
              myStatus === 'going'
                ? 'bg-green-600 border-green-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>J'y vais</span>
          </button>

          {/* Present Button (requires proximity logic) */}
          <button
            onClick={handlePresentCheckIn}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer border ${
              myStatus === 'present'
                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50'
            }`}
          >
            <MapPin className="w-4 h-4 animate-bounce" />
            <span>Je suis ici</span>
          </button>
        </div>

        {/* Visibility anonymization toggle */}
        <div className="flex items-center justify-between px-1 text-xs">
          <span className="text-gray-500 dark:text-gray-400 font-bold flex items-center gap-1">
            Visible dans la liste des fêtards
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={isVisible} 
              onChange={e => handleToggleVisibility(e.target.checked)} 
              className="sr-only peer" 
            />
            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
          </label>
        </div>
      </div>

      {/* Simulator helper triggers for present verification */}
      <div className="border-t border-gray-100 dark:border-gray-900/60 pt-3 mt-1 flex flex-col gap-2 bg-gray-50 dark:bg-gray-900/30 p-3 rounded-2xl">
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
          <span>Vérification de présence (GPS / QR / Beacon)</span>
        </div>

        <div className="flex gap-2 mt-1">
          <button
            onClick={() => {
              setSimProximity(prev => !prev);
              import('../utils/haptics').then(m => m.triggerHapticFeedback(30));
            }}
            className={`flex-1 text-[10px] font-black py-1.5 px-2 rounded-lg transition-all cursor-pointer border ${
              simProximity 
                ? 'bg-orange-100 border-orange-300 text-orange-800' 
                : 'bg-white border-gray-200 text-gray-500'
            }`}
          >
            🛰️ {simProximity ? "Simulateur Proximité Activé" : "Simuler proximité GPS"}
          </button>

          <button
            onClick={() => setShowQRCode(prev => !prev)}
            className="flex-1 text-[10px] font-black py-1.5 px-2 bg-white border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-1 cursor-pointer"
          >
            <QrCode className="w-3 h-3" />
            <span>QR Code Entrée</span>
          </button>
        </div>

        {/* QR Code Simulation Popup */}
        {showQRCode && (
          <div className="bg-white dark:bg-gray-950 p-4 border border-gray-100 dark:border-gray-900 rounded-xl mt-2 flex flex-col items-center gap-3">
            <p className="text-[10px] text-gray-400 font-bold text-center leading-relaxed">Scannez ce QR Code affiché à l'entrée du club pour valider votre présence d'un coup de fil.</p>
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-orange-500 p-2 relative">
              {/* Fake QR code SVG placeholder */}
              <div className="grid grid-cols-4 gap-1 w-full h-full opacity-80">
                {[...Array(16)].map((_, i) => (
                  <div key={i} className={`rounded-sm ${i % 3 === 0 || i % 7 === 0 ? 'bg-gray-900' : 'bg-transparent'}`} />
                ))}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    submitParticipation('present');
                    setShowQRCode(false);
                  }}
                  className="bg-orange-600 text-white text-[9px] font-black px-2 py-1 rounded shadow-md uppercase tracking-wider"
                >
                  Scanner QR
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Participants List */}
      <div className="border-t border-gray-100 dark:border-gray-900/60 pt-3">
        <button
          onClick={() => setShowParticipantsList(prev => !prev)}
          className="text-xs text-gray-500 hover:text-orange-500 font-extrabold flex items-center gap-1 cursor-pointer"
        >
          <Users className="w-4 h-4 text-orange-500" />
          <span>Voir la liste des participants ({participations.length})</span>
        </button>

        {showParticipantsList && (
          <div className="mt-3 max-h-40 overflow-y-auto space-y-2">
            {participations.length === 0 ? (
              <p className="text-[10px] text-gray-400 text-center py-4">Aucun participant enregistré pour le moment.</p>
            ) : (
              participations.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100/50 dark:border-gray-900/35">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-[10px]">
                      {p.isVisible ? p.userName.charAt(0).toUpperCase() : "?"}
                    </div>
                    <div>
                      <div className="text-[11px] font-extrabold text-gray-800 dark:text-gray-200">
                        {p.isVisible ? p.userName : "Utilisateur anonyme 🔒"}
                      </div>
                      <div className="text-[9px] text-gray-400 font-bold">
                        {p.status === 'present' ? '📍 Sur place' : p.status === 'going' ? '✅ Confirmé' : '❤️ Intéressé'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] text-gray-400 font-medium">
                    {new Date(p.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
