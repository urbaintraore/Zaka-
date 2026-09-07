import React, { useState } from 'react';
import { Smile, Sparkles, X, ChevronUp } from 'lucide-react';
import { triggerHapticFeedback } from '../utils/haptics';

export interface PredefinedEmoji {
  emoji: string;
  label: string;
}

export const PREDEFINED_STORY_EMOJIS: PredefinedEmoji[] = [
  { emoji: '🔥', label: 'Enjaillé / Chaud' },
  { emoji: '❤️', label: 'J\'adore' },
  { emoji: '😂', label: 'MDR' },
  { emoji: '👏', label: 'Bravo' },
  { emoji: '🎉', label: 'La fête' },
  { emoji: '🍹', label: 'Tchin / Sortie' },
  { emoji: '😍', label: 'Sublime' },
  { emoji: '⚡', label: 'Énergie pure' },
  { emoji: '🤩', label: 'Étoilé' },
  { emoji: '💃', label: 'Danse' },
  { emoji: '🥂', label: 'Santé' },
  { emoji: '🚀', label: 'Au top' },
  { emoji: '💯', label: '100%' },
  { emoji: '👑', label: 'VIP / Boss' },
  { emoji: '😮', label: 'Wouah' },
  { emoji: '✨', label: 'Magique' },
  { emoji: '🥳', label: 'Fiesta' },
  { emoji: '🤤', label: 'Délicieux' },
  { emoji: '😎', label: 'Swag / Chill' },
  { emoji: '🙌', label: 'Respect' },
  { emoji: '🦁', label: 'Force Étalon' },
  { emoji: '🥇', label: 'Numéro 1' }
];

export const PRIMARY_STORY_EMOJIS = ['🔥', '❤️', '😂', '👏', '🎉', '🍹'];

interface StoryEmojiReactionPickerProps {
  currentReaction?: string | null;
  reactions?: Record<string, string>; // userId -> emoji
  onReact: (emoji: string) => void;
  onShowReactionsDetail?: () => void;
}

export function StoryEmojiReactionPicker({
  currentReaction,
  reactions = {},
  onReact,
  onShowReactionsDetail
}: StoryEmojiReactionPickerProps) {
  const [showFullPalette, setShowFullPalette] = useState(false);

  // Group reactions by emoji counts
  const reactionCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(reactions).forEach(emoji => {
      counts[emoji] = (counts[emoji] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [reactions]);

  const handleSelect = (emoji: string) => {
    triggerHapticFeedback(40);
    onReact(emoji);
    setShowFullPalette(false);
  };

  return (
    <div className="flex flex-col gap-2 w-full select-none">
      {/* Existing reactions summary badges if any */}
      {reactionCounts.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap px-1">
          {reactionCounts.map(([emoji, count]) => (
            <button
              key={emoji}
              type="button"
              onClick={onShowReactionsDetail}
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold backdrop-blur-md transition-all cursor-pointer ${
                currentReaction === emoji 
                  ? 'bg-orange-500/80 text-white ring-1 ring-white/60 shadow-xs' 
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
              title={`${count} réaction${count > 1 ? 's' : ''} ${emoji}`}
            >
              <span className="text-sm">{emoji}</span>
              <span className="text-[11px] font-black">{count}</span>
            </button>
          ))}
          {currentReaction && (
            <span className="text-[10px] text-white/75 font-semibold ml-1">
              (Votre réaction : {currentReaction})
            </span>
          )}
        </div>
      )}

      {/* Expanded full predefined emoji palette modal/drawer */}
      {showFullPalette && (
        <div className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl p-3 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200 z-30">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Choisir un émoji de réaction</span>
            </div>
            <button
              type="button"
              onClick={() => setShowFullPalette(false)}
              className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
            {PREDEFINED_STORY_EMOJIS.map(({ emoji, label }) => {
              const isSelected = currentReaction === emoji;
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSelect(emoji)}
                  className={`p-2 rounded-xl flex flex-col items-center justify-center gap-0.5 text-center transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-orange-500 text-white scale-105 shadow-md ring-2 ring-white/80' 
                      : 'bg-white/10 hover:bg-white/20 text-white active:scale-95'
                  }`}
                  title={label}
                >
                  <span className="text-2xl leading-none">{emoji}</span>
                  <span className="text-[9px] font-medium opacity-80 truncate max-w-full">
                    {label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary quick reaction bar */}
      <div className="flex items-center justify-between gap-1 px-2 py-1.5 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
        <div className="flex items-center justify-around flex-1">
          {PRIMARY_STORY_EMOJIS.map(emoji => {
            const isSelected = currentReaction === emoji;
            return (
              <button
                key={emoji}
                type="button"
                onClick={() => handleSelect(emoji)}
                className={`text-2xl hover:scale-125 active:scale-90 transition-transform cursor-pointer relative p-1 ${
                  isSelected ? 'scale-115' : ''
                }`}
                title={`Réagir avec ${emoji}`}
              >
                {emoji}
                {isSelected && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-400" />
                )}
              </button>
            );
          })}
        </div>

        {/* Plus / All Emojis Toggle Button */}
        <button
          type="button"
          onClick={() => setShowFullPalette(!showFullPalette)}
          className={`px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
            showFullPalette 
              ? 'bg-orange-500 text-white' 
              : 'bg-white/15 text-white hover:bg-white/25'
          }`}
          title="Plus d'émojis prédéfinis"
        >
          <Smile className="w-3.5 h-3.5" />
          <ChevronUp className={`w-3 h-3 transition-transform ${showFullPalette ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
}
