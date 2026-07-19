import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
let isInstallableGlobal = false;
const listeners = new Set<(isInstallable: boolean) => void>();

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e as BeforeInstallPromptEvent;
  isInstallableGlobal = true;
  listeners.forEach(listener => listener(true));
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  isInstallableGlobal = false;
  listeners.forEach(listener => listener(false));
});

export function useInstallApp() {
  const [isInstallable, setIsInstallable] = useState(isInstallableGlobal);

  useEffect(() => {
    const listener = (val: boolean) => setIsInstallable(val);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      console.log('No deferred prompt available');
      return;
    }
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User interaction outcome: ${outcome}`);
      if (outcome === 'accepted') {
        deferredPrompt = null;
        isInstallableGlobal = false;
        setIsInstallable(false);
      }
    } catch (error) {
      console.error('Error prompting install:', error);
    }
  };

  return { isInstallable, promptInstall };
}
