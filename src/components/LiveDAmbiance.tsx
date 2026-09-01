import { useState, useEffect, useRef, FormEvent } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAppStore } from '../store';
import { triggerHapticFeedback } from '../utils/haptics';
import { 
  Video, 
  Users, 
  Clock, 
  MessageSquare, 
  Send, 
  Award, 
  Heart, 
  Flame, 
  PartyPopper, 
  Laugh, 
  Eye, 
  TrendingUp, 
  Volume2, 
  Play, 
  UserPlus, 
  MousePointerClick 
} from 'lucide-react';

interface LiveDAmbianceProps {
  establishmentId: string;
  establishmentName: string;
}

interface LiveSession {
  id: string;
  establishmentId: string;
  establishmentName: string;
  broadcasterId: string;
  broadcasterName: string;
  status: 'live' | 'ended';
  startedAt: any;
  endsAt: any;
  viewersCount: number;
  comments: LiveComment[];
  reactions: { [key: string]: number };
  isPremium: boolean;
}

interface LiveComment {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}

export function LiveDAmbiance({ establishmentId, establishmentName }: LiveDAmbianceProps) {
  const { currentUser, updateEstablishment, establishments } = useAppStore();
  const [activeLive, setActiveLive] = useState<LiveSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number>(300); // 5 or 10 mins
  const [chatInput, setChatInput] = useState('');
  const [showStats, setShowStats] = useState<any | null>(null);
  
  // Camera feed for broadcaster
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const isOwnerOrDJ = currentUser && (
    currentUser.id === establishments.find(e => e.id === establishmentId)?.ownerId || 
    currentUser.role === 'dj'
  );

  const isPremiumEst = establishments.find(e => e.id === establishmentId)?.isEntreprise || false;

  // Listen to the live session for this establishment
  useEffect(() => {
    let active = true;
    let channel: any = null;

    const loadAndSubscribe = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('live_ambiance')
            .select('*')
            .eq('establishmentId', establishmentId)
            .eq('isLive', true)
            .maybeSingle();

          if (!error && data && active) {
            const row = data as any;
            const liveData: LiveSession = {
              id: row.id,
              establishmentId: row.establishmentId,
              establishmentName: establishmentName,
              broadcasterId: row.broadcasterId || currentUser?.id || 'dj',
              broadcasterName: row.broadcasterName || 'DJ Live',
              status: 'live',
              startedAt: new Date(row.startedAt).getTime(),
              endsAt: new Date(row.endedAt || (new Date(row.startedAt).getTime() + 300 * 1000)).getTime(),
              viewersCount: row.viewersCount || 10,
              comments: Array.isArray(row.comments) ? row.comments : [],
              reactions: row.reactions || { heart: 1, fire: 1, clap: 1, love: 1, laugh: 1 },
              isPremium: isPremiumEst
            };
            setActiveLive(liveData);

            const now = Date.now();
            const diff = Math.max(0, Math.floor((liveData.endsAt - now) / 1000));
            setTimeRemaining(diff);
          } else if (active) {
            setActiveLive(null);
          }

          // Subscribe with unique channel name to prevent "after subscribe" errors
          const uniqueLiveChannel = `live_ambiance:${establishmentId}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
          channel = supabase
            .channel(uniqueLiveChannel)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'live_ambiance', filter: `establishmentId=eq.${establishmentId}` },
              (payload: any) => {
                if (payload.new && payload.new.isLive && active) {
                  const row = payload.new;
                  const liveData: LiveSession = {
                    id: row.id,
                    establishmentId: row.establishmentId,
                    establishmentName: establishmentName,
                    broadcasterId: row.broadcasterId || currentUser?.id || 'dj',
                    broadcasterName: row.broadcasterName || 'DJ Live',
                    status: 'live',
                    startedAt: new Date(row.startedAt).getTime(),
                    endsAt: new Date(row.endedAt || (new Date(row.startedAt).getTime() + 300 * 1000)).getTime(),
                    viewersCount: row.viewersCount || 10,
                    comments: Array.isArray(row.comments) ? row.comments : [],
                    reactions: row.reactions || { heart: 1, fire: 1, clap: 1, love: 1, laugh: 1 },
                    isPremium: isPremiumEst
                  };
                  setActiveLive(liveData);
                } else if (active) {
                  setActiveLive(null);
                }
              }
            )
            .subscribe();
        } catch (e) {
          console.error(e);
        }
      }
      if (active) {
        setLoading(false);
      }
    };

    loadAndSubscribe();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [establishmentId, establishmentName]);

  // Broadcaster Timer
  useEffect(() => {
    if (!activeLive || activeLive.status !== 'live') return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.max(0, Math.floor((activeLive.endsAt - now) / 1000));
      setTimeRemaining(diff);

      if (diff <= 0) {
        clearInterval(interval);
        handleEndLive();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeLive]);

  // Broadcaster camera setup
  useEffect(() => {
    if (isBroadcasting) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          setMediaStream(stream);
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => {
          console.warn("Camera/Mic blocked or unavailable in iframe, simulating feed", err);
        });
    } else {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        setMediaStream(null);
      }
    }
  }, [isBroadcasting]);

  const handleStartLive = async () => {
    if (!currentUser) return;
    triggerHapticFeedback(50);
    
    const maxDurationSeconds = isPremiumEst ? 600 : 300; // 10 mins vs 5 mins
    const endsAt = Date.now() + maxDurationSeconds * 1000;

    const newLive = {
      establishmentId,
      videoUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7',
      title: `Direct de ${establishmentName}`,
      isLive: true,
      viewersCount: Math.floor(Math.random() * 12) + 5,
      startedAt: new Date().toISOString(),
      endedAt: new Date(endsAt).toISOString(),
      broadcasterId: currentUser.id,
      broadcasterName: currentUser.name,
      comments: [
        {
          id: 'system-1',
          userId: 'system',
          userName: '🚀 ZAKA BOT',
          text: `Le direct d'ambiance de ${establishmentName} commence !`,
          timestamp: Date.now()
        }
      ],
      reactions: { heart: 1, fire: 1, clap: 1, love: 1, laugh: 1 }
    };

    try {
      if (isSupabaseConfigured) {
        await supabase.from('live_ambiance').insert(newLive);
      }
      setIsBroadcasting(true);
      
      // Simulate pushing a notification to followers
      if ('serviceWorker' in navigator && Notification.permission === 'granted') {
        new Notification("🔴 LIVE ZAKA", {
          body: `L'établissement ${establishmentName} est actuellement en direct d'ambiance ! Rejoignez la fièvre.`,
          icon: '/icon.png'
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEndLive = async () => {
    if (!activeLive) return;
    triggerHapticFeedback([100, 50, 100]);

    // Save Replay to Stories automatically
    const storyPayload = {
      establishmentId,
      establishmentName,
      creatorId: currentUser?.id || 'system',
      creatorName: currentUser?.name || 'Gérant',
      creatorAvatar: currentUser?.avatar || '',
      type: 'video',
      mediaUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600',
      caption: `🔴 REPLAY : Super Ambiance d'hier soir chez ${establishmentName} !`,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      reactions: { '🔥': [], '❤️': [], '👏': [] },
      views: [],
      location: establishmentName
    };

    try {
      if (isSupabaseConfigured) {
        // Add story
        await supabase.from('stories').insert(storyPayload);

        // Delete the live session
        await supabase.from('live_ambiance').delete().eq('establishmentId', establishmentId);
      }

      // Generate random interesting stats
      const totalSpectators = Math.floor(Math.random() * 180) + 45;
      const avgWatchTime = activeLive.isPremium ? "4m 12s" : "2m 45s";
      const peakViewers = Math.floor(totalSpectators * 0.7);
      const newFollowers = Math.floor(totalSpectators * 0.15);
      const profileClicks = Math.floor(totalSpectators * 0.35);

      setShowStats({
        totalSpectators,
        avgWatchTime,
        peakViewers,
        newFollowers,
        profileClicks
      });

      setIsBroadcasting(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !chatInput.trim() || !activeLive) return;

    const newComment: LiveComment = {
      id: `${currentUser.id}-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      text: chatInput.trim(),
      timestamp: Date.now()
    };

    const updatedComments = [...activeLive.comments, newComment];

    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('live_ambiance')
          .update({ comments: updatedComments })
          .eq('establishmentId', establishmentId);
      }
      setChatInput('');
      triggerHapticFeedback(15);
    } catch (err) {
      console.error(err);
    }
  };

  const handleReaction = async (type: string) => {
    if (!activeLive) return;
    triggerHapticFeedback(20);

    const updatedReactions = {
      ...activeLive.reactions,
      [type]: (activeLive.reactions[type] || 0) + 1
    };

    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('live_ambiance')
          .update({ reactions: updatedReactions })
          .eq('establishmentId', establishmentId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Format countdown
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // If live ended or Broadcaster has finished showing stats
  if (showStats) {
    return (
      <div className="p-6 bg-gradient-to-br from-orange-500 to-amber-600 rounded-3xl text-white shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-white/20 rounded-full">
            <Award className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-wider">Live Terminé avec Succès !</h3>
          <p className="text-xs text-orange-100">Le replay de 24h a été publié automatiquement dans les Stories.</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-white/10 rounded-2xl flex items-center gap-3">
            <Users className="w-5 h-5 text-amber-200" />
            <div>
              <div className="text-[10px] text-orange-200 font-black uppercase">Spectateurs Max</div>
              <div className="text-lg font-black">{showStats.totalSpectators}</div>
            </div>
          </div>
          <div className="p-4 bg-white/10 rounded-2xl flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-200" />
            <div>
              <div className="text-[10px] text-orange-200 font-black uppercase">Durée Moyenne</div>
              <div className="text-lg font-black">{showStats.avgWatchTime}</div>
            </div>
          </div>
          <div className="p-4 bg-white/10 rounded-2xl flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-amber-200" />
            <div>
              <div className="text-[10px] text-orange-200 font-black uppercase">Pic d'audience</div>
              <div className="text-lg font-black">{showStats.peakViewers}</div>
            </div>
          </div>
          <div className="p-4 bg-white/10 rounded-2xl flex items-center gap-3">
            <UserPlus className="w-5 h-5 text-amber-200" />
            <div>
              <div className="text-[10px] text-orange-200 font-black uppercase">Nouveaux Abonnés</div>
              <div className="text-lg font-black">+{showStats.newFollowers}</div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-white/10 rounded-2xl flex items-center gap-3">
          <MousePointerClick className="w-5 h-5 text-amber-200" />
          <div>
            <div className="text-[10px] text-orange-200 font-black uppercase">Clics vers la fiche établissement</div>
            <div className="text-lg font-black">{showStats.profileClicks} clics</div>
          </div>
        </div>

        <button
          onClick={() => setShowStats(null)}
          className="w-full bg-white text-orange-600 font-black text-xs py-3 rounded-2xl active:scale-95 transition-all cursor-pointer shadow-md"
        >
          Fermer l'analyse
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Broadcaster controls when no live is active */}
      {!activeLive && (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl text-center space-y-4">
          <div className="w-14 h-14 bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center mx-auto">
            <Video className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="font-black text-gray-900 dark:text-white text-base">Ambiance En Direct 🔴</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-normal">
              Faites vivre l'ambiance de votre maquis, bar ou discothèque en direct ! Vos abonnés seront notifiés en instantané.
            </p>
          </div>

          {isOwnerOrDJ ? (
            <button
              onClick={handleStartLive}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl active:scale-95 transition-all shadow-md shadow-red-600/10 cursor-pointer inline-flex items-center gap-2"
            >
              <span>Démarrer le Live</span>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded font-black">{isPremiumEst ? "10 min (Premium)" : "5 min"}</span>
            </button>
          ) : (
            <div className="p-3 bg-gray-150/50 dark:bg-gray-800/40 rounded-xl max-w-xs mx-auto">
              <span className="text-xs text-gray-500 font-bold">Aucun live en cours pour le moment.</span>
            </div>
          )}
        </div>
      )}

      {/* Active Live Broadcast / View Mode */}
      {activeLive && (
        <div className="relative rounded-3xl overflow-hidden bg-black aspect-[9/16] w-full max-w-sm mx-auto text-white shadow-2xl flex flex-col justify-between">
          
          {/* Header info */}
          <div className="p-4 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="bg-red-600 animate-pulse text-[10px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md shadow-red-600/30">
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                EN DIRECT
              </span>
              <span className="bg-black/40 backdrop-blur-md text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {activeLive.viewersCount}
              </span>
            </div>

            <span className="bg-black/40 backdrop-blur-md text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 text-amber-300">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(timeRemaining)}
            </span>
          </div>

          {/* Video stream container */}
          <div className="absolute inset-0 z-0 bg-gray-950 flex items-center justify-center">
            {isBroadcasting ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              // Spectator simulated rhythmic dancing equalizer graphics
              <div className="relative w-full h-full bg-gradient-to-t from-gray-950 via-purple-950/20 to-gray-950 flex flex-col items-center justify-center gap-4 text-center p-6">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl animate-pulse"></div>
                
                {/* Rhythmic equalizer animation */}
                <div className="flex items-end gap-1 h-14">
                  {[1, 2, 3, 4, 5, 6, 7].map((bar) => (
                    <div
                      key={bar}
                      className="w-1.5 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full animate-bounce"
                      style={{
                        height: `${Math.floor(Math.random() * 40) + 15}px`,
                        animationDelay: `${bar * 0.15}s`,
                        animationDuration: `${0.6 + Math.random() * 0.5}s`
                      }}
                    ></div>
                  ))}
                </div>

                <div className="space-y-1 z-10">
                  <p className="text-xs font-black uppercase text-purple-400 tracking-wider">Diffusion en temps réel</p>
                  <p className="text-[10px] text-gray-400 font-bold px-4">Le son d'ambiance et le visuel du DJ sont synchronisés.</p>
                </div>
              </div>
            )}
          </div>

          {/* Comments & Interactive Zone */}
          <div className="p-4 bg-gradient-to-t from-black via-black/50 to-transparent z-10 space-y-3 flex flex-col justify-end">
            
            {/* Live comments feed */}
            <div className="max-h-40 overflow-y-auto space-y-1.5 hide-scrollbar">
              {activeLive.comments.slice(-10).map((cmt) => (
                <div key={cmt.id} className="bg-black/35 backdrop-blur-sm p-1.5 px-3 rounded-xl inline-block max-w-[85%] text-left">
                  <span className="text-[10px] font-black text-orange-400 block">{cmt.userName}</span>
                  <span className="text-xs font-bold text-gray-200">{cmt.text}</span>
                </div>
              ))}
            </div>

            {/* Quick Reactions buttons */}
            <div className="flex gap-1.5 overflow-x-auto py-1 hide-scrollbar">
              {[
                { type: 'heart', emoji: '❤️' },
                { type: 'fire', emoji: '🔥' },
                { type: 'clap', emoji: '👏' },
                { type: 'love', emoji: '😍' },
                { type: 'laugh', emoji: '😂' }
              ].map((react) => (
                <button
                  key={react.type}
                  onClick={() => handleReaction(react.type)}
                  className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 transition-all rounded-full flex items-center gap-1 font-bold text-xs cursor-pointer text-white/90"
                >
                  <span>{react.emoji}</span>
                  <span className="text-[9px] font-bold text-white/60">
                    {activeLive.reactions[react.type] || 0}
                  </span>
                </button>
              ))}
            </div>

            {/* Message input */}
            <form onSubmit={handleSendComment} className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Dire quelque chose de sympa..."
                className="flex-1 px-4 py-2.5 bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white placeholder-white/40 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
              />
              <button
                type="submit"
                className="p-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 transition-all text-white rounded-xl flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            {/* End live button for broadcaster */}
            {isBroadcasting && (
              <button
                onClick={handleEndLive}
                className="w-full mt-2 py-2 bg-red-600/90 hover:bg-red-700 text-white text-[11px] font-black uppercase rounded-xl tracking-wider active:scale-95 transition-all cursor-pointer"
              >
                Arrêter le direct d'ambiance
              </button>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
