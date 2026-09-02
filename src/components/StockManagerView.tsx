import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { StockItem, StockReception, StockInventory } from '../types';
import { 
  Package, Plus, AlertTriangle, CheckCircle, 
  Search, Edit2, Check, X, RefreshCw, Trash2, 
  History, ShieldAlert, Boxes, ArrowUpRight, FileText, Lock, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StockManagerViewProps {
  establishmentId: string;
  isGerant?: boolean;
}

// Utility to convert quantity in units to a human-readable "X caisses + Y unités"
export function formatStockBreakdown(quantity: number, unitsPerCase: number = 12): string {
  const safeUnitsPerCase = unitsPerCase > 0 ? unitsPerCase : 12;
  const cases = Math.floor(quantity / safeUnitsPerCase);
  const remainingUnits = quantity % safeUnitsPerCase;

  if (cases === 0) {
    return `${quantity} un.`;
  }
  if (remainingUnits === 0) {
    return `${quantity} un. (${cases} cse${cases > 1 ? 's' : ''})`;
  }
  return `${quantity} un. (${cases} cse${cases > 1 ? 's' : ''} + ${remainingUnits} un.)`;
}

export function StockManagerView({ establishmentId, isGerant: propIsGerant }: StockManagerViewProps) {
  const { 
    currentUser,
    establishments,
    stocks, 
    receptionsStock,
    inventairesStock,
    addStockItem, 
    updateStockItem, 
    deleteStockItem,
    addStockReception,
    addStockInventory
  } = useAppStore();

  // Determine if active user is Gérant/Owner or Caissier
  const currentEst = useMemo(() => establishments.find(e => e.id === establishmentId), [establishments, establishmentId]);
  
  const isGerantUser = useMemo(() => {
    if (propIsGerant !== undefined) return propIsGerant;
    if (!currentUser) return false;
    if (currentUser.role === 'admin' || currentUser.role === 'gerant' || currentUser.role === 'salon_coiffure') return true;
    if (currentEst && currentEst.ownerId === currentUser.id) return true;
    return false;
  }, [propIsGerant, currentUser, currentEst]);

  // Modal Visibility States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------------------------------------
  // FORM 1: Create / Edit Drink Catalogue Form State
  // -------------------------------------------------------------
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [drinkName, setDrinkName] = useState('');
  const [drinkVolume, setDrinkVolume] = useState('66cl');
  const [unitsPerCase, setUnitsPerCase] = useState<number>(12);
  const [drinkPrice, setDrinkPrice] = useState('');
  const [initInputType, setInitInputType] = useState<'cases' | 'units'>('cases');
  const [initQtyVal, setInitQtyVal] = useState('0');

  // -------------------------------------------------------------
  // FORM 2: Stock Reception in Cases Form State
  // -------------------------------------------------------------
  const [receptionStockId, setReceptionStockId] = useState<string>('');
  const [receptionCasesCount, setReceptionCasesCount] = useState<string>('1');

  // -------------------------------------------------------------
  // FORM 3: Physical Inventory & Theft Audit Form State
  // -------------------------------------------------------------
  const [inventoryStockId, setInventoryStockId] = useState<string>('');
  const [physicalCountUnits, setPhysicalCountUnits] = useState<string>('0');
  const [autoAdjustStock, setAutoAdjustStock] = useState<boolean>(true);
  const [inventoryNote, setInventoryNote] = useState<string>('');

  // -------------------------------------------------------------
  // FORM 4: History Sub-Tab
  // -------------------------------------------------------------
  const [historyTab, setHistoryTab] = useState<'receptions' | 'inventaires'>('receptions');

  // Deletion Confirmation
  const [deletingStockId, setDeletingStockId] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Filtered Datasets
  // -------------------------------------------------------------
  const estStocks = useMemo(() => {
    return stocks.filter(item => item.establishmentId === establishmentId);
  }, [stocks, establishmentId]);

  const estReceptions = useMemo(() => {
    return receptionsStock
      .filter(r => r.establishmentId === establishmentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [receptionsStock, establishmentId]);

  const estInventaires = useMemo(() => {
    return inventairesStock
      .filter(i => i.establishmentId === establishmentId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [inventairesStock, establishmentId]);

  const lowStockCount = useMemo(() => {
    return estStocks.filter(d => d.quantity > 0 && d.quantity <= 5).length;
  }, [estStocks]);

  const outOfStockCount = useMemo(() => {
    return estStocks.filter(d => d.quantity <= 0).length;
  }, [estStocks]);

  const totalUnitsInStock = useMemo(() => {
    return estStocks.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [estStocks]);

  const filteredStocks = useMemo(() => {
    return estStocks.filter(drink => 
      drink.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (drink.volume && drink.volume.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [estStocks, searchQuery]);

  // -------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------

  // Reset drink form
  const resetDrinkForm = () => {
    setEditingStockId(null);
    setDrinkName('');
    setDrinkVolume('66cl');
    setUnitsPerCase(12);
    setDrinkPrice('');
    setInitInputType('cases');
    setInitQtyVal('0');
  };

  // Open modal to add new drink
  const handleOpenAddDrink = () => {
    resetDrinkForm();
    setShowAddModal(true);
  };

  // Open modal to edit existing drink
  const handleOpenEditDrink = (drink: StockItem) => {
    setEditingStockId(drink.id);
    setDrinkName(drink.name);
    setDrinkVolume(drink.volume || '66cl');
    setUnitsPerCase(drink.unitsPerCase || drink.unites_par_caisse || 12);
    setDrinkPrice(drink.price.toString());
    setInitInputType('units');
    setInitQtyVal(drink.quantity.toString());
    setShowAddModal(true);
  };

  // Submit Add or Update Drink
  const handleSaveDrink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drinkName.trim() || !drinkPrice) {
      setErrorMsg("Veuillez renseigner le nom de la boisson et le prix unitaire.");
      return;
    }

    const price = parseFloat(drinkPrice);
    if (isNaN(price) || price <= 0) {
      setErrorMsg("Le prix de vente unitaire doit être supérieur à 0 F CFA.");
      return;
    }

    const rawQtyInput = parseInt(initQtyVal || '0');
    const safeUnitsPerCase = unitsPerCase > 0 ? unitsPerCase : 12;
    const finalQuantityInUnits = initInputType === 'cases' ? rawQtyInput * safeUnitsPerCase : rawQtyInput;

    if (isNaN(finalQuantityInUnits) || finalQuantityInUnits < 0) {
      setErrorMsg("La quantité doit être un nombre positif ou nul.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      if (editingStockId) {
        // Update existing drink
        await updateStockItem(editingStockId, {
          name: drinkName.trim(),
          volume: drinkVolume.trim(),
          unitsPerCase: safeUnitsPerCase,
          price,
          quantity: finalQuantityInUnits,
          stock_faible: finalQuantityInUnits <= 5
        });
        setSuccessMsg(`Fiche produit "${drinkName}" mise à jour.`);
      } else {
        // Create new drink
        await addStockItem({
          establishmentId,
          name: drinkName.trim(),
          volume: drinkVolume.trim(),
          unitsPerCase: safeUnitsPerCase,
          price,
          quantity: finalQuantityInUnits,
          category: 'boisson',
          stock_faible: finalQuantityInUnits <= 5
        });
        setSuccessMsg(`Nouvelle boisson "${drinkName}" (${drinkVolume}) ajoutée au catalogue.`);
      }

      setShowAddModal(false);
      resetDrinkForm();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'enregistrement du produit.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Reception Modal
  const handleOpenReception = (stockIdTarget?: string) => {
    if (estStocks.length === 0) {
      setErrorMsg("Veuillez d'abord ajouter au moins une boisson au catalogue.");
      return;
    }
    setReceptionStockId(stockIdTarget || estStocks[0]?.id || '');
    setReceptionCasesCount('1');
    setShowReceptionModal(true);
  };

  // Submit Stock Reception (Gérant only)
  const handleSaveReception = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStock = estStocks.find(s => s.id === receptionStockId);
    if (!targetStock) {
      setErrorMsg("Veuillez sélectionner une boisson.");
      return;
    }

    const cases = parseInt(receptionCasesCount || '0');
    if (isNaN(cases) || cases <= 0) {
      setErrorMsg("Le nombre de caisses doit être un nombre strictement supérieur à 0.");
      return;
    }

    const targetUnitsPerCase = targetStock.unitsPerCase || targetStock.unites_par_caisse || 12;
    const unitsAdded = cases * targetUnitsPerCase;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      await addStockReception({
        establishmentId,
        stockId: targetStock.id,
        productName: targetStock.name,
        volume: targetStock.volume || '66cl',
        casesCount: cases,
        unitsPerCase: targetUnitsPerCase,
        unitsAdded,
        registeredBy: currentUser?.id || 'gerant',
        registeredByName: currentUser?.name || 'Gérant'
      });

      setSuccessMsg(`Réception enregistrée : +${cases} caisses (+${unitsAdded} un.) pour "${targetStock.name}".`);
      setShowReceptionModal(false);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de la réception du stock.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Inventory Audit Modal
  const handleOpenInventory = (stockIdTarget?: string) => {
    if (estStocks.length === 0) {
      setErrorMsg("Veuillez d'abord ajouter au moins une boisson au catalogue.");
      return;
    }
    const targetId = stockIdTarget || estStocks[0]?.id || '';
    const selectedItem = estStocks.find(s => s.id === targetId);
    setInventoryStockId(targetId);
    setPhysicalCountUnits(selectedItem ? selectedItem.quantity.toString() : '0');
    setAutoAdjustStock(true);
    setInventoryNote('');
    setShowInventoryModal(true);
  };

  // Submit Inventory Audit & Theft Detection (Gérant only)
  const handleSaveInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStock = estStocks.find(s => s.id === inventoryStockId);
    if (!targetStock) {
      setErrorMsg("Veuillez sélectionner une boisson à auditer.");
      return;
    }

    const counted = parseInt(physicalCountUnits || '0');
    if (isNaN(counted) || counted < 0) {
      setErrorMsg("Le stock physique compté doit être un nombre positif ou nul.");
      return;
    }

    const stockTheorique = targetStock.quantity;
    const ecart = counted - stockTheorique;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      await addStockInventory({
        establishmentId,
        stockId: targetStock.id,
        productName: targetStock.name,
        volume: targetStock.volume || '66cl',
        stockTheorique,
        stockPhysiqueCompte: counted,
        ecart,
        realisePar: currentUser?.id || 'gerant',
        realiseByName: currentUser?.name || 'Gérant',
        adjusted: autoAdjustStock,
        note: inventoryNote.trim()
      });

      if (ecart < 0) {
        setSuccessMsg(`Inventaire enregistré : Écart de ${ecart} bouteille(s) [PERTE DETECTEE]. ${autoAdjustStock ? 'Stock ajusté.' : ''}`);
      } else if (ecart === 0) {
        setSuccessMsg(`Inventaire enregistré : Stock parfaitement conforme (${counted} un.).`);
      } else {
        setSuccessMsg(`Inventaire enregistré : Surplus de +${ecart} bouteille(s). ${autoAdjustStock ? 'Stock ajusté.' : ''}`);
      }

      setShowInventoryModal(false);
      setTimeout(() => setSuccessMsg(null), 4500);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'enregistrement de l'inventaire.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Drink Handler
  const handleDeleteStock = async (id: string, name: string) => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await deleteStockItem(id);
      setSuccessMsg(`Boisson "${name}" supprimée du catalogue.`);
      setDeletingStockId(null);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de la suppression de l'article.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} F CFA`;
  };

  // Currently selected drink in reception modal
  const selectedReceptionStock = useMemo(() => {
    return estStocks.find(s => s.id === receptionStockId) || null;
  }, [estStocks, receptionStockId]);

  // Currently selected drink in inventory modal
  const selectedInventoryStock = useMemo(() => {
    return estStocks.find(s => s.id === inventoryStockId) || null;
  }, [estStocks, inventoryStockId]);

  // Calculated variance for inventory modal
  const computedInventoryEcart = useMemo(() => {
    if (!selectedInventoryStock) return 0;
    const counted = parseInt(physicalCountUnits || '0');
    if (isNaN(counted)) return 0;
    return counted - selectedInventoryStock.quantity;
  }, [selectedInventoryStock, physicalCountUnits]);

  return (
    <div className="space-y-5" id="stock-manager-view-root">
      
      {/* HEADER BAR & PERMISSION BADGE */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-black text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              Gestion des Stocks & Inventaire
            </h3>
            {isGerantUser ? (
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-200 dark:border-emerald-900">
                <Sparkles className="w-3 h-3" /> Mode Gérant
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-amber-200 dark:border-amber-900">
                <Lock className="w-3 h-3" /> Mode Caissier (Lecture seule)
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Suivi automatique des bouteilles, réceptions en caisses et comptage physique anti-vol.
          </p>
        </div>

        {/* GERANT TOOLBAR BUTTONS */}
        {isGerantUser ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenAddDrink}
              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" /> Nouvelle Boisson
            </button>
            <button
              onClick={() => handleOpenReception()}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Boxes className="w-4 h-4" /> Réceptionner (Caisses)
            </button>
            <button
              onClick={() => handleOpenInventory()}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <ShieldAlert className="w-4 h-4" /> Audit / Vol
            </button>
            <button
              onClick={() => setShowHistoryModal(true)}
              className="px-3.5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <History className="w-4 h-4" /> Historique
            </button>
          </div>
        ) : (
          <div className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-900/40 flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Consultation du stock uniquement. Saisie des ventes dans le POS.</span>
          </div>
        )}
      </div>

      {/* ALERT NOTIFICATIONS */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 rounded-2xl text-xs font-bold text-red-700 dark:text-red-400 flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="p-1 hover:bg-red-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="p-1 hover:bg-emerald-100 rounded-lg">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* METRICS SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-4 rounded-2xl">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Total Références</span>
          <span className="text-xl font-black text-gray-900 dark:text-white mt-0.5 block">{estStocks.length} boissons</span>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-4 rounded-2xl">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Stock Total Disponible</span>
          <span className="text-xl font-black text-orange-600 dark:text-orange-400 mt-0.5 block">
            {totalUnitsInStock} un.
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${lowStockCount > 0 ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50' : 'bg-white dark:bg-gray-900 border-gray-150 dark:border-gray-800'}`}>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Stock Faible (≤ 5 un.)</span>
          <span className={`text-xl font-black mt-0.5 block ${lowStockCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
            {lowStockCount} article{lowStockCount > 1 ? 's' : ''}
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${outOfStockCount > 0 ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50' : 'bg-white dark:bg-gray-900 border-gray-150 dark:border-gray-800'}`}>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">En Rupture</span>
          <span className={`text-xl font-black mt-0.5 block ${outOfStockCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
            {outOfStockCount} article{outOfStockCount > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* SEARCH AND TABLE */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une boisson (Brakina, Beaufort, 66cl...)"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500 dark:text-white"
            />
          </div>

          <div className="text-xs font-bold text-gray-500 dark:text-gray-400">
            {filteredStocks.length} / {estStocks.length} produit(s) affiché(s)
          </div>
        </div>

        {/* STOCK TABLE */}
        {filteredStocks.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-950/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
            <Package className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
              {searchQuery ? "Aucune boisson ne correspond à votre recherche." : "Aucune boisson enregistrée dans l'inventaire."}
            </p>
            {isGerantUser && !searchQuery && (
              <button
                onClick={handleOpenAddDrink}
                className="mt-3 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Ajouter une première boisson
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-150 dark:border-gray-800 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Boisson & Contenance</th>
                  <th className="py-3 px-3 text-center">Unité / Caisse</th>
                  <th className="py-3 px-3">Prix Unitaire</th>
                  <th className="py-3 px-3">Stock Disponible</th>
                  <th className="py-3 px-3 text-center">Statut</th>
                  {isGerantUser && <th className="py-3 px-3 text-right">Actions Gérant</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60">
                {filteredStocks.map(drink => {
                  const unitsPerCaseVal = drink.unitsPerCase || drink.unites_par_caisse || 12;
                  const isOutOfStock = drink.quantity <= 0;
                  const isLowStock = drink.quantity > 0 && drink.quantity <= 5;
                  const breakdownText = formatStockBreakdown(drink.quantity, unitsPerCaseVal);

                  return (
                    <tr key={drink.id} className="hover:bg-gray-50/60 dark:hover:bg-gray-950/40 transition-colors">
                      {/* Name & Volume */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center font-black text-xs shrink-0">
                            🍺
                          </div>
                          <div>
                            <span className="font-black text-gray-900 dark:text-white block text-xs">
                              {drink.name}
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">
                              Format : {drink.volume || '66cl'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Units per case config */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-[10px] font-black">
                          {unitsPerCaseVal} un. / caisse
                        </span>
                      </td>

                      {/* Unit selling price */}
                      <td className="py-3.5 px-3 font-black text-gray-900 dark:text-white">
                        {formatPrice(drink.price)}
                      </td>

                      {/* Available stock with breakdown */}
                      <td className="py-3.5 px-3">
                        <div>
                          <span className={`font-black text-xs block ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                            {breakdownText}
                          </span>
                          <span className="text-[10px] text-gray-400 font-bold block">
                            ({drink.quantity} bouteilles au total)
                          </span>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                          isOutOfStock 
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' 
                            : isLowStock 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' 
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                        }`}>
                          {isOutOfStock ? "Rupture" : isLowStock ? "Stock Faible" : "En Stock"}
                        </span>
                      </td>

                      {/* Gérant Actions */}
                      {isGerantUser && (
                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenReception(drink.id)}
                              title="Réceptionner du stock en caisses"
                              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Boxes className="w-3 h-3" /> +Caisses
                            </button>

                            <button
                              onClick={() => handleOpenInventory(drink.id)}
                              title="Faire un inventaire physique / Détecter les vols"
                              className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/30 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <ShieldAlert className="w-3 h-3" /> Audit
                            </button>

                            <button
                              onClick={() => handleOpenEditDrink(drink)}
                              title="Modifier la boisson"
                              className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setDeletingStockId(drink.id)}
                              title="Supprimer la boisson"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 1: ADD / EDIT DRINK CATALOGUE (Gérant Only)                      */}
      {/* ---------------------------------------------------------------------- */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-150 dark:border-gray-800 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-orange-600" />
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    {editingStockId ? "Modifier la Fiche Boisson" : "Ajouter une Nouvelle Boisson"}
                  </h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSaveDrink} className="space-y-4 text-xs">
                {/* Drink Name */}
                <div>
                  <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                    Nom de la Boisson *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Brakina, Beaufort, Flag, Guiness, Sobambo"
                    value={drinkName}
                    onChange={e => setDrinkName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-bold dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Volume & Format */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                      Contenance / Format *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: 66cl, 33cl, 50cl, Canette 33cl"
                      value={drinkVolume}
                      onChange={e => setDrinkVolume(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-bold dark:text-white focus:outline-none focus:border-orange-500"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {['66cl', '33cl', '50cl', 'Canette 33cl', 'Bouteille 1L'].map(v => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => {
                            setDrinkVolume(v);
                            if (v.includes('33cl')) setUnitsPerCase(24);
                            if (v.includes('66cl')) setUnitsPerCase(12);
                          }}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 hover:bg-orange-100 text-gray-700 dark:text-gray-300 rounded text-[9px] font-bold"
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                      Unités par Caisse *
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      placeholder="ex: 12 ou 24"
                      value={unitsPerCase}
                      onChange={e => setUnitsPerCase(parseInt(e.target.value) || 12)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-bold dark:text-white focus:outline-none focus:border-orange-500"
                    />
                    <span className="text-[10px] text-gray-400 mt-1 block">
                      ex: 12 pour 66cl, 24 pour 33cl
                    </span>
                  </div>
                </div>

                {/* Unit Price */}
                <div>
                  <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                    Prix de Vente Unitaire (F CFA) *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    placeholder="ex: 1000"
                    value={drinkPrice}
                    onChange={e => setDrinkPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-bold dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Initial Stock Input */}
                <div className="bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 p-3.5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-black text-orange-900 dark:text-orange-300">
                      Stock Initial
                    </label>
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-900 p-0.5 rounded-lg border border-orange-200 dark:border-orange-900/40">
                      <button
                        type="button"
                        onClick={() => setInitInputType('cases')}
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${initInputType === 'cases' ? 'bg-orange-600 text-white' : 'text-gray-500'}`}
                      >
                        En Caisses
                      </button>
                      <button
                        type="button"
                        onClick={() => setInitInputType('units')}
                        className={`px-2 py-0.5 rounded text-[10px] font-black ${initInputType === 'units' ? 'bg-orange-600 text-white' : 'text-gray-500'}`}
                      >
                        En Bouteilles
                      </button>
                    </div>
                  </div>

                  <input
                    type="number"
                    min={0}
                    value={initQtyVal}
                    onChange={e => setInitQtyVal(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-950 border border-orange-200 dark:border-orange-900 rounded-xl font-black text-gray-900 dark:text-white"
                  />

                  <p className="text-[10px] font-bold text-orange-800 dark:text-orange-300">
                    {initInputType === 'cases' ? (
                      `Calcul automatique : ${parseInt(initQtyVal || '0') * unitsPerCase} bouteilles au total (${initQtyVal || 0} caisses × ${unitsPerCase} un.)`
                    ) : (
                      `Équivalent : ${formatStockBreakdown(parseInt(initQtyVal || '0'), unitsPerCase)}`
                    )}
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-xl font-bold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Enregistrement..." : editingStockId ? "Enregistrer les modifications" : "Ajouter la boisson"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 2: STOCK RECEPTION IN CASES (Gérant Only)                       */}
      {/* ---------------------------------------------------------------------- */}
      <AnimatePresence>
        {showReceptionModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-150 dark:border-gray-800 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    Réceptionner du Stock (En Caisses)
                  </h3>
                </div>
                <button onClick={() => setShowReceptionModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSaveReception} className="space-y-4 text-xs">
                {/* Select Drink */}
                <div>
                  <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                    Sélectionner la Boisson Réceptionnée *
                  </label>
                  <select
                    value={receptionStockId}
                    onChange={e => setReceptionStockId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-bold dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    {estStocks.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.volume || '66cl'}) — Stock actuel : {s.quantity} un.
                      </option>
                    ))}
                  </select>
                </div>

                {/* Input Cases Count */}
                <div>
                  <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                    Nombre de Caisses Reçues *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={receptionCasesCount}
                    onChange={e => setReceptionCasesCount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-black text-lg text-amber-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Real-time conversion preview */}
                {selectedReceptionStock && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4 rounded-2xl space-y-1.5">
                    <span className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
                      Aperçu de la Conversion Automatique
                    </span>

                    <div className="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200">
                      <span>Caisses saisies :</span>
                      <span className="font-black text-amber-700 dark:text-amber-300">
                        {receptionCasesCount || 0} caisse(s)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200">
                      <span>Configuration produit :</span>
                      <span>{selectedReceptionStock.unitsPerCase || 12} bouteilles / caisse</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-black text-emerald-600 dark:text-emerald-400 pt-1 border-t border-amber-200 dark:border-amber-900/40">
                      <span>Bouteilles ajoutées au stock :</span>
                      <span>+{(parseInt(receptionCasesCount || '0') || 0) * (selectedReceptionStock.unitsPerCase || 12)} un.</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-black text-gray-900 dark:text-white pt-1">
                      <span>Nouveau stock théorique total :</span>
                      <span>
                        {selectedReceptionStock.quantity + ((parseInt(receptionCasesCount || '0') || 0) * (selectedReceptionStock.unitsPerCase || 12))} un. ({formatStockBreakdown(selectedReceptionStock.quantity + ((parseInt(receptionCasesCount || '0') || 0) * (selectedReceptionStock.unitsPerCase || 12)), selectedReceptionStock.unitsPerCase)})
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReceptionModal(false)}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-xl font-bold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Enregistrement..." : "Valider la Réception"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 3: INVENTORY AUDIT & THEFT DETECTION (Gérant Only)               */}
      {/* ---------------------------------------------------------------------- */}
      <AnimatePresence>
        {showInventoryModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-150 dark:border-gray-800 space-y-5"
            >
              <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    Faire un Inventaire & Détecter les Écarts (Vols/Pertes)
                  </h3>
                </div>
                <button onClick={() => setShowInventoryModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSaveInventory} className="space-y-4 text-xs">
                {/* Select Drink */}
                <div>
                  <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                    Boisson à Auditer *
                  </label>
                  <select
                    value={inventoryStockId}
                    onChange={e => {
                      const id = e.target.value;
                      setInventoryStockId(id);
                      const selected = estStocks.find(s => s.id === id);
                      if (selected) {
                        setPhysicalCountUnits(selected.quantity.toString());
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-bold dark:text-white focus:outline-none focus:border-indigo-500"
                  >
                    {estStocks.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.volume || '66cl'}) — Théorique : {s.quantity} un.
                      </option>
                    ))}
                  </select>
                </div>

                {/* Physical Count Field */}
                <div>
                  <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                    Stock Physique Réellement Compté (en bouteilles / unités) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={physicalCountUnits}
                    onChange={e => setPhysicalCountUnits(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-black text-lg text-indigo-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Variance Real-Time Result */}
                {selectedInventoryStock && (
                  <div className={`p-4 rounded-2xl border space-y-2 ${
                    computedInventoryEcart < 0
                      ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900/50'
                      : computedInventoryEcart === 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50'
                      : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50'
                  }`}>
                    <div className="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200">
                      <span>Stock Théorique (Caisse / POS) :</span>
                      <span className="font-black">{selectedInventoryStock.quantity} bouteilles</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200">
                      <span>Stock Physique Compté :</span>
                      <span className="font-black">{physicalCountUnits || 0} bouteilles</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-black pt-2 border-t border-gray-200/60 dark:border-gray-800">
                      <span>Écart de Stock :</span>
                      <span className={`text-sm ${
                        computedInventoryEcart < 0
                          ? 'text-red-600 dark:text-red-400'
                          : computedInventoryEcart === 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {computedInventoryEcart > 0 ? `+${computedInventoryEcart}` : computedInventoryEcart} bouteille(s)
                      </span>
                    </div>

                    {/* Verdict Message */}
                    {computedInventoryEcart < 0 && (
                      <p className="text-[11px] font-black text-red-700 dark:text-red-400 mt-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>⚠️ PERTE / VOL POTENTIEL DE {Math.abs(computedInventoryEcart)} BOUTEILLE(S) !</span>
                      </p>
                    )}

                    {computedInventoryEcart === 0 && (
                      <p className="text-[11px] font-black text-emerald-700 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>✅ Stock théorique et comptage physique parfaitement conformes.</span>
                      </p>
                    )}

                    {computedInventoryEcart > 0 && (
                      <p className="text-[11px] font-black text-blue-700 dark:text-blue-400 mt-1">
                        ℹ️ Surplus de +{computedInventoryEcart} bouteille(s) détecté.
                      </p>
                    )}
                  </div>
                )}

                {/* Adjust Stock Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="auto-adjust"
                    checked={autoAdjustStock}
                    onChange={e => setAutoAdjustStock(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <label htmlFor="auto-adjust" className="font-bold text-gray-800 dark:text-gray-200 cursor-pointer">
                    Ajuster automatiquement le stock théorique de la caisse à la valeur comptée ({physicalCountUnits || 0} un.)
                  </label>
                </div>

                {/* Comment / Note */}
                <div>
                  <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                    Note ou justification (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Bouteilles cassées lors du service, offerts non saisis..."
                    value={inventoryNote}
                    onChange={e => setInventoryNote(e.target.value)}
                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-medium dark:text-white"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInventoryModal(false)}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-xl font-bold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Validation..." : "Valider l'Inventaire"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 4: HISTORY OF RECEPTIONS & INVENTORIES (Gérant Only)             */}
      {/* ---------------------------------------------------------------------- */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-gray-150 dark:border-gray-800 space-y-4 max-h-[85vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    Historique des Réceptions & Inventaires
                  </h3>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Sub-tab selection */}
              <div className="flex items-center gap-2 border-b border-gray-150 dark:border-gray-800 pb-2 shrink-0">
                <button
                  onClick={() => setHistoryTab('receptions')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors ${historyTab === 'receptions' ? 'bg-amber-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                >
                  📦 Réceptions en Caisses ({estReceptions.length})
                </button>
                <button
                  onClick={() => setHistoryTab('inventaires')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-colors ${historyTab === 'inventaires' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}
                >
                  🔍 Audits & Écarts ({estInventaires.length})
                </button>
              </div>

              {/* Tab 1: Receptions */}
              <div className="overflow-y-auto flex-1 pr-1 space-y-2">
                {historyTab === 'receptions' && (
                  estReceptions.length === 0 ? (
                    <div className="text-center py-8 text-xs text-gray-400">
                      Aucune réception de stock enregistrée.
                    </div>
                  ) : (
                    estReceptions.map(r => (
                      <div key={r.id} className="p-3 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-gray-900 dark:text-white">{r.productName} ({r.volume || '66cl'})</span>
                            <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded font-black text-[10px]">
                              +{r.casesCount} caisses (+{r.unitsAdded} un.)
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            Saisi par {r.registeredByName || 'Gérant'} • {new Date(r.date).toLocaleString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    ))
                  )
                )}

                {/* Tab 2: Inventories */}
                {historyTab === 'inventaires' && (
                  estInventaires.length === 0 ? (
                    <div className="text-center py-8 text-xs text-gray-400">
                      Aucun inventaire physique enregistré.
                    </div>
                  ) : (
                    estInventaires.map(i => (
                      <div key={i.id} className={`p-3 border rounded-2xl flex flex-col gap-1 text-xs ${
                        i.ecart < 0 
                          ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900/40' 
                          : i.ecart === 0 
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40' 
                          : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="font-black text-gray-900 dark:text-white">{i.productName} ({i.volume || '66cl'})</span>
                          <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                            i.ecart < 0 ? 'bg-red-100 text-red-700 dark:bg-red-950' : i.ecart === 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950' : 'bg-blue-100 text-blue-800 dark:bg-blue-950'
                          }`}>
                            {i.ecart < 0 ? `⚠️ Écart : ${i.ecart} un. (PERTE/VOL)` : i.ecart === 0 ? '✅ Conforme (0)' : `Surplus : +${i.ecart}`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-300 font-bold">
                          <span>Stock Théorique : {i.stockTheorique} un.</span>
                          <span>Compté Réel : {i.stockPhysiqueCompte} un.</span>
                        </div>

                        {i.note && (
                          <p className="text-[10px] italic text-gray-500 bg-white/60 dark:bg-gray-900/60 p-1.5 rounded-lg border border-gray-200/50 dark:border-gray-800">
                            "{i.note}"
                          </p>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1 border-t border-gray-200/40 dark:border-gray-800">
                          <span>Audit par {i.realiseByName || 'Gérant'} • {new Date(i.date).toLocaleString('fr-FR')}</span>
                          <span>{i.adjusted ? "Stock réajusté" : "Non réajusté"}</span>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>

              <div className="pt-2 border-t border-gray-150 dark:border-gray-800 flex justify-end shrink-0">
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------------------- */}
      {/* DELETION CONFIRMATION DIALOG                                           */}
      {/* ---------------------------------------------------------------------- */}
      {deletingStockId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-gray-150 dark:border-gray-800 space-y-4">
            <h4 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide">
              Confirmer la suppression
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              Voulez-vous vraiment supprimer cette boisson du catalogue de l'établissement ?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingStockId(null)}
                className="px-3.5 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  const item = estStocks.find(s => s.id === deletingStockId);
                  if (item) handleDeleteStock(item.id, item.name);
                }}
                disabled={isSubmitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
