import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAppStore } from '../store';

export function ThemeModeSelector({ className, showDescription }: { className?: string; showDescription?: boolean }) {
  const { theme, setTheme } = useAppStore();

  return (
    <div className={`flex items-center gap-1 bg-gray-100 p-1 rounded-xl ${className || ''}`}>
      <button
        onClick={() => setTheme('light')}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
          theme === 'light' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-800'
        }`}
      >
        <Sun size={14} />
        <span>Clair</span>
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
          theme === 'dark' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800'
        }`}
      >
        <Moon size={14} />
        <span>Sombre</span>
      </button>
    </div>
  );
}
