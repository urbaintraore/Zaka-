import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Download, 
  Printer, 
  FileSpreadsheet, 
  ArrowUpRight, 
  ArrowDownRight, 
  DollarSign, 
  RefreshCw, 
  CreditCard, 
  Receipt, 
  CheckCircle2, 
  PieChart as PieIcon 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  AreaChart, 
  Area 
} from 'recharts';
import { 
  BeautySalon, 
  BeautySale, 
  BeautyExpense 
} from '../../types';
import { 
  fetchBeautySales, 
  fetchBeautyExpenses, 
  BEAUTY_PAYMENT_LABELS, 
  BEAUTY_EXPENSE_CATEGORY_LABELS, 
  formatFcfa 
} from '../../lib/beautyService';

interface FinancialReportProps {
  salon: BeautySalon;
}

export function FinancialReport({ salon }: FinancialReportProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const [sales, setSales] = useState<BeautySale[]>([]);
  const [expenses, setExpenses] = useState<BeautyExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const [salesList, expList] = await Promise.all([
        fetchBeautySales(salon.id),
        fetchBeautyExpenses(salon.id, selectedMonth)
      ]);

      // Filter sales for selected month
      const monthSales = salesList.filter(s => 
        s.statut !== 'annule' && 
        s.dateVente && 
        s.dateVente.startsWith(selectedMonth)
      );

      setSales(monthSales);
      setExpenses(expList);
    } catch (err) {
      console.warn('Erreur chargement rapport financier:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [salon.id, selectedMonth]);

  // Cash In (Total Recettes)
  const totalCashInFcfa = useMemo(() => {
    return sales.reduce((acc, s) => acc + (s.montantTotalFcfa || 0), 0);
  }, [sales]);

  // Cash Out (Total Dépenses)
  const totalCashOutFcfa = useMemo(() => {
    return expenses.reduce((acc, e) => acc + (e.montantFcfa || 0), 0);
  }, [expenses]);

  // Net Cashflow
  const netCashflowFcfa = totalCashInFcfa - totalCashOutFcfa;
  const netMarginPercent = totalCashInFcfa > 0 
    ? Math.round((netCashflowFcfa / totalCashInFcfa) * 100) 
    : 0;

  // Breakdown Cash In by Payment Method
  const cashInByPaymentMethod = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach(s => {
      const pm = s.moyenPaiement || 'especes';
      map[pm] = (map[pm] || 0) + s.montantTotalFcfa;
    });
    return Object.entries(map).map(([method, total]) => ({
      name: BEAUTY_PAYMENT_LABELS[method as keyof typeof BEAUTY_PAYMENT_LABELS]?.label || method,
      total
    })).sort((a, b) => b.total - a.total);
  }, [sales]);

  // Breakdown Cash Out by Expense Category
  const cashOutByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => {
      const cat = e.categorie;
      map[cat] = (map[cat] || 0) + e.montantFcfa;
    });
    return Object.entries(map).map(([cat, total]) => ({
      name: BEAUTY_EXPENSE_CATEGORY_LABELS[cat as keyof typeof BEAUTY_EXPENSE_CATEGORY_LABELS]?.label || cat,
      total
    })).sort((a, b) => b.total - a.total);
  }, [expenses]);

  // Daily Cashflow Trend Chart Data
  const dailyCashflowData = useMemo(() => {
    const dailyMap: Record<string, { day: string; cashIn: number; cashOut: number }> = {};
    
    // Fill days of current month
    const [year, month] = selectedMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${selectedMonth}-${String(d).padStart(2, '0')}`;
      dailyMap[dayStr] = { day: `${String(d).padStart(2, '0')}`, cashIn: 0, cashOut: 0 };
    }

    sales.forEach(s => {
      const d = s.dateVente ? s.dateVente.substring(0, 10) : null;
      if (d && dailyMap[d]) {
        dailyMap[d].cashIn += s.montantTotalFcfa;
      }
    });

    expenses.forEach(e => {
      const d = e.dateDepense ? e.dateDepense.substring(0, 10) : null;
      if (d && dailyMap[d]) {
        dailyMap[d].cashOut += e.montantFcfa;
      }
    });

    return Object.values(dailyMap).map(item => ({
      ...item,
      net: item.cashIn - item.cashOut
    }));
  }, [sales, expenses, selectedMonth]);

  // Month label display
  const monthDisplayLabel = useMemo(() => {
    const [y, m] = selectedMonth.split('-');
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${months[parseInt(m, 10) - 1] || m} ${y}`;
  }, [selectedMonth]);

  // Print Report Handler
  const handlePrintReport = () => {
    window.print();
  };

  // Export Financial Report TXT/CSV
  const handleExportCSV = () => {
    const lines = [
      `RÉCAPITULATIF DE TRÉSORERIE (CASHFLOW) — ${salon.nom.toUpperCase()}`,
      `Période : ${monthDisplayLabel}`,
      `Date de génération : ${new Date().toLocaleString('fr-FR')}`,
      `====================================================`,
      `ENTRÉES DE TRÉSORERIE (CASH IN)  : ${formatFcfa(totalCashInFcfa)}`,
      `SORTIES DE TRÉSORERIE (CASH OUT) : ${formatFcfa(totalCashOutFcfa)}`,
      `FLUX NET DE TRÉSORERIE           : ${formatFcfa(netCashflowFcfa)}`,
      `TAUX DE MARGE OPÉRATIONNELLE     : ${netMarginPercent}%`,
      `====================================================`,
      `RÉPARTITION DES ENTRÉES PAR MOYEN DE PAIEMENT :`,
      ...cashInByPaymentMethod.map(c => `- ${c.name} : ${formatFcfa(c.total)}`),
      `====================================================`,
      `RÉPARTITION DES SORTIES PAR CATÉGORIE :`,
      ...cashOutByCategory.map(c => `- ${c.name} : ${formatFcfa(c.total)}`),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_cashflow_${salon.nom.toLowerCase().replace(/\s+/g, '_')}_${selectedMonth}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <span>Rapport Financier & Flux de Trésorerie</span>
          </h2>
          <p className="text-xs text-gray-400 font-medium">
            Synthèse Cashflow combinant les recettes POS 'beauty_sales' et les dépenses
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-2xl border border-gray-200/80 dark:border-gray-700">
            <Calendar className="w-4 h-4 text-indigo-500 ml-1" />
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="bg-transparent text-xs font-bold text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-2xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Exporter le rapport texte/CSV"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span className="hidden md:inline">Exporter</span>
          </button>

          <button
            onClick={handlePrintReport}
            className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
            title="Imprimer le rapport financier"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden md:inline">Imprimer</span>
          </button>
        </div>
      </div>

      {/* 3 Major Cashflow Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cash In */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-emerald-100 dark:border-emerald-950 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Entrées (Cash In)</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatFcfa(totalCashInFcfa)}
          </div>
          <span className="text-[11px] font-semibold text-gray-400 block">
            {sales.length} transaction(s) encaissement
          </span>
        </div>

        {/* Cash Out */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 border border-rose-100 dark:border-rose-950 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Sorties (Cash Out)</span>
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatFcfa(totalCashOutFcfa)}
          </div>
          <span className="text-[11px] font-semibold text-gray-400 block">
            {expenses.length} dépense(s) décaissée(s)
          </span>
        </div>

        {/* Net Cashflow */}
        <div className={`bg-white dark:bg-gray-900 rounded-3xl p-5 border shadow-sm space-y-1 ${
          netCashflowFcfa >= 0 ? 'border-indigo-100 dark:border-indigo-950' : 'border-red-100 dark:border-red-950'
        }`}>
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-bold uppercase tracking-wider">Flux Net (Net Cashflow)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800">
              Marge: {netMarginPercent}%
            </span>
          </div>
          <div className={`text-2xl font-black ${
            netCashflowFcfa >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'
          }`}>
            {formatFcfa(netCashflowFcfa)}
          </div>
          <span className="text-[11px] font-semibold text-gray-400 block">
            Trésorerie nette du mois de {monthDisplayLabel}
          </span>
        </div>
      </div>

      {/* Cashflow Recharts Bar Chart */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          <span>Évolution Journalière de la Trésorerie ({monthDisplayLabel})</span>
        </h3>

        {loading ? (
          <div className="py-12 text-center text-xs text-gray-400 space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-indigo-500" />
            <span>Calcul du flux de trésorerie...</span>
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyCashflowData}>
                <XAxis dataKey="day" stroke="#9CA3AF" fontSize={10} />
                <YAxis stroke="#9CA3AF" fontSize={10} />
                <Tooltip formatter={(val: any) => formatFcfa(Number(val))} />
                <Legend />
                <Bar dataKey="cashIn" name="Entrées (FCFA)" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cashOut" name="Sorties (FCFA)" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Side-by-side Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cash In Breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
          <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <span>Répartition des Entrées (Paiements)</span>
          </h3>

          <div className="space-y-2">
            {cashInByPaymentMethod.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Aucun encaissement pour ce mois.</p>
            ) : cashInByPaymentMethod.map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 dark:border-gray-800">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{c.name}</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{formatFcfa(c.total)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cash Out Breakdown */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-sm space-y-3">
          <h3 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Receipt className="w-4 h-4 text-rose-500" />
            <span>Répartition des Sorties (Postes de coût)</span>
          </h3>

          <div className="space-y-2">
            {cashOutByCategory.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Aucune dépense pour ce mois.</p>
            ) : cashOutByCategory.map(c => (
              <div key={c.name} className="flex items-center justify-between text-xs py-1.5 border-b border-gray-50 dark:border-gray-800">
                <span className="font-semibold text-gray-700 dark:text-gray-300">{c.name}</span>
                <span className="font-extrabold text-rose-600 dark:text-rose-400">{formatFcfa(c.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
