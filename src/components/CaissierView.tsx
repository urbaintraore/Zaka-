import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { Establishment, SaleRecord, SaleItem } from '../types';
import { 
  ShoppingBag, Package, History, User, Share2, DollarSign, Calendar,
  Filter, Search, Plus, Minus, AlertTriangle, CheckCircle, Printer, X, Eye, 
  Store, Clock, ArrowRight, Sparkles, ChevronDown, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CaissierViewProps {
  initialEstablishmentId?: string;
  onLogout?: () => void;
}

export function CaissierView({ initialEstablishmentId, onLogout }: CaissierViewProps) {
  const { 
    currentUser, 
    establishments, 
    relationshipRequests, 
    stocks, 
    ventes, 
    recordSale 
  } = useAppStore();

  // Find establishments where the current user is an accredited cashier
  const cashierRequests = useMemo(() => {
    if (!currentUser) return [];
    return relationshipRequests.filter(r => 
      (r.userId === currentUser.id || r.initiatorId === currentUser.id || r.targetId === currentUser.id) &&
      r.status === 'acceptee' &&
      (r.isCaissier === true || r.requestedRole === 'caissier')
    );
  }, [relationshipRequests, currentUser]);

  const assignedEstablishments = useMemo(() => {
    const ids = cashierRequests.map(r => r.establishmentId);
    let list = establishments.filter(e => ids.includes(e.id));
    // If no explicit relation but user has role 'caissier' or initialEstablishmentId was provided
    if (list.length === 0 && initialEstablishmentId) {
      const found = establishments.find(e => e.id === initialEstablishmentId);
      if (found) list = [found];
    }
    // Fallback: if user is logged in as cashier and there are maquis/bars, list them if needed
    if (list.length === 0 && currentUser?.role === 'caissier') {
      list = establishments.filter(e => e.category === 'maquis' || e.category === 'boite_de_nuit');
    }
    return list;
  }, [cashierRequests, establishments, initialEstablishmentId, currentUser]);

  // Selected establishment for active cashier terminal
  const [selectedEstId, setSelectedEstId] = useState<string>(() => {
    if (initialEstablishmentId) return initialEstablishmentId;
    if (assignedEstablishments.length > 0) return assignedEstablishments[0].id;
    return establishments[0]?.id || '';
  });

  // Ensure selectedEstId is synced if list changes
  React.useEffect(() => {
    if (!selectedEstId && assignedEstablishments.length > 0) {
      setSelectedEstId(assignedEstablishments[0].id);
    }
  }, [assignedEstablishments, selectedEstId]);

  const currentEst = useMemo(() => {
    return establishments.find(e => e.id === selectedEstId) || assignedEstablishments[0] || null;
  }, [establishments, selectedEstId, assignedEstablishments]);

  // Tab State: 'pos' (Caisse POS) | 'mes_ventes' (Journal de caisse) | 'stocks' (Consultation des stocks)
  const [activeTab, setActiveTab] = useState<'pos' | 'mes_ventes' | 'stocks'>('pos');

  // ================= POS STATE =================
  const [cart, setCart] = useState<Record<string, number>>({});
  const [posSearch, setPosSearch] = useState('');
  const [saleSuccess, setSaleSuccess] = useState(false);
  const [lastSaleRecord, setLastSaleRecord] = useState<SaleRecord | null>(null);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [posError, setPosError] = useState<string | null>(null);
  const [posSuccessMsg, setPosSuccessMsg] = useState<string | null>(null);

  // ================= SALES HISTORY STATE =================
  const [historyFilter, setHistoryFilter] = useState<'today' | '7d' | 'all'>('today');
  const [viewingReceipt, setViewingReceipt] = useState<SaleRecord | null>(null);

  // Stocks for selected establishment
  const currentStocks = useMemo(() => {
    if (!currentEst) return [];
    return stocks.filter(s => s.establishmentId === currentEst.id);
  }, [stocks, currentEst]);

  // Filtered stocks for POS catalog
  const filteredStocks = useMemo(() => {
    return currentStocks.filter(s => 
      s.name.toLowerCase().includes(posSearch.toLowerCase())
    );
  }, [currentStocks, posSearch]);

  // Sales performed by THIS cashier for this establishment
  const mySales = useMemo(() => {
    if (!currentEst || !currentUser) return [];
    let list = ventes.filter(v => v.establishmentId === currentEst.id && v.cashierId === currentUser.id);

    const now = new Date();
    if (historyFilter === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      list = list.filter(s => s.date.startsWith(todayStr));
    } else if (historyFilter === '7d') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      list = list.filter(s => new Date(s.date) >= sevenDaysAgo);
    }

    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return list;
  }, [ventes, currentEst, currentUser, historyFilter]);

  // Today shift sales summary metrics for this cashier
  const todayShiftSales = useMemo(() => {
    if (!currentEst || !currentUser) return [];
    const todayStr = new Date().toISOString().split('T')[0];
    return ventes.filter(v => v.establishmentId === currentEst.id && v.cashierId === currentUser.id && v.date.startsWith(todayStr));
  }, [ventes, currentEst, currentUser]);

  const shiftTotalAmount = useMemo(() => {
    return todayShiftSales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
  }, [todayShiftSales]);

  const shiftItemsCount = useMemo(() => {
    return todayShiftSales.reduce((sum, s) => {
      const qty = s.items ? s.items.reduce((acc, it) => acc + (it.quantity || 0), 0) : 0;
      return sum + qty;
    }, 0);
  }, [todayShiftSales]);

  // Cart operations
  const addToCart = (stockId: string) => {
    const item = currentStocks.find(s => s.id === stockId);
    if (!item) return;

    const currentQty = cart[stockId] || 0;
    if (currentQty >= item.quantity) {
      setPosError(`Stock insuffisant pour "${item.name}". Restant en stock : ${item.quantity}.`);
      return;
    }

    setCart(prev => ({
      ...prev,
      [stockId]: currentQty + 1
    }));
    setPosError(null);
  };

  const removeFromCart = (stockId: string) => {
    const currentQty = cart[stockId] || 0;
    if (currentQty <= 1) {
      const copy = { ...cart };
      delete copy[stockId];
      setCart(copy);
    } else {
      setCart(prev => ({
        ...prev,
        [stockId]: currentQty - 1
      }));
    }
  };

  const clearCart = () => {
    setCart({});
    setPosError(null);
  };

  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([stockId, qty]) => {
      const item = currentStocks.find(s => s.id === stockId);
      return {
        stockId,
        quantity: qty,
        item
      };
    }).filter(ci => ci.item !== undefined);
  }, [cart, currentStocks]);

  const cartTotal = useMemo(() => {
    return cartItems.reduce((acc, ci) => acc + (ci.item!.price * ci.quantity), 0);
  }, [cartItems]);

  // Handle validating sale & creating receipt
  const handleValidateSale = async () => {
    if (!currentEst) {
      setPosError("Aucun établissement sélectionné.");
      return;
    }
    if (cartItems.length === 0) {
      setPosError("Votre panier est vide.");
      return;
    }

    // Check stock availability
    for (const ci of cartItems) {
      if (ci.quantity > ci.item!.quantity) {
        setPosError(`Stock insuffisant pour "${ci.item!.name}". Disponible : ${ci.item!.quantity}, Demandé : ${ci.quantity}`);
        return;
      }
    }

    const saleItems: SaleItem[] = cartItems.map(ci => ({
      stockId: ci.stockId,
      name: ci.item!.name,
      quantity: ci.quantity,
      unitPrice: ci.item!.price
    }));

    const salePayload = {
      establishmentId: currentEst.id,
      cashierId: currentUser?.id || 'caissier',
      cashierName: currentUser?.name || 'Caissier',
      items: saleItems,
      totalAmount: cartTotal
    };

    try {
      setIsSubmittingSale(true);
      setPosError(null);

      await recordSale(salePayload);

      const newRecord: SaleRecord = {
        id: `rec-${Date.now().toString().slice(-6)}`,
        ...salePayload,
        date: new Date().toISOString()
      };

      setLastSaleRecord(newRecord);
      setCart({});
      setSaleSuccess(true);
      setPosSuccessMsg("Vente enregistrée avec succès et stock mis à jour !");
      setTimeout(() => setPosSuccessMsg(null), 4000);
    } catch (err: any) {
      setPosError(err.message || "Erreur lors de la validation de la vente.");
    } finally {
      setIsSubmittingSale(false);
    }
  };

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} F CFA`;
  };

  const shareReceiptWhatsApp = (sale: SaleRecord) => {
    const itemsText = sale.items
      .map(it => `• ${it.name} x${it.quantity} (${formatPrice(it.unitPrice)}/u) = ${formatPrice(it.unitPrice * it.quantity)}`)
      .join('\n');
    
    const text = `🧾 *TICKET DE CAISSE - ${currentEst?.name || 'Zaka+'}*\n` +
      `---------------------------\n` +
      `🏢 Établissement : *${currentEst?.name || 'Notre établissement'}*\n` +
      `📅 Date : ${new Date(sale.date).toLocaleString('fr-FR')}\n` +
      `👤 Caissier : ${sale.cashierName || 'Staff'}\n` +
      `🧾 Réf : #${sale.id.slice(0, 8)}\n` +
      `---------------------------\n` +
      `*Boissons / Commandes :*\n${itemsText}\n` +
      `---------------------------\n` +
      `💰 *TOTAL ENCAISSÉ : ${formatPrice(sale.totalAmount)}*\n\n` +
      `Merci pour votre confiance ! ✨`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  if (!currentEst && assignedEstablishments.length === 0) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4 bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-sm">
        <div className="w-16 h-16 bg-orange-100 dark:bg-orange-950/40 text-orange-600 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-gray-900 dark:text-white">Espace Caissier</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Vous n'êtes actuellement rattaché à aucun maquis ou bar en tant que caissier actif.
        </p>
        <p className="text-[11px] text-gray-400">
          Pour être désigné caissier, postulez auprès d'un établissement depuis l'onglet Explorer ou demandez au gérant de valider votre rôle de caissier.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-20" id="caissier-view-root">
      {/* CASHIER TERMINAL HEADER */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-xs text-white text-[10px] font-black uppercase tracking-wider rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-200" />
              Terminal Point de Vente Caissier
            </span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <ShoppingBag className="w-6 h-6" />
            {currentEst?.name || 'Mon Établissement'}
          </h1>

          <p className="text-xs text-orange-100 font-medium flex items-center gap-2">
            <User className="w-3.5 h-3.5" />
            Caissier en service : <span className="font-bold text-white">{currentUser?.name}</span>
          </p>
        </div>

        {/* Establishment Switcher (if assigned to multiple venues) */}
        <div className="flex flex-col items-start sm:items-end gap-2">
          {assignedEstablishments.length > 1 && (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1.5 border border-white/20">
              <label className="text-[9px] font-bold uppercase text-orange-100 block px-2 mb-0.5">Changer d'établissement :</label>
              <select
                value={selectedEstId}
                onChange={e => {
                  setSelectedEstId(e.target.value);
                  setCart({});
                  setSaleSuccess(false);
                }}
                className="bg-orange-700/80 text-white text-xs font-bold px-3 py-1.5 rounded-xl outline-none cursor-pointer border border-white/20"
              >
                {assignedEstablishments.map(est => (
                  <option key={est.id} value={est.id} className="bg-gray-900 text-white font-bold">
                    {est.name} ({est.city})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="text-left sm:text-right bg-black/20 backdrop-blur-xs px-4 py-2 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-orange-200 block">Mon Total de Service (Aujourd'hui)</span>
            <span className="text-lg font-black text-white">{formatPrice(shiftTotalAmount)}</span>
          </div>
        </div>
      </div>

      {/* SHIFT SUMMARY STATS PILLS */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-gray-900 p-3.5 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-xs text-center">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Total Encaissé</span>
          <span className="text-sm sm:text-base font-black text-orange-600 dark:text-orange-400 mt-0.5 block">{formatPrice(shiftTotalAmount)}</span>
        </div>
        <div className="bg-white dark:bg-gray-900 p-3.5 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-xs text-center">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Ventes du Jour</span>
          <span className="text-sm sm:text-base font-black text-gray-900 dark:text-white mt-0.5 block">{todayShiftSales.length} {todayShiftSales.length > 1 ? 'tickets' : 'ticket'}</span>
        </div>
        <div className="bg-white dark:bg-gray-900 p-3.5 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-xs text-center">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Boissons Servies</span>
          <span className="text-sm sm:text-base font-black text-gray-900 dark:text-white mt-0.5 block">{shiftItemsCount} unités</span>
        </div>
      </div>

      {/* CASHIER NAVIGATION TABS */}
      <div className="flex bg-gray-100 dark:bg-gray-900 p-1.5 rounded-2xl gap-2 border border-gray-200 dark:border-gray-800 shadow-xs">
        <button
          onClick={() => { setActiveTab('pos'); setSaleSuccess(false); }}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'pos'
              ? 'bg-orange-600 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Point de Vente (Caisse)</span>
        </button>

        <button
          onClick={() => setActiveTab('mes_ventes')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'mes_ventes'
              ? 'bg-orange-600 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Mes Ventes ({todayShiftSales.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('stocks')}
          className={`flex-1 py-3 px-3 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'stocks'
              ? 'bg-orange-600 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Stock ({currentStocks.length})</span>
        </button>
      </div>

      {/* TAB CONTENT: POINT OF SALE (POS) */}
      {activeTab === 'pos' && (
        <div>
          {saleSuccess && lastSaleRecord ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 rounded-3xl shadow-xl space-y-6"
            >
              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white">Vente Validée</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Reçu virtuel prêt à être remis ou partagé au client.</p>
              </div>

              {/* Printable Ticket */}
              <div className="p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 font-mono space-y-4">
                <div className="text-center border-b border-dashed border-gray-200 dark:border-gray-800 pb-3">
                  <h4 className="text-xs font-black text-gray-900 dark:text-white">{currentEst?.name || 'ZAKA+ POINT DE VENTE'}</h4>
                  <p className="text-[9px] text-gray-500 mt-1">Ticket de caisse officiel</p>
                </div>

                <div className="text-[10px] space-y-1 text-gray-600 dark:text-gray-400">
                  <div className="flex justify-between">
                    <span>Date :</span>
                    <span>{new Date(lastSaleRecord.date).toLocaleString('fr-FR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Caissier :</span>
                    <span>{lastSaleRecord.cashierName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Réf :</span>
                    <span>#{lastSaleRecord.id.slice(0, 8)}</span>
                  </div>
                </div>

                <div className="border-t border-b border-dashed border-gray-200 dark:border-gray-800 py-3 space-y-2">
                  {lastSaleRecord.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-[11px] font-bold text-gray-800 dark:text-gray-200">
                      <span>{it.name} x{it.quantity}</span>
                      <span>{formatPrice(it.unitPrice * it.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between text-xs font-black text-gray-950 dark:text-white pt-1">
                  <span>TOTAL ENCAISSÉ</span>
                  <span className="text-orange-600 dark:text-orange-400">{formatPrice(lastSaleRecord.totalAmount)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => shareReceiptWhatsApp(lastSaleRecord)}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-transform active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  WhatsApp
                </button>
                <button
                  onClick={() => window.print()}
                  className="py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimer
                </button>
              </div>

              <button
                onClick={() => { setSaleSuccess(false); setLastSaleRecord(null); }}
                className="w-full py-3 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-black uppercase text-center cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors font-black"
              >
                + Nouvelle Vente
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Product catalog for cashier */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center gap-3 bg-white dark:bg-gray-900 px-4 py-3 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-xs">
                  <Search className="w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher une boisson (ex: Brakina, Heineken, Coca...)"
                    value={posSearch}
                    onChange={e => setPosSearch(e.target.value)}
                    className="flex-1 text-xs font-semibold outline-none bg-transparent text-gray-900 dark:text-white"
                  />
                  {posSearch && (
                    <button onClick={() => setPosSearch('')} className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer">
                      Vider
                    </button>
                  )}
                </div>

                {posError && (
                  <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                    <span>{posError}</span>
                  </div>
                )}

                {filteredStocks.length === 0 ? (
                  <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800">
                    <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                    <p className="text-xs font-bold text-gray-400">Aucune boisson disponible dans l'inventaire.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredStocks.map(drink => {
                      const currentCartQty = cart[drink.id] || 0;
                      const isOutOfStock = drink.quantity <= 0;
                      const isLowStock = drink.quantity > 0 && drink.quantity <= 5;
                      
                      return (
                        <button
                          key={drink.id}
                          onClick={() => !isOutOfStock && addToCart(drink.id)}
                          disabled={isOutOfStock}
                          className={`relative bg-white dark:bg-gray-900 p-4 rounded-2xl border text-left flex flex-col justify-between hover:shadow-md transition-all active:scale-95 cursor-pointer min-h-[130px] ${
                            isOutOfStock 
                              ? 'opacity-40 border-gray-150 dark:border-gray-800 bg-gray-50 dark:bg-gray-950' 
                              : isLowStock
                              ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/10'
                              : 'border-gray-150 hover:border-orange-300 dark:border-gray-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-xs font-black text-gray-900 dark:text-white line-clamp-2">
                                {drink.name}
                              </span>
                              {currentCartQty > 0 && (
                                <span className="px-2 py-0.5 bg-orange-600 text-white rounded-full text-[10px] font-black shrink-0">
                                  x{currentCartQty}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-black text-orange-600 dark:text-orange-400 mt-1 block">
                              {formatPrice(drink.price)}
                            </span>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                              isOutOfStock 
                                ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' 
                                : isLowStock 
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 animate-pulse'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                            }`}>
                              {isOutOfStock ? "Rupture" : `${drink.quantity} en stock`}
                            </span>
                            
                            <div className="w-7 h-7 rounded-full bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 flex items-center justify-center hover:bg-orange-100 dark:hover:bg-orange-900/30">
                              <Plus className="w-4 h-4" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Order Cart & Cash Checkout */}
              <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-150 dark:border-gray-800 flex flex-col justify-between h-fit space-y-4 shadow-xs">
                <div>
                  <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-3 mb-4">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-orange-600" />
                      <span className="text-sm font-black text-gray-900 dark:text-white">Commande en cours</span>
                    </div>
                    {cartItems.length > 0 && (
                      <button
                        onClick={clearCart}
                        className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
                      >
                        Vider
                      </button>
                    )}
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="py-12 text-center text-xs font-bold text-gray-400 dark:text-gray-500">
                      <ShoppingBag className="w-10 h-10 text-gray-200 dark:text-gray-800 mx-auto mb-2" />
                      Touchez les boissons à gauche pour composer la commande.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[320px] overflow-y-auto">
                      {cartItems.map(ci => (
                        <div key={ci.stockId} className="flex items-center justify-between bg-gray-50 dark:bg-gray-950 p-2.5 rounded-xl border border-gray-100 dark:border-gray-850">
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{ci.item!.name}</p>
                            <p className="text-[10px] font-bold text-orange-600 dark:text-orange-400">
                              {formatPrice(ci.item!.price)} / unité
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => removeFromCart(ci.stockId)}
                              className="w-7 h-7 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center cursor-pointer"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-xs font-black min-w-[15px] text-center dark:text-white">{ci.quantity}</span>
                            <button
                              onClick={() => addToCart(ci.stockId)}
                              className="w-7 h-7 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {cartItems.length > 0 && (
                  <div className="border-t border-gray-150 dark:border-gray-800 pt-4 space-y-4">
                    <div className="flex items-center justify-between text-sm font-black text-gray-900 dark:text-white">
                      <span>Total à encaisser</span>
                      <span className="text-orange-600 dark:text-orange-400 text-xl font-black">{formatPrice(cartTotal)}</span>
                    </div>

                    <button
                      onClick={handleValidateSale}
                      disabled={isSubmittingSale}
                      className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSubmittingSale ? "Validation & Décrémentation..." : "Valider l'encaissement"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: MES VENTES (JOURNAL DE CAISSE) */}
      {activeTab === 'mes_ventes' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black text-gray-400 uppercase mr-1">Filtrer :</span>
              <button
                onClick={() => setHistoryFilter('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  historyFilter === 'today' ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                Aujourd'hui ({todayShiftSales.length})
              </button>
              <button
                onClick={() => setHistoryFilter('7d')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  historyFilter === '7d' ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                7 derniers jours
              </button>
              <button
                onClick={() => setHistoryFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  historyFilter === 'all' ? 'bg-orange-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                Toutes mes ventes
              </button>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Total période</span>
              <span className="text-sm font-black text-orange-600 dark:text-orange-400">
                {formatPrice(mySales.reduce((acc, s) => acc + (s.totalAmount || 0), 0))}
              </span>
            </div>
          </div>

          {mySales.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-sm">
              <History className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500">Aucune vente enregistrée pour ce filtre.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mySales.map(sale => (
                <div key={sale.id} className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-gray-950 dark:text-white">Ticket #{sale.id.slice(0, 8)}</span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(sale.date).toLocaleString('fr-FR')}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {sale.items.map((it, i) => (
                        <span key={i} className="px-2.5 py-0.5 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-850 rounded-lg text-[10px] font-black text-gray-700 dark:text-gray-300">
                          {it.name} x{it.quantity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-gray-50 dark:border-gray-850 pt-2 sm:pt-0">
                    <div className="text-left sm:text-right">
                      <p className="text-xs font-black text-orange-600 dark:text-orange-400">{formatPrice(sale.totalAmount)}</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setViewingReceipt(sale)}
                        className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-300 rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[11px] font-bold"
                        title="Voir le reçu"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Reçu</span>
                      </button>

                      <button
                        onClick={() => shareReceiptWhatsApp(sale)}
                        className="p-2 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl transition-all cursor-pointer"
                        title="Partager le reçu par WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT: STOCKS CONSULTATION */}
      {activeTab === 'stocks' && (
        <div className="space-y-4">
          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <h4 className="text-xs font-black text-orange-950 dark:text-orange-200 uppercase">Consultation des Disponibilités</h4>
              <p className="text-[11px] text-orange-800/80 dark:text-orange-300">
                État des stocks en temps réel. L'approvisionnement et les prix sont gérés par le gérant.
              </p>
            </div>
            <span className="text-xs font-black text-orange-600 dark:text-orange-400 bg-white dark:bg-gray-900 px-3 py-1 rounded-xl shadow-xs">
              {currentStocks.length} articles
            </span>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-950/50 border-b border-gray-150 dark:border-gray-800 text-gray-400 dark:text-gray-500 uppercase font-black tracking-wider text-[10px]">
                    <th className="py-3 px-4">Boisson / Article</th>
                    <th className="py-3 px-4">Prix Unitaire</th>
                    <th className="py-3 px-4">Quantité Disponible</th>
                    <th className="py-3 px-4 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-850">
                  {currentStocks.map(drink => {
                    const isOutOfStock = drink.quantity <= 0;
                    const isLow = drink.quantity > 0 && drink.quantity <= 5;
                    return (
                      <tr key={drink.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                        <td className="py-3 px-4 font-bold text-gray-900 dark:text-white">{drink.name}</td>
                        <td className="py-3 px-4 font-black text-orange-600 dark:text-orange-400">{formatPrice(drink.price)}</td>
                        <td className="py-3 px-4 font-black text-gray-800 dark:text-gray-200">{drink.quantity} bouteilles</td>
                        <td className="py-3 px-4 text-right">
                          <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${
                            isOutOfStock 
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400' 
                              : isLow 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' 
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                          }`}>
                            {isOutOfStock ? "Rupture" : isLow ? "Stock Faible" : "Disponible"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RECEIPT INSPECTOR MODAL */}
      {viewingReceipt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 rounded-3xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-orange-600" />
                Détail du Reçu #{viewingReceipt.id.slice(0, 8)}
              </h3>
              <button onClick={() => setViewingReceipt(null)} className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Ticket */}
            <div className="p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 font-mono space-y-3">
              <div className="text-center border-b border-dashed border-gray-200 dark:border-gray-800 pb-2">
                <h4 className="text-xs font-black text-gray-900 dark:text-white">{currentEst?.name || 'ZAKA+ POINT DE VENTE'}</h4>
                <p className="text-[10px] text-gray-500">Ticket de caisse officiel</p>
              </div>

              <div className="text-[10px] space-y-1 text-gray-600 dark:text-gray-400">
                <div className="flex justify-between">
                  <span>Date :</span>
                  <span>{new Date(viewingReceipt.date).toLocaleString('fr-FR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Caissier :</span>
                  <span>{viewingReceipt.cashierName || 'Staff'}</span>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-gray-200 dark:border-gray-800 py-2.5 space-y-1.5">
                {viewingReceipt.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-[11px] font-bold text-gray-800 dark:text-gray-200">
                    <span>{it.name} x{it.quantity}</span>
                    <span>{formatPrice(it.unitPrice * it.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-xs font-black text-gray-950 dark:text-white pt-1">
                <span>TOTAL PAYÉ</span>
                <span className="text-orange-600">{formatPrice(viewingReceipt.totalAmount)}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => shareReceiptWhatsApp(viewingReceipt)}
                className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                WhatsApp
              </button>
              <button
                onClick={() => window.print()}
                className="py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors"
              >
                <Printer className="w-4 h-4" />
                Imprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
