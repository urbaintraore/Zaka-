import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { StockItem, SaleRecord, SaleItem } from '../types';
import { 
  ShoppingBag, Plus, Minus, Search, AlertTriangle, CheckCircle, 
  X, Share2, Printer, User, ArrowLeft 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PointOfSaleViewProps {
  establishmentId: string;
}

export function PointOfSaleView({ establishmentId }: PointOfSaleViewProps) {
  const { currentUser, stocks, recordSale, establishments } = useAppStore();

  const est = establishments.find(e => e.id === establishmentId);

  const [cart, setCart] = useState<Record<string, number>>({});
  const [saleSuccess, setSaleSuccess] = useState<boolean>(false);
  const [lastSaleRecord, setLastSaleRecord] = useState<SaleRecord | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get active stocks for this establishment
  const estStocks = useMemo(() => {
    return stocks.filter(item => item.establishmentId === establishmentId);
  }, [stocks, establishmentId]);

  // Filter stocks by search query
  const filteredStocks = useMemo(() => {
    return estStocks.filter(drink => 
      drink.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [estStocks, searchQuery]);

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

    const salePayload = {
      establishmentId,
      cashierId: currentUser?.id || 'unknown',
      cashierName: currentUser?.name || 'Caissier',
      items: saleItems,
      totalAmount: cartTotal
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
      `💰 *TOTAL PAYÉ : ${formatPrice(sale.totalAmount)}*\n\n` +
      `Merci pour votre visite ! ✨`;
    
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md mx-auto bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-6 rounded-3xl shadow-xl space-y-6"
        >
          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="text-base font-black text-gray-900 dark:text-white">Vente Validée</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Reçu virtuel généré et disponible ci-dessous.</p>
          </div>

          {/* Ticket styling */}
          <div className="p-4 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 font-mono space-y-4">
            <div className="text-center border-b border-dashed border-gray-200 dark:border-gray-800 pb-3">
              <h4 className="text-xs font-black text-gray-900 dark:text-white">{est?.name || 'ZAKA+ POINT DE VENTE'}</h4>
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
              <span>TOTAL PAYÉ</span>
              <span className="text-orange-600 dark:text-orange-400">{formatPrice(lastSaleRecord.totalAmount)}</span>
            </div>
          </div>

          {/* Share & Print Toolbar */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => shareReceiptWhatsApp(lastSaleRecord)}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-transform active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              WhatsApp
            </button>
            <button
              onClick={printReceipt}
              className="py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-750 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimer
            </button>
          </div>

          <button
            onClick={() => { setSaleSuccess(false); setLastSaleRecord(null); }}
            className="w-full py-3 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-black uppercase text-center cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
          >
            Nouvelle Vente
          </button>
        </motion.div>
      ) : (
        /* STANDARD POS GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* POS Catalog Item Grid (Left 2 Columns) */}
          <div className="md:col-span-2 space-y-4">
            {/* Search Filter bar */}
            <div className="flex items-center gap-3 bg-white dark:bg-gray-900 px-4 py-3 border border-gray-100 dark:border-gray-850 rounded-2xl">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher une boisson dans le menu..."
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

            {errorMsg && (
              <div className="p-3.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-700 dark:text-red-400 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4.5 h-4.5 text-red-500 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {filteredStocks.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800">
                <ShoppingBag className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-xs font-bold text-gray-400">Aucune boisson enregistrée dans le stock.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
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
                          : 'border-gray-100 hover:border-gray-300 dark:border-gray-800'
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
                          {isOutOfStock ? "Rupture" : `${drink.quantity} dispo`}
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
                  <ShoppingBag className="w-5 h-5 text-orange-500" />
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
                  Sélectionnez des boissons pour composer la commande client.
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
                  <span className="text-orange-600 dark:text-orange-400 text-lg">{formatPrice(cartTotal)}</span>
                </div>

                <button
                  onClick={handleValidateSale}
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black text-xs uppercase shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? "Validation & Décrémentation..." : "Valider la vente"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
