import { useState, useEffect, FormEvent } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { useAppStore } from '../store';
import { triggerHapticFeedback } from '../utils/haptics';
import { 
  MessageSquare, 
  Heart, 
  Trash2, 
  Pin, 
  EyeOff, 
  Send, 
  Plus, 
  Check, 
  Vote, 
  Smile 
} from 'lucide-react';

interface EventSocialMurProps {
  eventId: string;
  isOwnerOrDJ: boolean;
}

interface SocialPost {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  imageUrl?: string;
  isPinned?: boolean;
  isHidden?: boolean;
  likes: string[]; // List of user IDs
  poll?: {
    question: string;
    options: { text: string; votes: string[] }[]; // Option string and list of user IDs who voted
  };
  comments: {
    id: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: number;
  }[];
  createdAt: number;
}

export function EventSocialMur({ eventId, isOwnerOrDJ }: EventSocialMurProps) {
  const { currentUser } = useAppStore();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  // New Post Form State
  const [textInput, setTextInput] = useState('');
  const [imageInput, setImageInput] = useState('');
  const [showPollForm, setShowPollForm] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOpt1, setPollOpt1] = useState('');
  const [pollOpt2, setPollOpt2] = useState('');

  // Active commenting post state
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');

  // Listen to the Social Wall posts for this event
  useEffect(() => {
    let active = true;
    let channel: any = null;

    const loadAndSubscribe = async () => {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('event_social_posts')
            .select('*')
            .eq('eventId', eventId);
          
          if (!error && data && active) {
            const list = (data as any[]).map(item => ({
              id: item.id,
              eventId: item.eventId,
              userId: item.userId,
              userName: item.userName,
              userAvatar: item.userAvatar || '',
              text: item.text,
              imageUrl: item.imageUrl || undefined,
              isPinned: item.isPinned || false,
              isHidden: item.isHidden || false,
              likes: Array.isArray(item.likes) ? item.likes : [],
              poll: item.poll || undefined,
              comments: Array.isArray(item.comments) ? item.comments : [],
              createdAt: new Date(item.createdAt).getTime()
            }));

            // Sort: Pinned posts first, then newest first
            list.sort((a, b) => {
              if (a.isPinned && !b.isPinned) return -1;
              if (!a.isPinned && b.isPinned) return 1;
              return b.createdAt - a.createdAt;
            });

            setPosts(list);
            setLoading(false);
          }

          // Subscribe with unique channel name to prevent "after subscribe" errors
          const uniqueSocialChannel = `event_social_posts:${eventId}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
          channel = supabase
            .channel(uniqueSocialChannel)
            .on(
              'postgres_changes',
              { event: '*', schema: 'public', table: 'event_social_posts', filter: `eventId=eq.${eventId}` },
              () => {
                supabase
                  .from('event_social_posts')
                  .select('*')
                  .eq('eventId', eventId)
                  .then(({ data: freshData }) => {
                    if (freshData && active) {
                      const list = (freshData as any[]).map(item => ({
                        id: item.id,
                        eventId: item.eventId,
                        userId: item.userId,
                        userName: item.userName,
                        userAvatar: item.userAvatar || '',
                        text: item.text,
                        imageUrl: item.imageUrl || undefined,
                        isPinned: item.isPinned || false,
                        isHidden: item.isHidden || false,
                        likes: Array.isArray(item.likes) ? item.likes : [],
                        poll: item.poll || undefined,
                        comments: Array.isArray(item.comments) ? item.comments : [],
                        createdAt: new Date(item.createdAt).getTime()
                      }));

                      list.sort((a, b) => {
                        if (a.isPinned && !b.isPinned) return -1;
                        if (!a.isPinned && b.isPinned) return 1;
                        return b.createdAt - a.createdAt;
                      });

                      setPosts(list);
                    }
                  });
              }
            )
            .subscribe();
        } catch (e) {
          console.error(e);
        }
      }
    };

    loadAndSubscribe();

    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, [eventId]);

  const handleCreatePost = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || (!textInput.trim() && !imageInput.trim() && !pollQuestion.trim())) return;
    triggerHapticFeedback([40, 20, 40]);

    const payload: any = {
      eventId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar || '',
      text: textInput.trim(),
      likes: [],
      comments: [],
      createdAt: new Date().toISOString()
    };

    if (imageInput.trim()) {
      payload.imageUrl = imageInput.trim();
    }

    if (showPollForm && pollQuestion.trim() && pollOpt1.trim() && pollOpt2.trim()) {
      payload.poll = {
        question: pollQuestion.trim(),
        options: [
          { text: pollOpt1.trim(), votes: [] },
          { text: pollOpt2.trim(), votes: [] }
        ]
      };
    }

    try {
      if (isSupabaseConfigured) {
        await supabase.from('event_social_posts').insert(payload);
      }
      setTextInput('');
      setImageInput('');
      setPollQuestion('');
      setPollOpt1('');
      setPollOpt2('');
      setShowPollForm(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLike = async (id: string, likes: string[]) => {
    if (!currentUser) return;
    triggerHapticFeedback(20);

    const hasLiked = likes.includes(currentUser.id);
    const updatedLikes = hasLiked
      ? likes.filter(uid => uid !== currentUser.id)
      : [...likes, currentUser.id];

    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('event_social_posts')
          .update({ likes: updatedLikes })
          .eq('id', id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVotePoll = async (postId: string, optionIdx: number, poll: SocialPost['poll']) => {
    if (!currentUser || !poll) return;
    triggerHapticFeedback(25);

    const updatedOptions = poll.options.map((opt, idx) => {
      let votes = opt.votes.filter(uid => uid !== currentUser.id);
      if (idx === optionIdx) {
        votes.push(currentUser.id);
      }
      return { ...opt, votes };
    });

    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('event_social_posts')
          .update({ poll: { ...poll, options: updatedOptions } })
          .eq('id', postId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: FormEvent, postId: string) => {
    e.preventDefault();
    if (!currentUser || !commentInput.trim()) return;
    triggerHapticFeedback(15);

    const commentPayload = {
      id: `${currentUser.id}-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      text: commentInput.trim(),
      createdAt: Date.now()
    };

    const targetPost = posts.find(p => p.id === postId);
    const currentComments = targetPost?.comments || [];
    const updatedComments = [...currentComments, commentPayload];

    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('event_social_posts')
          .update({ comments: updatedComments })
          .eq('id', postId);
      }
      setCommentInput('');
      setActiveCommentPostId(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Moderation Handlers
  const handleTogglePin = async (id: string, isPinned: boolean) => {
    triggerHapticFeedback(30);
    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('event_social_posts')
          .update({ isPinned: !isPinned })
          .eq('id', id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleHide = async (id: string, isHidden: boolean) => {
    triggerHapticFeedback(30);
    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('event_social_posts')
          .update({ isHidden: !isHidden })
          .eq('id', id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm("Voulez-vous supprimer ce message ?")) return;
    triggerHapticFeedback(40);
    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('event_social_posts')
          .delete()
          .eq('id', id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Create New Post Form */}
      {currentUser && (
        <form onSubmit={handleCreatePost} className="p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl space-y-3 text-left">
          <textarea
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            placeholder="Partagez un souvenir, posez une question..."
            className="w-full bg-white dark:bg-gray-950 text-xs font-semibold p-3 rounded-2xl border border-gray-150 dark:border-gray-800 focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-900 dark:text-white"
            rows={2}
          />

          {showPollForm && (
            <div className="p-3 bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl space-y-2.5 animate-in fade-in slide-in-from-top-3 duration-150">
              <input
                type="text"
                value={pollQuestion}
                onChange={e => setPollQuestion(e.target.value)}
                placeholder="Question du sondage (Ex: On boit quoi ce soir ?)"
                className="w-full bg-gray-50 dark:bg-gray-900 px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                required={showPollForm}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={pollOpt1}
                  onChange={e => setPollOpt1(e.target.value)}
                  placeholder="Option 1"
                  className="bg-gray-50 dark:bg-gray-900 px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
                  required={showPollForm}
                />
                <input
                  type="text"
                  value={pollOpt2}
                  onChange={e => setPollOpt2(e.target.value)}
                  placeholder="Option 2"
                  className="bg-gray-50 dark:bg-gray-900 px-3 py-2 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
                  required={showPollForm}
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-150 dark:border-gray-800/80 pt-2.5">
            <div className="flex gap-1">
              <input
                type="text"
                value={imageInput}
                onChange={e => setImageInput(e.target.value)}
                placeholder="URL d'image (optionnel)"
                className="px-2.5 py-1 bg-white dark:bg-gray-950 text-[10px] font-bold border border-gray-200 dark:border-gray-800 rounded-lg max-w-[150px] text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={() => { triggerHapticFeedback(15); setShowPollForm(!showPollForm); }}
                className={`px-3 py-1 text-[10px] font-black rounded-lg transition-colors border cursor-pointer ${
                  showPollForm 
                    ? 'bg-orange-600 text-white border-orange-500' 
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-200 dark:border-gray-700'
                }`}
              >
                📊 Sondage
              </button>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-black uppercase rounded-xl cursor-pointer"
            >
              Publier
            </button>
          </div>
        </form>
      )}

      {/* Social Feed List */}
      <div className="space-y-4 max-h-[450px] overflow-y-auto">
        {posts.length > 0 ? (
          posts.map((post) => {
            // Hide post if set to hidden and user is not owner
            if (post.isHidden && !isOwnerOrDJ) return null;

            const hasLiked = currentUser && post.likes.includes(currentUser.id);
            const isMyPost = currentUser && post.userId === currentUser.id;

            return (
              <div 
                key={post.id} 
                className={`p-4 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-3xl space-y-3 text-left relative transition-all ${
                  post.isPinned ? 'border-2 border-orange-400 bg-orange-50/5' : ''
                } ${post.isHidden ? 'opacity-60 bg-gray-100/30' : ''}`}
              >
                {/* Pinned / Hidden Header badges */}
                <div className="flex gap-1.5 absolute top-3.5 right-4">
                  {post.isPinned && (
                    <span className="bg-orange-100 text-orange-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <Pin className="w-2.5 h-2.5 fill-current" />
                      Épinglé
                    </span>
                  )}
                  {post.isHidden && (
                    <span className="bg-gray-200 text-gray-700 text-[8px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <EyeOff className="w-2.5 h-2.5" />
                      Masqué
                    </span>
                  )}
                </div>

                {/* Author Info */}
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-900/60 flex items-center justify-center font-black text-xs text-orange-600">
                    {post.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-gray-900 dark:text-white leading-tight">{post.userName}</h5>
                    <span className="text-[9px] text-gray-400 font-bold block mt-0.5">
                      {new Date(post.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Text & Image body */}
                {post.text && (
                  <p className="text-xs text-gray-700 dark:text-gray-200 font-bold leading-relaxed">
                    {post.text}
                  </p>
                )}

                {post.imageUrl && (
                  <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800/80 max-h-56 bg-gray-50 mt-1">
                    <img src={post.imageUrl} alt="Social post" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Poll / Sondage Display */}
                {post.poll && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-950/40 rounded-2xl border border-gray-150 dark:border-gray-800 space-y-2">
                    <div className="text-[10px] font-black uppercase text-orange-600 tracking-wider flex items-center gap-1">
                      <Vote className="w-3.5 h-3.5" />
                      <span>Sondage : {post.poll.question}</span>
                    </div>

                    <div className="space-y-2">
                      {post.poll.options.map((opt, optIdx) => {
                        const totalVotes = post.poll ? post.poll.options.reduce((acc, o) => acc + o.votes.length, 0) : 0;
                        const percentage = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
                        const userVotedThis = currentUser && opt.votes.includes(currentUser.id);

                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleVotePoll(post.id, optIdx, post.poll)}
                            className="w-full text-left relative overflow-hidden p-2.5 px-3 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between text-xs font-bold transition-all hover:bg-gray-100 dark:hover:bg-gray-900 cursor-pointer"
                          >
                            {/* Vote background filling */}
                            <div 
                              className="absolute top-0 bottom-0 left-0 bg-orange-500/10 dark:bg-orange-500/5 transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                            
                            <span className="relative z-10 flex items-center gap-1.5">
                              {userVotedThis && <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                              <span>{opt.text}</span>
                            </span>
                            <span className="relative z-10 font-black text-[10px] text-gray-500">
                              {percentage}% ({opt.votes.length} votes)
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Footer Likes and Comments Counter */}
                <div className="flex items-center gap-4 pt-1.5 border-t border-gray-100 dark:border-gray-800/60 mt-1">
                  <button
                    onClick={() => handleLike(post.id, post.likes)}
                    className={`flex items-center gap-1 text-[11px] font-black uppercase cursor-pointer ${
                      hasLiked ? 'text-red-500' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                    <span>{post.likes.length} J'aime</span>
                  </button>

                  <button
                    onClick={() => {
                      triggerHapticFeedback(15);
                      setActiveCommentPostId(activeCommentPostId === post.id ? null : post.id);
                    }}
                    className="flex items-center gap-1 text-[11px] font-black uppercase text-gray-500 hover:text-gray-700 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.comments.length} Commentaires</span>
                  </button>

                  {/* Moderation Controls for Owner / DJ or My own post deletion */}
                  <div className="ml-auto flex items-center gap-1.5">
                    {isOwnerOrDJ && (
                      <>
                        <button
                          onClick={() => handleTogglePin(post.id, !!post.isPinned)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            post.isPinned ? 'bg-orange-100 border-orange-200 text-orange-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 text-gray-500'
                          }`}
                          title="Épingler"
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleHide(post.id, !!post.isHidden)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            post.isHidden ? 'bg-gray-200 border-gray-300 text-gray-700' : 'bg-gray-50 dark:bg-gray-800 border-gray-200 text-gray-500'
                          }`}
                          title="Masquer"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}

                    {(isOwnerOrDJ || isMyPost) && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg border border-red-100 cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Commenting list and input */}
                {activeCommentPostId === post.id && (
                  <div className="space-y-3.5 p-3.5 bg-gray-50 dark:bg-gray-950/40 rounded-2xl border border-gray-150 dark:border-gray-800 animate-in fade-in slide-in-from-top-4 duration-200">
                    {post.comments.length > 0 && (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {post.comments.map((cmt) => (
                          <div key={cmt.id} className="text-xs">
                            <span className="font-black text-gray-900 dark:text-white mr-1">{cmt.userName}:</span>
                            <span className="text-gray-600 dark:text-gray-300 font-medium">{cmt.text}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <form onSubmit={(e) => handleAddComment(e, post.id)} className="flex gap-2">
                      <input
                        type="text"
                        value={commentInput}
                        onChange={e => setCommentInput(e.target.value)}
                        placeholder="Votre commentaire..."
                        className="flex-1 px-3.5 py-2 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-900 dark:text-white"
                        required
                      />
                      <button
                        type="submit"
                        className="px-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl flex items-center justify-center cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-xs text-gray-400 italic">
            Aucun message sur le mur de cet événement. Soyez le premier à poster !
          </div>
        )}
      </div>
    </div>
  );
}
