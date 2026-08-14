import React, { useState } from 'react';
import { Establishment, GalleryPhoto } from '../types';
import { useAppStore } from '../store';
import { compressImage } from '../utils/imageCompressor';
import { X, Upload, Plus, Trash2, Tag, Save, Image as ImageIcon, Sparkles } from 'lucide-react';

interface EstablishmentPhotoGalleryManagerProps {
  establishment: Establishment;
  onClose: () => void;
}

const CATEGORY_TAGS = [
  { id: 'ambiance', label: 'Ambiance & Fête', icon: '✨' },
  { id: 'salle', label: 'Salle & Décoration', icon: '🏛️' },
  { id: 'vip', label: 'Espace VIP & Privé', icon: '👑' },
  { id: 'terrasse', label: 'Terrasse & Extérieur', icon: '🌿' },
  { id: 'cuisine_cocktails', label: 'Cuisine & Cocktails', icon: '🍸' },
  { id: 'evenements', label: 'Événements & DJ', icon: '🎉' },
];

export function EstablishmentPhotoGalleryManager({ establishment, onClose }: EstablishmentPhotoGalleryManagerProps) {
  const { updateEstablishment } = useAppStore();

  const [photos, setPhotos] = useState<GalleryPhoto[]>(() => {
    if (establishment.galleryPhotos && establishment.galleryPhotos.length > 0) {
      return [...establishment.galleryPhotos];
    }
    return (establishment.photos || []).map((url, idx) => ({
      id: `photo-${Date.now()}-${idx}`,
      url,
      caption: `Ambiance ${establishment.name}`,
      tag: idx % 2 === 0 ? 'ambiance' : 'salle',
      createdAt: new Date().toISOString()
    }));
  });

  const [newUrl, setNewUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [newTag, setNewTag] = useState<string>('ambiance');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        setIsUploading(true);
        setErrorMsg(null);
        const newItems: GalleryPhoto[] = [];

        for (let i = 0; i < e.target.files.length; i++) {
          const file = e.target.files[i];
          const base64 = await compressImage(file, 1000, 1000, 0.75);
          newItems.push({
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: base64,
            caption: newCaption || file.name.replace(/\.[^/.]+$/, ""),
            tag: newTag,
            createdAt: new Date().toISOString()
          });
        }

        setPhotos(prev => [...prev, ...newItems]);
        setNewCaption('');
      } catch (err) {
        console.error("Error uploading image:", err);
        setErrorMsg("Erreur lors de la compression de l'image.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim()) return;
    const photoItem: GalleryPhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      url: newUrl.trim(),
      caption: newCaption.trim() || `Ambiance ${establishment.name}`,
      tag: newTag,
      createdAt: new Date().toISOString()
    };
    setPhotos(prev => [...prev, photoItem]);
    setNewUrl('');
    setNewCaption('');
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Synchronize simple photos array with the first top 10 URLs for backwards compatibility
      const simplePhotoUrls = photos.map(p => p.url).slice(0, 10);
      
      await updateEstablishment(establishment.id, {
        galleryPhotos: photos,
        photos: simplePhotoUrls
      });
      onClose();
    } catch (err) {
      console.error("Erreur sauvegarde galerie:", err);
      setErrorMsg("Échec de l'enregistrement de la galerie.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md overflow-y-auto">
      <div className="bg-white dark:bg-gray-950 text-gray-900 dark:text-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-orange-50/50 dark:bg-orange-950/20">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-orange-600 text-white rounded-2xl shadow-md shadow-orange-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black leading-tight">Gestion de la Galerie Ambiance</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{establishment.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white bg-white dark:bg-gray-900 rounded-full shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 text-xs font-bold rounded-xl">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Add New Photo Form */}
          <div className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-200/80 dark:border-gray-800 space-y-4">
            <h4 className="text-xs font-black uppercase text-orange-600 tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Ajouter une nouvelle photo
            </h4>

            {/* Category Tag Selection */}
            <div>
              <label className="text-[11px] font-extrabold text-gray-500 uppercase mb-1.5 block">
                Catégorie d'ambiance
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORY_TAGS.map(tag => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => setNewTag(tag.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold text-left transition-all cursor-pointer flex items-center gap-1.5 border ${
                      newTag === tag.id
                        ? 'bg-orange-600 text-white border-orange-600 shadow-sm'
                        : 'bg-white dark:bg-gray-850 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800'
                    }`}
                  >
                    <span>{tag.icon}</span>
                    <span className="truncate">{tag.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Caption Input */}
            <div>
              <label className="text-[11px] font-extrabold text-gray-500 uppercase mb-1 block">
                Légende / Titre explicatif
              </label>
              <input
                type="text"
                placeholder="Ex: Piste de danse VIP le samedi soir, terrasse ombragée..."
                value={newCaption}
                onChange={e => setNewCaption(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500/20 outline-none text-gray-900 dark:text-white"
              />
            </div>

            {/* Upload Method Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {/* Option A: Device File Upload */}
              <label className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-900 border-2 border-dashed border-orange-300 dark:border-orange-800 rounded-2xl cursor-pointer hover:bg-orange-50/50 transition-colors text-center">
                <Upload className="w-6 h-6 text-orange-600 mb-1" />
                <span className="text-xs font-black text-gray-800 dark:text-gray-200">
                  {isUploading ? "Compression en cours..." : "Téléverser depuis l'appareil"}
                </span>
                <span className="text-[10px] text-gray-400">Format JPG, PNG (Max 5MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={isUploading}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Option B: Image URL Input */}
              <form onSubmit={handleAddUrl} className="flex flex-col gap-2 p-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl">
                <span className="text-xs font-extrabold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <ImageIcon className="w-4 h-4 text-orange-500" />
                  Ou Coller une URL d'image
                </span>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium outline-none text-gray-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!newUrl.trim()}
                  className="w-full py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Ajouter par URL
                </button>
              </form>
            </div>
          </div>

          {/* Photos List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">
                Photos dans la galerie ({photos.length})
              </h4>
            </div>

            {photos.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-6 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                Aucune photo ajoutée pour cet établissement.
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id || index}
                    className="relative group bg-gray-100 dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm"
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="w-full h-32 object-cover"
                    />
                    <div className="p-2.5 bg-white dark:bg-gray-950 space-y-1">
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                        {photo.caption || 'Sans légende'}
                      </p>
                      <span className="inline-block text-[9px] font-black uppercase px-2 py-0.5 bg-orange-100 dark:bg-orange-950 text-orange-600 rounded">
                        {photo.tag || 'ambiance'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity shadow-md cursor-pointer"
                      title="Supprimer cette photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-extrabold text-xs rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-orange-600/20 active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Enregistrement..." : "Enregistrer les modifications"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
