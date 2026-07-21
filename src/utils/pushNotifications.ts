/**
 * Browser-level Push and Local Notification Utility for Zaka+
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.warn("Ce navigateur ne supporte pas les notifications de bureau.");
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export async function sendPushNotification(title: string, body: string, urlPath?: string) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.log("Notification non envoyée: permission non accordée ou non supportée.", { title, body });
    return;
  }

  // Play a soft notification sound if audio is allowed, or trigger vibration
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }

  // Try to send via active Service Worker if available (proper PWA push standard)
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.ready;
    if (registration && 'showNotification' in registration) {
      registration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'zaka-notification',
        renotify: true,
        data: {
          url: urlPath || window.location.href
        }
      } as any);
      return;
    }
  }

  // Fallback to standard client-side Notification
  try {
    const notif = new Notification(title, {
      body,
      icon: '/icon-192.png',
      tag: 'zaka-notification'
    });
    notif.onclick = () => {
      window.focus();
      if (urlPath) {
        window.location.hash = urlPath;
      }
    };
  } catch (error) {
    console.error("Erreur lors de l'affichage de la notification:", error);
  }
}
