import React, { useState, useEffect, useMemo } from 'react';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  Calendar, 
  Search, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  RefreshCw, 
  Tag, 
  Clock, 
  CheckCircle2, 
  Building2, 
  Zap, 
  Droplet, 
  Users, 
  ShoppingBag, 
  Scissors, 
  AlertCircle
} from 'lucide-react';
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

interface ExpenseManagementProps {
  salon: BeautySalon;
}

export function ExpenseManagement({ salon }: ExpenseManagementProps) {
  const [expenses, setExpenses] = useState<BeautyExpense[]>([]);
  const [totalRevenueFcfa, setTotalRevenueFcfa] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [categoryFilter, setCategoryFilter] = useState<BeautyExpenseCategory | 'toutes'>('toutes');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
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

  const loadData = async () => {
    try {
      setLoading(true);
      const [expList, salesList] = await Promise.all([
        fetchBeautyExpenses(salon.id, selectedMonth),
        fetchBeautySales(salon.id)
      ]);

      setExpenses(expList);

      // Filter sales for the selected month
      const monthSales = salesList.filter(s => 
        s.statut !== 'annule' && 
        s.dateVente && 
        s.dateVente.startsWith(selectedMonth)
      );
      const revTotal = monthSales.reduce((acc, s) => acc + (s.montantTotalFcfa || 0), 0);
      setTotalRevenueFcfa(revTotal);

    } catch (err) {
      console.warn('Erreur chargement dépenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [salon.id, selectedMonth]);

  // Calculations
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      if (categoryFilter !== 'toutes' && e.categorie !== categoryFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchTitle = e.titre.toLowerCase().includes(query);
        const matchDesc = e.description?.toLowerCase().includes(query) || false;
        const matchCat = e.categorie.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [expenses, categoryFilter, searchTerm]);

  const totalExpensesFcfa = useMemo(() => {
    return expenses.reduce((acc, e) => acc + e.montantFcfa, 0);
  }, [expenses]);

  const netBalanceFcfa = totalRevenueFcfa - totalExpensesFcfa;

  // Add Expense submit handler
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
      await loadData();

      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: {
            message: `✅ Dépense enregistrée (${formatFcfa(amount)})`,
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
    if (!window.confirm('Voulez-vous vraiment supprimer cette dépense ?')) return;
    try {
      await deleteBeautyExpense(id);
      await loadData();
    } catch (err) {
      console.error('Erreur suppression dépense:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Header */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-5 h-5 text-rose-500" />
            <span>Gestion des Dépenses Quotidiennes</span>
          </h2>
          <p className="text-xs text-gray-400 font-medium">
            Saisie et suivi des coûts opérationnels du salon ({salon.nom})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-2xl border border-gray-200/80 dark:border-gray-700">
            <Calendar className="w-4 h-4 text-rose-500 ml-1" />
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white rounded-2xl text-xs font-black shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer transition-transform hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>Nouvelle Dépense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Recettes, Dépenses, Solde Net) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-emerald-100 dark:border-emerald-950 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Recettes du mois</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatFcfa(totalRevenueFcfa)}
          </div>
          <span className="text-[11px] font-semibold text-gray-400 block">
            Ventes POS & Prestations
          </span>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-rose-100 dark:border-rose-950 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Dépenses</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatFcfa(totalExpensesFcfa)}
          </div>
          <span className="text-[11px] font-semibold text-gray-400 block">
            {expenses.length} dépense(s) saisie(s)
          </span>
        </div>

        <div className={`bg-white dark:bg-gray-900 rounded-3xl p-5 border shadow-sm space-y-1 ${
          netBalanceFcfa >= 0 
            ? 'border-indigo-100 dark:border-indigo-950' 
            : 'border-red-100 dark:border-red-950'
        }`}>
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Solde Net (Recettes - Dépenses)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              netBalanceFcfa >= 0 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {netBalanceFcfa >= 0 ? 'Positif' : 'Déficit'}
            </span>
          </div>
          <div className={`text-2xl font-black ${
            netBalanceFcfa >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'
          }`}>
            {formatFcfa(netBalanceFcfa)}
          </div>
          <span className="text-[11px] font-semibold text-gray-400 block">
            Résultat financier net
          </span>
        </div>
      </div>

      {/* Expense Filters & Search */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher une dépense..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium outline-none focus:border-rose-500"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
            <button
              onClick={() => setCategoryFilter('toutes')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                categoryFilter === 'toutes'
                  ? 'bg-rose-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              Toutes
            </button>
            {(Object.keys(BEAUTY_EXPENSE_CATEGORY_LABELS) as BeautyExpenseCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  categoryFilter === cat
                    ? 'bg-rose-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {BEAUTY_EXPENSE_CATEGORY_LABELS[cat]?.icon} {BEAUTY_EXPENSE_CATEGORY_LABELS[cat]?.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Expense List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400 font-semibold space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-rose-500" />
            <span>Chargement des dépenses...</span>
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-12 text-center bg-gray-50 dark:bg-gray-950 rounded-2xl p-6 border border-dashed border-gray-200 dark:border-gray-800 space-y-2">
            <Receipt className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-500">
              Aucune dépense trouvée pour ce filtre.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredExpenses.map(e => {
              const catCfg = BEAUTY_EXPENSE_CATEGORY_LABELS[e.categorie] || { label: e.categorie, icon: '🧾', color: 'bg-gray-100' };
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
                        <span>{payCfg.label}</span>
                        {e.description && (
                          <>
                            <span>•</span>
                            <span className="italic truncate max-w-[200px]">{e.description}</span>
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
                      title="Supprimer"
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

      {/* Modal: Add Expense */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-6 border border-gray-100 dark:border-gray-800 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-black">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-gray-900 dark:text-white">
                    Saisie d'une Dépense Salon
                  </h3>
                  <p className="text-[11px] text-gray-400 font-semibold">{salon.nom}</p>
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
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Catégorie de coût *</label>
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
                  <option value="abonnements">📢 Abonnements & Marketing Zaka+</option>
                  <option value="transport">🚗 Transport & Déplacements</option>
                  <option value="maintenance">🛠️ Entretien & Réparations</option>
                  <option value="autre">🧾 Autres charges diverses</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Titre / Intitulé *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Facture SONABEL Septembre, Achats shampoings..."
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
                    placeholder="Ex: 25000"
                    value={newExp.montantFcfa}
                    onChange={e => setNewExp({ ...newExp, montantFcfa: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-black text-rose-600 outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1">Paiement via *</label>
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
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Date *</label>
                <input
                  type="date"
                  required
                  value={newExp.dateDepense}
                  onChange={e => setNewExp({ ...newExp, dateDepense: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Description / Note</label>
                <textarea
                  rows={2}
                  placeholder="Note ou détails de la facture..."
                  value={newExp.description}
                  onChange={e => setNewExp({ ...newExp, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium outline-none focus:border-rose-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>Enregistrer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
