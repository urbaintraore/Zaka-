import React, { useEffect, useRef } from 'react';
import { useAppStore } from '../store';
import { AdPlacementType, Ad } from '../types';
import { Sparkles, ExternalLink, Phone, MessageSquare, Calendar, ChevronRight, Volume2, ShieldCheck, Tag } from 'lucide-react';

interface AdPlacementBannerProps {
  placement: AdPlacementType;
  cityFilter?: string;
  className?: string;
  compact?: boolean;
}

export const AdPlacementBanner: React.FC<AdPlacementBannerProps> = ({
  placement,
  cityFilter,
  className = '',
  compact = false
}) => {
  const { ads, campaigns, trackAdImpression, trackAdClick } = useAppStore();
  const trackedRef = useRef<Set<string>>(new Set());

  // Filter active ads matching placement & active status
  const activeAds = ads.filter(ad => {
    if (ad.status !== 'active') return false;
    if (!ad.placements || !ad.placements.includes(placement)) return false;

    // Verify campaign is active
    const camp = campaigns.find(c => c.id === ad.campaignId);
    if (camp && camp.status !== 'active') return false;

    // Filter by city if targeted
    if (cityFilter && camp?.targeting?.cities?.length) {
      const matchCity = camp.targeting.cities.some(c => 
        c.toLowerCase().includes(cityFilter.toLowerCase()) || cityFilter.toLowerCase().includes(c.toLowerCase())
      );
      if (!matchCity) return false;
    }

    return true;
  });

  // Select primary ad to display (or shuffle)
  const adToDisplay: Ad | undefined = activeAds.length > 0 ? activeAds[0] : undefined;

  useEffect(() => {
    if (adToDisplay && !trackedRef.current.has(adToDisplay.id)) {
      trackedRef.current.add(adToDisplay.id);
      trackAdImpression(adToDisplay.id);
    }
  }, [adToDisplay?.id]);

  if (!adToDisplay) return null;

  const handleCtaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackAdClick(adToDisplay.id);

    const link = adToDisplay.ctaLink || '';
    if (adToDisplay.ctaText === 'WhatsApp') {
      const phone = link.replace(/[^\d+]/g, '');
      window.open(`https://wa.me/${phone || '22670000000'}?text=${encodeURIComponent(`Bonjour, je vous contacte depuis ZAKA+ concernant votre annonce "${adToDisplay.title}"`)}`, '_blank');
    } else if (adToDisplay.ctaText === 'Appeler') {
      window.open(`tel:${link || '+22670000000'}`, '_self');
    } else if (link.startsWith('http')) {
      window.open(link, '_blank');
    } else {
      alert(`Annonce ZAKA+ : ${adToDisplay.title}\nContact : ${link || 'Disponible dans l\'application ZAKA+'}`);
    }
  };

  // 1) Home Banner Format
  if (placement === 'home_banner') {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-orange-950 text-white shadow-xl border border-orange-500/20 my-4 ${className}`}>
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-orange-500/30 text-[10px] font-black text-orange-400 uppercase tracking-widest">
          <Sparkles className="w-3 h-3 text-orange-400 animate-pulse" />
          ZAKA Ads
        </div>

        <div className="flex flex-col md:flex-row items-center">
          {adToDisplay.mediaUrl && (
            <div className="w-full md:w-1/2 h-44 md:h-52 overflow-hidden relative">
              <img 
                src={adToDisplay.mediaUrl} 
                alt={adToDisplay.title} 
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent md:hidden" />
            </div>
          )}

          <div className={`p-5 w-full ${adToDisplay.mediaUrl ? 'md:w-1/2' : 'w-full'}`}>
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block mb-1">
              {adToDisplay.advertiserName || 'Sponsorisé'}
            </span>
            <h3 className="text-lg font-black text-white leading-snug mb-2">
              {adToDisplay.title}
            </h3>
            {adToDisplay.description && (
              <p className="text-xs text-gray-300 line-clamp-2 mb-4 leading-relaxed">
                {adToDisplay.description}
              </p>
            )}

            <button
              onClick={handleCtaClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/30 transition-all transform active:scale-95 cursor-pointer"
            >
              {adToDisplay.ctaText === 'WhatsApp' && <MessageSquare className="w-4 h-4" />}
              {adToDisplay.ctaText === 'Appeler' && <Phone className="w-4 h-4" />}
              {adToDisplay.ctaText === 'Réserver' && <Calendar className="w-4 h-4" />}
              {(!adToDisplay.ctaText || ['Découvrir', 'Acheter'].includes(adToDisplay.ctaText)) && <ExternalLink className="w-4 h-4" />}
              <span>{adToDisplay.ctaText || 'En savoir plus'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2) Native Sponsored Publication in Feed
  if (placement === 'home_sponsored') {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border-2 border-orange-500/30 dark:border-orange-500/20 relative my-3 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold text-xs border border-orange-500/30">
              {adToDisplay.advertiserName?.charAt(0) || 'A'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-900 dark:text-white">
                  {adToDisplay.advertiserName || 'Annonceur Partenaire'}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">Publicité sponsorisée</span>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-400 font-extrabold text-[10px] uppercase tracking-wider">
            Sponsorisé
          </span>
        </div>

        <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-2 leading-snug">
          {adToDisplay.title}
        </h4>

        {adToDisplay.description && (
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
            {adToDisplay.description}
          </p>
        )}

        {adToDisplay.mediaUrl && (
          <div className="rounded-xl overflow-hidden mb-3 max-h-64 relative bg-gray-100 dark:bg-gray-900">
            {adToDisplay.format === 'video' ? (
              <video 
                src={adToDisplay.mediaUrl} 
                controls 
                className="w-full h-auto max-h-64 object-cover"
              />
            ) : (
              <img 
                src={adToDisplay.mediaUrl} 
                alt={adToDisplay.title} 
                className="w-full h-auto max-h-64 object-cover"
              />
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/60">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <Tag className="w-3 h-3 text-orange-500" /> Offer exclusive ZAKA+
          </span>
          <button
            onClick={handleCtaClick}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <span>{adToDisplay.ctaText || 'Profiter de l\'offre'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // 3) Recommended Establishment / Event Banner
  if (placement === 'establishment_recommended' || placement === 'event_sponsored') {
    return (
      <div className={`p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-orange-950/40 dark:to-amber-950/30 border border-orange-200 dark:border-orange-800/40 my-3 flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex-shrink-0 flex items-center justify-center font-black text-sm shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider">
                Mise en avant sponsorisée
              </span>
            </div>
            <h5 className="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">
              {adToDisplay.title}
            </h5>
            <p className="text-[11px] text-gray-600 dark:text-gray-300 line-clamp-1">
              {adToDisplay.description || adToDisplay.advertiserName}
            </p>
          </div>
        </div>

        <button
          onClick={handleCtaClick}
          className="flex-shrink-0 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
        >
          {adToDisplay.ctaText || 'Voir'}
        </button>
      </div>
    );
  }

  // 4) Native Messaging Ad Banner
  if (placement === 'messaging_native') {
    return (
      <div className="p-3 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl border border-orange-500/30 my-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <div>
            <span className="font-bold text-gray-900 dark:text-white block">
              {adToDisplay.title}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {adToDisplay.advertiserName} • Sponsorisé
            </span>
          </div>
        </div>
        <button
          onClick={handleCtaClick}
          className="px-2.5 py-1 bg-orange-500 text-white font-bold rounded-md text-[11px] hover:bg-orange-600"
        >
          {adToDisplay.ctaText || 'Contact'}
        </button>
      </div>
    );
  }

  return null;
};
