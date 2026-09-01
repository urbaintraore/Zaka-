import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store';
import { SaleRecord, StockItem, Establishment } from '../types';
import { 
  ShoppingBag, Package, History, User, Share2, DollarSign, Calendar,
  Filter, ArrowUpDown, ChevronDown, CheckCircle, Printer, X, Eye, TrendingUp,
  Layers, Plus, Minus, Search, AlertTriangle, Download, Image as ImageIcon,
  Edit2, Trash2, RefreshCw, Store, Check, Sparkles, Utensils, GlassWater, Flame
} from 'lucide-react';
import { PointOfSaleView } from './PointOfSaleView';
import { StockManagerView } from './StockManagerView';
import { 
  generateReceiptDataUrl, 
  downloadReceiptImage, 
  shareReceiptImage 
} from '../utils/receiptImageGenerator';

interface CashierDashboardProps {
  establishmentId?: string;
  onLogout?: () => void;
}

export function CashierDashboard({ establishmentId: propEstId, onLogout }: CashierDashboardProps) {
  const { 
    currentUser, 
    ventes, 
    establishments, 
    relationshipRequests, 
    stocks, 
    addStockItem, 
    updateStockItem, 
    deleteStockItem,
    recordSale 
  } = useAppStore();

  // Find establishments where user is an accredited cashier
  const cashierRequests = useMemo(() => {
    if (!currentUser) return [];
    return relationshipRequests.filter(r => 
      (r.initiatorId === currentUser.id || r.targetId === currentUser.id) &&
      r.status === 'acceptee' &&
      (r.isCaissier === true || r.requestedRole === 'caissier')
    );
  }, [relationshipRequests, currentUser]);

  const assignedEstablishments = useMemo(() => {
    const ids = cashierRequests.map(r => r.establishmentId);
    let list = establishments.filter(e => ids.includes(e.id));
    if (list.length === 0 && propEstId) {
      const found = establishments.find(e => e.id === propEstId);
      if (found) list = [found];
    }
    // Fallback: if user is logged in as cashier or manager, provide available establishments
    if (list.length === 0) {
      list = establishments;
    }
    return list;
  }, [cashierRequests, establishments, propEstId]);

  // Selected establishment
  const [selectedEstId, setSelectedEstId] = useState<string>(() => {
    if (propEstId) return propEstId;
    if (assignedEstablishments.length > 0) return assignedEstablishments[0].id;
    return establishments[0]?.id || '';
  });

  useEffect(() => {
    if (propEstId) {
      setSelectedEstId(propEstId);
    } else if (!selectedEstId && assignedEstablishments.length > 0) {
      setSelectedEstId(assignedEstablishments[0].id);
    }
  }, [propEstId, assignedEstablishments, selectedEstId]);

  const currentEst = useMemo(() => {
    return establishments.find(e => e.id === selectedEstId) || assignedEstablishments[0] || null;
  }, [establishments, selectedEstId, assignedEstablishments]);

  // Tabs: 'ventes' (Point de vente) | 'stocks' (Gestion de stock) | 'historique' (Journal de caisse)
  const [activeTab, setActiveTab] = useState<'ventes' | 'stocks' | 'historique'>('ventes');

  const isOwner = Boolean(
    currentUser && (
      (currentEst && currentEst.ownerId === currentUser.id) || 
      currentUser.role === 'admin' || 
      currentUser.role === 'gerant'
    )
  );

  // Filters state for sales history
  const [dateFilter, setDateFilter] = useState<'today' | '7d' | '30d' | 'custom' | 'all'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedCashierId, setSelectedCashierId] = useState<string>('all');
  
  // Receipt Inspector Modal State
  const [viewingReceiptSale, setViewingReceiptSale] = useState<SaleRecord | null>(null);
  const [modalReceiptImageUrl, setModalReceiptImageUrl] = useState<string | null>(null);
  const [isGeneratingModalImage, setIsGeneratingModalImage] = useState(false);
  const [receiptFeedback, setReceiptFeedback] = useState<string | null>(null);

  // Unique list of sales for this establishment
  const establishmentSales = useMemo(() => {
    if (!selectedEstId) return [];
    return ventes.filter(sale => sale.establishmentId === selectedEstId);
  }, [ventes, selectedEstId]);

  const uniqueCashiers = useMemo(() => {
    const map = new Map<string, string>();
    establishmentSales.forEach(s => {
      if (s.cashierId) {
        map.set(s.cashierId, s.cashierName || 'Caissier');
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [establishmentSales]);

  // Filtered sales
  const filteredSales = useMemo(() => {
    let list = [...establishmentSales];

    // Role-based visibility: Gérant sees all cashiers, Caissier sees only their own
    if (!isOwner) {
      list = list.filter(sale => sale.cashierId === currentUser?.id);
    } else if (selectedCashierId !== 'all') {
      list = list.filter(sale => sale.cashierId === selectedCashierId);
    }

    // Date filtering
    const now = new Date();
    if (dateFilter === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      list = list.filter(s => s.date.startsWith(todayStr));
    } else if (dateFilter === '7d') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      list = list.filter(s => new Date(s.date) >= sevenDaysAgo);
    } else if (dateFilter === '30d') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      list = list.filter(s => new Date(s.date) >= thirtyDaysAgo);
    } else if (dateFilter === 'custom') {
      if (customStartDate) {
        const start = new Date(`${customStartDate}T00:00:00`);
        list = list.filter(s => new Date(s.date) >= start);
      }
      if (customEndDate) {
        const end = new Date(`${customEndDate}T23:59:59`);
        list = list.filter(s => new Date(s.date) <= end);
      }
    }

    // Sort by date descending
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }, [establishmentSales, isOwner, currentUser, selectedCashierId, dateFilter, customStartDate, customEndDate]);

  // Computed summary metrics
  const totalRevenue = useMemo(() => {
    return filteredSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  }, [filteredSales]);

  const totalItemsSold = useMemo(() => {
    return filteredSales.reduce((sum, s) => {
      const saleQty = s.items ? s.items.reduce((acc, it) => acc + (it.quantity || 0), 0) : 0;
      return sum + saleQty;
    }, 0);
  }, [filteredSales]);

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} F CFA`;
  };

  // Generate Image for receipt modal
  useEffect(() => {
    if (viewingReceiptSale) {
      setIsGeneratingModalImage(true);
      generateReceiptDataUrl(viewingReceiptSale, currentEst)
        .then(url => setModalReceiptImageUrl(url))
        .catch(err => console.error('Erreur génération image modal:', err))
        .finally(() => setIsGeneratingModalImage(false));
    } else {
      setModalReceiptImageUrl(null);
    }
  }, [viewingReceiptSale, currentEst]);

  const handleShareModalReceipt = async (sale: SaleRecord) => {
    try {
      const res = await shareReceiptImage(sale, currentEst);
      if (res.shared) {
        setReceiptFeedback("Reçu partagé avec succès !");
      } else if (res.method === 'download') {
        setReceiptFeedback("Image du reçu téléchargée (PNG) !");
      }
      setTimeout(() => setReceiptFeedback(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadModalReceipt = (sale: SaleRecord) => {
    downloadReceiptImage(sale, currentEst);
    setReceiptFeedback("Image du reçu téléchargée (PNG) !");
    setTimeout(() => setReceiptFeedback(null), 3000);
  };

  const shareReceiptWhatsApp = (sale: SaleRecord) => {
    const itemsText = sale.items
      .map(it => `• ${it.name} x${it.quantity} (${formatPrice(it.unitPrice)}/u) = ${formatPrice(it.unitPrice * it.quantity)}`)
      .join('\n');
    
    const text = `🧾 *REÇU DE VENTE - ${currentEst?.name || 'Zaka+'}*\n` +
      `---------------------------\n` +
      `🏢 Établissement : *${currentEst?.name || 'Notre établissement'}*\n` +
      `📅 Date : ${new Date(sale.date).toLocaleString('fr-FR')}\n` +
      `👤 Caissier : ${sale.cashierName || 'Staff'}\n` +
      `🧾 Réf : #${sale.id.slice(0, 8)}\n` +
      `---------------------------\n` +
      `*Articles vendus :*\n${itemsText}\n` +
      `---------------------------\n` +
      `💰 *TOTAL ENCAISSÉ : ${formatPrice(sale.totalAmount)}*\n\n` +
      `Merci pour votre confiance ! ✨`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" id="cashier-dashboard-root">
      {/* Top Header / Context */}
      <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-4 sm:p-5 rounded-3xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-600/20 shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-gray-950 dark:text-white">
                  Espace Caisse & Stocks
                </h2>
                <span className="px-2.5 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-950/50 dark:text-orange-300 rounded-full text-[10px] font-black uppercase">
                  {isOwner ? "Supervision Gérant" : "Caissier Dédié"}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Saisie des ventes, gestion des boissons, stocks en temps réel et reçus.
              </p>
            </div>
          </div>

          {/* Establishment Switcher (if multiple or selector needed) */}
          {assignedEstablishments.length > 1 && (
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-orange-600 shrink-0" />
              <select
                value={selectedEstId}
                onChange={e => setSelectedEstId(e.target.value)}
                className="bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-900 dark:text-white rounded-xl px-3 py-2 outline-none cursor-pointer"
              >
                {assignedEstablishments.map(est => (
                  <option key={est.id} value={est.id}>
                    {est.name} ({est.city})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Tab Selectors */}
      <div className="flex bg-gray-100/90 dark:bg-gray-950 p-1.5 rounded-2xl gap-2 border border-gray-200 dark:border-gray-850 shadow-xs">
        <button
          onClick={() => setActiveTab('ventes')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'ventes'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Point de Vente (POS)</span>
        </button>
        <button
          onClick={() => setActiveTab('stocks')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'stocks'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Gestion des Stocks</span>
        </button>
        <button
          onClick={() => setActiveTab('historique')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'historique'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Journal de Caisse</span>
        </button>
      </div>

      {/* Tab Contents */}
      <div className="pt-1">
        {activeTab === 'ventes' && selectedEstId && (
          <PointOfSaleView establishmentId={selectedEstId} />
        )}

        {activeTab === 'stocks' && selectedEstId && (
          <StockManagerView establishmentId={selectedEstId} />
        )}

        {activeTab === 'historique' && (
          <div className="space-y-6" id="sales-history-view">
            {/* Header & Metrics Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-2xl">
                <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider block">
                  Chiffre d'Affaires ({dateFilter === 'today' ? "Aujourd'hui" : dateFilter === '7d' ? "7j" : dateFilter === '30d' ? "30j" : "Période"})
                </span>
                <span className="text-xl font-black text-orange-950 dark:text-orange-100 mt-1 block">
                  {formatPrice(totalRevenue)}
                </span>
              </div>

              <div className="p-4 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl">
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                  Nombre de Ventes
                </span>
                <span className="text-xl font-black text-gray-900 dark:text-white mt-1 block">
                  {filteredSales.length} {filteredSales.length > 1 ? 'ventes' : 'vente'}
                </span>
              </div>

              <div className="p-4 bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 rounded-2xl">
                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider block">
                  Articles / Bouteilles Vendus
                </span>
                <span className="text-xl font-black text-gray-900 dark:text-white mt-1 block">
                  {totalItemsSold} unités
                </span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-black text-gray-400 uppercase mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3" /> Période :
                  </span>
                  <button
                    onClick={() => setDateFilter('today')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      dateFilter === 'today' ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    Aujourd'hui
                  </button>
                  <button
                    onClick={() => setDateFilter('7d')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      dateFilter === '7d' ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    7 derniers jours
                  </button>
                  <button
                    onClick={() => setDateFilter('30d')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      dateFilter === '30d' ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    30 jours
                  </button>
                  <button
                    onClick={() => setDateFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      dateFilter === 'all' ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    Toutes
                  </button>
                  <button
                    onClick={() => setDateFilter('custom')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      dateFilter === 'custom' ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    Personnalisée
                  </button>
                </div>

                {/* Manager only: filter by Cashier */}
                {isOwner && uniqueCashiers.length > 0 && (
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <select
                      value={selectedCashierId}
                      onChange={e => setSelectedCashierId(e.target.value)}
                      className="px-3 py-1.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
                    >
                      <option value="all">Tous les caissiers ({uniqueCashiers.length})</option>
                      {uniqueCashiers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {dateFilter === 'custom' && (
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">Du :</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                      className="px-3 py-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-semibold text-gray-800 dark:text-gray-200"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-500">Au :</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                      className="px-3 py-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-xs font-semibold text-gray-800 dark:text-gray-200"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sales List */}
            {filteredSales.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-xs">
                <History className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500">Aucune vente enregistrée pour cette sélection.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSales.map(sale => (
                  <div key={sale.id} className="p-4 sm:p-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-gray-950 dark:text-white">Réf #{sale.id.slice(0, 8)}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(sale.date).toLocaleString('fr-FR')}
                        </span>
                        <span className="text-[10px] bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300 font-bold flex items-center gap-1">
                          <User className="w-3 h-3 text-orange-500" />
                          {sale.cashierName || "Staff"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {sale.items.map((it, i) => (
                          <span key={i} className="px-2.5 py-1 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-850 rounded-lg text-[10px] font-black text-gray-700 dark:text-gray-300">
                            {it.name} x{it.quantity} ({formatPrice(it.unitPrice * it.quantity)})
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-gray-50 dark:border-gray-850 pt-3 md:pt-0 shrink-0">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Montant total</p>
                        <p className="text-base font-black text-orange-600 dark:text-orange-400">{formatPrice(sale.totalAmount)}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingReceiptSale(sale)}
                          className="p-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                          title="Voir le reçu"
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">Reçu</span>
                        </button>

                        <button
                          onClick={() => shareReceiptWhatsApp(sale)}
                          className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl hover:shadow-xs transition-all cursor-pointer"
                          title="Partager le reçu par WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* RECEIPT INSPECTOR MODAL WITH IMAGE EXPORT */}
            {viewingReceiptSale && (
              <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
                <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 rounded-3xl shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-orange-600" />
                      Ticket de Caisse #{viewingReceiptSale.id.slice(0, 8)}
                    </h3>
                    <button onClick={() => setViewingReceiptSale(null)} className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {receiptFeedback && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold text-center">
                      {receiptFeedback}
                    </div>
                  )}

                  {/* Render Generated Receipt Image or Virtual Receipt */}
                  {modalReceiptImageUrl ? (
                    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-gray-50 dark:bg-gray-950">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 text-[10px] font-black uppercase text-gray-500 flex items-center justify-between">
                        <span>Aperçu de l'image (PNG)</span>
                        <span className="text-emerald-600 font-bold">Haute Résolution</span>
                      </div>
                      <img 
                        src={modalReceiptImageUrl} 
                        alt="Ticket de caisse" 
                        className="w-full object-contain max-h-[360px] mx-auto p-1"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 font-mono space-y-3 text-xs">
                      <div className="text-center border-b border-dashed border-gray-200 dark:border-gray-800 pb-2">
                        <h4 className="font-black text-gray-900 dark:text-white">{currentEst?.name || 'ZAKA+ POINT DE VENTE'}</h4>
                        <p className="text-[10px] text-gray-500">Ticket de caisse officiel</p>
                      </div>

                      <div className="space-y-1 text-[11px] text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>Date :</span>
                          <span>{new Date(viewingReceiptSale.date).toLocaleString('fr-FR')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Caissier :</span>
                          <span>{viewingReceiptSale.cashierName || 'Staff'}</span>
                        </div>
                      </div>

                      <div className="border-t border-b border-dashed border-gray-200 dark:border-gray-800 py-2 space-y-1.5">
                        {viewingReceiptSale.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between font-bold text-gray-800 dark:text-gray-200">
                            <span>{it.name} x{it.quantity}</span>
                            <span>{formatPrice(it.unitPrice * it.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between font-black text-gray-950 dark:text-white pt-1">
                        <span>TOTAL PAYÉ</span>
                        <span className="text-orange-600">{formatPrice(viewingReceiptSale.totalAmount)}</span>
                      </div>
                    </div>
                  )}

                  {/* Actions Toolbar */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => window.print()}
                      className="py-3 px-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors"
                    >
                      <Printer className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                      Imprimer
                    </button>

                    <button
                      onClick={() => handleShareModalReceipt(viewingReceiptSale)}
                      className="py-3 px-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-transform active:scale-95"
                    >
                      <Share2 className="w-4 h-4" />
                      Partager
                    </button>

                    <button
                      onClick={() => handleDownloadModalReceipt(viewingReceiptSale)}
                      className="py-3 px-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <Download className="w-4 h-4" />
                      PNG
                    </button>
                  </div>

                  <button
                    onClick={() => shareReceiptWhatsApp(viewingReceiptSale)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                  >
                    <span>💬 Partager via WhatsApp</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
