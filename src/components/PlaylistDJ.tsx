import { useState, useEffect, FormEvent } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  setDoc 
} from 'firebase/firestore';
import { useAppStore } from '../store';
import { triggerHapticFeedback } from '../utils/haptics';
import { 
  Music, 
  Disc, 
  ListMusic, 
  ThumbsUp, 
  Plus, 
  History, 
  Check, 
  X, 
  Calendar, 
  Share2 
} from 'lucide-react';

interface PlaylistDJProps {
  establishmentId: string;
}

interface Song {
  title: string;
  artist: string;
  duration: string;
  genre: string;
  coverUrl: string;
  playedAt?: string;
}

interface SongSuggestion {
  id: string;
  establishmentId: string;
  title: string;
  artist: string;
  genre: string;
  suggestedBy: string;
  suggestedByName: string;
  votes: string[]; // User IDs who voted
  status: 'pending' | 'accepted' | 'postponed' | 'refused';
  createdAt: number;
}

const genres = ['Afrobeat', 'Amapiano', 'Coupe Decale', 'Dancehall', 'Hip Hop', 'Salsa', 'Zouk'];

const mockPastPlaylists = [
  {
    id: 'past-1',
    name: 'Afrobeat Special Vendredi',
    date: 'Vendredi dernier',
    songsCount: 14,
    genre: 'Afrobeat & Amapiano',
    cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=400'
  },
  {
    id: 'past-2',
    name: 'Saint-Sylvestre Nouvel An',
    date: '31 Dec 2025',
    songsCount: 32,
    genre: 'Generaliste Club',
    cover: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=400'
  },
  {
    id: 'past-3',
    name: 'Soirée Salsa & Kizomba',
    date: 'Jeudi Retro',
    songsCount: 18,
    genre: 'Latino & Caribéen',
    cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=400'
  }
];

export function PlaylistDJ({ establishmentId }: PlaylistDJProps) {
  const { currentUser, establishments } = useAppStore();
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [suggestions, setSuggestions] = useState<SongSuggestion[]>([]);
  const [activeTab, setActiveTab] = useState<'live' | 'proposals' | 'archives'>('live');
  
  // Suggest song form state
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newGenre, setNewGenre] = useState('Afrobeat');
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);
  
  // DJ Update State
  const [isUpdatingCurrentSong, setIsUpdatingCurrentSong] = useState(false);
  const [djTitle, setDjTitle] = useState('');
  const [djArtist, setDjArtist] = useState('');
  const [djGenre, setDjGenre] = useState('Afrobeat');

  const establishment = establishments.find(e => e.id === establishmentId);
  const isDJOrOwner = currentUser && (
    currentUser.id === establishment?.ownerId || 
    currentUser.role === 'dj'
  );

  // Real-time synchronization
  useEffect(() => {
    // Current song listener
    const estDocRef = doc(db, 'establishments', establishmentId);
    const unsubEst = onSnapshot(estDocRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.currentSong) {
          setCurrentSong(data.currentSong as Song);
        } else {
          // Default mock starter song
          setCurrentSong({
            title: 'No Limit',
            artist: 'Burna Boy',
            duration: '3:24',
            genre: 'Afrobeat',
            coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=200',
            playedAt: 'À l\'instant'
          });
        }
      }
    });

    // Client song suggestions listener
    const suggestionsCol = collection(db, 'song_suggestions');
    const unsubSug = onSnapshot(suggestionsCol, (snapshot) => {
      const list: SongSuggestion[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.establishmentId === establishmentId) {
          list.push({ id: docSnap.id, ...data } as SongSuggestion);
        }
      });
      // Sort suggestions by votes count descending, then pending first
      list.sort((a, b) => b.votes.length - a.votes.length);
      setSuggestions(list);
    });

    return () => {
      unsubEst();
      unsubSug();
    };
  }, [establishmentId]);

  const handleUpdateDjSong = async (e: FormEvent) => {
    e.preventDefault();
    if (!djTitle.trim() || !djArtist.trim()) return;
    triggerHapticFeedback(40);

    const updatedSong: Song = {
      title: djTitle.trim(),
      artist: djArtist.trim(),
      genre: djGenre,
      duration: '3:30',
      coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=200', // Neon club vinyl cover
      playedAt: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    try {
      await updateDoc(doc(db, 'establishments', establishmentId), {
        currentSong: updatedSong
      });
      setIsUpdatingCurrentSong(false);
      setDjTitle('');
      setDjArtist('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleProposeSong = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newTitle.trim() || !newArtist.trim()) return;
    setSubmittingSuggestion(true);
    triggerHapticFeedback([40, 20, 40]);

    const proposal: Omit<SongSuggestion, 'id'> = {
      establishmentId,
      title: newTitle.trim(),
      artist: newArtist.trim(),
      genre: newGenre,
      suggestedBy: currentUser.id,
      suggestedByName: currentUser.name,
      votes: [currentUser.id], // Auto vote for own proposal
      status: 'pending',
      createdAt: Date.now()
    };

    try {
      await addDoc(collection(db, 'song_suggestions'), proposal);
      setNewTitle('');
      setNewArtist('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingSuggestion(false);
    }
  };

  const handleVote = async (id: string, votes: string[]) => {
    if (!currentUser) return;
    triggerHapticFeedback(30);

    let updatedVotes = [...votes];
    if (updatedVotes.includes(currentUser.id)) {
      // Remove vote if already voted
      updatedVotes = updatedVotes.filter(uid => uid !== currentUser.id);
    } else {
      updatedVotes.push(currentUser.id);
    }

    try {
      await updateDoc(doc(db, 'song_suggestions', id), {
        votes: updatedVotes
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (id: string, status: SongSuggestion['status']) => {
    triggerHapticFeedback(25);
    try {
      await updateDoc(doc(db, 'song_suggestions', id), { status });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Selectors */}
      <div className="flex border-b border-gray-100 dark:border-gray-800">
        {[
          { id: 'live', label: 'En Cours 🎵', icon: Disc },
          { id: 'proposals', label: 'Propositions 🔥', icon: ListMusic },
          { id: 'archives', label: 'Playlists DJ 💾', icon: History }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { triggerHapticFeedback(15); setActiveTab(tab.id as any); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-black uppercase border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${activeTab === tab.id ? 'animate-spin-slow' : ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. TAB: LIVE NOW */}
      {activeTab === 'live' && (
        <div className="space-y-4">
          {currentSong ? (
            <div className="p-5 bg-gradient-to-br from-gray-900 to-gray-950 rounded-3xl text-white shadow-xl flex items-center gap-4 relative overflow-hidden border border-gray-800">
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-orange-500/10 to-transparent blur-xl pointer-events-none"></div>
              
              {/* Spinning Disc Cover */}
              <div className="relative w-16 h-16 shrink-0 rounded-full overflow-hidden border-2 border-orange-500/35 shadow-lg shadow-orange-500/20 flex items-center justify-center animate-spin-slow">
                <img src={currentSong.coverUrl} alt="Album cover" className="w-full h-full object-cover" />
                <div className="absolute w-4 h-4 bg-gray-950 rounded-full border border-gray-800"></div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-black uppercase text-orange-400 tracking-widest flex items-center gap-1">
                  <span>🔴 JOUE PAR LE DJ</span>
                  <span>•</span>
                  <span>{currentSong.playedAt || 'En direct'}</span>
                </div>
                <h3 className="text-base font-black truncate">{currentSong.title}</h3>
                <p className="text-xs font-bold text-gray-300 truncate">{currentSong.artist}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 bg-white/10 rounded text-[9px] font-bold text-gray-300">
                  {currentSong.genre}
                </span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-gray-400 italic">
              Aucun morceau en cours de diffusion enregistré.
            </div>
          )}

          {/* DJ Input form inside Live Tab */}
          {isDJOrOwner && (
            <div className="p-4 bg-orange-50/40 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/30 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black text-orange-800 dark:text-orange-400 uppercase tracking-wider">
                  Contrôles Platine DJ
                </h4>
                <button
                  onClick={() => setIsUpdatingCurrentSong(!isUpdatingCurrentSong)}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
                >
                  {isUpdatingCurrentSong ? "Masquer" : "Changer de Morceau"}
                </button>
              </div>

              {isUpdatingCurrentSong && (
                <form onSubmit={handleUpdateDjSong} className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-200">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={djTitle}
                      onChange={e => setDjTitle(e.target.value)}
                      placeholder="Titre de la chanson"
                      className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
                    />
                    <input
                      type="text"
                      value={djArtist}
                      onChange={e => setDjArtist(e.target.value)}
                      placeholder="Artiste"
                      className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={djGenre}
                      onChange={e => setDjGenre(e.target.value)}
                      className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium flex-1 text-gray-900 dark:text-white"
                    >
                      {genres.map(g => (
                        <option key={g} value={g}>{g}</option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="px-4 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase rounded-xl cursor-pointer"
                    >
                      Diffuser
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Guest Propose Song Trigger Form */}
          {!isDJOrOwner && currentUser && (
            <div className="p-5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl space-y-4">
              <div className="space-y-1">
                <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-orange-500" />
                  <span>Proposer une Chanson au DJ 🎧</span>
                </h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium leading-normal">
                  Faites monter l'ambiance ! Suggérez votre morceau favori. Les autres clients voteront pour vous faire passer en premier !
                </p>
              </div>

              <form onSubmit={handleProposeSong} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="Ex: Last Last"
                    className="px-3 py-2.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-900 dark:text-white"
                    required
                  />
                  <input
                    type="text"
                    value={newArtist}
                    onChange={e => setNewArtist(e.target.value)}
                    placeholder="Ex: Burna Boy"
                    className="px-3 py-2.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-900 dark:text-white"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={newGenre}
                    onChange={e => setNewGenre(e.target.value)}
                    className="px-3 py-2.5 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium flex-1 focus:outline-none focus:ring-1 focus:ring-orange-500 text-gray-900 dark:text-white"
                  >
                    {genres.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={submittingSuggestion}
                    className="px-5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-black uppercase rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    Suggérer
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* 2. TAB: CLIENT PROPOSALS (Realtime Voting Queue) */}
      {activeTab === 'proposals' && (
        <div className="space-y-3">
          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">
            File d'attente des demandes clients ({suggestions.filter(s => s.status === 'pending').length} en attente)
          </div>

          {suggestions.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {suggestions.map((sug) => {
                const hasVoted = currentUser && sug.votes.includes(currentUser.id);
                return (
                  <div
                    key={sug.id}
                    className={`p-3.5 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl flex items-center justify-between gap-3 ${
                      sug.status === 'accepted' ? 'border-l-4 border-l-green-500' :
                      sug.status === 'postponed' ? 'border-l-4 border-l-amber-500' :
                      sug.status === 'refused' ? 'opacity-50 bg-gray-50' : ''
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-gray-900 dark:text-white text-sm truncate">{sug.title}</span>
                        <span className="text-[9px] font-bold text-gray-400">({sug.genre})</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-bold truncate">De {sug.artist}</p>
                      <span className="text-[9px] text-orange-600 dark:text-orange-400 font-bold block mt-0.5">
                        Suggéré par {sug.suggestedByName}
                      </span>
                    </div>

                    {/* Voting / DJ Action Controls */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isDJOrOwner ? (
                        <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 p-1 rounded-xl">
                          <button
                            onClick={() => handleUpdateStatus(sug.id, 'accepted')}
                            className="p-1 text-green-600 hover:bg-green-50 rounded-lg cursor-pointer"
                            title="Accepter"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(sug.id, 'postponed')}
                            className="p-1 text-amber-600 hover:bg-amber-50 rounded-lg cursor-pointer"
                            title="Reporter"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(sug.id, 'refused')}
                            className="p-1 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                            title="Refuser"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        currentUser && (
                          <button
                            onClick={() => handleVote(sug.id, sug.votes)}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-xs font-black ${
                              hasVoted
                                ? 'bg-orange-600 text-white border-orange-500 shadow-sm'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <ThumbsUp className="w-3.5 h-3.5" />
                            <span>{sug.votes.length}</span>
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-gray-400 italic">
              Aucune proposition de chanson pour le moment. Soyez le premier !
            </div>
          )}
        </div>
      )}

      {/* 3. TAB: ARCHIVES */}
      {activeTab === 'archives' && (
        <div className="space-y-3">
          <div className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5 block">
            Archives des Playlists & Mixes passés
          </div>

          <div className="grid grid-cols-1 gap-2.5 max-h-80 overflow-y-auto">
            {mockPastPlaylists.map((playlist) => (
              <div
                key={playlist.id}
                className="p-3 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center gap-3.5"
              >
                <img src={playlist.cover} alt="Playlist Cover" className="w-12 h-12 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-black text-gray-900 dark:text-white truncate">{playlist.name}</h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold">{playlist.genre} • {playlist.songsCount} titres</p>
                  <span className="text-[9px] text-orange-600 dark:text-orange-400 font-bold">{playlist.date}</span>
                </div>
                <button
                  onClick={() => { triggerHapticFeedback(20); alert("Lecture du mix ou téléchargement de la playlist archivée !"); }}
                  className="p-2 bg-white dark:bg-gray-800 hover:bg-gray-100 rounded-full cursor-pointer shadow-sm border border-gray-150 dark:border-gray-700"
                >
                  <Music className="w-4 h-4 text-orange-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
