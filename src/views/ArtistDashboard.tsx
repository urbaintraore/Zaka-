import React, { useState, useEffect } from 'react';
import {
  Mic,
  Calendar,
  Sparkles,
  Users,
  Eye,
  CheckCircle2,
  Clock,
  Plus,
  Edit3,
  Image as ImageIcon,
  Video,
  Music,
  Share2,
  MessageSquare,
  Building2,
  TrendingUp,
  Award,
  Settings,
  LogOut,
  X,
  Phone,
  MessageCircle,
  Upload,
  Check,
  Ban,
  ExternalLink,
  ChevronRight,
  MapPin,
  DollarSign
} from 'lucide-react';
import { useAppStore } from '../store';
import {
  ArtistProfile,
  ArtistBooking,
  ArtistPost,
  ArtistStory,
  ArtistEstablishmentRelation,
  ARTIST_CATEGORIES,
  ARTIST_GENRES
} from '../types';
import {
  fetchArtistProfileByUserId,
  saveArtistProfile,
  fetchArtistBookings,
  updateBookingStatus,
  fetchArtistPosts,
  createArtistPost,
  fetchArtistStories,
  createArtistStory,
  fetchArtistEstablishmentRelations,
  proposeEstablishmentRelation,
  updateRelationStatus
} from '../lib/artistService';

interface ArtistDashboardProps {
  onLogout?: () => void;
  [key: string]: any;
}

export const ArtistDashboard: React.FC<ArtistDashboardProps> = ({ onLogout }) => {
  const { currentUser, establishments, events, addEvent } = useAppStore();

  const [activeSection, setActiveSection] = useState<
    'overview' | 'profile' | 'posts' | 'bookings' | 'events' | 'partners' | 'stats' | 'verification' | 'settings'
  >('overview');

  const [artistProfile, setArtistProfile] = useState<ArtistProfile | null>(null);
  const [bookings, setBookings] = useState<ArtistBooking[]>([]);
  const [posts, setPosts] = useState<ArtistPost[]>([]);
  const [stories, setStories] = useState<ArtistStory[]>([]);
  const [relations, setRelations] = useState<ArtistEstablishmentRelation[]>([]);
  const [loading, setLoading] = useState(true);

  // Edit Profile form state
  const [nomArtiste, setNomArtiste] = useState('');
  const [nomComplet, setNomComplet] = useState('');
  const [categorie, setCategorie] = useState('Chanteur / Chanteuse');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(['Afrobeat']);
  const [biographie, setBiographie] = useState('');
  const [ville, setVille] = useState('Ouagadougou');
  const [pays, setPays] = useState('Burkina Faso');
  const [photoProfil, setPhotoProfil] = useState('');
  const [photoCouverture, setPhotoCouverture] = useState('');
  const [whatsappPro, setWhatsappPro] = useState('');
  const [telephonePro, setTelephonePro] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [appleMusicUrl, setAppleMusicUrl] = useState('');
  const [audiomackUrl, setAudiomackUrl] = useState('');
  const [youtubeMusicUrl, setYoutubeMusicUrl] = useState('');
  const [instagramUser, setInstagramUser] = useState('');
  const [facebookUser, setFacebookUser] = useState('');
  const [tiktokUser, setTiktokUser] = useState('');
  const [youtubeUser, setYoutubeUser] = useState('');
  const [saveProfileSuccess, setSaveProfileSuccess] = useState(false);

  // New Post state
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postType, setPostType] = useState<ArtistPost['type']>('annonce');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [isPublishingPost, setIsPublishingPost] = useState(false);

  // New Story state
  const [storyCaption, setStoryCaption] = useState('');
  const [storyMediaUrl, setStoryMediaUrl] = useState('');
  const [storyType, setStoryType] = useState<ArtistStory['type']>('photo');
  const [isPublishingStory, setIsPublishingStory] = useState(false);

  // New Event state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventPrice, setEventPrice] = useState('Gratuit');
  const [eventEstablishmentId, setEventEstablishmentId] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventCoverUrl, setEventCoverUrl] = useState('');

  // New Partner Relation state
  const [partnerEstablishmentId, setPartnerEstablishmentId] = useState('');
  const [partnerRelationType, setPartnerRelationType] = useState<'resident' | 'collab' | 'booking'>('resident');
  const [partnerNotes, setPartnerNotes] = useState('');

  // Verification request state
  const [verificationDocType, setVerificationDocType] = useState('CNIB / Passeport');
  const [verificationPressLink, setVerificationPressLink] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);

  useEffect(() => {
    if (!currentUser) return;
    loadArtistData();
  }, [currentUser]);

  const loadArtistData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      let profile = await fetchArtistProfileByUserId(currentUser.id);
      if (!profile) {
        // Create initial default artist profile
        profile = await saveArtistProfile({
          userId: currentUser.id,
          nomArtiste: currentUser.name || 'Artiste ZAKA+',
          ville: currentUser.city || 'Ouagadougou',
          pays: currentUser.country || 'Burkina Faso',
          telephonePro: currentUser.phone || '',
          whatsappPro: currentUser.phone || '',
          categorieArtistique: 'Chanteur / Chanteuse',
          genres: ['Afrobeat']
        });
      }

      setArtistProfile(profile);
      populateEditForm(profile);

      const [loadedBookings, loadedPosts, loadedStories, loadedRels] = await Promise.all([
        fetchArtistBookings(profile.id),
        fetchArtistPosts(profile.id),
        fetchArtistStories(profile.id),
        fetchArtistEstablishmentRelations({ artistId: profile.id })
      ]);

      setBookings(loadedBookings);
      setPosts(loadedPosts);
      setStories(loadedStories);
      setRelations(loadedRels);
    } catch (err) {
      console.error('Error loading artist data:', err);
    } finally {
      setLoading(false);
    }
  };

  const populateEditForm = (p: ArtistProfile) => {
    setNomArtiste(p.nomArtiste || '');
    setNomComplet(p.nomComplet || '');
    setCategorie(p.categorieArtistique || 'Chanteur / Chanteuse');
    setSelectedGenres(p.genres || ['Afrobeat']);
    setBiographie(p.biographie || '');
    setVille(p.ville || 'Ouagadougou');
    setPays(p.pays || 'Burkina Faso');
    setPhotoProfil(p.photoProfil || '');
    setPhotoCouverture(p.photoCouverture || '');
    setWhatsappPro(p.whatsappPro || '');
    setTelephonePro(p.telephonePro || '');
    setSpotifyUrl(p.liensMusicaux?.spotify || '');
    setAppleMusicUrl(p.liensMusicaux?.appleMusic || '');
    setAudiomackUrl(p.liensMusicaux?.audiomack || '');
    setYoutubeMusicUrl(p.liensMusicaux?.youtubeMusic || '');
    setInstagramUser(p.reseauxSociaux?.instagram || '');
    setFacebookUser(p.reseauxSociaux?.facebook || '');
    setTiktokUser(p.reseauxSociaux?.tiktok || '');
    setYoutubeUser(p.reseauxSociaux?.youtube || '');
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !artistProfile) return;

    try {
      const updated = await saveArtistProfile({
        id: artistProfile.id,
        userId: currentUser.id,
        nomArtiste,
        nomComplet,
        categorieArtistique: categorie,
        genres: selectedGenres,
        biographie,
        ville,
        pays,
        photoProfil,
        photoCouverture,
        whatsappPro,
        telephonePro,
        liensMusicaux: {
          spotify: spotifyUrl,
          appleMusic: appleMusicUrl,
          audiomack: audiomackUrl,
          youtubeMusic: youtubeMusicUrl
        },
        reseauxSociaux: {
          instagram: instagramUser,
          facebook: facebookUser,
          tiktok: tiktokUser,
          youtube: youtubeUser
        }
      });

      setArtistProfile(updated);
      setSaveProfileSuccess(true);
      setTimeout(() => setSaveProfileSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  const handleBookingStatus = async (bookingId: string, status: ArtistBooking['status']) => {
    await updateBookingStatus(bookingId, status);
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status } : b));
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistProfile || !postContent.trim()) return;
    setIsPublishingPost(true);
    try {
      const created = await createArtistPost({
        artistId: artistProfile.id,
        artistName: artistProfile.nomArtiste,
        artistPhoto: artistProfile.photoProfil,
        type: postType,
        title: postTitle,
        content: postContent,
        mediaUrl: postMediaUrl
      });
      setPosts(prev => [created, ...prev]);
      setPostTitle('');
      setPostContent('');
      setPostMediaUrl('');
    } catch (err) {
      console.error('Failed to create post:', err);
    } finally {
      setIsPublishingPost(false);
    }
  };

  const handleCreateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistProfile || !storyMediaUrl.trim()) return;
    setIsPublishingStory(true);
    try {
      const created = await createArtistStory({
        artistId: artistProfile.id,
        artistName: artistProfile.nomArtiste,
        artistPhoto: artistProfile.photoProfil,
        type: storyType,
        mediaUrl: storyMediaUrl,
        caption: storyCaption
      });
      setStories(prev => [created, ...prev]);
      setStoryCaption('');
      setStoryMediaUrl('');
    } catch (err) {
      console.error('Failed to create story:', err);
    } finally {
      setIsPublishingStory(false);
    }
  };

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistProfile || !eventTitle.trim() || !eventDate) return;

    const est = establishments.find(e => e.id === eventEstablishmentId);

    const newEv = {
      id: `ev-${Date.now()}`,
      title: eventTitle,
      date: eventDate,
      time: eventTime || '20:00',
      location: eventLocation || est?.name || 'Ouagadougou',
      category: 'concert' as any,
      description: `${eventDescription}\n\nEn concert avec l'artiste ${artistProfile.nomArtiste}`,
      price: eventPrice,
      establishmentId: est?.id,
      establishmentName: est?.name || artistProfile.nomArtiste,
      imageUrl: eventCoverUrl || artistProfile.photoCouverture || artistProfile.photoProfil
    };

    if (addEvent) {
      addEvent(newEv);
    }

    setEventTitle('');
    setEventDate('');
    setEventTime('');
    setEventLocation('');
    setEventDescription('');
    setEventCoverUrl('');
    alert('Événement créé avec succès et visible sur ZAKA+ !');
  };

  const handleProposePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistProfile || !partnerEstablishmentId) return;

    const est = establishments.find(e => e.id === partnerEstablishmentId);
    if (!est) return;

    try {
      const rel = await proposeEstablishmentRelation({
        artistId: artistProfile.id,
        artistName: artistProfile.nomArtiste,
        establishmentId: est.id,
        establishmentName: est.name,
        relationType: partnerRelationType,
        initiatedBy: 'artist',
        notes: partnerNotes
      });

      setRelations(prev => [rel, ...prev]);
      setPartnerNotes('');
      alert(`Demande de partenariat envoyée à ${est.name} !`);
    } catch (err) {
      console.error('Failed to propose partner:', err);
    }
  };

  const handleRequestVerification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!artistProfile) return;
    setVerificationSubmitted(true);
    setArtistProfile({
      ...artistProfile,
      verificationStatus: 'pending'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-950">
        <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const artistEvents = events.filter(
    e => e.title?.toLowerCase().includes(artistProfile?.nomArtiste?.toLowerCase() || '') ||
         e.description?.toLowerCase().includes(artistProfile?.nomArtiste?.toLowerCase() || '')
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-28">
      {/* Top Banner / Identity Bar */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center text-orange-600 overflow-hidden ring-2 ring-orange-500/20">
              {artistProfile?.photoProfil ? (
                <img src={artistProfile.photoProfil} alt="Profil" className="w-full h-full object-cover" />
              ) : (
                <Mic size={20} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-sm sm:text-base text-gray-900 dark:text-white">
                  {artistProfile?.nomArtiste || 'Espace Artiste'}
                </span>
                {artistProfile?.verificationStatus === 'verified' && (
                  <CheckCircle2 size={16} className="text-orange-600 fill-orange-600 text-white" />
                )}
              </div>
              <span className="text-[10px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider block">
                Espace Artiste ZAKA+
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`#/artist/${artistProfile?.id}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400 font-bold text-xs rounded-xl flex items-center gap-1 hover:bg-orange-100 transition-colors"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">Voir ma page publique</span>
            </a>

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                title="Déconnexion"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs Horizontal Bar */}
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto no-scrollbar border-t border-gray-100 dark:border-gray-800">
          {[
            { id: 'overview', label: 'Vue d’ensemble', icon: Sparkles },
            { id: 'profile', label: 'Profil & Médias', icon: Edit3 },
            { id: 'posts', label: 'Publications & Stories', icon: ImageIcon, badge: posts.length },
            { id: 'bookings', label: 'Booking', icon: Calendar, badge: pendingBookings.length },
            { id: 'events', label: 'Événements', icon: Music, badge: artistEvents.length },
            { id: 'partners', label: 'Lieux Partenaires', icon: Building2, badge: relations.length },
            { id: 'stats', label: 'Statistiques', icon: TrendingUp },
            { id: 'verification', label: 'Badge Certifié', icon: Award },
            { id: 'settings', label: 'Paramètres', icon: Settings }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`py-3 px-3.5 text-xs font-bold whitespace-nowrap border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? 'border-orange-600 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive
                      ? 'bg-orange-600 text-white'
                      : 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* ========================================================= */}
        {/* 1. TABLEAU DE BORD / VUE D'ENSEMBLE */}
        {/* ========================================================= */}
        {activeSection === 'overview' && (
          <div className="space-y-6">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Abonnés</span>
                <div className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Users size={18} className="text-orange-600" />
                  <span>{artistProfile?.followersCount || 1420}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Demandes Booking</span>
                <div className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Calendar size={18} className="text-amber-500" />
                  <span>{bookings.length}</span>
                  {pendingBookings.length > 0 && (
                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-black">
                      +{pendingBookings.length}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Événements</span>
                <div className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Music size={18} className="text-purple-600" />
                  <span>{artistEvents.length}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Vues Profil</span>
                <div className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Eye size={18} className="text-blue-500" />
                  <span>3 420</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Lieux Partenaires</span>
                <div className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Building2 size={18} className="text-emerald-500" />
                  <span>{relations.length}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase">Certification</span>
                <div className="text-xs font-black capitalize flex items-center gap-1.5 mt-1">
                  {artistProfile?.verificationStatus === 'verified' ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={16} /> Certifié
                    </span>
                  ) : artistProfile?.verificationStatus === 'pending' ? (
                    <span className="text-amber-500 flex items-center gap-1">
                      <Clock size={16} /> En attente
                    </span>
                  ) : (
                    <span className="text-gray-400">Non certifié</span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-3xl p-6 text-white shadow-xl">
              <h3 className="text-lg font-black mb-1">Actions Rapides Artiste</h3>
              <p className="text-xs text-orange-100 mb-4 max-w-lg">
                Gérez votre visibilité, annoncez vos dates et validez vos prestations en un clic.
              </p>
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={() => setActiveSection('posts')}
                  className="px-4 py-2 bg-white text-orange-600 rounded-xl font-black text-xs hover:bg-orange-50 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
                >
                  <Plus size={15} /> Nouvelle publication
                </button>
                <button
                  onClick={() => setActiveSection('events')}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Music size={15} /> Créer un événement
                </button>
                <button
                  onClick={() => setActiveSection('bookings')}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Calendar size={15} /> Voir mes demandes ({pendingBookings.length})
                </button>
                <button
                  onClick={() => setActiveSection('profile')}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-black text-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Edit3 size={15} /> Modifier mon profil
                </button>
              </div>
            </div>

            {/* Recent Bookings in Overview */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar size={18} className="text-orange-600" />
                  <span>Dernières Demandes de Prestation</span>
                </h3>
                <button
                  onClick={() => setActiveSection('bookings')}
                  className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                >
                  Tout afficher ({bookings.length})
                </button>
              </div>

              {bookings.length > 0 ? (
                <div className="space-y-2.5">
                  {bookings.slice(0, 3).map(b => (
                    <div
                      key={b.id}
                      className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-sm text-gray-900 dark:text-white">
                            {b.eventName}
                          </h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-black uppercase ${
                            b.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : b.status === 'accepted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {b.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {b.date} à {b.time || 'Non spécifié'} • {b.location} • Par {b.requesterName}
                        </p>
                      </div>

                      {b.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleBookingStatus(b.id, 'accepted')}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl cursor-pointer"
                          >
                            Accepter
                          </button>
                          <button
                            onClick={() => handleBookingStatus(b.id, 'refused')}
                            className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl cursor-pointer"
                          >
                            Refuser
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-6">
                  Aucune demande de booking reçue pour le moment.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. PROFIL & MÉDIAS */}
        {/* ========================================================= */}
        {activeSection === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xs space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Edit3 size={18} className="text-orange-600" />
                  <span>Identité & Spécialité Artistique</span>
                </h3>
                {saveProfileSuccess && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Check size={14} /> Enregistré !
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Nom d'artiste *
                  </label>
                  <input
                    type="text"
                    required
                    value={nomArtiste}
                    onChange={e => setNomArtiste(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Nom complet (État civil)
                  </label>
                  <input
                    type="text"
                    value={nomComplet}
                    onChange={e => setNomComplet(e.target.value)}
                    placeholder="Nom et prénoms réels"
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Catégorie artistique principale *
                  </label>
                  <select
                    value={categorie}
                    onChange={e => setCategorie(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  >
                    {ARTIST_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Genres & Styles (séparés par virgule)
                  </label>
                  <input
                    type="text"
                    placeholder="Afrobeat, Hip-hop, Reggae..."
                    value={selectedGenres.join(', ')}
                    onChange={e => setSelectedGenres(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Biographie / Présentation de carrière
                </label>
                <textarea
                  rows={4}
                  placeholder="Racontez votre parcours, vos influences, vos réalisations artistiques..."
                  value={biographie}
                  onChange={e => setBiographie(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500 resize-none"
                />
              </div>

              {/* Photos & Visuals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Photo de profil (URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={photoProfil}
                    onChange={e => setPhotoProfil(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Photo de couverture (URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={photoCouverture}
                    onChange={e => setPhotoCouverture(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Contacts Professionnels */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <MessageCircle size={14} /> WhatsApp Professionnel *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+226 70 00 00 00"
                    value={whatsappPro}
                    onChange={e => setWhatsappPro(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    <Phone size={14} /> Téléphone Manager / Contact Pro
                  </label>
                  <input
                    type="tel"
                    placeholder="+226 70 00 00 00"
                    value={telephonePro}
                    onChange={e => setTelephonePro(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Liens musicaux */}
              <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Plateformes Musicales
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="url"
                    placeholder="Lien Spotify"
                    value={spotifyUrl}
                    onChange={e => setSpotifyUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  />
                  <input
                    type="url"
                    placeholder="Lien Apple Music"
                    value={appleMusicUrl}
                    onChange={e => setAppleMusicUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  />
                  <input
                    type="url"
                    placeholder="Lien Audiomack"
                    value={audiomackUrl}
                    onChange={e => setAudiomackUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  />
                  <input
                    type="url"
                    placeholder="Lien YouTube Music"
                    value={youtubeMusicUrl}
                    onChange={e => setYoutubeMusicUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Réseaux sociaux */}
              <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                  Réseaux Sociaux
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <input
                    type="text"
                    placeholder="@Instagram"
                    value={instagramUser}
                    onChange={e => setInstagramUser(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs outline-none focus:border-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="Page Facebook"
                    value={facebookUser}
                    onChange={e => setFacebookUser(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs outline-none focus:border-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="@TikTok"
                    value={tiktokUser}
                    onChange={e => setTiktokUser(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs outline-none focus:border-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="Chaîne YouTube"
                    value={youtubeUser}
                    onChange={e => setYoutubeUser(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-md shadow-orange-600/20 cursor-pointer transition-all"
                >
                  Enregistrer les modifications
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ========================================================= */}
        {/* 3. PUBLICATIONS & STORIES */}
        {/* ========================================================= */}
        {activeSection === 'posts' && (
          <div className="space-y-6">
            {/* Create Post Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Plus size={18} className="text-orange-600" />
                <span>Publier une Actualité, Affiche ou Extrait</span>
              </h3>

              <form onSubmit={handleCreatePost} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Titre de la publication (Optionnel)"
                    value={postTitle}
                    onChange={e => setPostTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  />
                  <select
                    value={postType}
                    onChange={e => setPostType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  >
                    <option value="annonce">📢 Annonce / Actualité</option>
                    <option value="evenement">🎟️ Concert / Événement</option>
                    <option value="affiche">🖼️ Affiche officielle</option>
                    <option value="musique">🎵 Nouveau single / Album</option>
                    <option value="backstage">🎬 Coulisses / Backstage</option>
                  </select>
                </div>

                <textarea
                  rows={3}
                  required
                  placeholder="Que souhaitez-vous partager avec vos fans et gérants ZAKA+ ?"
                  value={postContent}
                  onChange={e => setPostContent(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500 resize-none"
                />

                <input
                  type="url"
                  placeholder="URL d'image ou d'affiche (https://...)"
                  value={postMediaUrl}
                  onChange={e => setPostMediaUrl(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isPublishingPost}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-md shadow-orange-600/20 cursor-pointer transition-all"
                  >
                    {isPublishingPost ? 'Publication...' : 'Publier sur ZAKA+'}
                  </button>
                </div>
              </form>
            </div>

            {/* Stories Section (24h) */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock size={18} className="text-orange-600" />
                    <span>Stories Éphémères (24 heures)</span>
                  </h3>
                  <p className="text-xs text-gray-400">Visible par vos abonnés pendant 24h.</p>
                </div>
              </div>

              <form onSubmit={handleCreateStory} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  required
                  placeholder="URL photo/vidéo de la story (https://...)"
                  value={storyMediaUrl}
                  onChange={e => setStoryMediaUrl(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                />
                <input
                  type="text"
                  placeholder="Légende courte..."
                  value={storyCaption}
                  onChange={e => setStoryCaption(e.target.value)}
                  className="sm:w-64 px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  disabled={isPublishingStory}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl cursor-pointer"
                >
                  Ajouter Story
                </button>
              </form>

              {stories.length > 0 && (
                <div className="flex gap-3 overflow-x-auto py-2">
                  {stories.map(s => (
                    <div key={s.id} className="w-24 h-36 rounded-2xl overflow-hidden relative flex-shrink-0 border-2 border-orange-500">
                      <img src={s.mediaUrl} alt="Story" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex flex-col justify-end">
                        <span className="text-[10px] text-white font-bold truncate">{s.caption || 'Story'}</span>
                        <span className="text-[9px] text-orange-300">{s.viewsCount || 0} vues</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* List of Published Posts */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                Vos publications ({posts.length})
              </h4>
              {posts.map(p => (
                <div key={p.id} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-black rounded-md uppercase">
                      {p.type}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(p.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                  {p.title && <h5 className="font-bold text-sm text-gray-900 dark:text-white">{p.title}</h5>}
                  <p className="text-xs text-gray-600 dark:text-gray-300">{p.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 4. BOOKING & DEMANDES */}
        {/* ========================================================= */}
        {activeSection === 'bookings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Calendar size={18} className="text-orange-600" />
                  <span>Gestion des Demandes de Prestation</span>
                </h3>
                <p className="text-xs text-gray-400">Acceptez, refusez ou échangez avec les organisateurs.</p>
              </div>
            </div>

            {bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.map(b => (
                  <div
                    key={b.id}
                    className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-orange-600">
                          {b.eventType}
                        </span>
                        <h4 className="text-base font-black text-gray-900 dark:text-white">
                          {b.eventName}
                        </h4>
                      </div>
                      <span className={`self-start sm:self-auto px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                        b.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : b.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'refused'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {b.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-gray-400 block font-bold text-[10px]">DATE & HEURE</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{b.date} à {b.time}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-bold text-[10px]">LIEU & VILLE</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{b.location} ({b.city})</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-bold text-[10px]">ORGANISATEUR</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200">{b.requesterName}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block font-bold text-[10px]">BUDGET PROPOSÉ</span>
                        <span className="font-bold text-orange-600">{b.budget || 'À négocier'}</span>
                      </div>
                    </div>

                    {b.description && (
                      <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl">
                        {b.description}
                      </p>
                    )}

                    {/* Actions on booking */}
                    <div className="flex items-center gap-2 pt-2 flex-wrap">
                      {b.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleBookingStatus(b.id, 'accepted')}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl cursor-pointer"
                          >
                            Accepter la prestation
                          </button>
                          <button
                            onClick={() => handleBookingStatus(b.id, 'refused')}
                            className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 font-black text-xs rounded-xl cursor-pointer"
                          >
                            Refuser
                          </button>
                        </>
                      )}

                      {b.status === 'accepted' && (
                        <button
                          onClick={() => handleBookingStatus(b.id, 'completed')}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl cursor-pointer"
                        >
                          Marquer comme terminé
                        </button>
                      )}

                      {b.requesterWhatsapp && (
                        <a
                          href={`https://wa.me/${b.requesterWhatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl flex items-center gap-1 hover:bg-emerald-100"
                        >
                          <MessageCircle size={14} /> Contacter sur WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
                <Calendar size={40} className="mx-auto text-gray-400 mb-2" />
                <h4 className="text-sm font-black text-gray-800 dark:text-white">Aucune demande de booking</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                  Votre bouton « Demander un booking » sur votre page publique permet aux gérants et clients de vous envoyer des propositions.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 5. ÉVÉNEMENTS & PRESTATIONS */}
        {/* ========================================================= */}
        {activeSection === 'events' && (
          <div className="space-y-6">
            {/* Create Event Card */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Plus size={18} className="text-orange-600" />
                <span>Créer et Annoncer un Événement / Concert</span>
              </h3>

              <form onSubmit={handleCreateEvent} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Nom du concert / événement *"
                    value={eventTitle}
                    onChange={e => setEventTitle(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  />
                  <select
                    value={eventEstablishmentId}
                    onChange={e => setEventEstablishmentId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  >
                    <option value="">Lieu partenaire ZAKA+ (Optionnel)</option>
                    {establishments.map(est => (
                      <option key={est.id} value={est.id}>
                        {est.name} ({est.city})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <input
                    type="date"
                    required
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  />
                  <input
                    type="time"
                    value={eventTime}
                    onChange={e => setEventTime(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  />
                  <input
                    type="text"
                    placeholder="Prix (Ex: 2 000 FCFA ou Gratuit)"
                    value={eventPrice}
                    onChange={e => setEventPrice(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Lieu précis (Ex: Palais des Sports, Maquis Le Calao...)"
                    value={eventLocation}
                    onChange={e => setEventLocation(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  />
                  <input
                    type="url"
                    placeholder="URL de l'affiche de l'événement (https://...)"
                    value={eventCoverUrl}
                    onChange={e => setEventCoverUrl(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  />
                </div>

                <textarea
                  rows={2}
                  placeholder="Description du concert / programme de la soirée..."
                  value={eventDescription}
                  onChange={e => setEventDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500 resize-none"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-md shadow-orange-600/20 cursor-pointer transition-all"
                  >
                    Publier l'événement
                  </button>
                </div>
              </form>
            </div>

            {/* List of Events */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                Vos dates & prestations programmées ({artistEvents.length})
              </h4>
              {artistEvents.map(ev => (
                <div key={ev.id} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-sm text-gray-900 dark:text-white">{ev.title}</h5>
                    <p className="text-xs text-gray-500">{ev.date} à {ev.time} • {ev.location}</p>
                  </div>
                  <span className="text-xs font-black text-orange-600">{ev.price || 'Gratuit'}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 6. LIEUX & PARTENAIRES */}
        {/* ========================================================= */}
        {activeSection === 'partners' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 size={18} className="text-orange-600" />
                <span>Demander un Rattachement à un Établissement ZAKA+</span>
              </h3>
              <p className="text-xs text-gray-400">
                Postulez pour devenir artiste résident ou collaborateur officiel auprès des gérants de maquis, bars, clubs et espaces culturels.
              </p>

              <form onSubmit={handleProposePartner} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    required
                    value={partnerEstablishmentId}
                    onChange={e => setPartnerEstablishmentId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  >
                    <option value="">Sélectionnez un établissement ZAKA+ *</option>
                    {establishments.map(est => (
                      <option key={est.id} value={est.id}>
                        {est.name} ({est.category} - {est.city})
                      </option>
                    ))}
                  </select>

                  <select
                    value={partnerRelationType}
                    onChange={e => setPartnerRelationType(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
                  >
                    <option value="resident">Artiste Résident (Prestations régulières)</option>
                    <option value="collab">Collaboration ponctuelle</option>
                    <option value="booking">Prestation spéciale / Concert</option>
                  </select>
                </div>

                <textarea
                  rows={2}
                  placeholder="Message ou motivation adressée au gérant..."
                  value={partnerNotes}
                  onChange={e => setPartnerNotes(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500 resize-none"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl cursor-pointer"
                  >
                    Envoyer la proposition au Gérant
                  </button>
                </div>
              </form>
            </div>

            {/* List of Partner Relations */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-400">
                Vos Établissements Partenaires ({relations.length})
              </h4>
              {relations.map(r => (
                <div key={r.id} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <h5 className="font-bold text-sm text-gray-900 dark:text-white">{r.establishmentName}</h5>
                    <p className="text-xs text-gray-500 capitalize">Type: {r.relationType}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                    r.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {r.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 7. STATISTIQUES & VISIBILITÉ */}
        {/* ========================================================= */}
        {activeSection === 'stats' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase">Popularité Globale</span>
                <div className="text-2xl font-black text-gray-900 dark:text-white">Top 5%</div>
                <p className="text-xs text-emerald-600 font-bold">Artiste très sollicité à Ouagadougou</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase">Taux de réponse booking</span>
                <div className="text-2xl font-black text-gray-900 dark:text-white">98%</div>
                <p className="text-xs text-gray-400">Délai moyen de réponse : 2h</p>
              </div>

              <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-1">
                <span className="text-[10px] font-black text-gray-400 uppercase">Clics WhatsApp Pro</span>
                <div className="text-2xl font-black text-gray-900 dark:text-white">412 clics</div>
                <p className="text-xs text-orange-600 font-bold">+18% ce mois-ci</p>
              </div>
            </div>

            {/* Popularité par ville */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 space-y-4">
              <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin size={18} className="text-orange-600" />
                <span>Audience & Popularité par Ville</span>
              </h3>

              <div className="space-y-3">
                {[
                  { city: 'Ouagadougou', percent: 68 },
                  { city: 'Bobo-Dioulasso', percent: 22 },
                  { city: 'Koudougou', percent: 6 },
                  { city: 'Diaspora / International', percent: 4 }
                ].map(item => (
                  <div key={item.city} className="space-y-1">
                    <div className="flex justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
                      <span>{item.city}</span>
                      <span>{item.percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-orange-600 rounded-full" style={{ width: `${item.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 8. BADGE & VÉRIFICATION */}
        {/* ========================================================= */}
        {activeSection === 'verification' && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xs space-y-5 max-w-2xl mx-auto">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950 text-orange-600 mx-auto flex items-center justify-center">
                <Award size={28} />
              </div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                Certification de Profil Artiste ZAKA+
              </h3>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                Obtenez le badge certifié officiel pour garantir votre authenticité auprès des organisateurs, gérants et du public.
              </p>
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase">Statut actuel</span>
                <div className="text-sm font-black capitalize text-gray-900 dark:text-white flex items-center gap-1.5 mt-0.5">
                  {artistProfile?.verificationStatus === 'verified' ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 size={16} /> Profil Certifié ZAKA+
                    </span>
                  ) : artistProfile?.verificationStatus === 'pending' || verificationSubmitted ? (
                    <span className="text-amber-500 flex items-center gap-1">
                      <Clock size={16} /> Demande en cours d'examen
                    </span>
                  ) : (
                    <span className="text-gray-500">Non certifié</span>
                  )}
                </div>
              </div>
            </div>

            {artistProfile?.verificationStatus !== 'verified' && !verificationSubmitted && (
              <form onSubmit={handleRequestVerification} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Type de pièce justificative
                  </label>
                  <select
                    value={verificationDocType}
                    onChange={e => setVerificationDocType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium outline-none focus:border-orange-500"
                  >
                    <option value="CNIB / Passeport">CNIB / Passeport officiel</option>
                    <option value="Carte d'artiste BBDA">Carte d'artiste membre BBDA</option>
                    <option value="Lien officiel presse">Lien d'article de presse / média certifié</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Lien presse ou extrait officiel
                  </label>
                  <input
                    type="url"
                    placeholder="https://presse.bf/... ou chaîne YouTube officielle"
                    value={verificationPressLink}
                    onChange={e => setVerificationPressLink(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium outline-none focus:border-orange-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Commentaires / Références
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Précisez votre numéro d'enregistrement BBDA ou liens complémentaires..."
                    value={verificationNotes}
                    onChange={e => setVerificationNotes(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium outline-none focus:border-orange-500 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-md shadow-orange-600/20 cursor-pointer"
                >
                  Soumettre la demande de certification
                </button>
              </form>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* 9. PARAMÈTRES DU COMPTE */}
        {/* ========================================================= */}
        {activeSection === 'settings' && (
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-xs space-y-5 max-w-xl mx-auto">
            <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Settings size={18} className="text-orange-600" />
              <span>Paramètres du Compte Artiste</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="text-gray-400 font-bold block">E-mail de connexion</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{currentUser?.email || 'Non renseigné'}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="text-gray-400 font-bold block">Téléphone principal</span>
                <span className="font-bold text-gray-800 dark:text-gray-200">{currentUser?.phone || 'Non renseigné'}</span>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="text-gray-400 font-bold block">Rôle de l'application</span>
                <span className="font-bold text-orange-600 uppercase">Artiste ZAKA+</span>
              </div>
            </div>

            {onLogout && (
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <button
                  onClick={onLogout}
                  className="w-full py-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-black text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <LogOut size={16} />
                  <span>Se déconnecter de l'espace Artiste</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
