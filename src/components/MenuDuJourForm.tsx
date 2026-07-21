import React, { useState } from 'react';
import { useAppStore } from '../store';
import { X, Plus, Trash2, Copy, ChefHat, Calendar, DollarSign, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

interface MenuDuJourFormProps {
  establishmentId: string;
  onClose: () => void;
}

export function MenuDuJourForm({ establishmentId, onClose }: MenuDuJourFormProps) {
  const { menusDuJour, addMenuDuJour, establishments } = useAppStore();
  const est = establishments.find(e => e.id === establishmentId);

  const [menuDate, setMenuDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<{ name: string; category: string; price: string; photoUrl?: string }[]>([
    { name: '', category: 'Plat', price: '' }
  ]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Get previous menus for this restaurant
  const previousMenus = menusDuJour
    ? menusDuJour
        .filter(m => m.establishmentId === establishmentId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    : [];

  // Populate form with items from a previous menu
  const handleDuplicateMenu = (prevMenu: any) => {
    const duplicatedItems = prevMenu.items.map((item: any) => ({
      name: item.name,
      category: item.category || 'Plat',
      price: String(item.price),
      photoUrl: item.photoUrl || ''
    }));
    setItems(duplicatedItems);
    setError(null);
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { name: '', category: 'Plat', price: '' }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      setError("Le menu doit contenir au moins un plat.");
      return;
    }
    setItems(prev => prev.filter((_, idx) => idx !== index));
    setError(null);
  };

  const handleItemChange = (index: number, field: string, value: string) => {
    setItems(prev => prev.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    }));
    setError(null);
  };

  const handleFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingIndex(index);
      setError(null);
      const base64 = await compressImage(file, 600, 600, 0.6);
      handleItemChange(index, 'photoUrl', base64);
    } catch (err) {
      console.error("Erreur de compression de l'image:", err);
      setError("Impossible de charger l'image. Veuillez réessayer.");
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuDate) {
      setError("Veuillez sélectionner une date pour le menu.");
      return;
    }

    // Validate items
    const validItems = items.map(item => {
      const priceNum = parseFloat(item.price);
      return {
        name: item.name.trim(),
        category: item.category,
        price: isNaN(priceNum) ? 0 : priceNum,
        photoUrl: item.photoUrl?.trim() || undefined
      };
    });

    const emptyNames = validItems.some(item => !item.name);
    if (emptyNames) {
      setError("Tous les plats du menu doivent avoir un nom.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await addMenuDuJour({
        establishmentId,
        date: menuDate,
        items: validItems
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Erreur de publication du menu du jour :", err);
      setError("Impossible de publier le menu du jour. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-950 w-full max-w-2xl rounded-3xl shadow-2xl border border-gray-150 dark:border-gray-900 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/20 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-orange-600 animate-pulse" />
            <div>
              <h2 className="text-lg font-black text-gray-900 dark:text-white">Menu du jour</h2>
              <p className="text-xs text-orange-600 dark:text-orange-400 font-bold">{est?.name || 'Restaurant'}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 bg-gray-100 dark:bg-gray-900 rounded-full cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content & Left Duplication Panel */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100 dark:divide-gray-900">
          
          {/* Previous Menus List (1/3rd space on desktop) */}
          <div className="p-4 bg-gray-50/50 dark:bg-gray-900/10 space-y-3 max-h-[300px] md:max-h-none overflow-y-auto">
            <h3 className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Copy className="w-3.5 h-3.5 text-orange-600" /> Dupliquer un menu
            </h3>
            <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
              Gagnez du temps en dupliquant un menu du jour déjà publié ci-dessous.
            </p>

            {previousMenus.length === 0 ? (
              <p className="text-xs text-gray-400 font-medium italic py-2">Aucun menu précédent trouvé.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {previousMenus.map(menu => (
                  <button
                    key={menu.id}
                    type="button"
                    onClick={() => handleDuplicateMenu(menu)}
                    className="p-2.5 text-left bg-white dark:bg-gray-900 hover:bg-orange-50 dark:hover:bg-orange-950/20 border border-gray-150 dark:border-gray-800 rounded-xl transition-all flex flex-col gap-1 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[10px] font-bold text-gray-800 dark:text-gray-200">
                        {new Date(menu.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </span>
                      <span className="text-[9px] font-black text-orange-600 bg-orange-50 dark:bg-orange-950/30 px-1.5 py-0.5 rounded group-hover:bg-orange-100 transition-colors">
                        Copier
                      </span>
                    </div>
                    <p className="text-[9px] text-gray-400 font-medium truncate w-full">
                      {menu.items.map(item => item.name).join(', ')}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Form Editor (2/3rds space on desktop) */}
          <form onSubmit={handleSubmit} className="p-6 md:col-span-2 space-y-5 flex flex-col justify-between">
            {success ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-950/50 rounded-full flex items-center justify-center mx-auto">
                  <ChefHat className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">Menu publié avec succès !</h3>
                <p className="text-xs text-gray-400 font-medium">Vos clients peuvent désormais le consulter sur votre fiche.</p>
              </div>
            ) : (
              <>
                {/* Date Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Date du menu du jour
                  </label>
                  <input
                    type="date"
                    required
                    value={menuDate}
                    onChange={e => setMenuDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 dark:bg-gray-900 dark:border-gray-800 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                {/* Items Title */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-gray-400 dark:text-gray-500">Plats du menu</label>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="text-xs font-black text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Ajouter un plat
                    </button>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
                    {items.map((item, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-900/60 rounded-2xl border border-gray-150 dark:border-gray-900 flex flex-col gap-2.5 relative">
                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="absolute top-2.5 right-2.5 p-1 bg-white hover:bg-red-50 text-gray-400 hover:text-red-600 border border-gray-150 rounded-lg cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div className="text-[10px] font-bold text-orange-600 mb-0.5">Plat #{idx + 1}</div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Nom du plat (ex: Poulet kedjenou)"
                            value={item.name}
                            onChange={e => handleItemChange(idx, 'name', e.target.value)}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 dark:text-gray-200 outline-none"
                          />

                          <select
                            value={item.category}
                            onChange={e => handleItemChange(idx, 'category', e.target.value)}
                            className="w-full bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 outline-none"
                          >
                            <option value="Petit Déjeuner">🍳 Petit Déjeuner</option>
                            <option value="Déjeuner">🌞 Déjeuner</option>
                            <option value="Dîner">🌙 Dîner</option>
                            <option value="Entrée">🥗 Entrée</option>
                            <option value="Plat">🍛 Plat Principal</option>
                            <option value="Dessert">🍰 Dessert</option>
                            <option value="Boisson">🥤 Boisson</option>
                            <option value="Autre">🍽️ Autre</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-1 relative">
                            <input
                              type="number"
                              required
                              placeholder="Prix (ex: 3500)"
                              value={item.price}
                              onChange={e => handleItemChange(idx, 'price', e.target.value)}
                              className="w-full bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl pl-7 pr-3 py-2 text-xs font-semibold text-gray-800 dark:text-gray-200 outline-none"
                            />
                            <span className="absolute left-2 top-2 text-[10px] text-gray-400 font-bold">F</span>
                          </div>

                          <div className="sm:col-span-2 flex gap-2 items-center">
                            <div className="flex-1">
                              <input
                                type="text"
                                placeholder="Photo URL ou uploader ci-contre"
                                value={item.photoUrl || ''}
                                onChange={e => handleItemChange(idx, 'photoUrl', e.target.value)}
                                className="w-full bg-white dark:bg-gray-900 border border-gray-250 dark:border-gray-800 rounded-xl px-3 py-2 text-xs font-semibold text-gray-800 dark:text-gray-200 outline-none"
                              />
                            </div>
                            <label className="p-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl cursor-pointer flex items-center justify-center text-orange-600 transition-colors flex-shrink-0" title="Uploader une photo">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={e => handleFileChange(idx, e)}
                                className="hidden"
                              />
                              <Upload className="w-4 h-4" />
                            </label>
                          </div>
                        </div>

                        {/* Image Preview & loading */}
                        {uploadingIndex === idx && (
                          <div className="text-[10px] text-orange-600 font-bold animate-pulse">Compression et chargement de l'image...</div>
                        )}
                        {item.photoUrl && (
                          <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-1.5 rounded-lg border border-gray-150">
                            <img
                              src={item.photoUrl}
                              alt="Aperçu"
                              className="w-10 h-10 object-cover rounded"
                              referrerPolicy="no-referrer"
                            />
                            <span className="text-[9px] text-gray-400 font-semibold truncate flex-1">{item.photoUrl.startsWith('data:') ? 'Image uploadée' : item.photoUrl}</span>
                            <button
                              type="button"
                              onClick={() => handleItemChange(idx, 'photoUrl', '')}
                              className="text-[9px] font-black text-red-500 hover:underline px-1.5 py-0.5"
                            >
                              Retirer
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-1.5 flex-shrink-0">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}

                {/* Footer Submit */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-3.5 rounded-xl active:scale-[0.98] transition-all disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-orange-600/10 flex-shrink-0"
                >
                  {isSubmitting ? "Publication..." : "Publier le menu du jour"}
                </button>
              </>
            )}
          </form>

        </div>
      </div>
    </div>
  );
}
