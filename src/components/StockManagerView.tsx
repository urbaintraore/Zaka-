import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { StockItem } from '../types';
import { 
  Package, Plus, AlertTriangle, CheckCircle, 
  Search, Edit2, Check, X, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StockManagerViewProps {
  establishmentId: string;
}

export function StockManagerView({ establishmentId }: StockManagerViewProps) {
  const { stocks, addStockItem, updateStockItem } = useAppStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDrinkName, setNewDrinkName] = useState('');
  const [newDrinkPrice, setNewDrinkPrice] = useState('');
  const [newDrinkQty, setNewDrinkQty] = useState('');

  // Editing stocks state
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editPriceVal, setEditPriceVal] = useState('');
  const [restockQtyVal, setRestockQtyVal] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Alerts
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter stocks for this establishment
  const estStocks = useMemo(() => {
    return stocks.filter(item => item.establishmentId === establishmentId);
  }, [stocks, establishmentId]);

  // Filtered list by search query
  const filteredStocks = useMemo(() => {
    return estStocks.filter(drink => 
      drink.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [estStocks, searchQuery]);

  // Handle drink addition
  const handleAddDrink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrinkName.trim() || !newDrinkPrice || !newDrinkQty) {
      setErrorMsg("Veuillez remplir tous les champs.");
      return;
    }

    const price = parseFloat(newDrinkPrice);
    const qty = parseInt(newDrinkQty);

    if (isNaN(price) || price <= 0) {
      setErrorMsg("Le prix doit être un nombre supérieur à 0.");
      return;
    }
    if (isNaN(qty) || qty < 0) {
      setErrorMsg("La quantité doit être supérieure ou égale à 0.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      
      // stock_faible is true if quantity < 10
      const stock_faible = qty < 10;

      await addStockItem({
        establishmentId,
        name: newDrinkName.trim(),
        price,
        quantity: qty,
        stock_faible
      } as any);

      setSuccessMsg(`"${newDrinkName}" ajouté avec succès.`);
      setNewDrinkName('');
      setNewDrinkPrice('');
      setNewDrinkQty('');
      setShowAddForm(false);
      
      // Auto-clear success message after 3s
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'ajout de la boisson.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle restocking or price modification
  const handleUpdateStock = async (id: string) => {
    const price = editPriceVal ? parseFloat(editPriceVal) : undefined;
    const restock = restockQtyVal ? parseInt(restockQtyVal) : 0;

    if (price !== undefined && (isNaN(price) || price <= 0)) {
      setErrorMsg("Le prix doit être un nombre supérieur à 0.");
      return;
    }
    if (isNaN(restock) || restock < 0) {
      setErrorMsg("La quantité de réapprovisionnement doit être positive.");
      return;
    }

    const item = estStocks.find(s => s.id === id);
    if (!item) return;

    const finalPrice = price !== undefined ? price : item.price;
    const finalQty = item.quantity + restock;
    const stock_faible = finalQty < 10;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await updateStockItem(id, {
        price: finalPrice,
        quantity: finalQty,
        stock_faible
      } as any);

      setSuccessMsg(`Stock de "${item.name}" mis à jour.`);
      setEditingStockId(null);
      setEditPriceVal('');
      setRestockQtyVal('');

      // Auto-clear success message after 3s
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de la mise à jour du stock.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} F CFA`;
  };

  return (
    <div className="space-y-6" id="stock-manager-view-root">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            Gestion des Stocks ({estStocks.length} articles)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Ajoutez de nouvelles boissons, modifiez les prix et réapprovisionnez l'inventaire en temps réel.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-sm self-start sm:self-center"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? "Fermer" : "Nouvelle boisson"}
        </button>
      </div>

      {/* Global Alerts */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 rounded-2xl text-xs font-bold flex items-center gap-2.5"
          >
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            {errorMsg}
            <button onClick={() => setErrorMsg(null)} className="ml-auto text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 text-green-700 dark:text-green-400 rounded-2xl text-xs font-bold flex items-center gap-2.5"
          >
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            {successMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Drink Form Panel */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleAddDrink} 
            className="p-5 bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 space-y-4 overflow-hidden shadow-sm"
          >
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Nouvelle Boisson</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase">Nom de la boisson</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Beaufort, Castel, Coca..."
                  value={newDrinkName}
                  onChange={e => setNewDrinkName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase">Prix de vente (F CFA)</label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 1000"
                  value={newDrinkPrice}
                  onChange={e => setNewDrinkPrice(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase">Quantité initiale</label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 48"
                  value={newDrinkQty}
                  onChange={e => setNewDrinkQty(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-250 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-orange-600 text-white rounded-xl text-xs font-black uppercase active:scale-95 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? "Enregistrement..." : "Créer l'article"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Inventory Control Toolbar */}
      <div className="flex items-center gap-3 bg-white dark:bg-gray-900 px-4 py-3 border border-gray-100 dark:border-gray-850 rounded-2xl">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une boisson dans l'inventaire..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 text-xs font-semibold outline-none bg-transparent text-gray-900 dark:text-white"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 text-xs">
            Vider
          </button>
        )}
      </div>

      {/* Stock Table List */}
      {filteredStocks.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <Package className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500">Aucune boisson trouvée.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-450 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-4 px-5">Boisson</th>
                  <th className="py-4 px-5">Prix de vente</th>
                  <th className="py-4 px-5">Quantité en Stock</th>
                  <th className="py-4 px-5">Statut</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200">
                {filteredStocks.map(drink => {
                  const isEditing = editingStockId === drink.id;
                  const isOutOfStock = drink.quantity <= 0;
                  const isLowStock = drink.quantity > 0 && drink.quantity < 10;

                  return (
                    <tr key={drink.id} className={`hover:bg-gray-50/40 dark:hover:bg-gray-950/20 transition-colors ${isLowStock ? 'bg-amber-50/10 dark:bg-amber-950/5' : ''}`}>
                      <td className="py-4 px-5">
                        <span className="font-black text-gray-900 dark:text-white">{drink.name}</span>
                      </td>
                      <td className="py-4 px-5">
                        {isEditing ? (
                          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded px-2 py-1 w-28">
                            <input
                              type="number"
                              placeholder={drink.price.toString()}
                              value={editPriceVal}
                              onChange={e => setEditPriceVal(e.target.value)}
                              className="w-full text-xs outline-none bg-transparent font-bold text-gray-900 dark:text-white"
                            />
                            <span className="text-[9px] text-gray-450">FCFA</span>
                          </div>
                        ) : (
                          <span className="text-orange-600 font-extrabold">{formatPrice(drink.price)}</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-400 dark:text-gray-500">{drink.quantity}</span>
                            <span className="text-gray-400 font-black">+</span>
                            <input
                              type="number"
                              placeholder="Ajouter"
                              value={restockQtyVal}
                              onChange={e => setRestockQtyVal(e.target.value)}
                              className="w-16 px-2 py-1 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-800 rounded text-xs outline-none font-bold text-gray-900 dark:text-white"
                            />
                          </div>
                        ) : (
                          <span className={isOutOfStock ? 'text-red-500 font-extrabold' : ''}>{drink.quantity}</span>
                        )}
                      </td>
                      <td className="py-4 px-5">
                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md ${
                          isOutOfStock 
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' 
                            : isLowStock 
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 animate-pulse'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                        }`}>
                          {isOutOfStock ? "Rupture" : isLowStock ? "Stock Faible" : "En Stock"}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleUpdateStock(drink.id)}
                              className="p-1.5 bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/45 cursor-pointer"
                              title="Enregistrer"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setEditingStockId(null); setEditPriceVal(''); setRestockQtyVal(''); }}
                              className="p-1.5 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 cursor-pointer"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingStockId(drink.id); setEditPriceVal(drink.price.toString()); setRestockQtyVal(''); }}
                            className="p-2 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/30 cursor-pointer flex items-center gap-1.5 inline-flex text-[10px] font-black uppercase tracking-wider"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Modifier
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
