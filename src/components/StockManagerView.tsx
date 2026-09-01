import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { StockItem } from '../types';
import { 
  Package, Plus, AlertTriangle, CheckCircle, 
  Search, Edit2, Check, X, RefreshCw, Trash2, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StockManagerViewProps {
  establishmentId: string;
}

export function StockManagerView({ establishmentId }: StockManagerViewProps) {
  const { stocks, addStockItem, updateStockItem, deleteStockItem } = useAppStore();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDrinkName, setNewDrinkName] = useState('');
  const [newDrinkPrice, setNewDrinkPrice] = useState('');
  const [newDrinkQty, setNewDrinkQty] = useState('');

  // Editing stocks state
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [editNameVal, setEditNameVal] = useState('');
  const [editPriceVal, setEditPriceVal] = useState('');
  const [restockQtyVal, setRestockQtyVal] = useState('');

  // Deletion confirmation
  const [deletingStockId, setDeletingStockId] = useState<string | null>(null);

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

  // Statistics
  const lowStockCount = useMemo(() => {
    return estStocks.filter(d => d.quantity > 0 && d.quantity <= 5).length;
  }, [estStocks]);

  const outOfStockCount = useMemo(() => {
    return estStocks.filter(d => d.quantity <= 0).length;
  }, [estStocks]);

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
      setErrorMsg("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const price = parseFloat(newDrinkPrice);
    const qty = parseInt(newDrinkQty);

    if (isNaN(price) || price <= 0) {
      setErrorMsg("Le prix de vente doit être supérieur à 0 F CFA.");
      return;
    }
    if (isNaN(qty) || qty < 0) {
      setErrorMsg("La quantité doit être positive ou nulle.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      
      const stock_faible = qty <= 5;

      await addStockItem({
        establishmentId,
        name: newDrinkName.trim(),
        price,
        quantity: qty,
        stock_faible
      } as any);

      setSuccessMsg(`"${newDrinkName}" ajouté avec succès au catalogue.`);
      setNewDrinkName('');
      setNewDrinkPrice('');
      setNewDrinkQty('');
      setShowAddForm(false);
      
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'ajout de la boisson.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Restock helper
  const handleQuickRestock = async (drink: StockItem, amountToAdd: number) => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const finalQty = Math.max(0, drink.quantity + amountToAdd);
      const stock_faible = finalQty <= 5;
      
      await updateStockItem(drink.id, {
        quantity: finalQty,
        stock_faible
      } as any);

      setSuccessMsg(`+${amountToAdd} ajouté(s) à "${drink.name}". Nouveau stock : ${finalQty}.`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors du réapprovisionnement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle detailed editing
  const handleUpdateStock = async (id: string) => {
    const item = estStocks.find(s => s.id === id);
    if (!item) return;

    const price = editPriceVal ? parseFloat(editPriceVal) : item.price;
    const restock = restockQtyVal ? parseInt(restockQtyVal) : 0;
    const name = editNameVal.trim() || item.name;

    if (isNaN(price) || price <= 0) {
      setErrorMsg("Le prix de vente doit être supérieur à 0 F CFA.");
      return;
    }
    if (isNaN(restock) || restock < 0) {
      setErrorMsg("La quantité de réapprovisionnement doit être positive ou nulle.");
      return;
    }

    const finalQty = item.quantity + restock;
    const stock_faible = finalQty <= 5;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await updateStockItem(id, {
        name,
        price,
        quantity: finalQty,
        stock_faible
      } as any);

      setSuccessMsg(`Article "${name}" mis à jour avec succès.`);
      setEditingStockId(null);
      setEditNameVal('');
      setEditPriceVal('');
      setRestockQtyVal('');

      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de la mise à jour.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteStock = async (id: string, name: string) => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await deleteStockItem(id);
      setSuccessMsg(`Article "${name}" supprimé de l'inventaire.`);
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

  return (
    <div className="space-y-5" id="stock-manager-view-root">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-500" />
            Inventaire & Stock ({estStocks.length} articles)
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Ajoutez de nouvelles boissons, modifiez les tarifs et effectuez des réapprovisionnements rapides.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all shadow-sm self-start sm:self-center"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showAddForm ? "Fermer" : "Nouvelle boisson"}
        </button>
      </div>

      {/* Low Stock Alerts Banner if needed */}
      {(lowStockCount > 0 || outOfStockCount > 0) && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>
              Alerte réapprovisionnement : {outOfStockCount > 0 && <span className="text-red-600 dark:text-red-400 mr-2 font-black">{outOfStockCount} en rupture</span>}
              {lowStockCount > 0 && <span className="text-amber-700 dark:text-amber-300 font-black">{lowStockCount} en stock faible (≤ 5 restants)</span>}
            </span>
          </div>
        </div>
      )}

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
            <span>{errorMsg}</span>
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
            <span>{successMsg}</span>
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
            <h4 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Ajouter une boisson au catalogue</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase">Nom de la boisson *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Beaufort, Guinness, Coca..."
                  value={newDrinkName}
                  onChange={e => setNewDrinkName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/20 text-gray-900 dark:text-white"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-500 uppercase">Prix de vente unitaire (F CFA) *</label>
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
                <label className="text-[10px] font-black text-gray-500 uppercase">Quantité initiale en stock *</label>
                <input
                  type="number"
                  required
                  placeholder="Ex: 24"
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
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black uppercase active:scale-95 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? "Enregistrement..." : "Créer l'article"}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Inventory Control Toolbar */}
      <div className="flex items-center gap-3 bg-white dark:bg-gray-900 px-4 py-3 border border-gray-150 dark:border-gray-800 rounded-2xl">
        <Search className="w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher une boisson dans l'inventaire..."
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

      {/* Stock Table List */}
      {filteredStocks.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <Package className="w-10 h-10 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
          <p className="text-xs font-bold text-gray-400 dark:text-gray-500">Aucune boisson trouvée dans le stock.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-950 border-b border-gray-150 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-4 px-5">Boisson</th>
                  <th className="py-4 px-5">Prix unitaire</th>
                  <th className="py-4 px-5">Stock disponible</th>
                  <th className="py-4 px-5">Statut</th>
                  <th className="py-4 px-5">Réappro rapide</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200">
                {filteredStocks.map(drink => {
                  const isEditing = editingStockId === drink.id;
                  const isOutOfStock = drink.quantity <= 0;
                  const isLowStock = drink.quantity > 0 && drink.quantity <= 5;

                  return (
                    <tr key={drink.id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-950/30 transition-colors ${isLowStock ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''}`}>
                      <td className="py-4 px-5">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editNameVal}
                            onChange={e => setEditNameVal(e.target.value)}
                            className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg text-xs font-bold text-gray-900 dark:text-white outline-none w-36"
                          />
                        ) : (
                          <span className="font-black text-gray-900 dark:text-white">{drink.name}</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        {isEditing ? (
                          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 w-28">
                            <input
                              type="number"
                              placeholder={drink.price.toString()}
                              value={editPriceVal}
                              onChange={e => setEditPriceVal(e.target.value)}
                              className="w-full text-xs outline-none bg-transparent font-bold text-gray-900 dark:text-white"
                            />
                            <span className="text-[9px] text-gray-400">F</span>
                          </div>
                        ) : (
                          <span className="text-orange-600 dark:text-orange-400 font-extrabold">{formatPrice(drink.price)}</span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-400 dark:text-gray-500">{drink.quantity}</span>
                            <span className="text-gray-400 font-black">+</span>
                            <input
                              type="number"
                              placeholder="Ajout"
                              value={restockQtyVal}
                              onChange={e => setRestockQtyVal(e.target.value)}
                              className="w-16 px-2 py-1 bg-gray-50 dark:bg-gray-950 border border-gray-300 dark:border-gray-700 rounded-lg text-xs outline-none font-bold text-gray-900 dark:text-white"
                            />
                          </div>
                        ) : (
                          <span className={`text-sm font-black ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                            {drink.quantity} {drink.quantity > 1 ? 'unités' : 'unité'}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5">
                        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md ${
                          isOutOfStock 
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-black' 
                            : isLowStock 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 animate-pulse'
                            : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        }`}>
                          {isOutOfStock ? "Rupture" : isLowStock ? "Stock Faible (≤ 5)" : "En Stock"}
                        </span>
                      </td>

                      {/* Quick Restock Casier Buttons */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleQuickRestock(drink, 6)}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[10px] font-black cursor-pointer transition-all active:scale-95"
                            title="Ajouter 6 bouteilles"
                          >
                            +6
                          </button>
                          <button
                            onClick={() => handleQuickRestock(drink, 12)}
                            className="px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-[10px] font-black cursor-pointer transition-all active:scale-95"
                            title="Ajouter 12 bouteilles (1/2 casier)"
                          >
                            +12
                          </button>
                          <button
                            onClick={() => handleQuickRestock(drink, 24)}
                            className="px-2 py-1 bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-900/40 text-orange-700 dark:text-orange-300 rounded text-[10px] font-black cursor-pointer transition-all active:scale-95"
                            title="Ajouter 24 bouteilles (1 casier complet)"
                          >
                            +24 (Casier)
                          </button>
                        </div>
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
                              onClick={() => { setEditingStockId(null); setEditNameVal(''); setEditPriceVal(''); setRestockQtyVal(''); }}
                              className="p-1.5 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-750 cursor-pointer"
                              title="Annuler"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => { 
                                setEditingStockId(drink.id); 
                                setEditNameVal(drink.name);
                                setEditPriceVal(drink.price.toString()); 
                                setRestockQtyVal(''); 
                              }}
                              className="p-2 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-900/30 cursor-pointer inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider"
                              title="Modifier"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Modifier
                            </button>
                            <button
                              onClick={() => setDeletingStockId(drink.id)}
                              className="p-2 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 cursor-pointer inline-flex items-center"
                              title="Supprimer l'article"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingStockId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-2xl">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-black text-gray-900 dark:text-white">Confirmer la suppression</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Cette action est irréversible.</p>
                </div>
              </div>

              {(() => {
                const item = estStocks.find(s => s.id === deletingStockId);
                return (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Êtes-vous sûr de vouloir supprimer <span className="font-bold text-gray-900 dark:text-white">"{item?.name || 'cet article'}"</span> de l'inventaire ?
                  </p>
                );
              })()}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingStockId(null)}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-black uppercase text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-all"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const item = estStocks.find(s => s.id === deletingStockId);
                    if (item) handleDeleteStock(item.id, item.name);
                  }}
                  disabled={isSubmitting}
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider cursor-pointer shadow-lg shadow-red-600/20 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
