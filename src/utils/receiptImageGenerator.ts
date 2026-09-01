import { SaleRecord, Establishment } from '../types';

/**
 * Classifies an item into 'boisson' or 'cuisine'
 */
export function classifyItemCategory(name: string, category?: string): 'boisson' | 'cuisine' {
  if (category === 'cuisine' || category === 'nourriture' || category === 'repas') return 'cuisine';
  if (category === 'boisson' || category === 'bieres' || category === 'liqueurs' || category === 'softs') return 'boisson';
  const n = name.toLowerCase();
  if (
    n.includes('poulet') || n.includes('poisson') || n.includes('grill') || n.includes('frite') ||
    n.includes('attiéké') || n.includes('alloco') || n.includes('plat') || n.includes('brochette') ||
    n.includes('viande') || n.includes('porc') || n.includes('riz') || n.includes('sauce') ||
    n.includes('soupe') || n.includes('burger') || n.includes('sandwich') || n.includes('pizza') ||
    n.includes('nugget') || n.includes('salade') || n.includes('menu') || n.includes('chawarma') ||
    n.includes('repas') || n.includes('cuisine')
  ) {
    return 'cuisine';
  }
  return 'boisson';
}

/**
 * Helper to draw a dashed horizontal line on canvas context
 */
function drawDashedLine(ctx: CanvasRenderingContext2D, y: number, padding: number, width: number) {
  ctx.beginPath();
  ctx.setLineDash([6, 4]);
  ctx.strokeStyle = '#D1D5DB';
  ctx.lineWidth = 1.5;
  ctx.moveTo(padding, y);
  ctx.lineTo(width - padding, y);
  ctx.stroke();
  ctx.setLineDash([]);
}

/**
 * Helper to draw a stylized QR code canvas box for Mobile Money
 */
function drawMobileMoneyQR(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(x, y, size, size);
  ctx.strokeStyle = '#1F2937';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, size, size);

  // Corner markers
  const drawCorner = (cx: number, cy: number) => {
    ctx.fillStyle = '#EA580C';
    ctx.fillRect(cx, cy, 16, 16);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(cx + 3, cy + 3, 10, 10);
    ctx.fillStyle = '#EA580C';
    ctx.fillRect(cx + 5, cy + 5, 6, 6);
  };
  drawCorner(x + 4, y + 4);
  drawCorner(x + size - 20, y + 4);
  drawCorner(x + 4, y + size - 20);

  // Random QR matrix pattern dots
  ctx.fillStyle = '#374151';
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      if ((i + j) % 2 === 0 && !(i < 2 && j < 2)) {
        ctx.fillRect(x + 24 + i * 5, y + 24 + j * 5, 4, 4);
      }
    }
  }
}

/**
 * Generates a clean, high-resolution receipt PNG image on an HTML5 canvas.
 */
export async function generateReceiptBlob(
  sale: SaleRecord,
  establishment?: Establishment | null
): Promise<Blob> {
  const width = 640;
  const padding = 36;
  const items = sale.items || [];
  
  // Categorize items
  const boissonItems = items.filter(it => classifyItemCategory(it.name, it.category) === 'boisson');
  const cuisineItems = items.filter(it => classifyItemCategory(it.name, it.category) === 'cuisine');

  const subtotalBoissons = sale.subtotalBoissons ?? boissonItems.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);
  const subtotalCuisine = sale.subtotalCuisine ?? cuisineItems.reduce((sum, it) => sum + (it.unitPrice * it.quantity), 0);
  const totalAchat = sale.totalAchat ?? (subtotalBoissons + subtotalCuisine);
  const discountAmount = sale.discountAmount ?? 0;
  const totalNet = sale.totalAmount ?? (totalAchat - discountAmount);

  // Calculate dynamic canvas height
  const headerHeight = 270;
  const metaHeight = 175;
  const drinksHeight = boissonItems.length > 0 ? 50 + boissonItems.length * 32 + 35 : 0;
  const foodHeight = cuisineItems.length > 0 ? 50 + cuisineItems.length * 32 + 35 : 0;
  const totalBlockHeight = 145;
  const mobileMoneyHeight = 135;
  const avoirHeight = (sale.avoirAmount && sale.avoirAmount > 0) || (sale.changeAmount !== undefined) ? 65 : 0;
  const footerHeight = 120;

  const height = headerHeight + metaHeight + drinksHeight + foodHeight + totalBlockHeight + mobileMoneyHeight + avoirHeight + footerHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Draw background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Top accent bar
  ctx.fillStyle = '#EA580C'; // Orange-600
  ctx.fillRect(0, 0, width, 10);

  // Outer Border
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  let currentY = 40;

  // 1. Logo de l'établissement & Badge
  const logoUrl = establishment?.photos?.[0];
  if (logoUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // fallback if image fails to load
        img.src = logoUrl;
      });
      if (img.complete && img.naturalWidth !== 0) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(width / 2, currentY + 30, 30, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(img, width / 2 - 30, currentY, 60, 60);
        ctx.restore();
        currentY += 75;
      } else {
        // Fallback logo icon
        ctx.fillStyle = '#FFF7ED';
        ctx.beginPath();
        ctx.arc(width / 2, currentY + 25, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#EA580C';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.fillStyle = '#EA580C';
        ctx.font = 'bold 20px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText((establishment?.name || 'Z')[0].toUpperCase(), width / 2, currentY + 32);
        currentY += 65;
      }
    } catch (e) {
      currentY += 10;
    }
  } else {
    // Emblem fallback
    ctx.fillStyle = '#FFF7ED';
    ctx.beginPath();
    ctx.arc(width / 2, currentY + 25, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#EA580C';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#EA580C';
    ctx.font = 'bold 20px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText((establishment?.name || 'Z')[0].toUpperCase(), width / 2, currentY + 32);
    currentY += 65;
  }

  // 2. Nom de l'établissement
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  const estName = establishment?.name || 'ZAKA+ RESTO & BAR';
  ctx.fillText(estName.toUpperCase(), width / 2, currentY);
  currentY += 24;

  // 3. Adresse de l'établissement : téléphone, email, pays, ville
  ctx.fillStyle = '#4B5563';
  ctx.font = '12px system-ui, -apple-system, sans-serif';
  const estCityCountry = `${establishment?.city || 'Ouagadougou'}, ${establishment?.neighborhood ? establishment.neighborhood + ' • ' : ''}${establishment?.country || 'Burkina Faso'}`;
  ctx.fillText(estCityCountry, width / 2, currentY);
  currentY += 18;

  const phoneStr = establishment?.phone ? `Tél: ${establishment.phone}` : 'Tél: +226 70 00 00 00';
  const emailStr = `Email: contact@${(establishment?.name || 'zaka').toLowerCase().replace(/[^a-z0-9]/g, '')}.bf`;
  ctx.fillText(`${phoneStr} | ${emailStr}`, width / 2, currentY);
  currentY += 24;

  ctx.fillStyle = '#9CA3AF';
  ctx.font = 'bold 12px monospace';
  ctx.fillText('*** TICKET DE CAISSE OFFICIEL ***', width / 2, currentY);
  currentY += 18;

  drawDashedLine(ctx, currentY, padding, width);
  currentY += 24;

  // 4, 5, 6, 13, 14. Métadonnées : Note Client, Numéro Reçu, Type Client, Serveur, Date & Heure
  ctx.textAlign = 'left';
  ctx.font = '13px monospace';
  ctx.fillStyle = '#374151';

  const saleDateStr = new Date(sale.date).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'medium'
  });

  const receiptNum = sale.id.startsWith('rec-') ? `#REC-${sale.id.slice(4, 12).toUpperCase()}` : `#REC-${sale.id.slice(0, 10).toUpperCase()}`;
  const tableNote = sale.tableNote || 'Table / Sans Note';
  const clientType = sale.clientType || 'Ordinaire';
  const serverName = sale.serverName || sale.cashierName || 'Équipe Service';

  ctx.fillText(`N° Reçu     : ${receiptNum}`, padding, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(`Date: ${saleDateStr}`, width - padding, currentY);
  ctx.textAlign = 'left';
  currentY += 22;

  ctx.fillText(`Note Client : ${tableNote}`, padding, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(`Type Client: ${clientType}`, width - padding, currentY);
  ctx.textAlign = 'left';
  currentY += 22;

  ctx.fillText(`Serveur(se) : ${serverName}`, padding, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(`Caissier: ${sale.cashierName || 'Caisse'}`, width - padding, currentY);
  ctx.textAlign = 'left';
  currentY += 24;

  drawDashedLine(ctx, currentY, padding, width);
  currentY += 24;

  // 7. MENU : BOISSONS & CUISINE (avec sous-totaux)

  // Helper function to render an item table section
  const renderItemSection = (title: string, itemsList: typeof items, subtotal: number, iconEmoji: string) => {
    if (itemsList.length === 0) return;

    // Category Header
    ctx.fillStyle = '#FFF7ED';
    ctx.fillRect(padding, currentY - 14, width - (padding * 2), 28);
    ctx.strokeStyle = '#FFEDD5';
    ctx.strokeRect(padding, currentY - 14, width - (padding * 2), 28);

    ctx.fillStyle = '#C2410C';
    ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${iconEmoji} ${title.toUpperCase()}`, padding + 10, currentY + 4);

    currentY += 32;

    // Items table header
    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = '#6B7280';
    ctx.fillText('ARTICLE', padding, currentY);
    ctx.textAlign = 'center';
    ctx.fillText('QTÉ', width - 200, currentY);
    ctx.textAlign = 'right';
    ctx.fillText('P.U', width - 120, currentY);
    ctx.fillText('TOTAL', width - padding, currentY);

    currentY += 18;

    itemsList.forEach((it) => {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#111827';
      ctx.font = '13px system-ui, -apple-system, sans-serif';
      let name = it.name;
      if (name.length > 22) name = name.slice(0, 20) + '...';
      ctx.fillText(name, padding, currentY);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#4B5563';
      ctx.fillText(`x${it.quantity}`, width - 200, currentY);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#6B7280';
      ctx.fillText(`${it.unitPrice.toLocaleString('fr-FR')}`, width - 120, currentY);

      ctx.fillStyle = '#111827';
      ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
      ctx.fillText(`${(it.unitPrice * it.quantity).toLocaleString('fr-FR')} F`, width - padding, currentY);

      currentY += 30;
    });

    // Subtotal Row for category
    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(padding, currentY - 16, width - (padding * 2), 24);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
    ctx.fillText(`Sous-total ${title} :`, padding + 10, currentY);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#111827';
    ctx.fillText(`${subtotal.toLocaleString('fr-FR')} F CFA`, width - padding - 10, currentY);

    currentY += 28;
  };

  if (boissonItems.length > 0) {
    renderItemSection('Boissons', boissonItems, subtotalBoissons, '🥤');
  }

  if (cuisineItems.length > 0) {
    renderItemSection('Cuisine / Repas', cuisineItems, subtotalCuisine, '🍽️');
  }

  drawDashedLine(ctx, currentY, padding, width);
  currentY += 24;

  // 8, 9, 10. TOTAL ACHAT, RÉDUCTION, TOTAL NET À PAYER
  ctx.textAlign = 'left';
  ctx.font = '13px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#4B5563';
  ctx.fillText('Total Achat (Brut) :', padding, currentY);
  ctx.textAlign = 'right';
  ctx.fillText(`${totalAchat.toLocaleString('fr-FR')} F CFA`, width - padding, currentY);
  currentY += 22;

  if (discountAmount > 0) {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#DC2626';
    ctx.fillText('Réduction / Remise :', padding, currentY);
    ctx.textAlign = 'right';
    ctx.fillText(`- ${discountAmount.toLocaleString('fr-FR')} F CFA`, width - padding, currentY);
    currentY += 22;
  }

  // Net to pay box
  ctx.fillStyle = '#FFF7ED'; // Orange-50
  ctx.fillRect(padding, currentY - 14, width - (padding * 2), 54);
  ctx.strokeStyle = '#FDBA74'; // Orange-300
  ctx.lineWidth = 1.5;
  ctx.strokeRect(padding, currentY - 14, width - (padding * 2), 54);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#9A3412';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText('TOTAL NET À PAYER', padding + 16, currentY + 18);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#EA580C';
  ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${totalNet.toLocaleString('fr-FR')} F CFA`, width - padding - 16, currentY + 20);

  currentY += 62;

  // 12. L'AVOIR / MONNAIE RENDUE
  if ((sale.avoirAmount && sale.avoirAmount > 0) || sale.changeAmount !== undefined) {
    ctx.fillStyle = '#EFF6FF';
    ctx.fillRect(padding, currentY - 14, width - (padding * 2), 46);
    ctx.strokeStyle = '#BFDBFE';
    ctx.strokeRect(padding, currentY - 14, width - (padding * 2), 46);

    ctx.textAlign = 'left';
    ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';

    if (sale.avoirAmount && sale.avoirAmount > 0) {
      ctx.fillStyle = '#1D4ED8';
      ctx.fillText('🎫 AVOIR CLIENT (Pas de monnaie rendue) :', padding + 12, currentY + 12);
      ctx.textAlign = 'right';
      ctx.font = 'bold 14px system-ui';
      ctx.fillText(`${sale.avoirAmount.toLocaleString('fr-FR')} F CFA`, width - padding - 12, currentY + 12);
    } else if (sale.changeAmount !== undefined) {
      ctx.fillStyle = '#047857';
      ctx.fillText('💵 Monnaie Rendue au Client :', padding + 12, currentY + 12);
      ctx.textAlign = 'right';
      ctx.font = 'bold 14px system-ui';
      ctx.fillText(`${sale.changeAmount.toLocaleString('fr-FR')} F CFA`, width - padding - 12, currentY + 12);
    }
    currentY += 52;
  }

  // 11. CODE DE PAIEMENT MOBILE MONEY + QR CODE
  ctx.fillStyle = '#F9FAFB';
  ctx.fillRect(padding, currentY - 10, width - (padding * 2), 105);
  ctx.strokeStyle = '#E5E7EB';
  ctx.strokeRect(padding, currentY - 10, width - (padding * 2), 105);

  // Draw QR code graphic box on left side of payment box
  drawMobileMoneyQR(ctx, padding + 12, currentY - 2, 70);

  // Mobile money instructions text
  ctx.textAlign = 'left';
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 13px system-ui';
  ctx.fillText('📱 PAIEMENT MOBILE MONEY', padding + 95, currentY + 10);

  ctx.fillStyle = '#4B5563';
  ctx.font = '11px monospace';
  const mmCode = sale.mobileMoneyCode || `*144*4*6*${establishment?.id.slice(0, 5) || '34901'}#`;
  ctx.fillText(`Code Marchand: ${mmCode}`, padding + 95, currentY + 30);
  ctx.fillText(`Services: Orange Money, Moov Money, Wave`, padding + 95, currentY + 48);
  ctx.fillStyle = '#EA580C';
  ctx.font = 'bold 10px system-ui';
  ctx.fillText('Scannez ou composez le code pour régler directement', padding + 95, currentY + 66);

  currentY += 115;

  drawDashedLine(ctx, currentY, padding, width);
  currentY += 24;

  // 15. BRAND FOOTER : LOGO ZAKA+ SUIVI DE "Zaka+"
  ctx.textAlign = 'center';
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('Merci pour votre visite !', width / 2, currentY);
  currentY += 22;

  // Draw Zaka+ logo icon & text
  ctx.fillStyle = '#EA580C';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText('✨ ZAKA+', width / 2, currentY);
  currentY += 18;

  ctx.fillStyle = '#9CA3AF';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillText('Reçu digital certifié par la plateforme Zaka+ Bars & Maquis', width / 2, currentY);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Erreur lors de la génération du blob image'));
    }, 'image/png');
  });
}

/**
 * Generate a Data URL representation for immediate <img> display.
 */
export async function generateReceiptDataUrl(
  sale: SaleRecord,
  establishment?: Establishment | null
): Promise<string> {
  const blob = await generateReceiptBlob(sale, establishment);
  return URL.createObjectURL(blob);
}

/**
 * Triggers a browser download of the receipt image.
 */
export async function downloadReceiptImage(
  sale: SaleRecord,
  establishment?: Establishment | null
): Promise<void> {
  const blob = await generateReceiptBlob(sale, establishment);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Recu_Vente_${sale.id.slice(0, 8)}_${new Date(sale.date).toISOString().split('T')[0]}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Shares the receipt image using Web Share API (mobile/modern browsers) or falls back to download.
 */
export async function shareReceiptImage(
  sale: SaleRecord,
  establishment?: Establishment | null
): Promise<{ shared: boolean; method: 'native' | 'download' | 'whatsapp' }> {
  try {
    const blob = await generateReceiptBlob(sale, establishment);
    const fileName = `Recu_${sale.id.slice(0, 8)}.png`;
    const file = new File([blob], fileName, { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `Reçu de caisse - ${establishment?.name || 'ZAKA+'}`,
        text: `Reçu de vente de ${sale.totalAmount.toLocaleString('fr-FR')} F CFA - #${sale.id.slice(0, 8)}`
      });
      return { shared: true, method: 'native' };
    }
  } catch (e: any) {
    if (e.name === 'AbortError') {
      return { shared: false, method: 'native' };
    }
  }

  // Fallback to image download
  await downloadReceiptImage(sale, establishment);
  return { shared: true, method: 'download' };
}

