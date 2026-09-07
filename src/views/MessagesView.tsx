import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { supabase, isSupabaseConfigured } from './../lib/supabaseClient';
import { MessageSquare, Send, Paperclip, ChevronLeft, Calendar, FileText, Download, Loader2, X, AlertCircle, UserPlus, Users, Share2, Sparkles, MapPin, Tag, Check, CheckCheck, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { compressImage } from '../utils/imageCompressor';
import { triggerHapticFeedback } from '../utils/haptics';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  isRead?: boolean;
  readAt?: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string;
  clientId: string;
  clientName: string;
  establishmentId: string;
  establishmentName: string;
  ownerId: string;
  djId?: string;
  lastMessage: string;
  lastMessageAt: string;
  lastSenderId: string;
  unreadByClient: boolean;
  unreadByGerant: boolean;
  unreadByDj?: boolean;
}

interface MessagesViewProps {
  onBackToHome?: () => void;
  preselectedEstablishmentId?: string | null;
  preselectedRecipientType?: 'gerant' | 'dj';
  preselectedConvId?: string | null;
  onClearPreselected?: () => void;
}

export function MessagesView({ onBackToHome, preselectedEstablishmentId, preselectedRecipientType = 'gerant', preselectedConvId, onClearPreselected }: MessagesViewProps) {
  const { currentUser, establishments, relationshipRequests, users, friendships, publications } = useAppStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ base64: string; name: string; type: string } | null>(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [showNewFriendModal, setShowNewFriendModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTab, setShareTab] = useState<'publications' | 'establishments'>('publications');
  const [shareSearch, setShareSearch] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myEsts = establishments.filter(e => e.ownerId === currentUser?.id);
  const myEstIds = myEsts.map(e => e.id);
  const isGerant = currentUser?.role === 'gerant' || currentUser?.role === 'salon_coiffure';
  const isDJChatActive = activeConv && (activeConv as any).recipientType === 'dj';

  // Confirmed friends list
  const confirmedFriends = (friendships || [])
    .filter(f => f.status === 'accepted' && (f.user1Id === currentUser?.id || f.user2Id === currentUser?.id))
    .map(f => {
      const friendId = f.user1Id === currentUser?.id ? f.user2Id : f.user1Id;
      const friendUser = users.find(u => u.id === friendId) || {
        id: friendId,
        name: 'Ami(e) Zaka',
        email: '',
        phone: '',
        role: 'client' as const
      };
      return { friendshipId: f.id, friendUser };
    });

  // Start or open a direct chat with a confirmed friend
  const startChatWithFriend = async (friendUser: { id: string; name: string; email?: string; phone?: string }) => {
    if (!currentUser) return;
    try {
      setIsSending(true);
      // Check existing conversation
      const existing = conversations.find(c =>
        (c.establishmentId === 'direct_friend' || c.establishmentId?.startsWith('friend_')) &&
        ((c.clientId === currentUser.id && c.ownerId === friendUser.id) ||
         (c.clientId === friendUser.id && c.ownerId === currentUser.id))
      );

      if (existing) {
        setActiveConv(existing);
        setShowNewFriendModal(false);
        return;
      }

      const newConvData = {
        clientId: currentUser.id,
        clientName: currentUser.name || currentUser.email || 'Ami(e)',
        establishmentId: 'direct_friend',
        establishmentName: friendUser.name || 'Ami(e)',
        ownerId: friendUser.id,
        lastMessage: "Discussion privée démarrée 👋",
        lastMessageAt: new Date().toISOString(),
        lastMessageDate: new Date().toISOString(),
        lastSenderId: currentUser.id,
        unreadByClient: false,
        unreadByGerant: true
      };

      if (isSupabaseConfigured) {
        const { data, error } = await supabase.from('conversations').insert([newConvData]).select().single();
        if (!error && data) {
          setConversations(prev => [data as Conversation, ...prev]);
          setActiveConv(data as Conversation);
        } else {
          const localConv = { id: `conv-friend-${Date.now()}`, ...newConvData } as Conversation;
          setConversations(prev => [localConv, ...prev]);
          setActiveConv(localConv);
        }
      } else {
        const localConv = { id: `conv-friend-${Date.now()}`, ...newConvData } as Conversation;
        setConversations(prev => [localConv, ...prev]);
        setActiveConv(localConv);
      }
      setShowNewFriendModal(false);
      triggerHapticFeedback(50);
    } catch (err) {
      console.error("Erreur startChatWithFriend:", err);
      setErrorMsg("Impossible d'ouvrir la discussion avec cet ami.");
    } finally {
      setIsSending(false);
    }
  };

  // Share a publication or establishment directly in active friend chat
  const handleShareResource = async (resource: { type: 'publication' | 'establishment'; title: string; subtitle?: string; imageUrl?: string }) => {
    if (!activeConv || !currentUser) return;
    try {
      setIsSending(true);
      const tag = resource.type === 'publication' ? '🎉 Bon Plan / Événement :' : '📍 Recommandation Établissement :';
      const text = `${tag}\n${resource.title}\n${resource.subtitle || ''}\n(Partagé sur Zaka+)`;

      const msgData: any = {
        conversationId: activeConv.id,
        senderId: currentUser.id,
        senderName: currentUser.name || 'Ami',
        text: text,
        createdAt: new Date().toISOString(),
        ...(resource.imageUrl ? {
          fileUrl: resource.imageUrl,
          fileName: resource.title,
          fileType: 'image/jpeg'
        } : {})
      };

      if (isSupabaseConfigured) {
        await supabase.from('messages').insert([msgData]);
        await supabase.from('conversations').update({
          lastMessage: `🎁 ${resource.title}`,
          lastMessageAt: new Date().toISOString(),
          lastSenderId: currentUser.id,
          unreadByClient: activeConv.ownerId === currentUser.id,
          unreadByGerant: activeConv.clientId === currentUser.id
        }).eq('id', activeConv.id);
      }

      setMessages(prev => [...prev, { id: `msg-${Date.now()}`, ...msgData }]);
      setShowShareModal(false);
      triggerHapticFeedback(50);
    } catch (err) {
      console.error("Erreur handleShareResource:", err);
      setErrorMsg("Erreur lors du partage de la ressource.");
    } finally {
      setIsSending(false);
    }
  };

  // Automatically scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, attachedFile]);

  // Handle preselected conversation ID
  useEffect(() => {
    if (!preselectedConvId || loadingConvs || conversations.length === 0) return;
    
    const existingConv = conversations.find(c => c.id === preselectedConvId);
    if (existingConv) {
      setActiveConv(existingConv);
      if (onClearPreselected) onClearPreselected();
    }
  }, [preselectedConvId, conversations, loadingConvs]);

  // Handle preselected establishment from home/explore view
  useEffect(() => {
    if (!currentUser || !preselectedEstablishmentId || loadingConvs) return;

    const targetEst = establishments.find(e => e.id === preselectedEstablishmentId);
    if (!targetEst) return;

    const isDJChat = preselectedRecipientType === 'dj';

    // Check if conversation already exists in loaded conversations
    const existingConv = conversations.find(c => 
      c.establishmentId === preselectedEstablishmentId && 
      c.clientId === currentUser.id &&
      (isDJChat ? (c as any).recipientType === 'dj' : (c as any).recipientType !== 'dj')
    );
    
    if (existingConv) {
      setActiveConv(existingConv);
      if (onClearPreselected) onClearPreselected();
    } else {
      // Create new conversation
      const startNewConversation = async () => {
        try {
          const activeDJReq = relationshipRequests.find(r => r.establishmentId === targetEst.id && r.status === 'acceptee' && r.isDJ);
          const djId = activeDJReq ? (activeDJReq.type === 'client_join' ? activeDJReq.initiatorId : activeDJReq.targetId) : null;

          const newConv: any = {
            clientId: currentUser.id,
            clientName: currentUser.name || currentUser.email || 'Client',
            establishmentId: targetEst.id,
            establishmentName: targetEst.name,
            ownerId: targetEst.ownerId,
            recipientType: preselectedRecipientType || 'gerant',
            djId: djId || null,
            lastMessage: 'Discussion démarrée',
            lastMessageAt: new Date().toISOString(),
            lastMessageDate: new Date().toISOString(),
            lastSenderId: currentUser.id,
            unreadByClient: false,
            unreadByGerant: !isDJChat,
            unreadByDj: isDJChat
          };

          if (isSupabaseConfigured) {
            let convPayload = { ...newConv };
            let data: any = null;
            let error: any = null;
            let attempts = 0;

            while (attempts < 15) {
              attempts++;
              const res = await supabase
                .from('conversations')
                .insert([convPayload])
                .select()
                .single();
              data = res.data;
              error = res.error;
              if (!error) break;

              if (error.code === '22P02' && convPayload.id) {
                delete convPayload.id;
                continue;
              }

              if (error.code === 'PGRST204' || error.message?.includes('schema cache') || error.message?.includes('does not exist') || error.message?.includes('column')) {
                const match = error.message.match(/Could not find the '([^']+)' column/i) ||
                              error.message.match(/column ['"]?([^'"]+)['"]? (?:of relation|does not exist|in the schema cache)/i) ||
                              error.message.match(/column ['"]?([^'"]+)['"]? does not exist/i) ||
                              error.message.match(/['"]?([^'"]+)['"]? column/i);
                if (match && match[1] && convPayload[match[1]] !== undefined) {
                  delete convPayload[match[1]];
                  continue;
                }
              }
              break;
            }

            if (!error && data) {
              setActiveConv(data as any);
            }
          }
          
          if (onClearPreselected) onClearPreselected();
        } catch (err) {
          console.error("Erreur lors de la création de la conversation:", err);
        }
      };
      startNewConversation();
    }
  }, [preselectedEstablishmentId, preselectedRecipientType, conversations, currentUser, establishments, loadingConvs, relationshipRequests]);

  // Load conversations
  useEffect(() => {
    if (!currentUser) return;
    let active = true;
    let channel: any = null;

    const loadConvs = async () => {
      if (isSupabaseConfigured) {
        try {
          let query = supabase.from('conversations').select('*');
          query = query.or(`clientId.eq.${currentUser.id},ownerId.eq.${currentUser.id},djId.eq.${currentUser.id}`);

          const { data, error } = await query;
          if (!error && data && active) {
            const list = data as Conversation[];
            list.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
            setConversations(list);
            setLoadingConvs(false);

            if (activeConv) {
              const fresh = list.find(c => c.id === activeConv.id);
              if (fresh) {
                setActiveConv(fresh);
              }
            }
          }

          // Subscribe to live updates in conversations table with unique channel name to prevent "after subscribe" errors
          const uniqueConvChannel = `conversations-channel-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
          channel = supabase
            .channel(uniqueConvChannel)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'conversations' },
              async () => {
                const { data: updatedData } = await supabase
                  .from('conversations')
                  .select('*')
                  .or(`clientId.eq.${currentUser.id},ownerId.eq.${currentUser.id},djId.eq.${currentUser.id}`);
                
                if (updatedData && active) {
                  const sorted = updatedData as Conversation[];
                  sorted.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
                  setConversations(sorted);
                }
              }
            )
            .subscribe();

        } catch (e) {
          console.error(e);
          if (active) setLoadingConvs(false);
        }
      } else {
        if (active) setLoadingConvs(false);
      }
    };

    loadConvs();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [currentUser, isGerant, activeConv?.id]);

  // Load messages for the active conversation
  useEffect(() => {
    if (!activeConv) {
      setMessages([]);
      return;
    }

    let active = true;
    let channel: any = null;

    const loadMessages = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversationId', activeConv.id)
            .order('createdAt', { ascending: true })
            .limit(100);

          if (!error && data && active) {
            setMessages(data as Message[]);
          }

          // Subscribe to updates with unique channel name to prevent "after subscribe" errors
          const uniqueMsgChannel = `messages:${activeConv.id}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
          channel = supabase
            .channel(uniqueMsgChannel)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'messages', filter: `conversationId=eq.${activeConv.id}` },
              async () => {
                const { data: updatedMsgs } = await supabase
                  .from('messages')
                  .select('*')
                  .eq('conversationId', activeConv.id)
                  .order('createdAt', { ascending: true })
                  .limit(100);

                if (updatedMsgs && active) {
                  setMessages(updatedMsgs as Message[]);
                }
              }
            )
            .subscribe();

          // Mark conversation as read safely
          try {
            const isDJOfActive = activeConv.djId === currentUser?.id && (activeConv as any).recipientType === 'dj';
            let markPayload: any = null;
            if (isDJOfActive && (activeConv as any).unreadByDj) {
              markPayload = { unreadByDj: false };
            } else if (isGerant && activeConv.unreadByGerant) {
              markPayload = { unreadByGerant: false };
            } else if (!isGerant && !isDJOfActive && activeConv.unreadByClient) {
              markPayload = { unreadByClient: false };
            }

            // Also mark unread messages as read safely
            try {
              await supabase
                .from('messages')
                .update({ isRead: true, readAt: new Date().toISOString() })
                .eq('conversationId', activeConv.id)
                .neq('senderId', currentUser?.id);
            } catch {
              // Ignore if column is not yet in Supabase schema
            }
          } catch (readErr) {
            // Ignore if unread flags column does not exist in schema
          }

        } catch (e) {
          console.error(e);
        }
      }
    };

    loadMessages();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [activeConv?.id]);

  // Handle sending text or file messages
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!currentUser || !activeConv) return;
    if (!inputText.trim() && !attachedFile) return;

    // Trigger vibration feedback for sending messages
    triggerHapticFeedback(50);

    setIsSending(true);
    setErrorMsg(null);

    const textToSend = inputText.trim();
    const fileToSend = attachedFile;

    // Reset inputs immediately for responsive feel
    setInputText('');
    setAttachedFile(null);

    try {
      const msgData = {
        conversationId: activeConv.id,
        senderId: currentUser.id,
        senderName: currentUser.name || 'Utilisateur',
        text: textToSend,
        createdAt: new Date().toISOString(),
        isRead: false,
        status: 'sent',
        ...(fileToSend ? {
          fileUrl: fileToSend.base64,
          fileName: fileToSend.name,
          fileType: fileToSend.type
        } : {})
      };

      if (isSupabaseConfigured) {
        // Add to messages with auto-pruning
        let msgPayload: any = { ...msgData };
        let msgAttempts = 0;
        while (msgAttempts < 15) {
          msgAttempts++;
          const { error: mErr } = await supabase.from('messages').insert([msgPayload]);
          if (!mErr) break;
          if (mErr.code === 'PGRST204' || mErr.message?.includes('schema cache') || mErr.message?.includes('does not exist') || mErr.message?.includes('column')) {
            const match = mErr.message.match(/Could not find the '([^']+)' column/i) ||
                          mErr.message.match(/column ['"]?([^'"]+)['"]? (?:of relation|does not exist|in the schema cache)/i) ||
                          mErr.message.match(/column ['"]?([^'"]+)['"]? does not exist/i) ||
                          mErr.message.match(/['"]?([^'"]+)['"]? column/i);
            if (match && match[1] && msgPayload[match[1]] !== undefined) {
              delete msgPayload[match[1]];
              continue;
            }
          }
          break;
        }

        // Update conversation summary with auto-pruning
        const isDJOfActive = activeConv.djId === currentUser?.id && (activeConv as any).recipientType === 'dj';
        const updateData: any = {
          lastMessage: fileToSend ? `📎 ${fileToSend.name}` : textToSend,
          lastMessageAt: new Date().toISOString(),
          lastMessageDate: new Date().toISOString(),
          lastSenderId: currentUser.id,
          unreadByClient: isGerant || isDJOfActive,
          unreadByGerant: !isGerant && !isDJOfActive && (activeConv as any).recipientType !== 'dj',
          unreadByDj: !isDJOfActive && (activeConv as any).recipientType === 'dj'
        };

        let convAttempts = 0;
        while (convAttempts < 15) {
          convAttempts++;
          const { error: cErr } = await supabase.from('conversations').update(updateData).eq('id', activeConv.id);
          if (!cErr) break;
          if (cErr.code === 'PGRST204' || cErr.message?.includes('schema cache') || cErr.message?.includes('does not exist') || cErr.message?.includes('column')) {
            const match = cErr.message.match(/Could not find the '([^']+)' column/i) ||
                          cErr.message.match(/column ['"]?([^'"]+)['"]? (?:of relation|does not exist|in the schema cache)/i) ||
                          cErr.message.match(/column ['"]?([^'"]+)['"]? does not exist/i) ||
                          cErr.message.match(/['"]?([^'"]+)['"]? column/i);
            if (match && match[1] && updateData[match[1]] !== undefined) {
              delete updateData[match[1]];
              continue;
            }
          }
          break;
        }
      }
    } catch (err) {
      console.error("Erreur lors de l'envoi du message:", err);
      setErrorMsg("Impossible d'envoyer le message. Veuillez réessayer.");
    } finally {
      setIsSending(false);
    }
  };

  // Handle File Input Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit non-images to 500KB to stay well within Firestore 1MB limit with base64 overhead
    if (!file.type.startsWith('image/') && file.size > 500 * 1024) {
      setErrorMsg("Le document est trop lourd. Limite autorisée : 500 Ko pour les documents.");
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        let base64 = event.target?.result as string;

        // If it's an image, compress it
        if (file.type.startsWith('image/')) {
          try {
            base64 = await compressImage(file, 800, 800, 0.7);
          } catch (compressErr) {
            console.error("Compression failed, using original base64", compressErr);
          }
        }

        // Firestore doc size limit is 1MB (~1048576 bytes).
        // 1MB base64 string is roughly 1048500 characters.
        if (base64.length > 1040000) {
          setErrorMsg("L'image est toujours trop volumineuse après compression. Veuillez choisir une image plus petite.");
          setIsUploading(false);
          return;
        }

        setAttachedFile({
          base64,
          name: file.name,
          type: file.type
        });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error reading file:", err);
      setErrorMsg("Une erreur est survenue lors de la lecture du fichier.");
      setIsUploading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getFormatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getFormatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  // Check if file is image for direct rendering
  const isImageFile = (mimeType?: string) => {
    return mimeType?.startsWith('image/');
  };

  if (!currentUser) {
    return (
      <div className="p-4 text-center mt-12 max-w-sm mx-auto">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-10 h-10 text-gray-300" />
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">Connectez-vous</h2>
        <p className="text-gray-500 font-medium mb-4">Pour pouvoir échanger et discuter avec vos établissements favoris.</p>
        {onBackToHome && (
          <button onClick={onBackToHome} className="px-5 py-2.5 bg-orange-600 text-white font-bold rounded-xl shadow-sm hover:bg-orange-700 active:scale-95 transition-all text-sm cursor-pointer">
            Retour à l'accueil
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto pb-24 h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4">
      
      {/* 1. Sidebar - Discussions List */}
      <div className={cn(
        "w-full md:w-80 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden h-full",
        activeConv ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-orange-500" />
            Messagerie
          </h2>
          <div className="flex items-center gap-2">
            {confirmedFriends.length > 0 && (
              <button
                onClick={() => setShowNewFriendModal(true)}
                className="px-2.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                title="Démarrer une discussion privée avec un ami confirmé"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Ami(e)</span>
              </button>
            )}
            {isGerant && (
              <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2.5 py-1 rounded-full uppercase">
                Espace Gérant
              </span>
            )}
          </div>
        </div>

        {errorMsg && (
          <div className="m-3 p-3 bg-red-50 text-red-600 rounded-xl flex items-center gap-2 text-xs font-semibold border border-red-100">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto divide-y divide-gray-50/50">
          {loadingConvs ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
              <p className="text-xs text-gray-400 font-bold">Chargement des messages...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 text-gray-400 my-auto">
              <MessageSquare className="w-12 h-12 text-gray-200 mb-3" />
              <p className="font-bold text-sm text-gray-600 mb-1">Aucune discussion</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                {isGerant 
                  ? "Vous recevrez des messages ici lorsqu'un client vous contactera." 
                  : "Discutez en privé avec vos ami(e)s confirmés ou contactez vos établissements favoris !"}
              </p>
              {confirmedFriends.length > 0 && (
                <button
                  onClick={() => setShowNewFriendModal(true)}
                  className="mt-3 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer mx-auto"
                >
                  <UserPlus className="w-4 h-4" />
                  Discuter avec un ami ({confirmedFriends.length})
                </button>
              )}
            </div>
          ) : (
            conversations.map((conv) => {
              const isDJOfConv = conv.djId === currentUser?.id && (conv as any).recipientType === 'dj';
              const isFriendChat = conv.establishmentId === 'direct_friend' || conv.establishmentId?.startsWith('friend_');
              const isUnread = isDJOfConv
                ? (conv as any).unreadByDj
                : isGerant
                ? conv.unreadByGerant
                : conv.unreadByClient;

              let titleName = isGerant ? conv.clientName : conv.establishmentName;
              if (isFriendChat) {
                titleName = conv.clientId === currentUser?.id ? conv.establishmentName : conv.clientName;
              } else if (isDJOfConv) {
                titleName = conv.clientName;
              }

              const isDJChat = (conv as any).recipientType === 'dj';
              const subName = isFriendChat
                ? `Ami(e) ZAKA`
                : isDJOfConv 
                ? `Demande de son (DJ)` 
                : isDJChat
                ? `🎧 DJ de l'établissement`
                : isGerant
                ? `Client`
                : `Établissement`;

              const isActive = activeConv?.id === conv.id;

              return (
                <button
                  key={conv.id}
                  onClick={() => setActiveConv(conv)}
                  className={cn(
                    "w-full text-left p-4 flex gap-3 transition-colors hover:bg-gray-50",
                    isActive && "bg-orange-50/40 hover:bg-orange-50/40",
                    isUnread && "bg-orange-50/10"
                  )}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-2xl font-bold flex items-center justify-center text-lg shadow-sm border flex-shrink-0",
                    isFriendChat
                      ? "bg-gradient-to-br from-amber-50 to-orange-100 text-amber-700 border-amber-200/40"
                      : isDJChat 
                      ? "bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 border-purple-200/20"
                      : "bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600 border-orange-200/20"
                  )}>
                    {titleName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={cn("font-bold text-gray-900 truncate text-sm flex items-center gap-1.5", isUnread && "text-orange-950 font-black")}>
                        {titleName}
                        {isDJChat && (
                          <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            🎧 DJ
                          </span>
                        )}
                      </span>
                      <span className="text-[10px] text-gray-400 font-medium">
                        {getFormatDate(conv.lastMessageAt)}
                      </span>
                    </div>
                    <p className={cn("text-xs text-gray-400 font-semibold mb-0.5", isDJChat && "text-purple-600/80")}>
                      {subName}
                    </p>
                    <p className={cn("text-xs text-gray-500 truncate flex items-center gap-1", isUnread && "text-orange-600 font-bold")}>
                      {conv.lastSenderId === currentUser.id && (() => {
                        const isFriendChat = conv.establishmentId === 'direct_friend' || conv.establishmentId?.startsWith('friend_');
                        const isDJOfConv = conv.djId === currentUser?.id && (conv as any).recipientType === 'dj';
                        const otherHasRead = isDJOfConv 
                          ? !(conv as any).unreadByClient 
                          : isGerant 
                          ? !conv.unreadByClient 
                          : isFriendChat 
                          ? (conv.clientId === currentUser.id ? !conv.unreadByGerant : !conv.unreadByClient)
                          : !conv.unreadByGerant;

                        return (
                          <span className="shrink-0" title={otherHasRead ? "Lu par votre correspondant" : "Distribué"}>
                            {otherHasRead ? (
                              <CheckCheck className="w-3.5 h-3.5 text-sky-500 stroke-[2.5]" />
                            ) : (
                              <CheckCheck className="w-3.5 h-3.5 text-gray-400 stroke-[2]" />
                            )}
                          </span>
                        );
                      })()}
                      <span className="truncate">{conv.lastMessage}</span>
                    </p>
                  </div>
                  {isUnread && (
                    <div className="w-2.5 h-2.5 bg-orange-500 rounded-full my-auto flex-shrink-0"></div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Active Chat Panel */}
      <div className={cn(
        "flex-1 bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col overflow-hidden h-full",
        !activeConv ? "hidden md:flex items-center justify-center text-gray-400 p-8 text-center" : "flex"
      )}>
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-50 flex items-center gap-3">
              <button 
                onClick={() => setActiveConv(null)} 
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 md:hidden"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              {(() => {
                const isDJOfActive = activeConv.djId === currentUser?.id && (activeConv as any).recipientType === 'dj';
                const isFriendActive = activeConv.establishmentId === 'direct_friend' || activeConv.establishmentId?.startsWith('friend_');
                const activeTitleName = isFriendActive
                  ? (activeConv.clientId === currentUser?.id ? activeConv.establishmentName : activeConv.clientName)
                  : isDJOfActive
                  ? activeConv.clientName
                  : isGerant
                  ? activeConv.clientName
                  : activeConv.establishmentName;

                const activeSubName = isFriendActive
                  ? "Ami(e) ZAKA connecté(e)"
                  : isDJOfActive
                  ? "Client (Demande de son DJ)"
                  : (activeConv as any).recipientType === 'dj'
                  ? "Discussion avec le DJ"
                  : isGerant
                  ? "Discute avec vous"
                  : "Établissement vérifié";

                const isDJChat = (activeConv as any).recipientType === 'dj';

                return (
                  <>
                    <div className={cn(
                      "w-10 h-10 rounded-xl font-bold flex items-center justify-center text-white",
                      isFriendActive ? "bg-gradient-to-br from-amber-500 to-orange-600" : isDJChat ? "bg-purple-600" : "bg-orange-600"
                    )}>
                      {activeTitleName.substring(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-950 text-sm leading-tight flex items-center gap-1.5">
                        {activeTitleName}
                        {isDJChat && (
                          <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded">
                            🎧 Canal DJ
                          </span>
                        )}
                      </h3>
                      <span className="text-[10px] text-gray-400 font-semibold uppercase">
                        {activeSubName}
                      </span>
                    </div>

                    {isFriendActive && (
                      <button
                        onClick={() => setShowShareModal(true)}
                        className="ml-auto px-3 py-1.5 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-800 border border-amber-200/80 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Partager un bon plan, événement ou établissement avec cet ami"
                      >
                        <Share2 className="w-3.5 h-3.5 text-amber-600" />
                        <span className="hidden sm:inline">Partager un bon plan</span>
                      </button>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Chat Message List */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50/50">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 p-8">
                  <MessageSquare className="w-10 h-10 text-gray-200 mb-2" />
                  <p className="font-bold text-xs text-gray-600">Aucun message</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Envoyez un message ou joignez un fichier pour démarrer.</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === currentUser?.id;
                  const isFriendChat = activeConv.establishmentId === 'direct_friend' || activeConv.establishmentId?.startsWith('friend_');
                  const otherHasOpened = isGerant
                    ? !activeConv.unreadByClient
                    : isFriendChat
                    ? (activeConv.clientId === currentUser?.id ? !activeConv.unreadByGerant : !activeConv.unreadByClient)
                    : !activeConv.unreadByGerant;

                  const hasRepliedAfter = activeConv.lastSenderId !== currentUser?.id && new Date(activeConv.lastMessageAt).getTime() >= new Date(msg.createdAt).getTime();

                  const isMsgRead = isMe && Boolean(msg.isRead || (otherHasOpened && new Date(msg.createdAt).getTime() <= new Date(activeConv.lastMessageAt).getTime()) || hasRepliedAfter);
                  const isMsgDelivered = isMe && !isMsgRead;

                  return (
                    <div 
                      key={msg.id} 
                      className={cn(
                        "flex flex-col max-w-[80%] rounded-2xl p-3 shadow-sm relative group",
                        isMe 
                          ? (isDJChatActive ? "ml-auto bg-purple-600 text-white rounded-br-none" : "ml-auto bg-orange-600 text-white rounded-br-none") 
                          : "mr-auto bg-white text-gray-900 border border-gray-100 rounded-bl-none"
                      )}
                    >
                      {/* Attached File Content */}
                      {msg.fileUrl && (
                        <div className="mb-2">
                          {isImageFile(msg.fileType) ? (
                            <div className="rounded-lg overflow-hidden border border-black/5 bg-black/5">
                              <img 
                                src={msg.fileUrl} 
                                alt={msg.fileName || "Image jointe"} 
                                className="max-h-60 object-contain mx-auto" 
                              />
                            </div>
                          ) : (
                            <a 
                              href={msg.fileUrl} 
                              download={msg.fileName || 'fichier'}
                              className={cn(
                                "flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold select-none transition-colors",
                                isMe 
                                  ? (isDJChatActive ? "bg-purple-700/50 border-purple-500/20 text-white hover:bg-purple-700" : "bg-orange-700/50 border-orange-500/20 text-white hover:bg-orange-700") 
                                  : "bg-gray-50 border-gray-200 text-gray-800 hover:bg-gray-100"
                              )}
                            >
                              <FileText className={cn("w-4 h-4 flex-shrink-0", isDJChatActive ? "text-purple-500" : "text-orange-500")} />
                              <div className="flex-1 min-w-0 text-left">
                                <p className="truncate leading-tight font-bold">{msg.fileName}</p>
                                <span className="text-[9px] opacity-70">Télécharger le document</span>
                              </div>
                              <Download className="w-3.5 h-3.5 flex-shrink-0" />
                            </a>
                          )}
                        </div>
                      )}

                      {/* Text content */}
                      {msg.text && (
                        <p className="text-xs leading-relaxed whitespace-pre-wrap font-medium">
                          {msg.text}
                        </p>
                      )}

                      {/* Timestamp & Read indicators (Double Checkmarks) */}
                      <div className={cn(
                        "flex items-center justify-end gap-1 mt-1 font-bold select-none",
                        isMe ? (isDJChatActive ? "text-purple-100" : "text-orange-100") : "text-gray-400"
                      )}>
                        <span className="text-[9px] opacity-80">
                          {getFormatTime(msg.createdAt)}
                        </span>
                        {isMe && (
                          <span 
                            className="inline-flex items-center ml-0.5" 
                            title={isMsgRead ? "Lu par votre correspondant (vu)" : "Distribué (reçu)"}
                          >
                            {isMsgRead ? (
                              <CheckCheck className="w-3.5 h-3.5 text-sky-200 drop-shadow-xs stroke-[2.5]" />
                            ) : isMsgDelivered ? (
                              <CheckCheck className="w-3.5 h-3.5 opacity-70 stroke-[2]" />
                            ) : (
                              <Check className="w-3.5 h-3.5 opacity-70 stroke-[2]" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Attached file preview before sending */}
            {attachedFile && (
              <div className="px-4 py-2 bg-orange-50 border-t border-orange-100 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <Paperclip className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <span className="font-bold text-gray-900 truncate">{attachedFile.name}</span>
                  <span className="text-[10px] text-gray-400 font-medium">Prêt à l'envoi</span>
                </div>
                <button 
                  onClick={() => setAttachedFile(null)} 
                  className="p-1 hover:bg-orange-200 rounded-full text-orange-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Chat Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-50 flex items-center gap-2 bg-white">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              />
              
              <button
                type="button"
                disabled={isUploading || isSending}
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-gray-500 hover:text-orange-600 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
                title="Joindre un fichier (Max 500 Ko)"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-orange-500" />
                ) : (
                  <Paperclip className="w-5 h-5" />
                )}
              </button>

              {activeConv && (activeConv.establishmentId === 'direct_friend' || activeConv.establishmentId?.startsWith('friend_')) && (
                <button
                  type="button"
                  disabled={isSending}
                  onClick={() => setShowShareModal(true)}
                  className="p-3 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-all"
                  title="Partager un bon plan ou une ressource avec cet ami"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              )}

              <textarea 
                placeholder="Rédigez votre message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isSending}
                rows={2}
                className="flex-1 bg-gray-50 border-none outline-none rounded-xl px-4 py-2.5 text-xs font-medium focus:bg-gray-100 focus:ring-1 focus:ring-orange-500/20 resize-none"
              />

              <button
                type="submit"
                disabled={isSending || (!inputText.trim() && !attachedFile)}
                className="p-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:hover:bg-orange-600 flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center max-w-sm">
            <MessageSquare className="w-16 h-16 text-gray-100 mb-4" />
            <h3 className="text-lg font-black text-gray-900 mb-1">Pas de discussion active</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Sélectionnez une discussion de la liste pour lire ou envoyer un message avec des pièces jointes.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Choisir un ami pour démarrer une discussion privée */}
      {showNewFriendModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Discuter avec un(e) ami(e)</h3>
                  <p className="text-[10px] text-gray-500">Choisissez un(e) ami(e) confirmé(e) pour lancer une discussion privée</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewFriendModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 divide-y divide-gray-50">
              {confirmedFriends.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-gray-700">Aucun ami confirmé pour l'instant</p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Recherchez des amis par leur nom, e-mail ou numéro de téléphone dans votre Profil pour vous connecter et discuter.
                  </p>
                </div>
              ) : (
                confirmedFriends.map(({ friendUser }) => (
                  <div key={friendUser.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white font-black flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                        {friendUser.name ? friendUser.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{friendUser.name}</p>
                        {friendUser.phone && <p className="text-[10px] text-gray-400">📞 {friendUser.phone}</p>}
                        {friendUser.email && !friendUser.phone && <p className="text-[10px] text-gray-400 truncate">✉️ {friendUser.email}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => startChatWithFriend(friendUser)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer flex-shrink-0"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Discuter</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Partager un bon plan ou un établissement dans la discussion */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh] border border-gray-100">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-amber-50 to-orange-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-bold">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">Partager une ressource entre ami(e)s</h3>
                  <p className="text-[10px] text-gray-500">Envoyez une recommandation ou un événement dans cette discussion</p>
                </div>
              </div>
              <button 
                onClick={() => setShowShareModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter Tabs & Search */}
            <div className="p-3 border-b border-gray-100 bg-gray-50 flex flex-col gap-2">
              <div className="flex rounded-xl bg-gray-200 p-1 text-xs font-bold">
                <button
                  onClick={() => setShareTab('publications')}
                  className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                    shareTab === 'publications' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  🎉 Soirées & Événements ({publications.length})
                </button>
                <button
                  onClick={() => setShareTab('establishments')}
                  className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer ${
                    shareTab === 'establishments' ? 'bg-white text-orange-600 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📍 Établissements ({establishments.filter(e => e.status === 'valide').length})
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par titre ou lieu..."
                  value={shareSearch}
                  onChange={(e) => setShareSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Resource Items List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {shareTab === 'publications' ? (
                publications
                  .filter(p => {
                    const q = shareSearch.toLowerCase();
                    return (p.title || '').toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q);
                  })
                  .slice(0, 15)
                  .map(pub => {
                    const est = establishments.find(e => e.id === pub.establishmentId);
                    const placeName = est ? `${est.name} (${est.neighborhood || est.city})` : 'Ouagadougou';
                    return (
                      <div 
                        key={pub.id} 
                        className="p-3 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/20 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {pub.imageUrl ? (
                            <img src={pub.imageUrl} alt={pub.title} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0">
                              <Sparkles className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{pub.title}</p>
                            <p className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-orange-500" /> {placeName}
                              {pub.startDate && <span>• 📅 {pub.startDate}</span>}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleShareResource({
                            type: 'publication',
                            title: pub.title,
                            subtitle: `📍 ${placeName} ${pub.startDate ? `• 📅 ${pub.startDate}` : ''}`,
                            imageUrl: pub.imageUrl
                          })}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer flex-shrink-0"
                        >
                          <Send className="w-3 h-3" />
                          <span>Envoyer</span>
                        </button>
                      </div>
                    );
                  })
              ) : (
                establishments
                  .filter(e => e.status === 'valide')
                  .filter(e => {
                    const q = shareSearch.toLowerCase();
                    const loc = `${e.neighborhood || ''} ${e.city || ''}`.toLowerCase();
                    return (e.name || '').toLowerCase().includes(q) || loc.includes(q);
                  })
                  .slice(0, 15)
                  .map(est => {
                    const locStr = `${est.neighborhood ? `${est.neighborhood}, ` : ''}${est.city || 'Ouagadougou'}`;
                    const photo = est.photos && est.photos.length > 0 ? est.photos[0] : undefined;
                    return (
                      <div 
                        key={est.id} 
                        className="p-3 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/20 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {photo ? (
                            <img src={photo} alt={est.name} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold flex-shrink-0">
                              <MapPin className="w-5 h-5" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{est.name}</p>
                            <p className="text-[10px] text-gray-500 truncate flex items-center gap-1">
                              <Tag className="w-3 h-3 text-orange-500" /> {est.category} • 📍 {locStr}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleShareResource({
                            type: 'establishment',
                            title: est.name,
                            subtitle: `Catégorie : ${est.category} • 📍 ${locStr}`,
                            imageUrl: photo
                          })}
                          className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer flex-shrink-0"
                        >
                          <Send className="w-3 h-3" />
                          <span>Envoyer</span>
                        </button>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
