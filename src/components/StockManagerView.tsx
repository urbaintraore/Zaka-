import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { StockItem, StockReception, StockInventory } from '../types';
import { 
  Package, Plus, AlertTriangle, CheckCircle, 
  Search, Edit2, Check, X, RefreshCw, Trash2, 
  History, ShieldAlert, Boxes, ArrowUpRight, FileText, Lock, Sparkles,
  Utensils, ChefHat, Flame, Clock, Star, Filter, Eye, ChevronRight
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

// Popular Dish Presets for West African / Sahelian Restaurants, Bars & Maquis
interface DishPreset {
  name: string;
  category: string;
  itemType: 'plat' | 'menu';
  price: number;
  purchasePrice?: number;
  unit: string;
  prepTime: number;
  description: string;
  photoUrl: string;
  isMenuDuJour?: boolean;
}

const POPULAR_DISH_PRESETS: DishPreset[] = [
  {
    name: 'Poulet Bicyclette Braisé (Spécial Maquis)',
    category: 'grillades',
    itemType: 'plat',
    price: 4000,
    purchasePrice: 2600,
    unit: 'plat',
    prepTime: 25,
    description: 'Poulet fermier bicyclette assaisonné aux épices sahéliennes, oignons braisés et piment frais',
    photoUrl: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&q=80&w=600',
    isMenuDuJour: true
  },
  {
    name: 'Poisson Capitaine Braisé Kankankan',
    category: 'grillades',
    itemType: 'plat',
    price: 5000,
    purchasePrice: 3200,
    unit: 'plat',
    prepTime: 30,
    description: 'Capitaine frais mariné aux aromates sahariens, servi avec attiéké et piment vert écrasé',
    photoUrl: 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?auto=format&fit=crop&q=80&w=600'
  },
  {
    name: 'Riz Gras au Mouton (Marmite Sahélienne)',
    category: 'plats_resistance',
    itemType: 'plat',
    price: 3000,
    purchasePrice: 1800,
    unit: 'portion',
    prepTime: 10,
    description: 'Riz rouge mijoté au bouillon de mouton tendre avec légumes frais et soumbala traditionnel',
    photoUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&q=80&w=600',
    isMenuDuJour: true
  },
  {
    name: 'Brochettes de Filet de Bœuf (5 brochettes)',
    category: 'grillades',
    itemType: 'plat',
    price: 2500,
    purchasePrice: 1500,
    unit: 'portion',
    prepTime: 15,
    description: 'Brochettes de bœuf tendre assaisonnées au kankankan grillées au feu de bois',
    photoUrl: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=600'
  },
  {
    name: 'Attiéké Poisson Carpe Frit (Garba Style)',
    category: 'accompagnements',
    itemType: 'plat',
    price: 2500,
    purchasePrice: 1500,
    unit: 'plat',
    prepTime: 12,
    description: 'Attiéké de qualité avec carpe bien croustillante, dés de tomates, oignons et piment',
    photoUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600'
  },
  {
    name: 'Porc au Four Pimenté (Rôti Maquis)',
    category: 'grillades',
    itemType: 'plat',
    price: 3500,
    purchasePrice: 2200,
    unit: 'portion',
    prepTime: 20,
    description: 'Morceaux de porc marinés et rôtis au four avec oignons caramélisés et piment rouge',
    photoUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&q=80&w=600'
  },
  {
    name: 'Soupe de Poisson Silure / Cabri Épicée',
    category: 'soupes',
    itemType: 'plat',
    price: 3000,
    purchasePrice: 1900,
    unit: 'portion',
    prepTime: 20,
    description: 'Bouillon chaud aux herbes aromatiques, ail et gingembre, idéal en soirée',
    photoUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=600'
  },
  {
    name: 'Menu Complet Gourmand (Entrée + Plat + Boisson)',
    category: 'menu_complet',
    itemType: 'menu',
    price: 5500,
    purchasePrice: 3400,
    unit: 'menu',
    prepTime: 20,
    description: 'Salade fraîche + Poulet ou capitaine braisé au choix avec alloco/riz + 1 boisson fraîche',
    photoUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=600',
    isMenuDuJour: true
  }
];

const DISH_CATEGORIES = [
  { id: 'all', label: 'Toutes les catégories', icon: '🍽️' },
  { id: 'grillades', label: 'Grillades & Braises', icon: '🍗' },
  { id: 'plats_resistance', label: 'Plats de résistance', icon: '🍲' },
  { id: 'accompagnements', label: 'Accompagnements', icon: '🍟' },
  { id: 'fast_food', label: 'Burgers & Encas', icon: '🍔' },
  { id: 'soupes', label: 'Soupes & Poêlées', icon: '🥣' },
  { id: 'desserts', label: 'Desserts & Glaces', icon: '🍨' },
  { id: 'menu_complet', label: 'Menus Complets', icon: '⭐' },
];

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
  const [showDishModal, setShowDishModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPortionModal, setShowPortionModal] = useState(false);
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Tab & Filters
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'plats' | 'boissons' | 'alerts'>('all');
  const [selectedDishCategory, setSelectedDishCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Notifications & Loaders
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -------------------------------------------------------------
  // FORM A: Create / Edit Dish / Menu (Plat / Menu Cuisine)
  // -------------------------------------------------------------
  const [editingDishId, setEditingDishId] = useState<string | null>(null);
  const [dishName, setDishName] = useState('');
  const [dishCategory, setDishCategory] = useState('grillades');
  const [dishItemType, setDishItemType] = useState<'plat' | 'menu'>('plat');
  const [dishPrice, setDishPrice] = useState('');
  const [dishPurchasePrice, setDishPurchasePrice] = useState('');
  const [dishQuantity, setDishQuantity] = useState('15');
  const [dishMinQuantity, setDishMinQuantity] = useState('4');
  const [dishPrepTime, setDishPrepTime] = useState('20');
  const [dishUnit, setDishUnit] = useState('plat');
  const [dishDescription, setDishDescription] = useState('');
  const [dishIsMenuDuJour, setDishIsMenuDuJour] = useState(false);
  const [dishPhotoUrl, setDishPhotoUrl] = useState('');

  // -------------------------------------------------------------
  // FORM B: Quick Kitchen Portion Restock
  // -------------------------------------------------------------
  const [portionDishId, setPortionDishId] = useState('');
  const [portionsToAdd, setPortionsToAdd] = useState('5');

  // -------------------------------------------------------------
  // FORM C: Create / Edit Drink Catalogue Form State
  // -------------------------------------------------------------
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [drinkName, setDrinkName] = useState('');
  const [drinkVolume, setDrinkVolume] = useState('66cl');
  const [unitsPerCase, setUnitsPerCase] = useState<number>(12);
  const [drinkPrice, setDrinkPrice] = useState('');
  const [initInputType, setInitInputType] = useState<'cases' | 'units'>('cases');
  const [initQtyVal, setInitQtyVal] = useState('0');

  // -------------------------------------------------------------
  // FORM D: Stock Reception in Cases Form State
  // -------------------------------------------------------------
  const [receptionStockId, setReceptionStockId] = useState<string>('');
  const [receptionCasesCount, setReceptionCasesCount] = useState<string>('1');

  // -------------------------------------------------------------
  // FORM E: Physical Inventory & Theft Audit Form State
  // -------------------------------------------------------------
  const [inventoryStockId, setInventoryStockId] = useState<string>('');
  const [physicalCountUnits, setPhysicalCountUnits] = useState<string>('0');
  const [autoAdjustStock, setAutoAdjustStock] = useState<boolean>(true);
  const [inventoryNote, setInventoryNote] = useState<string>('');

  // -------------------------------------------------------------
  // FORM F: History Sub-Tab
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

  const dishItems = useMemo(() => {
    return estStocks.filter(item => item.itemType === 'plat' || item.itemType === 'menu');
  }, [estStocks]);

  const drinkItems = useMemo(() => {
    return estStocks.filter(item => item.itemType !== 'plat' && item.itemType !== 'menu');
  }, [estStocks]);

  const totalPortionsInStock = useMemo(() => {
    return dishItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [dishItems]);

  const totalUnitsInStock = useMemo(() => {
    return drinkItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [drinkItems]);

  const lowStockCount = useMemo(() => {
    return estStocks.filter(d => d.quantity > 0 && d.quantity <= (d.minQuantity || 5)).length;
  }, [estStocks]);

  const outOfStockCount = useMemo(() => {
    return estStocks.filter(d => d.quantity <= 0).length;
  }, [estStocks]);

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

  // Main filtered view
  const filteredStocks = useMemo(() => {
    return estStocks.filter(item => {
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery = !query || 
        item.name.toLowerCase().includes(query) ||
        (item.volume && item.volume.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (item.category && item.category.toLowerCase().includes(query));

      if (!matchesQuery) return false;

      // Tab filter
      if (activeFilterTab === 'plats') {
        if (item.itemType !== 'plat' && item.itemType !== 'menu') return false;
        if (selectedDishCategory !== 'all' && item.category !== selectedDishCategory) return false;
      } else if (activeFilterTab === 'boissons') {
        if (item.itemType === 'plat' || item.itemType === 'menu') return false;
      } else if (activeFilterTab === 'alerts') {
        const isLow = item.quantity > 0 && item.quantity <= (item.minQuantity || 5);
        const isOut = item.quantity <= 0;
        if (!isLow && !isOut) return false;
      }

      return true;
    });
  }, [estStocks, searchQuery, activeFilterTab, selectedDishCategory]);

  // -------------------------------------------------------------
  // DISH / MENU HANDLERS (Gérant)
  // -------------------------------------------------------------
  const resetDishForm = () => {
    setEditingDishId(null);
    setDishName('');
    setDishCategory('grillades');
    setDishItemType('plat');
    setDishPrice('');
    setDishPurchasePrice('');
    setDishQuantity('15');
    setDishMinQuantity('4');
    setDishPrepTime('20');
    setDishUnit('plat');
    setDishDescription('');
    setDishIsMenuDuJour(false);
    setDishPhotoUrl('');
  };

  const handleOpenAddDish = () => {
    resetDishForm();
    setShowDishModal(true);
  };

  const handleOpenEditDish = (dish: StockItem) => {
    setEditingDishId(dish.id);
    setDishName(dish.name);
    setDishCategory(dish.category || 'grillades');
    setDishItemType((dish.itemType as any) || 'plat');
    setDishPrice(dish.price.toString());
    setDishPurchasePrice(dish.purchasePrice ? dish.purchasePrice.toString() : '');
    setDishQuantity(dish.quantity.toString());
    setDishMinQuantity((dish.minQuantity || 4).toString());
    setDishPrepTime((dish.preparationTimeMinutes || 20).toString());
    setDishUnit(dish.unit || 'plat');
    setDishDescription(dish.description || '');
    setDishIsMenuDuJour(Boolean(dish.isMenuDuJour));
    setDishPhotoUrl(dish.photoUrl || '');
    setShowDishModal(true);
  };

  const handleSelectDishPreset = (preset: DishPreset) => {
    setDishName(preset.name);
    setDishCategory(preset.category);
    setDishItemType(preset.itemType);
    setDishPrice(preset.price.toString());
    setDishPurchasePrice(preset.purchasePrice ? preset.purchasePrice.toString() : '');
    setDishUnit(preset.unit);
    setDishPrepTime(preset.prepTime.toString());
    setDishDescription(preset.description);
    setDishPhotoUrl(preset.photoUrl);
    setDishIsMenuDuJour(Boolean(preset.isMenuDuJour));
  };

  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName.trim() || !dishPrice) {
      setErrorMsg("Veuillez renseigner le nom du plat/menu et son prix de vente.");
      return;
    }

    const price = parseFloat(dishPrice);
    if (isNaN(price) || price <= 0) {
      setErrorMsg("Le prix de vente doit être supérieur à 0 F CFA.");
      return;
    }

    const qty = parseInt(dishQuantity || '0');
    if (isNaN(qty) || qty < 0) {
      setErrorMsg("Le stock en portions doit être un nombre positif ou nul.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const dishPayload = {
        establishmentId,
        name: dishName.trim(),
        price,
        purchasePrice: dishPurchasePrice ? parseFloat(dishPurchasePrice) : undefined,
        quantity: qty,
        minQuantity: parseInt(dishMinQuantity || '4') || 4,
        category: dishCategory,
        itemType: dishItemType,
        unit: dishUnit || 'plat',
        preparationTimeMinutes: parseInt(dishPrepTime || '20') || 20,
        description: dishDescription.trim(),
        isMenuDuJour: dishIsMenuDuJour,
        photoUrl: dishPhotoUrl.trim() || undefined,
        stock_faible: qty <= (parseInt(dishMinQuantity || '4') || 4)
      };

      if (editingDishId) {
        await updateStockItem(editingDishId, dishPayload);
        setSuccessMsg(`Le plat / menu "${dishName}" a été mis à jour avec succès.`);
      } else {
        await addStockItem(dishPayload);
        setSuccessMsg(`Nouveau plat / menu "${dishName}" ajouté au stock cuisine (${qty} portions disponibles).`);
      }

      setShowDishModal(false);
      resetDishForm();
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'enregistrement du plat.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick portion restock directly from table row
  const handleQuickAddPortions = async (dish: StockItem, count: number) => {
    try {
      const newQty = dish.quantity + count;
      await updateStockItem(dish.id, {
        quantity: newQty,
        stock_faible: newQty <= (dish.minQuantity || 4)
      });
      setSuccessMsg(`+${count} portions préparées ajoutées pour "${dish.name}" (Total : ${newQty} dispo).`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch {
      setErrorMsg("Erreur lors de l'ajout des portions.");
    }
  };

  // Open Kitchen Restock Modal
  const handleOpenPortionRestock = (dishIdTarget?: string) => {
    if (dishItems.length === 0) {
      setErrorMsg("Veuillez d'abord ajouter au moins un plat ou menu à votre carte.");
      return;
    }
    setPortionDishId(dishIdTarget || dishItems[0]?.id || '');
    setPortionsToAdd('5');
    setShowPortionModal(true);
  };

  const handleSavePortionRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    const dish = dishItems.find(d => d.id === portionDishId);
    if (!dish) {
      setErrorMsg("Veuillez sélectionner un plat.");
      return;
    }

    const count = parseInt(portionsToAdd || '0');
    if (isNaN(count) || count <= 0) {
      setErrorMsg("Le nombre de portions à ajouter doit être supérieur à 0.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      const newQty = dish.quantity + count;
      await updateStockItem(dish.id, {
        quantity: newQty,
        stock_faible: newQty <= (dish.minQuantity || 4)
      });
      setSuccessMsg(`Sortie cuisine validée : +${count} portions de "${dish.name}" ajoutées au stock.`);
      setShowPortionModal(false);
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch {
      setErrorMsg("Erreur lors du réapprovisionnement en cuisine.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // DRINK HANDLERS
  // -------------------------------------------------------------
  const resetDrinkForm = () => {
    setEditingStockId(null);
    setDrinkName('');
    setDrinkVolume('66cl');
    setUnitsPerCase(12);
    setDrinkPrice('');
    setInitInputType('cases');
    setInitQtyVal('0');
  };

  const handleOpenAddDrink = () => {
    resetDrinkForm();
    setShowAddModal(true);
  };

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
        await updateStockItem(editingStockId, {
          name: drinkName.trim(),
          volume: drinkVolume.trim(),
          unitsPerCase: safeUnitsPerCase,
          price,
          quantity: finalQuantityInUnits,
          category: 'boisson',
          stock_faible: finalQuantityInUnits <= 5
        });
        setSuccessMsg(`Fiche produit "${drinkName}" mise à jour.`);
      } else {
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
      setErrorMsg(err.message || "Erreur lors de l'enregistrement de la boisson.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Reception Modal
  const handleOpenReception = (stockIdTarget?: string) => {
    if (drinkItems.length === 0) {
      setErrorMsg("Veuillez d'abord ajouter au moins une boisson au catalogue du bar.");
      return;
    }
    setReceptionStockId(stockIdTarget || drinkItems[0]?.id || '');
    setReceptionCasesCount('1');
    setShowReceptionModal(true);
  };

  // Submit Stock Reception
  const handleSaveReception = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStock = drinkItems.find(s => s.id === receptionStockId) || estStocks.find(s => s.id === receptionStockId);
    if (!targetStock) {
      setErrorMsg("Veuillez sélectionner une boisson.");
      return;
    }

    const cases = parseInt(receptionCasesCount || '0');
    if (isNaN(cases) || cases <= 0) {
      setErrorMsg("Le nombre de caisses doit être strictement supérieur à 0.");
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
      setErrorMsg("Veuillez d'abord ajouter au moins un article au stock.");
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

  // Submit Inventory Audit
  const handleSaveInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetStock = estStocks.find(s => s.id === inventoryStockId);
    if (!targetStock) {
      setErrorMsg("Veuillez sélectionner un article à auditer.");
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
        volume: targetStock.volume || (targetStock.itemType === 'plat' ? targetStock.unit || 'portion' : '66cl'),
        stockTheorique,
        stockPhysiqueCompte: counted,
        ecart,
        realisePar: currentUser?.id || 'gerant',
        realiseByName: currentUser?.name || 'Gérant',
        adjusted: autoAdjustStock,
        note: inventoryNote.trim()
      });

      if (ecart < 0) {
        setSuccessMsg(`Audit enregistré : Écart de ${ecart} unité(s) [PERTE / VOL]. ${autoAdjustStock ? 'Stock ajusté.' : ''}`);
      } else if (ecart === 0) {
        setSuccessMsg(`Audit enregistré : Stock parfaitement conforme (${counted} un.).`);
      } else {
        setSuccessMsg(`Audit enregistré : Surplus de +${ecart} unité(s). ${autoAdjustStock ? 'Stock ajusté.' : ''}`);
      }

      setShowInventoryModal(false);
      setTimeout(() => setSuccessMsg(null), 4500);
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur lors de l'enregistrement de l'inventaire.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Stock Item
  const handleDeleteStock = async (id: string, name: string) => {
    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await deleteStockItem(id);
      setSuccessMsg(`"${name}" a été supprimé du catalogue.`);
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

  const selectedReceptionStock = useMemo(() => {
    return drinkItems.find(s => s.id === receptionStockId) || estStocks.find(s => s.id === receptionStockId) || null;
  }, [drinkItems, estStocks, receptionStockId]);

  const selectedInventoryStock = useMemo(() => {
    return estStocks.find(s => s.id === inventoryStockId) || null;
  }, [estStocks, inventoryStockId]);

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
              Gestion des Stocks (Menus, Plats & Bar)
            </h3>
            {isGerantUser ? (
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-200 dark:border-emerald-900">
                <Sparkles className="w-3 h-3" /> Espace Gérant
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-amber-200 dark:border-amber-900">
                <Lock className="w-3 h-3" /> Mode Caissier (Lecture seule)
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Gérez vos plats cuisinés, formules du jour, boissons en bouteilles et réceptions de caisses au même endroit.
          </p>
        </div>

        {/* GERANT TOOLBAR BUTTONS */}
        {isGerantUser ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleOpenAddDish}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Utensils className="w-4 h-4" /> + Nouveau Plat / Menu
            </button>
            <button
              onClick={handleOpenAddDrink}
              className="px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" /> + Nouvelle Boisson
            </button>
            <button
              onClick={() => handleOpenPortionRestock()}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
            >
              <ChefHat className="w-4 h-4" /> Sortie Cuisine (+Portions)
            </button>
            <button
              onClick={() => handleOpenReception()}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Boxes className="w-4 h-4 text-amber-500" /> Réception Caisses
            </button>
            <button
              onClick={() => handleOpenInventory()}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-indigo-500" /> Audit Vol
            </button>
            <button
              onClick={() => setShowHistoryModal(true)}
              className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <History className="w-4 h-4 text-gray-500" /> Historique
            </button>
          </div>
        ) : (
          <div className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-900/40 flex items-center gap-2">
            <Lock className="w-4 h-4 shrink-0" />
            <span>Consultation du stock uniquement. Enregistrement des commandes dans le Point de Vente (POS).</span>
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-4 rounded-2xl">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Catalogue Établissement</span>
          <span className="text-xl font-black text-gray-900 dark:text-white mt-0.5 block">{estStocks.length} articles</span>
          <span className="text-[10px] font-bold text-gray-400 mt-1 block">
            {dishItems.length} plats/menus • {drinkItems.length} boissons
          </span>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-4 rounded-2xl">
          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">Stock Cuisine Disponible</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
            {totalPortionsInStock} portions
          </span>
          <span className="text-[10px] font-bold text-gray-400 mt-1 block">
            Prêtes à servir au restaurant/maquis
          </span>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 p-4 rounded-2xl">
          <span className="text-[10px] font-black text-orange-600 dark:text-orange-400 uppercase tracking-wider block">Stock Bar (Bouteilles)</span>
          <span className="text-xl font-black text-orange-600 dark:text-orange-400 mt-0.5 block">
            {totalUnitsInStock} un.
          </span>
          <span className="text-[10px] font-bold text-gray-400 mt-1 block">
            Boissons fraîches au comptoir
          </span>
        </div>

        <div className={`p-4 rounded-2xl border ${(lowStockCount > 0 || outOfStockCount > 0) ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50' : 'bg-white dark:bg-gray-900 border-gray-150 dark:border-gray-800'}`}>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Alertes & Ruptures</span>
          <span className={`text-xl font-black mt-0.5 block ${(lowStockCount > 0 || outOfStockCount > 0) ? 'text-amber-700 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
            {lowStockCount + outOfStockCount} articles
          </span>
          <span className="text-[10px] font-bold text-gray-400 mt-1 block">
            {outOfStockCount} rupture{outOfStockCount > 1 ? 's' : ''} • {lowStockCount} niveau faible
          </span>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-gray-150 dark:border-gray-800 pb-3">
          
          {/* Main Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActiveFilterTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeFilterTab === 'all'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
              }`}
            >
              Tous ({estStocks.length})
            </button>

            <button
              onClick={() => setActiveFilterTab('plats')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilterTab === 'plats'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>🍽️ Plats & Menus ({dishItems.length})</span>
            </button>

            <button
              onClick={() => setActiveFilterTab('boissons')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilterTab === 'boissons'
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-orange-50 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 hover:bg-orange-100'
              }`}
            >
              <span>🍺 Boissons & Bar ({drinkItems.length})</span>
            </button>

            <button
              onClick={() => setActiveFilterTab('alerts')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                activeFilterTab === 'alerts'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 hover:bg-red-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Alertes Stock ({lowStockCount + outOfStockCount})</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher plat, menu, boisson..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-orange-500"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sub-category chips when browsing Plats */}
        {activeFilterTab === 'plats' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {DISH_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedDishCategory(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold shrink-0 transition-all flex items-center gap-1 cursor-pointer ${
                  selectedDishCategory === cat.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* ARTICLES TABLE */}
        {filteredStocks.length === 0 ? (
          <div className="text-center py-12 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mx-auto">
              <Utensils className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
              {searchQuery ? "Aucun article ne correspond à votre recherche." : "Aucun article dans cette catégorie pour le moment."}
            </p>
            {isGerantUser && !searchQuery && (
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  onClick={handleOpenAddDish}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-colors"
                >
                  Ajouter un Menu / Plat 🍽️
                </button>
                <button
                  onClick={handleOpenAddDrink}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-black transition-colors"
                >
                  Ajouter une Boisson 🍺
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gray-150 dark:border-gray-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-gray-950/60 text-gray-400 border-b border-gray-150 dark:border-gray-800 text-[10px] font-black uppercase tracking-wider">
                  <th className="py-3 px-4">Article / Plat & Description</th>
                  <th className="py-3 px-3 text-center">Type & Spécificité</th>
                  <th className="py-3 px-3">Prix de Vente</th>
                  <th className="py-3 px-3">Stock Actuel</th>
                  <th className="py-3 px-3 text-center">Statut</th>
                  {isGerantUser && <th className="py-3 px-4 text-right">Actions Gérant</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-gray-800">
                {filteredStocks.map(item => {
                  const isFood = item.itemType === 'plat' || item.itemType === 'menu';
                  const threshold = item.minQuantity || 5;
                  const isLowStock = item.quantity > 0 && item.quantity <= threshold;
                  const isOutOfStock = item.quantity <= 0;
                  const unitsPerCaseVal = item.unitsPerCase || item.unites_par_caisse || 12;

                  return (
                    <tr 
                      key={item.id}
                      className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors"
                    >
                      {/* Item Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {isFood ? (
                            item.photoUrl ? (
                              <img 
                                src={item.photoUrl} 
                                alt={item.name} 
                                className="w-10 h-10 rounded-xl object-cover border border-gray-200 dark:border-gray-700 shrink-0" 
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-900/50">
                                <Utensils className="w-5 h-5" />
                              </div>
                            )
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 flex items-center justify-center shrink-0 border border-orange-200 dark:border-orange-900/50 font-black text-sm">
                              🍺
                            </div>
                          )}

                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-gray-900 dark:text-white text-xs">
                                {item.name}
                              </span>
                              {item.isMenuDuJour && (
                                <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded text-[9px] font-black flex items-center gap-0.5">
                                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Plat du Jour
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1 max-w-xs mt-0.5">
                              {item.description || (isFood ? `Plat maison cuisiné à la demande` : `Bouteille format ${item.volume || '66cl'}`)}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Type & Prep time or case config */}
                      <td className="py-3.5 px-3 text-center">
                        {isFood ? (
                          <div className="inline-flex flex-col items-center gap-0.5">
                            <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-lg text-[10px] font-black uppercase">
                              {item.itemType === 'menu' ? 'Menu Complet' : (item.category || 'Plat')}
                            </span>
                            {item.preparationTimeMinutes && (
                              <span className="text-[9px] text-gray-400 font-bold flex items-center gap-0.5">
                                <Clock className="w-2.5 h-2.5" /> ~{item.preparationTimeMinutes} min
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-[10px] font-black">
                            {unitsPerCaseVal} btles / caisse
                          </span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-3 font-black text-gray-900 dark:text-white">
                        {formatPrice(item.price)}
                        {item.purchasePrice && (
                          <span className="block text-[9px] text-gray-400 font-medium">
                            Coût : {formatPrice(item.purchasePrice)}
                          </span>
                        )}
                      </td>

                      {/* Stock availability */}
                      <td className="py-3.5 px-3">
                        {isFood ? (
                          <div>
                            <span className={`font-black text-xs block ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                              {item.quantity} {item.unit || (item.quantity > 1 ? 'portions' : 'portion')}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold block">
                              Seuil alerte : {threshold}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <span className={`font-black text-xs block ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>
                              {formatStockBreakdown(item.quantity, unitsPerCaseVal)}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold block">
                              ({item.quantity} bouteilles)
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                          isOutOfStock 
                            ? 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400' 
                            : isLowStock 
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300' 
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                        }`}>
                          {isOutOfStock ? "Rupture" : isLowStock ? "Stock Faible" : "Disponible"}
                        </span>
                      </td>

                      {/* Gerant Actions */}
                      {isGerantUser && (
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isFood ? (
                              <>
                                <button
                                  onClick={() => handleQuickAddPortions(item, 5)}
                                  title="Ajouter +5 portions cuisinées"
                                  className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10px] font-black transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" /> +5 Portions
                                </button>
                                <button
                                  onClick={() => handleOpenEditDish(item)}
                                  title="Modifier le plat / menu"
                                  className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleOpenReception(item.id)}
                                  title="Réceptionner du stock en caisses"
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <Boxes className="w-3 h-3" /> +Caisses
                                </button>
                                <button
                                  onClick={() => handleOpenInventory(item.id)}
                                  title="Audit physique / Détecter les vols"
                                  className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-lg transition-colors cursor-pointer"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleOpenEditDrink(item)}
                                  title="Modifier la boisson"
                                  className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-colors cursor-pointer"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            <button
                              onClick={() => setDeletingStockId(item.id)}
                              title="Supprimer du catalogue"
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
      {/* MODAL 1: ADD / EDIT DISH OR MENU (Gérant Only)                        */}
      {/* ---------------------------------------------------------------------- */}
      <AnimatePresence>
        {showDishModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-150 dark:border-gray-800 space-y-4 max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-3 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    {editingDishId ? "Modifier la Fiche Plat / Menu" : "Ajouter un Plat ou Menu au Stock"}
                  </h3>
                </div>
                <button onClick={() => setShowDishModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* QUICK PRESETS (Only for new dish) */}
              {!editingDishId && (
                <div className="p-3 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-150 dark:border-emerald-900/40 rounded-2xl space-y-1.5 shrink-0">
                  <span className="text-[10px] font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
                    ⚡ Suggestions rapides de plats populaires (Maquis & Restaurants) :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_DISH_PRESETS.slice(0, 6).map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectDishPreset(p)}
                        className="px-2.5 py-1 bg-white dark:bg-gray-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-gray-800 dark:text-gray-200 rounded-lg text-[10px] font-bold transition-all border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                      >
                        {p.name.split('(')[0].trim()} • {p.price} F
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveDish} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
                {/* Type: Plat individuel vs Menu Complet */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                      Type d'article *
                    </label>
                    <select
                      value={dishItemType}
                      onChange={e => setDishItemType(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-bold dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="plat">Plat Individuel / Grillade 🍲</option>
                      <option value="menu">Menu Complet / Formule ⭐</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                      Catégorie culinaire *
                    </label>
                    <select
                      value={dishCategory}
                      onChange={e => setDishCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-bold dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="grillades">Grillades & Braises 🍗</option>
                      <option value="plats_resistance">Plats de résistance & Sauces 🍲</option>
                      <option value="accompagnements">Accompagnements (Attiéké, Frites, Alloco...) 🍟</option>
                      <option value="fast_food">Burgers & Fast-Food 🍔</option>
                      <option value="soupes">Soupes & Poêlées 🥣</option>
                      <option value="desserts">Desserts & Glaces 🍨</option>
                      <option value="menu_complet">Menu Complet / Formule ⭐</option>
                    </select>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                    Nom du Plat ou Menu *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Poulet Bicyclette Braisé, Capitaine Kankankan, Riz Gras au Mouton..."
                    value={dishName}
                    onChange={e => setDishName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-bold dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Pricing: Price and Purchase Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                      Prix de vente client (F CFA) *
                    </label>
                    <input
                      type="number"
                      required
                      min={100}
                      step={50}
                      placeholder="ex: 3500"
                      value={dishPrice}
                      onChange={e => setDishPrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-black text-emerald-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                      Coût de revient / Ingrédients (Optionnel)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      placeholder="ex: 2200"
                      value={dishPurchasePrice}
                      onChange={e => setDishPurchasePrice(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Quantities & Preparation Time */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                      Portions en stock *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={dishQuantity}
                      onChange={e => setDishQuantity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-black text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                      Seuil alerte cuisine
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={dishMinQuantity}
                      onChange={e => setDishMinQuantity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-bold dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                      Temps prép. (min)
                    </label>
                    <input
                      type="number"
                      min={5}
                      step={5}
                      value={dishPrepTime}
                      onChange={e => setDishPrepTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-bold dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Description & Accompaniments */}
                <div>
                  <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                    Description & Ingrédients / Garnitures
                  </label>
                  <textarea
                    rows={2}
                    placeholder="ex: Servi avec oignons braisés, tomates, piment vert et accompagnement au choix (attiéké, alloco, riz, frites)..."
                    value={dishDescription}
                    onChange={e => setDishDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-medium dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Photo URL & Plat du jour toggle */}
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                      Photo du plat (URL Unsplash / Web)
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/..."
                      value={dishPhotoUrl}
                      onChange={e => setDishPhotoUrl(e.target.value)}
                      className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-medium dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="p-3 bg-gray-50 dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className={`w-4 h-4 ${dishIsMenuDuJour ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                      <div>
                        <span className="font-black text-gray-900 dark:text-white block">Mettre en avant comme Plat du Jour ⭐</span>
                        <span className="text-[10px] text-gray-400 block">Sera mis en tête de liste dans le Point de Vente (POS) et l'accueil clients</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={dishIsMenuDuJour}
                      onChange={e => setDishIsMenuDuJour(e.target.checked)}
                      className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-150 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowDishModal(false)}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-xl font-bold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Enregistrement..." : editingDishId ? "Enregistrer les modifications" : "Ajouter le plat au stock"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 2: QUICK KITCHEN PORTION RESTOCK (Gérant Only)                   */}
      {/* ---------------------------------------------------------------------- */}
      <AnimatePresence>
        {showPortionModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-150 dark:border-gray-800 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-gray-150 dark:border-gray-800 pb-3">
                <div className="flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-amber-600" />
                  <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                    Sortie Cuisine / Réapprovisionnement
                  </h3>
                </div>
                <button onClick={() => setShowPortionModal(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl cursor-pointer">
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSavePortionRestock} className="space-y-4 text-xs">
                <div>
                  <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                    Sélectionner le plat réapprovisionné *
                  </label>
                  <select
                    value={portionDishId}
                    onChange={e => setPortionDishId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-bold dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    {dishItems.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} — Actuel : {d.quantity} {d.unit || 'portions'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                    Nombre de portions fraîches prêtes à servir *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={portionsToAdd}
                    onChange={e => setPortionsToAdd(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-black text-lg text-amber-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Quick Add Buttons */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400">Raccourcis :</span>
                  {[5, 10, 15, 20].map(cnt => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setPortionsToAdd(cnt.toString())}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-black"
                    >
                      +{cnt}
                    </button>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-150 dark:border-gray-800">
                  <button
                    type="button"
                    onClick={() => setShowPortionModal(false)}
                    className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-xl font-bold cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? "Validation..." : "Ajouter les portions"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ---------------------------------------------------------------------- */}
      {/* MODAL 3: ADD / EDIT DRINK CATALOGUE (Gérant Only)                      */}
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
                <div>
                  <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                    Nom de la Boisson *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Brakina, Beaufort, Flag, Guinness, Sobambo, Coca-Cola..."
                    value={drinkName}
                    onChange={e => setDrinkName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-bold dark:text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                      Contenance / Format *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="ex: 66cl, 33cl, 50cl, Canette..."
                      value={drinkVolume}
                      onChange={e => setDrinkVolume(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-bold dark:text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                      Bouteilles par caisse (Standard) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={unitsPerCase}
                      onChange={e => setUnitsPerCase(parseInt(e.target.value) || 12)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-black text-orange-600 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                    Prix de Vente Unitaire (F CFA) *
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    step={50}
                    placeholder="ex: 700, 1000, 1500..."
                    value={drinkPrice}
                    onChange={e => setDrinkPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-black text-orange-600 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div className="bg-gray-50 dark:bg-gray-950 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-gray-800 dark:text-gray-200">
                      {editingStockId ? "Stock actuel en rayon / réserve :" : "Stock initial disponible :"}
                    </span>
                    <div className="flex items-center gap-1 bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
                      <button
                        type="button"
                        onClick={() => setInitInputType('cases')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer ${initInputType === 'cases' ? 'bg-orange-600 text-white' : 'text-gray-500'}`}
                      >
                        En Caisses
                      </button>
                      <button
                        type="button"
                        onClick={() => setInitInputType('units')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-black cursor-pointer ${initInputType === 'units' ? 'bg-orange-600 text-white' : 'text-gray-500'}`}
                      >
                        En Bouteilles
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      value={initQtyVal}
                      onChange={e => setInitQtyVal(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl font-black text-base dark:text-white focus:outline-none focus:border-orange-500"
                    />
                    <span className="font-black text-gray-500 shrink-0">
                      {initInputType === 'cases' ? `caisse(s) (= ${(parseInt(initQtyVal || '0') || 0) * (unitsPerCase || 12)} btls)` : 'bouteille(s)'}
                    </span>
                  </div>
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
      {/* MODAL 4: STOCK RECEPTION IN CASES (Gérant Only)                       */}
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
                <div>
                  <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                    Sélectionner la Boisson Réceptionnée *
                  </label>
                  <select
                    value={receptionStockId}
                    onChange={e => setReceptionStockId(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl font-bold dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    {drinkItems.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.volume || '66cl'}) — Stock actuel : {s.quantity} un.
                      </option>
                    ))}
                  </select>
                </div>

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
      {/* MODAL 5: INVENTORY AUDIT & THEFT DETECTION (Gérant Only)               */}
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
                <div>
                  <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                    Article à Auditer *
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
                        {s.name} ({s.itemType === 'plat' ? `${s.quantity} portions` : `${s.volume || '66cl'} — ${s.quantity} un.`})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                    Stock Physique Réellement Compté (unités ou portions) *
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
                      <span className="font-black">{selectedInventoryStock.quantity} unité(s)</span>
                    </div>

                    <div className="flex items-center justify-between text-xs font-bold text-gray-800 dark:text-gray-200">
                      <span>Stock Physique Compté :</span>
                      <span className="font-black">{physicalCountUnits || 0} unité(s)</span>
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
                        {computedInventoryEcart > 0 ? `+${computedInventoryEcart}` : computedInventoryEcart} unité(s)
                      </span>
                    </div>

                    {computedInventoryEcart < 0 && (
                      <p className="text-[11px] font-black text-red-700 dark:text-red-400 mt-1 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>⚠️ PERTE / VOL POTENTIEL DE {Math.abs(computedInventoryEcart)} UNITÉ(S) !</span>
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
                        ℹ️ Surplus de +{computedInventoryEcart} unité(s) détecté.
                      </p>
                    )}
                  </div>
                )}

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

                <div>
                  <label className="block font-black text-gray-700 dark:text-gray-300 mb-1">
                    Note ou justification (Optionnel)
                  </label>
                  <input
                    type="text"
                    placeholder="ex: Bouteilles cassées lors du service, plats offerts non saisis..."
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
      {/* MODAL 6: HISTORY OF RECEPTIONS & INVENTORIES (Gérant Only)             */}
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
              Voulez-vous vraiment supprimer cet article du stock de l'établissement ?
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
