import React, { useState } from 'react';
import { Establishment } from '../types';
import { Share2, Copy, Check, MessageSquare, X, Heart, ExternalLink, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface ShareFavoritesModalProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: Establishment[];
  userName?: string;
}

export function ShareFavoritesModal({
  isOpen,
  onClose,
  favorites,
  userName
}: ShareFavoritesModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Build the shareable link
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const favIdsParam = encodeURIComponent(favorites.map(f => f.id).join(','));
  const shareUrl = `${origin}/?shared_favs=${favIdsParam}`;

  // Build formatted text message
  const shareTitle = `✨ Les adresses favorites de ${userName || 'mon ami(e)'} sur Zaka+`;
  const estListText = favorites.slice(0, 10).map((est, index) => {
    const category = est.category ? est.category.replace(/_/g, ' ') : 'Lieu';
    const loc = est.neighborhood || est.quarter || 'Ouagadougou';
    return `${index + 1}. 📍 ${est.name} (${loc}) • ${category}`;
  }).join('\n');

  const shareText = `${shareTitle} :\n\n${estListText}${favorites.length > 10 ? `\n... et ${favorites.length - 10} autre(s) lieu(x)` : ''}\n\n👉 Retrouvez ma liste complète ici :\n${shareUrl}`;

  const handleNativeShare = async () => {
    triggerHaptic('medium');
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Découvrez ma sélection de ${favorites.length} lieux favoris à Ouagadougou sur Zaka+ !`,
          url: shareUrl
        });
        window.dispatchEvent(new CustomEvent('app-toast', {
          detail: { message: 'Partage réussi !', type: 'success' }
        }));
        onClose();
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Native share failed:', err);
        }
      }
    }

    // Fallback: Copy to clipboard
    handleCopyLink();
  };

  const handleCopyLink = async () => {
    triggerHaptic('success');
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('textarea');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: 'Lien unique copié dans le presse-papier !', type: 'success' }
      }));
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  };

  const handleWhatsAppShare = () => {
    triggerHaptic('light');
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white">
                Partager mes favoris
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                {favorites.length} établissement{favorites.length > 1 ? 's' : ''} sélectionné{favorites.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview of favorites */}
        <div className="p-3.5 bg-gray-50 dark:bg-gray-850 rounded-2xl border border-gray-200/70 dark:border-gray-800 flex flex-col gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Aperçu de la sélection partagée
          </span>
          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
            {favorites.map((est, idx) => (
              <div 
                key={est.id} 
                className="flex items-center justify-between text-xs py-1 border-b border-gray-100 dark:border-gray-800/60 last:border-none"
              >
                <span className="font-bold text-gray-800 dark:text-gray-200 truncate pr-2">
                  {idx + 1}. {est.name}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 shrink-0 font-medium">
                  {est.neighborhood || est.quarter || 'Ouaga'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5">
          {/* Web Share Native Button */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-black text-sm rounded-2xl transition-all cursor-pointer shadow-md shadow-orange-600/20 active:scale-[0.99]"
            >
              <Share2 className="w-4 h-4" />
              <span>Partager via Web Share (Applications)</span>
            </button>
          )}

          {/* WhatsApp Button */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl transition-all cursor-pointer shadow-xs active:scale-[0.99]"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Envoyer sur WhatsApp</span>
          </button>

          {/* Direct Copy Link Button */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-sm transition-all cursor-pointer border ${
              copied
                ? 'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-300 dark:border-green-800'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-750 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Lien copié dans le presse-papier !' : 'Copier le lien unique de partage'}</span>
          </button>
        </div>

        {/* Share URL Display box */}
        <div className="p-2.5 bg-gray-100 dark:bg-gray-800/60 rounded-xl flex items-center justify-between gap-2 text-xs text-gray-600 dark:text-gray-400 font-mono select-all overflow-hidden border border-gray-200 dark:border-gray-750">
          <span className="truncate flex-1">{shareUrl}</span>
          <button
            type="button"
            onClick={handleCopyLink}
            className="text-[11px] font-bold text-orange-600 dark:text-orange-400 shrink-0 uppercase tracking-wider"
          >
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>
      </div>
    </div>
  );
}
