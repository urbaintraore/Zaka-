import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../store';
import { StockItem, SaleRecord, SaleItem } from '../types';
import { 
  ShoppingBag, Plus, Minus, Search, AlertTriangle, CheckCircle, 
  X, Share2, Printer, User, Download, Image as ImageIcon, Sparkles,
  GlassWater, Flame, RefreshCw, Percent, Smartphone, Coins
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  generateReceiptDataUrl, 
  downloadReceiptImage, 
  shareReceiptImage 
} from '../utils/receiptImageGenerator';

interface PointOfSaleViewProps {
  establishmentId: string;
}

export function PointOfSaleView({ establishmentId }: PointOfSaleViewProps) {
  const { currentUser, stocks, recordSale, establishments } = useAppStore();

  const est = establishments.find(e => e.id === establishmentId);

  const [cart, setCart] = useState<Record<string, number>>({});
  const [saleSuccess, setSaleSuccess] = useState<boolean>(false);
  const [lastSaleRecord, setLastSaleRecord] = useState<SaleRecord | null>(null);
  const [receiptImageUrl, setReceiptImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'bieres' | 'liqueurs' | 'softs' | 'nourriture'>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom receipt customization states
  const [tableNote, setTableNote] = useState('');
  const [clientType, setClientType] = useState<'Ordinaire' | 'Abonné' | 'VIP'>('Ordinaire');
  const [serverName, setServerName] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [isNoChangeMode, setIsNoChangeMode] = useState<boolean>(false);
  const [mobileMoneyCode, setMobileMoneyCode] = useState('');
  const [showCustomReceiptOptions, setShowCustomReceiptOptions] = useState(false);

  // Get active stocks for this establishment
  const estStocks = useMemo(() => {
    return stocks.filter(item => item.establishmentId === establishmentId);
  }, [stocks, establishmentId]);

  // Categorize drink/food
  const getItemCategory = (name: string): 'bieres' | 'liqueurs' | 'softs' | 'nourriture' => {
    const n = name.toLowerCase();
    if (n.includes('poulet') || n.includes('poisson') || n.includes('grill') || n.includes('frite') || n.includes('attiéké') || n.includes('alloco') || n.includes('plat') || n.includes('brochette') || n.includes('viande') || n.includes('porc') || n.includes('riz')) {
      return 'nourriture';
    }
    if (n.includes('whisky') || n.includes('vodka') || n.includes('gin') || n.includes('rhum') || n.includes('cognac') || n.includes('champagne') || n.includes('liqueur') || n.includes('pastis') || n.includes('tequila') || n.includes('vin') || n.includes('ricard')) {
      return 'liqueurs';
    }
    if (n.includes('coca') || n.includes('fanta') || n.includes('sprite') || n.includes('youki') || n.includes('eau') || n.includes('jus') || n.includes('red bull') || n.includes('sobebra') || n.includes('malt') || n.includes('tonic') || n.includes('cocktail')) {
      return 'softs';
    }
    return 'bieres';
  };

  // Filter stocks by search query & category
  const filteredStocks = useMemo(() => {
    return estStocks.filter(drink => {
      const matchesSearch = drink.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (selectedCategory === 'all') return true;
      return getItemCategory(drink.name) === selectedCategory;
    });
  }, [estStocks, searchQuery, selectedCategory]);

  // Generate Receipt Image on sale completion
  useEffect(() => {
    if (saleSuccess && lastSaleRecord) {
      setIsGeneratingImage(true);
      generateReceiptDataUrl(lastSaleRecord, est)
        .then(url => setReceiptImageUrl(url))
        .catch(err => console.error('Erreur génération image reçu:', err))
        .finally(() => setIsGeneratingImage(false));
    } else {
      setReceiptImageUrl(null);
    }
  }, [saleSuccess, lastSaleRecord, est]);

  // Cart helper functions
  const addToCart = (stockId: string) => {
    const item = estStocks.find(s => s.id === stockId);
    if (!item) return;

    const currentQty = cart[stockId] || 0;
    if (currentQty >= item.quantity) {
      setErrorMsg(`Stock insuffisant pour "${item.name}". Quantité disponible en stock : ${item.quantity}.`);
      return;
    }

    setCart(prev => ({
      ...prev,
      [stockId]: currentQty + 1
    }));
    setErrorMsg(null);
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
    setErrorMsg(null);
  };

  // Compile cart items structure
  const cartItems = useMemo(() => {
    return Object.entries(cart).map(([stockId, qty]) => {
      const item = estStocks.find(s => s.id === stockId);
      return {
        stockId,
        quantity: qty,
        item
      };
    }).filter(ci => ci.item !== undefined);
  }, [cart, estStocks]);

  // Total calculation
  const cartTotal = useMemo(() => {
    return cartItems.reduce((acc, ci) => acc + (ci.item!.price * ci.quantity), 0);
  }, [cartItems]);

  // Safe Sale Transaction with atomic stock checks
  const handleValidateSale = async () => {
    if (cartItems.length === 0) {
      setErrorMsg("Votre panier de vente est vide.");
      return;
    }

    // Pre-flight check
    for (const ci of cartItems) {
      if (ci.quantity > ci.item!.quantity) {
        setErrorMsg(`Stock insuffisant pour "${ci.item!.name}". Disponible: ${ci.item!.quantity}, Demandé: ${ci.quantity}`);
        return;
      }
    }

    const saleItems: SaleItem[] = cartItems.map(ci => ({
      stockId: ci.stockId,
      name: ci.item!.name,
      quantity: ci.quantity,
      unitPrice: ci.item!.price
    }));

    const totalAchat = cartTotal;
    const totalNet = Math.max(0, totalAchat - discountAmount);
    
    const numPaidAmount = Number(paidAmount) || 0;
    let changeAmount = 0;
    let avoirAmount = 0;
    if (numPaidAmount > totalNet) {
      const diff = numPaidAmount - totalNet;
      if (isNoChangeMode) {
        avoirAmount = diff;
      } else {
        changeAmount = diff;
      }
    }

    const salePayload = {
      establishmentId,
      cashierId: currentUser?.id || 'unknown',
      cashierName: currentUser?.name || 'Caissier',
      serverName: serverName || undefined,
      tableNote: tableNote || undefined,
      clientType: clientType,
      items: saleItems,
      totalAchat,
      discountAmount,
      totalAmount: totalNet,
      paidAmount: numPaidAmount || undefined,
      changeAmount: numPaidAmount > totalNet && !isNoChangeMode ? changeAmount : undefined,
      avoirAmount: numPaidAmount > totalNet && isNoChangeMode ? avoirAmount : undefined,
      mobileMoneyCode: mobileMoneyCode || undefined,
    };

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      
      // Calls the transactional store function (decrements stock and throws error if stock runs below required amount)
      await recordSale(salePayload);

      setLastSaleRecord({
        id: `rec-${Date.now().toString().slice(-6)}`,
        ...salePayload,
        date: new Date().toISOString()
      });

      setCart({});
      
      // Reset receipt options
      setTableNote('');
      setClientType('Ordinaire');
      setServerName('');
      setDiscountAmount(0);
      setPaidAmount('');
      setIsNoChangeMode(false);
      setMobileMoneyCode('');

      setSaleSuccess(true);
      setSuccessMsg("Vente validée et stock décrémenté avec succès !");
      
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur de validation de la transaction de vente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} F CFA`;
  };

  const handleShareImage = async () => {
    if (!lastSaleRecord) return;
    try {
      const res = await shareReceiptImage(lastSaleRecord, est);
      if (res.shared) {
        setShareFeedback("Reçu partagé avec succès !");
      } else if (res.method === 'download') {
        setShareFeedback("Image du reçu téléchargée !");
      }
      setTimeout(() => setShareFeedback(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadImage = () => {
    if (!lastSaleRecord) return;
    downloadReceiptImage(lastSaleRecord, est);
    setShareFeedback("Image du reçu téléchargée (PNG) !");
    setTimeout(() => setShareFeedback(null), 3000);
  };

  const shareReceiptWhatsApp = (sale: SaleRecord) => {
    const itemsText = sale.items
      .map(it => `• ${it.name} x${it.quantity} (${formatPrice(it.unitPrice)}/u) = ${formatPrice(it.unitPrice * it.quantity)}`)
      .join('\n');
    
    const text = `🧾 *REÇU DE VENTE - ${est?.name || 'Zaka+'}*\n` +
      `---------------------------\n` +
      `🏢 Établissement : *${est?.name || 'Notre établissement'}*\n` +
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

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="point-of-sale-root">
      {/* SUCCESS RECEIPT PAGE */}
      {saleSuccess && lastSaleRecord ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 rounded-3xl shadow-xl space-y-5"
        >
          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-base font-black text-gray-900 dark:text-white">Vente Validée avec Succès</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Reçu récapitulatif généré prêt à être imprimé ou partagé en image.</p>
          </div>

          {shareFeedback && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold text-center">
              {shareFeedback}
            </div>
          )}

          {/* Render Generated Receipt Image or Virtual Receipt */}
          {receiptImageUrl ? (
            <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm bg-gray-50 dark:bg-gray-950">
              <div className="p-2 bg-gray-100 dark:bg-gray-800 text-[10px] font-black uppercase text-gray-500 flex items-center justify-between">
                <span>Aperçu de l'image générée (PNG)</span>
                <span className="text-emerald-600 font-bold">Prêt</span>
              </div>
              <img 
                src={receiptImageUrl} 
                alt="Ticket de caisse" 
                className="w-full object-contain max-h-[360px] mx-auto p-1"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 font-mono space-y-3 text-xs">
              <div className="text-center border-b border-dashed border-gray-200 dark:border-gray-800 pb-2">
                <h4 className="font-black text-gray-900 dark:text-white">{est?.name || 'ZAKA+ POINT DE VENTE'}</h4>
                <p className="text-[10px] text-gray-500">Ticket de caisse officiel</p>
              </div>

              <div className="space-y-1 text-[11px] text-gray-600 dark:text-gray-400">
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

              <div className="border-t border-b border-dashed border-gray-200 dark:border-gray-800 py-2 space-y-1.5">
                {lastSaleRecord.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between font-bold text-gray-800 dark:text-gray-200">
                    <span>{it.name} x{it.quantity}</span>
                    <span>{formatPrice(it.unitPrice * it.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-black text-gray-950 dark:text-white pt-1">
                <span>TOTAL PAYÉ</span>
                <span className="text-orange-600 dark:text-orange-400">{formatPrice(lastSaleRecord.totalAmount)}</span>
              </div>
            </div>
          )}

          {/* Share & Print Toolbar */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={printReceipt}
              className="py-3 px-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors"
            >
              <Printer className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              Imprimer
            </button>

            <button
              onClick={handleShareImage}
              className="py-3 px-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-transform active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              Partager
            </button>

            <button
              onClick={handleDownloadImage}
              className="py-3 px-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <Download className="w-4 h-4" />
              Image PNG
            </button>
          </div>

          <button
            onClick={() => shareReceiptWhatsApp(lastSaleRecord)}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <span>💬 Envoyer par WhatsApp</span>
          </button>

          <button
            onClick={() => { setSaleSuccess(false); setLastSaleRecord(null); setReceiptImageUrl(null); }}
            className="w-full py-3 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-black uppercase text-center cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
          >
            + Nouvelle Vente
          </button>
        </motion.div>
      ) : (
        /* STANDARD POS GRID VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* POS Catalog Item Grid (Left 2 Columns) */}
          <div className="lg:col-span-2 space-y-3.5">
            {/* Search Filter bar */}
            <div className="flex items-center gap-3 bg-white dark:bg-gray-900 px-4 py-3 border border-gray-150 dark:border-gray-800 rounded-2xl shadow-xs">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une boisson ou un plat (Brakina, Beaufort, Heineken, Poulet...)"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 text-xs font-semibold outline-none bg-transparent text-gray-900 dark:text-white"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 text-xs font-bold cursor-pointer">
                  Vider
                </button>
              )}
            </div>

            {/* Quick Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 hide-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === 'all' 
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' 
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-150 dark:border-gray-800'
                }`}
              >
                Tous ({estStocks.length})
              </button>
              <button
                onClick={() => setSelectedCategory('bieres')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                  selectedCategory === 'bieres' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-150 dark:border-gray-800'
                }`}
              >
                <GlassWater className="w-3.5 h-3.5" />
                Bières & Vins
              </button>
              <button
                onClick={() => setSelectedCategory('liqueurs')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                  selectedCategory === 'liqueurs' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-150 dark:border-gray-800'
                }`}
              >
                <span>🍾</span>
                Liqueurs & Spiritueux
              </button>
              <button
                onClick={() => setSelectedCategory('softs')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                  selectedCategory === 'softs' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-150 dark:border-gray-800'
                }`}
              >
                <span>🥤</span>
                Softs & Jus
              </button>
              <button
                onClick={() => setSelectedCategory('nourriture')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-black uppercase whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                  selectedCategory === 'nourriture' 
                    ? 'bg-orange-600 text-white' 
                    : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-150 dark:border-gray-800'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                Plats & Grillades
              </button>
            </div>

            {errorMsg && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {filteredStocks.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800">
                <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Aucun article trouvé dans cette sélection.</p>
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
                          ? 'opacity-40 border-gray-150 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 cursor-not-allowed' 
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

          {/* Cart & Checkout Panel (Right Column) */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-150 dark:border-gray-800 flex flex-col justify-between h-fit space-y-4 shadow-xs">
            <div>
              <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-black text-gray-900 dark:text-white">Panier de Vente</span>
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
                  Sélectionnez des boissons ou plats pour composer la commande client.
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

              {/* Personnalisation du reçu */}
              {cartItems.length > 0 && (
                <div className="mt-4 border-t border-gray-150 dark:border-gray-800 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCustomReceiptOptions(!showCustomReceiptOptions)}
                    className="w-full flex items-center justify-between text-xs font-black text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white uppercase tracking-wider py-1 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>🧾 Options & Reçu Client</span>
                    </span>
                    <span>{showCustomReceiptOptions ? 'Masquer ▲' : 'Personnaliser ▼'}</span>
                  </button>

                  {showCustomReceiptOptions && (
                    <div className="mt-3 space-y-3 bg-gray-50 dark:bg-gray-950 p-3 rounded-2xl border border-gray-100 dark:border-gray-850">
                      {/* Note Client & Serveur */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Note Client (ex: Table 12)</label>
                          <input
                            type="text"
                            value={tableNote}
                            onChange={e => setTableNote(e.target.value)}
                            placeholder="Sans note"
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg outline-none text-gray-800 dark:text-gray-200 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Serveur / Serveuse</label>
                          <input
                            type="text"
                            value={serverName}
                            onChange={e => setServerName(e.target.value)}
                            placeholder="Nom"
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg outline-none text-gray-800 dark:text-gray-200 font-semibold"
                          />
                        </div>
                      </div>

                      {/* Type Client & Code Mobile Money */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Type de Client</label>
                          <select
                            value={clientType}
                            onChange={e => setClientType(e.target.value as any)}
                            className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg outline-none text-gray-800 dark:text-gray-200 font-semibold"
                          >
                            <option value="Ordinaire">Ordinaire</option>
                            <option value="Abonné">Abonné</option>
                            <option value="VIP">VIP</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Code Mobile Money</label>
                          <input
                            type="text"
                            value={mobileMoneyCode}
                            onChange={e => setMobileMoneyCode(e.target.value)}
                            placeholder="*144*4*6*Code#"
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg outline-none text-gray-800 dark:text-gray-200 font-semibold"
                          />
                        </div>
                      </div>

                      {/* Réduction & Montant payé */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Réduction (F CFA)</label>
                          <input
                            type="number"
                            value={discountAmount || ''}
                            onChange={e => setDiscountAmount(Math.max(0, parseInt(e.target.value) || 0))}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg outline-none text-gray-800 dark:text-gray-200 font-bold text-red-600 dark:text-red-400"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Montant Reçu (F CFA)</label>
                          <input
                            type="number"
                            value={paidAmount}
                            onChange={e => setPaidAmount(e.target.value)}
                            placeholder="0"
                            className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg outline-none text-gray-800 dark:text-gray-200 font-bold text-emerald-600 dark:text-emerald-400"
                        />
                        </div>
                      </div>

                      {/* Change / Avoir indicators & No change toggle */}
                      {Number(paidAmount) > Math.max(0, cartTotal - discountAmount) && (
                        <div className="space-y-2 pt-1.5 border-t border-gray-200 dark:border-gray-850">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-gray-500">Différence calculée :</span>
                            <span className="font-black text-gray-900 dark:text-white">
                              {formatPrice(Number(paidAmount) - Math.max(0, cartTotal - discountAmount))}
                            </span>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer bg-white dark:bg-gray-900 p-2 rounded-lg border border-gray-200 dark:border-gray-800 select-none">
                            <input
                              type="checkbox"
                              checked={isNoChangeMode}
                              onChange={e => setIsNoChangeMode(e.target.checked)}
                              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                            />
                            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 leading-tight">
                              Pas de monnaie disponible (remettre sous forme d'AVOIR)
                            </span>
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="border-t border-gray-150 dark:border-gray-800 pt-4 space-y-4">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between text-gray-500">
                    <span>Total Achat (Brut)</span>
                    <span className="font-bold">{formatPrice(cartTotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex items-center justify-between text-red-500 font-bold">
                      <span>Réduction / Remise</span>
                      <span>- {formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm font-black text-gray-900 dark:text-white pt-1">
                    <span>Net à payer</span>
                    <span className="text-orange-600 dark:text-orange-400 text-xl font-black">{formatPrice(Math.max(0, cartTotal - discountAmount))}</span>
                  </div>
                </div>

                <button
                  onClick={handleValidateSale}
                  disabled={isSubmitting}
                  className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-orange-600/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? "Validation & Décrémentation..." : "Valider l'encaissement"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
