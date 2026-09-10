import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  RefreshCw,
  Edit2,
  Trash2,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  ShoppingBag,
  DollarSign,
  Boxes,
  Tag,
  Truck,
  History,
  X
} from 'lucide-react';
import {
  BeautySalon,
  BeautyProduct,
  BeautyStockMovement,
  BeautyProductCategory,
  BeautyStockMovementType
} from '../../types';
import {
  fetchBeautyProducts,
  saveBeautyProduct,
  deleteBeautyProduct,
  createBeautyStockMovement,
  fetchBeautyStockMovements,
  formatFcfa
} from '../../lib/beautyService';

interface BeautyStockViewProps {
  salon: BeautySalon;
  currentUser?: any;
}

export function BeautyStockView({ salon, currentUser }: BeautyStockViewProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'movements' | 'alerts'>('products');
  const [products, setProducts] = useState<BeautyProduct[]>([]);
  const [movements, setMovements] = useState<BeautyStockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedUsage, setSelectedUsage] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'alert' | 'out_of_stock'>('all');

  // Modal State for Product Add / Edit
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<BeautyProduct | null>(null);

  // Form State for Product
  const [nom, setNom] = useState('');
  const [categorie, setCategorie] = useState<BeautyProductCategory>('soins_capillaires');
  const [sku, setSku] = useState('');
  const [unite, setUnite] = useState('pièce');
  const [prixAchat, setPrixAchat] = useState<number>(0);
  const [prixVente, setPrixVente] = useState<number>(0);
  const [quantiteActuelle, setQuantiteActuelle] = useState<number>(0);
  const [quantiteMinimale, setQuantiteMinimale] = useState<number>(3);
  const [usageType, setUsageType] = useState<'revente' | 'interne' | 'mixte'>('revente');
  const [fournisseur, setFournisseur] = useState('');
  const [description, setDescription] = useState('');
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Modal State for Stock Movement (Entrée / Sortie manuelle)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementProduct, setMovementProduct] = useState<BeautyProduct | null>(null);
  const [movementType, setMovementType] = useState<BeautyStockMovementType>('entree');
  const [movementQty, setMovementQty] = useState<number>(1);
  const [movementCoutUnitaire, setMovementCoutUnitaire] = useState<number>(0);
  const [movementFournisseur, setMovementFournisseur] = useState('');
  const [movementMotif, setMovementMotif] = useState('');
  const [isSavingMovement, setIsSavingMovement] = useState(false);

  // Notifications
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prods, movs] = await Promise.all([
        fetchBeautyProducts(salon.id, false),
        fetchBeautyStockMovements(salon.id)
      ]);
      setProducts(prods);
      setMovements(movs);
    } catch (err) {
      console.warn('Erreur chargement stock:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [salon.id]);

  // Open Add Product Modal
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setNom('');
    setCategorie('soins_capillaires');
    setSku('');
    setUnite('pièce');
    setPrixAchat(0);
    setPrixVente(0);
    setQuantiteActuelle(0);
    setQuantiteMinimale(3);
    setUsageType('revente');
    setFournisseur('');
    setDescription('');
    setIsProductModalOpen(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (prod: BeautyProduct) => {
    setEditingProduct(prod);
    setNom(prod.nom);
    setCategorie(prod.categorie);
    setSku(prod.sku || '');
    setUnite(prod.unite || 'pièce');
    setPrixAchat(prod.prixAchat);
    setPrixVente(prod.prixVente);
    setQuantiteActuelle(prod.quantiteActuelle);
    setQuantiteMinimale(prod.quantiteMinimale);
    setUsageType(prod.usageType || 'revente');
    setFournisseur(prod.fournisseur || '');
    setDescription(prod.description || '');
    setIsProductModalOpen(true);
  };

  // Open Movement Modal
  const handleOpenMovementModal = (prod: BeautyProduct, defaultType: BeautyStockMovementType = 'entree') => {
    setMovementProduct(prod);
    setMovementType(defaultType);
    setMovementQty(1);
    setMovementCoutUnitaire(prod.prixAchat || 0);
    setMovementFournisseur(prod.fournisseur || '');
    setMovementMotif(defaultType === 'entree' ? 'Réapprovisionnement' : 'Utilisation interne / cabine');
    setIsMovementModalOpen(true);
  };

  // Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) {
      setFeedback({ type: 'error', text: 'Le nom du produit est requis.' });
      return;
    }

    setIsSavingProduct(true);
    try {
      await saveBeautyProduct({
        id: editingProduct?.id,
        salonId: salon.id,
        nom: nom.trim(),
        categorie,
        sku: sku.trim() || undefined,
        unite: unite.trim() || 'pièce',
        prixAchat: Number(prixAchat) || 0,
        prixVente: Number(prixVente) || 0,
        quantiteActuelle: Number(quantiteActuelle) || 0,
        quantiteMinimale: Number(quantiteMinimale) || 1,
        usageType,
        fournisseur: fournisseur.trim() || undefined,
        description: description.trim() || undefined,
        actif: true
      });

      await loadData();
      setIsProductModalOpen(false);
      setFeedback({
        type: 'success',
        text: `Produit « ${nom} » ${editingProduct ? 'mis à jour' : 'créé'} avec succès.`
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Erreur lors de la sauvegarde du produit.' });
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Save Stock Movement
  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movementProduct || movementQty <= 0) {
      setFeedback({ type: 'error', text: 'Veuillez saisir une quantité valide.' });
      return;
    }

    setIsSavingMovement(true);
    try {
      await createBeautyStockMovement({
        salonId: salon.id,
        productId: movementProduct.id,
        typeMouvement: movementType,
        quantite: Number(movementQty),
        coutUnitaireFcfa: Number(movementCoutUnitaire) || 0,
        fournisseur: movementFournisseur.trim() || undefined,
        motif: movementMotif.trim() || undefined,
        effectuePar: currentUser?.displayName || currentUser?.nom || 'Responsable Stock',
        dateMouvement: new Date().toISOString()
      });

      await loadData();
      setIsMovementModalOpen(false);
      setFeedback({
        type: 'success',
        text: `Mouvement de stock enregistré (${movementType === 'entree' ? '+' : '-'}${movementQty} ${movementProduct.nom}).`
      });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Erreur lors du mouvement de stock.' });
    } finally {
      setIsSavingMovement(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Supprimer définitivement le produit « ${name} » ?`)) return;
    try {
      await deleteBeautyProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
      setFeedback({ type: 'success', text: `Produit « ${name} » supprimé.` });
    } catch (err: any) {
      setFeedback({ type: 'error', text: err.message || 'Erreur suppression produit.' });
    }
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Category
      if (selectedCategory !== 'all' && p.categorie !== selectedCategory) return false;
      // Usage
      if (selectedUsage !== 'all' && p.usageType !== selectedUsage) return false;
      // Stock Status
      if (stockStatusFilter === 'alert' && p.quantiteActuelle > p.quantiteMinimale) return false;
      if (stockStatusFilter === 'out_of_stock' && p.quantiteActuelle > 0) return false;
      // Search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesName = p.nom.toLowerCase().includes(term);
        const matchesSku = p.sku && p.sku.toLowerCase().includes(term);
        const matchesSupplier = p.fournisseur && p.fournisseur.toLowerCase().includes(term);
        if (!matchesName && !matchesSku && !matchesSupplier) return false;
      }
      return true;
    });
  }, [products, selectedCategory, selectedUsage, stockStatusFilter, searchTerm]);

  // Aggregate Metrics
  const totalStockItems = useMemo(() => {
    return products.reduce((sum, p) => sum + p.quantiteActuelle, 0);
  }, [products]);

  const valeurStockAchat = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.quantiteActuelle * (p.prixAchat || 0)), 0);
  }, [products]);

  const valeurStockVente = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.quantiteActuelle * (p.prixVente || 0)), 0);
  }, [products]);

  const lowStockCount = useMemo(() => {
    return products.filter(p => p.quantiteActuelle <= p.quantiteMinimale).length;
  }, [products]);

  const CATEGORY_LABELS: Record<string, string> = {
    meches_tresses: '🪮 Mèches & Nattes',
    perruques_extensions: '💇‍♀️ Perruques & Tissages',
    soins_capillaires: '🧴 Soins Capillaires & Shampoings',
    huiles_cremes: '✨ Huiles & Crèmes',
    onglerie_vernis: '💅 Onglerie & Vernis',
    maquillage_beaute: '💄 Maquillage & Cosmétiques',
    accessoires: '✂️ Matériel & Accessoires',
    autre: '📦 Autre'
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <span>Stock & Produits</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Inventaire Temps Réel
              </span>
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Gestion des cosmétiques, mèches, perruques et produits de cabine.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-750 rounded-2xl text-xs font-bold">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'products'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Produits ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                activeTab === 'alerts'
                  ? 'bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Alertes ({lowStockCount})</span>
            </button>
            <button
              onClick={() => setActiveTab('movements')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                activeTab === 'movements'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Mouvements ({movements.length})
            </button>
          </div>

          <button
            onClick={handleOpenAddProduct}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Produit</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)}>
            <X className="w-4 h-4 text-gray-400 hover:text-gray-700" />
          </button>
        </div>
      )}

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-gray-400">Total Unités</span>
            <p className="text-lg font-extrabold text-gray-900 dark:text-white">
              {totalStockItems} <span className="text-xs font-normal text-gray-400">articles</span>
            </p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-gray-400">Valeur d'Achat</span>
            <p className="text-lg font-extrabold text-gray-900 dark:text-white">
              {formatFcfa(valeurStockAchat)}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-gray-400">Valeur Marchande</span>
            <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
              {formatFcfa(valeurStockVente)}
            </p>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-medium text-gray-400">Stock Faible / Critique</span>
            <p className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
              {lowStockCount} <span className="text-xs font-normal text-gray-400">produit(s)</span>
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PRODUCT LIST & INVENTORY                                          */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Rechercher par nom, référence SKU ou fournisseur..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 outline-none"
              >
                <option value="all">Toutes catégories</option>
                {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>{label}</option>
                ))}
              </select>

              <select
                value={selectedUsage}
                onChange={e => setSelectedUsage(e.target.value)}
                className="px-3 py-2 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 outline-none"
              >
                <option value="all">Tous usages</option>
                <option value="revente">🛍️ Revente client</option>
                <option value="interne">🧴 Cabine / Interne</option>
                <option value="mixte">🔄 Mixte (Revente & Cabine)</option>
              </select>

              <button
                onClick={loadData}
                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Product Cards / Table */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-5 py-3">Produit & Catégorie</th>
                    <th className="px-5 py-3">Usage</th>
                    <th className="px-5 py-3 text-right">Prix Achat</th>
                    <th className="px-5 py-3 text-right">Prix Vente</th>
                    <th className="px-5 py-3 text-center">Niveau Stock</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                        Aucun produit trouvé dans cette sélection.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map(prod => {
                      const isLowStock = prod.quantiteActuelle <= prod.quantiteMinimale;
                      const isOutOfStock = prod.quantiteActuelle <= 0;

                      return (
                        <tr key={prod.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-750/50 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-base">
                                {prod.categorie.includes('meches') || prod.categorie.includes('perruques') ? '🪮' : '🧴'}
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">
                                  {prod.nom}
                                </h4>
                                <p className="text-[10px] text-gray-400">
                                  {CATEGORY_LABELS[prod.categorie] || prod.categorie}
                                  {prod.sku ? ` • SKU: ${prod.sku}` : ''}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                              {prod.usageType === 'interne'
                                ? '🧴 Cabine seule'
                                : prod.usageType === 'revente'
                                ? '🛍️ Revente'
                                : '🔄 Mixte'}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-right font-medium text-gray-500">
                            {formatFcfa(prod.prixAchat)}
                          </td>

                          <td className="px-5 py-3.5 text-right font-extrabold text-gray-900 dark:text-white">
                            {formatFcfa(prod.prixVente)}
                          </td>

                          <td className="px-5 py-3.5 text-center">
                            <span
                              className={`inline-flex items-center gap-1 font-bold text-xs px-2.5 py-1 rounded-xl ${
                                isOutOfStock
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                  : isLowStock
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {isOutOfStock ? (
                                <>
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>0 {prod.unite} (Rupture)</span>
                                </>
                              ) : isLowStock ? (
                                <>
                                  <AlertTriangle className="w-3 h-3" />
                                  <span>{prod.quantiteActuelle} {prod.unite} (Alerte)</span>
                                </>
                              ) : (
                                <span>{prod.quantiteActuelle} {prod.unite}</span>
                              )}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenMovementModal(prod, 'entree')}
                                title="Réapprovisionner (+)"
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg transition-colors"
                              >
                                <ArrowDownLeft className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleOpenMovementModal(prod, 'sortie_interne')}
                                title="Sortie cabine / perte (-)"
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg transition-colors"
                              >
                                <ArrowUpRight className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                title="Modifier la fiche"
                                className="p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg transition-colors"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleDeleteProduct(prod.id, prod.nom)}
                                title="Supprimer"
                                className="p-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 text-red-500 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
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
      {/* TAB 2: ALERTES & RÉAPPROVISIONNEMENT                                     */}
      {/* ========================================================================= */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <span>Produits en Stock Critique ou Rupture</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Ces produits ont atteint ou dépassé leur seuil d'alerte. Réapprovisionnez-les rapidement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.filter(p => p.quantiteActuelle <= p.quantiteMinimale).length === 0 ? (
              <div className="col-span-2 p-12 text-center bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 text-gray-400">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500" />
                <p className="font-bold text-sm text-gray-700 dark:text-gray-300">Aucune alerte de stock</p>
                <p className="text-xs mt-1">Tous vos produits disposent de quantités supérieures au seuil de sécurité.</p>
              </div>
            ) : (
              products
                .filter(p => p.quantiteActuelle <= p.quantiteMinimale)
                .map(prod => (
                  <div
                    key={prod.id}
                    className="p-5 bg-white dark:bg-gray-800 rounded-3xl border border-rose-100 dark:border-rose-900/40 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                          {CATEGORY_LABELS[prod.categorie]}
                        </span>
                        <h4 className="font-extrabold text-sm text-gray-900 dark:text-white mt-0.5">
                          {prod.nom}
                        </h4>
                      </div>
                      <span className="px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 font-extrabold text-xs rounded-xl">
                        {prod.quantiteActuelle <= 0 ? 'Rupture totale' : `${prod.quantiteActuelle} restant(s)`}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100 dark:border-gray-700">
                      <span>Seuil de sécurité : <strong>{prod.quantiteMinimale} {prod.unite}</strong></span>
                      <span>Fournisseur : <strong>{prod.fournisseur || 'Non renseigné'}</strong></span>
                    </div>

                    <button
                      onClick={() => handleOpenMovementModal(prod, 'entree')}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      <span>Commander / Entrée de stock</span>
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: MOUVEMENTS DE STOCK                                               */}
      {/* ========================================================================= */}
      {activeTab === 'movements' && (
        <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-blue-500" />
                <span>Journal d'Audit des Mouvements de Stock</span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Historique chronologique des entrées de stock, ventes au comptoir et sorties de cabine.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-400 font-bold uppercase tracking-wider text-[10px] border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Produit</th>
                  <th className="px-5 py-3 text-center">Quantité</th>
                  <th className="px-5 py-3">Motif / Info</th>
                  <th className="px-5 py-3">Opérateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      Aucun mouvement de stock enregistré.
                    </td>
                  </tr>
                ) : (
                  movements.map(mov => {
                    const isPositive = mov.typeMouvement === 'entree';
                    const d = new Date(mov.createdAt);

                    return (
                      <tr key={mov.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-750/50 transition-colors">
                        <td className="px-5 py-3.5 text-gray-500">
                          {d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}{' '}
                          {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </td>

                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-md ${
                              isPositive
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : mov.typeMouvement === 'vente'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}
                          >
                            {isPositive ? '📥 Entrée / Réappro' : mov.typeMouvement === 'vente' ? '🛒 Vente Caisse' : '🧴 Cabine / Perte'}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 font-bold text-gray-900 dark:text-white">
                          {mov.product?.nom || `Produit #${mov.productId.slice(-5)}`}
                        </td>

                        <td className="px-5 py-3.5 text-center font-black">
                          <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                            {isPositive ? '+' : '-'}{mov.quantite}
                          </span>
                        </td>

                        <td className="px-5 py-3.5 text-gray-500">
                          {mov.motif || mov.fournisseur || '—'}
                        </td>

                        <td className="px-5 py-3.5 text-gray-400">
                          {mov.effectuePar || 'Système'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADD / EDIT PRODUCT                                                */}
      {/* ========================================================================= */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-rose-500" />
                <span>{editingProduct ? 'Modifier le Produit' : 'Nouveau Produit en Stock'}</span>
              </h3>
              <button onClick={() => setIsProductModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-700" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  required
                  value={nom}
                  onChange={e => setNom(e.target.value)}
                  placeholder="Ex: Mèches X-Pression N°1, Sérum Huile d'Argan 100ml..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={categorie}
                    onChange={e => setCategorie(e.target.value as BeautyProductCategory)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium outline-none"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Usage
                  </label>
                  <select
                    value={usageType}
                    onChange={e => setUsageType(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium outline-none"
                  >
                    <option value="revente">🛍️ Revente client</option>
                    <option value="interne">🧴 Cabine / Interne</option>
                    <option value="mixte">🔄 Mixte</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Prix d'Achat (FCFA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={prixAchat}
                    onChange={e => setPrixAchat(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Prix de Vente (FCFA) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prixVente}
                    onChange={e => setPrixVente(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-rose-600 dark:text-rose-400 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Stock Initial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quantiteActuelle}
                    onChange={e => setQuantiteActuelle(Number(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Seuil Alerte
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={quantiteMinimale}
                    onChange={e => setQuantiteMinimale(Number(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Unité
                  </label>
                  <input
                    type="text"
                    value={unite}
                    onChange={e => setUnite(e.target.value)}
                    placeholder="pièce, flacon..."
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Fournisseur
                  </label>
                  <input
                    type="text"
                    value={fournisseur}
                    onChange={e => setFournisseur(e.target.value)}
                    placeholder="Ex: Grossiste Rood-Woko"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Code / SKU
                  </label>
                  <input
                    type="text"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    placeholder="Ex: MECH-XP-01"
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-mono outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct}
                  className="px-5 py-2 bg-rose-600 text-white font-bold rounded-xl shadow-md shadow-rose-600/20"
                >
                  {isSavingProduct ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: STOCK MOVEMENT (ENTRÉE / SORTIE MANUELLE)                         */}
      {/* ========================================================================= */}
      {isMovementModalOpen && movementProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
              <h3 className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-blue-500" />
                <span>Mouvement de Stock : {movementProduct.nom}</span>
              </h3>
              <button onClick={() => setIsMovementModalOpen(false)}>
                <X className="w-5 h-5 text-gray-400 hover:text-gray-700" />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="p-6 space-y-4 text-xs">
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl flex justify-between">
                <span>Stock Actuel :</span>
                <span className="font-bold">{movementProduct.quantiteActuelle} {movementProduct.unite}</span>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Type d'opération
                </label>
                <select
                  value={movementType}
                  onChange={e => setMovementType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold outline-none"
                >
                  <option value="entree">📥 Entrée de stock (Réapprovisionnement)</option>
                  <option value="sortie_interne">🧴 Sortie Cabine / Prestation interne</option>
                  <option value="perte">⚠️ Perte / Casse / Péremption</option>
                  <option value="ajustement_inventaire">⚖️ Ajustement inventaire</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Quantité ({movementProduct.unite}) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={movementQty}
                    onChange={e => setMovementQty(Number(e.target.value) || 1)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-sm outline-none"
                  />
                </div>

                {movementType === 'entree' && (
                  <div>
                    <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Coût Unitaire (FCFA)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={movementCoutUnitaire}
                      onChange={e => setMovementCoutUnitaire(Number(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Motif / Justification
                </label>
                <input
                  type="text"
                  value={movementMotif}
                  onChange={e => setMovementMotif(e.target.value)}
                  placeholder="Ex: Achat lot mèches, flacon utilisé pour défrisage..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-medium outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSavingMovement}
                  className="px-5 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-md shadow-blue-600/20"
                >
                  {isSavingMovement ? 'Validation...' : 'Valider le mouvement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
