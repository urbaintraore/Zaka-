/**
 * Haptic Feedback utility using Web Vibration API
 */
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function triggerHaptic(type: HapticType = 'light'): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // Check for Vibration API support
  if (!('vibrate' in navigator)) {
    return false;
  }

  try {
    switch (type) {
      case 'light':
        // Short subtle tap (15ms)
        navigator.vibrate(15);
        break;
      case 'medium':
        // Distinct standard tap (30ms)
        navigator.vibrate(30);
        break;
      case 'heavy':
        // Strong tactile pulse (60ms)
        navigator.vibrate(60);
        break;
      case 'success':
        // Positive double-tap confirmation pattern: tap - pause - stronger tap
        navigator.vibrate([20, 60, 40]);
        break;
      case 'warning':
        // Warning alert pattern: double pulse
        navigator.vibrate([40, 50, 40]);
        break;
      case 'error':
        // Error pattern: triple buzz
        navigator.vibrate([60, 40, 60, 40, 80]);
        break;
      default:
        navigator.vibrate(20);
    }
    return true;
  } catch (err) {
    // Gracefully ignore devices that reject or throw on vibrate
    return false;
  }
}

export function triggerHapticFeedback(pattern: number | number[] = 30): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  if (!('vibrate' in navigator)) {
    return false;
  }
  try {
    navigator.vibrate(pattern);
    return true;
  } catch {
    return false;
  }
}

