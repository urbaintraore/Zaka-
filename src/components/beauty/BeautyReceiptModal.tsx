import React, { useRef } from 'react';
import {
  X,
  Printer,
  Share2,
  MessageCircle,
  CheckCircle,
  Sparkles,
  Scissors,
  Receipt,
  Download,
  Calendar,
  Clock,
  Store,
  User,
  CreditCard
} from 'lucide-react';
import { BeautySale } from '../../types';
import { BEAUTY_PAYMENT_LABELS, formatFcfa } from '../../lib/beautyService';

interface BeautyReceiptModalProps {
  sale: BeautySale | null;
  salonNom: string;
  salonTelephone?: string;
  salonAdresse?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function BeautyReceiptModal({
  sale,
  salonNom,
  salonTelephone,
  salonAdresse,
  isOpen,
  onClose
}: BeautyReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !sale) return null;

  const paymentConfig = BEAUTY_PAYMENT_LABELS[sale.moyenPaiement] || {
    label: sale.moyenPaiement,
    icon: '💳'
  };

  const saleDateObj = new Date(sale.dateVente);
  const formattedDate = saleDateObj.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const formattedTime = saleDateObj.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Handle Browser Print
  const handlePrint = () => {
    window.print();
  };

  // Generate WhatsApp text receipt
  const generateWhatsAppMessage = () => {
    const itemsList = sale.items
      .map(
        it =>
          `• ${it.nom} (x${it.quantite}) : ${formatFcfa(it.montantTotalFcfa)}`
      )
      .join('\n');

    let text = `*ZAKA BEAUTY — TICKET DE CAISSE*\n`;
    text += `💇‍♀️ Salon : *${salonNom}*\n`;
    if (salonTelephone) text += `📞 Tél : ${salonTelephone}\n`;
    text += `👤 Client : *${sale.nomClient}*\n`;
    text += `📅 Date : ${formattedDate} à ${formattedTime}\n`;
    text += `🧾 Réf : #${sale.id.slice(-6).toUpperCase()}\n\n`;
    text += `*DÉTAILS DES PRESTATIONS & ACHATS :*\n${itemsList}\n\n`;

    if (sale.montantRemiseFcfa > 0) {
      text += `Sous-total : ${formatFcfa(sale.montantBrutFcfa)}\n`;
      text += `Remise : -${formatFcfa(sale.montantRemiseFcfa)}\n`;
    }

    text += `*TOTAL PAYÉ : ${formatFcfa(sale.montantTotalFcfa)}*\n`;
    text += `Mode de paiement : ${paymentConfig.icon} ${paymentConfig.label}\n`;

    if (sale.pointsFideliteGagnes && sale.pointsFideliteGagnes > 0) {
      text += `🎁 Points fidélité gagnés : +${sale.pointsFideliteGagnes} pts\n`;
    }

    text += `\nMerci pour votre confiance et à très bientôt chez ${salonNom} ! ✨`;
    return text;
  };

  const handleSendWhatsApp = () => {
    const text = generateWhatsAppMessage();
    const phone = (sale.telephoneClient || '').replace(/\D/g, '');
    const targetPhone = phone.startsWith('226') ? phone : phone ? `226${phone}` : '';
    const url = targetPhone
      ? `https://wa.me/${targetPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleShare = async () => {
    const text = generateWhatsAppMessage();
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ticket ZAKA Beauty - ${salonNom}`,
          text
        });
      } catch {
        // User cancelled or not supported
      }
    } else {
      navigator.clipboard?.writeText(text);
      alert('Texte du ticket copié dans le presse-papier !');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      {/* Print Specific CSS */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #beauty-printable-ticket, #beauty-printable-ticket * {
            visibility: visible;
          }
          #beauty-printable-ticket {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 20px;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden my-8 animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-rose-50/50 dark:bg-rose-950/20">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-base">
            <Receipt className="w-5 h-5" />
            <span>Ticket de Caisse Validé</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full hover:bg-white/80 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Card */}
        <div className="p-6">
          <div
            ref={receiptRef}
            id="beauty-printable-ticket"
            className="bg-gray-50 dark:bg-gray-800/80 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 font-mono text-sm text-gray-800 dark:text-gray-200"
          >
            {/* Ticket Header */}
            <div className="text-center pb-4 border-b border-dashed border-gray-300 dark:border-gray-700">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 mb-2">
                <Scissors className="w-5 h-5" />
              </div>
              <h2 className="font-extrabold text-lg text-gray-900 dark:text-white tracking-wider uppercase">
                ZAKA BEAUTY
              </h2>
              <p className="font-bold text-rose-600 dark:text-rose-400 text-sm mt-0.5">
                {salonNom}
              </p>
              {salonAdresse && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {salonAdresse}
                </p>
              )}
              {salonTelephone && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Tél : {salonTelephone}
                </p>
              )}
            </div>

            {/* Ticket Metadata */}
            <div className="py-3 border-b border-dashed border-gray-300 dark:border-gray-700 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-500">Ticket N° :</span>
                <span className="font-bold">#{sale.id.slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date & Heure :</span>
                <span>{formattedDate} {formattedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Client :</span>
                <span className="font-bold text-gray-900 dark:text-white">{sale.nomClient}</span>
              </div>
              {sale.telephoneClient && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Téléphone :</span>
                  <span>{sale.telephoneClient}</span>
                </div>
              )}
              {sale.employeeName && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Coiffeur / Pro :</span>
                  <span>{sale.employeeName}</span>
                </div>
              )}
              {sale.caissierNom && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Caissier :</span>
                  <span>{sale.caissierNom}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-3 border-b border-dashed border-gray-300 dark:border-gray-700 space-y-2">
              <div className="flex justify-between text-xs font-bold text-gray-500 uppercase">
                <span>Article / Prestation</span>
                <span>Total</span>
              </div>
              {sale.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-xs">
                  <div className="pr-2">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {item.nom}
                    </span>
                    <span className="text-gray-400 text-[10px] block">
                      {item.quantite} x {formatFcfa(item.prixUnitaireFcfa)} ({item.itemType === 'service' ? 'Prestation' : 'Produit'})
                    </span>
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white whitespace-nowrap">
                    {formatFcfa(item.montantTotalFcfa)}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals & Payment */}
            <div className="pt-3 space-y-1.5 text-xs">
              {sale.montantRemiseFcfa > 0 && (
                <>
                  <div className="flex justify-between text-gray-500">
                    <span>Sous-total brut :</span>
                    <span>{formatFcfa(sale.montantBrutFcfa)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Remise accordée :</span>
                    <span>-{formatFcfa(sale.montantRemiseFcfa)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between items-baseline pt-2 border-t border-gray-300 dark:border-gray-700 text-base font-extrabold text-gray-900 dark:text-white">
                <span>TOTAL :</span>
                <span className="text-rose-600 dark:text-rose-400">
                  {formatFcfa(sale.montantTotalFcfa)}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-300 pt-1">
                <span>Paiement :</span>
                <span className="font-bold inline-flex items-center gap-1">
                  <span>{paymentConfig.icon}</span> {paymentConfig.label}
                </span>
              </div>

              {sale.montantRecuFcfa !== undefined && sale.montantRecuFcfa > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Montant reçu :</span>
                  <span>{formatFcfa(sale.montantRecuFcfa)}</span>
                </div>
              )}

              {sale.montantRenduFcfa !== undefined && sale.montantRenduFcfa > 0 && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Monnaie rendue :</span>
                  <span>{formatFcfa(sale.montantRenduFcfa)}</span>
                </div>
              )}

              {sale.referencePaiement && (
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Réf transaction :</span>
                  <span className="font-mono text-[11px]">{sale.referencePaiement}</span>
                </div>
              )}

              {/* Loyalty Reward points */}
              {sale.pointsFideliteGagnes && sale.pointsFideliteGagnes > 0 && (
                <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-800 dark:text-amber-300 flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Points Rewards Gagnés :
                  </span>
                  <span>+{sale.pointsFideliteGagnes} pts</span>
                </div>
              )}
            </div>

            {/* Ticket Footer */}
            <div className="text-center pt-4 mt-4 border-t border-dashed border-gray-300 dark:border-gray-700 text-[11px] text-gray-400">
              <p>Merci pour votre visite !</p>
              <p className="font-semibold text-gray-500 mt-0.5">Propulsé par ZAKA Beauty</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="no-print mt-6 grid grid-cols-3 gap-3">
            <button
              onClick={handleSendWhatsApp}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs gap-1.5 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
            >
              <MessageCircle className="w-5 h-5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-gray-900 dark:bg-gray-100 hover:bg-black dark:hover:bg-white text-white dark:text-gray-900 font-bold text-xs gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Printer className="w-5 h-5" />
              <span>Imprimer</span>
            </button>

            <button
              onClick={handleShare}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs gap-1.5 transition-all shadow-md shadow-rose-500/20 active:scale-95"
            >
              <Share2 className="w-5 h-5" />
              <span>Partager</span>
            </button>
          </div>

          <div className="no-print mt-4">
            <button
              onClick={onClose}
              className="w-full py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-sm rounded-2xl transition-colors"
            >
              Fermer et retourner à la caisse
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
