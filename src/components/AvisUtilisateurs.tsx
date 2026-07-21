import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Star, Send } from 'lucide-react';
import { Review } from '../types';

interface AvisUtilisateursProps {
  establishmentId: string;
}

export function AvisUtilisateurs({ establishmentId }: AvisUtilisateursProps) {
  const { reviews, currentUser, addReview, setGlobalError } = useAppStore();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  
  const estReviews = reviews.filter(r => r.establishmentId === establishmentId);

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
      comment
    });
    setComment('');
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-black text-gray-900 dark:text-white">Avis des utilisateurs</h3>
      
      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-900/40 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1 mb-3">
          {[1,2,3,4,5].map(star => (
            <Star 
              key={star} 
              className={`w-6 h-6 cursor-pointer ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-700'}`}
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
        <button type="submit" className="flex items-center gap-2 bg-orange-600 text-white font-bold py-2.5 px-4 rounded-xl hover:bg-orange-700 transition-all text-xs cursor-pointer">
          <Send className="w-4 h-4" /> Publier
        </button>
      </form>

      {/* Liste des avis */}
      <div className="space-y-4">
        {estReviews.map(review => (
          <div key={review.id} className="border-b border-gray-100 pb-4">
             <div className="flex items-center gap-2 mb-1">
                <div className="flex text-yellow-400">
                    {[...Array(review.rating)].map((_,i) => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400" />)}
                </div>
                <span className="text-[10px] text-gray-400 font-medium">
                    {new Date(review.date).toLocaleDateString()}
                </span>
             </div>
             <p className="text-sm text-gray-700 dark:text-gray-300">{review.comment}</p>
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
    </div>
  );
}
