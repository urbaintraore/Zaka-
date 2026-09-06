import { useState, useEffect, useCallback } from 'react';
import { triggerHaptic } from '../utils/haptics';

const STORAGE_KEY = 'zaka_recent_searches';
const MAX_HISTORY = 8;

export function useSearchHistory() {
  const [history, setHistory] = useState<string[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistory(parsed.filter(item => typeof item === 'string' && item.trim().length > 0));
        }
      }
    } catch (e) {
      console.warn('Failed to load search history:', e);
    }
  }, []);

  // Save term to history
  const addSearchTerm = useCallback((term: string) => {
    const cleanTerm = term.trim();
    if (!cleanTerm || cleanTerm.length < 2) return;

    setHistory(prev => {
      // Remove term if already present, then prepend
      const filtered = prev.filter(item => item.toLowerCase() !== cleanTerm.toLowerCase());
      const updated = [cleanTerm, ...filtered].slice(0, MAX_HISTORY);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist search history:', e);
      }
      return updated;
    });
  }, []);

  // Remove a single item
  const removeSearchTerm = useCallback((term: string) => {
    triggerHaptic('light');
    setHistory(prev => {
      const updated = prev.filter(item => item !== term);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn('Failed to persist search history:', e);
      }
      return updated;
    });
  }, []);

  // Clear all history
  const clearHistory = useCallback(() => {
    triggerHaptic('medium');
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear search history:', e);
    }
  }, []);

  return {
    history,
    addSearchTerm,
    removeSearchTerm,
    clearHistory
  };
}
