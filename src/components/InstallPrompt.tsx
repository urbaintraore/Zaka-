import React, { useState, useEffect } from 'react';
import { Download, Share, PlusSquare, X, Smartphone } from 'lucide-react';
import { useInstallApp } from '../hooks/useInstallApp';
import { motion, AnimatePresence } from 'motion/react';

export function InstallPrompt() {
  const { isInstallable, promptInstall } = useInstallApp();
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (already installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    // Check if dismissed in this cache session or permanently
    const isDismissed = localStorage.getItem('zaka-install-prompt-dismissed-v2') === 'true';
    if (isDismissed) {
      return;
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Show prompt if it is either directly installable via beforeinstallprompt (Android/Desktop)
    // OR if it is an iOS device that can be manually installed
    if (isInstallable || isIOSDevice) {
      // Delay slightly for better transition experience on page load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('zaka-install-prompt-dismissed-v2', 'true');
  };

  const handleInstallClick = async () => {
    await promptInstall();
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          id="pwa-install-prompt"
          className="fixed bottom-20 left-4 right-4 md:bottom-6 md:right-6 md:left-auto md:max-w-md bg-white dark:bg-gray-900 border border-orange-100 dark:border-gray-800 rounded-2xl shadow-2xl p-5 z-50 flex flex-col gap-4"
        >
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-orange-600 dark:text-orange-400">
                <Smartphone className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                  Installer Zaka+
                </h4>
                <p className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                  Accès instantané & Mode hors-ligne
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Description */}
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
            Installez Zaka+ sur l'écran d'accueil de votre téléphone pour une navigation fluide, plus rapide, et pour consulter vos maquis, restos et boîtes de nuit préférés même hors-ligne.
          </p>

          {/* iOS Instructions */}
          {isIOS ? (
            <div className="bg-orange-50/50 dark:bg-orange-950/10 border border-orange-100 dark:border-orange-900/40 rounded-xl p-3.5 flex flex-col gap-2.5 text-xs">
              <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                Sur iPhone / iPad :
              </span>
              <div className="flex items-start gap-2.5 text-gray-600 dark:text-gray-300">
                <div className="w-5 h-5 rounded-md bg-white dark:bg-gray-800 shadow-sm border border-orange-100 dark:border-gray-800 flex items-center justify-center shrink-0">
                  <Share className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                </div>
                <span>
                  Appuyez sur le bouton de <strong className="text-gray-800 dark:text-white">Partage</strong> dans la barre de Safari (en bas de l'écran).
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-gray-600 dark:text-gray-300">
                <div className="w-5 h-5 rounded-md bg-white dark:bg-gray-800 shadow-sm border border-orange-100 dark:border-gray-800 flex items-center justify-center shrink-0">
                  <PlusSquare className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                </div>
                <span>
                  Faites défiler vers le bas et sélectionnez <strong className="text-gray-800 dark:text-white">« Sur l'écran d'accueil »</strong>.
                </span>
              </div>
            </div>
          ) : (
            /* Android/Desktop Direct button */
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 dark:bg-orange-600 dark:hover:bg-orange-700 text-white font-bold rounded-xl transition-colors shadow-md shadow-orange-600/15 cursor-pointer text-sm"
            >
              <Download className="w-4 h-4" />
              Installer maintenant
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
