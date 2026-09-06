import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export interface ShareOptions {
  title: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}

export async function shareContent(options: ShareOptions): Promise<boolean> {
  const shareUrl = options.url || (typeof window !== 'undefined' ? window.location.href : '');
  const shareTitle = options.title || 'Zaka+';
  const shareText = options.text || '';
  const dialogTitle = options.dialogTitle || 'Partager sur vos réseaux ou messageries';

  // 1. Try Capacitor Share first (Android, iOS and supported environments)
  try {
    const canShareResult = await Share.canShare();
    if (canShareResult && canShareResult.value) {
      await Share.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
        dialogTitle: dialogTitle,
      });
      return true;
    }
  } catch (error) {
    console.warn('Notice vérification Share.canShare:', error);
  }

  // 2. Direct attempt with Capacitor Share on native platform
  if (Capacitor.isNativePlatform()) {
    try {
      await Share.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
        dialogTitle: dialogTitle,
      });
      return true;
    } catch (error) {
      console.warn('Erreur Share.share natif:', error);
    }
  }

  // 3. Fallback to standard Web Share API if supported
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      return true;
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        return false;
      }
      console.warn('Erreur lors du partage web:', error);
    }
  }

  // 4. Fallback: Copy link to clipboard with Toast feedback (no alert)
  try {
    await copyToClipboard(shareUrl);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app-toast', {
        detail: {
          message: 'Lien de la fiche copié dans le presse-papier !',
          type: 'info'
        }
      }));
    }
    return true;
  } catch (err) {
    console.error('Impossible de copier le lien:', err);
    return false;
  }
}

export function getSocialShareUrl(platform: 'whatsapp' | 'facebook' | 'twitter' | 'telegram', options: ShareOptions): string {
  const url = encodeURIComponent(options.url || (typeof window !== 'undefined' ? window.location.href : ''));
  const text = encodeURIComponent((options.title ? `${options.title}\n` : '') + (options.text ? `${options.text}\n` : ''));

  switch (platform) {
    case 'whatsapp':
      return `https://api.whatsapp.com/send?text=${text}${url}`;
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
    case 'telegram':
      return `https://t.me/share/url?url=${url}&text=${text}`;
  }
}

export async function copyToClipboard(text: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Clipboard.write({
        string: text,
      });
      return;
    } catch (error) {
      console.error('Erreur Clipboard natif:', error);
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(textArea);
  }
}

export async function openBrowserUrl(url: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      await Browser.open({ url });
      return;
    } catch (error) {
      console.error('Erreur Browser natif:', error);
    }
  }
  window.open(url, '_blank');
}
