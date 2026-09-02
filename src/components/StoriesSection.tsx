import { useState, useEffect, useRef, FormEvent } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAppStore } from '../store';
import { Story, Establishment } from '../types';
import { X, Play, Heart, Send, Plus, Eye, Award, Volume2, MapPin, Smile, MessageCircle, BarChart3, Star, Trash2 } from 'lucide-react';

const STATIC_PRESETS = [
  {
    title: "🔥 Ambiance de folie !",
    text: "🔥 L'ambiance commence à chauffer ici !! Ne manquez pas ça.",
    mediaUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80",
    music: "Afrobeats Mix 2026",
    emoji: "🔥"
  },
  {
    title: "🎧 DJ Carlos aux platines",
    text: "🎧 DJ Carlos est déjà aux platines pour le set le plus chaud du weekend !",
    mediaUrl: "https://images.unsplash.com/photo-1571266028243-e4733b0f0bb1?auto=format&fit=crop&w=600&q=80",
    music: "Deep House Live - DJ Carlos",
    emoji: "⚡"
  },
  {
    title: "🍹 Happy Hour !",
    text: "🍹 Happy Hour jusqu'à 21h ! Un verre acheté = un verre offert.",
    mediaUrl: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=600&q=80",
    music: "Chill Out Jazz",
    emoji: "🍹"
  },
  {
    title: "✨ VIP Night",
    text: "✨ Entrée VIP gratuite pour les filles avant minuit. Ambiance garantie !",
    mediaUrl: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80",
    music: "Club Anthem 2026",
    emoji: "👑"
  }
];

export function StoriesSection({ onStartChat }: { onStartChat?: (estId: string, recipient?: 'gerant' | 'dj') => void }) {
  const { currentUser, establishments, relationshipRequests, setGlobalError } = useAppStore();
  const [stories, setStories] = useState<Story[]>([]);
  const [activeCreatorIndex, setActiveCreatorIndex] = useState<number | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState<number>(0);
  const [isViewing, setIsViewing] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [showStats, setShowStats] = useState<Story[] | null>(null);

  // Form State
  const [storyText, setStoryText] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [customMedia, setCustomMedia] = useState("");
  const [storyEmoji, setStoryEmoji] = useState("🔥");
  const [storyMusic, setStoryMusic] = useState("");
  const [storyLocation, setStoryLocation] = useState("");
  const [customLocation, setCustomLocation] = useState("");
  const [selectedCreatorId, setSelectedCreatorId] = useState("");
  const [replyText, setReplyText] = useState("");

  // Animation & autoplay references
  const progressTimer = useRef<NodeJS.Timeout | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [floatingReactions, setFloatingReactions] = useState<{ id: string; emoji: string; left: number }[]>([]);

  // Find users' possible creator identities
  const managedEsts = establishments.filter(e => e.ownerId === currentUser?.id && e.status === 'valide');
  const djRequests = relationshipRequests.filter(r => r.initiatorId === currentUser?.id && r.isDJ && r.status === 'acceptee');
  const isPartner = currentUser?.role === 'entreprise';

  // Load active stories from Supabase
  useEffect(() => {
    let active = true;
    let channel: any = null;

    const loadStories = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('stories')
            .select('*');

          if (!error && data && active) {
            const allStories = data as Story[];
            
            // Filter 24h client-side to keep current
            const activeStories = allStories.filter(s => {
              const diff = Date.now() - new Date(s.createdAt).getTime();
              return diff < 24 * 60 * 60 * 1000;
            });

            // Sort by date ascending so oldest story of creator plays first
            activeStories.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            setStories(activeStories);
          }

          // Realtime Postgres changes with a unique name to prevent "after subscribe" subscription errors
          const uniqueChannelName = `stories-channel-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
          channel = supabase
            .channel(uniqueChannelName)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'stories' },
              async () => {
                const { data: updatedStories } = await supabase.from('stories').select('*');
                if (updatedStories && active) {
                  const activeStories = (updatedStories as Story[]).filter(s => {
                    const diff = Date.now() - new Date(s.createdAt).getTime();
                    return diff < 24 * 60 * 60 * 1000;
                  });
                  activeStories.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                  setStories(activeStories);
                }
              }
            )
            .subscribe();

        } catch (e) {
          console.error(e);
        }
      }
    };

    loadStories();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  // Preset autofills
  useEffect(() => {
    if (selectedPreset !== null) {
      const preset = STATIC_PRESETS[selectedPreset];
      setStoryText(preset.text);
      setCustomMedia(preset.mediaUrl);
      setStoryMusic(preset.music);
      setStoryEmoji(preset.emoji);
    }
  }, [selectedPreset]);

  // Group stories by creator
  const groupedStories: { [creatorId: string]: Story[] } = {};
  stories.forEach(s => {
    if (!groupedStories[s.creatorId]) {
      groupedStories[s.creatorId] = [];
    }
    groupedStories[s.creatorId].push(s);
  });

  const creatorsList = Object.keys(groupedStories).map(creatorId => {
    const creatorStories = groupedStories[creatorId];
    const firstStory = creatorStories[0];
    const allViewed = creatorStories.every(s => s.views?.includes(currentUser?.id || ''));
    return {
      creatorId,
      name: firstStory.creatorName,
      avatar: firstStory.creatorAvatar,
      type: firstStory.creatorType,
      stories: creatorStories,
      allViewed
    };
  });

  // Calculate current story limits for the active creator identity
  const getCreatorTodayCount = (creatorId: string) => {
    return stories.filter(s => s.creatorId === creatorId && s.creatorType !== 'establishment').length; // simple check
  };

  // Autoplay story hook
  useEffect(() => {
    if (isViewing && activeCreatorIndex !== null && !isPaused) {
      const currentCreator = creatorsList[activeCreatorIndex];
      const currentStory = currentCreator.stories[activeStoryIndex];

      // Mark as viewed in Supabase if not already viewed
      if (currentUser && !currentStory.views?.includes(currentUser.id)) {
        const updatedViews = [...(currentStory.views || []), currentUser.id];
        if (isSupabaseConfigured) {
          supabase
            .from('stories')
            .update({ views: updatedViews })
            .eq('id', currentStory.id)
            .then(({ error }) => {
              if (error) console.error("Error updating story view:", error);
            });
        }
      }

      setStoryProgress(0);
      const intervalDuration = 50; // Update progress bar every 50ms
      const storyDuration = 5000; // 5 seconds per story
      const step = (intervalDuration / storyDuration) * 100;

      progressTimer.current = setInterval(() => {
        setStoryProgress(prev => {
          if (prev >= 100) {
            handleNextStory();
            return 0;
          }
          return prev + step;
        });
      }, intervalDuration);
    }

    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, [isViewing, activeCreatorIndex, activeStoryIndex, isPaused]);

  const handleNextStory = () => {
    if (activeCreatorIndex === null) return;
    const currentCreator = creatorsList[activeCreatorIndex];
    if (activeStoryIndex < currentCreator.stories.length - 1) {
      setActiveStoryIndex(prev => prev + 1);
    } else {
      // Go to next creator's stories
      if (activeCreatorIndex < creatorsList.length - 1) {
        setActiveCreatorIndex(prev => prev + 1);
        setActiveStoryIndex(0);
      } else {
        // No more creators, close viewer
        setIsViewing(false);
        setActiveCreatorIndex(null);
      }
    }
  };

  const handlePrevStory = () => {
    if (activeCreatorIndex === null) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(prev => prev - 1);
    } else {
      // Go to previous creator
      if (activeCreatorIndex > 0) {
        setActiveCreatorIndex(prev => prev - 1);
        const prevCreator = creatorsList[activeCreatorIndex - 1];
        setActiveStoryIndex(prevCreator.stories.length - 1);
      }
    }
  };

  // Cleanup expired stories simulation button
  const handleCleanupExpired = async () => {
    try {
      if (isSupabaseConfigured) {
        const { data } = await supabase.from('stories').select('*');
        if (data) {
          let count = 0;
          for (const s of data) {
            const diff = Date.now() - new Date(s.createdAt).getTime();
            if (diff >= 24 * 60 * 60 * 1000) {
              await supabase.from('stories').delete().eq('id', s.id);
              count++;
            }
          }
          alert(`Nettoyage complété. ${count} stories expirées (>24h) supprimées.`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Story
  const handlePublishStory = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!selectedCreatorId) {
      setGlobalError({ message: "Veuillez sélectionner pour quelle identité publier la Story.", type: "warning" });
      return;
    }

    // Resolve creator details
    let creatorName = currentUser.name || "Client";
    let creatorAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200";
    let creatorType: 'establishment' | 'dj' | 'influencer' | 'organizer' = 'influencer';
    let establishmentId = "";

    const selectedEst = establishments.find(est => est.id === selectedCreatorId);
    if (selectedEst) {
      creatorName = selectedEst.name;
      creatorAvatar = selectedEst.photos?.[0] || creatorAvatar;
      creatorType = 'establishment';
      establishmentId = selectedEst.id;
    } else {
      const selectedDjReq = djRequests.find(req => req.establishmentId === selectedCreatorId);
      if (selectedDjReq) {
        creatorName = `DJ ${currentUser.name || "Partenaire"}`;
        creatorType = 'dj';
        establishmentId = selectedDjReq.establishmentId;
        const linkedEst = establishments.find(est => est.id === establishmentId);
        creatorAvatar = linkedEst?.photos?.[0] || creatorAvatar;
      } else if (isPartner) {
        creatorName = currentUser.name || "Partenaire";
        creatorType = 'organizer';
      }
    }

    // Check Limits for Free Accounts
    const isPremium = selectedEst && (selectedEst as any).isPremium;
    if (creatorType === 'establishment' && !isPremium) {
      const todayStories = stories.filter(s => s.creatorId === selectedCreatorId);
      if (todayStories.length >= 2) {
        setGlobalError({ message: "Compte Gratuit: Limite de 2 Stories par jour atteinte. Passez en Premium pour un accès illimité !", type: "warning" });
        return;
      }
    }

    const storyData = {
      creatorId: selectedCreatorId,
      creatorName,
      creatorAvatar,
      creatorType,
      mediaUrl: customMedia || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80",
      mediaType: 'image',
      text: storyText,
      emoji: storyEmoji,
      music: storyMusic,
      location: customLocation || storyLocation || "Ouagadougou",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      views: [],
      reactions: {},
      responsesCount: 0,
      establishmentId: establishmentId || null
    };

    try {
      if (isSupabaseConfigured) {
        await supabase.from('stories').insert([storyData]);
      }
      setIsPosting(false);
      setStoryText("");
      setCustomMedia("");
      setSelectedPreset(null);
      setStoryMusic("");
      setStoryLocation("");
      setCustomLocation("");
      // Refresh UI haptic feedback
      import('../utils/haptics').then(m => m.triggerHapticFeedback([50, 30, 50]));
    } catch (err) {
      console.error("Error creating story:", err);
      setGlobalError({ message: "Erreur lors de la publication de la Story.", type: "error" });
    }
  };

  // Quick Emoji Reactions
  const handleReactToStory = async (emoji: string) => {
    if (!currentUser || activeCreatorIndex === null) return;
    const currentCreator = creatorsList[activeCreatorIndex];
    const currentStory = currentCreator.stories[activeStoryIndex];

    const randomLeft = Math.floor(Math.random() * 80) + 10;
    const reactionId = Math.random().toString();
    setFloatingReactions(prev => [...prev, { id: reactionId, emoji, left: randomLeft }]);

    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== reactionId));
    }, 2000);

    const updatedReactions = { ...currentStory.reactions, [currentUser.id]: emoji };

    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('stories')
          .update({ reactions: updatedReactions })
          .eq('id', currentStory.id);
      }
      import('../utils/haptics').then(m => m.triggerHapticFeedback(30));
    } catch (err) {
      console.error(err);
    }
  };

  // Reply direct message integration
  const handleSendReply = async () => {
    if (!currentUser || activeCreatorIndex === null || !replyText.trim()) return;
    const currentCreator = creatorsList[activeCreatorIndex];
    const currentStory = currentCreator.stories[activeStoryIndex];

    const estId = currentStory.establishmentId || currentStory.creatorId;
    const targetEst = establishments.find(e => e.id === estId);
    if (!targetEst) return;

    // Use established message routing format
    const convId = currentStory.creatorType === 'dj'
      ? `${currentUser.id}_${estId}_dj`
      : `${currentUser.id}_${estId}`;

    const textPayload = `💬 Réponse à votre story "${currentStory.text || "image"}" :\n\n${replyText}`;

    try {
      if (isSupabaseConfigured) {
        const isDJChat = currentStory.creatorType === 'dj';
        
        // 1. Ensure conversation document exists
        const convData = {
          clientId: currentUser.id,
          clientName: currentUser.name || currentUser.email || 'Client',
          establishmentId: targetEst.id,
          establishmentName: targetEst.name,
          ownerId: targetEst.ownerId,
          lastMessage: textPayload,
          lastMessageAt: new Date().toISOString(),
          lastMessageDate: new Date().toISOString(),
          lastSenderId: currentUser.id,
          unreadByClient: false,
          unreadByGerant: !isDJChat,
          unreadByDj: isDJChat
        };

        let convDataClean: any = { ...convData };
        let conv: any = null;
        let attempts = 0;
        while (attempts < 15) {
          attempts++;
          const res = await supabase
            .from('conversations')
            .upsert([convDataClean])
            .select()
            .single();
          if (!res.error) {
            conv = res.data;
            break;
          }
          if (res.error.code === '22P02' && convDataClean.id) {
            delete convDataClean.id;
            continue;
          }
          if (res.error.code === 'PGRST204' || res.error.message?.includes('schema cache') || res.error.message?.includes('does not exist') || res.error.message?.includes('column')) {
            const match = res.error.message.match(/Could not find the '([^']+)' column/i) ||
                          res.error.message.match(/column ['"]?([^'"]+)['"]? (?:of relation|does not exist|in the schema cache)/i) ||
                          res.error.message.match(/column ['"]?([^'"]+)['"]? does not exist/i) ||
                          res.error.message.match(/['"]?([^'"]+)['"]? column/i);
            if (match && match[1] && convDataClean[match[1]] !== undefined) {
              delete convDataClean[match[1]];
              continue;
            }
          }
          break;
        }

        if (conv) {
          // 2. Add message
          const messageData = {
            conversationId: conv.id,
            senderId: currentUser.id,
            senderName: currentUser.name || 'Client',
            text: textPayload,
            createdAt: new Date().toISOString()
          };

          await supabase.from('messages').insert([messageData]);
        }

        // 3. Increment story response count
        await supabase
          .from('stories')
          .update({ responsesCount: (currentStory.responsesCount || 0) + 1 })
          .eq('id', currentStory.id);
      }

      setReplyText("");
      setGlobalError({ message: "Votre réponse a été envoyée directement dans l'inbox privé !", type: "info" });
      setIsPaused(false);
    } catch (err) {
      console.error("Error replying to story:", err);
      setGlobalError({ message: "Impossible d'envoyer votre réponse.", type: "error" });
    }
  };

  // Completion Rate calculator
  const calculateCompletionRate = (creatorStories: Story[]) => {
    if (creatorStories.length <= 1) return 100;
    const firstStoryViews = creatorStories[0].views?.length || 0;
    const lastStoryViews = creatorStories[creatorStories.length - 1].views?.length || 0;
    if (firstStoryViews === 0) return 0;
    return Math.round((lastStoryViews / firstStoryViews) * 100);
  };

  // Delete Story
  const handleDeleteStory = async (storyId: string) => {
    if (!window.confirm("Voulez-vous vraiment supprimer cette Story ?")) return;
    try {
      if (isSupabaseConfigured) {
        await supabase.from('stories').delete().eq('id', storyId);
      }
      if (showStats) {
        setShowStats(prev => prev ? prev.filter(s => s.id !== storyId) : null);
      }
      import('../utils/haptics').then(m => m.triggerHapticFeedback([100, 50, 100]));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="w-full flex flex-col gap-3 px-4">
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-gray-800 dark:text-gray-200 tracking-tight uppercase">Stories éphémères (24h)</h3>
        <div className="flex gap-2">
          {(managedEsts.length > 0 || djRequests.length > 0 || isPartner) && (
            <button
              onClick={() => setIsPosting(true)}
              className="flex items-center gap-1 text-[11px] font-black bg-orange-600 text-white px-3 py-1.5 rounded-full shadow-sm hover:bg-orange-700 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publier</span>
            </button>
          )}
          <button
            onClick={handleCleanupExpired}
            className="text-[10px] text-gray-400 hover:text-orange-500 font-bold"
            title="Purger stories expirées"
          >
            🧹 Purger
          </button>
        </div>
      </div>

      {/* Circle horizontal stream */}
      <div className="flex gap-4 overflow-x-auto py-2.5 px-1 -mx-4 scrollbar-none snap-x">
        {/* Post bubble shortcut if creator logged in */}
        {(managedEsts.length > 0 || djRequests.length > 0 || isPartner) && (
          <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer snap-start" onClick={() => setIsPosting(true)}>
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-orange-400/60 dark:border-orange-500/40 flex items-center justify-center bg-orange-50/50 dark:bg-orange-950/20 active:scale-95 transition-all relative">
              <Plus className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <span className="text-[10px] font-black text-gray-600 dark:text-gray-400">Ma Story</span>
          </div>
        )}

        {creatorsList.length === 0 ? (
          <div className="flex items-center gap-3 px-2 py-1 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 text-gray-400 text-xs py-5 w-full justify-center">
            <Smile className="w-4 h-4 text-orange-500" />
            <span>Aucune story disponible. Publiez la première !</span>
          </div>
        ) : (
          creatorsList.map((creator, idx) => {
            // Check if this belongs to logged in manager/dj for stats
            const isMyStory = managedEsts.some(e => e.id === creator.creatorId) ||
                              djRequests.some(r => r.establishmentId === creator.creatorId);

            return (
              <div key={creator.creatorId} className="flex flex-col items-center gap-1.5 flex-shrink-0 snap-start relative group">
                <div 
                  onClick={() => {
                    setActiveCreatorIndex(idx);
                    setActiveStoryIndex(0);
                    setIsViewing(true);
                  }}
                  className={`w-16 h-16 rounded-full flex items-center justify-center p-0.5 cursor-pointer active:scale-95 transition-all ${
                    creator.allViewed 
                      ? 'border-2 border-gray-300 dark:border-gray-700' 
                      : 'border-2 border-orange-500 bg-gradient-to-tr from-yellow-400 via-orange-500 to-pink-500 animate-pulse'
                  }`}
                >
                  <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover rounded-full border border-white dark:border-gray-900" />
                </div>
                <span className="text-[10px] font-black text-gray-800 dark:text-gray-300 max-w-[70px] truncate">{creator.name}</span>

                {/* Creator stats badge overlay */}
                {isMyStory && (
                  <button
                    onClick={() => setShowStats(creator.stories)}
                    className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full p-1 shadow-md hover:bg-blue-700 active:scale-90 transition-all border border-white dark:border-gray-900"
                    title="Voir les statistiques"
                  >
                    <BarChart3 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FULL-SCREEN STORY VIEWER */}
      {isViewing && activeCreatorIndex !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between select-none">
          {/* Top Progress Bars */}
          <div className="absolute top-4 left-0 right-0 px-4 z-20 flex gap-1.5">
            {creatorsList[activeCreatorIndex].stories.map((s, idx) => (
              <div key={s.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500 transition-all duration-75"
                  style={{ 
                    width: idx < activeStoryIndex ? '100%' : idx === activeStoryIndex ? `${storyProgress}%` : '0%' 
                  }}
                />
              </div>
            ))}
          </div>

          {/* Top Header bar with pause */}
          <div className="absolute top-8 left-0 right-0 px-4 z-20 flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-white">
              <img 
                src={creatorsList[activeCreatorIndex].avatar} 
                alt={creatorsList[activeCreatorIndex].name} 
                className="w-10 h-10 rounded-full border border-white/50 object-cover" 
              />
              <div>
                <h4 className="text-sm font-black leading-tight flex items-center gap-1">
                  <span>{creatorsList[activeCreatorIndex].name}</span>
                  {creatorsList[activeCreatorIndex].type === 'establishment' && (
                    <Award className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  )}
                </h4>
                <p className="text-[9px] text-gray-300 font-bold flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />
                  <span>{creatorsList[activeCreatorIndex].stories[activeStoryIndex].location || "Ouagadougou"}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsPaused(p => !p)} 
                className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 text-xs font-bold transition-all"
              >
                {isPaused ? <Play className="w-4 h-4 fill-white" /> : "||"}
              </button>
              <button 
                onClick={() => {
                  setIsViewing(false);
                  setActiveCreatorIndex(null);
                }} 
                className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Left/Right Tap Zones */}
          <div className="absolute inset-0 z-10 flex">
            <div className="w-1/3 h-full cursor-pointer" onClick={handlePrevStory} />
            <div className="w-1/3 h-full cursor-pointer" onPointerDown={() => setIsPaused(true)} onPointerUp={() => setIsPaused(false)} onPointerLeave={() => setIsPaused(false)} />
            <div className="w-1/3 h-full cursor-pointer" onClick={handleNextStory} />
          </div>

          {/* Story Main Image & Overlay Card */}
          <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full max-w-lg mx-auto">
            <img 
              src={creatorsList[activeCreatorIndex].stories[activeStoryIndex].mediaUrl} 
              alt="Story Content" 
              className="w-full h-full object-cover rounded-3xl" 
            />
            {/* Visual ambient gradient */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 pt-24 z-15 flex flex-col justify-end text-white">
              {/* Floating music widget */}
              {creatorsList[activeCreatorIndex].stories[activeStoryIndex].music && (
                <div className="self-start flex items-center gap-1.5 bg-white/15 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black border border-white/10 mb-3.5 animate-pulse">
                  <Volume2 className="w-3.5 h-3.5 text-orange-400" />
                  <span>🎶 {creatorsList[activeCreatorIndex].stories[activeStoryIndex].music}</span>
                </div>
              )}

              {creatorsList[activeCreatorIndex].stories[activeStoryIndex].text && (
                <p className="text-base font-extrabold leading-snug drop-shadow-md text-white/95">
                  {creatorsList[activeCreatorIndex].stories[activeStoryIndex].text}
                </p>
              )}
            </div>

            {/* Render Floating Reactions Animation */}
            <div className="absolute inset-0 pointer-events-none z-35 overflow-hidden">
              {floatingReactions.map(r => (
                <div 
                  key={r.id} 
                  className="absolute bottom-16 text-4xl animate-bounce"
                  style={{ 
                    left: `${r.left}%`,
                    animation: `floatUpAndFade 2s ease-out forwards` 
                  }}
                >
                  {r.emoji}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Direct Reply & Reactions bar */}
          <div className="p-4 bg-black/65 backdrop-blur-md border-t border-white/5 z-20 flex flex-col gap-3">
            {/* Quick reaction emojis */}
            <div className="flex items-center justify-between px-2">
              {["🔥", "❤️", "😂", "😮", "🙌", "👑"].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => handleReactToStory(emoji)}
                  className="text-2xl active:scale-130 hover:scale-115 transition-all cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Direct message text area */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={replyText}
                onChange={e => {
                  setReplyText(e.target.value);
                  setIsPaused(true);
                }}
                onBlur={() => setIsPaused(false)}
                placeholder="Envoyer un message privé..."
                className="flex-1 bg-white/10 text-white rounded-full px-4 py-2.5 text-xs outline-none focus:ring-1 focus:ring-orange-500 placeholder-white/50 border border-white/5"
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim()}
                className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-full p-2.5 active:scale-90 transition-all cursor-pointer flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STORY CREATION MODAL */}
      {isPosting && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handlePublishStory} className="bg-white dark:bg-gray-950 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/40">
              <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span>✨ Publier une Story</span>
              </h3>
              <button type="button" onClick={() => setIsPosting(false)} className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-100 dark:bg-gray-800 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              {/* Identity Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide">Publier en tant que :</label>
                <select
                  value={selectedCreatorId}
                  onChange={e => setSelectedCreatorId(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-bold outline-none text-gray-800 dark:text-gray-100"
                  required
                >
                  <option value="">-- Choisir une identité --</option>
                  {managedEsts.map(est => {
                    const count = getCreatorTodayCount(est.id);
                    const isPremium = (est as any).isPremium;
                    return (
                      <option key={est.id} value={est.id}>
                        🏢 {est.name} ({isPremium ? "Premium - Illimité" : `Gratuit - ${count}/2 stories`})
                      </option>
                    );
                  })}
                  {djRequests.map(req => {
                    const est = establishments.find(e => e.id === req.establishmentId);
                    return (
                      <option key={req.id} value={req.establishmentId}>
                        🎧 DJ {currentUser?.name} (@ {est?.name || 'Club'})
                      </option>
                    );
                  })}
                  {isPartner && (
                    <option value={currentUser.id}>
                      🤝 {currentUser.name} (Partenaire / Organisateur)
                    </option>
                  )}
                </select>
              </div>

              {/* Presets Grid */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide">💡 Préréglages d'ambiance rapides :</label>
                <div className="grid grid-cols-2 gap-2">
                  {STATIC_PRESETS.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSelectedPreset(index)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex flex-col gap-1 cursor-pointer hover:border-orange-200 ${
                        selectedPreset === index 
                          ? 'border-orange-500 bg-orange-50/45 text-orange-900' 
                          : 'border-gray-100 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{preset.emoji} {preset.title}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom text */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide">Texte de la Story :</label>
                <textarea
                  value={storyText}
                  onChange={e => setStoryText(e.target.value)}
                  placeholder="Écrivez quelque chose d'enjaillant... max 30s de lecture"
                  maxLength={100}
                  className="w-full h-16 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-3 text-xs outline-none focus:border-orange-500 font-bold"
                  required
                />
                <span className="text-[10px] text-gray-400 self-end font-medium">{storyText.length}/100</span>
              </div>

              {/* Media input link */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide">Lien Image / Vidéo :</label>
                <input
                  type="text"
                  value={customMedia}
                  onChange={e => {
                    setCustomMedia(e.target.value);
                    setSelectedPreset(null);
                  }}
                  placeholder="URL d'une photo / vidéo Unsplash/Pexels"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                />
              </div>

              {/* Music badge */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide">Musique d'ambiance :</label>
                <input
                  type="text"
                  value={storyMusic}
                  onChange={e => setStoryMusic(e.target.value)}
                  placeholder="ex. Burna Boy - City Boys"
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                />
              </div>

              {/* Location selection */}
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide">Localisation :</label>
                  <select
                    value={storyLocation}
                    onChange={e => setStoryLocation(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option value="">Sélectionner</option>
                    <option value="Zone du Bois">Zone du Bois</option>
                    <option value="Patte d'Oie">Patte d'Oie</option>
                    <option value="Somgandé">Somgandé</option>
                    <option value="Ouaga 2000">Ouaga 2000</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-gray-700 dark:text-gray-300 uppercase tracking-wide">Ou Autre Lieu :</label>
                  <input
                    type="text"
                    value={customLocation}
                    onChange={e => setCustomLocation(e.target.value)}
                    placeholder="Lieu personnalisé"
                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-5 border-t border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-900/40 flex gap-3">
              <button
                type="button"
                onClick={() => setIsPosting(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl active:scale-95 transition-all text-xs cursor-pointer text-center"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl active:scale-95 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🚀 Publier</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CREATOR STORY STATS MODAL */}
      {showStats && (
        <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-950 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/40">
              <h3 className="font-black text-gray-900 dark:text-white flex items-center gap-2 text-sm sm:text-base">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                <span>Statistiques de mes Stories</span>
              </h3>
              <button onClick={() => setShowStats(null)} className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-100 dark:bg-gray-800 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {/* Summary card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/10 border border-blue-100 dark:border-blue-900/40 rounded-2xl p-4 flex justify-between items-center text-xs">
                <div>
                  <h4 className="font-extrabold text-blue-900 dark:text-blue-300">Rétrospective de visionnage</h4>
                  <p className="text-gray-500 dark:text-gray-400 mt-0.5">Mis à jour instantanément.</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-2xl font-black text-blue-700 dark:text-blue-400">
                    {calculateCompletionRate(showStats)}%
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Taux de complétion</span>
                </div>
              </div>

              {/* Story list detailing stats */}
              <div className="space-y-3">
                {showStats.length === 0 ? (
                  <p className="text-center text-xs text-gray-400 py-6">Aucune story restante.</p>
                ) : (
                  showStats.map(s => {
                    const viewsCount = s.views?.length || 0;
                    const reactionsCount = Object.keys(s.reactions || {}).length;
                    return (
                      <div key={s.id} className="border border-gray-100 dark:border-gray-900 rounded-2xl p-3 flex gap-3 items-center justify-between">
                        <img src={s.mediaUrl} className="w-12 h-12 rounded-xl object-cover" />
                        <div className="flex-1 min-w-0">
                          <p className="font-extrabold text-xs text-gray-900 dark:text-white truncate">"{s.text || "Image story"}"</p>
                          <div className="flex gap-3 text-[10px] text-gray-500 font-bold mt-1">
                            <span className="flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-gray-400" /> {viewsCount} vue{viewsCount > 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <Heart className="w-3.5 h-3.5 text-red-400" /> {reactionsCount} réaction{reactionsCount > 1 ? 's' : ''}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageCircle className="w-3.5 h-3.5 text-blue-400" /> {s.responsesCount || 0} rép.
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteStory(s.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer la story"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-900 bg-gray-50/50 dark:bg-gray-900/40 text-center">
              <button onClick={() => setShowStats(null)} className="w-full py-2.5 bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-black rounded-xl">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Reactions CSS Animation Keyframe (Inline styled injection) */}
      <style>{`
        @keyframes floatUpAndFade {
          0% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-200px) scale(1.4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
