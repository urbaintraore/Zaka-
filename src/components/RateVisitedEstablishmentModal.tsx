import React, { useState } from 'react';
import { X, Star, CheckCircle } from 'lucide-react';
import { useAppStore } from '../store';

export interface RateVisitedEstablishmentModalProps {
  isOpen?: boolean;
  establishment?: { id: string; name: string } | null;
  initialEstablishmentId?: string;
  onClose: () => void;
}

export function RateVisitedEstablishmentModal({ isOpen, establishment, onClose }: RateVisitedEstablishmentModalProps) {
  const { currentUser, addReview } = useAppStore();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (isOpen === false && !establishment) return null;

  const estName = establishment?.name || 'l\'établissement';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!establishment) return;

    await addReview({
      establishmentId: establishment.id,
      userId: currentUser?.id || 'u-1',
      userName: currentUser?.name || 'Visiteur Zaka',
      rating,
      comment
    });

    setIsSubmitted(true);
    setTimeout(() => {
      setIsSubmitted(false);
      setComment('');
      setRating(5);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 max-w-md w-full space-y-4 relative shadow-2xl border border-gray-100 dark:border-gray-800">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X size={18} />
        </button>

        {isSubmitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle size={30} />
            </div>
            <h3 className="text-base font-black text-gray-900 dark:text-white">Avis envoyé avec succès !</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Merci d'avoir contribué à la communauté Zaka au Burkina Faso.
            </p>
          </div>
        ) : (
          <>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 rounded-md">
                Avis Client
              </span>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mt-1">Donner votre avis</h3>
              <p className="text-xs font-bold text-orange-600 dark:text-orange-400">{estName}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-orange-50/50 dark:bg-orange-950/20 p-4 rounded-2xl text-center border border-orange-100 dark:border-orange-900/40">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-2">Note globale :</p>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className="p-1 hover:scale-125 transition-transform cursor-pointer"
                    >
                      <Star
                        size={28}
                        className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300 dark:text-gray-700'}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mt-1">
                  {rating === 5 ? 'Excellent !' : rating === 4 ? 'Très bon' : rating === 3 ? 'Moyen' : rating === 2 ? 'Passable' : 'Décevant'}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 dark:text-gray-300 block mb-1">
                  Votre commentaire
                </label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="Qu'avez-vous pensé de l'ambiance, de la nourriture ou du service ?"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white rounded-xl text-xs font-medium outline-none focus:border-orange-500 focus:bg-white dark:focus:bg-gray-900 transition-colors"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-600/15 transition-colors cursor-pointer"
                >
                  Publier l'avis
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
