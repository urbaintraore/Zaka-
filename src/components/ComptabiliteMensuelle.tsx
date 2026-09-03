import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store';
import { 
  Building2, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  CheckCircle2, 
  Info, 
  FileSpreadsheet, 
  Users, 
  Package, 
  Megaphone, 
  Receipt, 
  Zap, 
  Sparkles,
  HelpCircle,
  ShoppingBag,
  Store,
  ChevronLeft,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { Establishment, Publication, SaleRecord, StockItem } from '../types';

export interface SalaryLine {
  id: string;
  name: string;
  role: string;
  amount: number;
}

export type ExpenseCategory = 
  | 'loyer' 
  | 'electricite' 
  | 'eau' 
  | 'abonnement_canal' 
  | 'abonnement_zaka' 
  | 'salaires' 
  | 'autre';

export interface MonthlyExpense {
  id: string;
  establishmentId: string;
  month: string; // YYYY-MM
  category: ExpenseCategory;
  categoryCustomName?: string;
  description?: string;
  amount: number;
  salaryLines?: SalaryLine[];
  date: string;
  createdAt: string;
}

export interface PublicationRevenue {
  id: string;
  establishmentId: string;
  publicationId: string;
  publicationTitle: string;
  publicationType: string;
  month: string; // YYYY-MM
  amount: number;
  updatedAt: string;
}

export interface MonthlyManualSales {
  id: string;
  establishmentId: string;
  month: string; // YYYY-MM
  amount: number;
  note?: string;
  updatedAt: string;
}

export interface MonthlyStockValueOverride {
  id: string;
  establishmentId: string;
  month: string; // YYYY-MM
  value: number;
  hasProductSales?: boolean;
  updatedAt: string;
}

// LocalStorage Persistence Helpers
const STORAGE_KEYS = {
  EXPENSES: 'zaka_acc_expenses_v1',
  PUB_REVENUES: 'zaka_acc_pub_revenues_v1',
  MANUAL_SALES: 'zaka_acc_manual_sales_v1',
  STOCK_VALUES: 'zaka_acc_stock_values_v1',
  SALON_HAS_PRODUCTS: 'zaka_acc_salon_products_v1'
};

const getStoredData = <T,>(key: string, defaultValue: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch (e) {
    console.warn(`Error reading ${key} from localStorage`, e);
    return defaultValue;
  }
};

const setStoredData = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`Error writing ${key} to localStorage`, e);
  }
};

export function ComptabiliteMensuelle({ establishment }: { establishment: Establishment }) {
  const { publications, ventes, stocks, currentUser } = useAppStore();

  // Selected Month State (YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // Local Persistent Accounting States
  const [expenses, setExpenses] = useState<MonthlyExpense[]>(() => 
    getStoredData<MonthlyExpense[]>(STORAGE_KEYS.EXPENSES, [])
  );
  const [pubRevenues, setPubRevenues] = useState<PublicationRevenue[]>(() => 
    getStoredData<PublicationRevenue[]>(STORAGE_KEYS.PUB_REVENUES, [])
  );
  const [manualSales, setManualSales] = useState<MonthlyManualSales[]>(() => 
    getStoredData<MonthlyManualSales[]>(STORAGE_KEYS.MANUAL_SALES, [])
  );
  const [stockOverrides, setStockOverrides] = useState<MonthlyStockValueOverride[]>(() => 
    getStoredData<MonthlyStockValueOverride[]>(STORAGE_KEYS.STOCK_VALUES, [])
  );
  const [salonHasProducts, setSalonHasProducts] = useState<Record<string, boolean>>(() => 
    getStoredData<Record<string, boolean>>(STORAGE_KEYS.SALON_HAS_PRODUCTS, {})
  );

  // Sync state changes to localStorage
  useEffect(() => {
    setStoredData(STORAGE_KEYS.EXPENSES, expenses);
  }, [expenses]);

  useEffect(() => {
    setStoredData(STORAGE_KEYS.PUB_REVENUES, pubRevenues);
  }, [pubRevenues]);

  useEffect(() => {
    setStoredData(STORAGE_KEYS.MANUAL_SALES, manualSales);
  }, [manualSales]);

  useEffect(() => {
    setStoredData(STORAGE_KEYS.STOCK_VALUES, stockOverrides);
  }, [stockOverrides]);

  useEffect(() => {
    setStoredData(STORAGE_KEYS.SALON_HAS_PRODUCTS, salonHasProducts);
  }, [salonHasProducts]);

  // Modal / Form States
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('loyer');
  const [expCustomName, setExpCustomName] = useState('');
  const [expDescription, setExpDescription] = useState('');
  const [expAmount, setExpAmount] = useState<string>('');
  const [expDate, setExpDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Salary lines state (for category 'salaires')
  const [salaryLines, setSalaryLines] = useState<SalaryLine[]>([
    { id: '1', name: currentUser?.name || 'Gérant / Propriétaire', role: 'Gérant', amount: 0 }
  ]);

  // Manual sales input state for month
  const [manualSalesInput, setManualSalesInput] = useState<string>('');

  // Manual restaurant/salon stock input
  const [manualStockInput, setManualStockInput] = useState<string>('');

  // Pub revenue editing state
  const [editingPubRevId, setEditingPubRevId] = useState<string | null>(null);
  const [pubRevInput, setPubRevInput] = useState<string>('');

  // Format month label
  const monthLabel = useMemo(() => {
    const [y, m] = selectedMonth.split('-');
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    const monthIndex = parseInt(m, 10) - 1;
    return `${months[monthIndex] || m} ${y}`;
  }, [selectedMonth]);

  // Navigate months
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    const ny = d.getFullYear();
    const nm = String(d.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${ny}-${nm}`);
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    const ny = d.getFullYear();
    const nm = String(d.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${ny}-${nm}`);
  };

  // Filter expenses for this establishment & selected month
  const monthExpenses = useMemo(() => {
    return expenses.filter(e => e.establishmentId === establishment.id && e.month === selectedMonth);
  }, [expenses, establishment.id, selectedMonth]);

  // Calculate total monthly expenses
  const totalExpenses = useMemo(() => {
    return monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [monthExpenses]);

  // Expense breakdown by category
  const expenseBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach(e => {
      const key = e.category === 'autre' ? (e.categoryCustomName || 'Autre') : e.category;
      map[key] = (map[key] || 0) + e.amount;
    });
    return map;
  }, [monthExpenses]);

  // ZAKA+ Subscription price auto-prefill logic
  const zakaSubscriptionAmount = useMemo(() => {
    // Determine plan price from establishment metadata or default
    const pack = (establishment as any).subscriptionPack || (establishment as any).pack || 'gratuit';
    if (pack === 'premium') return 35000;
    if (pack === 'standard') return 15000;
    return 15000; // Standard default prefill for active establishments
  }, [establishment]);

  // Automatically calculated sales from POS module
  const posSalesForMonth = useMemo(() => {
    if (!ventes) return 0;
    return ventes
      .filter(v => v.establishmentId === establishment.id && v.date && v.date.startsWith(selectedMonth))
      .reduce((sum, v) => sum + (v.totalAmount || 0), 0);
  }, [ventes, establishment.id, selectedMonth]);

  // Manual sales override for month
  const currentManualSalesRecord = useMemo(() => {
    return manualSales.find(m => m.establishmentId === establishment.id && m.month === selectedMonth);
  }, [manualSales, establishment.id, selectedMonth]);

  const effectiveSales = useMemo(() => {
    if (posSalesForMonth > 0) return posSalesForMonth;
    return currentManualSalesRecord ? currentManualSalesRecord.amount : 0;
  }, [posSalesForMonth, currentManualSalesRecord]);

  // Filter publications of the establishment for this month
  const monthPublications = useMemo(() => {
    if (!publications) return [];
    return publications.filter(p => {
      if (p.establishmentId !== establishment.id) return false;
      const pubDate = p.startDate || p.createdAt || '';
      return pubDate.startsWith(selectedMonth) || p.status === 'active';
    });
  }, [publications, establishment.id, selectedMonth]);

  // Publication revenues for selected month
  const monthPubRevenues = useMemo(() => {
    return pubRevenues.filter(r => r.establishmentId === establishment.id && r.month === selectedMonth);
  }, [pubRevenues, establishment.id, selectedMonth]);

  const totalPubRevenues = useMemo(() => {
    return monthPubRevenues.reduce((sum, r) => sum + r.amount, 0);
  }, [monthPubRevenues]);

  // Stock value calculation according to establishment category
  const isMaquisOrBoite = establishment.category === 'maquis' || establishment.category === 'boite_de_nuit' || establishment.category === 'bar';
  const isRestaurant = establishment.category === 'restaurant' || establishment.category === 'restaurants' || establishment.category === 'glacier_pizzeria';
  const isSalon = establishment.category === 'salon_de_coiffure';

  const autoStockValue = useMemo(() => {
    if (!isMaquisOrBoite || !stocks) return { value: 0, isEstimated: false };
    const estStocks = stocks.filter(s => s.establishmentId === establishment.id);
    let total = 0;
    let isEstimated = false;

    estStocks.forEach(item => {
      const cost = (item as any).purchasePrice ?? (item as any).unitPrice ?? (item as any).price ?? 0;
      if (!(item as any).purchasePrice) isEstimated = true;
      total += (item.quantity || 0) * cost;
    });

    return { value: total, isEstimated };
  }, [isMaquisOrBoite, stocks, establishment.id]);

  const currentStockOverride = useMemo(() => {
    return stockOverrides.find(s => s.establishmentId === establishment.id && s.month === selectedMonth);
  }, [stockOverrides, establishment.id, selectedMonth]);

  const finalStockValue = useMemo(() => {
    if (currentStockOverride) return currentStockOverride.value;
    if (isMaquisOrBoite) return autoStockValue.value;
    return 0;
  }, [currentStockOverride, isMaquisOrBoite, autoStockValue]);

  // Monthly Net Result Formula: (Sales + Pub Funds) - Expenses
  const netResult = useMemo(() => {
    return (effectiveSales + totalPubRevenues) - totalExpenses;
  }, [effectiveSales, totalPubRevenues, totalExpenses]);

  const isProfit = netResult >= 0;

  // Handle adding expense
  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();

    let finalAmount = Number(expAmount) || 0;
    let linesToSave: SalaryLine[] | undefined = undefined;

    if (expCategory === 'salaires') {
      linesToSave = salaryLines.filter(l => l.name.trim() && l.amount > 0);
      finalAmount = linesToSave.reduce((sum, l) => sum + l.amount, 0);
      if (finalAmount <= 0) {
        alert("Veuillez saisir au moins un montant de salaire valide.");
        return;
      }
    } else if (finalAmount <= 0) {
      alert("Veuillez saisir un montant de dépense valide.");
      return;
    }

    const newExpense: MonthlyExpense = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      establishmentId: establishment.id,
      month: selectedMonth,
      category: expCategory,
      categoryCustomName: expCategory === 'autre' ? expCustomName : undefined,
      description: expDescription,
      amount: finalAmount,
      salaryLines: linesToSave,
      date: expDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    setExpenses(prev => [newExpense, ...prev]);
    setShowAddExpenseModal(false);

    // Reset form
    setExpCategory('loyer');
    setExpCustomName('');
    setExpDescription('');
    setExpAmount('');
    setSalaryLines([{ id: '1', name: currentUser?.name || 'Gérant / Propriétaire', role: 'Gérant', amount: 0 }]);
  };

  // Pre-fill Zaka+ subscription expense
  const handleAddZakaSubscriptionExpense = () => {
    const existing = monthExpenses.find(e => e.category === 'abonnement_zaka');
    if (existing) {
      alert("L'Abonnement Zaka+ est déjà comptabilisé dans les dépenses de ce mois.");
      return;
    }

    const newExp: MonthlyExpense = {
      id: `exp_zaka_${Date.now()}`,
      establishmentId: establishment.id,
      month: selectedMonth,
      category: 'abonnement_zaka',
      description: `Forfait d'abonnement Zaka+ (${establishment.name})`,
      amount: zakaSubscriptionAmount,
      date: `${selectedMonth}-01`,
      createdAt: new Date().toISOString()
    };

    setExpenses(prev => [newExp, ...prev]);
  };

  const handleDeleteExpense = (id: string) => {
    if (window.confirm("Voulez-vous vraiment supprimer cette dépense ?")) {
      setExpenses(prev => prev.filter(e => e.id !== id));
    }
  };

  // Save manual sales
  const handleSaveManualSales = () => {
    const amt = Number(manualSalesInput);
    if (isNaN(amt) || amt < 0) return;

    setManualSales(prev => {
      const filtered = prev.filter(m => !(m.establishmentId === establishment.id && m.month === selectedMonth));
      return [...filtered, {
        id: `sales_${Date.now()}`,
        establishmentId: establishment.id,
        month: selectedMonth,
        amount: amt,
        updatedAt: new Date().toISOString()
      }];
    });
    setManualSalesInput('');
  };

  // Save publication revenue
  const handleSavePubRevenue = (pubId: string, pubTitle: string, pubType: string) => {
    const amt = Number(pubRevInput);
    if (isNaN(amt) || amt < 0) return;

    setPubRevenues(prev => {
      const filtered = prev.filter(r => !(r.establishmentId === establishment.id && r.publicationId === pubId && r.month === selectedMonth));
      return [...filtered, {
        id: `pubrev_${Date.now()}`,
        establishmentId: establishment.id,
        publicationId: pubId,
        publicationTitle: pubTitle,
        publicationType: pubType,
        month: selectedMonth,
        amount: amt,
        updatedAt: new Date().toISOString()
      }];
    });
    setEditingPubRevId(null);
    setPubRevInput('');
  };

  // Save manual stock override
  const handleSaveManualStock = () => {
    const amt = Number(manualStockInput);
    if (isNaN(amt) || amt < 0) return;

    setStockOverrides(prev => {
      const filtered = prev.filter(s => !(s.establishmentId === establishment.id && s.month === selectedMonth));
      return [...filtered, {
        id: `stock_${Date.now()}`,
        establishmentId: establishment.id,
        month: selectedMonth,
        value: amt,
        updatedAt: new Date().toISOString()
      }];
    });
    setManualStockInput('');
  };

  // Get Category Label
  const getCategoryLabelText = (cat: ExpenseCategory, custom?: string) => {
    switch (cat) {
      case 'loyer': return '🏢 Loyer du local';
      case 'electricite': return '⚡ Électricité (SONABEL)';
      case 'eau': return '💧 Eau (ONEA)';
      case 'abonnement_canal': return '📺 Abonnement Canal+';
      case 'abonnement_zaka': return '🚀 Abonnement Zaka+';
      case 'salaires': return '👥 Salaires du personnel & Gérant';
      case 'autre': return custom ? `📌 ${custom}` : '📌 Autre dépense';
      default: return cat;
    }
  };

  // Export CSV Report
  const handleExportCSV = () => {
    const csvRows: string[] = [];

    // Header info
    csvRows.push(`"RAPPORT COMPTABLE DE TRÉSORERIE"`);
    csvRows.push(`"Établissement";"${establishment.name.replace(/"/g, '""')}"`);
    csvRows.push(`"Période";"${monthLabel}" (${selectedMonth})`);
    csvRows.push(`"Généré le";"${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR')}"`);
    csvRows.push(``);

    // Summary Section
    csvRows.push(`"RÉSUMÉ DU RÉSULTAT NET"`);
    csvRows.push(`"Poste";"Montant (FCFA)"`);
    csvRows.push(`"(+) Ventes Caisse / Chiffre d'Affaires";"${effectiveSales}"`);
    csvRows.push(`"(+) Fonds Publications & Événements";"${totalPubRevenues}"`);
    csvRows.push(`"(-) Total Dépenses Mensuelles";"${totalExpenses}"`);
    csvRows.push(`"RÉSULTAT NET DE TRÉSORERIE";"${netResult}"`);
    csvRows.push(`"Valeur Stock Restant (Actif Patrimonial)";"${finalStockValue}"`);
    csvRows.push(``);

    // Expenses Breakdown
    csvRows.push(`"DÉTAIL DES DÉPENSES"`);
    csvRows.push(`"Date";"Catégorie";"Description";"Salaires Détaillés";"Montant (FCFA)"`);

    if (monthExpenses.length === 0) {
      csvRows.push(`"Aucune dépense enregistrée";"";"";"";"0"`);
    } else {
      monthExpenses.forEach(exp => {
        const catLabel = getCategoryLabelText(exp.category, exp.categoryCustomName);
        const desc = (exp.description || '').replace(/"/g, '""');
        let salDetail = '';
        if (exp.salaryLines && exp.salaryLines.length > 0) {
          salDetail = exp.salaryLines.map(l => `${l.name} (${l.role}): ${l.amount} FCFA`).join(' | ').replace(/"/g, '""');
        }
        csvRows.push(`"${exp.date}";"${catLabel}";"${desc}";"${salDetail}";"${exp.amount}"`);
      });
    }

    csvRows.push(``);
    // Publications Revenue Breakdown
    csvRows.push(`"DÉTAIL DES REVENUS DE PUBLICATIONS & ÉVÉNEMENTS"`);
    csvRows.push(`"Type";"Titre";"Montant Perçu (FCFA)"`);

    if (monthPubRevenues.length === 0) {
      csvRows.push(`"Aucun revenu lié aux publications";"";"0"`);
    } else {
      monthPubRevenues.forEach(rev => {
        csvRows.push(`"${rev.publicationType}";"${rev.publicationTitle.replace(/"/g, '""')}";"${rev.amount}"`);
      });
    }

    const csvContent = '\uFEFF' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Comptabilite_${establishment.name.replace(/\s+/g, '_')}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasProductsInSalon = salonHasProducts[establishment.id] ?? false;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ESTABLISHMENT LINKING BADGE BANNER */}
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-4.5 rounded-3xl border border-orange-200 dark:border-orange-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-orange-600 text-white rounded-2xl shadow-sm shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 rounded-full text-[10px] font-black uppercase">
                {establishment.category || 'Établissement'}
              </span>
              <span className="text-[11px] text-gray-400 font-medium">ID: {establishment.id}</span>
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white">
              {establishment.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {establishment.address || establishment.city || 'Burkina Faso'}
            </p>
          </div>
        </div>
        <div className="px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs font-extrabold text-gray-700 dark:text-gray-200 flex items-center gap-2 self-stretch sm:self-auto justify-center shadow-2xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Comptabilité isolée & liée à cet établissement</span>
        </div>
      </div>

      {/* DISCLAIMER BANNER (LEGAL NOTICE BURKINA FASO) */}
      <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 shadow-xs flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wider text-[11px]">
            Notice d'utilisation • Suivi de Trésorerie Interne
          </p>
          <p className="text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
            Ce module est un outil interne de gestion des flux de trésorerie (encaissements et décaissements) à l'usage exclusif du Gérant. Il ne constitue pas un logiciel de comptabilité légale. Au Burkina Faso, la comptabilité officielle de votre société demeure soumise aux normes <strong>SYSCOHADA</strong> et doit être tenue séparément par un professionnel agréé.
          </p>
        </div>
      </div>

      {/* MONTH SELECTOR & NAVIGATION BAR */}
      <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-orange-100 dark:hover:bg-orange-950/50 text-gray-700 dark:text-gray-200 hover:text-orange-600 rounded-2xl transition-all cursor-pointer active:scale-95"
            title="Mois précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Période Comptable</span>
            <span className="text-lg font-black text-gray-900 dark:text-white capitalize flex items-center justify-center gap-1.5">
              <Calendar className="w-4 h-4 text-orange-500" />
              {monthLabel}
            </span>
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-orange-100 dark:hover:bg-orange-950/50 text-gray-700 dark:text-gray-200 hover:text-orange-600 rounded-2xl transition-all cursor-pointer active:scale-95"
            title="Mois suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Month Input Picker Direct */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="month"
            value={selectedMonth}
            onChange={e => e.target.value && setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs font-bold text-gray-800 dark:text-white outline-none focus:border-orange-500"
          />
          <button
            type="button"
            onClick={() => {
              const d = new Date();
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, '0');
              setSelectedMonth(`${year}-${month}`);
            }}
            className="px-3 py-2 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 font-extrabold text-xs rounded-2xl hover:bg-orange-100 transition-all cursor-pointer"
          >
            Mois Actuel
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-2xl shadow-sm flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shrink-0"
            title="Exporter le rapport comptable au format CSV (Excel)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Exporter CSV</span>
          </button>
        </div>
      </div>

      {/* KPI RESULT SUMMARY BANNER (PROFIT OR LOSS) */}
      <div className={`p-6 rounded-3xl border shadow-lg transition-all ${
        isProfit 
          ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-500/40 shadow-emerald-600/20' 
          : 'bg-gradient-to-br from-rose-600 to-red-700 text-white border-rose-500/40 shadow-rose-600/20'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 mb-2">
              {isProfit ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              RÉSULTAT NET DU MOIS ({selectedMonth})
            </span>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-2">
              <span>{netResult >= 0 ? '+' : ''}{netResult.toLocaleString('fr-FR')} FCFA</span>
            </h3>
            <p className="text-xs text-white/90 font-medium mt-1">
              {isProfit 
                ? '🎉 Excellent mois ! Vos encaissements dépassent l\'ensemble de vos dépenses.' 
                : '⚠️ Mois en déficit de trésorerie. Les dépenses dépassent les recettes perçues.'}
            </p>
          </div>

          <div className="bg-black/20 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-2 shrink-0 w-full md:w-auto">
            <div className="text-[11px] font-bold flex justify-between gap-6">
              <span className="text-white/80">(+) Ventes du mois :</span>
              <span className="font-black text-emerald-200">{effectiveSales.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="text-[11px] font-bold flex justify-between gap-6">
              <span className="text-white/80">(+) Fonds Publications :</span>
              <span className="font-black text-amber-200">{totalPubRevenues.toLocaleString('fr-FR')} FCFA</span>
            </div>
            <div className="text-[11px] font-bold flex justify-between gap-6 border-t border-white/20 pt-1.5">
              <span className="text-white/80">(-) Dépenses du mois :</span>
              <span className="font-black text-rose-200">{totalExpenses.toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        </div>

        {/* Stock note beside result */}
        <div className="mt-4 pt-3 border-t border-white/20 text-[11px] text-white/80 flex items-center gap-1.5 font-medium">
          <Info className="w-4 h-4 text-white/90 shrink-0" />
          <span>
            <strong>Note patrimoniale :</strong> La valeur du stock restant à la fin du mois (<strong>{finalStockValue.toLocaleString('fr-FR')} FCFA</strong>) est affichée à titre d'actif patrimonial et n'est <u>pas intégrée</u> dans le calcul du résultat de trésorerie.
          </span>
        </div>
      </div>

      {/* SECTION 1: DÉPENSES DU MOIS */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h4 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
              <Receipt className="w-5 h-5 text-rose-500" />
              <span>Dépenses du Mois ({monthExpenses.length})</span>
            </h4>
            <p className="text-xs text-gray-500">Loyer, électricité, eau, abonnements et salaires du personnel/gérant.</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick pre-fill Zaka+ Subscription button */}
            {!monthExpenses.some(e => e.category === 'abonnement_zaka') && (
              <button
                type="button"
                onClick={handleAddZakaSubscriptionExpense}
                className="px-3 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 font-extrabold text-xs rounded-xl border border-amber-200 dark:border-amber-900/40 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                title="Pré-remplir la dépense Abonnement Zaka+"
              >
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                <span>+ Abonnement Zaka+ ({zakaSubscriptionAmount.toLocaleString('fr-FR')} FCFA)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowAddExpenseModal(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md shadow-rose-600/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Saisir une Dépense</span>
            </button>
          </div>
        </div>

        {/* Expense Category Breakdown Chart/Pills */}
        {monthExpenses.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-black text-gray-700 dark:text-gray-300">
              <span>Répartition par catégorie de dépense</span>
              <span className="text-rose-600 font-black">Total : {totalExpenses.toLocaleString('fr-FR')} FCFA</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {Object.entries(expenseBreakdown).map(([cat, amt]) => {
                const pct = totalExpenses > 0 ? Math.round((amt / totalExpenses) * 100) : 0;
                return (
                  <div key={cat} className="p-2.5 bg-white dark:bg-gray-900 rounded-xl border border-gray-150 dark:border-gray-800">
                    <span className="text-[10px] font-bold text-gray-400 capitalize block truncate">{cat}</span>
                    <div className="text-xs font-black text-gray-900 dark:text-white mt-0.5">
                      {amt.toLocaleString('fr-FR')} FCFA
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                    </div>
                    <span className="text-[9px] font-bold text-gray-400 mt-0.5 block text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Expenses Table / List */}
        {monthExpenses.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 dark:bg-gray-800/20 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 space-y-2">
            <Receipt className="w-8 h-8 text-gray-300 mx-auto" />
            <p className="text-xs font-bold text-gray-500">Aucune dépense enregistrée pour le mois de {monthLabel}.</p>
            <p className="text-[11px] text-gray-400">Cliquez sur le bouton ci-dessus pour ajouter le loyer, les factures ou les salaires.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-[10px] uppercase font-black text-gray-400">
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Catégorie</th>
                  <th className="p-2.5">Détail / Personnes payées</th>
                  <th className="p-2.5 text-right">Montant</th>
                  <th className="p-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {monthExpenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-all">
                    <td className="p-2.5 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                      {exp.date}
                    </td>
                    <td className="p-2.5 font-bold text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {getCategoryLabelText(exp.category, exp.categoryCustomName)}
                    </td>
                    <td className="p-2.5 text-gray-600 dark:text-gray-300">
                      <div>{exp.description || '-'}</div>
                      {exp.salaryLines && exp.salaryLines.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {exp.salaryLines.map(line => (
                            <span key={line.id} className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 text-[10px] font-bold border border-purple-100 dark:border-purple-900/40">
                              👤 {line.name} ({line.role}) : {line.amount.toLocaleString('fr-FR')} FCFA
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="p-2.5 text-right font-black text-rose-600 dark:text-rose-400 text-sm whitespace-nowrap">
                      {exp.amount.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="p-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        title="Supprimer la dépense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: VENTES DU MOIS */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-500" />
              <span>Ventes du Mois (Chiffre d'Affaires)</span>
            </h4>
            <p className="text-xs text-gray-500">Recettes brutes enregistrées sur la période sélectionnée.</p>
          </div>

          <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-2 rounded-2xl border border-emerald-200 dark:border-emerald-900/40">
            {effectiveSales.toLocaleString('fr-FR')} FCFA
          </span>
        </div>

        {posSalesForMonth > 0 ? (
          <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 space-y-1">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Module Caissier Actif • Total Ventes Caisse Automatique</span>
            </div>
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              Le montant de <strong>{posSalesForMonth.toLocaleString('fr-FR')} FCFA</strong> a été calculé automatiquement à partir des tickets de caisse validés ce mois-ci par l'équipe de caisse.
            </p>
          </div>
        ) : (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
              <Info className="w-4 h-4 text-orange-500" />
              <span>Saisie Manuelle des Ventes du Mois</span>
            </div>
            <p className="text-[11px] text-gray-500">
              Aucune vente de caisse automatique détectée pour ce mois. Saisissez directement le chiffre d'affaires réalisé :
            </p>

            <div className="flex items-center gap-2 max-w-md">
              <input
                type="number"
                min="0"
                placeholder="Ex: 1 500 000 FCFA"
                value={manualSalesInput}
                onChange={e => setManualSalesInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSaveManualSales}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Enregistrer
              </button>
            </div>
            {currentManualSalesRecord && (
              <p className="text-[10px] text-emerald-600 font-bold">
                ✓ Chiffre d'affaires actuellement enregistré : {currentManualSalesRecord.amount.toLocaleString('fr-FR')} FCFA
              </p>
            )}
          </div>
        )}
      </div>

      {/* SECTION 3: FONDS PROVENANT DES PUBLICATIONS */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-500" />
              <span>Revenus liés aux Publications & Événements</span>
            </h4>
            <p className="text-xs text-gray-500">Entrées payantes collectées, billetterie ou ventes générées par une promo.</p>
          </div>

          <span className="text-lg font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/50 px-4 py-2 rounded-2xl border border-amber-200 dark:border-amber-900/40">
            {totalPubRevenues.toLocaleString('fr-FR')} FCFA
          </span>
        </div>

        {monthPublications.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Aucune publication ou événement enregistré pour ce mois.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {monthPublications.map(pub => {
              const revRecord = monthPubRevenues.find(r => r.publicationId === pub.id);
              const isEditing = editingPubRevId === pub.id;

              return (
                <div key={pub.id} className="p-3.5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-150 dark:border-gray-800 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[9px] font-black uppercase text-amber-600 tracking-wider block">
                        {pub.type}
                      </span>
                      <h5 className="font-extrabold text-xs text-gray-900 dark:text-white line-clamp-1">
                        {pub.title}
                      </h5>
                    </div>

                    <span className="text-xs font-black text-amber-700 dark:text-amber-300">
                      {revRecord ? `${revRecord.amount.toLocaleString('fr-FR')} FCFA` : '0 FCFA'}
                    </span>
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        min="0"
                        placeholder="Montant FCFA"
                        value={pubRevInput}
                        onChange={e => setPubRevInput(e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => handleSavePubRevenue(pub.id, pub.title, pub.type)}
                        className="px-3 py-1.5 bg-amber-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                      >
                        Valider
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingPubRevId(null)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPubRevId(pub.id);
                        setPubRevInput(revRecord ? String(revRecord.amount) : '');
                      }}
                      className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      {revRecord ? 'Modifier le montant perçu' : '+ Associer un montant perçu'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 4: STOCK DISPONIBLE EN FIN DE MOIS (ADAPTÉ À LA CATÉGORIE) */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-500" />
              <span>Stock Disponible en Fin de Mois (Patrimoine)</span>
            </h4>
            <p className="text-xs text-gray-500">Valeur totale des produits ou marchandises restants à la fin du mois.</p>
          </div>

          <span className="text-lg font-black text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-4 py-2 rounded-2xl border border-purple-200 dark:border-purple-900/40">
            {finalStockValue.toLocaleString('fr-FR')} FCFA
          </span>
        </div>

        {/* Maquis / Boîte de Nuit : Calculated Stock */}
        {isMaquisOrBoite && (
          <div className="p-4 bg-purple-50/50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900/40 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black text-purple-800 dark:text-purple-300">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Calcul Automatique de l'Inventaire Boissons & Bouteilles</span>
            </div>
            <p className="text-[11px] text-purple-700 dark:text-purple-300 font-medium">
              Valeur calculée à partir des quantités actuelles du module Stock : <strong>{autoStockValue.value.toLocaleString('fr-FR')} FCFA</strong>.
              {autoStockValue.isEstimated && <span className="block text-[10px] italic text-amber-600 mt-0.5">⚠️ Note : Certains articles n'ayant pas de coût d'achat renseigné, leur prix de vente a été utilisé comme estimation.</span>}
            </p>
          </div>
        )}

        {/* Restaurant : Manual Kitchen/Food Stock Input */}
        {isRestaurant && (
          <div className="p-4 bg-purple-50/50 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900/40 space-y-3">
            <span className="text-xs font-black text-purple-800 dark:text-purple-300 block">
              Estimation du Stock Alimentaire & Ingrédients Cuisine
            </span>
            <div className="flex items-center gap-2 max-w-md">
              <input
                type="number"
                min="0"
                placeholder="Ex: 350 000 FCFA"
                value={manualStockInput}
                onChange={e => setManualStockInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
              />
              <button
                type="button"
                onClick={handleSaveManualStock}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl cursor-pointer"
              >
                Enregistrer
              </button>
            </div>
          </div>
        )}

        {/* Salon de coiffure : Toggle Products & Stock Input */}
        {isSalon && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                Votre salon vend-il des produits capillaires ou cosmétiques ?
              </span>
              <button
                type="button"
                onClick={() => setSalonHasProducts(prev => ({ ...prev, [establishment.id]: !hasProductsInSalon }))}
                className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                  hasProductsInSalon ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {hasProductsInSalon ? 'Oui (Produits en vente)' : 'Non (Services uniquement)'}
              </button>
            </div>

            {hasProductsInSalon && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-2">
                <span className="text-xs font-bold text-purple-800 dark:text-purple-300 block">
                  Valeur du stock de produits capillaires / cosmétiques (FCFA)
                </span>
                <div className="flex items-center gap-2 max-w-md">
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 150 000 FCFA"
                    value={manualStockInput}
                    onChange={e => setManualStockInput(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleSaveManualStock}
                    className="px-4 py-2 bg-purple-600 text-white font-black text-xs rounded-xl cursor-pointer"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL : ADD EXPENSE */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-500" />
                <span>Saisie d'une Dépense Mensuelle</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddExpenseModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Catégorie de dépense</label>
                <select
                  value={expCategory}
                  onChange={e => setExpCategory(e.target.value as ExpenseCategory)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                >
                  <option value="loyer">🏢 Loyer du local</option>
                  <option value="electricite">⚡ Électricité (SONABEL)</option>
                  <option value="eau">💧 Eau (ONEA)</option>
                  <option value="abonnement_canal">📺 Abonnement Canal+</option>
                  <option value="abonnement_zaka">🚀 Abonnement Zaka+ (Plateforme)</option>
                  <option value="salaires">👥 Salaires du personnel & Gérant</option>
                  <option value="autre">📌 Autre dépense personnalisée</option>
                </select>
              </div>

              {expCategory === 'autre' && (
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Intitulé de la dépense</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Réparation sonorisation, Achat chaises..."
                    value={expCustomName}
                    onChange={e => setExpCustomName(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium"
                  />
                </div>
              )}

              {/* SALAIRES CATEGORY : MULTI-LINE PERSONNEL EDITOR */}
              {expCategory === 'salaires' ? (
                <div className="p-3.5 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-900 dark:text-purple-200 block">
                      Détail des Salaires de l'Équipe
                    </span>
                    <button
                      type="button"
                      onClick={() => setSalaryLines(prev => [...prev, { id: String(Date.now()), name: '', role: 'Serveur', amount: 0 }])}
                      className="px-2.5 py-1 bg-purple-600 text-white font-bold text-[10px] rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Ajouter un employé
                    </button>
                  </div>
                  <p className="text-[10px] text-purple-700 dark:text-purple-300">
                    Incluez tous les membres payés (Gérant, Propriétaire, Caissier, Serveurs, DJ, Gardien...).
                  </p>

                  <div className="space-y-2">
                    {salaryLines.map((line, idx) => (
                      <div key={line.id} className="flex items-center gap-2 bg-white dark:bg-gray-900 p-2 rounded-xl border border-purple-100 dark:border-purple-900/40">
                        <input
                          type="text"
                          placeholder="Nom (Ex: Traoré)"
                          value={line.name}
                          onChange={e => {
                            const val = e.target.value;
                            setSalaryLines(prev => prev.map(l => l.id === line.id ? { ...l, name: val } : l));
                          }}
                          className="flex-1 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Poste (Ex: Gérant)"
                          value={line.role}
                          onChange={e => {
                            const val = e.target.value;
                            setSalaryLines(prev => prev.map(l => l.id === line.id ? { ...l, role: val } : l));
                          }}
                          className="w-24 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-bold"
                        />
                        <input
                          type="number"
                          min="0"
                          placeholder="Montant FCFA"
                          value={line.amount || ''}
                          onChange={e => {
                            const val = Number(e.target.value) || 0;
                            setSalaryLines(prev => prev.map(l => l.id === line.id ? { ...l, amount: val } : l));
                          }}
                          className="w-28 px-2 py-1 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs font-bold text-rose-600"
                        />
                        {salaryLines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setSalaryLines(prev => prev.filter(l => l.id !== line.id))}
                            className="text-gray-400 hover:text-red-600 p-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="text-right text-xs font-black text-purple-900 dark:text-purple-200 pt-1">
                    Total Salaires : {salaryLines.reduce((sum, l) => sum + l.amount, 0).toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Montant de la dépense (FCFA)</label>
                  <input
                    type="number"
                    min="0"
                    required
                    placeholder="Ex: 150000"
                    value={expAmount}
                    onChange={e => setExpAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-rose-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Description / Remarque (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Facture N°, Détails paiement..."
                  value={expDescription}
                  onChange={e => setExpDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Date exacte du règlement</label>
                <input
                  type="date"
                  value={expDate}
                  onChange={e => setExpDate(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer shadow-sm"
                >
                  Enregistrer la Dépense
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold py-3 rounded-xl text-xs hover:bg-gray-200 cursor-pointer"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
