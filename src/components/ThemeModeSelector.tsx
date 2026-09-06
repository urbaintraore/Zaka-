import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store';
import { Sun, Moon, Laptop, Sparkles } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';

interface ThemeModeSelectorProps {
  className?: string;
  showDescription?: boolean;
}

export function ThemeModeSelector({ className = '', showDescription = true }: ThemeModeSelectorProps) {
  const { theme, setTheme } = useAppStore();
  const [currentSetting, setCurrentSetting] = useState<'light' | 'dark' | 'auto'>('auto');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('app-theme');
      if (saved === 'light' || saved === 'dark') {
        setCurrentSetting(saved);
      } else {
        setCurrentSetting('auto');
      }
    } catch {
      setCurrentSetting('auto');
    }
  }, [theme]);

  const handleSelect = (mode: 'light' | 'dark' | 'auto') => {
    triggerHaptic('light');
    setCurrentSetting(mode);
    setTheme(mode);
  };

  return (
    <div className={`bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-3.5 sm:p-4 flex flex-col gap-2.5 transition-all ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
          {theme === 'dark' ? (
            <Moon className="w-3.5 h-3.5 text-orange-500" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-orange-500" />
          )}
          Thème d'affichage
        </span>

        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          {currentSetting === 'light'
            ? '☀️ Clair forcé'
            : currentSetting === 'dark'
            ? '🌙 Sombre forcé'
            : '⚙️ Système (Auto)'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-1.5 bg-gray-200/80 dark:bg-gray-800/90 p-1 rounded-xl">
        <button
          type="button"
          onClick={() => handleSelect('light')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            currentSetting === 'light'
              ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm font-black scale-[1.02]'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Clair</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelect('dark')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            currentSetting === 'dark'
              ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm font-black scale-[1.02]'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Sombre</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelect('auto')}
          className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            currentSetting === 'auto'
              ? 'bg-white dark:bg-gray-700 text-orange-600 dark:text-orange-400 shadow-sm font-black scale-[1.02]'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>Système</span>
        </button>
      </div>

      {showDescription && (
        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">
          Forcez manuellement le mode clair ou sombre indépendamment des réglages automatiques de votre appareil.
        </p>
      )}
    </div>
  );
}
