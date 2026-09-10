import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingBag,
  Scissors,
  Package,
  Calendar,
  Clock,
  Award,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  BarChart3,
  Download,
  Filter,
  Sparkles,
  RefreshCw,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  BeautySalon,
  BeautySale,
  BeautyProduct,
  BeautyService,
  BeautyStaffMember,
  BeautyCommercialStats
} from '../../types';
import {
  fetchCommercialStats,
  fetchBeautySales,
  fetchBeautyProducts,
  fetchSalonServices,
  fetchSalonStaff,
  BEAUTY_PAYMENT_LABELS,
  formatFcfa
} from '../../lib/beautyService';

interface BeautyAnalyticsViewProps {
  salon: BeautySalon;
}

const PAYMENT_COLORS: Record<string, string> = {
  especes: '#10B981',
  orange_money: '#F97316',
  moov_money: '#3B82F6',
  wave: '#06B6D4',
  virement: '#8B5CF6',
  autre: '#6B7280'
};

export function BeautyAnalyticsView({ salon }: BeautyAnalyticsViewProps) {
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'quarter' | 'year' | 'all'>('month');
  const [stats, setStats] = useState<BeautyCommercialStats | null>(null);
  const [sales, setSales] = useState<BeautySale[]>([]);
  const [products, setProducts] = useState<BeautyProduct[]>([]);
  const [services, setServices] = useState<BeautyService[]>([]);
  const [staff, setStaff] = useState<BeautyStaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [st, sList, pList, srvList, stfList] = await Promise.all([
        fetchCommercialStats(salon.id, period),
        fetchBeautySales(salon.id),
        fetchBeautyProducts(salon.id, false),
        fetchSalonServices(salon.id, true),
        fetchSalonStaff(salon.id)
      ]);
      setStats(st);
      setSales(sList);
      setProducts(pList);
      setServices(srvList);
      setStaff(stfList);
    } catch (err) {
      console.warn('Erreur chargement statistiques:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [salon.id, period]);

  // Export Summary Report
  const handleExportReport = () => {
    if (!stats) return;
    const lines = [
      `RAPPORT COMMERCIAL ZAKA BEAUTY — ${salon.nom}`,
      `Période : ${period.toUpperCase()}`,
      `Généré le : ${new Date().toLocaleString('fr-FR')}`,
      `----------------------------------------------------`,
      `Chiffre d'Affaires Total : ${formatFcfa(stats.chiffreAffairesTotalFcfa)}`,
      `CA Prestations (Services) : ${formatFcfa(stats.chiffreAffairesServicesFcfa)}`,
      `CA Vente Produits : ${formatFcfa(stats.chiffreAffairesProduitsFcfa)}`,
      `Nombre de Ventes : ${stats.nombreVentes}`,
      `Panier Moyen : ${formatFcfa(stats.panierMoyenFcfa)}`,
      `Total Remises Accordées : ${formatFcfa(stats.totalRemisesFcfa)}`,
      `----------------------------------------------------`,
      `RÉPARTITION PAIEMENTS :`,
      `Espèces : ${formatFcfa(stats.repartitionPaiements.especes)}`,
      `Orange Money : ${formatFcfa(stats.repartitionPaiements.orange_money)}`,
      `Moov Money : ${formatFcfa(stats.repartitionPaiements.moov_money)}`,
      `Wave : ${formatFcfa(stats.repartitionPaiements.wave)}`,
      `Virement : ${formatFcfa(stats.repartitionPaiements.virement)}`,
      `Autre : ${formatFcfa(stats.repartitionPaiements.autre)}`,
      `----------------------------------------------------`,
      `TOP 5 PRESTATIONS :`,
      ...stats.topServices.map(s => `- ${s.nom} : ${s.quantite} fois (${formatFcfa(s.totalFcfa)})`),
      `----------------------------------------------------`,
      `TOP 5 PRODUITS :`,
      ...stats.topProduits.map(p => `- ${p.nom} : ${p.quantite} unités (${formatFcfa(p.totalFcfa)})`)
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rapport_commercial_${salon.nom.toLowerCase().replace(/\s+/g, '_')}_${period}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const serviceVsProductRatio = useMemo(() => {
    if (!stats || stats.chiffreAffairesTotalFcfa === 0) return { services: 50, products: 50 };
    const servPct = Math.round((stats.chiffreAffairesServicesFcfa / stats.chiffreAffairesTotalFcfa) * 100);
    return { services: servPct, products: 100 - servPct };
  }, [stats]);

  // Recharts Data Transformation
  const paymentChartData = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.repartitionPaiements)
      .filter(([_, amount]) => amount > 0)
      .map(([methodKey, amount]) => {
        const cfg = BEAUTY_PAYMENT_LABELS[methodKey] || { label: methodKey };
        return {
          name: cfg.label,
          value: amount,
          color: PAYMENT_COLORS[methodKey] || '#6366F1'
        };
      });
  }, [stats]);

  const topServicesChartData = useMemo(() => {
    if (!stats) return [];
    return stats.topServices.slice(0, 5).map(s => ({
      name: s.nom.length > 18 ? s.nom.substring(0, 15) + '...' : s.nom,
      totalFcfa: s.totalFcfa,
      quantite: s.quantite
    }));
  }, [stats]);

  const salesTrendData = useMemo(() => {
    if (!sales || sales.length === 0) return [];
    // Group sales by date
    const dateMap: Record<string, number> = {};
    sales.forEach(sale => {
      if (sale.statut !== 'annule') {
        const d = sale.dateVente ? sale.dateVente.substring(0, 10) : (sale.createdAt ? sale.createdAt.substring(0, 10) : 'Récents');
        dateMap[d] = (dateMap[d] || 0) + sale.montantTotalFcfa;
      }
    });

    return Object.entries(dateMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7)
      .map(([date, total]) => ({
        date: date.length > 5 ? date.substring(5) : date,
        total
      }));
  }, [sales]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <span>Statistiques & Rentabilité</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                Analytics V2
              </span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Analyse des ventes, prestations phares, panier moyen et performance d'équipe.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Period Selector */}
          <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-750 rounded-2xl text-xs font-bold">
            {(
              [
                { id: 'today', label: "Aujourd'hui" },
                { id: 'week', label: 'Semaine' },
                { id: 'month', label: 'Mois' },
                { id: 'quarter', label: 'Trimestre' },
                { id: 'year', label: 'Année' },
                { id: 'all', label: 'Global' }
              ] as const
            ).map(p => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  period === p.id
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportReport}
            className="p-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 rounded-xl transition-colors"
            title="Exporter le rapport"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Core Financial KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total CA */}
        <div className="p-5 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl text-white shadow-xl shadow-indigo-600/20 space-y-2">
          <div className="flex items-center justify-between text-indigo-200">
            <span className="text-xs font-semibold">Chiffre d'Affaires</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <p className="text-2xl font-black tracking-tight">
            {formatFcfa(stats?.chiffreAffairesTotalFcfa || 0)}
          </p>
          <div className="text-[11px] text-indigo-200 flex items-center justify-between pt-1 border-t border-white/10">
            <span>Prestations : {formatFcfa(stats?.chiffreAffairesServicesFcfa || 0)}</span>
          </div>
        </div>

        {/* Panier Moyen */}
        <div className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Panier Moyen / Ticket</span>
            <ShoppingBag className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {formatFcfa(stats?.panierMoyenFcfa || 0)}
          </p>
          <div className="text-[11px] text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-700">
            <span>Sur {stats?.nombreVentes || 0} encaissement(s)</span>
          </div>
        </div>

        {/* Ventes Produits */}
        <div className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">CA Vente Produits</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
            {formatFcfa(stats?.chiffreAffairesProduitsFcfa || 0)}
          </p>
          <div className="text-[11px] text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-700">
            <span>{serviceVsProductRatio.products}% du volume total</span>
          </div>
        </div>

        {/* Remises accordées */}
        <div className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-gray-400">
            <span className="text-xs font-semibold">Remises & Récompenses</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
            {formatFcfa(stats?.totalRemisesFcfa || 0)}
          </p>
          <div className="text-[11px] text-gray-400 pt-1 border-t border-gray-100 dark:border-gray-700">
            <span>Fidélisation & Promotions</span>
          </div>
        </div>
      </div>

      {/* Visual Recharts Section: Trend Chart & Payment Methods Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sales Trend Bar Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <span>Évolution du Chiffre d'Affaires</span>
            </h3>
            <span className="text-xs text-gray-400">Derniers jours enregistrés</span>
          </div>

          <div className="h-64 w-full">
            {salesTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#888888" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#888888" />
                  <Tooltip
                    formatter={(value: any) => [formatFcfa(Number(value)), 'Recettes']}
                    contentStyle={{ backgroundColor: '#1F2937', color: '#FFF', borderRadius: '12px', border: 'none' }}
                  />
                  <Bar dataKey="total" fill="#6366F1" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-400">
                Aucune donnée de vente pour générer le graphique d'évolution.
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods Pie Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-rose-500" />
              <span>Canaux de Paiement</span>
            </h3>
            <p className="text-xs text-gray-400 mt-1">Ventilation des encaissements par mode de règlement</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {paymentChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {paymentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => [formatFcfa(Number(value)), 'Montant']} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-xs text-gray-400 text-center">
                Aucun encaissement sur cette période.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Top Prestations & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Scissors className="w-4 h-4 text-rose-500" />
              <span>Top 5 Prestations les Plus Demandées</span>
            </h3>
          </div>

          <div className="space-y-3">
            {!stats || stats.topServices.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                Aucune prestation enregistrée sur cette période.
              </div>
            ) : (
              stats.topServices.map((srv, index) => (
                <div
                  key={srv.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 font-extrabold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{srv.nom}</p>
                      <p className="text-[10px] text-gray-400">{srv.quantite} réalisation(s)</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-rose-600 dark:text-rose-400 text-sm">
                    {formatFcfa(srv.totalFcfa)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              <span>Top 5 Produits les Plus Vendus</span>
            </h3>
          </div>

          <div className="space-y-3">
            {!stats || stats.topProduits.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                Aucun produit vendu sur cette période.
              </div>
            ) : (
              stats.topProduits.map((prod, index) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-2xl text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-extrabold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{prod.nom}</p>
                      <p className="text-[10px] text-gray-400">{prod.quantite} unité(s) écoulée(s)</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                    {formatFcfa(prod.totalFcfa)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 4: Staff Member Performance */}
      {stats && stats.performancesEmployes.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            <span>Performance Commerciale de l'Équipe</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.performancesEmployes.map(emp => (
              <div
                key={emp.employeeId}
                className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-900 dark:text-white">{emp.nom}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    {emp.nombrePrestations} prestation(s)
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-baseline">
                  <span className="text-gray-400">CA Généré :</span>
                  <span className="font-black text-sm text-purple-600 dark:text-purple-400">
                    {formatFcfa(emp.totalCaFcfa)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export const SalesAnalyticsDashboard = BeautyAnalyticsView;

