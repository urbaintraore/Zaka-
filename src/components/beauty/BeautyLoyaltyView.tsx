import React, { useState, useEffect, useMemo } from 'react';
import {
  Gift,
  Award,
  Sparkles,
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  MessageCircle,
  TrendingUp,
  Settings,
  CheckCircle2,
  AlertTriangle,
  History,
  Coins,
  Crown,
  Share2,
  Phone,
  RefreshCw,
  X
} from 'lucide-react';
import {
  BeautySalon,
  BeautyLoyaltySettings,
  BeautyLoyaltyAccount,
  BeautyReward,
  BeautyRewardType,
  BeautyLoyaltyTransaction
} from '../../types';
import {
  fetchLoyaltySettings,
  saveLoyaltySettings,
  fetchLoyaltyRewards,
  saveLoyaltyReward,
  deleteLoyaltyReward,
  fetchSalonLoyaltyAccounts,
  adjustClientPoints,
  formatFcfa
} from '../../lib/beautyService';

interface BeautyLoyaltyViewProps {
  salon: BeautySalon;
  currentUser?: any;
}

export function BeautyLoyaltyView({ salon, currentUser }: BeautyLoyaltyViewProps) {
  const [activeTab, setActiveTab] = useState<'accounts' | 'rewards' | 'settings'>('accounts');
  const [settings, setSettings] = useState<BeautyLoyaltySettings | null>(null);
  const [accounts, setAccounts] = useState<BeautyLoyaltyAccount[]>([]);
  const [rewards, setRewards] = useState<BeautyReward[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');

  // Manual Adjust Modal
  const [selectedAccountForAdjust, setSelectedAccountForAdjust] = useState<BeautyLoyaltyAccount | null>(null);
  const [adjustPoints, setAdjustPoints] = useState<number>(10);
  const [adjustReason, setAdjustReason] = useState('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  // Reward Modal
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [editingReward, setEditingReward] = useState<BeautyReward | null>(null);
  const [rewardTitle, setRewardTitle] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');
  const [rewardPoints, setRewardPoints] = useState<number>(50);
  const [rewardType, setRewardType] = useState<BeautyRewardType>('reduction_pourcentage');
  const [rewardValue, setRewardValue] = useState<number>(10);
  const [isSavingReward, setIsSavingReward] = useState(false);

  // Settings Form
  const [fcfaParPoint, setFcfaParPoint] = useState<number>(1000);
  const [pointValeurFcfa, setPointValeurFcfa] = useState<number>(10);
  const [seuilArgent, setSeuilArgent] = useState<number>(100);
  const [seuilOr, setSeuilOr] = useState<number>(250);
  const [seuilPlatine, setSeuilPlatine] = useState<number>(500);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Notifications
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sett, accs, rews] = await Promise.all([
        fetchLoyaltySettings(salon.id),
        fetchSalonLoyaltyAccounts(salon.id),
        fetchLoyaltyRewards(salon.id, false)
      ]);

      setSettings(sett);
      setAccounts(accs);
      setRewards(rews);

      if (sett) {
        setFcfaParPoint(sett.tauxGainFcfaParPoint);
        setPointValeurFcfa(sett.valeurPointFcfa);
        setSeuilArgent(sett.seuilsNiveaux.argent);
        setSeuilOr(sett.seuilsNiveaux.or);
        setSeuilPlatine(sett.seuilsNiveaux.platine);
      }
    } catch (err) {
      console.warn('Erreur chargement fidélité:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [salon.id]);

  // Handle Manual Points Adjustment
  const handleSavePointsAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccountForAdjust) return;

    setIsAdjusting(true);
    try {
      await adjustClientPoints(
        selectedAccountForAdjust.id,
        Number(adjustPoints),
        adjustReason.trim() || 'Ajustement manuel par le gérant'
      );

      await loadData();
      setSelectedAccountForAdjust(null);
      setNotification({
        type: 'success',
        text: `Solde de ${selectedAccountForAdjust.clientNom} ajusté de ${adjustPoints > 0 ? '+' : ''}${adjustPoints} pts.`
      });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Erreur ajustement points.' });
    } finally {
      setIsAdjusting(false);
    }
  };

  // Handle Save Reward
  const handleSaveReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardTitle.trim()) {
      setNotification({ type: 'error', text: 'Veuillez saisir un titre pour la récompense.' });
      return;
    }

    setIsSavingReward(true);
    try {
      await saveLoyaltyReward({
        id: editingReward?.id,
        salonId: salon.id,
        titre: rewardTitle.trim(),
        description: rewardDescription.trim() || undefined,
        pointsRequis: Number(rewardPoints),
        typeRecompense: rewardType,
        valeurReduction: Number(rewardValue) || undefined,
        actif: true
      });

      await loadData();
      setIsRewardModalOpen(false);
      setNotification({
        type: 'success',
        text: `Récompense « ${rewardTitle} » enregistrée avec succès.`
      });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Erreur sauvegarde récompense.' });
    } finally {
      setIsSavingReward(false);
    }
  };

  // Delete Reward
  const handleDeleteReward = async (id: string, title: string) => {
    if (!confirm(`Supprimer la récompense « ${title} » ?`)) return;
    try {
      await deleteLoyaltyReward(id);
      setRewards(prev => prev.filter(r => r.id !== id));
      setNotification({ type: 'success', text: 'Récompense supprimée.' });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Erreur suppression.' });
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await saveLoyaltySettings({
        salonId: salon.id,
        actif: true,
        montantStepFcfa: Number(fcfaParPoint) || 1000,
        pointsGagnesParStep: Number(pointValeurFcfa) || 10,
        tauxGainFcfaParPoint: Number(fcfaParPoint) || 1000,
        valeurPointFcfa: Number(pointValeurFcfa) || 10,
        seuilsNiveaux: {
          bronze: 0,
          argent: Number(seuilArgent) || 100,
          or: Number(seuilOr) || 250,
          platine: Number(seuilPlatine) || 500
        }
      });

      await loadData();
      setNotification({ type: 'success', text: 'Paramètres du programme fidélité enregistrés !' });
    } catch (err: any) {
      setNotification({ type: 'error', text: err.message || 'Erreur sauvegarde paramètres.' });
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Send WhatsApp loyalty notification
  const handleSendWhatsAppLoyalty = (acc: BeautyLoyaltyAccount) => {
    const phone = (acc.clientTelephone || '').replace(/\D/g, '');
    const targetPhone = phone.startsWith('226') ? phone : phone ? `226${phone}` : '';
    const text = `Bonjour ${acc.clientNom} ! ✨\n\nVous avez actuellement *${acc.pointsSolde} points* sur votre compte fidélité chez *${salon.nom}* (Niveau ${acc.niveau.toUpperCase()}) 👑.\n\nVenez profiter de vos réductions et soins offerts lors de votre prochaine visite ! 💇‍♀️\n\nÀ très vite !`;
    const url = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Filter accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      if (tierFilter !== 'all' && acc.niveau !== tierFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = acc.clientNom?.toLowerCase().includes(term);
        const matchesPhone = acc.clientTelephone?.includes(term);
        if (!matchesName && !matchesPhone) return false;
      }
      return true;
    });
  }, [accounts, tierFilter, searchTerm]);

  // Aggregate stats
  const totalPointsCirculating = useMemo(() => {
    return accounts.reduce((sum, a) => sum + a.pointsSolde, 0);
  }, [accounts]);

  const totalMembers = accounts.length;

  const TIER_BADGES: Record<string, { label: string; color: string; icon: string }> = {
    bronze: { label: 'Bronze', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300', icon: '🥉' },
    argent: { label: 'Argent', color: 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200', icon: '🥈' },
    or: { label: 'Or', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300', icon: '🥇' },
    platine: { label: 'Platine', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300', icon: '👑' }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Gift className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <span>Programme Fidélité</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                ZAKA Beauty Rewards
              </span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Cumul de points automatique en caisse, récompenses et statuts VIP.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-750 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('accounts')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'accounts'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Clients ({accounts.length})
            </button>
            <button
              onClick={() => setActiveTab('rewards')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'rewards'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Catalogue Récompenses ({rewards.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Configuration
            </button>
          </div>

          {activeTab === 'rewards' && (
            <button
              onClick={() => {
                setEditingReward(null);
                setRewardTitle('');
                setRewardDescription('');
                setRewardPoints(50);
                setRewardType('reduction_pourcentage');
                setRewardValue(10);
                setIsRewardModalOpen(true);
              }}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Créer Récompense</span>
            </button>
          )}
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            <span>{notification.text}</span>
          </div>
          <button onClick={() => setNotification(null)}>
            <X className="w-4 h-4 text-gray-400 hover:text-gray-700" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-gray-400">Points en Circulation</span>
            <p className="text-lg font-extrabold text-gray-900 dark:text-white">
              {totalPointsCirculating.toLocaleString('fr-FR')} <span className="text-xs font-normal text-gray-400">pts</span>
            </p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-gray-400">Clients Adhérents</span>
            <p className="text-lg font-extrabold text-gray-900 dark:text-white">
              {totalMembers} <span className="text-xs font-normal text-gray-400">membres</span>
            </p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-gray-400">Barème Actif</span>
            <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
              1 pt = {formatFcfa(settings?.tauxGainFcfaParPoint || 1000)}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CLIENT LOYALTY DIRECTORY                                          */}
      {/* ========================================================================= */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Rechercher un adhérent par nom ou téléphone..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:border-amber-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={tierFilter}
                onChange={e => setTierFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 outline-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="bronze">🥉 Bronze</option>
                <option value="argent">🥈 Argent</option>
                <option value="or">🥇 Or</option>
                <option value="platine">👑 Platine VIP</option>
              </select>

              <button
                onClick={loadData}
                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Niveau Statut</th>
                    <th className="px-5 py-3 text-center">Solde Points</th>
                    <th className="px-5 py-3 text-right">Dépenses Cumulées</th>
                    <th className="px-5 py-3 text-center">Dernière Visite</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                        Aucun adhérent trouvé. Les points sont automatiquement attribués lors des encaissements en caisse.
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map(acc => {
                      const tierBadge = TIER_BADGES[acc.niveau] || TIER_BADGES.bronze;
                      const lastVisit = acc.derniereVisite ? new Date(acc.derniereVisite) : null;

                      return (
                        <tr key={acc.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-750/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="font-bold text-gray-900 dark:text-white">
                              {acc.clientNom}
                            </div>
                            <div className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3" />
                              <span>{acc.clientTelephone}</span>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <span className={`inline-flex items-center gap-1 font-bold text-[10px] px-2.5 py-1 rounded-full ${tierBadge.color}`}>
                              <span>{tierBadge.icon}</span>
                              <span>{tierBadge.label}</span>
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-center">
                            <span className="font-black text-sm text-amber-600 dark:text-amber-400">
                              {acc.pointsSolde} pts
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-right font-medium text-gray-600 dark:text-gray-300">
                            {formatFcfa(acc.montantTotalDepenseFcfa)}
                          </td>

                          <td className="px-5 py-3.5 text-center text-gray-400 text-[11px]">
                            {lastVisit
                              ? lastVisit.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                              : '—'}
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleSendWhatsAppLoyalty(acc)}
                                title="Notifier sur WhatsApp"
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg transition-colors"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => {
                                  setSelectedAccountForAdjust(acc);
                                  setAdjustPoints(10);
                                  setAdjustReason('');
                                }}
                                title="Ajuster les points"
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors"
                              >
                                <Coins className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: REWARDS CATALOG                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'rewards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.length === 0 ? (
            <div className="col-span-3 p-12 text-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 text-gray-400">
              <Gift className="w-10 h-10 mx-auto mb-2 text-gray-300" />
              <p className="font-bold text-sm text-gray-700 dark:text-gray-300">Aucune récompense configurée</p>
              <p className="text-xs mt-1">Créez des bons de réductions ou des prestations offertes échangeables contre des points.</p>
            </div>
          ) : (
            rewards.map(rew => (
              <div
                key={rew.id}
                className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3 relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                    {rew.pointsRequis} points requis
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingReward(rew);
                        setRewardTitle(rew.titre);
                        setRewardDescription(rew.description || '');
                        setRewardPoints(rew.pointsRequis);
                        setRewardType(rew.typeRecompense);
                        setRewardValue(rew.valeurReduction || 0);
                        setIsRewardModalOpen(true);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-700"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteReward(rew.id, rew.titre)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                  {rew.titre}
                </h3>

                {rew.description && (
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {rew.description}
                  </p>
                )}

                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-400">
                  <span>Type :</span>
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {rew.typeRecompense === 'reduction_pourcentage'
                      ? `-${rew.valeurReduction}% sur prestation`
                      : rew.typeRecompense === 'reduction_montant'
                      ? `-${formatFcfa(rew.valeurReduction)} de remise`
                      : rew.typeRecompense === 'service_offert'
                      ? 'Prestation 100% offerte'
                      : 'Cadeau / Produit offert'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SETTINGS FORM                                                     */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="p-6 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-6 max-w-2xl">
          <div>
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-500" />
              <span>Règles de Calcul & Seuils VIP</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Définissez comment vos clients cumulent des points et grimpent en statut.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Montant dépensé pour 1 point (FCFA)
                </label>
                <input
                  type="number"
                  min="100"
                  required
                  value={fcfaParPoint}
                  onChange={e => setFcfaParPoint(Number(e.target.value) || 1000)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Ex: 1 000 FCFA = 1 point gagné en caisse</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Valeur de conversion point (FCFA)
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={pointValeurFcfa}
                  onChange={e => setPointValeurFcfa(Number(e.target.value) || 10)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Ex: 1 point = 10 FCFA de pouvoir d'achat</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Seuils de Passage de Niveaux VIP
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    🥈 Seuil Argent (pts)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={seuilArgent}
                    onChange={e => setSeuilArgent(Number(e.target.value) || 100)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    🥇 Seuil Or (pts)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={seuilOr}
                    onChange={e => setSeuilOr(Number(e.target.value) || 250)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    👑 Seuil Platine (pts)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={seuilPlatine}
                    onChange={e => setSeuilPlatine(Number(e.target.value) || 500)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              {isSavingSettings ? 'Enregistrement...' : 'Sauvegarder les paramètres'}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANUAL POINTS ADJUSTMENT                                          */}
      {/* ========================================================================= */}
      {selectedAccountForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-amber-50 dark:bg-amber-950/30">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span>Ajuster les Points</span>
              </h3>
              <button onClick={() => setSelectedAccountForAdjust(null)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-700" />
              </button>
            </div>

            <form onSubmit={handleSavePointsAdjustment} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <span className="text-gray-400 text-[10px] block">Client :</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedAccountForAdjust.clientNom}</span>
                <span className="text-xs text-amber-600 font-bold block mt-0.5">
                  Solde actuel : {selectedAccountForAdjust.pointsSolde} pts
                </span>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Nombre de points à ajouter (+) ou déduire (-)
                </label>
                <input
                  type="number"
                  required
                  value={adjustPoints}
                  onChange={e => setAdjustPoints(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-black outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Motif / Raison
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  placeholder="Ex: Geste commercial, compensation retard..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setSelectedAccountForAdjust(null)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isAdjusting}
                  className="px-5 py-2 bg-amber-500 text-white font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  {isAdjusting ? 'Validation...' : 'Valider'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE / EDIT REWARD                                              */}
      {/* ========================================================================= */}
      {isRewardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Gift className="w-4 h-4 text-amber-500" />
                <span>{editingReward ? 'Modifier la Récompense' : 'Nouvelle Récompense'}</span>
              </h3>
              <button onClick={() => setIsRewardModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-700" />
              </button>
            </div>

            <form onSubmit={handleSaveReward} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Intitulé de la récompense *
                </label>
                <input
                  type="text"
                  required
                  value={rewardTitle}
                  onChange={e => setRewardTitle(e.target.value)}
                  placeholder="Ex: -20% sur la prochaine pose, Shampoing offert..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Points Requis *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={rewardPoints}
                    onChange={e => setRewardPoints(Number(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Type d'avantage
                  </label>
                  <select
                    value={rewardType}
                    onChange={e => setRewardType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold outline-none"
                  >
                    <option value="reduction_pourcentage">Pourcentage (%)</option>
                    <option value="reduction_montant">Montant fixe (FCFA)</option>
                    <option value="service_offert">Prestation offerte</option>
                    <option value="produit_offert">Produit offert</option>
                  </select>
                </div>
              </div>

              {(rewardType === 'reduction_pourcentage' || rewardType === 'reduction_montant') && (
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Valeur de la réduction {rewardType === 'reduction_pourcentage' ? '(%)' : '(FCFA)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={rewardValue}
                    onChange={e => setRewardValue(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Conditions / Description
                </label>
                <textarea
                  rows={2}
                  value={rewardDescription}
                  onChange={e => setRewardDescription(e.target.value)}
                  placeholder="Ex: Valable du lundi au jeudi sur toute tresse..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsRewardModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingReward}
                  className="px-5 py-2 bg-amber-500 text-white font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  {isSavingReward ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export const LoyaltyRewardsView = BeautyLoyaltyView;

