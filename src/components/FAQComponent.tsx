import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Check, 
  ThumbsUp, 
  ThumbsDown, 
  Tag, 
  HelpCircle, 
  Store, 
  User, 
  Scissors, 
  Calendar, 
  Bell, 
  WifiOff, 
  FileSpreadsheet, 
  DollarSign, 
  ShieldCheck 
} from 'lucide-react';

export interface FAQItem {
  id: string;
  category: 'reservations' | 'beauty' | 'notifications' | 'gerants' | 'exports' | 'offline' | 'paiements' | 'visibility' | 'general';
  categoryLabel: string;
  question: string;
  answer: React.ReactNode;
  tags?: string[];
  profile: 'user' | 'manager' | 'both';
}

interface FAQComponentProps {
  faqList: FAQItem[];
  searchQuery?: string;
  selectedCategory?: string;
  onCategorySelect?: (cat: string) => void;
  onTagClick?: (tag: string) => void;
}

export function FAQComponent({ 
  faqList, 
  searchQuery = '', 
  selectedCategory = 'all',
  onCategorySelect,
  onTagClick 
}: FAQComponentProps) {
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'res-accept': true,
    'beauty-rdv': true
  });
  const [audienceFilter, setAudienceFilter] = useState<'all' | 'user' | 'manager'>('all');
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'yes' | 'no'>>({});

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleFeedback = (id: string, value: 'yes' | 'no') => {
    setFeedbackGiven(prev => ({ ...prev, [id]: value }));
    window.dispatchEvent(new CustomEvent('app-toast', {
      detail: { 
        message: value === 'yes' ? "Merci pour votre retour positif !" : "Merci, nous allons clarifier cette réponse.", 
        type: "info" 
      }
    }));
  };

  // Filter items by category, audience, and search query
  const filteredItems = faqList.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesAudience = audienceFilter === 'all' || item.profile === 'both' || item.profile === audienceFilter;
    
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory && matchesAudience;

    const matchesQuery = 
      item.question.toLowerCase().includes(q) ||
      item.categoryLabel.toLowerCase().includes(q) ||
      (item.tags && item.tags.some(t => t.toLowerCase().includes(q)));

    return matchesCategory && matchesAudience && matchesQuery;
  });

  const categoriesWithCounts = [
    { id: 'all', label: 'Toutes', icon: Sparkles },
    { id: 'reservations', label: 'Réservations & Tables', icon: Calendar },
    { id: 'beauty', label: 'ZAKA Beauty & Salons', icon: Scissors },
    { id: 'notifications', label: 'Alertes & Notifications', icon: Bell },
    { id: 'gerants', label: 'Gestion Gérant & Caisse', icon: Store },
    { id: 'offline', label: 'Mode Hors-ligne & PWA', icon: WifiOff },
    { id: 'exports', label: 'Exports CSV & Bilan', icon: FileSpreadsheet },
    { id: 'paiements', label: 'Paiements & FCFA', icon: DollarSign },
    { id: 'visibility', label: 'Visibilité & Avis', icon: ShieldCheck }
  ];

  return (
    <div className="space-y-6">
      {/* Category Pills & Audience Quick Switch */}
      <div className="space-y-3">
        {/* Audience filter */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Filtrer par profil :</span>
          <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-xl border border-gray-200 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setAudienceFilter('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                audienceFilter === 'all'
                  ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Tous ({faqList.length})
            </button>
            <button
              type="button"
              onClick={() => setAudienceFilter('user')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                audienceFilter === 'user'
                  ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <User size={12} />
              <span>Clients ({faqList.filter(i => i.profile === 'user' || i.profile === 'both').length})</span>
            </button>
            <button
              type="button"
              onClick={() => setAudienceFilter('manager')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                audienceFilter === 'manager'
                  ? 'bg-white dark:bg-gray-800 text-orange-600 dark:text-orange-400 shadow-xs'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Store size={12} />
              <span>Gérants ({faqList.filter(i => i.profile === 'manager' || i.profile === 'both').length})</span>
            </button>
          </div>
        </div>

        {/* Category horizontal scroller */}
        {onCategorySelect && (
          <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
            {categoriesWithCounts.map(cat => {
              const count = faqList.filter(item => {
                const matchAud = audienceFilter === 'all' || item.profile === 'both' || item.profile === audienceFilter;
                return matchAud && (cat.id === 'all' || item.category === cat.id);
              }).length;

              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onCategorySelect(cat.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800'
                  }`}
                >
                  <cat.icon size={13} className={isSelected ? 'text-white' : 'text-orange-500'} />
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Accordion Questions List */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-gray-950 rounded-3xl border border-gray-150 dark:border-gray-800 space-y-2">
          <HelpCircle className="w-10 h-10 text-gray-400 mx-auto opacity-60" />
          <h4 className="text-sm font-black text-gray-900 dark:text-white">Aucune question trouvée</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Aucun résultat ne correspond à vos filtres actuels. Réinitialisez la recherche ou sélectionnez une autre catégorie.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => {
            const isOpen = !!openItems[item.id];
            const feedback = feedbackGiven[item.id];

            return (
              <div 
                key={item.id} 
                id={`faq-item-${item.id}`}
                className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs transition-all hover:border-orange-200 dark:hover:border-gray-700"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left hover:bg-gray-50/70 dark:hover:bg-gray-900/60 transition-colors cursor-pointer"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/40">
                        {item.categoryLabel}
                      </span>
                      {item.profile === 'manager' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                          Gérant
                        </span>
                      )}
                      {item.profile === 'user' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                          Client
                        </span>
                      )}
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-snug">
                      {item.question}
                    </h4>
                  </div>
                  <div className="p-1.5 rounded-xl text-gray-400 bg-gray-100 dark:bg-gray-800 shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4 text-orange-600" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-2 text-xs text-gray-700 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-900 space-y-4">
                    <div>{item.answer}</div>

                    {/* Tags */}
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-gray-100 dark:border-gray-900">
                        <Tag size={11} className="text-gray-400" />
                        <span className="text-[10px] text-gray-400 font-bold">Mots-clés :</span>
                        {item.tags.map(t => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => onTagClick && onTagClick(t)}
                            className="text-[10px] bg-gray-100 hover:bg-orange-100 hover:text-orange-700 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-md font-medium transition-colors cursor-pointer"
                          >
                            #{t}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Helpful Feedback Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-900">
                      <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                        Cette réponse vous a-t-elle aidé(e) ?
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleFeedback(item.id, 'yes')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            feedback === 'yes'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'
                          }`}
                        >
                          <ThumbsUp size={12} />
                          <span>Oui</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(item.id, 'no')}
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            feedback === 'no'
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300'
                              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-rose-50 hover:text-rose-600'
                          }`}
                        >
                          <ThumbsDown size={12} />
                          <span>Non</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
