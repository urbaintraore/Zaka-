import { useState, FormEvent } from 'react';
import { useAppStore } from '../store';
import { Heart, MapPin, MessageSquare, Calendar, Tag, Plus, X, Filter, Edit2, Trash2, Check } from 'lucide-react';
import { ReservationModal } from '../components/ReservationModal';
import { AnimatePresence, motion } from 'motion/react';

interface FavoritesViewProps {
  onStartChat?: (estId: string) => void;
}

const PREDEFINED_TAGS = ['À tester', 'Mes habitudes', 'À visiter', 'En famille', 'Entre amis', 'Pour bosser'];

const getTagStyles = (tag: string) => {
  switch (tag) {
    case 'À tester':
      return 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100/65 dark:border-amber-900/40';
    case 'Mes habitudes':
      return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100/65 dark:border-emerald-900/40';
    case 'À visiter':
      return 'bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-100/65 dark:border-violet-900/40';
    case 'En famille':
      return 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-100/65 dark:border-teal-900/40';
    case 'Entre amis':
      return 'bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-100/65 dark:border-pink-900/40';
    case 'Pour bosser':
      return 'bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 border border-sky-100/65 dark:border-sky-900/40';
    default:
      return 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-100/60 dark:border-orange-950/80';
  }
};

export function FavoritesView({ onStartChat }: FavoritesViewProps) {
  const { 
    currentUser, 
    favorites, 
    favoriteTags = {}, 
    establishments, 
    toggleFavorite, 
    updateFavoriteTags,
    saveAllFavoriteTags,
    createServiceRequest 
  } = useAppStore();
  
  const [reservationEst, setReservationEst] = useState<{ id: string, name: string } | null>(null);
  const [editingTagsEst, setEditingTagsEst] = useState<{ id: string, name: string } | null>(null);
  const [newCustomTag, setNewCustomTag] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);

  // New Tag management states
  const [isManagingAllTags, setIsManagingAllTags] = useState(false);
  const [renamingTag, setRenamingTag] = useState<string | null>(null);
  const [renamedTagValue, setRenamedTagValue] = useState('');

  if (!currentUser) {
    return (
      <div className="p-4 text-center mt-12 max-w-sm mx-auto">
        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Heart className="w-10 h-10 text-gray-300 dark:text-gray-650" />
        </div>
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Connectez-vous</h2>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Pour sauvegarder vos établissements favoris et les retrouver facilement.</p>
      </div>
    );
  }

  const myFavIds = favorites[currentUser.id] || [];
  const myFavs = establishments.filter(e => myFavIds.includes(e.id));
  const myTagsMap = favoriteTags[currentUser.id] || {};

  // Find all unique tags used by this user to populate the filter row and suggestions
  const allUserTags = Array.from(
    new Set(
      Object.values(myTagsMap).flatMap(tags => (tags as string[]) || [])
    )
  ) as string[];

  // Suggestions for the edit modal includes predefined tags + any custom tags the user has active
  const SUGGESTIONS = Array.from(new Set([...PREDEFINED_TAGS, ...allUserTags]));

  // Filtered list based on selectedTagFilter
  const filteredFavs = myFavs.filter(est => {
    if (!selectedTagFilter) return true;
    const tags = myTagsMap[est.id] || [];
    return tags.includes(selectedTagFilter);
  });

  const handleReservationSubmit = (data: { reservationType: string, date: string, time: string, guests: number, details: string }) => {
    if (!currentUser || !reservationEst) return;
    const isAnniv = data.reservationType === 'anniversaire';
    createServiceRequest({
      clientId: currentUser.id,
      establishmentId: reservationEst.id,
      type: isAnniv ? 'anniversaire' : 'reservation',
      details: `Date: ${data.date} à ${data.time} | Places: ${data.guests} | Type: ${data.reservationType}${data.details ? ` | Note: ${data.details}` : ''}`
    });
  };

  const handleToggleTag = (estId: string, tag: string) => {
    const currentTags = myTagsMap[estId] || [];
    const updatedTags = currentTags.includes(tag)
      ? currentTags.filter(t => t !== tag)
      : [...currentTags, tag];
    updateFavoriteTags(currentUser.id, estId, updatedTags);
  };

  const handleAddCustomTag = (e: FormEvent) => {
    e.preventDefault();
    if (!editingTagsEst) return;
    const tag = newCustomTag.trim();
    if (!tag) return;

    const currentTags = myTagsMap[editingTagsEst.id] || [];
    if (!currentTags.includes(tag)) {
      updateFavoriteTags(currentUser.id, editingTagsEst.id, [...currentTags, tag]);
    }
    setNewCustomTag('');
  };

  const handleRemoveTag = (estId: string, tag: string) => {
    const currentTags = myTagsMap[estId] || [];
    const updatedTags = currentTags.filter(t => t !== tag);
    updateFavoriteTags(currentUser.id, estId, updatedTags);
  };

  // Global rename of a tag across all favorites
  const handleRenameTagGlobally = (oldTag: string, newTag: string) => {
    const trimmedNew = newTag.trim();
    if (!trimmedNew || trimmedNew === oldTag) {
      setRenamingTag(null);
      return;
    }
    
    const updatedTagsMap = { ...myTagsMap };
    
    Object.keys(updatedTagsMap).forEach(estId => {
      const tags = updatedTagsMap[estId] || [];
      if (tags.includes(oldTag)) {
        updatedTagsMap[estId] = tags.map(t => t === oldTag ? trimmedNew : t);
      }
    });
    
    saveAllFavoriteTags(currentUser.id, updatedTagsMap);
    
    if (selectedTagFilter === oldTag) {
      setSelectedTagFilter(trimmedNew);
    }
    
    setRenamingTag(null);
  };

  // Global delete of a tag across all favorites
  const handleDeleteTagGlobally = (tagToDelete: string) => {
    const updatedTagsMap = { ...myTagsMap };
    
    Object.keys(updatedTagsMap).forEach(estId => {
      const tags = updatedTagsMap[estId] || [];
      if (tags.includes(tagToDelete)) {
        updatedTagsMap[estId] = tags.filter(t => t !== tagToDelete);
      }
    });
    
    saveAllFavoriteTags(currentUser.id, updatedTagsMap);
    
    if (selectedTagFilter === tagToDelete) {
      setSelectedTagFilter(null);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-4">Mes Favoris</h2>
      
      {/* Filters bar */}
      {myFavs.length > 0 && (
        <div className="mb-6 bg-gray-50 dark:bg-gray-900/60 p-4 rounded-2xl border border-gray-100 dark:border-gray-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              <Filter className="w-3.5 h-3.5" />
              Filtrer par étiquette
            </div>
            
            <button 
              onClick={() => setIsManagingAllTags(true)}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1 cursor-pointer bg-orange-50 dark:bg-orange-950/30 px-2.5 py-1 rounded-lg border border-orange-100/30 dark:border-orange-950/50"
            >
              <Tag className="w-3 h-3" />
              Gérer les étiquettes
            </button>
          </div>
          
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x">
            <button
              onClick={() => setSelectedTagFilter(null)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                !selectedTagFilter
                  ? 'bg-orange-600 text-white shadow-sm shadow-orange-500/20'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-750'
              }`}
            >
              Tout ({myFavs.length})
            </button>
            {PREDEFINED_TAGS.map(tag => {
              const count = myFavs.filter(est => (myTagsMap[est.id] || []).includes(tag)).length;
              if (count === 0 && !allUserTags.includes(tag)) return null;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTagFilter(tag)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                    selectedTagFilter === tag
                      ? 'bg-orange-600 text-white shadow-sm shadow-orange-500/20'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-750'
                  }`}
                >
                  {tag} {count > 0 && `(${count})`}
                </button>
              );
            })}
            {/* Display other custom user tags if any */}
            {allUserTags.filter(tag => !PREDEFINED_TAGS.includes(tag)).map(tag => {
              const count = myFavs.filter(est => (myTagsMap[est.id] || []).includes(tag)).length;
              return (
                <button
                  key={tag}
                  onClick={() => setSelectedTagFilter(tag)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 ${
                    selectedTagFilter === tag
                      ? 'bg-orange-600 text-white shadow-sm shadow-orange-500/20'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-750'
                  }`}
                >
                  {tag} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <AnimatePresence mode="popLayout">
          {filteredFavs.map(est => {
            const tags = myTagsMap[est.id] || [];
            return (
              <motion.div 
                key={est.id} 
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-750 p-3 flex gap-4 items-start sm:items-center relative"
              >
                <img 
                  src={est.photos[0] || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200'} 
                  alt={est.name} 
                  className="w-20 h-20 rounded-xl object-cover flex-shrink-0" 
                />
                <div className="flex flex-col justify-center flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white text-[16px] truncate">{est.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mt-0.5 font-medium truncate">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{est.neighborhood}</span>
                  </div>

                  {/* Render Tags Badges */}
                  <div className="flex flex-wrap gap-1 mt-2 items-center">
                    {tags.map(t => (
                      <span 
                        key={t} 
                        className={`inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${getTagStyles(t)}`}
                      >
                        {t}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveTag(est.id, t);
                          }}
                          className="hover:bg-black/10 dark:hover:bg-white/10 rounded p-0.5 cursor-pointer"
                          title="Retirer l'étiquette"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    <button 
                      onClick={() => setEditingTagsEst({ id: est.id, name: est.name })}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold bg-gray-50 dark:bg-gray-700/50 hover:bg-orange-50 dark:hover:bg-orange-950/30 text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 rounded-md border border-gray-150 dark:border-gray-700 transition-colors cursor-pointer"
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {tags.length > 0 ? 'Gérer' : 'Étiqueter'}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center shrink-0 self-center">
                  {onStartChat && (
                    <button 
                      onClick={() => onStartChat(est.id)}
                      className="p-2.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-full transition-colors active:scale-90 cursor-pointer"
                      title="Discuter"
                    >
                      <MessageSquare className="w-5 h-5" />
                    </button>
                  )}
                  <button 
                    onClick={() => setReservationEst({ id: est.id, name: est.name })}
                    className="p-2.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 rounded-full transition-colors active:scale-90 cursor-pointer"
                    title="Réserver"
                  >
                    <Calendar className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => toggleFavorite(currentUser.id, est.id)} 
                    className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors active:scale-90 cursor-pointer"
                  >
                    <Heart className="w-5 h-5 fill-red-500" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {myFavs.length > 0 && filteredFavs.length === 0 && (
          <div className="text-center p-8 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800">
            <Tag className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Aucun favori ne correspond à l'étiquette "{selectedTagFilter}".</p>
            <button 
              onClick={() => setSelectedTagFilter(null)}
              className="mt-3 text-xs font-bold text-orange-600 hover:underline cursor-pointer"
            >
              Afficher tout
            </button>
          </div>
        )}

        {myFavs.length === 0 && (
          <div className="text-center p-8 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800">
            <Heart className="w-12 h-12 text-gray-300 dark:text-gray-650 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">Vous n'avez pas encore de favoris.</p>
          </div>
        )}
      </div>

      {reservationEst && (
        <ReservationModal
          establishmentName={reservationEst.name}
          onClose={() => setReservationEst(null)}
          onSubmit={handleReservationSubmit}
        />
      )}

      {/* Tags Customization Modal */}
      <AnimatePresence>
        {editingTagsEst && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md p-6 shadow-xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setEditingTagsEst(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <Tag className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-wider">Organiser</span>
              </div>
              
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">
                {editingTagsEst.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                Associez des étiquettes pour classer et retrouver cet établissement.
              </p>

              {/* Suggestions Toggle */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2.5">
                  Suggestions populaires & personnalisées
                </h4>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map(tag => {
                    const isSelected = (myTagsMap[editingTagsEst.id] || []).includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => handleToggleTag(editingTagsEst.id, tag)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20 scale-102'
                            : 'bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {isSelected && <Plus className="w-3.5 h-3.5 rotate-45 shrink-0" />}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current Active Tags (if custom or any) */}
              {((myTagsMap[editingTagsEst.id] || []).length > 0) && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                    Étiquettes actives
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(myTagsMap[editingTagsEst.id] || []).map(tag => (
                      <span 
                        key={tag}
                        className={`inline-flex items-center gap-1 pl-2.5 pr-1 py-1 text-xs font-bold rounded-lg ${getTagStyles(tag)}`}
                      >
                        {tag}
                        <button 
                          onClick={() => handleRemoveTag(editingTagsEst.id, tag)}
                          className="hover:bg-black/10 dark:hover:bg-white/10 rounded p-0.5 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Add Custom Tag Form */}
              <form onSubmit={handleAddCustomTag} className="mb-6">
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                  Ajouter un tag personnalisé
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCustomTag}
                    onChange={(e) => setNewCustomTag(e.target.value)}
                    placeholder="Ex: Mon QG, À fêter, Romantique..."
                    className="flex-1 px-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/45 border border-gray-100 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-gray-900 dark:text-white"
                    maxLength={20}
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-bold transition-colors shadow-md shadow-orange-500/10 flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </form>

              <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700/60">
                <button
                  onClick={() => setEditingTagsEst(null)}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-black transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Tags Management Modal */}
      <AnimatePresence>
        {isManagingAllTags && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md p-6 shadow-xl relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => {
                  setIsManagingAllTags(false);
                  setRenamingTag(null);
                }}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 text-orange-600 mb-2">
                <Tag className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-wider">Gestion</span>
              </div>
              
              <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">
                Gérer mes étiquettes
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                Renommez ou supprimez vos étiquettes pour réorganiser tous vos favoris en même temps.
              </p>

              <div className="flex flex-col gap-3 mb-6 max-h-[45vh] overflow-y-auto pr-1">
                {SUGGESTIONS.map(tag => {
                  const count = myFavs.filter(est => (myTagsMap[est.id] || []).includes(tag)).length;
                  const isEditingThis = renamingTag === tag;
                  
                  return (
                    <div 
                      key={tag} 
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-150 dark:border-gray-700/50 gap-2"
                    >
                      {isEditingThis ? (
                        <div className="flex items-center gap-1.5 flex-1">
                          <input 
                            type="text" 
                            value={renamedTagValue}
                            onChange={(e) => setRenamedTagValue(e.target.value)}
                            className="flex-1 px-2.5 py-1 text-sm bg-white dark:bg-gray-800 border border-orange-500 rounded-lg focus:outline-none dark:text-white"
                            maxLength={20}
                            autoFocus
                          />
                          <button 
                            onClick={() => handleRenameTagGlobally(tag, renamedTagValue)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-lg cursor-pointer"
                            title="Confirmer"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => setRenamingTag(null)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer"
                            title="Annuler"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 min-w-0 flex-1 justify-between">
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded ${getTagStyles(tag)} shrink-0`}>
                            {tag}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500 font-medium shrink-0">
                            {count} {count > 1 ? 'établissements' : 'établissement'}
                          </span>
                        </div>
                      )}

                      {!isEditingThis && (
                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            onClick={() => {
                              setRenamingTag(tag);
                              setRenamedTagValue(tag);
                            }}
                            className="p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
                            title="Renommer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          
                          <button 
                            onClick={() => {
                              if (confirm(`Voulez-vous vraiment supprimer l'étiquette "${tag}" de tous vos favoris ?`)) {
                                handleDeleteTagGlobally(tag);
                              }
                            }}
                            disabled={count === 0}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              count === 0 
                                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed' 
                                : 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20'
                            }`}
                            title="Supprimer l'étiquette"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-700/60">
                <button
                  onClick={() => {
                    setIsManagingAllTags(false);
                    setRenamingTag(null);
                  }}
                  className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-black transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
