/**
 * Safe, cross-platform utility to trigger a tactile vibration (haptic feedback).
 * Wraps navigator.vibrate with error boundaries and feature detection.
 * 
 * @param pattern duration in ms (e.g. 50) or sequence of vibrations/pauses (e.g. [50, 30, 50])
 */
export function triggerHapticFeedback(pattern: number | number[] = 50) {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {
      console.warn('Haptic feedback not supported or blocked in this environment:', e);
    }
  }
}
