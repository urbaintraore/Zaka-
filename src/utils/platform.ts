import { Share } from '@capacitor/share';
import { Clipboard } from '@capacitor/clipboard';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export async function shareContent(options: { title: string; text?: string; url?: string }): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      const canShareResult = await Share.canShare();
      if (canShareResult.value) {
        await Share.share({
          title: options.title,
          text: options.text,
          url: options.url || window.location.href,
          dialogTitle: 'Partager',
        });
        return;
      }
    } catch (error) {
      console.error('Erreur de partage natif:', error);
    }
  }

  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: options.title,
        text: options.text,
        url: options.url || window.location.href,
      });
      return;
    } catch (error) {
      console.warn('Erreur lors du partage web:', error);
    }
  }

  try {
    const shareUrl = options.url || window.location.href;
    await copyToClipboard(shareUrl);
    alert('Lien copié dans le presse-papier !');
  } catch (err) {
    console.error('Impossible de copier le lien:', err);
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
