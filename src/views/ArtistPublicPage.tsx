import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic,
  MapPin,
  CheckCircle2,
  Users,
  Calendar,
  Share2,
  MessageCircle,
  MessageSquare,
  Sparkles,
  Heart,
  Music,
  Video,
  Image as ImageIcon,
  Building2,
  ArrowLeft,
  Briefcase
} from 'lucide-react';
import {
  fetchArtistProfile,
  fetchArtistPosts,
  fetchArtistEstablishmentRelations,
  toggleFollowArtist,
  checkIsFollowing
} from '../lib/artistService';
import { ArtistProfile, ArtistPost, ArtistEstablishmentRelation } from '../types';
import { useAppStore } from '../store';
import { BookingRequestForm } from '../components/BookingRequestForm';

export const ArtistPublicPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, events } = useAppStore();

  const [artist, setArtist] = useState<ArtistProfile | null>(null);
  const [posts, setPosts] = useState<ArtistPost[]>([]);
  const [relations, setRelations] = useState<ArtistEstablishmentRelation[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'posts' | 'events' | 'media' | 'partners'>('posts');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadArtistData(id);
  }, [id, currentUser]);

  const loadArtistData = async (artistId: string) => {
    setLoading(true);
    try {
      const data = await fetchArtistProfile(artistId);
      if (data) {
        setArtist(data);
        setFollowersCount(data.followersCount || 0);

        if (currentUser) {
          const followState = checkIsFollowing(data.id, currentUser.id);
          setIsFollowing(followState);
        }

        const [artistPosts, artistRels] = await Promise.all([
          fetchArtistPosts(data.id),
          fetchArtistEstablishmentRelations({ artistId: data.id })
        ]);
        setPosts(artistPosts);
        setRelations(artistRels.filter(r => r.status === 'accepted'));
      }
    } catch (err) {
      console.error('Error loading artist public profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!artist) return;
    if (!currentUser) {
      navigate('/profile');
      return;
    }
    const nextState = await toggleFollowArtist(artist.id, currentUser.id);
    setIsFollowing(nextState);
    setFollowersCount(prev => Math.max(0, prev + (nextState ? 1 : -1)));
  };

  const handleShare = () => {
    if (navigator.share && artist) {
      navigator.share({
        title: `${artist.nomArtiste} sur ZAKA+`,
        text: `Découvrez le profil de ${artist.nomArtiste} sur ZAKA+ !`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Lien du profil artiste copié dans le presse-papier !');
    }
  };

  const handleWhatsApp = () => {
    if (!artist?.whatsappPro) {
      alert('Le numéro WhatsApp de cet artiste n\'est pas encore renseigné.');
      return;
    }
    const cleanPhone = artist.whatsappPro.replace(/\D/g, '');
    const message = encodeURIComponent(`Bonjour ${artist.nomArtiste}, je vous contacte via votre profil ZAKA+.`);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleMessage = () => {
    if (!currentUser) {
      navigate('/profile');
      return;
    }
    navigate('/messages');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gray-50 dark:bg-gray-950">
        <Mic size={48} className="text-gray-400 mb-3" />
        <h2 className="text-xl font-black text-gray-800 dark:text-white">Artiste introuvable</h2>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          Le profil que vous cherchez n'existe pas ou a été désactivé.
        </p>
        <button
          onClick={() => navigate('/explore')}
          className="mt-4 px-6 py-2.5 bg-orange-600 text-white rounded-xl font-bold text-xs cursor-pointer"
        >
          Retour à l'exploration
        </button>
      </div>
    );
  }

  // Filter events matching artist
  const artistEvents = events.filter(
    e => e.title?.toLowerCase().includes(artist.nomArtiste.toLowerCase()) ||
         e.description?.toLowerCase().includes(artist.nomArtiste.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-28">
      {/* Top Header / Nav back */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-orange-600 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Retour</span>
        </button>
        <span className="text-xs font-black text-gray-900 dark:text-white truncate max-w-[200px]">
          {artist.nomArtiste}
        </span>
        <button
          onClick={handleShare}
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-orange-600 cursor-pointer"
        >
          <Share2 size={16} />
        </button>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Cover Photo */}
        <div className="relative h-44 sm:h-64 w-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
          <img
            src={artist.photoCouverture || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=1200'}
            alt="Couverture"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Profile Card Header */}
        <div className="px-4 sm:px-6 relative -mt-16 sm:-mt-20">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 sm:p-6 shadow-xl border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div className="flex items-end gap-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl ring-4 ring-white dark:ring-gray-900 overflow-hidden bg-orange-100 dark:bg-orange-950 flex-shrink-0 shadow-lg">
                  <img
                    src={artist.photoProfil || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600'}
                    alt={artist.nomArtiste}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                      {artist.nomArtiste}
                    </h1>
                    {artist.verificationStatus === 'verified' && (
                      <span title="Artiste Vérifié" className="text-orange-600 dark:text-orange-400">
                        <CheckCircle2 size={20} className="fill-orange-600 text-white" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-orange-600 dark:text-orange-400 flex items-center gap-1">
                    <Mic size={14} />
                    <span>{artist.categorieArtistique}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                    <MapPin size={13} />
                    <span>{artist.ville}, {artist.pays}</span>
                  </p>
                </div>
              </div>

              {/* Action Buttons Top */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleFollowToggle}
                  className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                    isFollowing
                      ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                      : 'bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20'
                  }`}
                >
                  <Heart size={15} className={isFollowing ? 'fill-orange-600 text-orange-600' : ''} />
                  <span>{isFollowing ? 'Abonné' : 'Suivre'}</span>
                  <span className="text-[10px] opacity-80">({followersCount})</span>
                </button>

                <button
                  onClick={() => setShowBookingModal(true)}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs rounded-xl shadow-md shadow-orange-600/20 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Sparkles size={15} />
                  <span>Demander un Booking</span>
                </button>
              </div>
            </div>

            {/* Genres Chips */}
            {artist.genres && artist.genres.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
                {artist.genres.map(g => (
                  <span
                    key={g}
                    className="px-2.5 py-1 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 rounded-lg text-[11px] font-bold"
                  >
                    {g}
                  </span>
                ))}
              </div>
            )}

            {/* Bio */}
            {artist.biographie && (
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                {artist.biographie}
              </p>
            )}

            {/* Quick Contact Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
              <button
                onClick={handleWhatsApp}
                className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircle size={15} />
                <span>WhatsApp Pro</span>
              </button>

              <button
                onClick={handleMessage}
                className="py-2 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquare size={15} />
                <span>Messagerie</span>
              </button>

              <button
                onClick={handleShare}
                className="col-span-2 sm:col-span-1 py-2 px-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Share2 size={15} />
                <span>Partager</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 mt-6">
          <div className="flex bg-white dark:bg-gray-900 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800">
            {[
              { id: 'posts', label: 'Publications', count: posts.length },
              { id: 'events', label: 'Événements', count: artistEvents.length },
              { id: 'partners', label: 'Lieux Partenaires', count: relations.length },
              { id: 'media', label: 'Médias & Liens' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-2.5 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
                  activeTab === tab.id
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 sm:px-6 mt-4">
          {/* 1. PUBLICATIONS */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {posts.length > 0 ? (
                posts.map(post => (
                  <div
                    key={post.id}
                    className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img
                          src={artist.photoProfil}
                          alt={artist.nomArtiste}
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div>
                          <h4 className="text-sm font-black text-gray-900 dark:text-white">
                            {artist.nomArtiste}
                          </h4>
                          <span className="text-[10px] text-gray-400">
                            {new Date(post.createdAt).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400 font-bold text-[10px] rounded-lg uppercase">
                        {post.type}
                      </span>
                    </div>

                    {post.title && (
                      <h5 className="text-sm font-black text-gray-900 dark:text-white">
                        {post.title}
                      </h5>
                    )}

                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                      {post.content}
                    </p>

                    {post.mediaUrl && (
                      <div className="rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-950 max-h-80">
                        <img
                          src={post.mediaUrl}
                          alt="Média"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-4 pt-2 text-xs font-bold text-gray-500 border-t border-gray-100 dark:border-gray-800">
                      <button className="flex items-center gap-1 hover:text-orange-600 cursor-pointer">
                        <Heart size={15} />
                        <span>{post.likesCount || 0} J'aime</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-orange-600 cursor-pointer">
                        <MessageSquare size={15} />
                        <span>{post.commentsCount || 0} Commentaires</span>
                      </button>
                      <button onClick={handleShare} className="flex items-center gap-1 hover:text-orange-600 cursor-pointer ml-auto">
                        <Share2 size={15} />
                        <span>Partager</span>
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
                  <Mic size={36} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    Aucune publication récente pour le moment.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 2. ÉVÉNEMENTS */}
          {activeTab === 'events' && (
            <div className="space-y-3">
              {artistEvents.length > 0 ? (
                artistEvents.map(event => (
                  <div
                    key={event.id}
                    className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-950 text-orange-600 text-[10px] font-black rounded-md uppercase">
                          Événement Live
                        </span>
                        <span className="text-xs text-gray-400">
                          {event.date} à {event.time}
                        </span>
                      </div>
                      <h4 className="text-base font-black text-gray-900 dark:text-white">
                        {event.title}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {event.location} • {event.establishmentName || 'Lieu partenaire'}
                      </p>
                    </div>

                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl self-start sm:self-auto cursor-pointer"
                    >
                      Prendre part
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
                  <Calendar size={36} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    Aucun événement programmé actuellement.
                  </p>
                  <button
                    onClick={() => setShowBookingModal(true)}
                    className="mt-3 px-4 py-2 bg-orange-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Inviter pour un événement
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. LIEUX PARTENAIRES & RÉSIDENCES */}
          {activeTab === 'partners' && (
            <div className="space-y-3">
              {relations.length > 0 ? (
                relations.map(rel => (
                  <div
                    key={rel.id}
                    className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600">
                        <Building2 size={22} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-gray-900 dark:text-white">
                            {rel.establishmentName}
                          </h4>
                          <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-black rounded-md uppercase">
                            {rel.relationType === 'resident' ? 'Artiste Résident' : 'Collaboration'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Partenaire officiel ZAKA+
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
                  <Building2 size={36} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    Aucun établissement partenaire pour le moment.
                  </p>
                  {currentUser?.role === 'gerant' && (
                    <button
                      onClick={() => setShowBookingModal(true)}
                      className="mt-3 px-4 py-2 bg-orange-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Proposer une résidence ou collaboration
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 4. MÉDIAS & LIENS */}
          {activeTab === 'media' && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xs space-y-5">
              <div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                  <Music size={18} className="text-orange-600" />
                  <span>Plateformes Musicales</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Object.entries(artist.liensMusicaux || {}).map(([platform, url]) => (
                    url ? (
                      <a
                        key={platform}
                        href={url as string}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 font-bold text-xs text-gray-800 dark:text-gray-200 capitalize flex items-center justify-between hover:border-orange-500 transition-colors"
                      >
                        <span>{platform}</span>
                        <span className="text-orange-600">↗</span>
                      </a>
                    ) : null
                  ))}
                  {Object.keys(artist.liensMusicaux || {}).length === 0 && (
                    <p className="text-xs text-gray-400 col-span-2">Aucun lien musical renseigné.</p>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                  <Users size={18} className="text-orange-600" />
                  <span>Réseaux Sociaux</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {Object.entries(artist.reseauxSociaux || {}).map(([network, handle]) => (
                    handle ? (
                      <div
                        key={network}
                        className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 font-bold text-xs text-gray-800 dark:text-gray-200 capitalize flex items-center justify-between"
                      >
                        <span>{network}</span>
                        <span className="text-xs text-gray-500">@{handle as string}</span>
                      </div>
                    ) : null
                  ))}
                  {Object.keys(artist.reseauxSociaux || {}).length === 0 && (
                    <p className="text-xs text-gray-400 col-span-2">Aucun réseau social renseigné.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <BookingRequestForm
          artist={artist}
          isOpen={showBookingModal}
          onClose={() => setShowBookingModal(false)}
        />
      )}
    </div>
  );
};
