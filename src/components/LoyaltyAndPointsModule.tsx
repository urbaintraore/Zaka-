import { useState } from 'react';
import { Establishment } from '../types';
import { useAppStore } from '../store';
import { Gift, Award, CheckCircle2, Ticket, Sparkles, RefreshCw, Layers } from 'lucide-react';

interface LoyaltyAndPointsModuleProps {
  establishment: Establishment;
}

export function LoyaltyAndPointsModule({ establishment }: LoyaltyAndPointsModuleProps) {
  const { currentUser, loyaltyCards, zakaRedemptions, updateLoyaltyConfig, updateZakaPointsConfig, consumeLoyaltyReward, redeemZakaPoints, consumeZakaRedemption } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Settings state for Gérant
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(establishment.loyaltyEnabled || false);
  const [reqVisits, setReqVisits] = useState(establishment.loyaltyRequiredVisits || 5);
  const [loyaltyReward, setLoyaltyReward] = useState(establishment.loyaltyReward || "5ème visite : 1 conso offerte");

  const [acceptsZaka, setAcceptsZaka] = useState(establishment.acceptsZakaPoints || false);
  const [zakaCost, setZakaCost] = useState(establishment.zakaPointsCost || 100);
  const [zakaReward, setZakaReward] = useState(establishment.zakaPointsReward || "100 pts = 1 conso gratuite");

  const isOwner = currentUser && (currentUser.id === establishment.ownerId || currentUser.role === 'admin');

  // Client loyalty card for this establishment
  const clientCard = currentUser ? loyaltyCards.find(c => c.clientId === currentUser.id && c.establishmentId === establishment.id) : null;
  const visitCount = clientCard?.visitCount || 0;
  const required = establishment.loyaltyRequiredVisits || 5;
  const rewardUnlocked = clientCard?.rewardUnlocked || visitCount >= required;

  // Unlocked loyalty cards for manager
  const managerLoyaltyCards = loyaltyCards.filter(c => c.establishmentId === establishment.id && c.rewardUnlocked);

  // Zaka redemptions for this establishment
  const estRedemptions = zakaRedemptions.filter(r => r.establishmentId === establishment.id);
  const myRedemptions = currentUser ? zakaRedemptions.filter(r => r.clientId === currentUser.id && r.establishmentId === establishment.id) : [];

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      await updateLoyaltyConfig(establishment.id, loyaltyEnabled, reqVisits, loyaltyReward);
      await updateZakaPointsConfig(establishment.id, acceptsZaka, zakaCost, zakaReward);
      alert("Configurations de fidélité enregistrées avec succès !");
    } catch (err: any) {
      alert("Erreur lors de l'enregistrement: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemZaka = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const code = await redeemZakaPoints(establishment.id, establishment.zakaPointsCost || 100, establishment.zakaPointsReward || "1 conso offerte");
      setGeneratedCode(code);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'échange de points");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 my-4">
      {/* GÉRANT MANAGEMENT PANEL */}
      {isOwner && (
        <div className="p-5 bg-gradient-to-br from-amber-50/80 to-amber-100/30 dark:from-amber-950/20 dark:to-gray-900 rounded-2xl border border-amber-200/60 dark:border-amber-800/40">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-bold text-gray-900 dark:text-white">Gestion de la Fidélité Client</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Etablissement Loyalty Stamps Config */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-amber-200/40 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-xs text-gray-800 dark:text-gray-200">Carte de Fidélité (Tampons)</label>
                <input
                  type="checkbox"
                  checked={loyaltyEnabled}
                  onChange={e => setLoyaltyEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
              </div>

              {loyaltyEnabled && (
                <div className="space-y-2 pt-2 text-xs">
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1">Nombre de visites requises :</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={reqVisits}
                      onChange={e => setReqVisits(parseInt(e.target.value) || 5)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1">Récompense offerte :</label>
                    <input
                      type="text"
                      value={loyaltyReward}
                      onChange={e => setLoyaltyReward(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Ex: 5e entrée offerte ou 1 boisson"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 2. Unified Zaka Points Config */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-amber-200/40 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-xs text-gray-800 dark:text-gray-200">Accepter les Points Zaka</label>
                <input
                  type="checkbox"
                  checked={acceptsZaka}
                  onChange={e => setAcceptsZaka(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                />
              </div>

              {acceptsZaka && (
                <div className="space-y-2 pt-2 text-xs">
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1">Coût en points Zaka :</label>
                    <input
                      type="number"
                      step={50}
                      min={50}
                      value={zakaCost}
                      onChange={e => setZakaCost(parseInt(e.target.value) || 100)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 dark:text-gray-400 mb-1">Récompense obtenue contre ces points :</label>
                    <input
                      type="text"
                      value={zakaReward}
                      onChange={e => setZakaReward(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-800 text-gray-900 dark:text-white"
                      placeholder="Ex: 100 pts = 1 boisson offerte"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveConfig}
              disabled={loading}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Enregistrer les paramètres de fidélité
            </button>
          </div>

          {/* MANAGER: List of unlocked loyalty cards & redemptions to validate */}
          <div className="mt-6 border-t border-amber-200/60 dark:border-gray-800 pt-4 space-y-4">
            <h4 className="font-semibold text-xs text-gray-800 dark:text-gray-200 uppercase tracking-wider">
              Récompenses clients à valider
            </h4>

            {managerLoyaltyCards.length === 0 && estRedemptions.filter(r => r.status === 'valide').length === 0 ? (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">Aucune récompense en attente de consommation.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Stamp card rewards */}
                {managerLoyaltyCards.map(card => (
                  <div key={card.id} className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-amber-300 dark:border-amber-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-gray-900 dark:text-white">{card.clientName || 'Client'}</p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">🎁 Carte Tampons ({card.visitCount} visites)</p>
                    </div>
                    <button
                      onClick={() => consumeLoyaltyReward(card.id)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-xs"
                    >
                      Valider l'offre
                    </button>
                  </div>
                ))}

                {/* Zaka point voucher codes */}
                {estRedemptions.filter(r => r.status === 'valide').map(red => (
                  <div key={red.id} className="p-3 bg-white dark:bg-gray-900 rounded-xl border border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-xs text-gray-900 dark:text-white">{red.clientName}</p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono font-bold">Code: {red.code}</p>
                      <p className="text-[10px] text-gray-500">{red.reward}</p>
                    </div>
                    <button
                      onClick={() => consumeZakaRedemption(red.id)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-xs"
                    >
                      Valider le bon
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* PUBLIC CLIENT VIEW: Stamp Card & Points Redemption */}
      {(!isOwner || currentUser?.role === 'client') && (establishment.loyaltyEnabled || establishment.acceptsZakaPoints) && (
        <div className="p-5 bg-gradient-to-br from-amber-50/60 to-amber-100/20 dark:from-gray-900 dark:to-amber-950/20 rounded-2xl border border-amber-200/60 dark:border-gray-800 space-y-5">
          {/* Section Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm">Fidélité & Avantages</h3>
            </div>
            {currentUser && (
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                ⭐ {currentUser.points || 0} Points Zaka
              </span>
            )}
          </div>

          {/* 1. Establishment Stamp Card */}
          {establishment.loyaltyEnabled && (
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-amber-200/40 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-gray-900 dark:text-white">Carte Tampons ({establishment.name})</h4>
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                    🎁 Offre : {establishment.loyaltyReward || "Récompense spéciale"}
                  </p>
                </div>
                {rewardUnlocked && (
                  <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold rounded-full border border-emerald-300 flex items-center gap-1 animate-bounce">
                    <Sparkles className="w-3.5 h-3.5" />
                    Offre débloquée !
                  </span>
                )}
              </div>

              {/* Stamps Progress Grid */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {Array.from({ length: required }).map((_, idx) => {
                  const isStamped = idx < visitCount;
                  return (
                    <div
                      key={idx}
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                        isStamped
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs scale-105'
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      {isStamped ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-gray-500 dark:text-gray-400 italic">
                Affichez un avis ou cliquez sur « J'y suis allé » dans votre carnet de sorties pour ajouter un tampon !
              </p>
            </div>
          )}

          {/* 2. Zaka Points Redemption at this Establishment */}
          {establishment.acceptsZakaPoints && (
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-amber-200/40 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-gray-900 dark:text-white">Échanger mes points Zaka</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {establishment.zakaPointsReward || "100 pts Zaka = 1 conso offerte"}
                  </p>
                </div>
                <button
                  onClick={handleRedeemZaka}
                  disabled={loading || !currentUser || (currentUser.points || 0) < (establishment.zakaPointsCost || 100)}
                  className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold rounded-lg shadow-xs disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-all"
                >
                  <Ticket className="w-3.5 h-3.5" />
                  Utiliser {establishment.zakaPointsCost || 100} pts
                </button>
              </div>

              {errorMsg && (
                <p className="text-xs text-rose-600 font-medium">{errorMsg}</p>
              )}

              {generatedCode && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 rounded-lg text-center space-y-1">
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">Code de réduction généré !</p>
                  <p className="text-lg font-mono font-extrabold text-emerald-900 dark:text-emerald-100 tracking-wider select-all">{generatedCode}</p>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400">Présentez ce code au serveur pour en profiter.</p>
                </div>
              )}

              {/* List of active redemptions for user */}
              {myRedemptions.length > 0 && (
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                  <p className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">Mes bons actifs à cet établissement :</p>
                  {myRedemptions.map(r => (
                    <div key={r.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <span className="font-mono font-bold text-amber-700 dark:text-amber-400">{r.code}</span>
                      <span className="text-gray-600 dark:text-gray-300">{r.reward}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${r.status === 'consomme' ? 'bg-gray-200 text-gray-700' : 'bg-emerald-100 text-emerald-800'}`}>
                        {r.status === 'consomme' ? 'Consommé' : 'Valide'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
