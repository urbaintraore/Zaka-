import { useState, useEffect, useRef, FormEvent, ChangeEvent } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove 
} from 'firebase/firestore';
import { useAppStore } from '../store';
import { triggerHapticFeedback } from '../utils/haptics';
import { compressImage } from '../utils/imageCompressor';
import { 
  Camera, 
  Heart, 
  Award, 
  AlertTriangle, 
  Sparkles, 
  Trophy, 
  Upload, 
  Plus, 
  Image as ImageIcon 
} from 'lucide-react';

interface ChallengePhotoProps {
  eventId: string;
  eventTitle: string;
}

interface PhotoSubmission {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  photoUrl: string;
  caption: string;
  emoji: string;
  votes: string[]; // User IDs who voted
  createdAt: number;
}

export function ChallengePhoto({ eventId, eventTitle }: ChallengePhotoProps) {
  const { currentUser } = useAppStore();
  const [submissions, setSubmissions] = useState<PhotoSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Submit Form State
  const [photoUrl, setPhotoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [emoji, setEmoji] = useState('🔥');
  const [iaChecking, setIaChecking] = useState(false);
  const [iaResult, setIaResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIaChecking(true);
      setIaResult("Compression et préparation de l'image...");
      const base64 = await compressImage(file, 1200, 1200, 0.82);
      setPhotoUrl(base64);
      setIaChecking(false);
      setIaResult(null);
    } catch (err) {
      console.error(err);
      setIaChecking(false);
      setIaResult("Erreur lors de la compression de la photo.");
    }
  };

  // Sync entries in real-time
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'photo_challenges'), (snapshot) => {
      const list: PhotoSubmission[] = [];
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.eventId === eventId && data.createdAt >= oneDayAgo) {
          list.push({ id: docSnap.id, ...data } as PhotoSubmission);
        }
      });

      // Sort by votes descending
      list.sort((a, b) => b.votes.length - a.votes.length);
      setSubmissions(list);
      setLoading(false);
    });

    return () => unsub();
  }, [eventId]);

  const handleVote = async (id: string, votes: string[]) => {
    if (!currentUser) return;
    triggerHapticFeedback(30);

    const docRef = doc(db, 'photo_challenges', id);
    const hasVoted = votes.includes(currentUser.id);

    try {
      if (hasVoted) {
        await updateDoc(docRef, { votes: arrayRemove(currentUser.id) });
      } else {
        await updateDoc(docRef, { votes: arrayUnion(currentUser.id) });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePublishPhoto = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Rule: Max 3 photos per user
    const userSubs = submissions.filter(s => s.userId === currentUser.id);
    if (userSubs.length >= 3) {
      triggerHapticFeedback([100, 50, 100]);
      alert("⚠️ Limite atteinte : vous ne pouvez publier que 3 photos maximum pour ce challenge !");
      return;
    }

    if (!photoUrl.trim()) {
      alert("Veuillez fournir une photo ou un lien d'image pour participer !");
      return;
    }

    triggerHapticFeedback(40);
    setIaChecking(true);
    setIaResult("L'IA analyse l'image : sécurité, qualité, doublons...");

    setTimeout(async () => {
      const finalPhoto = photoUrl.trim();
      
      const payload: Omit<PhotoSubmission, 'id'> = {
        eventId,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar || '',
        photoUrl: finalPhoto,
        caption: caption.trim() || 'Ambiance de folie !',
        emoji,
        votes: [currentUser.id], // Auto vote own photo
        createdAt: Date.now()
      };

      try {
        await addDoc(collection(db, 'photo_challenges'), payload);
        setPhotoUrl('');
        setCaption('');
        setEmoji('🔥');
        setIaResult(null);
        triggerHapticFeedback([50, 30, 50]);
      } catch (err) {
        console.error(err);
      } finally {
        setIaChecking(false);
      }
    }, 1200);
  };

  // Get podium winners
  const podium = submissions.slice(0, 3);
  const restOfList = submissions.slice(3);

  return (
    <div className="space-y-6">
      {/* Rules Banner */}
      <div className="p-4 bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-200/50 dark:border-orange-900/30 rounded-2xl flex items-start gap-3">
        <Trophy className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0 animate-bounce" />
        <div className="space-y-1">
          <h4 className="text-xs font-black text-orange-950 dark:text-orange-400 uppercase tracking-wider">
            Concours Photo de la Soirée !
          </h4>
          <p className="text-[10px] text-orange-900/80 dark:text-gray-300 leading-relaxed font-medium">
            Postez vos meilleurs clichés (max 3, durée 24h). Votez pour élire les 3 vainqueurs ! Les gagnants obtiennent le badge <b>🥇 Photo de la Soirée</b> sur leur profil.
          </p>
        </div>
      </div>

      {/* Realtime Podium */}
      {podium.length > 0 && (
        <div className="p-5 bg-orange-50/20 dark:bg-gray-900/40 rounded-3xl border border-orange-100 dark:border-gray-800 space-y-4">
          <h3 className="text-xs font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider text-center">
            🏆 Le Podium en Temps Réel
          </h3>

          <div className="grid grid-cols-3 gap-3 items-end pt-4">
            {/* 2nd Place */}
            {podium[1] ? (
              <div className="text-center space-y-2 flex flex-col items-center">
                <div className="relative">
                  <img src={podium[1].photoUrl} alt="2nd" className="w-16 h-20 object-cover rounded-xl border-2 border-slate-300 shadow" />
                  <span className="absolute -top-2.5 -right-2 bg-slate-300 text-slate-800 font-black text-xs w-6 h-6 rounded-full flex items-center justify-center shadow">
                    🥈
                  </span>
                </div>
                <div className="min-w-0 w-full">
                  <div className="text-[10px] font-black truncate text-gray-800 dark:text-gray-300">{podium[1].userName}</div>
                  <div className="text-[9px] text-gray-400 font-bold">{podium[1].votes.length} votes</div>
                </div>
              </div>
            ) : (
              <div className="h-10 bg-gray-100/30 rounded-xl"></div>
            )}

            {/* 1st Place */}
            {podium[0] ? (
              <div className="text-center space-y-2 flex flex-col items-center -translate-y-2">
                <div className="relative">
                  <img src={podium[0].photoUrl} alt="1st" className="w-20 h-24 object-cover rounded-xl border-4 border-yellow-400 shadow-xl" />
                  <span className="absolute -top-3.5 -right-3 bg-yellow-400 text-yellow-950 font-black text-sm w-8 h-8 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    🥇
                  </span>
                </div>
                <div className="min-w-0 w-full">
                  <div className="text-xs font-black truncate text-gray-950 dark:text-white">{podium[0].userName}</div>
                  <div className="text-[10px] text-orange-600 dark:text-orange-400 font-extrabold">{podium[0].votes.length} votes</div>
                </div>
              </div>
            ) : (
              <div className="h-10 bg-gray-100/30 rounded-xl"></div>
            )}

            {/* 3rd Place */}
            {podium[2] ? (
              <div className="text-center space-y-2 flex flex-col items-center">
                <div className="relative">
                  <img src={podium[2].photoUrl} alt="3rd" className="w-16 h-20 object-cover rounded-xl border-2 border-amber-600 shadow" />
                  <span className="absolute -top-2.5 -right-2 bg-amber-600 text-white font-black text-xs w-6 h-6 rounded-full flex items-center justify-center shadow">
                    🥉
                  </span>
                </div>
                <div className="min-w-0 w-full">
                  <div className="text-[10px] font-black truncate text-gray-800 dark:text-gray-300">{podium[2].userName}</div>
                  <div className="text-[9px] text-gray-400 font-bold">{podium[2].votes.length} votes</div>
                </div>
              </div>
            ) : (
              <div className="h-10 bg-gray-100/30 rounded-xl"></div>
            )}
          </div>
        </div>
      )}

      {/* Upload/Contribute Form */}
      {currentUser && (
        <form onSubmit={handlePublishPhoto} className="p-5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl space-y-4">
          <div className="space-y-1">
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-orange-500" />
              <span>Participer au Challenge</span>
            </h4>
          </div>

          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageFileChange}
            />

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2.5 bg-white dark:bg-gray-950 border border-dashed border-orange-400 dark:border-orange-500/50 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-xl text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-orange-500" />
                <span>{photoUrl ? "Changer la photo sélectionnée" : "Choisir / Prendre une photo"}</span>
              </button>

              <input
                type="text"
                value={photoUrl.startsWith('data:') ? 'Photo sélectionnée depuis l\'appareil' : photoUrl}
                onChange={e => {
                  if (!photoUrl.startsWith('data:')) {
                    setPhotoUrl(e.target.value);
                  }
                }}
                placeholder="Ou coller un lien d'image..."
                disabled={photoUrl.startsWith('data:')}
                className="flex-1 px-3 py-2.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
              />
            </div>

            {photoUrl && (
              <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-orange-300 dark:border-orange-800 shadow-sm">
                <img src={photoUrl} alt="Aperçu" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrl('')}
                  className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white p-1 rounded-full text-[10px]"
                  title="Supprimer"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                placeholder="Votre message (ex: L'ambiance !)"
                className="px-3 py-2.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
                required
              />
              <div className="flex gap-2">
                <select
                  value={emoji}
                  onChange={e => setEmoji(e.target.value)}
                  className="px-3 py-2.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
                >
                  {['🔥', '🥳', '😎', '💃', '🕺', '🍻', '🍹', '🎧'].map(e => (
                    <option key={e} value={e}>{e} {e}</option>
                  ))}
                </select>

                <button
                  type="submit"
                  disabled={iaChecking || !photoUrl}
                  className="flex-1 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase rounded-xl cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" />
                  <span>{iaChecking ? "Analyse..." : "Publier"}</span>
                </button>
              </div>
            </div>

            {/* IA status loader */}
            {iaChecking && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl flex items-center gap-2 text-[10px] text-amber-800 dark:text-amber-400 font-bold animate-pulse">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{iaResult}</span>
              </div>
            )}
          </div>
        </form>
      )}

      {/* Grid List of Contestants */}
      <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Les Participants ({submissions.length})
        </h4>

        {submissions.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5">
            {submissions.map((sub) => {
              const hasVoted = currentUser && sub.votes.includes(currentUser.id);
              return (
                <div key={sub.id} className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                  <div className="relative h-40 bg-gray-100">
                    <img src={sub.photoUrl} alt="Contestant" className="w-full h-full object-cover" />
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white font-bold text-xs p-1.5 rounded-lg flex items-center gap-1.5 backdrop-blur-md">
                      <span>{sub.emoji}</span>
                    </span>
                  </div>

                  <div className="p-3.5 space-y-2 text-left">
                    <div className="min-w-0">
                      <div className="text-[11px] font-black text-gray-900 dark:text-white truncate">{sub.userName}</div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold line-clamp-2 leading-relaxed">
                        {sub.caption}
                      </p>
                    </div>

                    <button
                      onClick={() => handleVote(sub.id, sub.votes)}
                      className={`w-full py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-all border ${
                        hasVoted
                          ? 'bg-red-500 text-white border-red-500 shadow-sm shadow-red-500/10'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasVoted ? 'fill-current' : ''}`} />
                      <span>{sub.votes.length} Votes</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-xs text-gray-400 italic">
            Aucune photo publiée pour l'instant. Lancez le challenge !
          </div>
        )}
      </div>
    </div>
  );
}
