/**
 * Service Worker registration and offline state management
 */

export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Zaka Service Worker enregistré avec succès:', registration.scope);
        })
        .catch((error) => {
          console.warn('Échec enregistrement Service Worker:', error);
        });
    });

    // Notify app on connectivity changes
    window.addEventListener('online', () => {
      window.dispatchEvent(new CustomEvent('app-network-status', { detail: { isOnline: true } }));
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: "Connexion Internet rétablie. Données synchronisées.", type: "success" }
      }));
    });

    window.addEventListener('offline', () => {
      window.dispatchEvent(new CustomEvent('app-network-status', { detail: { isOnline: false } }));
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: { message: "Mode hors-ligne actif. Les profils et images en cache restent accessibles.", type: "info" }
      }));
    });
  }
}
