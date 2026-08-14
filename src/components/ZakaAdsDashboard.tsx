import React, { useState } from 'react';
import { AdvertiserDashboard } from './AdvertiserDashboard';
import { ZakaAdsManager } from './ads/ZakaAdsManager';
import { Layers, Sparkles } from 'lucide-react';

export const ZakaAdsDashboard: React.FC = () => {
  const [mode, setMode] = useState<'express' | 'manager'>('manager');

  return (
    <div className="space-y-4">
      {/* Mode Selector Header */}
      <div className="bg-white dark:bg-gray-800 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-orange-500" />
          <span className="font-extrabold text-xs text-gray-900 dark:text-white uppercase tracking-wider">
            Mode ZAKA Ads :
          </span>
        </div>

        <div className="flex gap-1.5 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
          <button
            onClick={() => setMode('manager')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1.5 ${
              mode === 'manager'
                ? 'bg-amber-500 text-gray-950 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>ZAKA Ads Manager (B2B Pro)</span>
          </button>

          <button
            onClick={() => setMode('express')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
              mode === 'express'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <span>ZAKA Ads Express (Standard)</span>
          </button>
        </div>
      </div>

      {mode === 'manager' ? <ZakaAdsManager /> : <AdvertiserDashboard />}
    </div>
  );
};

