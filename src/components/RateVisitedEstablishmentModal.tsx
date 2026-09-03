import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Star, X, Check, MessageSquare, Store, Sparkles, ImagePlus, ThumbsUp } from 'lucide-react';
import { Establishment } from '../types';

interface RateVisitedEstablishmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEstablishmentId?: string;
}

const RATING_LABELS: Record<number, string> = {
  1: 'Décevant 😕',
  2: 'Passable 😐',
  3: 'Correct / Bien 🙂',
  4: 'Très bien ! 😊',
  5: 'Excellent / Exceptionnel ! 🤩'
};

export function RateVisitedEstablishmentModal({
  isOpen,
  onClose,
  initialEstablishmentId
}: RateVisitedEstablishmentModalProps) {
  const { 
    currentUser, 
    establishments, 
    addReview, 
    carnetEntrees, 
    reservations, 
    setGlobalError 
  } = useAppStore();

  const [selectedEstId, setSelectedEstId] = useState<string>(initialEstablishmentId || '');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (initialEstablishmentId) {
      setSelectedEstId(initialEstablishmentId);
    } else if (!selectedEstId && establishments.length > 0) {
      setSelectedEstId(establishments[0].id);
    }
  }, [initialEstablishmentId, establishments]);

  if (!isOpen) return null;

  // Find establishments the user has visited, reserved, or all establishments
  const visitedEstIds = new Set<string>();
  (carnetEntrees || []).forEach(e => {
    if (e.clientId === currentUser?.id) visitedEstIds.add(e.establishmentId);
  });
  (reservations || []).forEach(r => {
    if (r.clientId === currentUser?.id) visitedEstIds.add(r.establishmentId);
  });

  const validEsts = establishments.filter(e => e.status === 'valide');
  const targetEst = validEsts.find(e => e.id === selectedEstId) || validEsts[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setGlobalError({ message: "Veuillez vous connecter pour laisser un avis.", type: "info" });
      return;
    }
    if (!selectedEstId) {
      setGlobalError({ message: "Veuillez sélectionner un établissement.", type: "warning" });
      return;
    }
    if (!comment.trim()) {
      setGlobalError({ message: "Veuillez rédiger un court commentaire.", type: "warning" });
      return;
    }

    try {
      setIsSubmitting(true);
      await addReview({
        establishmentId: selectedEstId,
        clientId: currentUser.id,
        clientName: currentUser.name || 'Client Zaka+',
        rating,
        comment: comment.trim(),
        photos: []
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setComment('');
        onClose();
      }, 1800);
    } catch (err) {
      console.error("Erreur lors de l'envoi de l'avis:", err);
      setGlobalError({ message: "Une erreur est survenue lors de l'enregistrement de votre note.", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStarValue = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 dark:border-gray-800 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="py-8 flex flex-col items-center text-center gap-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center animate-bounce">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">Merci pour votre avis !</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs">
              Votre note de {rating}/5 a bien été enregistrée et aidera la communauté Zaka+.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Header */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-full text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Donnez votre avis</span>
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                Noter un lieu visité
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Partagez votre expérience avec une note de 1 à 5 étoiles et un court commentaire.
              </p>
            </div>

            {/* Establishment Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Établissement
              </label>
              <select
                value={selectedEstId}
                onChange={(e) => setSelectedEstId(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl border border-gray-200 dark:border-gray-700 focus:border-orange-500 outline-none font-medium text-xs sm:text-sm"
              >
                {validEsts.map(est => (
                  <option key={est.id} value={est.id}>
                    {est.name} ({est.neighborhood || est.city || 'Burkina Faso'})
                  </option>
                ))}
              </select>
            </div>

            {/* Star Rating Interactive Selector */}
            <div className="flex flex-col items-center justify-center p-4 bg-orange-50/40 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-900/30 gap-2">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                Votre note globale
              </span>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((starVal) => {
                  const isFilled = starVal <= activeStarValue;
                  return (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setRating(starVal)}
                      onMouseEnter={() => setHoverRating(starVal)}
                      onMouseLeave={() => setHoverRating(null)}
                      className="p-1 transition-transform active:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          isFilled
                            ? 'text-yellow-400 fill-yellow-400 filter drop-shadow-sm'
                            : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <span className="text-xs font-black text-orange-600 dark:text-orange-400 animate-in fade-in">
                {RATING_LABELS[activeStarValue] || `${rating}/5`}
              </span>
            </div>

            {/* Comment Textarea */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Votre commentaire
                </label>
                <span className="text-[10px] text-gray-400 font-medium">
                  {comment.length} / 500
                </span>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Qualité du service, ambiance, plats dégustés, accueil..."
                maxLength={500}
                required
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl border border-gray-200 dark:border-gray-700 focus:border-orange-500 focus:bg-white dark:focus:bg-gray-900 outline-none text-xs sm:text-sm font-medium transition-all resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-2xl text-xs transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !comment.trim()}
                className="flex-1 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center gap-2 shadow-md shadow-orange-600/20 active:scale-95"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <ThumbsUp className="w-4 h-4" />
                    <span>Publier mon avis</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
