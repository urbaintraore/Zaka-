import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { 
  Users, 
  UserPlus, 
  Search, 
  Check, 
  X, 
  MessageSquare, 
  UserX, 
  Clock, 
  ShieldCheck, 
  Share2, 
  Calendar, 
  Flame, 
  Send, 
  Sparkles, 
  Heart, 
  Play, 
  Plus, 
  Copy, 
  ExternalLink, 
  CheckSquare, 
  Square, 
  CheckCheck,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Star,
  Bell,
  BellRing,
  Radio,
  Wifi,
  WifiOff
} from 'lucide-react';
import { User, Story, Publication, Establishment } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { sendPushNotification, sendFriendRequestPushNotification, requestNotificationPermission, getNotificationPermissionStatus } from '../utils/pushNotifications';
import { StoryEmojiReactionPicker } from './StoryEmojiReactionPicker';

interface FriendsModuleProps {
  onStartChatWithConv?: (convId: string) => void;
  onInviteFriendToOuting?: (friendId: string) => void;
}

export function FriendsModule({ onStartChatWithConv, onInviteFriendToOuting }: FriendsModuleProps) {
  const { 
    currentUser, 
    users, 
    friendships, 
    sendFriendRequest, 
    acceptFriendRequest, 
    declineFriendRequest, 
    removeFriend,
    createConversation,
    establishments,
    publications,
    favorites
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'my_friends' | 'requests' | 'find'>('my_friends');
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'favorites'>('all');
  const [favoriteFriendIds, setFavoriteFriendIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(`zaka_fav_friends_${currentUser?.id}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [notifPermission, setNotifPermission] = useState<string>(() => getNotificationPermissionStatus());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);
  const [isBatchSending, setIsBatchSending] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Save favorites to localStorage
  const toggleFavoriteFriend = (friendId: string, friendName: string) => {
    setFavoriteFriendIds(prev => {
      const exists = prev.includes(friendId);
      const next = exists ? prev.filter(id => id !== friendId) : [...prev, friendId];
      try {
        localStorage.setItem(`zaka_fav_friends_${currentUser?.id}`, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      showFeedback('info', exists ? `${friendName} retiré(e) des favoris` : `⭐ ${friendName} ajouté(e) aux favoris !`);
      return next;
    });
  };

  // Helper to determine if user is online
  const isUserOnline = (user: User): boolean => {
    if (user.isOnline !== undefined) return user.isOnline;
    // Reliable deterministic status fallback for interactive feel
    return (user.id.charCodeAt(0) + user.name.length) % 2 === 0;
  };

  // Request browser notification permission
  const handleEnablePushNotifications = async () => {
    const granted = await requestNotificationPermission();
    setNotifPermission(getNotificationPermissionStatus());
    if (granted) {
      showFeedback('success', "🔔 Notifications push activées avec succès !");
      sendPushNotification(
        "Notifications Zaka+ activées ✅",
        "Vous serez alerté(e) dès qu'un ami vous envoie une demande ou un message !",
        "#profile"
      );
    } else {
      showFeedback('info', "Veuillez autoriser les notifications dans les paramètres de votre navigateur.");
    }
  };

  // Active stories state
  const [stories, setStories] = useState<Story[]>([]);
  const [viewingStoryFriend, setViewingStoryFriend] = useState<{ friend: User; stories: Story[] } | null>(null);
  const [activeStoryIdx, setActiveStoryIdx] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [storyReplyText, setStoryReplyText] = useState('');
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sharing resource modal state
  const [sharingWithFriend, setSharingWithFriend] = useState<User | null>(null);
  const [shareTab, setShareTab] = useState<'pubs' | 'ests'>('pubs');
  const [shareCopiedId, setShareCopiedId] = useState<string | null>(null);

  // Post personal quick story modal
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [newStoryText, setNewStoryText] = useState('');
  const [newStoryEmoji, setNewStoryEmoji] = useState('🔥');
  const [isSubmittingStory, setIsSubmittingStory] = useState(false);

  // Load active stories from Supabase
  useEffect(() => {
    let active = true;
    const loadStories = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('stories')
            .select('*');
          if (!error && data && active) {
            const all = data as Story[];
            const fresh = all.filter(s => {
              const diff = Date.now() - new Date(s.createdAt).getTime();
              return diff < 24 * 60 * 60 * 1000;
            });
            fresh.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            setStories(fresh);
          }
        } catch (e) {
          console.warn("Could not load stories in FriendsModule:", e);
        }
      }
    };
    loadStories();
    return () => { active = false; };
  }, []);

  // Story autoplay timer
  useEffect(() => {
    if (!viewingStoryFriend) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setStoryProgress(0);
      return;
    }

    const currentFriendStories = viewingStoryFriend.stories;
    if (currentFriendStories.length === 0) return;

    setStoryProgress(0);
    const duration = 5000; // 5 seconds
    const interval = 50;
    const step = (interval / duration) * 100;

    progressTimerRef.current = setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= 100) {
          if (activeStoryIdx < currentFriendStories.length - 1) {
            setActiveStoryIdx(i => i + 1);
            return 0;
          } else {
            // Close viewer
            setViewingStoryFriend(null);
            return 0;
          }
        }
        return prev + step;
      });
    }, interval);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [viewingStoryFriend, activeStoryIdx]);

  if (!currentUser) return null;

  // Helper to find friendship record
  const getFriendshipWith = (targetUserId: string) => {
    const u1 = currentUser.id < targetUserId ? currentUser.id : targetUserId;
    const u2 = currentUser.id < targetUserId ? targetUserId : currentUser.id;
    return (friendships || []).find(f => f.user1Id === u1 && f.user2Id === u2);
  };

  // Accepted friends
  const myAcceptedFriendships = (friendships || []).filter(
    f => (f.user1Id === currentUser.id || f.user2Id === currentUser.id) && f.status === 'accepted'
  );

  const myFriends: { friendUser: User; friendshipId: string }[] = myAcceptedFriendships.map(f => {
    const friendId = f.user1Id === currentUser.id ? f.user2Id : f.user1Id;
    const friendUser = users.find(u => u.id === friendId) || {
      id: friendId,
      name: 'Utilisateur ZAKA',
      role: 'client'
    };
    return { friendUser, friendshipId: f.id };
  });

  // Incoming requests
  const incomingRequests = (friendships || []).filter(
    f => (f.user1Id === currentUser.id || f.user2Id === currentUser.id) && 
         f.requesterId !== currentUser.id && 
         f.status === 'pending'
  );

  // Outgoing requests
  const outgoingRequests = (friendships || []).filter(
    f => (f.user1Id === currentUser.id || f.user2Id === currentUser.id) && 
         f.requesterId === currentUser.id && 
         f.status === 'pending'
  );

  // Real-time Push Notification alert for incoming friend requests
  const prevIncomingIdsRef = useRef<string[] | null>(null);
  useEffect(() => {
    const currentIncomingIds = incomingRequests.map(r => r.id);
    if (prevIncomingIdsRef.current !== null) {
      const newlyAddedRequests = incomingRequests.filter(r => !prevIncomingIdsRef.current!.includes(r.id));
      if (newlyAddedRequests.length > 0) {
        newlyAddedRequests.forEach(req => {
          const requesterId = req.requesterId;
          const requesterUser = users.find(u => u.id === requesterId);
          const requesterName = requesterUser?.name || 'Un membre de ZAKA';
          sendFriendRequestPushNotification(requesterName);
          showFeedback('info', `🤝 Nouvelle demande d'amitié reçue de ${requesterName} !`);
        });
      }
    }
    prevIncomingIdsRef.current = currentIncomingIds;
  }, [incomingRequests, users]);

  // Normalized search query helper
  const cleanSearch = searchQuery.trim().toLowerCase();
  const cleanPhoneSearch = searchQuery.replace(/\D/g, '');

  // Friends status counts
  const onlineFriendsCount = myFriends.filter(({ friendUser }) => isUserOnline(friendUser)).length;
  const offlineFriendsCount = myFriends.filter(({ friendUser }) => !isUserOnline(friendUser)).length;
  const favoriteFriendsCount = myFriends.filter(({ friendUser }) => favoriteFriendIds.includes(friendUser.id)).length;

  // Filter My Friends with Status Selector and Search
  const filteredMyFriends = myFriends.filter(({ friendUser }) => {
    // 1. Filter by status
    if (statusFilter === 'online' && !isUserOnline(friendUser)) return false;
    if (statusFilter === 'offline' && isUserOnline(friendUser)) return false;
    if (statusFilter === 'favorites' && !favoriteFriendIds.includes(friendUser.id)) return false;

    // 2. Filter by search query
    if (!cleanSearch) return true;
    const nameMatch = friendUser.name.toLowerCase().includes(cleanSearch);
    const emailMatch = friendUser.email ? friendUser.email.toLowerCase().includes(cleanSearch) : false;
    const phoneMatch = friendUser.phone ? friendUser.phone.replace(/\D/g, '').includes(cleanPhoneSearch) : false;
    return nameMatch || emailMatch || (cleanPhoneSearch.length > 2 && phoneMatch);
  });

  // Filter searchable users (not currentUser) strictly when search query is at least 2 characters
  const hasSearchQuery = cleanSearch.length >= 2;
  const otherUsers = users.filter(u => u.id !== currentUser.id);
  const filteredSearchUsers = hasSearchQuery
    ? otherUsers.filter(u => {
        const nameMatch = u.name ? u.name.toLowerCase().includes(cleanSearch) : false;
        const emailMatch = u.email ? u.email.toLowerCase().includes(cleanSearch) : false;
        const phoneDigits = u.phone ? u.phone.replace(/\D/g, '') : '';
        const phoneMatch = cleanPhoneSearch.length >= 3 && phoneDigits.includes(cleanPhoneSearch);
        const phoneRawMatch = u.phone ? u.phone.toLowerCase().includes(cleanSearch) : false;
        return nameMatch || emailMatch || phoneMatch || phoneRawMatch;
      })
    : [];

  const showFeedback = (type: 'success' | 'error' | 'info', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  // Toggle selection for batch inviting
  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectAllSearchUsers = () => {
    const eligibleIds = filteredSearchUsers
      .filter(u => {
        const fs = getFriendshipWith(u.id);
        return !fs; // only those not already friend or pending
      })
      .map(u => u.id);
    setSelectedUserIds(eligibleIds);
  };

  const clearSelection = () => {
    setSelectedUserIds([]);
  };

  // Send single friend request
  const handleSendRequest = async (targetUserId: string) => {
    setLoadingActionId(targetUserId);
    try {
      await sendFriendRequest(targetUserId);
      showFeedback('success', "Demande d'amitié envoyée avec succès !");
      sendPushNotification(
        "Demande d'amitié envoyée",
        "Votre contact a été notifié et peut accepter votre demande à tout moment."
      );
    } catch (err: any) {
      showFeedback('error', err.message || "Impossible d'envoyer la demande.");
    } finally {
      setLoadingActionId(null);
    }
  };

  // Send batch friend requests
  const handleSendBatchRequests = async () => {
    if (selectedUserIds.length === 0) return;
    setIsBatchSending(true);
    let successCount = 0;
    try {
      for (const targetId of selectedUserIds) {
        try {
          await sendFriendRequest(targetId);
          successCount++;
        } catch (e) {
          console.warn("Could not send to:", targetId, e);
        }
      }
      setSelectedUserIds([]);
      showFeedback('success', `${successCount} invitation(s) d'amitié envoyée(s) avec succès !`);
      sendPushNotification(
        "Invitations d'amitié envoyées",
        `${successCount} ami(e)s ont été invités à vous rejoindre sur Zaka+.`
      );
    } catch (err: any) {
      showFeedback('error', err.message || "Erreur lors de l'envoi groupé.");
    } finally {
      setIsBatchSending(false);
    }
  };

  // Accept incoming request
  const handleAccept = async (friendshipId: string) => {
    setLoadingActionId(friendshipId);
    try {
      await acceptFriendRequest(friendshipId);
      showFeedback('success', "Demande d'amitié acceptée ! Vous êtes désormais connecté(e)s.");
    } catch (err: any) {
      showFeedback('error', err.message || "Erreur lors de l'acceptation.");
    } finally {
      setLoadingActionId(null);
    }
  };

  // Decline incoming request
  const handleDecline = async (friendshipId: string) => {
    setLoadingActionId(friendshipId);
    try {
      await declineFriendRequest(friendshipId);
      showFeedback('info', "Demande d'amitié refusée.");
    } catch (err: any) {
      showFeedback('error', err.message || "Erreur lors du refus.");
    } finally {
      setLoadingActionId(null);
    }
  };

  // Remove friend
  const handleRemove = async (friendshipId: string, friendName: string) => {
    if (!window.confirm(`Voulez-vous vraiment retirer ${friendName} de vos ami(e)s ?`)) return;
    setLoadingActionId(friendshipId);
    try {
      await removeFriend(friendshipId);
      showFeedback('info', `${friendName} a été retiré(e) de vos ami(e)s.`);
    } catch (err: any) {
      showFeedback('error', err.message || "Erreur lors de la suppression.");
    } finally {
      setLoadingActionId(null);
    }
  };

  // Start chat with friend
  const handleStartChatWithFriend = async (friend: User) => {
    try {
      setLoadingActionId(friend.id);
      const convId = `friend_${[currentUser.id, friend.id].sort().join('_')}`;

      if (isSupabaseConfigured) {
        // Ensure conversation exists in Supabase
        const { data: existing } = await supabase
          .from('conversations')
          .select('id')
          .eq('id', convId)
          .maybeSingle();

        if (!existing) {
          await supabase.from('conversations').insert([{
            id: convId,
            clientId: currentUser.id,
            clientName: currentUser.name || 'Ami ZAKA',
            establishmentId: 'direct_friend',
            establishmentName: friend.name || 'Ami(e)',
            ownerId: friend.id,
            lastMessage: 'Discussion d\'amitié démarrée',
            lastMessageAt: new Date().toISOString(),
            lastSenderId: currentUser.id,
            unreadByClient: false,
            unreadByGerant: true
          }]);
        }
      } else {
        await createConversation(
          currentUser.id,
          'direct_friend',
          currentUser.name || 'Ami ZAKA',
          friend.name || 'Ami(e)',
          friend.id
        );
      }

      if (onStartChatWithConv) {
        onStartChatWithConv(convId);
      } else {
        showFeedback('success', `Discussion ouverte avec ${friend.name} dans l'onglet Messages !`);
      }
    } catch (err: any) {
      console.error("Error opening chat with friend:", err);
      showFeedback('error', "Impossible d'ouvrir la discussion pour le moment.");
    } finally {
      setLoadingActionId(null);
    }
  };

  // Share resource with friend directly into chat
  const handleShareResourceToFriendChat = async (resourceTitle: string, resourceLink: string, resourceType: 'publication' | 'establishment') => {
    if (!sharingWithFriend) return;
    try {
      const convId = `friend_${[currentUser.id, sharingWithFriend.id].sort().join('_')}`;

      // Insert message in Supabase
      if (isSupabaseConfigured) {
        // Ensure conversation exists
        const { data: existing } = await supabase
          .from('conversations')
          .select('id')
          .eq('id', convId)
          .maybeSingle();

        if (!existing) {
          await supabase.from('conversations').insert([{
            id: convId,
            clientId: currentUser.id,
            clientName: currentUser.name || 'Ami ZAKA',
            establishmentId: 'direct_friend',
            establishmentName: sharingWithFriend.name || 'Ami(e)',
            ownerId: sharingWithFriend.id,
            lastMessage: `Partage : ${resourceTitle}`,
            lastMessageAt: new Date().toISOString(),
            lastSenderId: currentUser.id,
            unreadByClient: false,
            unreadByGerant: true
          }]);
        }

        const shareMessage = `📢 Salut ! Je te partage ce bon plan sur Zaka+ :\n👉 *${resourceTitle}*\n${resourceLink}`;
        await supabase.from('messages').insert([{
          conversationId: convId,
          senderId: currentUser.id,
          text: shareMessage,
          createdAt: new Date().toISOString()
        }]);

        await supabase.from('conversations').update({
          lastMessage: `Partage : ${resourceTitle}`,
          lastMessageAt: new Date().toISOString(),
          lastSenderId: currentUser.id,
          unreadByGerant: true
        }).eq('id', convId);
      }

      showFeedback('success', `Partagé avec succès avec ${sharingWithFriend.name} !`);
      setSharingWithFriend(null);
    } catch (err: any) {
      console.error("Error sharing resource to chat:", err);
      showFeedback('error', "Erreur lors du partage dans la discussion.");
    }
  };

  // Open friend's stories
  const handleOpenFriendStory = (friend: User) => {
    const friendStories = stories.filter(s => s.creatorId === friend.id || s.creatorName === friend.name);
    if (friendStories.length > 0) {
      setViewingStoryFriend({ friend, stories: friendStories });
      setActiveStoryIdx(0);
    } else {
      showFeedback('info', `${friend.name} n'a pas publié de story ces dernières 24h.`);
    }
  };

  // Post story reaction
  const handleReactToStory = async (emoji: string) => {
    if (!viewingStoryFriend || !currentUser) return;
    const curStory = viewingStoryFriend.stories[activeStoryIdx];
    if (!curStory) return;

    try {
      const updatedReactions = { ...(curStory.reactions || {}), [currentUser.id]: emoji };
      if (isSupabaseConfigured) {
        await supabase
          .from('stories')
          .update({ reactions: updatedReactions })
          .eq('id', curStory.id);
      }
      showFeedback('success', `Réaction ${emoji} envoyée !`);
    } catch (e) {
      console.error(e);
    }
  };

  // Send story reply as chat message
  const handleSendStoryReply = async () => {
    if (!storyReplyText.trim() || !viewingStoryFriend || !currentUser) return;
    const curStory = viewingStoryFriend.stories[activeStoryIdx];
    try {
      const convId = `friend_${[currentUser.id, viewingStoryFriend.friend.id].sort().join('_')}`;
      const replyMsg = `🔥 En réponse à ta Story ("${curStory.text || curStory.emoji || 'Story'}") :\n${storyReplyText.trim()}`;

      if (isSupabaseConfigured) {
        await supabase.from('messages').insert([{
          conversationId: convId,
          senderId: currentUser.id,
          text: replyMsg,
          createdAt: new Date().toISOString()
        }]);
      }
      setStoryReplyText('');
      showFeedback('success', "Réponse envoyée dans la discussion !");
    } catch (e) {
      console.error(e);
    }
  };

  // Create personal story
  const handleCreatePersonalStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoryText.trim()) return;
    setIsSubmittingStory(true);
    try {
      const storyData = {
        creatorId: currentUser.id,
        creatorName: currentUser.name || "Ami ZAKA",
        creatorAvatar: currentUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200",
        creatorType: 'influencer' as const,
        mediaUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80",
        mediaType: 'image' as const,
        text: newStoryText.trim(),
        emoji: newStoryEmoji,
        music: "Vibe Zaka+ Ouaga",
        location: currentUser.city || "Ouagadougou",
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        views: [],
        reactions: {},
        responsesCount: 0
      };

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('stories').insert([storyData]).select().single();
        if (!error && data) {
          setStories(prev => [data as Story, ...prev]);
        }
      }
      setShowCreateStoryModal(false);
      setNewStoryText('');
      showFeedback('success', "Votre Story est en ligne pour 24h ! Vos ami(e)s peuvent la regarder.");
    } catch (err: any) {
      showFeedback('error', "Erreur lors de la publication de la Story.");
    } finally {
      setIsSubmittingStory(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 p-5 md:p-6 transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-amber-500" />
            Mes Ami(e)s & Réseau ZAKA
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Recherchez vos proches par nom, e-mail ou téléphone, invitez-les en sortie, discutez, partagez vos bons plans et découvrez leurs stories.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl self-start sm:self-auto shadow-inner">
          <button
            onClick={() => { setActiveTab('my_friends'); setSearchQuery(''); setSelectedUserIds([]); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'my_friends'
                ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Ami(e)s ({myFriends.length})
          </button>

          <button
            onClick={() => { setActiveTab('requests'); setSearchQuery(''); setSelectedUserIds([]); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 relative cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Demandes
            {incomingRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-red-500 text-white rounded-full font-black animate-pulse">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('find'); setSearchQuery(''); setSelectedUserIds([]); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'find'
                ? 'bg-white dark:bg-gray-700 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Trouver ({otherUsers.length})
          </button>
        </div>
      </div>

      {/* Quick Action bar: Post Story */}
      <div className="mb-4 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-3 rounded-2xl border border-amber-200/60 dark:border-amber-800/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            <Flame className="w-4 h-4 fill-white" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-gray-900 dark:text-white">Partagez votre humeur en Story</p>
            <p className="text-[10px] text-gray-500 dark:text-gray-400">Visible par vos ami(e)s ZAKA pendant 24 heures</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateStoryModal(true)}
          className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Story
        </button>
      </div>

      {/* Notification Banner */}
      {feedbackMsg && (
        <div className={`mb-4 p-3 rounded-2xl text-xs font-bold flex items-center justify-between transition-all ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : feedbackMsg.type === 'info'
            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}>
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: MES AMI(E)S */}
      {activeTab === 'my_friends' && (
        <div>
          {/* Push Notification permission alert banner if not yet granted */}
          {notifPermission !== 'granted' && (
            <div className="mb-3.5 p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-200 dark:border-orange-900/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 bg-orange-500 text-white rounded-xl shrink-0">
                  <BellRing className="w-4 h-4 animate-bounce" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-gray-900 dark:text-white truncate">
                    Alertes instantanées de demandes d'amitié
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                    Recevez une notification push dès qu'un contact vous ajoute sur ZAKA
                  </p>
                </div>
              </div>
              <button
                onClick={handleEnablePushNotifications}
                className="shrink-0 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 active:scale-95 text-white text-[11px] font-extrabold rounded-xl shadow-xs transition-all flex items-center gap-1 cursor-pointer"
              >
                <Bell className="w-3 h-3" />
                <span>Activer</span>
              </button>
            </div>
          )}

          {/* Search bar */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filtrer mes ami(e)s par nom, e-mail ou téléphone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          {/* Status Filter Selector (All, Online, Offline, Favorites) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3.5 scrollbar-none select-none">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-amber-500 text-white shadow-xs scale-102'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Tous</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                statusFilter === 'all' ? 'bg-white/30 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}>
                {myFriends.length}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('online')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'online'
                  ? 'bg-emerald-600 text-white shadow-xs scale-102'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600'
              }`}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>En ligne</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                statusFilter === 'online' ? 'bg-white/30 text-white' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
              }`}>
                {onlineFriendsCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('offline')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'offline'
                  ? 'bg-gray-700 text-white shadow-xs scale-102'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-gray-400"></span>
              <span>Hors ligne</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                statusFilter === 'offline' ? 'bg-white/30 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {offlineFriendsCount}
              </span>
            </button>

            <button
              onClick={() => setStatusFilter('favorites')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                statusFilter === 'favorites'
                  ? 'bg-yellow-500 text-white shadow-xs scale-102'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-yellow-50 dark:hover:bg-yellow-950/30 hover:text-yellow-600'
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span>Favoris</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                statusFilter === 'favorites' ? 'bg-white/30 text-white' : 'bg-yellow-100 dark:bg-yellow-950/60 text-yellow-700 dark:text-yellow-300'
              }`}>
                {favoriteFriendsCount}
              </span>
            </button>
          </div>

          {filteredMyFriends.length === 0 ? (
            <div className="text-center py-10 px-4 bg-gray-50 dark:bg-gray-800/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                {searchQuery 
                  ? "Aucun ami trouvé pour cette recherche" 
                  : statusFilter === 'favorites' 
                  ? "Aucun ami dans vos favoris" 
                  : statusFilter === 'online' 
                  ? "Aucun ami actuellement en ligne" 
                  : statusFilter === 'offline' 
                  ? "Aucun ami hors ligne" 
                  : "Vous n'avez pas encore d'amis connectés sur ZAKA"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1 mb-4">
                {statusFilter === 'favorites' 
                  ? "Cliquez sur l'étoile d'un contact pour l'ajouter à vos amis favoris." 
                  : "Recherchez vos contacts par leur nom, e-mail ou numéro de téléphone pour planifier des sorties en groupe, discuter et partager vos bons plans."}
              </p>
              {statusFilter !== 'all' ? (
                <button
                  onClick={() => setStatusFilter('all')}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  Afficher tous les contacts ({myFriends.length})
                </button>
              ) : (
                <button
                  onClick={() => setActiveTab('find')}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  Trouver des ami(e)s
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredMyFriends.map(({ friendUser, friendshipId }) => {
                const friendActiveStories = stories.filter(s => s.creatorId === friendUser.id || s.creatorName === friendUser.name);
                const hasActiveStory = friendActiveStories.length > 0;
                const isOnline = isUserOnline(friendUser);
                const isFav = favoriteFriendIds.includes(friendUser.id);

                return (
                  <div 
                    key={friendshipId}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      isFav 
                        ? 'border-yellow-200 dark:border-yellow-800/60 bg-gradient-to-b from-yellow-50/20 to-white dark:from-yellow-950/10 dark:to-gray-800/90 shadow-xs ring-1 ring-yellow-400/20' 
                        : 'border-gray-100 dark:border-gray-800 hover:border-amber-200 dark:hover:border-amber-800/40 bg-white dark:bg-gray-800/90 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar with status indicator and optional story ring */}
                        <div 
                          onClick={() => hasActiveStory && handleOpenFriendStory(friendUser)}
                          className={`relative cursor-pointer transition-transform ${hasActiveStory ? 'hover:scale-105' : ''}`}
                          title={hasActiveStory ? "Regarder la Story de cet ami" : (isOnline ? "En ligne" : "Hors ligne")}
                        >
                          <div className={`w-11 h-11 rounded-full overflow-hidden flex items-center justify-center font-black text-sm ${
                            hasActiveStory 
                              ? 'p-0.5 bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 ring-2 ring-orange-500/50' 
                              : isFav
                              ? 'p-0.5 bg-gradient-to-tr from-yellow-400 to-amber-500 ring-1 ring-yellow-400/40'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                          }`}>
                            <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 overflow-hidden flex items-center justify-center">
                              {friendUser.avatar ? (
                                <img src={friendUser.avatar} alt={friendUser.name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{friendUser.name.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                          </div>
                          
                          {/* Online / Offline presence badge */}
                          <span 
                            className={`absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center ${
                              isOnline ? 'bg-emerald-500' : 'bg-gray-400'
                            }`}
                            title={isOnline ? "En ligne" : "Hors ligne"}
                          >
                            {isOnline && (
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            )}
                          </span>

                          {hasActiveStory && (
                            <span className="absolute -bottom-1 -right-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full p-0.5 shadow-xs">
                              <Flame className="w-3 h-3 fill-white" />
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-xs font-black text-gray-900 dark:text-white truncate">
                              {friendUser.name}
                            </h4>
                            {isFav && (
                              <span title="Ami(e) favori(te)">
                                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 shrink-0" />
                              </span>
                            )}
                            {hasActiveStory && (
                              <button
                                onClick={() => handleOpenFriendStory(friendUser)}
                                className="px-1.5 py-0.5 text-[9px] bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold rounded-full flex items-center gap-0.5 cursor-pointer hover:opacity-90"
                              >
                                <Play className="w-2 h-2 fill-white" /> Story
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                              isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                              {isOnline ? 'En ligne' : 'Hors ligne'}
                            </span>
                            <span className="text-gray-300 dark:text-gray-700 text-[10px]">•</span>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                              {friendUser.phone ? `📞 ${friendUser.phone}` : (friendUser.city || 'Burkina Faso')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Header actions: Favorite Toggle & Remove Friend */}
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => toggleFavoriteFriend(friendUser.id, friendUser.name)}
                          className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                            isFav 
                              ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950/40 hover:bg-yellow-100' 
                              : 'text-gray-300 dark:text-gray-600 hover:text-yellow-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                          title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'fill-yellow-400' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleRemove(friendshipId, friendUser.name)}
                          disabled={loadingActionId === friendshipId}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all cursor-pointer"
                          title="Retirer cet ami"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Action buttons on friend */}
                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                      {/* 1. Inviter en sortie */}
                      <button
                        onClick={() => onInviteFriendToOuting && onInviteFriendToOuting(friendUser.id)}
                        className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                        title="Inviter en sortie de groupe"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Sortie</span>
                      </button>

                      {/* 2. Discuter */}
                      <button
                        onClick={() => handleStartChatWithFriend(friendUser)}
                        disabled={loadingActionId === friendUser.id}
                        className="py-1.5 px-2 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                        title="Discuter dans la messagerie"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Discuter</span>
                      </button>

                      {/* 3. Partager */}
                      <button
                        onClick={() => setSharingWithFriend(friendUser)}
                        className="py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                        title="Partager un bon plan ou une publication"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Partager</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEMANDES */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Incoming requests */}
          <div>
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Demandes reçues ({incomingRequests.length})
            </h4>

            {incomingRequests.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl">
                Aucune demande d'amitié reçue pour le moment.
              </p>
            ) : (
              <div className="space-y-2.5">
                {incomingRequests.map(req => {
                  const sender = users.find(u => u.id === req.requesterId) || {
                    id: req.requesterId,
                    name: 'Utilisateur ZAKA',
                    role: 'client'
                  };

                  return (
                    <div 
                      key={req.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-gradient-to-r from-amber-50/70 to-orange-50/70 dark:from-amber-950/20 dark:to-orange-950/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 font-bold flex items-center justify-center text-xs">
                          {sender.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-gray-900 dark:text-white">{sender.name}</h5>
                          <p className="text-[10px] text-gray-600 dark:text-gray-400">
                            {sender.phone ? `📞 ${sender.phone}` : "Souhaite vous ajouter à ses amis"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAccept(req.id)}
                          disabled={loadingActionId === req.id}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Accepter
                        </button>
                        <button
                          onClick={() => handleDecline(req.id)}
                          disabled={loadingActionId === req.id}
                          className="px-2.5 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Outgoing requests */}
          <div>
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider mb-3">
              Demandes envoyées en attente ({outgoingRequests.length})
            </h4>

            {outgoingRequests.length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-800/40 p-3 rounded-2xl">
                Vous n'avez aucune invitation en attente.
              </p>
            ) : (
              <div className="space-y-2">
                {outgoingRequests.map(req => {
                  const targetId = req.user1Id === currentUser.id ? req.user2Id : req.user1Id;
                  const recipient = users.find(u => u.id === targetId) || {
                    id: targetId,
                    name: 'Utilisateur ZAKA',
                    role: 'client'
                  };

                  return (
                    <div 
                      key={req.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-800/40"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold flex items-center justify-center text-xs">
                          {recipient.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h5 className="text-xs font-bold text-gray-900 dark:text-white">{recipient.name}</h5>
                          <p className="text-[10px] text-gray-400">Invitation envoyée • En attente de validation</p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDecline(req.id)}
                        disabled={loadingActionId === req.id}
                        className="px-2.5 py-1 text-[11px] text-gray-500 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all cursor-pointer"
                      >
                        Annuler
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: TROUVER DES AMI(E)S (RECHERCHE CONFIDENTIELLE PAR NOM / PRENOM / EMAIL / TELEPHONE) */}
      {activeTab === 'find' && (
        <div className="space-y-4">
          {/* Search box with full criteria support */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, prénom, email ou téléphone (ex: 70 12 34 56)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-10 py-3 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {!hasSearchQuery ? (
            /* Privacy-focused initial state - Do not dump users */
            <div className="py-8 px-5 bg-gradient-to-b from-gray-50/80 to-white dark:from-gray-800/40 dark:to-gray-800/20 rounded-3xl border border-gray-100 dark:border-gray-800 text-center space-y-5">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <Search className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-sm font-black text-gray-900 dark:text-white">
                  Rechercher un(e) ami(e)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                  Pour préserver la confidentialité des membres, la liste complète des utilisateurs n'est pas publique. Tapez au moins 2 caractères pour rechercher un proche.
                </p>
              </div>

              {/* Search modalities guidance */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-lg mx-auto text-left pt-2">
                <div className="p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-2xs">
                  <div className="flex items-center gap-2 mb-1 text-amber-600 dark:text-amber-400 font-bold text-xs">
                    <Users className="w-4 h-4" />
                    <span>Nom / Prénom</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Tapez le nom ou prénom de votre ami(e).
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-2xs">
                  <div className="flex items-center gap-2 mb-1 text-teal-600 dark:text-teal-400 font-bold text-xs">
                    <Phone className="w-4 h-4" />
                    <span>Téléphone</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Tapez son numéro mobile (ex: 70..., +226...).
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/60 shadow-2xs">
                  <div className="flex items-center gap-2 mb-1 text-blue-600 dark:text-blue-400 font-bold text-xs">
                    <Mail className="w-4 h-4" />
                    <span>E-mail</span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Tapez son adresse e-mail enregistrée.
                  </p>
                </div>
              </div>

              {/* Share Invite Link */}
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 max-w-sm mx-auto">
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">
                  Votre contact n'est pas encore sur ZAKA ? Invitez-le en un clic :
                </p>
                <button
                  onClick={() => {
                    const shareText = `Salut ! Rejoins-moi sur ZAKA pour partager nos sorties, événements et bons plans : ${window.location.origin}`;
                    if (navigator.share) {
                      navigator.share({ title: 'Rejoins-moi sur ZAKA', text: shareText, url: window.location.origin }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(shareText);
                      showFeedback('success', "Lien d'invitation copié dans votre presse-papiers !");
                    }
                  }}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  Inviter par WhatsApp / SMS
                </button>
              </div>
            </div>
          ) : filteredSearchUsers.length === 0 ? (
            /* Search yielded no results */
            <div className="text-center py-10 px-4 bg-gray-50 dark:bg-gray-800/40 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 space-y-3">
              <UserX className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto" />
              <div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Aucun utilisateur trouvé pour « {searchQuery} »
                </p>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1">
                  Vérifiez l'orthographe du nom, le numéro ou l'adresse e-mail saisie. Si votre contact n'a pas encore de compte, vous pouvez lui envoyer une invitation directe.
                </p>
              </div>
              <button
                onClick={() => {
                  const shareText = `Salut ! Rejoins-moi sur ZAKA pour partager nos sorties, événements et bons plans : ${window.location.origin}`;
                  if (navigator.share) {
                    navigator.share({ title: 'Rejoins-moi sur ZAKA', text: shareText, url: window.location.origin }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(shareText);
                    showFeedback('success', "Lien d'invitation copié dans votre presse-papiers !");
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                Inviter par WhatsApp / SMS
              </button>
            </div>
          ) : (
            /* Search results matched */
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
                <span className="font-semibold">
                  {filteredSearchUsers.length} résultat{filteredSearchUsers.length > 1 ? 's' : ''} trouvé{filteredSearchUsers.length > 1 ? 's' : ''}
                </span>
                <span className="text-[11px] text-amber-600 dark:text-amber-400">
                  Recherche : « {searchQuery} »
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {filteredSearchUsers.map(otherUser => {
                  const friendship = getFriendshipWith(otherUser.id);
                  const isAccepted = friendship?.status === 'accepted';
                  const isPending = friendship?.status === 'pending';
                  const isIncoming = isPending && friendship.requesterId !== currentUser.id;

                  return (
                    <div 
                      key={otherUser.id}
                      className="flex items-center justify-between p-3 rounded-2xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-800/80 transition-all shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-sm border border-amber-200 dark:border-amber-800/40 shrink-0">
                          {otherUser.avatar ? (
                            <img src={otherUser.avatar} alt={otherUser.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            otherUser.name.charAt(0).toUpperCase()
                          )}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                            {otherUser.name}
                          </h4>
                          <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            {otherUser.phone && <span>📞 {otherUser.phone}</span>}
                            {otherUser.email && !otherUser.phone && <span>✉️ {otherUser.email}</span>}
                            {otherUser.city && <span className="text-gray-400">• {otherUser.city}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        {isAccepted ? (
                          <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-200 dark:border-emerald-800/40 inline-flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Ami(e)
                          </span>
                        ) : isIncoming ? (
                          <button
                            onClick={() => handleAccept(friendship.id)}
                            disabled={loadingActionId === friendship.id}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3 h-3" />
                            Accepter
                          </button>
                        ) : isPending ? (
                          <span className="px-2.5 py-1 text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-800/30 inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            En attente
                          </span>
                        ) : (
                          <button
                            onClick={() => handleSendRequest(otherUser.id)}
                            disabled={loadingActionId === otherUser.id}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 shadow-xs cursor-pointer"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                            Ajouter
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: STORY VIEWER */}
      {viewingStoryFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-gray-950 rounded-3xl w-full max-w-sm overflow-hidden flex flex-col h-[75vh] max-h-[650px] shadow-2xl relative border border-gray-800 text-white">
            
            {/* Story progress bars */}
            <div className="p-3 absolute top-0 left-0 right-0 z-20 flex gap-1">
              {viewingStoryFriend.stories.map((s, idx) => {
                let w = 0;
                if (idx < activeStoryIdx) w = 100;
                else if (idx === activeStoryIdx) w = storyProgress;
                return (
                  <div key={s.id || idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-75"
                      style={{ width: `${w}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Story Creator header */}
            <div className="p-4 pt-6 absolute top-0 left-0 right-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center font-bold text-xs">
                  {viewingStoryFriend.friend.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-black leading-none">{viewingStoryFriend.friend.name}</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">
                    {new Date(viewingStoryFriend.stories[activeStoryIdx]?.createdAt || Date.now()).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setViewingStoryFriend(null)}
                className="p-1.5 text-white/80 hover:text-white bg-black/40 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Story Content Area */}
            {(() => {
              const currentStory = viewingStoryFriend.stories[activeStoryIdx];
              if (!currentStory) return null;

              return (
                <div className="flex-1 relative flex flex-col justify-end p-6 bg-gradient-to-t from-black/90 via-black/40 to-black/20">
                  {currentStory.mediaUrl && (
                    <img 
                      src={currentStory.mediaUrl} 
                      alt="Story Media" 
                      className="absolute inset-0 w-full h-full object-cover -z-10 opacity-70"
                    />
                  )}

                  <div className="mb-6 z-10 space-y-2">
                    {currentStory.emoji && (
                      <span className="text-4xl">{currentStory.emoji}</span>
                    )}
                    <p className="text-base font-bold text-white drop-shadow-md leading-snug">
                      {currentStory.text}
                    </p>
                    {currentStory.location && (
                      <span className="inline-flex items-center gap-1 text-[11px] bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-full text-white font-semibold">
                        <MapPin className="w-3 h-3" /> {currentStory.location}
                      </span>
                    )}
                  </div>

                  {/* Story Quick Reactions via StoryEmojiReactionPicker */}
                  <div className="mb-3">
                    <StoryEmojiReactionPicker
                      currentReaction={currentStory.reactions?.[currentUser?.id || ''] || null}
                      reactions={currentStory.reactions || {}}
                      onReact={(emoji) => handleReactToStory(emoji)}
                    />
                  </div>

                  {/* Reply input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={`Répondre à ${viewingStoryFriend.friend.name}...`}
                      value={storyReplyText}
                      onChange={(e) => setStoryReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendStoryReply()}
                      className="flex-1 bg-white/15 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-white"
                    />
                    <button
                      onClick={handleSendStoryReply}
                      className="p-2 bg-orange-500 hover:bg-orange-600 rounded-xl text-white font-bold"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODAL 2: PARTAGER UNE RESSOURCE / PUBLICATION AVEC UN AMI */}
      {sharingWithFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Share2 className="w-4 h-4 text-orange-500" />
                  Partager avec {sharingWithFriend.name}
                </h3>
                <p className="text-[10px] text-gray-400">Envoyez directement un bon plan ou une sortie dans sa messagerie</p>
              </div>
              <button 
                onClick={() => setSharingWithFriend(null)}
                className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selector tabs */}
            <div className="flex border-b border-gray-100 dark:border-gray-800 p-2 gap-2 bg-gray-50/50 dark:bg-gray-800/30">
              <button
                onClick={() => setShareTab('pubs')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  shareTab === 'pubs'
                    ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Publications & Événements ({publications.length})
              </button>
              <button
                onClick={() => setShareTab('ests')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  shareTab === 'ests'
                    ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Établissements & Favoris ({establishments.length})
              </button>
            </div>

            {/* Content list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {shareTab === 'pubs' ? (
                publications.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">Aucune publication disponible à partager.</p>
                ) : (
                  publications.slice(0, 10).map(pub => {
                    const est = establishments.find(e => e.id === pub.establishmentId);
                    return (
                      <div 
                        key={pub.id}
                        className="p-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{pub.title}</p>
                          <p className="text-[10px] text-gray-500 truncate">Chez {est?.name || 'Établissement ZAKA'}</p>
                        </div>
                        <button
                          onClick={() => handleShareResourceToFriendChat(pub.title, `Consulte l'événement sur Zaka+ : ${window.location.origin}/#pub-${pub.id}`, 'publication')}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                        >
                          <Send className="w-3 h-3" /> Envoyer
                        </button>
                      </div>
                    );
                  })
                )
              ) : (
                establishments.slice(0, 10).map(est => (
                  <div 
                    key={est.id}
                    className="p-3 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{est.name}</p>
                      <p className="text-[10px] text-gray-500 truncate">📍 {est.city || 'Ouaga'} • {est.category}</p>
                    </div>
                    <button
                      onClick={() => handleShareResourceToFriendChat(est.name, `Découvre cet établissement sur Zaka+ : ${window.location.origin}/#est-${est.id}`, 'establishment')}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                    >
                      <Send className="w-3 h-3" /> Envoyer
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CREER UNE STORY EPHEMERE */}
      {showCreateStoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-sm overflow-hidden p-5 shadow-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-500" />
                Publier une Story (24h)
              </h3>
              <button 
                onClick={() => setShowCreateStoryModal(false)}
                className="p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreatePersonalStory} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                  Votre humeur / message :
                </label>
                <textarea
                  rows={3}
                  value={newStoryText}
                  onChange={(e) => setNewStoryText(e.target.value)}
                  placeholder="Ex: Qui est chaud pour un verre ce soir au Bambou ? 🔥"
                  className="w-full p-3 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                  Emoji d'ambiance :
                </label>
                <div className="flex items-center justify-around p-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  {['🔥', '⚡', '🍹', '🎧', '✨', '🎉'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewStoryEmoji(emoji)}
                      className={`text-xl p-1.5 rounded-lg transition-transform ${newStoryEmoji === emoji ? 'scale-125 bg-white dark:bg-gray-700 shadow-xs' : 'hover:scale-110'}`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingStory || !newStoryText.trim()}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingStory ? "Publication..." : "Partager ma Story"}
                  <Flame className="w-4 h-4 fill-white" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
