import React, { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store';
import { AdPlacementType, Ad } from '../types';
import { Sparkles, ExternalLink, Phone, MessageSquare, Calendar, ChevronRight, ShieldCheck, Tag, Info, X, MapPin, Building, InfoIcon } from 'lucide-react';

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
  const { ads, campaigns, trackAdImpression, trackAdClick, establishments } = useAppStore();
  const trackedRef = useRef<Set<string>>(new Set());
  const [selectedAdForDetail, setSelectedAdForDetail] = useState<Ad | null>(null);

  // Normalize placement name for alias compatibility
  const normalizePlacement = (p: string): AdPlacementType => {
    if (p === 'home_header' || p === 'home_banner') return 'home_banner';
    if (p === 'home_sponsored' || p === 'feed_native') return 'home_sponsored';
    if (p === 'establishment_detail' || p === 'establishment_recommended') return 'establishment_recommended';
    return p as AdPlacementType;
  };

  const targetPlacement = normalizePlacement(placement);

  // Filter active ads matching placement & active status
  const activeAds = ads.filter(ad => {
    if (ad.status !== 'active') return false;
    if (!ad.placements || !ad.placements.some(p => normalizePlacement(p) === targetPlacement)) return false;

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

  const campaignToDisplay = campaigns.find(c => c.id === adToDisplay.campaignId);

  const handleCtaClick = (e: React.MouseEvent, ad: Ad = adToDisplay) => {
    e.stopPropagation();
    trackAdClick(ad.id);

    const link = ad.ctaLink || '';
    if (ad.ctaText === 'WhatsApp') {
      const phone = link.replace(/[^\d+]/g, '');
      window.open(`https://wa.me/${phone || '22670000000'}?text=${encodeURIComponent(`Bonjour, je vous contacte depuis ZAKA+ concernant votre annonce "${ad.title}"`)}`, '_blank');
    } else if (ad.ctaText === 'Appeler') {
      window.open(`tel:${link || '+22670000000'}`, '_self');
    } else if (link.startsWith('http')) {
      window.open(link, '_blank');
    } else {
      setSelectedAdForDetail(ad);
    }
  };

  const openAdDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedAdForDetail(adToDisplay);
  };

  return (
    <>
      {/* 1) Home Banner Format */}
      {targetPlacement === 'home_banner' && (
        <div 
          onClick={openAdDetails}
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-orange-950 text-white shadow-xl border border-orange-500/20 my-4 cursor-pointer group ${className}`}
        >
          <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-orange-500/30 text-[10px] font-black text-orange-400 uppercase tracking-widest">
            <Sparkles className="w-3 h-3 text-orange-400 animate-pulse" />
            ZAKA Ads
          </div>

          <div className="flex flex-col md:flex-row items-center">
            {adToDisplay.mediaUrl && (
              <div className="w-full md:w-1/2 h-44 md:h-52 overflow-hidden relative">
                <img 
                  src={adToDisplay.mediaUrl} 
                  alt={adToDisplay.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent md:hidden" />
              </div>
            )}

            <div className={`p-5 w-full ${adToDisplay.mediaUrl ? 'md:w-1/2' : 'w-full'}`}>
              <span className="text-xs font-bold text-orange-400 uppercase tracking-wider block mb-1">
                {adToDisplay.advertiserName || 'Sponsorisé'}
              </span>
              <h3 className="text-lg font-black text-white leading-snug mb-2 group-hover:text-orange-300 transition-colors">
                {adToDisplay.title}
              </h3>
              {adToDisplay.description && (
                <p className="text-xs text-gray-300 line-clamp-2 mb-4 leading-relaxed">
                  {adToDisplay.description}
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={(e) => handleCtaClick(e, adToDisplay)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/30 transition-all transform active:scale-95 cursor-pointer"
                >
                  {adToDisplay.ctaText === 'WhatsApp' && <MessageSquare className="w-3.5 h-3.5" />}
                  {adToDisplay.ctaText === 'Appeler' && <Phone className="w-3.5 h-3.5" />}
                  {adToDisplay.ctaText === 'Réserver' && <Calendar className="w-3.5 h-3.5" />}
                  {(!adToDisplay.ctaText || ['Découvrir', 'Acheter'].includes(adToDisplay.ctaText)) && <ExternalLink className="w-3.5 h-3.5" />}
                  <span>{adToDisplay.ctaText || 'Profiter de l\'offre'}</span>
                </button>

                <button
                  onClick={openAdDetails}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl backdrop-blur-sm transition-all cursor-pointer"
                >
                  <Info className="w-3.5 h-3.5 text-orange-300" />
                  <span>Détails & Infos</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2) Native Sponsored Publication in Feed */}
      {targetPlacement === 'home_sponsored' && (
        <div 
          onClick={openAdDetails}
          className={`bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border-2 border-orange-500/30 dark:border-orange-500/20 relative my-3 cursor-pointer hover:border-orange-500 transition-colors ${className}`}
        >
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
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 leading-relaxed line-clamp-3">
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

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/60 flex-wrap gap-2">
            <button
              onClick={openAdDetails}
              className="text-[11px] text-orange-600 dark:text-orange-400 font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" /> Voir tous les détails & guide
            </button>
            <button
              onClick={(e) => handleCtaClick(e, adToDisplay)}
              className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-lg transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              <span>{adToDisplay.ctaText || 'Profiter de l\'offre'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 3) Recommended Establishment / Event Banner */}
      {(targetPlacement === 'establishment_recommended' || targetPlacement === 'event_sponsored') && (
        <div 
          onClick={openAdDetails}
          className={`p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-orange-950/40 dark:to-amber-950/30 border border-orange-200 dark:border-orange-800/40 my-3 flex items-center justify-between gap-3 cursor-pointer hover:border-orange-400 transition-colors ${className}`}
        >
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

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={openAdDetails}
              className="px-2.5 py-1.5 bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 text-xs font-bold rounded-lg hover:bg-orange-200 transition-colors"
            >
              Détails
            </button>
            <button
              onClick={(e) => handleCtaClick(e, adToDisplay)}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              {adToDisplay.ctaText || 'Voir'}
            </button>
          </div>
        </div>
      )}

      {/* 4) Native Messaging Ad Banner */}
      {targetPlacement === 'messaging_native' && (
        <div 
          onClick={openAdDetails}
          className="p-3 bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl border border-orange-500/30 my-2 flex items-center justify-between text-xs cursor-pointer"
        >
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
            onClick={(e) => handleCtaClick(e, adToDisplay)}
            className="px-2.5 py-1 bg-orange-500 text-white font-bold rounded-md text-[11px] hover:bg-orange-600"
          >
            {adToDisplay.ctaText || 'Ouvrir'}
          </button>
        </div>
      )}

      {/* DETAILED AD MODAL FOR GUIDING USERS */}
      {selectedAdForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col border border-gray-100 dark:border-gray-700">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/60 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 shrink-0">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-wider border border-orange-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-orange-500" /> ZAKA Ads • Annonce Sponsorisée
                </span>
              </div>
              <button
                onClick={() => setSelectedAdForDetail(null)}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white bg-gray-100 dark:bg-gray-700 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {/* Media Preview */}
              {selectedAdForDetail.mediaUrl && (
                <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-700 max-h-60 relative bg-black">
                  {selectedAdForDetail.format === 'video' ? (
                    <video src={selectedAdForDetail.mediaUrl} controls autoPlay muted className="w-full h-auto max-h-60 object-cover" />
                  ) : (
                    <img src={selectedAdForDetail.mediaUrl} alt={selectedAdForDetail.title} className="w-full h-auto max-h-60 object-cover" />
                  )}
                </div>
              )}

              {/* Title & Advertiser Header */}
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                    {selectedAdForDetail.advertiserName || 'Annonceur Partenaire'}
                  </span>
                  <ShieldCheck className="w-4 h-4 text-orange-500" />
                </div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">
                  {selectedAdForDetail.title}
                </h2>
              </div>

              {/* Targeting Cities & Location Info */}
              {campaignToDisplay?.targeting?.cities && campaignToDisplay.targeting.cities.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                  <MapPin className="w-4 h-4 text-orange-500 shrink-0" />
                  <span><strong>Villes ciblées :</strong> {campaignToDisplay.targeting.cities.join(', ')}</span>
                </div>
              )}

              {/* Detailed Description */}
              <div className="bg-orange-50/40 dark:bg-orange-950/20 p-4 rounded-2xl border border-orange-100 dark:border-orange-900/30">
                <h4 className="text-xs font-extrabold uppercase text-orange-800 dark:text-orange-300 tracking-wider mb-2 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-orange-500" /> Description Complète
                </h4>
                <p className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                  {selectedAdForDetail.description || 'Aucune description supplémentaire renseignée.'}
                </p>
              </div>

              {/* Guidance Box for Users */}
              <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-2">
                <h4 className="text-xs font-black uppercase text-blue-900 dark:text-blue-300 tracking-wider flex items-center gap-2">
                  <InfoIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Comment réagir à cette annonce ?</span>
                </h4>
                <ul className="text-xs text-blue-950 dark:text-blue-200 space-y-1.5 list-disc pl-4 font-medium">
                  <li>Utilisez le bouton de contact direct ci-dessous pour joindre l'annonceur en 1 clic.</li>
                  <li>Mentionnez que vous venez de la plateforme <strong>ZAKA+</strong> pour bénéficier d'offres préférentielles.</li>
                  <li>Si vous souhaitez réserver ou commander, privilégiez le contact via WhatsApp ou Téléphone.</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-5 border-t border-gray-100 dark:border-gray-700/60 bg-gray-50/50 dark:bg-gray-800/50 shrink-0 flex items-center gap-2">
              <button
                onClick={() => setSelectedAdForDetail(null)}
                className="py-3 px-4 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-800 dark:text-gray-200 font-bold rounded-xl active:scale-95 transition-all cursor-pointer text-xs"
              >
                Fermer
              </button>

              <button
                onClick={(e) => {
                  handleCtaClick(e, selectedAdForDetail);
                  setSelectedAdForDetail(null);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold rounded-xl shadow-lg shadow-orange-500/20 active:scale-95 transition-all cursor-pointer text-xs flex items-center justify-center gap-2"
              >
                {selectedAdForDetail.ctaText === 'WhatsApp' && <MessageSquare className="w-4 h-4" />}
                {selectedAdForDetail.ctaText === 'Appeler' && <Phone className="w-4 h-4" />}
                {selectedAdForDetail.ctaText === 'Réserver' && <Calendar className="w-4 h-4" />}
                {(!selectedAdForDetail.ctaText || ['Découvrir', 'Acheter'].includes(selectedAdForDetail.ctaText)) && <ExternalLink className="w-4 h-4" />}
                <span>{selectedAdForDetail.ctaText ? `Contacter (${selectedAdForDetail.ctaText})` : 'Contacter l\'Annonceur'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
