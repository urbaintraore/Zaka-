import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Star, Send, ImagePlus, X, Camera } from 'lucide-react';
import { Review } from '../types';

interface AvisUtilisateursProps {
  establishmentId: string;
}

export function AvisUtilisateurs({ establishmentId }: AvisUtilisateursProps) {
  const { reviews, currentUser, addReview, setGlobalError } = useAppStore();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [photoInput, setPhotoInput] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const estReviews = reviews.filter(r => r.establishmentId === establishmentId);

  const handleAddPhoto = () => {
    if (!photoInput.trim()) return;
    if (photoUrls.length >= 3) {
      alert("Maximum 3 photos par avis.");
      return;
    }
    setPhotoUrls([...photoUrls, photoInput.trim()]);
    setPhotoInput('');
  };

  const handleRemovePhoto = (index: number) => {
    setPhotoUrls(photoUrls.filter((_, i) => i !== index));
  };

  const compressImage = (file: File, maxWidth = 1000, maxHeight = 1000, quality = 0.75): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(event.target?.result as string);
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (photoUrls.length >= 3) {
      alert("Maximum 3 photos par avis.");
      return;
    }
    const remaining = 3 - photoUrls.length;
    const filesToUpload = (Array.from(files) as File[]).slice(0, remaining);

    for (const file of filesToUpload) {
      try {
        const compressedDataUrl = await compressImage(file);
        setPhotoUrls(prev => [...prev, compressedDataUrl].slice(0, 3));
      } catch (err) {
        console.error("Erreur de compression de la photo:", err);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setGlobalError({ message: "Veuillez vous connecter pour laisser un avis.", type: 'info' });
      return;
    }

    await addReview({
      clientId: currentUser.id,
      establishmentId,
      rating,
      comment,
      photos: photoUrls.length > 0 ? photoUrls : undefined
    });

    setComment('');
    setPhotoUrls([]);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center justify-between">
        <span>Avis des utilisateurs</span>
        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full border border-amber-200">
          ⭐ Gagné +10 pts Zaka / avis
        </span>
      </h3>
      
      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1 mb-3">
          {[1,2,3,4,5].map(star => (
            <Star 
              key={star} 
              className={`w-6 h-6 cursor-pointer transition-transform hover:scale-110 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-700'}`}
              onClick={() => setRating(star)}
            />
          ))}
        </div>

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Laissez un commentaire..."
          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none resize-none mb-3"
          rows={3}
        />

        {/* Photos Preview & Inputs */}
        <div className="space-y-2 mb-3">
          {photoUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {photoUrls.map((url, idx) => (
                <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0 group">
                  <img src={url} alt={`Avis photo ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/60 text-white rounded-full text-xs hover:bg-rose-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {photoUrls.length < 3 && (
            <div className="flex items-center gap-2">
              <label className="cursor-pointer px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                <Camera className="w-3.5 h-3.5 text-amber-500" />
                <span>Ajouter photo</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="flex-1 flex items-center gap-1">
                <input
                  type="url"
                  value={photoInput}
                  onChange={e => setPhotoInput(e.target.value)}
                  placeholder="ou coller URL photo (https://...)"
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs px-2.5 py-1.5 rounded-lg text-gray-800 dark:text-gray-200 outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="px-2.5 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg text-xs font-semibold hover:bg-gray-300"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        <button type="submit" className="flex items-center gap-2 bg-orange-600 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-orange-700 transition-all text-xs cursor-pointer">
          <Send className="w-4 h-4" /> Publier mon avis
        </button>
      </form>

      {/* Liste des avis */}
      <div className="space-y-4">
        {estReviews.map(review => (
          <div key={review.id} className="border-b border-gray-100 dark:border-gray-800 pb-4">
             <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="flex text-yellow-400">
                      {[...Array(review.rating)].map((_,i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400" />)}
                  </div>
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                    {review.clientName || "Utilisateur Zaka"}
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium">
                    {new Date(review.date).toLocaleDateString('fr-FR')}
                </span>
             </div>

             <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{review.comment}</p>

             {/* Photos Gallery */}
             {review.photos && review.photos.length > 0 && (
               <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                 {review.photos.map((photo, pIdx) => (
                   <button
                     key={pIdx}
                     onClick={() => setSelectedPhoto(photo)}
                     className="relative w-20 h-20 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0 hover:opacity-90 transition-opacity"
                   >
                     <img src={photo} alt={`Avis photo ${pIdx + 1}`} className="w-full h-full object-cover" />
                   </button>
                 ))}
               </div>
             )}

             {(review as any).reply && (
               <div className="mt-3.5 ml-4 p-3 bg-orange-50/50 dark:bg-orange-950/20 border-l-2 border-orange-500 rounded-r-xl">
                 <div className="flex items-center justify-between mb-1">
                   <span className="text-xs font-black text-orange-800 dark:text-orange-400 uppercase tracking-wider">Réponse du gérant</span>
                   {(review as any).replyDate && (
                     <span className="text-[9px] text-gray-400 font-bold">
                       {new Date((review as any).replyDate).toLocaleDateString()}
                     </span>
                   )}
                 </div>
                 <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic">"{(review as any).reply}"</p>
               </div>
             )}
          </div>
        ))}
      </div>

      {/* Lightbox Photo Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl">
            <img src={selectedPhoto} alt="Avis photo agrandie" className="max-w-full max-h-[85vh] object-contain rounded-xl" />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 text-white rounded-full hover:bg-black/80"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

