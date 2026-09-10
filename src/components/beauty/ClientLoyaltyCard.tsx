import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  Award, 
  Sparkles, 
  TrendingUp, 
  ShoppingBag, 
  CheckCircle2, 
  ChevronRight, 
  RefreshCw, 
  Info,
  Star,
  Store,
  Clock
} from 'lucide-react';
import { 
  fetchAllClientLoyaltyCards, 
  fetchLoyaltyRewards, 
  fetchLoyaltySettings 
} from '../../lib/beautyV2Service';
import { 
  BeautyLoyaltyAccount, 
  BeautyReward, 
  BeautyLoyaltySettings, 
  BeautyLoyaltyTier 
} from '../../types';
import { formatFcfa } from '../../lib/beautyService';

interface ClientLoyaltyCardProps {
  clientId: string;
  clientPhone?: string;
  clientName?: string;
}

interface ExpandedCardData {
  account: BeautyLoyaltyAccount & { salonNom?: string; salonPhoto?: string };
  rewards: BeautyReward[];
  settings: BeautyLoyaltySettings | null;
}

export function ClientLoyaltyCard({ clientId, clientPhone, clientName }: ClientLoyaltyCardProps) {
  const [loyaltyCards, setLoyaltyCards] = useState<ExpandedCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardIdx, setSelectedCardIdx] = useState<number>(0);

  const loadClientLoyaltyData = async () => {
    try {
      setLoading(true);
      const queryKey = clientId || clientPhone || '';
      if (!queryKey) {
        setLoading(false);
        return;
      }

      const cards = await fetchAllClientLoyaltyCards(queryKey);

      const enriched: ExpandedCardData[] = await Promise.all(
        cards.map(async (acc) => {
          const [rewards, settings] = await Promise.all([
            fetchLoyaltyRewards(acc.salonId),
            fetchLoyaltySettings(acc.salonId)
          ]);
          return {
            account: acc,
            rewards: rewards.filter(r => r.actif),
            settings
          };
        })
      );

      setLoyaltyCards(enriched);
    } catch (err) {
      console.warn('Erreur chargement cartes de fidélité client:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientLoyaltyData();
  }, [clientId, clientPhone]);

  const getTierColor = (niveau: BeautyLoyaltyTier) => {
    switch (niveau) {
      case 'platine':
        return 'from-slate-700 via-slate-900 to-slate-800 text-slate-100 border-slate-600';
      case 'or':
        return 'from-amber-500 via-amber-600 to-yellow-600 text-white border-amber-300';
      case 'argent':
        return 'from-gray-400 via-gray-500 to-slate-600 text-white border-gray-300';
      default:
        return 'from-orange-500 via-rose-600 to-amber-600 text-white border-orange-200';
    }
  };

  const getTierBadge = (niveau: BeautyLoyaltyTier) => {
    switch (niveau) {
      case 'platine':
        return { label: 'Platine 👑', color: 'bg-slate-900 text-slate-100' };
      case 'or':
        return { label: 'Or 🌟', color: 'bg-amber-100 text-amber-900' };
      case 'argent':
        return { label: 'Argent 🥈', color: 'bg-gray-200 text-gray-800' };
      default:
        return { label: 'Bronze 🌱', color: 'bg-orange-100 text-orange-900' };
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-950 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-900 text-center py-8">
        <RefreshCw className="w-5 h-5 animate-spin mx-auto text-rose-500 mb-2" />
        <span className="text-xs text-gray-400 font-semibold">Chargement de vos avantages fidélité...</span>
      </div>
    );
  }

  if (loyaltyCards.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-950 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-900 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-500 text-white flex items-center justify-center font-black shadow-sm">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white">
              Fidélité & Récompenses Salons
            </h3>
            <p className="text-[11px] text-gray-400 font-semibold">
              Gagnez des points à chaque passage en caisse chez vos coiffeurs et esthéticiennes
            </p>
          </div>
        </div>

        <div className="p-4 bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-2xl text-xs space-y-2">
          <div className="flex items-center gap-2 font-black text-orange-900 dark:text-orange-200">
            <Sparkles className="w-4 h-4 text-orange-500" />
            <span>Comment cumuler des points ?</span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-[11px]">
            Chaque fois que vous effectuez une prestation ou achetez un produit dans un salon partenaire Zaka Beauty, votre numéro de téléphone accumule automatiquement des points échangeables contre des remises ou soins gratuits.
          </p>
        </div>
      </div>
    );
  }

  const activeCard = loyaltyCards[selectedCardIdx] || loyaltyCards[0];
  const { account, rewards, settings } = activeCard;
  const tierBadge = getTierBadge(account.niveau);
  const stepFcfa = settings?.montantStepFcfa || 1000;
  const pointsParStep = settings?.pointsGagnesParStep || 10;

  return (
    <div className="bg-white dark:bg-gray-950 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-900 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-rose-500 to-pink-600 text-white flex items-center justify-center font-black shadow-sm">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
              <span>Mes Cartes de Fidélité Beauté</span>
              <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold">
                {loyaltyCards.length} salon{loyaltyCards.length > 1 ? 's' : ''}
              </span>
            </h3>
            <p className="text-[11px] text-gray-400 font-semibold">
              Cumul de points & Récompenses exclusives disponibles
            </p>
          </div>
        </div>

        <button
          onClick={loadClientLoyaltyData}
          className="p-2 text-gray-400 hover:text-rose-600 rounded-xl transition-all"
          title="Rafraîchir"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Salon Selector Tabs if multiple cards */}
      {loyaltyCards.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {loyaltyCards.map((c, idx) => (
            <button
              key={c.account.id}
              onClick={() => setSelectedCardIdx(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 border ${
                selectedCardIdx === idx
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>{c.account.salonNom || 'Salon'}</span>
              <span className="text-[10px] opacity-80 font-black ml-1">({c.account.pointsSolde} pts)</span>
            </button>
          ))}
        </div>
      )}

      {/* Virtual Loyalty Pass Card Visual */}
      <div className={`p-6 rounded-3xl bg-gradient-to-br ${getTierColor(account.niveau)} shadow-lg border relative overflow-hidden space-y-4`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase opacity-80">
                Carte Privilège Beauté
              </span>
            </div>
            <h4 className="text-lg font-black text-white mt-0.5">
              {account.salonNom || 'Salon de Beauté'}
            </h4>
          </div>

          <span className={`px-3 py-1 rounded-full text-xs font-black shadow-xs ${tierBadge.color}`}>
            {tierBadge.label}
          </span>
        </div>

        {/* Points Display */}
        <div className="relative z-10 flex items-end justify-between pt-2">
          <div>
            <span className="text-[10px] font-bold uppercase opacity-80 block">Solde de Points</span>
            <span className="text-3xl font-black tracking-tight">{account.pointsSolde} <span className="text-sm font-bold opacity-80">pts</span></span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-bold uppercase opacity-80 block">Total Cumulé</span>
            <span className="text-sm font-black">{account.pointsCumulesTotal} pts</span>
          </div>
        </div>

        {/* Rule banner */}
        <div className="relative z-10 pt-3 border-t border-white/20 flex items-center justify-between text-[11px] font-medium opacity-90">
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            {formatFcfa(stepFcfa)} dépense = +{pointsParStep} pts
          </span>
          {account.dernierAchatDate && (
            <span className="text-[10px] opacity-75">
              Dernier soin : {new Date(account.dernierAchatDate).toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>
      </div>

      {/* Rewards Catalog for Active Salon */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black uppercase text-gray-700 dark:text-gray-300 tracking-wider flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-rose-500" />
            <span>Récompenses Disponibles</span>
          </h4>
          <span className="text-[11px] text-gray-400 font-bold">
            {rewards.length} offre{rewards.length > 1 ? 's' : ''}
          </span>
        </div>

        {rewards.length === 0 ? (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl text-center text-xs text-gray-400">
            Aucune offre actuellement configurée par ce salon.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rewards.map((reward) => {
              const canAfford = account.pointsSolde >= reward.pointsRequis;

              return (
                <div
                  key={reward.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                    canAfford
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                      : 'bg-gray-50 dark:bg-gray-900/60 border-gray-150 dark:border-gray-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="font-bold text-xs text-gray-900 dark:text-white">
                        {reward.titre}
                      </h5>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                        canAfford 
                          ? 'bg-emerald-600 text-white' 
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}>
                        {reward.pointsRequis} pts
                      </span>
                    </div>
                    {reward.description && (
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2">
                        {reward.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-gray-200/60 dark:border-gray-800 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                      {(reward.typeRecompense === 'reduction_pourcentage') && `-${reward.valeurReduction || 0}% sur la prestation`}
                      {(reward.typeRecompense === 'reduction_montant') && `Remise de ${formatFcfa(reward.valeurReduction || 0)}`}
                      {(reward.typeRecompense === 'service_gratuit' || reward.typeRecompense === 'service_offert') && `Prestation offerte`}
                      {(reward.typeRecompense === 'produit_offert' || reward.typeRecompense === 'cadeau') && `Cadeau produit gratuit`}
                    </span>

                    {canAfford ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Déblocable
                      </span>
                    ) : (
                      <span className="text-gray-400 font-medium">
                        Manque {reward.pointsRequis - account.pointsSolde} pts
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
