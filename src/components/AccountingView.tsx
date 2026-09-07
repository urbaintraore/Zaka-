import React, { useMemo, useState } from 'react';
import { FileSpreadsheet, Download, ArrowLeft, LogOut, FileText, Plus, X, Receipt, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useAppStore } from '../store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export function AccountingView({ onBack, onLogout, establishmentId }: { onBack?: () => void; onLogout?: () => void; establishmentId?: string }) {
  const { ventes, expenses, addExpense, currentUser } = useAppStore();
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseType, setExpenseType] = useState('loyer');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');

  const estVentes = useMemo(() => {
    if (!establishmentId) return ventes || [];
    return (ventes || []).filter(v => v.establishmentId === establishmentId);
  }, [ventes, establishmentId]);

  const estExpenses = useMemo(() => {
    if (!establishmentId) return expenses || [];
    return (expenses || []).filter(e => e.establishmentId === establishmentId);
  }, [expenses, establishmentId]);

  // Aggregate daily sales
  const dailyChartData = useMemo(() => {
    const daily: Record<string, { date: string; Boissons: number; Cuisine: number; total: number }> = {};
    
    estVentes.forEach(sale => {
      const date = new Date(sale.date || Date.now()).toLocaleDateString('fr-FR');
      if (!daily[date]) {
        daily[date] = { date, Boissons: 0, Cuisine: 0, total: 0 };
      }
      const b = Number(sale.subtotalBoissons || 0);
      const c = Number(sale.subtotalCuisine || 0);
      if (!b && !c) {
        daily[date].Boissons += sale.totalAmount;
      } else {
        daily[date].Boissons += b;
        daily[date].Cuisine += c;
      }
      daily[date].total += sale.totalAmount;
    });

    return Object.values(daily).sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - new Date(b.date.split('/').reverse().join('-')).getTime()).slice(-14);
  }, [estVentes]);

  // Aggregate monthly sales
  const monthlyChartData = useMemo(() => {
    const monthly: Record<string, { date: string; Boissons: number; Cuisine: number; total: number }> = {};
    
    estVentes.forEach(sale => {
      const dateObj = new Date(sale.date || Date.now());
      // format: MM/YYYY
      const monthStr = dateObj.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
      const sortKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthly[sortKey]) {
        monthly[sortKey] = { date: monthStr, Boissons: 0, Cuisine: 0, total: 0 };
      }
      const b = Number(sale.subtotalBoissons || 0);
      const c = Number(sale.subtotalCuisine || 0);
      if (!b && !c) {
        monthly[sortKey].Boissons += sale.totalAmount;
      } else {
        monthly[sortKey].Boissons += b;
        monthly[sortKey].Cuisine += c;
      }
      monthly[sortKey].total += sale.totalAmount;
    });

    return Object.keys(monthly).sort().map(k => monthly[k]);
  }, [estVentes]);

  const totalRevenus = estVentes.reduce((acc, v) => acc + (v.totalAmount || 0), 0);
  const totalExpenses = estExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const benefice = totalRevenus - totalExpenses;

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseAmount || !establishmentId) return;
    
    await addExpense?.({
      establishmentId,
      type: expenseType,
      amount: Number(expenseAmount),
      description: expenseDesc,
      date: new Date().toISOString(),
      recordedBy: currentUser?.name
    });
    
    setShowExpenseModal(false);
    setExpenseAmount('');
    setExpenseDesc('');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Journal de Caisse - Statistiques des Ventes & Dépenses", 14, 15);
    
    doc.text("Bilan Périodique:", 14, 25);
    doc.text(`Revenus: ${totalRevenus} F`, 14, 32);
    doc.text(`Dépenses: ${totalExpenses} F`, 14, 39);
    doc.text(`Bénéfice: ${benefice} F`, 14, 46);

    const tableData = estVentes.map(v => [
      new Date(v.date || Date.now()).toLocaleString('fr-FR'),
      v.id.substring(0, 8),
      v.cashierName || 'N/A',
      `${v.totalAmount} F`,
      'Vente'
    ]);

    const expensesData = estExpenses.map(e => [
      new Date(e.date).toLocaleString('fr-FR'),
      e.id.substring(0, 8),
      e.recordedBy || 'N/A',
      `-${e.amount} F`,
      `Dépense (${e.type})`
    ]);

    const combinedData = [...tableData, ...expensesData].sort((a, b) => 
      new Date(b[0].split(' ')[0].split('/').reverse().join('-')).getTime() - 
      new Date(a[0].split(' ')[0].split('/').reverse().join('-')).getTime()
    );

    autoTable(doc, {
      head: [['Date', 'ID', 'Utilisateur', 'Montant', 'Type']],
      body: combinedData,
      startY: 55,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] } // blue-600
    });
    
    doc.save(`bilan-caisse-${establishmentId || 'all'}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 transition-colors">
              <ArrowLeft size={18} />
            </button>
          )}
          <div className="p-3 bg-blue-600 text-white rounded-xl shadow-sm">
            <FileSpreadsheet size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Journal de Caisse & Statistiques</h2>
            <p className="text-xs text-gray-500">Suivi des chiffres d'affaires et recettes ({estVentes.length} ventes)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowExpenseModal(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-colors shadow-sm"
          >
            <Plus size={16} />
            <span>Nouvelle Dépense</span>
          </button>
          <button 
            onClick={exportPDF}
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center gap-2 transition-colors"
          >
            <FileText size={16} />
            <span>Exporter en PDF</span>
          </button>
          {onLogout && (
            <button onClick={onLogout} className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl transition-colors">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 text-blue-600 mb-4">
            <TrendingUp size={20} />
            <h3 className="text-sm font-bold text-gray-900">Chiffre d'Affaires</h3>
          </div>
          <p className="text-3xl font-black text-blue-600">{totalRevenus.toLocaleString()} F</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center gap-2 text-red-500 mb-4">
            <TrendingDown size={20} />
            <h3 className="text-sm font-bold text-gray-900">Dépenses (Charges)</h3>
          </div>
          <p className="text-3xl font-black text-red-500">{totalExpenses.toLocaleString()} F</p>
        </div>
        <div className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between ${benefice >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
          <div className={`flex items-center gap-2 mb-4 ${benefice >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            <DollarSign size={20} />
            <h3 className="text-sm font-bold">Bénéfice Net</h3>
          </div>
          <p className={`text-3xl font-black ${benefice >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
            {benefice > 0 ? '+' : ''}{benefice.toLocaleString()} F
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-gray-900">Performance Quotidienne (14 derniers jours)</h3>
          {dailyChartData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `${val/1000}k`} axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} FCFA`, undefined]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Boissons" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Cuisine" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-500 font-medium">Aucune donnée pour cette période.</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs space-y-6">
          <h3 className="text-sm font-bold text-gray-900">Performance Mensuelle</h3>
          {monthlyChartData.length > 0 ? (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickMargin={10} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={(val) => `${val/1000}k`} axisLine={false} tickLine={false} />
                  <Tooltip 
                    formatter={(value: number) => [`${value.toLocaleString()} FCFA`, undefined]}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Boissons" stackId="a" fill="#3b82f6" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="Cuisine" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-sm text-gray-500 font-medium">Aucune donnée de vente mensuelle.</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Historique des ventes */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Dernières Ventes</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] uppercase text-gray-500 font-bold">
                  <th className="py-3 px-5 border-b border-gray-100">Date & Heure</th>
                  <th className="py-3 px-5 border-b border-gray-100">Montant</th>
                </tr>
              </thead>
              <tbody>
                {estVentes.slice(0, 10).map((v, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-5 border-b border-gray-50 text-xs text-gray-900">
                      {new Date(v.date || Date.now()).toLocaleString('fr-FR')}
                    </td>
                    <td className="py-3 px-5 border-b border-gray-50 text-xs font-bold text-blue-600">
                      +{v.totalAmount?.toLocaleString()} F
                    </td>
                  </tr>
                ))}
                {estVentes.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-8 text-center text-xs text-gray-500">
                      Aucune vente enregistrée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Historique des Dépenses */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-xs">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900">Dernières Dépenses</h3>
            <span className="text-xs font-bold text-red-500">{totalExpenses.toLocaleString()} F Total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] uppercase text-gray-500 font-bold">
                  <th className="py-3 px-5 border-b border-gray-100">Date</th>
                  <th className="py-3 px-5 border-b border-gray-100">Type</th>
                  <th className="py-3 px-5 border-b border-gray-100">Montant</th>
                </tr>
              </thead>
              <tbody>
                {estExpenses.slice(0, 10).map((e, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-5 border-b border-gray-50 text-xs text-gray-900">
                      {new Date(e.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="py-3 px-5 border-b border-gray-50 text-xs text-gray-500 capitalize">
                      {e.type}
                    </td>
                    <td className="py-3 px-5 border-b border-gray-50 text-xs font-bold text-red-500">
                      -{e.amount?.toLocaleString()} F
                    </td>
                  </tr>
                ))}
                {estExpenses.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-xs text-gray-500">
                      Aucune dépense enregistrée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showExpenseModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-orange-500" />
                Enregistrer une dépense
              </h3>
              <button 
                onClick={() => setShowExpenseModal(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAddExpense} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Type de Dépense *</label>
                <select 
                  required
                  value={expenseType}
                  onChange={e => setExpenseType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:border-orange-500 dark:text-white"
                >
                  <option value="loyer">Loyer</option>
                  <option value="electricite">Électricité</option>
                  <option value="eau">Eau</option>
                  <option value="personnel">Personnel (Vigile, Gérant, Serveur...)</option>
                  <option value="marchandise">Marchandise / Réapprovisionnement</option>
                  <option value="autre">Autre Dépense</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Montant (FCFA) *</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  value={expenseAmount}
                  onChange={e => setExpenseAmount(e.target.value)}
                  placeholder="ex: 15000"
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-black focus:outline-none focus:border-orange-500 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">Description / Note</label>
                <input 
                  type="text" 
                  value={expenseDesc}
                  onChange={e => setExpenseDesc(e.target.value)}
                  placeholder="Détails de la dépense..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm focus:outline-none focus:border-orange-500 text-gray-900 dark:text-white"
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-[0.98]"
                >
                  Valider la dépense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
