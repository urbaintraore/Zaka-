import { SaleRecord, Establishment } from '../types';

/**
 * Generates a clean, high-resolution receipt PNG image on an HTML5 canvas.
 */
export async function generateReceiptBlob(
  sale: SaleRecord,
  establishment?: Establishment | null
): Promise<Blob> {
  const width = 640;
  const padding = 36;
  const lineHeight = 28;
  const items = sale.items || [];
  
  // Calculate dynamic canvas height
  const headerHeight = 220;
  const itemsHeight = items.length * 36;
  const footerHeight = 180;
  const height = headerHeight + itemsHeight + footerHeight;

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

  // Subtle top receipt accent bar
  ctx.fillStyle = '#EA580C'; // Orange-600
  ctx.fillRect(0, 0, width, 8);

  // Border
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, width - 2, height - 2);

  // Establishment Name
  ctx.fillStyle = '#111827';
  ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  const estName = establishment?.name || 'ZAKA+ POINT DE VENTE';
  ctx.fillText(estName.toUpperCase(), width / 2, 50);

  // Subtitle / Address
  ctx.fillStyle = '#6B7280';
  ctx.font = '13px system-ui, -apple-system, sans-serif';
  const estLocation = establishment ? `${establishment.city || ''} ${establishment.neighborhood ? '• ' + establishment.neighborhood : ''}`.trim() : 'Service Boissons & Restauration';
  ctx.fillText(estLocation || 'Service Boissons & Restauration', width / 2, 74);

  ctx.fillStyle = '#4B5563';
  ctx.font = 'bold 14px monospace';
  ctx.fillText('*** TICKET DE CAISSE OFFICIEL ***', width / 2, 102);

  // Dashed separator
  const drawDashedLine = (y: number) => {
    ctx.beginPath();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#D1D5DB';
    ctx.lineWidth = 1.5;
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding, y);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  drawDashedLine(118);

  // Metadata: Date, Caissier, Ticket Ref
  ctx.textAlign = 'left';
  ctx.font = '13px monospace';
  ctx.fillStyle = '#374151';

  const saleDate = new Date(sale.date).toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'medium'
  });

  ctx.fillText(`Date    : ${saleDate}`, padding, 142);
  ctx.fillText(`Ticket  : #${sale.id.slice(0, 10).toUpperCase()}`, padding, 164);
  ctx.fillText(`Caissier: ${sale.cashierName || 'Staff'}`, padding, 186);

  drawDashedLine(202);

  // Table Headers
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#1F2937';
  ctx.textAlign = 'left';
  ctx.fillText('ARTICLE', padding, 226);
  ctx.textAlign = 'center';
  ctx.fillText('QTÉ', width - 210, 226);
  ctx.textAlign = 'right';
  ctx.fillText('P.U', width - 130, 226);
  ctx.fillText('TOTAL', width - padding, 226);

  drawDashedLine(238);

  // Items List
  let currentY = 264;
  ctx.font = '14px system-ui, -apple-system, sans-serif';

  items.forEach((item, index) => {
    ctx.textAlign = 'left';
    ctx.fillStyle = '#111827';
    // Truncate long names if needed
    let name = item.name;
    if (name.length > 22) name = name.slice(0, 20) + '...';
    ctx.fillText(name, padding, currentY);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#4B5563';
    ctx.fillText(`x${item.quantity}`, width - 210, currentY);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#6B7280';
    ctx.fillText(`${item.unitPrice.toLocaleString('fr-FR')}`, width - 130, currentY);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
    ctx.fillText(`${(item.unitPrice * item.quantity).toLocaleString('fr-FR')} F`, width - padding, currentY);
    ctx.font = '14px system-ui, -apple-system, sans-serif';

    currentY += 34;
  });

  drawDashedLine(currentY);
  currentY += 28;

  // Total Box
  ctx.fillStyle = '#FFF7ED'; // Orange-50
  ctx.fillRect(padding, currentY - 18, width - (padding * 2), 52);
  ctx.strokeStyle = '#FDBA74'; // Orange-300
  ctx.lineWidth = 1;
  ctx.strokeRect(padding, currentY - 18, width - (padding * 2), 52);

  ctx.textAlign = 'left';
  ctx.fillStyle = '#9A3412';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.fillText('TOTAL ENCAISSÉ', padding + 16, currentY + 14);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#EA580C';
  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillText(`${sale.totalAmount.toLocaleString('fr-FR')} F CFA`, width - padding - 16, currentY + 16);

  currentY += 64;

  // Footer Message
  ctx.textAlign = 'center';
  ctx.fillStyle = '#4B5563';
  ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
  ctx.fillText('Merci pour votre visite !', width / 2, currentY);

  ctx.fillStyle = '#9CA3AF';
  ctx.font = '11px system-ui, -apple-system, sans-serif';
  ctx.fillText('Reçu digital certifié par ZAKA+ Bar & Maquis', width / 2, currentY + 22);

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
