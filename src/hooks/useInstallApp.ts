import { useState, useEffect } from 'react';

export function useInstallApp() {
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const checkInstallable = () => {
      if ((window as any).deferredPWAInstallPrompt) {
        setIsInstallable(true);
      } else {
        setIsInstallable(false);
      }
    };

    // Initial check
    checkInstallable();

    // Listeners for events fired by index.html script
    window.addEventListener('pwa-installable', checkInstallable);
    window.addEventListener('pwa-installed', checkInstallable);

    return () => {
      window.removeEventListener('pwa-installable', checkInstallable);
      window.removeEventListener('pwa-installed', checkInstallable);
    };
  }, []);

  const promptInstall = async () => {
    const promptEvent = (window as any).deferredPWAInstallPrompt;
    if (!promptEvent) {
      console.log('No deferred prompt available');
      return;
    }
    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      console.log(`User interaction outcome: ${outcome}`);
      if (outcome === 'accepted') {
        (window as any).deferredPWAInstallPrompt = null;
        setIsInstallable(false);
      }
    } catch (error) {
      console.error('Error prompting install:', error);
    }
  };

  return { isInstallable, promptInstall };
}
