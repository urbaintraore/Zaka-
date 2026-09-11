import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Calendar, 
  FileSpreadsheet, 
  PieChart as PieIcon, 
  Receipt, 
  Building2, 
  Zap, 
  Droplet, 
  Users, 
  ShoppingBag, 
  Scissors, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowUpRight, 
  ArrowDownRight,
  Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  BeautySalon, 
  BeautyExpense, 
  BeautyExpenseCategory, 
  BeautyPaymentMethod 
} from '../../types';
import { 
  fetchBeautyExpenses, 
  saveBeautyExpense, 
  deleteBeautyExpense, 
  fetchBeautySales, 
  BEAUTY_EXPENSE_CATEGORY_LABELS, 
  BEAUTY_PAYMENT_LABELS, 
  formatFcfa 
} from '../../lib/beautyService';

interface BeautyAccountingViewProps {
  salon: BeautySalon;
}

const CATEGORY_COLORS: Record<BeautyExpenseCategory, string> = {
  loyer: '#8B5CF6',
  electricite: '#F59E0B',
  eau: '#3B82F6',
  salaires: '#10B981',
  achats_materiel: '#6366F1',
  achats_produits: '#EC4899',
  abonnements: '#F43F5E',
  transport: '#06B6D4',
  maintenance: '#EA580C',
  autre: '#6B7280'
};

export function BeautyAccountingView({ salon }: BeautyAccountingViewProps) {
  // Selected Month (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  const [expenses, setExpenses] = useState<BeautyExpense[]>([]);
  const [monthlyRevenueFcfa, setMonthlyRevenueFcfa] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // New Expense Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newExp, setNewExp] = useState<{
    categorie: BeautyExpenseCategory;
    titre: string;
    description: string;
    montantFcfa: string;
    modePaiement: BeautyPaymentMethod;
    dateDepense: string;
  }>({
    categorie: 'loyer',
    titre: '',
    description: '',
    montantFcfa: '',
    modePaiement: 'especes',
    dateDepense: new Date().toISOString().split('T')[0]
  });

  const loadAccountingData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Expenses for the selected month
      const [expList, salesList] = await Promise.all([
        fetchBeautyExpenses(salon.id, selectedMonth),
        fetchBeautySales(salon.id)
      ]);

      setExpenses(expList);

      // 2. Filter sales for selected month to calculate total revenue
      const monthSales = salesList.filter(s => 
        s.statut !== 'annule' && 
        s.dateVente && 
        s.dateVente.startsWith(selectedMonth)
      );

      const revTotal = monthSales.reduce((acc, s) => acc + (s.montantTotalFcfa || 0), 0);
      setMonthlyRevenueFcfa(revTotal);

    } catch (err) {
      console.warn('Erreur chargement comptabilité salon:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccountingData();
  }, [salon.id, selectedMonth]);

  // Calculations
  const totalExpensesFcfa = useMemo(() => {
    return expenses.reduce((acc, e) => acc + e.montantFcfa, 0);
  }, [expenses]);

  const netProfitFcfa = monthlyRevenueFcfa - totalExpensesFcfa;
  const netMarginPercent = monthlyRevenueFcfa > 0 
    ? Math.round((netProfitFcfa / monthlyRevenueFcfa) * 100) 
    : 0;

  // Breakdown by Category for Recharts PieChart
  const expenseCategoryBreakdown = useMemo(() => {
    const map = new Map<BeautyExpenseCategory, number>();
    expenses.forEach(e => {
      const current = map.get(e.categorie) || 0;
      map.set(e.categorie, current + e.montantFcfa);
    });

    return Array.from(map.entries()).map(([cat, total]) => ({
      name: BEAUTY_EXPENSE_CATEGORY_LABELS[cat]?.label || cat,
      value: total,
      color: CATEGORY_COLORS[cat] || '#6B7280'
    })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Form submit handler
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseInt(newExp.montantFcfa, 10);
    if (isNaN(amount) || amount <= 0 || !newExp.titre.trim()) return;

    try {
      setIsSubmitting(true);
      await saveBeautyExpense({
        salonId: salon.id,
        categorie: newExp.categorie,
        titre: newExp.titre.trim(),
        description: newExp.description.trim() || undefined,
        montantFcfa: amount,
        modePaiement: newExp.modePaiement,
        dateDepense: newExp.dateDepense
      });

      setNewExp({
        categorie: 'loyer',
        titre: '',
        description: '',
        montantFcfa: '',
        modePaiement: 'especes',
        dateDepense: new Date().toISOString().split('T')[0]
      });

      setShowAddModal(false);
      await loadAccountingData();

      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: {
            message: `✅ Dépense enregistrée avec succès (${formatFcfa(amount)})`,
            type: 'success'
          }
        })
      );
    } catch (err) {
      console.error('Erreur enregistrement dépense:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete expense
  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette dépense ?')) return;
    try {
      await deleteBeautyExpense(id);
      await loadAccountingData();
    } catch (err) {
      console.error('Erreur suppression dépense:', err);
    }
  };

  // Month Selector Format
  const monthDisplayLabel = useMemo(() => {
    const [y, m] = selectedMonth.split('-');
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const monthIndex = parseInt(m, 10) - 1;
    return `${months[monthIndex] || m} ${y}`;
  }, [selectedMonth]);

  // Export Bilan Report
  const handleExportBilan = () => {
    const lines = [
      `BILAN COMPTABLE & FINANCIER — ${salon.nom.toUpperCase()}`,
      `Période : ${monthDisplayLabel}`,
      `Date d'exportation : ${new Date().toLocaleString('fr-FR')}`,
      `====================================================`,
      `RECETTES TOTALES (Caisse & Ventes) : ${formatFcfa(monthlyRevenueFcfa)}`,
      `CHARGES & DÉPENSES TOTALES         : ${formatFcfa(totalExpensesFcfa)}`,
      `RÉSULTAT NET (BÉNÉFICE / PERTE)    : ${formatFcfa(netProfitFcfa)}`,
      `MARGE NETTE ESTIMÉE               : ${netMarginPercent}%`,
      `====================================================`,
      `DÉTAIL DES CHARGES DU MOIS :`,
      ...expenses.map((e, idx) => 
        `${idx + 1}. [${e.dateDepense}] ${e.titre} (${BEAUTY_EXPENSE_CATEGORY_LABELS[e.categorie]?.label || e.categorie}) : ${formatFcfa(e.montantFcfa)} - Payé par ${BEAUTY_PAYMENT_LABELS[e.modePaiement]?.label || e.modePaiement}`
      )
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bilan_comptable_${salon.nom.toLowerCase().replace(/\s+/g, '_')}_${selectedMonth}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Month Filter */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-rose-500" />
            <span>Comptabilité & Bilan Financier</span>
          </h2>
          <p className="text-xs text-gray-400 font-medium">
            Suivi des recettes de caisse, saisie des dépenses et calcul du bénéfice net
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-1.5 rounded-2xl border border-gray-200/80 dark:border-gray-700">
            <Calendar className="w-4 h-4 text-rose-500 ml-2" />
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-800 dark:text-gray-200 outline-none pr-2 cursor-pointer"
            />
          </div>

          <button
            onClick={handleExportBilan}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl text-xs font-black transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            title="Exporter le Bilan du mois"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden md:inline">Exporter Bilan</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-2xl text-xs font-black shadow-md shadow-rose-600/20 flex items-center gap-1.5 shrink-0 cursor-pointer transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Enregistrer Dépense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards: Revenue, Expenses, Net Profit */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Recettes Totales */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-emerald-100 dark:border-emerald-950 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Recettes Totales (Caisse)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatFcfa(monthlyRevenueFcfa)}
            </span>
            <span className="text-[11px] font-semibold text-gray-400 block mt-0.5">
              Encaissements du mois de {monthDisplayLabel}
            </span>
          </div>
        </div>

        {/* Total Dépenses */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-rose-100 dark:border-rose-950 shadow-sm space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Charges & Dépenses</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
              {formatFcfa(totalExpensesFcfa)}
            </span>
            <span className="text-[11px] font-semibold text-gray-400 block mt-0.5">
              {expenses.length} dépense(s) enregistrée(s)
            </span>
          </div>
        </div>

        {/* Bénéfice Net / Marge */}
        <div className={`bg-white dark:bg-gray-900 rounded-3xl p-5 border shadow-sm space-y-2 relative overflow-hidden ${
          netProfitFcfa >= 0 
            ? 'border-indigo-100 dark:border-indigo-950' 
            : 'border-amber-100 dark:border-amber-950'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bénéfice Net du Mois</span>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
              netProfitFcfa >= 0 
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
            }`}>
              Marge : {netMarginPercent}%
            </span>
          </div>
          <div>
            <span className={`text-2xl font-black ${
              netProfitFcfa >= 0 
                ? 'text-gray-900 dark:text-white' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {formatFcfa(netProfitFcfa)}
            </span>
            <span className="text-[11px] font-semibold text-gray-400 block mt-0.5">
              Solde (Recettes minus Charges)
            </span>
          </div>
        </div>
      </div>

      {/* Main Content: Expense List & Category Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Expenses List Table (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-rose-500" />
              <span>Détail des Dépenses ({monthDisplayLabel})</span>
            </h3>
            <span className="text-xs font-bold text-gray-400">
              {expenses.length} entrée(s)
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400 font-semibold space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-rose-500" />
              <span>Chargement du journal des dépenses...</span>
            </div>
          ) : expenses.length === 0 ? (
            <div className="py-12 text-center bg-gray-50 dark:bg-gray-950 rounded-2xl p-6 border border-dashed border-gray-200 dark:border-gray-800 space-y-3">
              <Receipt className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-gray-500">
                Aucune dépense enregistrée pour {monthDisplayLabel}.
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter la première dépense</span>
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[420px] overflow-y-auto pr-1">
              {expenses.map((e) => {
                const catCfg = BEAUTY_EXPENSE_CATEGORY_LABELS[e.categorie] || { label: e.categorie, icon: '🧾', color: 'bg-gray-100 text-gray-800' };
                const payCfg = BEAUTY_PAYMENT_LABELS[e.modePaiement] || { label: e.modePaiement };

                return (
                  <div key={e.id} className="py-3.5 flex items-center justify-between gap-3 text-xs hover:bg-gray-50/50 dark:hover:bg-gray-800/50 px-2 rounded-xl transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center text-lg shrink-0">
                        {catCfg.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-gray-900 dark:text-white truncate">
                            {e.titre}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${catCfg.color}`}>
                            {catCfg.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5">
                          <span>{new Date(e.dateDepense).toLocaleDateString('fr-FR')}</span>
                          <span>•</span>
                          <span>Payé en {payCfg.label}</span>
                          {e.description && (
                            <>
                              <span>•</span>
                              <span className="italic truncate max-w-[180px]">{e.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                        -{formatFcfa(e.montantFcfa)}
                      </span>
                      <button
                        onClick={() => handleDeleteExpense(e.id)}
                        className="p-1.5 text-gray-300 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Supprimer la dépense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Breakdown Chart Side Panel (1 col) */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <PieIcon className="w-4 h-4 text-purple-500" />
              <span>Répartition par Catégorie</span>
            </h3>

            {expenseCategoryBreakdown.length === 0 ? (
              <div className="py-12 text-center text-xs text-gray-400">
                Aucune donnée à afficher pour ce mois.
              </div>
            ) : (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseCategoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {expenseCategoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any) => formatFcfa(Number(val))} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            {expenseCategoryBreakdown.slice(0, 4).map((cat) => (
              <div key={cat.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">{cat.name}</span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white shrink-0">
                  {formatFcfa(cat.value)}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modal: Enregistrer une Dépense */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-6 border border-gray-100 dark:border-gray-800 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center font-black">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-gray-900 dark:text-white">
                    Saisie d'une Dépense / Charge Salon
                  </h3>
                  <p className="text-[11px] text-gray-400 font-semibold">
                    {salon.nom}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4 text-xs font-bold">
              
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Catégorie de charge *</label>
                <select
                  value={newExp.categorie}
                  onChange={e => setNewExp({ ...newExp, categorie: e.target.value as BeautyExpenseCategory })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold outline-none focus:border-rose-500"
                >
                  <option value="loyer">🏢 Loyer du local</option>
                  <option value="electricite">⚡ Électricité (SONABEL)</option>
                  <option value="eau">💧 Eau (ONEA)</option>
                  <option value="salaires">👥 Salaires du personnel</option>
                  <option value="achats_materiel">✂️ Matériel & Équipements</option>
                  <option value="achats_produits">🧴 Achat de stocks / Consommables</option>
                  <option value="abonnements">📢 Abonnements & Publicité Zaka+</option>
                  <option value="transport">🚗 Transport & Déplacements</option>
                  <option value="maintenance">🛠️ Entretien & Réparations</option>
                  <option value="autre">🧾 Autres charges diverses</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Titre / Intitulé de la dépense *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Loyer Mensuel Septembre, Facture SONABEL, Achat mèche..."
                  value={newExp.titre}
                  onChange={e => setNewExp({ ...newExp, titre: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1">Montant (FCFA) *</label>
                  <input
                    type="number"
                    required
                    min="100"
                    step="100"
                    placeholder="Ex: 50000"
                    value={newExp.montantFcfa}
                    onChange={e => setNewExp({ ...newExp, montantFcfa: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-black text-rose-600 outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1">Mode de règlement *</label>
                  <select
                    value={newExp.modePaiement}
                    onChange={e => setNewExp({ ...newExp, modePaiement: e.target.value as BeautyPaymentMethod })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold outline-none focus:border-rose-500"
                  >
                    <option value="especes">💵 Espèces</option>
                    <option value="orange_money">🟧 Orange Money</option>
                    <option value="moov_money">🟦 Moov Money</option>
                    <option value="wave">🐧 Wave</option>
                    <option value="virement">🏦 Virement bancaire</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Date d'engagement *</label>
                <input
                  type="date"
                  required
                  value={newExp.dateDepense}
                  onChange={e => setNewExp({ ...newExp, dateDepense: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Description / Note explicative (Optionnel)</label>
                <textarea
                  rows={2}
                  placeholder="Détails complémentaires, référence de reçu..."
                  value={newExp.description}
                  onChange={e => setNewExp({ ...newExp, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-xl text-xs font-black shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Valider la dépense</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}
