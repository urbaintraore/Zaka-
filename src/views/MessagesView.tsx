import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { db } from './../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, setDoc, doc, orderBy, limit, serverTimestamp, writeBatch } from 'firebase/firestore';
import { MessageSquare, Send, Paperclip, ChevronLeft, Calendar, FileText, Download, Loader2, X, AlertCircle } from 'lucide-react';
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
  const { currentUser, establishments, relationshipRequests, users } = useAppStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ base64: string; name: string; type: string } | null>(null);
  const [loadingConvs, setLoadingConvs] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const myEsts = establishments.filter(e => e.ownerId === currentUser?.id);
  const myEstIds = myEsts.map(e => e.id);
  const isGerant = currentUser?.role === 'gerant';
  const isDJChatActive = activeConv && (activeConv as any).recipientType === 'dj';

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
      // Create new temporary/actual conversation document
      const startNewConversation = async () => {
        try {
          const activeDJReq = relationshipRequests.find(r => r.establishmentId === targetEst.id && r.status === 'acceptee' && r.isDJ);
          const djId = activeDJReq ? (activeDJReq.type === 'client_join' ? activeDJReq.initiatorId : activeDJReq.targetId) : null;

          const convId = isDJChat 
            ? `${currentUser.id}_${preselectedEstablishmentId}_dj`
            : `${currentUser.id}_${preselectedEstablishmentId}`;

          const newConv = {
            clientId: currentUser.id,
            clientName: currentUser.name || currentUser.email || 'Client',
            establishmentId: targetEst.id,
            establishmentName: targetEst.name,
            ownerId: targetEst.ownerId,
            recipientType: preselectedRecipientType || 'gerant',
            ...(djId ? { djId } : {}),
            lastMessage: 'Discussion démarrée',
            lastMessageAt: new Date().toISOString(),
            lastSenderId: currentUser.id,
            unreadByClient: false,
            unreadByGerant: !isDJChat,
            unreadByDj: isDJChat
          };

          await setDoc(doc(db, 'conversations', convId), newConv);
          
          setActiveConv({ id: convId, ...newConv } as any);
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

    let convQuery;
    if (isGerant) {
      // Manager sees conversations for any of their establishments directly by ownerId
      convQuery = query(
        collection(db, 'conversations'),
        where('ownerId', '==', currentUser.id)
      );
    } else {
      // Client sees their own conversations
      convQuery = query(
        collection(db, 'conversations'),
        where('clientId', '==', currentUser.id)
      );
    }

    const djQuery = query(
      collection(db, 'conversations'),
      where('djId', '==', currentUser.id),
      where('recipientType', '==', 'dj')
    );

    let mainConvs: Conversation[] = [];
    let djConvs: Conversation[] = [];

    const updateCombined = () => {
      // For manager, filter out DJ chats in memory
      let filteredMain = isGerant 
        ? mainConvs.filter(c => (c as any).recipientType !== 'dj')
        : mainConvs;

      // Merge and sort
      const combined = [...filteredMain, ...djConvs];
      
      // Remove duplicates by ID just in case
      const uniqueConvsMap = new Map<string, Conversation>();
      combined.forEach(c => uniqueConvsMap.set(c.id, c));
      const list = Array.from(uniqueConvsMap.values());

      list.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
      setConversations(list);
      setLoadingConvs(false);

      if (activeConv) {
        const fresh = list.find(c => c.id === activeConv.id);
        if (fresh) {
          setActiveConv(fresh);
        }
      }
    };

    const unsubscribeMain = onSnapshot(convQuery, (snapshot) => {
      mainConvs = [];
      snapshot.forEach((d) => {
        mainConvs.push({ id: d.id, ...d.data() } as Conversation);
      });
      updateCombined();
    }, (err) => {
      console.error("Erreur main conversations:", err);
      setLoadingConvs(false);
    });

    const unsubscribeDJ = onSnapshot(djQuery, (snapshot) => {
      djConvs = [];
      snapshot.forEach((d) => {
        djConvs.push({ id: d.id, ...d.data() } as Conversation);
      });
      updateCombined();
    }, (err) => {
      console.error("Erreur DJ conversations:", err);
    });

    return () => {
      unsubscribeMain();
      unsubscribeDJ();
    };
  }, [currentUser, isGerant, activeConv?.id]);

  // Load messages for the active conversation
  useEffect(() => {
    if (!activeConv) {
      setMessages([]);
      return;
    }

    const msgQuery = query(
      collection(db, 'conversations', activeConv.id, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(msgQuery, (snapshot) => {
      const list: Message[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Message);
      });
      setMessages(list);

      // Mark messages as read
      const isDJOfActive = activeConv.djId === currentUser?.id && (activeConv as any).recipientType === 'dj';
      if (isDJOfActive && (activeConv as any).unreadByDj) {
        updateDoc(doc(db, 'conversations', activeConv.id), { unreadByDj: false });
      } else if (isGerant && activeConv.unreadByGerant) {
        updateDoc(doc(db, 'conversations', activeConv.id), { unreadByGerant: false });
      } else if (!isGerant && !isDJOfActive && activeConv.unreadByClient) {
        updateDoc(doc(db, 'conversations', activeConv.id), { unreadByClient: false });
      }
    }, (err) => {
      console.error("Erreur chargement des messages:", err);
    });

    return () => unsubscribe();
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
      const msgData: Omit<Message, 'id'> = {
        senderId: currentUser.id,
        text: textToSend,
        createdAt: new Date().toISOString(), // Use ISO string or server timestamp
        ...(fileToSend ? {
          fileUrl: fileToSend.base64,
          fileName: fileToSend.name,
          fileType: fileToSend.type
        } : {})
      };

      // Add to messages subcollection
      await addDoc(collection(db, 'conversations', activeConv.id, 'messages'), msgData);

      // Update conversation summary
      const isDJOfActive = activeConv.djId === currentUser?.id && (activeConv as any).recipientType === 'dj';
      const updateData: Partial<Conversation> = {
        lastMessage: fileToSend ? `📎 ${fileToSend.name}` : textToSend,
        lastMessageAt: new Date().toISOString(),
        lastSenderId: currentUser.id,
        unreadByClient: isGerant || isDJOfActive, // Unread for client if manager or DJ sent it
        unreadByGerant: !isGerant && !isDJOfActive && (activeConv as any).recipientType !== 'dj', // Unread for manager if client sent it and it's not a DJ chat
        unreadByDj: !isDJOfActive && (activeConv as any).recipientType === 'dj' // Unread for DJ if client sent it
      };

      await updateDoc(doc(db, 'conversations', activeConv.id), updateData);
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
          {isGerant && (
            <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-2.5 py-1 rounded-full uppercase">
              Espace Gérant
            </span>
          )}
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
                  : "Allez sur Explorer pour contacter vos établissements favoris !"}
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isDJOfConv = conv.djId === currentUser?.id && (conv as any).recipientType === 'dj';
              const isUnread = isDJOfConv
                ? (conv as any).unreadByDj
                : isGerant
                ? conv.unreadByGerant
                : conv.unreadByClient;

              let titleName = isGerant ? conv.clientName : conv.establishmentName;
              if (isDJOfConv) {
                titleName = conv.clientName;
              }

              const isDJChat = (conv as any).recipientType === 'dj';
              const subName = isDJOfConv 
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
                    isDJChat 
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
                    <p className={cn("text-xs text-gray-500 truncate", isUnread && "text-orange-600 font-bold")}>
                      {conv.lastMessage}
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
                const activeTitleName = isDJOfActive
                  ? activeConv.clientName
                  : isGerant
                  ? activeConv.clientName
                  : activeConv.establishmentName;

                const activeSubName = isDJOfActive
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
                      isDJChat ? "bg-purple-600" : "bg-orange-600"
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

                      {/* Timestamp */}
                      <span className={cn(
                        "text-[9px] block text-right mt-1 opacity-70 font-bold",
                        isMe ? "text-orange-100" : "text-gray-400"
                      )}>
                        {getFormatTime(msg.createdAt)}
                      </span>
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
    </div>
  );
}
