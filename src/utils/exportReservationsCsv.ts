import { Reservation, Establishment } from '../types';

/**
 * Helper to escape CSV cell content correctly
 */
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports manager reservations and their statistical summaries to CSV format.
 * Includes UTF-8 BOM for flawless rendering in Excel and LibreOffice.
 */
export function exportReservationsToCSV({
  reservations,
  establishments,
  managerEstablishmentIds,
  selectedEstablishmentId,
  managerName
}: {
  reservations: Reservation[];
  establishments: Establishment[];
  managerEstablishmentIds?: string[];
  selectedEstablishmentId?: string;
  managerName?: string;
}) {
  // 1. Filter reservations belonging to the manager
  let targetReservations = reservations || [];
  
  if (managerEstablishmentIds && managerEstablishmentIds.length > 0) {
    targetReservations = targetReservations.filter(r => managerEstablishmentIds.includes(r.establishmentId));
  }

  if (selectedEstablishmentId && selectedEstablishmentId !== 'all') {
    targetReservations = targetReservations.filter(r => r.establishmentId === selectedEstablishmentId);
  }

  if (targetReservations.length === 0) {
    alert("Aucune réservation trouvée à exporter pour le périmètre sélectionné.");
    return;
  }

  // Sort chronologically (most recent first)
  targetReservations.sort((a, b) => {
    const timeA = new Date(a.date || a.createdAt || 0).getTime();
    const timeB = new Date(b.date || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  // 2. Aggregate monthly statistics
  const monthlySummary: Record<string, { total: number; confirmees: number; enAttente: number; refusees: number; annulees: number; couverts: number }> = {};

  targetReservations.forEach(r => {
    const rawDate = r.date || r.createdAt;
    let monthKey = 'Non renseigné';
    if (rawDate) {
      const d = new Date(rawDate);
      if (!isNaN(d.getTime())) {
        monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      }
    }

    if (!monthlySummary[monthKey]) {
      monthlySummary[monthKey] = { total: 0, confirmees: 0, enAttente: 0, refusees: 0, annulees: 0, couverts: 0 };
    }

    const guests = r.guestsCount || (r as any).numberOfGuests || (r as any).guests || 1;
    monthlySummary[monthKey].total += 1;
    monthlySummary[monthKey].couverts += Number(guests) || 1;

    if (r.status === 'confirmee') monthlySummary[monthKey].confirmees += 1;
    else if (r.status === 'en_attente') monthlySummary[monthKey].enAttente += 1;
    else if (r.status === 'refusee') monthlySummary[monthKey].refusees += 1;
    else if (r.status === 'annulee') monthlySummary[monthKey].annulees += 1;
  });

  const rows: string[] = [];

  // Title / Metadata
  rows.push(`RAPPORT STATISTIQUE DES RÉSERVATIONS - ZAKA+`);
  rows.push(`Gérant : ${managerName || 'Non spécifié'}`);
  rows.push(`Date d'export : ${new Date().toLocaleString('fr-FR')}`);
  rows.push(`Nombre total de réservations : ${targetReservations.length}`);
  rows.push("");

  // Section 1: Monthly Stats Summary
  rows.push("=== SYNTHÈSE MENSUELLE DES RÉSERVATIONS ===");
  rows.push([
    "Mois",
    "Total Demandes",
    "Confirmées",
    "En attente",
    "Refusées",
    "Annulées",
    "Total Couverts (Personnes)",
    "Taux de confirmation (%)"
  ].map(escapeCSV).join(";"));

  const sortedMonths = Object.keys(monthlySummary).sort().reverse();
  sortedMonths.forEach(month => {
    const s = monthlySummary[month];
    const rate = s.total > 0 ? Math.round((s.confirmees / s.total) * 100) : 0;
    rows.push([
      month,
      s.total,
      s.confirmees,
      s.enAttente,
      s.refusees,
      s.annulees,
      s.couverts,
      `${rate}%`
    ].map(escapeCSV).join(";"));
  });

  rows.push("");
  rows.push("=== DÉTAIL COMPLET DES RÉSERVATIONS ===");
  rows.push([
    "ID Réservation",
    "Établissement",
    "Nom du Client",
    "Téléphone",
    "Date Prévue",
    "Heure",
    "Nombre de Personnes",
    "Statut",
    "Remarques / Demandes spéciales",
    "Date d'enregistrement"
  ].map(escapeCSV).join(";"));

  targetReservations.forEach(r => {
    const est = establishments.find(e => e.id === r.establishmentId);
    const estName = est ? est.name : r.establishmentId;
    const guests = r.guestsCount || (r as any).numberOfGuests || (r as any).guests || 1;
    const notes = r.note || (r as any).specialRequests || (r as any).message || '';
    const createdStr = r.createdAt ? new Date(r.createdAt).toLocaleString('fr-FR') : '';

    rows.push([
      r.id,
      estName,
      r.clientName || 'Client',
      r.clientPhone || '',
      r.date || '',
      r.time || '',
      guests,
      r.status,
      notes,
      createdStr
    ].map(escapeCSV).join(";"));
  });

  // Add UTF-8 BOM so Excel opens accented characters seamlessly
  const csvString = "\uFEFF" + rows.join("\r\n");
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateSlug = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `statistiques_reservations_zaka_${dateSlug}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
