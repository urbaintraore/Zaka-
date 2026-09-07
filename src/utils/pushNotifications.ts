/**
 * Browser-level Push and Local Notification Utility for Zaka+
 */

export function getNotificationPermissionStatus(): 'granted' | 'denied' | 'default' | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<boolean> {
  try {
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
  } catch (error) {
    // Ignore DOMException when requested inside cross-origin iframe
    return false;
  }

  return false;
}

/**
 * Play a gentle, pleasant synthetic chime for real-time notifications
 */
export function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // First bell note (D5 -> A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.08);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Second cheerful bell note (A5 -> D6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.22);
    gain2.gain.setValueAtTime(0.22, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.65);
  } catch {
    // AudioContext blocked or not supported
  }
}

export async function sendPushNotification(title: string, body: string, urlPath?: string) {
  // Always trigger sound & haptics when an alert occurs
  playNotificationChime();
  if (navigator.vibrate) {
    navigator.vibrate([120, 60, 120]);
  }

  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.log("Notification de bureau ignorée (permission non accordée):", { title, body });
    return;
  }

  // Try to send via active Service Worker if available (proper PWA push standard)
  if ('serviceWorker' in navigator) {
    try {
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
    } catch {
      // Service worker fallback to new Notification below
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

/**
 * Dispatch instant push notification when a new friend request is received
 */
export async function sendFriendRequestPushNotification(requesterName: string) {
  return sendPushNotification(
    "Nouvelle demande d'amitié reçue 🤝",
    `${requesterName} souhaite vous ajouter comme ami(e) sur ZAKA ! Cliquez pour voir la demande.`,
    "#profile"
  );
}

