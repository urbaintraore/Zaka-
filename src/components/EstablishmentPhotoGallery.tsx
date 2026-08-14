import React, { useState } from 'react';
import { GalleryPhoto, Establishment } from '../types';
import { Image as ImageIcon, X, ChevronLeft, ChevronRight, Share2, Plus, Sparkles, Tag } from 'lucide-react';
import { useAppStore } from '../store';

interface EstablishmentPhotoGalleryProps {
  establishment: Establishment;
  onOpenManager?: () => void;
}

const CATEGORY_TAGS = [
  { id: 'all', label: 'Tous', icon: '📸' },
  { id: 'ambiance', label: 'Ambiance', icon: '✨' },
  { id: 'salle', label: 'Salle & Décor', icon: '🏛️' },
  { id: 'vip', label: 'Espace VIP', icon: '👑' },
  { id: 'terrasse', label: 'Terrasse', icon: '🌿' },
  { id: 'cuisine_cocktails', label: 'Cuisine & Cocktails', icon: '🍸' },
  { id: 'evenements', label: 'Événements', icon: '🎉' },
];

export function EstablishmentPhotoGallery({ establishment, onOpenManager }: EstablishmentPhotoGalleryProps) {
  const { currentUser } = useAppStore();
  const isOwner = currentUser?.id === establishment.ownerId;

  // Combine galleryPhotos and standard photos into a unified structure
  const rawGalleryPhotos: GalleryPhoto[] = establishment.galleryPhotos && establishment.galleryPhotos.length > 0
    ? establishment.galleryPhotos
    : (establishment.photos || []).map((url, idx) => ({
        id: `photo-${idx}`,
        url,
        caption: `Ambiance ${establishment.name}`,
        tag: idx % 2 === 0 ? 'ambiance' : 'salle',
        createdAt: new Date().toISOString()
      }));

  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const filteredPhotos = rawGalleryPhotos.filter(photo => {
    if (activeFilter === 'all') return true;
    return photo.tag === activeFilter;
  });

  const currentLightboxPhoto = lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  const handleNextLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && filteredPhotos.length > 0) {
      setLightboxIndex((lightboxIndex + 1) % filteredPhotos.length);
    }
  };

  const handlePrevLightbox = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lightboxIndex !== null && filteredPhotos.length > 0) {
      setLightboxIndex((lightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length);
    }
  };

  const handleShare = (e: React.MouseEvent, photoUrl: string) => {
    e.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: `Galerie ${establishment.name}`,
        text: `Découvrez l'ambiance de ${establishment.name} sur ZAKA+ !`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(photoUrl);
      alert('Lien de la photo copié dans le presse-papier !');
    }
  };

  const getTagLabel = (tagId?: string) => {
    const found = CATEGORY_TAGS.find(t => t.id === tagId);
    return found ? `${found.icon} ${found.label}` : '📸 Ambiance';
  };

  return (
    <div className="space-y-4">
      {/* Gallery Header & Owner Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-orange-100 dark:bg-orange-950/40 text-orange-600 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">
              Galerie Photos & Ambiance
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
              {rawGalleryPhotos.length} {rawGalleryPhotos.length > 1 ? 'photos publiées' : 'photo publiée'}
            </p>
          </div>
        </div>

        {isOwner && onOpenManager && (
          <button
            type="button"
            onClick={onOpenManager}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer shadow-sm shadow-orange-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>Gérer les photos</span>
          </button>
        )}
      </div>

      {/* Filter Tags Bar */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1">
        {CATEGORY_TAGS.map(tag => {
          const count = tag.id === 'all' 
            ? rawGalleryPhotos.length 
            : rawGalleryPhotos.filter(p => p.tag === tag.id).length;
          
          if (count === 0 && tag.id !== 'all') return null;

          return (
            <button
              key={tag.id}
              onClick={() => setActiveFilter(tag.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer border ${
                activeFilter === tag.id
                  ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                  : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800 hover:bg-orange-50'
              }`}
            >
              <span>{tag.icon}</span>
              <span>{tag.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                activeFilter === tag.id ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid Display */}
      {filteredPhotos.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 space-y-2">
          <ImageIcon className="w-8 h-8 text-gray-400 mx-auto" />
          <p className="text-xs font-bold text-gray-500 dark:text-gray-400">
            Aucune photo dans cette catégorie pour le moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {filteredPhotos.map((photo, index) => (
            <div
              key={photo.id || index}
              onClick={() => setLightboxIndex(index)}
              className="group relative aspect-4/3 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200/60 dark:border-gray-800 shadow-sm cursor-pointer hover:shadow-md transition-all duration-300"
            >
              <img
                src={photo.url}
                alt={photo.caption || establishment.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                <div className="flex justify-end">
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-black/50 backdrop-blur-md text-white rounded-md border border-white/20">
                    {getTagLabel(photo.tag)}
                  </span>
                </div>
                {photo.caption && (
                  <p className="text-xs font-extrabold text-white line-clamp-2 drop-shadow-md leading-tight">
                    {photo.caption}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {currentLightboxPhoto && lightboxIndex !== null && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxIndex(null)}
        >
          <div 
            className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="absolute top-0 inset-x-0 p-4 flex items-center justify-between text-white z-20 bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black px-2.5 py-1 bg-orange-600 rounded-lg uppercase tracking-wide">
                  {getTagLabel(currentLightboxPhoto.tag)}
                </span>
                <span className="text-xs text-white/80 font-bold">
                  {lightboxIndex + 1} / {filteredPhotos.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleShare(e, currentLightboxPhoto.url)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  title="Partager cette photo"
                >
                  <Share2 className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => setLightboxIndex(null)}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Photo Container */}
            <div className="relative w-full max-h-[75vh] flex items-center justify-center my-12">
              <img
                src={currentLightboxPhoto.url}
                alt={currentLightboxPhoto.caption || establishment.name}
                className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl"
              />

              {/* Prev / Next Arrows */}
              {filteredPhotos.length > 1 && (
                <>
                  <button
                    onClick={handlePrevLightbox}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-orange-600 text-white rounded-full transition-all backdrop-blur-md cursor-pointer border border-white/10"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={handleNextLightbox}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-3 bg-black/50 hover:bg-orange-600 text-white rounded-full transition-all backdrop-blur-md cursor-pointer border border-white/10"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}
            </div>

            {/* Bottom Caption Bar */}
            {currentLightboxPhoto.caption && (
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent text-center text-white z-20">
                <p className="text-sm font-extrabold max-w-lg mx-auto">
                  {currentLightboxPhoto.caption}
                </p>
                <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-widest">
                  {establishment.name} • {establishment.city}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
