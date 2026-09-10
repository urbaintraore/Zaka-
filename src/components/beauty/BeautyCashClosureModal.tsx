import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  DollarSign,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  ShieldCheck,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { BeautySale, BeautyCashClosure } from '../../types';
import { createCashClosure, formatFcfa } from '../../lib/beautyService';

interface BeautyCashClosureModalProps {
  salonId: string;
  sales: BeautySale[];
  isOpen: boolean;
  onClose: () => void;
  onClosureCompleted: (closure: BeautyCashClosure) => void;
  caissierNom?: string;
}

export function BeautyCashClosureModal({
  salonId,
  sales,
  isOpen,
  onClose,
  onClosureCompleted,
  caissierNom = 'Gérant'
}: BeautyCashClosureModalProps) {
  const [fondDeCaisse, setFondDeCaisse] = useState<number>(0);
  const [totalReelEspeces, setTotalReelEspeces] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter sales for today that are paid
  const todaySales = sales.filter(
    s => s.dateVente.startsWith(todayStr) && s.statut === 'paye'
  );

  let totalVentes = 0;
  let totalEspeces = 0;
  let totalOrangeMoney = 0;
  let totalMoovMoney = 0;
  let totalWave = 0;
  let totalVirement = 0;
  let totalAutre = 0;

  todaySales.forEach(s => {
    const amt = s.montantTotalFcfa || 0;
    totalVentes += amt;
    switch (s.moyenPaiement) {
      case 'especes':
        totalEspeces += amt;
        break;
      case 'orange_money':
        totalOrangeMoney += amt;
        break;
      case 'moov_money':
        totalMoovMoney += amt;
        break;
      case 'wave':
        totalWave += amt;
        break;
      case 'virement':
        totalVirement += amt;
        break;
      default:
        totalAutre += amt;
        break;
    }
  });

  const totalTheoriqueEspeces = fondDeCaisse + totalEspeces;
  const ecartCaisse = totalReelEspeces - totalTheoriqueEspeces;

  useEffect(() => {
    if (isOpen) {
      setTotalReelEspeces(fondDeCaisse + totalEspeces);
      setErrorMsg('');
    }
  }, [isOpen, fondDeCaisse, totalEspeces]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const now = new Date();
      const heureCloture = now.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });

      const closureData: Omit<BeautyCashClosure, 'id' | 'createdAt'> = {
        salonId,
        dateCloture: todayStr,
        heureCloture,
        caissierNom,
        fondDeCaisseInitialFcfa: Number(fondDeCaisse) || 0,
        totalVentesFcfa: totalVentes,
        totalEspecesFcfa: totalEspeces,
        totalOrangeMoneyFcfa: totalOrangeMoney,
        totalMoovMoneyFcfa: totalMoovMoney,
        totalWaveFcfa: totalWave,
        totalVirementFcfa: totalVirement,
        totalAutreFcfa: totalAutre,
        nombreTransactions: todaySales.length,
        totalReelConstateFcfa: Number(totalReelEspeces) || 0,
        ecartCaisseFcfa: ecartCaisse,
        notes: notes.trim() || undefined,
        statut: 'cloturee'
      };

      const saved = await createCashClosure(closureData);
      onClosureCompleted(saved);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erreur lors de la clôture de caisse.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-slate-900 text-white">
          <div className="flex items-center gap-2 font-bold text-base">
            <Lock className="w-5 h-5 text-rose-400" />
            <span>Clôture Journalière de Caisse</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Date & Info Banner */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl text-xs text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rose-500" />
              <span className="font-semibold text-gray-900 dark:text-white">
                Journée du {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
              <Receipt className="w-4 h-4" />
              <span>{todaySales.length} transaction(s)</span>
            </div>
          </div>

          {/* Breakdown by Payment Method */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Récapitulatif des Encaissements du Jour
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 rounded-2xl">
                <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">💵 Espèces</p>
                <p className="text-base font-extrabold text-emerald-900 dark:text-emerald-200 mt-1">
                  {formatFcfa(totalEspeces)}
                </p>
              </div>

              <div className="p-3.5 bg-orange-50/70 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/50 rounded-2xl">
                <p className="text-[11px] font-medium text-orange-800 dark:text-orange-300">🟧 Orange Money</p>
                <p className="text-base font-extrabold text-orange-900 dark:text-orange-200 mt-1">
                  {formatFcfa(totalOrangeMoney)}
                </p>
              </div>

              <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-2xl">
                <p className="text-[11px] font-medium text-blue-800 dark:text-blue-300">🟦 Moov Money</p>
                <p className="text-base font-extrabold text-blue-900 dark:text-blue-200 mt-1">
                  {formatFcfa(totalMoovMoney)}
                </p>
              </div>

              <div className="p-3.5 bg-cyan-50/70 dark:bg-cyan-950/30 border border-cyan-100 dark:border-cyan-900/50 rounded-2xl">
                <p className="text-[11px] font-medium text-cyan-800 dark:text-cyan-300">🐧 Wave</p>
                <p className="text-base font-extrabold text-cyan-900 dark:text-cyan-200 mt-1">
                  {formatFcfa(totalWave)}
                </p>
              </div>

              <div className="p-3.5 bg-purple-50/70 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 rounded-2xl">
                <p className="text-[11px] font-medium text-purple-800 dark:text-purple-300">🏦 Virement</p>
                <p className="text-base font-extrabold text-purple-900 dark:text-purple-200 mt-1">
                  {formatFcfa(totalVirement)}
                </p>
              </div>

              <div className="p-3.5 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl">
                <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300">💳 Autre</p>
                <p className="text-base font-extrabold text-gray-900 dark:text-white mt-1">
                  {formatFcfa(totalAutre)}
                </p>
              </div>
            </div>

            {/* Total CA Card */}
            <div className="p-4 bg-gradient-to-r from-rose-500 to-pink-600 rounded-2xl text-white flex items-center justify-between shadow-lg shadow-rose-500/20">
              <div>
                <p className="text-xs font-semibold text-rose-100">Chiffre d'Affaires Total du Jour</p>
                <p className="text-2xl font-black mt-0.5 tracking-tight">{formatFcfa(totalVentes)}</p>
              </div>
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Physical Cash Verification */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-4">
            <h3 className="text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 uppercase">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              Contrôle Physique de la Caisse Espèces
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Fond de caisse initial (FCFA)
                </label>
                <input
                  type="number"
                  min="0"
                  value={fondDeCaisse}
                  onChange={e => setFondDeCaisse(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:border-rose-500 outline-none"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Montant réel compté en caisse (FCFA)
                </label>
                <input
                  type="number"
                  min="0"
                  value={totalReelEspeces}
                  onChange={e => setTotalReelEspeces(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:border-rose-500 outline-none"
                  placeholder="Montant compté"
                />
              </div>
            </div>

            {/* Écart Calculation */}
            <div className="pt-2 flex items-center justify-between text-xs border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-500">
                Théorique attendu (Fond + Ventes Espèces) : <strong>{formatFcfa(totalTheoriqueEspeces)}</strong>
              </span>
              <span className={`font-bold text-sm px-2.5 py-1 rounded-lg ${
                ecartCaisse === 0
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : ecartCaisse > 0
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
              }`}>
                {ecartCaisse === 0
                  ? '✅ Écart : 0 FCFA (Parfait)'
                  : ecartCaisse > 0
                  ? `+${formatFcfa(ecartCaisse)} (Excédent)`
                  : `${formatFcfa(ecartCaisse)} (Déficit)`}
              </span>
            </div>
          </div>

          {/* Notes / Observation */}
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Commentaires ou Justification de l'écart (facultatif)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white focus:border-rose-500 outline-none"
              placeholder="Ex: Fond de monnaie remis à 10 000 FCFA, 500 FCFA d'écart dû à l'appoint..."
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-xs rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 active:scale-95 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{isSubmitting ? 'Clôture en cours...' : 'Valider & Clôturer la caisse'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
