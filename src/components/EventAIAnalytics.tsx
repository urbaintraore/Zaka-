import { useState, useEffect, FormEvent } from 'react';
import { Publication, Establishment, EventParticipation } from '../types';
import { db } from '../lib/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Sparkles, TrendingUp, Clock, AlertTriangle, Lightbulb, Zap, Send, BarChart2, ShieldAlert } from 'lucide-react';

interface AIAnalyticsProps {
  event: Publication;
  establishment: Establishment | null;
}

export function EventAIAnalytics({ event, establishment }: AIAnalyticsProps) {
  const [participations, setParticipations] = useState<EventParticipation[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiChat, setAIChat] = useState<{ sender: 'gemini' | 'user'; text: string; time: string }[]>([]);
  const [userQuery, setUserQuery] = useState("");
  const [chatIsTyping, setChatIsTyping] = useState(false);

  // Load live participations to calculate exact statistics
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
      setLoading(false);
    }, (error) => {
      console.error(error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [event.id]);

  // Participation breakdowns
  const interested = participations.filter(p => p.status === 'interested').length;
  const going = participations.filter(p => p.status === 'going').length;
  const present = participations.filter(p => p.status === 'present').length;
  const totalRSVP = interested + going + present;
  const views = event.views || 0;

  // Real-time AI Calculations
  // 1. Compatibility score based on event category
  const getCompatibilityScore = () => {
    const category = establishment?.category?.toLowerCase() || '';
    if (category.includes('soirée') || category.includes('club') || category.includes('boite')) return 94;
    if (category.includes('concert') || category.includes('live')) return 88;
    if (category.includes('bar') || category.includes('lounge')) return 81;
    return 75;
  };

  // 2. Affluence Prediction algorithm
  const predictedMin = Math.max(totalRSVP * 1.5, 10) + Math.round(views * 0.1);
  const predictedMax = Math.max(totalRSVP * 2.8, 25) + Math.round(views * 0.25);

  // 3. Peak Hour estimation
  const getPeakHour = () => {
    const category = establishment?.category?.toLowerCase() || '';
    if (category.includes('boite') || category.includes('club') || category.includes('night')) {
      return "01:30 - 03:00";
    }
    if (category.includes('live') || category.includes('concert')) {
      return "21:30 - 23:00";
    }
    return "20:00 - 22:30"; // default lounge/maquis
  };

  // 4. Virality check (growth rate multiplier based on views vs rsvp)
  const viralityIndex = Math.min(Math.round(((totalRSVP * 10) + views) / 2.5), 100);
  const isViral = viralityIndex > 65;

  // 5. Best story publication hour (2 hours before peak hour starts)
  const getBestStoryTime = () => {
    const peak = getPeakHour().split(' - ')[0];
    const [hour, minute] = peak.split(':');
    let storyHour = parseInt(hour) - 2;
    if (storyHour < 0) storyHour += 24;
    return `${String(storyHour).padStart(2, '0')}:${minute} (Juste avant l'enjaillement)`;
  };

  // 6. Advertising Boost Advisor
  const getBoostAdvice = () => {
    if (isViral) {
      return {
        recommended: "Boost Or (Propulsion Locale)",
        budget: "10,000 FCFA",
        expectedReach: "+15,000 fêtards",
        reason: "La courbe d'intérêt explose ! Un boost Or convertira l'attention en affluence record."
      };
    } else if (totalRSVP < 5) {
      return {
        recommended: "Boost Bronze (Coup de Pouce)",
        budget: "3,000 FCFA",
        expectedReach: "+4,500 fêtards",
        reason: "L'événement manque de visibilité de départ. Un boost de base déclenchera l'effet réseau."
      };
    } else {
      return {
        recommended: "Boost Argent (Intermédiaire)",
        budget: "5,000 FCFA",
        expectedReach: "+8,000 fêtards",
        reason: "Bon taux d'engagement. Le boost Argent étendra la portée au-delà de vos abonnés fidèles."
      };
    }
  };

  const boost = getBoostAdvice();

  // Initialize chatbot on load
  useEffect(() => {
    if (aiChat.length === 0 && !loading) {
      setAIChat([
        {
          sender: 'gemini',
          text: `Salut ! Je suis Gemini, ton assistant IA de la vie nocturne. J'ai analysé l'événement "${event.title}". Pose-moi toutes tes questions sur les prévisions d'affluence, le ciblage ou l'optimisation de ton budget publicitaire !`,
          time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [loading, event.title]);

  // Handle Chatbot Query
  const handleChatSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || chatIsTyping) return;

    const userMsg = userQuery;
    const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    setAIChat(prev => [...prev, { sender: 'user', text: userMsg, time: now }]);
    setUserQuery("");
    setChatIsTyping(true);

    // Simulate AI response based on query keywords
    setTimeout(() => {
      let responseText = `Intéressant ! D'après mes calculs prédictifs pour "${event.title}", le taux d'engagement actuel est de ${viralityIndex}%. Je te conseille d'axer tes stories sur les coulisses et l'ambiance dès ${getBestStoryTime()} pour maximiser la conversion.`;

      const q = userMsg.toLowerCase();
      if (q.includes('monde') || q.includes('affluence') || q.includes('mouvement') || q.includes('gens')) {
        responseText = `D'après le ratio d'intérêt (${interested} intéressés, ${going} j'y vais), je prévois une affluence de ${Math.round(predictedMin)} à ${Math.round(predictedMax)} personnes. L'heure de pointe se situera vers ${getPeakHour().split(' - ')[0]}. Assure-toi d'avoir assez de staff à ce moment-là !`;
      } else if (q.includes('pub') || q.includes('boost') || q.includes('argent') || q.includes('budget')) {
        responseText = `Je recommande vivement le ${boost.recommended} pour un budget de ${boost.budget}. Cela te permettra de toucher environ ${boost.expectedReach} personnes qualifiées à Ouagadougou. C'est l'investissement le plus rentable actuellement.`;
      } else if (q.includes('story') || q.includes('heure') || q.includes('quand')) {
        responseText = `Le meilleur moment pour publier une story est à ${getBestStoryTime()}. Les utilisateurs consultent massivement l'application en fin d'après-midi pour planifier leur soirée. N'oublie pas d'y ajouter un sticker de localisation et une musique à la mode !`;
      } else if (q.includes('viral') || q.includes('tendance')) {
        responseText = isViral 
          ? `Oui, l'événement est VIRAL ! L'indice de viralité est de ${viralityIndex}/100. L'engouement organique est très fort, profites-en pour ajouter des stories exclusives !`
          : `L'événement a un score d'intérêt de ${viralityIndex}/100. Il n'est pas encore totalement viral, mais un léger coup de pouce publicitaire de ${boost.budget} pourrait allumer la mèche !`;
      }

      setAIChat(prev => [...prev, {
        sender: 'gemini',
        text: responseText,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }]);
      setChatIsTyping(false);
      
      // Play clean notification sounds / haptics if desired
      import('../utils/haptics').then(m => m.triggerHapticFeedback(30));
    }, 1200);
  };

  return (
    <div className="w-full flex flex-col gap-4 border-2 border-orange-500/10 dark:border-orange-500/5 bg-gradient-to-br from-orange-50/20 to-amber-50/20 dark:from-orange-950/5 dark:to-amber-950/5 rounded-3xl p-5 relative overflow-hidden">
      {/* Decorative gradient glowing orb */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header title */}
      <div className="flex items-center justify-between border-b border-orange-200/30 dark:border-orange-950/20 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-600 dark:text-orange-400 animate-spin" />
          <div>
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">Gemini AI Insights</h4>
            <p className="text-[10px] text-orange-600 dark:text-orange-400 font-extrabold">Prédictions et analyses d'audience en temps réel</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-orange-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
          <Zap className="w-2.5 h-2.5 fill-current" /> Live
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2 text-xs text-gray-400">
          <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <span>Calcul des prévisions en cours...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Column 1: Core Metrics Grid */}
          <div className="space-y-3.5">
            {/* Compatibility Badge */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-950 p-3 rounded-2xl border border-orange-100 dark:border-orange-950/30">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase block">Affinité fêtards</span>
                <span className="text-sm font-black text-gray-800 dark:text-gray-200">Compatibilité cible</span>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-orange-600 dark:text-orange-400">{getCompatibilityScore()}%</span>
                <span className="text-[9px] text-green-500 font-bold block">Match optimal</span>
              </div>
            </div>

            {/* Affluence & Peak Hours */}
            <div className="bg-white dark:bg-gray-950 p-3.5 rounded-2xl border border-orange-100 dark:border-orange-950/30 space-y-3">
              <div className="flex items-start gap-2.5">
                <TrendingUp className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase block">Affluence prévue</span>
                  <p className="text-xs font-black text-gray-800 dark:text-gray-200">
                    {Math.round(predictedMin)} - {Math.round(predictedMax)} personnes attendues
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 border-t border-gray-100 dark:border-gray-900/60 pt-2.5">
                <Clock className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[9px] text-gray-400 font-bold uppercase block">Heure de pointe estimée</span>
                  <p className="text-xs font-black text-gray-800 dark:text-gray-200">
                    {getPeakHour()} <span className="text-[9px] text-orange-500 font-bold">(Vibe maximale)</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Virality and Story recommendation */}
            <div className="bg-white dark:bg-gray-950 p-3.5 rounded-2xl border border-orange-100 dark:border-orange-950/30 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-500">Tendance de propagation</span>
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-sm ${isViral ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                  {isViral ? "🔥 VIRAL" : "ENGAGEMENT SÉCURISÉ"}
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full" style={{ width: `${viralityIndex}%` }} />
              </div>

              <div className="flex items-start gap-2.5 border-t border-gray-100 dark:border-gray-900/60 pt-2.5">
                <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="text-xs">
                  <span className="text-[9px] text-gray-400 font-bold uppercase block">Timing Story idéal</span>
                  <p className="font-extrabold text-gray-800 dark:text-gray-200">Publier vers {getBestStoryTime()}</p>
                </div>
              </div>
            </div>

            {/* Smart Ad Boost Panel */}
            <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 rounded-2xl shadow-md flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] bg-white/20 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Boost publicitaire IA</span>
                <Zap className="w-3.5 h-3.5 fill-current" />
              </div>
              <h5 className="font-extrabold text-sm">{boost.recommended} ({boost.budget})</h5>
              <p className="text-[10px] text-orange-100 leading-snug">{boost.reason}</p>
              <div className="mt-1 flex items-center justify-between text-[10px] font-black border-t border-white/20 pt-1.5">
                <span>Audience estimée</span>
                <span className="text-orange-200">{boost.expectedReach}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Gemini Chatbot Simulator */}
          <div className="flex flex-col border border-orange-100 dark:border-orange-950/30 rounded-2xl bg-white dark:bg-gray-950 overflow-hidden h-[340px]">
            {/* Chatbot title */}
            <div className="px-3.5 py-2.5 bg-orange-50/50 dark:bg-orange-950/10 border-b border-gray-100 dark:border-gray-900 flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
              <span className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-wider">Poser une question à Gemini</span>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3.5 flex flex-col">
              {aiChat.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col max-w-[85%] text-xs ${
                    msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                  }`}
                >
                  <div className={`p-2.5 rounded-2xl font-medium leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-orange-600 text-white rounded-tr-none' 
                      : 'bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-900'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-gray-400 font-bold mt-1 px-1">{msg.time}</span>
                </div>
              ))}

              {chatIsTyping && (
                <div className="self-start flex gap-1 p-2 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-900 text-gray-400 text-[10px] items-center">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="ml-1">Gemini réfléchit...</span>
                </div>
              )}
            </div>

            {/* Chatbot input controls */}
            <form onSubmit={handleChatSubmit} className="p-2 border-t border-gray-100 dark:border-gray-900 flex gap-1.5 bg-gray-50/50">
              <input
                type="text"
                value={userQuery}
                onChange={e => setUserQuery(e.target.value)}
                placeholder="Ex. Quel boost choisir ? Combien de monde ?"
                className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full px-3 py-1.5 text-xs outline-none focus:ring-1 focus:ring-orange-500 font-bold"
              />
              <button
                type="submit"
                disabled={!userQuery.trim() || chatIsTyping}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-full p-2 flex-shrink-0 active:scale-95 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      )}
    </div>
  );
}
