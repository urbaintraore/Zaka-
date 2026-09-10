import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Minus,
  Trash2,
  Receipt,
  Search,
  User,
  Phone,
  Scissors,
  Package,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  Filter,
  Lock,
  FileSpreadsheet,
  AlertTriangle,
  Gift,
  RefreshCw,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Percent,
  Check,
  X
} from 'lucide-react';
import {
  BeautySalon,
  BeautyService,
  BeautyProduct,
  BeautySale,
  BeautySaleItem,
  BeautyPaymentMethod,
  BeautyAppointment,
  BeautyStaffMember,
  BeautyLoyaltyAccount,
  BeautyReward,
  BeautyCashClosure
} from '../../types';
import {
  fetchBeautySales,
  createBeautySale,
  cancelBeautySale,
  fetchBeautyProducts,
  fetchSalonServices,
  fetchSalonStaff,
  fetchLoyaltySettings,
  fetchClientLoyaltyAccount,
  fetchLoyaltyRewards,
  fetchCashClosures,
  BEAUTY_PAYMENT_LABELS,
  formatFcfa
} from '../../lib/beautyService';
import { BeautyReceiptModal } from './BeautyReceiptModal';
import { BeautyCashClosureModal } from './BeautyCashClosureModal';

interface BeautyPosViewProps {
  salon: BeautySalon;
  currentUser?: any;
  initialAppointment?: BeautyAppointment | null;
  onAppointmentConverted?: () => void;
}

export function BeautyPosView({
  salon,
  currentUser,
  initialAppointment,
  onAppointmentConverted
}: BeautyPosViewProps) {
  // Navigation within POS
  const [posTab, setPosTab] = useState<'pos' | 'history' | 'closures'>('pos');

  // Catalogs
  const [services, setServices] = useState<BeautyService[]>([]);
  const [products, setProducts] = useState<BeautyProduct[]>([]);
  const [staff, setStaff] = useState<BeautyStaffMember[]>([]);
  const [rewards, setRewards] = useState<BeautyReward[]>([]);
  const [sales, setSales] = useState<BeautySale[]>([]);
  const [closures, setClosures] = useState<BeautyCashClosure[]>([]);
  const [loading, setLoading] = useState(true);

  // Cart / Current Sale State
  const [cartItems, setCartItems] = useState<BeautySaleItem[]>([]);
  const [clientNom, setClientNom] = useState('');
  const [clientTelephone, setClientTelephone] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<BeautyPaymentMethod>('especes');
  const [referencePaiement, setReferencePaiement] = useState('');
  const [montantRecu, setMontantRecu] = useState<string>('');
  const [remiseFcfa, setRemiseFcfa] = useState<number>(0);
  const [remisePourcent, setRemisePourcent] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [selectedRewardId, setSelectedRewardId] = useState<string>('');
  const [linkedAppointmentId, setLinkedAppointmentId] = useState<string | undefined>(undefined);

  // Client Loyalty details
  const [clientLoyalty, setClientLoyalty] = useState<BeautyLoyaltyAccount | null>(null);
  const [loyaltySearching, setLoyaltySearching] = useState(false);

  // Search & Catalog Filtering
  const [catalogCategory, setCatalogCategory] = useState<'all' | 'services' | 'products'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // History Filters
  const [historyPeriod, setHistoryPeriod] = useState<'today' | 'yesterday' | 'week' | 'month' | 'all'>('today');
  const [historyPaymentFilter, setHistoryPaymentFilter] = useState<string>('all');
  const [historySearchTerm, setHistorySearchTerm] = useState('');

  // Modals
  const [activeReceiptSale, setActiveReceiptSale] = useState<BeautySale | null>(null);
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Initial Data Loading
  const loadPosData = async () => {
    try {
      setLoading(true);
      const [srvList, prodList, staffList, rewList, salesList, closureList] = await Promise.all([
        fetchSalonServices(salon.id, true),
        fetchBeautyProducts(salon.id, true),
        fetchSalonStaff(salon.id),
        fetchLoyaltyRewards(salon.id, true),
        fetchBeautySales(salon.id),
        fetchCashClosures(salon.id)
      ]);

      setServices(srvList);
      setProducts(prodList);
      setStaff(staffList);
      setRewards(rewList);
      setSales(salesList);
      setClosures(closureList);
    } catch (err) {
      console.warn('Erreur chargement POS:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosData();
  }, [salon.id]);

  // 2. Pre-fill from converted appointment if any
  useEffect(() => {
    if (initialAppointment) {
      setPosTab('pos');
      setClientNom(initialAppointment.nomClient || '');
      setClientTelephone(initialAppointment.telephoneClient || '');
      setLinkedAppointmentId(initialAppointment.id);

      if (initialAppointment.serviceId) {
        const srv = services.find(s => s.id === initialAppointment.serviceId);
        if (srv) {
          setCartItems([
            {
              itemType: 'service',
              itemId: srv.id,
              nom: srv.nom,
              quantite: 1,
              prixUnitaireFcfa: srv.prixFcfa,
              montantTotalFcfa: srv.prixFcfa
            }
          ]);
        }
      } else if (initialAppointment.serviceNom) {
        setCartItems([
          {
            itemType: 'service',
            itemId: 'custom_service',
            nom: initialAppointment.serviceNom,
            quantite: 1,
            prixUnitaireFcfa: initialAppointment.prixTotalFcfa || 5000,
            montantTotalFcfa: initialAppointment.prixTotalFcfa || 5000
          }
        ]);
      }
    }
  }, [initialAppointment, services]);

  // 3. Client Loyalty Account lookup when phone changes
  useEffect(() => {
    const cleanPhone = clientTelephone.trim();
    if (cleanPhone.length >= 8) {
      setLoyaltySearching(true);
      fetchClientLoyaltyAccount(salon.id, cleanPhone)
        .then(acc => setClientLoyalty(acc))
        .catch(() => setClientLoyalty(null))
        .finally(() => setLoyaltySearching(false));
    } else {
      setClientLoyalty(null);
    }
  }, [clientTelephone, salon.id]);

  // Cart Management Functions
  const addItemToCart = (type: 'service' | 'produit', item: BeautyService | BeautyProduct) => {
    setCartItems(prev => {
      const existingIdx = prev.findIndex(ci => ci.itemId === item.id && ci.itemType === type);
      const unitPrice = type === 'service' ? (item as BeautyService).prixFcfa : (item as BeautyProduct).prixVente;

      if (existingIdx >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantite + 1;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantite: newQty,
          montantTotalFcfa: newQty * unitPrice
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            itemType: type,
            itemId: item.id,
            nom: item.nom,
            quantite: 1,
            prixUnitaireFcfa: unitPrice,
            montantTotalFcfa: unitPrice
          }
        ];
      }
    });
  };

  const updateCartItemQuantity = (index: number, delta: number) => {
    setCartItems(prev => {
      const target = prev[index];
      const newQty = target.quantite + delta;
      if (newQty <= 0) {
        return prev.filter((_, i) => i !== index);
      }
      const updated = [...prev];
      updated[index] = {
        ...target,
        quantite: newQty,
        montantTotalFcfa: newQty * target.prixUnitaireFcfa
      };
      return updated;
    });
  };

  const removeCartItem = (index: number) => {
    setCartItems(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCartItems([]);
    setClientNom('');
    setClientTelephone('');
    setSelectedStaffId('');
    setPaymentMethod('especes');
    setReferencePaiement('');
    setMontantRecu('');
    setRemiseFcfa(0);
    setRemisePourcent(0);
    setSelectedRewardId('');
    setLinkedAppointmentId(undefined);
    setNotes('');
  };

  // Calculations
  const montantBrut = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.montantTotalFcfa, 0);
  }, [cartItems]);

  const discountCalculated = useMemo(() => {
    let totalDiscount = remiseFcfa;
    if (remisePourcent > 0) {
      totalDiscount += Math.round((montantBrut * remisePourcent) / 100);
    }
    // Check if a reward is selected
    if (selectedRewardId) {
      const reward = rewards.find(r => r.id === selectedRewardId);
      if (reward) {
        if (reward.typeRecompense === 'reduction_pourcentage' && reward.valeurReduction) {
          totalDiscount += Math.round((montantBrut * reward.valeurReduction) / 100);
        } else if (reward.typeRecompense === 'reduction_montant' && reward.valeurReduction) {
          totalDiscount += reward.valeurReduction;
        }
      }
    }
    return Math.min(montantBrut, totalDiscount);
  }, [montantBrut, remiseFcfa, remisePourcent, selectedRewardId, rewards]);

  const montantNet = Math.max(0, montantBrut - discountCalculated);

  const parsedMontantRecu = Number(montantRecu) || 0;
  const monnaieRendue = parsedMontantRecu > montantNet ? parsedMontantRecu - montantNet : 0;

  // Finalize & Create Sale
  const handleValidateSale = async () => {
    if (cartItems.length === 0) {
      setNotificationMsg({ type: 'error', text: 'Veuillez ajouter au moins un article ou prestation au panier.' });
      return;
    }

    setIsSubmittingSale(true);
    setNotificationMsg(null);

    try {
      const selectedStaff = staff.find(s => s.id === selectedStaffId);

      const sale = await createBeautySale({
        salonId: salon.id,
        salonNom: salon.nom,
        appointmentId: linkedAppointmentId,
        nomClient: clientNom.trim() || 'Client de passage',
        telephoneClient: clientTelephone.trim() || undefined,
        employeeId: selectedStaff?.id,
        employeeName: selectedStaff?.nom,
        items: cartItems,
        montantBrutFcfa: montantBrut,
        montantRemiseFcfa: discountCalculated,
        montantTotalFcfa: montantNet,
        montantRecuFcfa: parsedMontantRecu > 0 ? parsedMontantRecu : montantNet,
        montantRenduFcfa: monnaieRendue,
        moyenPaiement: paymentMethod,
        referencePaiement: referencePaiement.trim() || undefined,
        recompenseId: selectedRewardId || undefined,
        notes: notes.trim() || undefined,
        caissierNom: currentUser?.displayName || currentUser?.nom || 'Caisse'
      });

      // Reload sales & products (stock updated)
      loadPosData();

      // Show receipt modal
      setActiveReceiptSale(sale);
      setNotificationMsg({ type: 'success', text: `Vente de ${formatFcfa(montantNet)} validée avec succès !` });

      if (onAppointmentConverted) {
        onAppointmentConverted();
      }

      // Reset cart
      clearCart();
    } catch (err: any) {
      setNotificationMsg({ type: 'error', text: err.message || 'Erreur lors de la validation de la vente.' });
    } finally {
      setIsSubmittingSale(false);
    }
  };

  // Filter Catalog Items
  const filteredServices = useMemo(() => {
    if (catalogCategory === 'products') return [];
    return services.filter(s =>
      s.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.categorie.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [services, catalogCategory, searchTerm]);

  const filteredProducts = useMemo(() => {
    if (catalogCategory === 'services') return [];
    return products.filter(p =>
      p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categorie.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [products, catalogCategory, searchTerm]);

  // History filtering
  const filteredSales = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay() || 7;
    startOfWeek.setDate(startOfWeek.getDate() - day + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return sales.filter(s => {
      // Period filter
      if (historyPeriod === 'today' && !s.dateVente.startsWith(todayStr)) return false;
      if (historyPeriod === 'yesterday' && !s.dateVente.startsWith(yesterdayStr)) return false;
      if (historyPeriod === 'week' && new Date(s.dateVente) < startOfWeek) return false;
      if (historyPeriod === 'month' && new Date(s.dateVente) < startOfMonth) return false;

      // Payment filter
      if (historyPaymentFilter !== 'all' && s.moyenPaiement !== historyPaymentFilter) return false;

      // Search term (client name, phone, item name)
      if (historySearchTerm) {
        const term = historySearchTerm.toLowerCase();
        const matchesClient = s.nomClient?.toLowerCase().includes(term) || s.telephoneClient?.includes(term);
        const matchesItem = s.items?.some(it => it.nom.toLowerCase().includes(term));
        const matchesId = s.id.toLowerCase().includes(term);
        if (!matchesClient && !matchesItem && !matchesId) return false;
      }

      return true;
    });
  }, [sales, historyPeriod, historyPaymentFilter, historySearchTerm]);

  // Quick stats for history header
  const historyTotalCa = useMemo(() => {
    return filteredSales.filter(s => s.statut === 'paye').reduce((sum, s) => sum + s.montantTotalFcfa, 0);
  }, [filteredSales]);

  return (
    <div className="space-y-6">
      {/* Top POS Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <span>Caisse & Ventes</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                ZAKA Beauty POS
              </span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enregistrement des prestations et produits, encaissement rapide et tickets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-750 rounded-2xl">
            <button
              onClick={() => setPosTab('pos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                posTab === 'pos'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              + Nouvelle Vente
            </button>
            <button
              onClick={() => setPosTab('history')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                posTab === 'history'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Historique ({sales.length})
            </button>
            <button
              onClick={() => setPosTab('closures')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                posTab === 'closures'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Clôtures ({closures.length})
            </button>
          </div>

          <button
            onClick={() => setIsClosureModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Lock className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden md:inline">Clôturer la journée</span>
          </button>
        </div>
      </div>

      {notificationMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200 ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notificationMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            <span>{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)}>
            <X className="w-4 h-4 text-gray-400 hover:text-gray-700" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: NOUVELLE VENTE / POS INTERFACE                                    */}
      {/* ========================================================================= */}
      {posTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left / Middle: Catalog Selection (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Filter Pills & Search */}
            <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-750 p-1 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setCatalogCategory('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      catalogCategory === 'all'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    Tout ({services.length + products.length})
                  </button>
                  <button
                    onClick={() => setCatalogCategory('services')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      catalogCategory === 'services'
                        ? 'bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Scissors className="w-3.5 h-3.5" />
                    <span>Prestations ({services.length})</span>
                  </button>
                  <button
                    onClick={() => setCatalogCategory('products')}
                    className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                      catalogCategory === 'products'
                        ? 'bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    <Package className="w-3.5 h-3.5" />
                    <span>Produits ({products.length})</span>
                  </button>
                </div>

                <button
                  onClick={loadPosData}
                  title="Actualiser le catalogue"
                  className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Rechercher une coupe, tresse, shampooing, huile, soin..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:border-rose-500 outline-none"
                />
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {/* Section 1: Services */}
              {(catalogCategory === 'all' || catalogCategory === 'services') && filteredServices.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Scissors className="w-3.5 h-3.5 text-rose-500" />
                    <span>Prestations & Coiffure</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredServices.map(srv => (
                      <button
                        key={srv.id}
                        onClick={() => addItemToCart('service', srv)}
                        className="p-3.5 text-left bg-white dark:bg-gray-800 hover:border-rose-400 dark:hover:border-rose-500 border border-gray-100 dark:border-gray-700/80 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 group"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                            {srv.dureeMinutes} min
                          </span>
                          <Plus className="w-4 h-4 text-gray-300 group-hover:text-rose-500 transition-colors" />
                        </div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-2 line-clamp-2">
                          {srv.nom}
                        </h4>
                        <p className="text-sm font-black text-gray-900 dark:text-white mt-1">
                          {formatFcfa(srv.prixFcfa)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 2: Products */}
              {(catalogCategory === 'all' || catalogCategory === 'products') && filteredProducts.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-blue-500" />
                    <span>Produits & Cosmétiques en Stock</span>
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredProducts.map(prod => {
                      const isLowStock = prod.quantiteActuelle <= prod.quantiteMinimale;
                      const isOutOfStock = prod.quantiteActuelle <= 0;

                      return (
                        <button
                          key={prod.id}
                          disabled={isOutOfStock}
                          onClick={() => addItemToCart('produit', prod)}
                          className={`p-3.5 text-left bg-white dark:bg-gray-800 border rounded-2xl transition-all shadow-sm group ${
                            isOutOfStock
                              ? 'opacity-40 border-dashed border-gray-300 dark:border-gray-700 cursor-not-allowed'
                              : 'hover:border-blue-400 dark:hover:border-blue-500 border-gray-100 dark:border-gray-700/80 hover:shadow-md active:scale-95'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                isOutOfStock
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                  : isLowStock
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {isOutOfStock ? 'Rupture' : `${prod.quantiteActuelle} en stock`}
                            </span>
                            {!isOutOfStock && (
                              <Plus className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white mt-2 line-clamp-2">
                            {prod.nom}
                          </h4>
                          <p className="text-sm font-black text-gray-900 dark:text-white mt-1">
                            {formatFcfa(prod.prixVente)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {filteredServices.length === 0 && filteredProducts.length === 0 && (
                <div className="p-12 text-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 text-gray-400">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Aucun article trouvé</p>
                  <p className="text-xs mt-1">Ajoutez des prestations dans le catalogue Services ou des articles dans le Stock.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Cart & Payment Checkout (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2 font-bold text-sm text-gray-900 dark:text-white">
                  <ShoppingBag className="w-4 h-4 text-rose-500" />
                  <span>Panier en Caisse</span>
                  <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {cartItems.reduce((sum, it) => sum + it.quantite, 0)}
                  </span>
                </div>
                {cartItems.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs font-semibold text-red-500 hover:text-red-700 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Vider</span>
                  </button>
                )}
              </div>

              {/* Client & Loyalty Card Section */}
              <div className="space-y-2.5 p-3.5 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    Client & Fidélité
                  </span>
                  {clientLoyalty && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      {clientLoyalty.pointsSolde} pts ({clientLoyalty.niveau})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="text"
                      value={clientNom}
                      onChange={e => setClientNom(e.target.value)}
                      placeholder="Nom du client"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:border-rose-500 outline-none"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="tel"
                      value={clientTelephone}
                      onChange={e => setClientTelephone(e.target.value)}
                      placeholder="Tél (ex: 70000000)"
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:border-rose-500 outline-none"
                    />
                    {loyaltySearching && (
                      <RefreshCw className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                    )}
                  </div>
                </div>

                {/* Rewards redeem dropdown if client has points */}
                {clientLoyalty && clientLoyalty.pointsSolde > 0 && rewards.length > 0 && (
                  <div className="pt-1">
                    <select
                      value={selectedRewardId}
                      onChange={e => setSelectedRewardId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs font-bold rounded-xl outline-none"
                    >
                      <option value="">🎁 Utiliser une récompense fidélité...</option>
                      {rewards
                        .filter(r => r.pointsRequis <= (clientLoyalty?.pointsSolde || 0))
                        .map(r => (
                          <option key={r.id} value={r.id}>
                            {r.titre} (-{r.pointsRequis} pts)
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Coiffeur / Staff Member Assigned */}
              {staff.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Professionnel / Coiffeur assigné
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={e => setSelectedStaffId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:border-rose-500 outline-none"
                  >
                    <option value="">Sélectionner un membre de l'équipe (facultatif)</option>
                    {staff.filter(s => s.actif).map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nom} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Cart Items List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cartItems.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs">
                    Cliquez sur les prestations ou produits à gauche pour les ajouter à la vente.
                  </div>
                ) : (
                  cartItems.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 text-xs"
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="font-bold text-gray-900 dark:text-white truncate">
                          {item.nom}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {formatFcfa(item.prixUnitaireFcfa)} / {item.itemType === 'service' ? 'prestation' : 'unité'}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-0.5">
                          <button
                            onClick={() => updateCartItemQuantity(index, -1)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-bold text-xs">{item.quantite}</span>
                          <button
                            onClick={() => updateCartItemQuantity(index, 1)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-extrabold text-gray-900 dark:text-white w-16 text-right">
                          {formatFcfa(item.montantTotalFcfa)}
                        </span>

                        <button
                          onClick={() => removeCartItem(index)}
                          className="p-1 text-gray-400 hover:text-red-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Payment Methods (Large Touch Buttons as requested) */}
              <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Moyen de Paiement
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['especes', 'orange_money', 'moov_money', 'wave', 'virement', 'autre'] as BeautyPaymentMethod[]).map(
                    method => {
                      const cfg = BEAUTY_PAYMENT_LABELS[method];
                      const isSelected = paymentMethod === method;
                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`py-2.5 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center gap-1 transition-all active:scale-95 border ${
                            isSelected
                              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-700 dark:text-rose-300 shadow-sm'
                              : 'bg-gray-50 dark:bg-gray-800/60 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          <span className="text-base">{cfg.icon}</span>
                          <span className="text-[11px] truncate w-full text-center">{cfg.label}</span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {/* Cash & Change Calculator if Cash */}
              {paymentMethod === 'especes' && montantNet > 0 && (
                <div className="grid grid-cols-2 gap-2 p-3 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
                  <div>
                    <label className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-300 mb-0.5">
                      Montant reçu (FCFA)
                    </label>
                    <input
                      type="number"
                      value={montantRecu}
                      onChange={e => setMontantRecu(e.target.value)}
                      placeholder={montantNet.toString()}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-800 rounded-lg text-xs font-bold text-emerald-900 dark:text-emerald-200 outline-none"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold text-emerald-800 dark:text-emerald-300 mb-0.5">
                      Monnaie à rendre
                    </span>
                    <div className="px-2.5 py-1.5 bg-emerald-100 dark:bg-emerald-900/60 rounded-lg text-xs font-black text-emerald-900 dark:text-emerald-100">
                      {formatFcfa(monnaieRendue)}
                    </div>
                  </div>
                </div>
              )}

              {/* Reference if Mobile Money */}
              {paymentMethod !== 'especes' && (
                <div>
                  <input
                    type="text"
                    value={referencePaiement}
                    onChange={e => setReferencePaiement(e.target.value)}
                    placeholder="Référence / ID de transaction Mobile Money ou virement..."
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:border-rose-500 outline-none"
                  />
                </div>
              )}

              {/* Totals Summary */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Sous-total brut :</span>
                  <span>{formatFcfa(montantBrut)}</span>
                </div>
                {discountCalculated > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Remise / Récompense :</span>
                    <span>-{formatFcfa(discountCalculated)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 text-lg font-black text-gray-900 dark:text-white">
                  <span>TOTAL NET :</span>
                  <span className="text-rose-600 dark:text-rose-400">
                    {formatFcfa(montantNet)}
                  </span>
                </div>
              </div>

              {/* Validation Button */}
              <button
                onClick={handleValidateSale}
                disabled={cartItems.length === 0 || isSubmittingSale}
                className="w-full py-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-rose-500/25 active:scale-95 disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" />
                <span>
                  {isSubmittingSale
                    ? 'Encaissement...'
                    : `Valider la Vente (${formatFcfa(montantNet)})`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: HISTORIQUE DES VENTES & RECHERCHE AVANCÉE                          */}
      {/* ========================================================================= */}
      {posTab === 'history' && (
        <div className="space-y-4">
          {/* History Header Filters */}
          <div className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-750 rounded-xl text-xs font-bold">
                  <button
                    onClick={() => setHistoryPeriod('today')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      historyPeriod === 'today'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500'
                    }`}
                  >
                    Aujourd'hui
                  </button>
                  <button
                    onClick={() => setHistoryPeriod('yesterday')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      historyPeriod === 'yesterday'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500'
                    }`}
                  >
                    Hier
                  </button>
                  <button
                    onClick={() => setHistoryPeriod('week')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      historyPeriod === 'week'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500'
                    }`}
                  >
                    Cette semaine
                  </button>
                  <button
                    onClick={() => setHistoryPeriod('month')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      historyPeriod === 'month'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500'
                    }`}
                  >
                    Ce mois
                  </button>
                  <button
                    onClick={() => setHistoryPeriod('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      historyPeriod === 'all'
                        ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-500'
                    }`}
                  >
                    Toutes
                  </button>
                </div>

                <select
                  value={historyPaymentFilter}
                  onChange={e => setHistoryPaymentFilter(e.target.value)}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-750 border-0 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 outline-none"
                >
                  <option value="all">Tous paiements</option>
                  <option value="especes">💵 Espèces</option>
                  <option value="orange_money">🟧 Orange Money</option>
                  <option value="moov_money">🟦 Moov Money</option>
                  <option value="wave">🐧 Wave</option>
                  <option value="virement">🏦 Virement</option>
                </select>
              </div>

              {/* Quick Summary Pill */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  {filteredSales.length} transaction(s)
                </span>
                <span className="text-sm font-black text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-1.5 rounded-xl">
                  Total : {formatFcfa(historyTotalCa)}
                </span>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={historySearchTerm}
                onChange={e => setHistorySearchTerm(e.target.value)}
                placeholder="Filtrer par nom client, téléphone, prestation ou n° de ticket..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:border-rose-500 outline-none"
              />
            </div>
          </div>

          {/* Sales List Table */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-5 py-3">Réf / Date</th>
                    <th className="px-5 py-3">Client</th>
                    <th className="px-5 py-3">Articles / Prestations</th>
                    <th className="px-5 py-3">Paiement</th>
                    <th className="px-5 py-3 text-right">Montant</th>
                    <th className="px-5 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredSales.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                        Aucune vente trouvée pour cette période.
                      </td>
                    </tr>
                  ) : (
                    filteredSales.map(sale => {
                      const payConfig = BEAUTY_PAYMENT_LABELS[sale.moyenPaiement] || {
                        label: sale.moyenPaiement,
                        icon: '💳'
                      };
                      const saleDateObj = new Date(sale.dateVente);
                      const isCancelled = sale.statut === 'annule';

                      return (
                        <tr
                          key={sale.id}
                          className={`hover:bg-gray-50/80 dark:hover:bg-gray-750/50 transition-colors ${
                            isCancelled ? 'opacity-50 line-through' : ''
                          }`}
                        >
                          <td className="px-5 py-3.5">
                            <span className="font-mono font-bold text-gray-900 dark:text-white block">
                              #{sale.id.slice(-6).toUpperCase()}
                            </span>
                            <span className="text-[10px] text-gray-400">
                              {saleDateObj.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}{' '}
                              {saleDateObj.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>

                          <td className="px-5 py-3.5">
                            <span className="font-bold text-gray-900 dark:text-white block">
                              {sale.nomClient}
                            </span>
                            {sale.telephoneClient && (
                              <span className="text-[10px] text-gray-400 block">
                                {sale.telephoneClient}
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 max-w-xs">
                            <div className="space-y-0.5">
                              {sale.items.map((it, i) => (
                                <span
                                  key={i}
                                  className="inline-block bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-[10px] px-2 py-0.5 rounded mr-1 mb-1 font-medium"
                                >
                                  {it.nom} (x{it.quantite})
                                </span>
                              ))}
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center gap-1 font-bold text-gray-700 dark:text-gray-300">
                              <span>{payConfig.icon}</span> {payConfig.label}
                            </span>
                            {sale.referencePaiement && (
                              <span className="text-[10px] text-gray-400 block font-mono">
                                {sale.referencePaiement}
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 text-right font-black text-sm text-gray-900 dark:text-white">
                            {formatFcfa(sale.montantTotalFcfa)}
                          </td>

                          <td className="px-5 py-3.5 text-center">
                            <button
                              onClick={() => setActiveReceiptSale(sale)}
                              className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl transition-colors inline-flex items-center gap-1"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Ticket</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CLÔTURES DE CAISSE HISTORIQUES                                    */}
      {/* ========================================================================= */}
      {posTab === 'closures' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <div>
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-500" />
                <span>Journal des Clôtures de Caisse</span>
              </h2>
              <p className="text-xs text-gray-400">
                Archives journalières sécurisées et immuables des arrêtés de comptes.
              </p>
            </div>
            <button
              onClick={() => setIsClosureModalOpen(true)}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Clôturer aujourd'hui</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {closures.length === 0 ? (
              <div className="col-span-2 p-12 text-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 text-gray-400">
                <Lock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="font-bold text-sm text-gray-700 dark:text-gray-300">Aucune clôture archivée</p>
                <p className="text-xs mt-1">Clôturez votre journée en fin de service pour enregistrer les totaux.</p>
              </div>
            ) : (
              closures.map(cl => (
                <div
                  key={cl.id}
                  className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-rose-500" />
                      <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                        {new Date(cl.dateCloture).toLocaleDateString('fr-FR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-md">
                      Clôturée à {cl.heureCloture}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl">
                      <span className="text-gray-400 text-[10px] block">CA Total</span>
                      <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400">
                        {formatFcfa(cl.totalVentesFcfa)}
                      </span>
                    </div>
                    <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl">
                      <span className="text-gray-400 text-[10px] block">Transactions</span>
                      <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                        {cl.nombreTransactions}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-gray-600 dark:text-gray-300 pt-1">
                    <div className="flex justify-between">
                      <span>💵 Espèces :</span>
                      <span className="font-bold">{formatFcfa(cl.totalEspecesFcfa)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🟧 Orange Money :</span>
                      <span className="font-bold">{formatFcfa(cl.totalOrangeMoneyFcfa)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🟦 Moov Money :</span>
                      <span className="font-bold">{formatFcfa(cl.totalMoovMoneyFcfa)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>🐧 Wave :</span>
                      <span className="font-bold">{formatFcfa(cl.totalWaveFcfa)}</span>
                    </div>
                  </div>

                  {cl.notes && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-2.5 rounded-xl">
                      💬 {cl.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Printable / Shareable Receipt Modal */}
      <BeautyReceiptModal
        sale={activeReceiptSale}
        salonNom={salon.nom}
        salonTelephone={salon.telephone}
        salonAdresse={salon.adresse || salon.quartier}
        isOpen={Boolean(activeReceiptSale)}
        onClose={() => setActiveReceiptSale(null)}
      />

      {/* Daily Cash Closure Modal */}
      <BeautyCashClosureModal
        salonId={salon.id}
        sales={sales}
        isOpen={isClosureModalOpen}
        onClose={() => setIsClosureModalOpen(false)}
        onClosureCompleted={newCl => {
          setClosures(prev => [newCl, ...prev]);
          setNotificationMsg({ type: 'success', text: `Journée du ${newCl.dateCloture} clôturée avec succès !` });
        }}
        caissierNom={currentUser?.displayName || currentUser?.nom || 'Gérant'}
      />
    </div>
  );
}

export const CashRegisterView = BeautyPosView;

