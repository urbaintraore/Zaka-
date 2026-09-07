import { Reservation } from '../types';

export function exportReservationsToCSV(data: any) {
  let reservationsList: Reservation[] = [];
  if (Array.isArray(data)) {
    reservationsList = data;
  } else if (data && Array.isArray(data.reservations)) {
    reservationsList = data.reservations;
  }

  if (!reservationsList || reservationsList.length === 0) return;

  const headers = ['ID', 'Établissement', 'Client', 'Date', 'Heure', 'Invités', 'Statut'];
  const rows = reservationsList.map(r => [
    r.id,
    `"${(r.establishmentName || '').replace(/"/g, '""')}"`,
    `"${(r.userName || '').replace(/"/g, '""')}"`,
    r.date,
    r.time,
    r.guestsCount,
    r.status
  ]);

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `reservations_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
