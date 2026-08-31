import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { SaleRecord } from '../types';
import { 
  ShoppingBag, Package, History, User, Share2, DollarSign, Calendar
} from 'lucide-react';
import { PointOfSaleView } from './PointOfSaleView';
import { StockManagerView } from './StockManagerView';

interface CashierDashboardProps {
  establishmentId: string;
}

export function CashierDashboard({ establishmentId }: CashierDashboardProps) {
  const { currentUser, ventes } = useAppStore();
  const [activeTab, setActiveTab] = useState<'ventes' | 'stocks' | 'historique'>('ventes');

  // Filter sales for this establishment
  const estSales = useMemo(() => {
    const allEstSales = ventes.filter(sale => sale.establishmentId === establishmentId);
    // Sort by date descending
    allEstSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Gérant sees all sales; Caissier sees only their own
    const isOwner = currentUser?.id && currentUser.role === 'gerant';
    if (isOwner) {
      return allEstSales;
    } else {
      return allEstSales.filter(sale => sale.cashierId === currentUser?.id);
    }
  }, [ventes, establishmentId, currentUser]);

  const isOwner = currentUser && currentUser.role === 'gerant';

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} F CFA`;
  };

  const shareReceiptWhatsApp = (sale: SaleRecord) => {
    const itemsText = sale.items
      .map(it => `• ${it.name} x${it.quantity} (${formatPrice(it.unitPrice)}/u)`)
      .join('\n');
    
    const text = `🧾 *REÇU DE VENTE*\n---------------------------\n🏢 Établissement: *${currentUser?.name || 'Notre établissement'}*\n📅 Date: ${new Date(sale.date).toLocaleString('fr-FR')}\n👤 Caissier: ${sale.cashierName || 'Staff'}\n---------------------------\n*Articles vendus :*\n${itemsText}\n---------------------------\n💰 *TOTAL : ${formatPrice(sale.totalAmount)}*\n\nMerci pour votre confiance ! ✨`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto" id="cashier-dashboard-root">
      {/* Tab Selectors */}
      <div className="flex bg-gray-100/80 dark:bg-gray-950 p-1.5 rounded-2xl gap-2 border border-gray-200 dark:border-gray-850">
        <button
          onClick={() => setActiveTab('ventes')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'ventes'
              ? 'bg-orange-600 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Ventes (Caisse)
        </button>
        <button
          onClick={() => setActiveTab('stocks')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'stocks'
              ? 'bg-orange-600 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Package className="w-4 h-4" />
          Stock Boissons
        </button>
        <button
          onClick={() => setActiveTab('historique')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
            activeTab === 'historique'
              ? 'bg-orange-600 text-white shadow-md'
              : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <History className="w-4 h-4" />
          Historique
        </button>
      </div>

      {/* Tab Contents */}
      <div className="pt-2">
        {activeTab === 'ventes' && (
          <PointOfSaleView establishmentId={establishmentId} />
        )}

        {activeTab === 'stocks' && (
          <StockManagerView establishmentId={establishmentId} />
        )}

        {activeTab === 'historique' && (
          <div className="space-y-6" id="sales-history-view">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
                <History className="w-5 h-5 text-orange-500" />
                {isOwner ? "Toutes les ventes de l'établissement" : "Mes ventes enregistrées"}
              </h3>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-xl font-bold text-gray-600 dark:text-gray-400">
                Total {estSales.length} {estSales.length > 1 ? 'ventes' : 'vente'}
              </span>
            </div>

            {estSales.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <History className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-xs font-bold text-gray-400 dark:text-gray-500">Aucune vente enregistrée pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {estSales.map(sale => (
                  <div key={sale.id} className="p-5 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-gray-950 dark:text-white">Vente #{sale.id.slice(0, 8)}</span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(sale.date).toLocaleString('fr-FR')}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {sale.items.map((it, i) => (
                          <span key={i} className="px-2.5 py-1 bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-850 rounded-lg text-[10px] font-black text-gray-700 dark:text-gray-300">
                            {it.name} x{it.quantity} ({formatPrice(it.unitPrice * it.quantity)})
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span>Caissier: {sale.cashierName || "Staff"}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 border-gray-50 dark:border-gray-850 pt-3 md:pt-0">
                      <div className="text-left md:text-right">
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-wider">Montant total</p>
                        <p className="text-base font-black text-orange-600 dark:text-orange-400">{formatPrice(sale.totalAmount)}</p>
                      </div>

                      <button
                        onClick={() => shareReceiptWhatsApp(sale)}
                        className="p-3 bg-emerald-50 dark:bg-emerald-950/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl hover:shadow-sm transition-all cursor-pointer"
                        title="Partager le reçu par WhatsApp"
                      >
                        <Share2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
