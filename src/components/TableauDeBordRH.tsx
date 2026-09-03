import React, { useState } from 'react';
import { useAppStore } from '../store';
import { StaffAttendance, StaffReview } from '../types';
import { 
  Calendar as CalendarIcon, Download, Clock, AlertTriangle, Award, 
  Users, CheckCircle, XCircle, Plus, Trash2, BellRing, FileText, 
  Eye, Check, ShieldAlert, Star, DollarSign, Image as ImageIcon, Sparkles, HelpCircle, Archive, Send 
} from 'lucide-react';
import jsPDF from 'jspdf';

// Helper functions for time calculation
function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) return 0;
  return parts[0] * 60 + parts[1];
}

function calculateArrivalDelay(officialStart: string, actualArrival: string): number {
  if (!officialStart || !actualArrival) return 0;
  const offMins = parseTimeToMinutes(officialStart);
  let actMins = parseTimeToMinutes(actualArrival);
  if (actMins < offMins && offMins >= 18 * 60) {
    actMins += 24 * 60;
  }
  return Math.max(0, actMins - offMins);
}

function calculateDepartureDelay(officialEnd: string, actualDeparture: string): number {
  if (!officialEnd || !actualDeparture) return 0;
  let offMins = parseTimeToMinutes(officialEnd);
  let actMins = parseTimeToMinutes(actualDeparture);
  if (offMins < 12 * 60 && actMins >= 18 * 60) {
    offMins += 24 * 60;
  }
  return Math.max(0, offMins - actMins);
}

interface TableauDeBordRHProps {
  establishmentId: string;
  establishmentName: string;
}

export function TableauDeBordRH({ establishmentId, establishmentName }: TableauDeBordRHProps) {
  const { 
    staffAttendances, relationshipRequests, users, staffReviews, 
    createStaffAttendance, deleteStaffAttendance, updateStaffReviewStatus 
  } = useAppStore();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedStaffId, setSelectedStaffId] = useState<string>('all');
  const [activeViewMode, setActiveViewMode] = useState<'list' | 'calendar' | 'reviews' | 'payroll' | 'archive'>('list');
  
  // Onboarding modal for new staff
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);

  // Threshold settings for alerts
  const [lateThresholdMinutes, setLateThresholdMinutes] = useState<number>(60);
  const [incidentThresholdCount, setIncidentThresholdCount] = useState<number>(3);
  const [showConfigAlerts, setShowConfigAlerts] = useState(false);

  // Modal for adding new attendance
  const [showAddModal, setShowAddModal] = useState(false);
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attStaffId, setAttStaffId] = useState('');
  const [attPeriod, setAttPeriod] = useState<'matinée' | 'soirée'>('soirée');
  
  // Absence & Work times
  const [attIsAbsent, setAttIsAbsent] = useState(false);
  const [attAbsenceReason, setAttAbsenceReason] = useState('Non justifiée');
  const [attOfficialStartTime, setAttOfficialStartTime] = useState('20:00');
  const [attActualArrivalTime, setAttActualArrivalTime] = useState('20:00');
  const [attOfficialEndTime, setAttOfficialEndTime] = useState('04:00');
  const [attActualDepartureTime, setAttActualDepartureTime] = useState('04:00');

  const [attJustification, setAttJustification] = useState('');
  const [attPhotoUrl, setAttPhotoUrl] = useState('');

  // Live delay computations
  const liveArrivalDelay = attIsAbsent ? 0 : calculateArrivalDelay(attOfficialStartTime, attActualArrivalTime);
  const liveDepartureDelay = attIsAbsent ? 0 : calculateDepartureDelay(attOfficialEndTime, attActualDepartureTime);
  const liveGlobalDelay = attIsAbsent ? 0 : liveArrivalDelay + liveDepartureDelay;
  
  // Photo modal preview
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Review management modal state
  const [reviewNoteInput, setReviewNoteInput] = useState<Record<string, string>>({});

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Staff members in this establishment
  const staffMembers = relationshipRequests.filter(
    r => r.establishmentId === establishmentId && r.status === 'acceptee' && (r.isDJ || r.isCaissier || (r as any).isServeur || (r.requestedRole && r.requestedRole !== 'client'))
  );

  // Filter attendances for this establishment and selected month
  const monthAttendances = staffAttendances.filter(a => {
    const matchesEst = a.establishmentId === establishmentId;
    const matchesMonth = a.date.startsWith(selectedMonth);
    const matchesStaff = selectedStaffId === 'all' || a.staffId === selectedStaffId;
    return matchesEst && matchesMonth && matchesStaff;
  });

  // Pending photo justifications for automated manager alerts
  const pendingPhotoJustifications = staffAttendances.filter(a => 
    a.establishmentId === establishmentId && a.justificationPhotoUrl && ((a.lateMinutes > 0 || a.earlyDepartureMinutes > 0 || (a.totalDailyDelayMinutes || 0) > 0))
  );

  // Available unique months in archives for this establishment
  const allEstAttendances = staffAttendances.filter(a => a.establishmentId === establishmentId);
  const archiveMonthsSet: string[] = (Array.from(new Set(allEstAttendances.map(a => a.date.slice(0, 7)))) as string[]).sort().reverse();

  // Calculate stats per staff for alerts & payroll
  const staffStatsMap: Record<string, { 
    totalLate: number; 
    totalEarly: number;
    totalGlobalDelay: number;
    absencesCount: number;
    incidentsCount: number; 
    shiftsCount: number;
    name: string; 
    role: string;
    avgRating: number;
    calculatedBonusOrSanction: { type: 'bonus' | 'sanction'; amount: number; reason: string };
  }> = {};
  
  staffMembers.forEach(m => {
    const staffId = m.type === 'client_join' ? m.initiatorId : m.targetId;
    const u = users.find(user => user.id === staffId);
    
    const workerReviews = staffReviews.filter(r => r.establishmentId === establishmentId && r.staffId === staffId && r.status === 'valide');
    const avgRating = workerReviews.length > 0
      ? workerReviews.reduce((sum, rev) => sum + rev.rating, 0) / workerReviews.length
      : 5.0;

    staffStatsMap[staffId] = {
      totalLate: 0,
      totalEarly: 0,
      totalGlobalDelay: 0,
      absencesCount: 0,
      incidentsCount: 0,
      shiftsCount: 0,
      name: u?.name || 'Employé',
      role: m.isDJ ? 'DJ' : m.isCaissier ? 'Caissier' : ((m as any).isServeur || m.requestedRole === 'serveur') ? 'Serveur/Serveuse' : (m.requestedRole || 'Employé'),
      avgRating,
      calculatedBonusOrSanction: { type: 'bonus', amount: 0, reason: 'Ponctualité irréprochable' }
    };
  });

  staffAttendances.filter(a => a.establishmentId === establishmentId && a.date.startsWith(selectedMonth)).forEach(a => {
    if (!staffStatsMap[a.staffId]) {
      const u = users.find(user => user.id === a.staffId);
      staffStatsMap[a.staffId] = {
        totalLate: 0,
        totalEarly: 0,
        totalGlobalDelay: 0,
        absencesCount: 0,
        incidentsCount: 0,
        shiftsCount: 0,
        name: u?.name || 'Employé',
        role: 'Employé',
        avgRating: 5.0,
        calculatedBonusOrSanction: { type: 'bonus', amount: 0, reason: '' }
      };
    }

    if (a.status === 'absent' || a.justification?.startsWith('[ABSENCE]')) {
      staffStatsMap[a.staffId].absencesCount += 1;
      staffStatsMap[a.staffId].incidentsCount += 1;
    } else {
      staffStatsMap[a.staffId].shiftsCount += 1;
      const arrDelay = a.arrivalDelayMinutes ?? a.lateMinutes ?? 0;
      const depDelay = a.departureDelayMinutes ?? a.earlyDepartureMinutes ?? 0;
      const globDelay = a.totalDailyDelayMinutes ?? (arrDelay + depDelay);

      staffStatsMap[a.staffId].totalLate += arrDelay;
      staffStatsMap[a.staffId].totalEarly += depDelay;
      staffStatsMap[a.staffId].totalGlobalDelay += globDelay;

      if (globDelay > 0) {
        staffStatsMap[a.staffId].incidentsCount += 1;
      }
    }
  });

  // Calculate pecuniary bonus or sanction based on retards and absences
  Object.keys(staffStatsMap).forEach(staffId => {
    const stats = staffStatsMap[staffId];
    if (stats.absencesCount === 0 && stats.totalGlobalDelay === 0 && stats.avgRating >= 4.5) {
      stats.calculatedBonusOrSanction = { type: 'bonus', amount: 25000, reason: 'Prime de ponctualité & assiduité (25k FCFA)' };
    } else if (stats.absencesCount > 0 || stats.totalGlobalDelay > 60 || stats.incidentsCount >= 3 || stats.avgRating < 3.0) {
      const deduction = Math.min(50000, (stats.absencesCount * 10000) + (stats.totalGlobalDelay * 500) + (stats.incidentsCount * 2000));
      stats.calculatedBonusOrSanction = { type: 'sanction', amount: deduction, reason: `${stats.absencesCount} absence(s), Retard global ${stats.totalGlobalDelay} min` };
    } else {
      stats.calculatedBonusOrSanction = { type: 'bonus', amount: 10000, reason: 'Régularité standard (10k FCFA)' };
    }
  });

  // Identify staff exceeding thresholds
  const flaggedStaff = Object.entries(staffStatsMap).filter(([_, stats]) => {
    return stats.totalGlobalDelay >= lateThresholdMinutes || stats.incidentsCount >= incidentThresholdCount || stats.absencesCount > 0;
  });

  // Performance indicators
  const estStaffReviews = staffReviews.filter(r => r.establishmentId === establishmentId);
  const avgStaffRating = estStaffReviews.length > 0 
    ? (estStaffReviews.reduce((sum, r) => sum + r.rating, 0) / estStaffReviews.length).toFixed(1)
    : '5.0';
  const totalGlobalLateMinutes = monthAttendances.reduce((acc, curr) => acc + (curr.totalDailyDelayMinutes ?? ((curr.arrivalDelayMinutes ?? curr.lateMinutes ?? 0) + (curr.departureDelayMinutes ?? curr.earlyDepartureMinutes ?? 0))), 0);
  const totalAbsencesMonth = monthAttendances.filter(a => a.status === 'absent' || a.justification?.startsWith('[ABSENCE]')).length;

  const handleExportCSV = () => {
    if (monthAttendances.length === 0) {
      alert("Aucune donnée de pointage pour ce mois à exporter.");
      return;
    }
    let csvContent = "data:text/csv;charset=utf-8,ID Employe;Nom Employe;Role;Date;Statut;Shift;Heure Demarrage Officielle;Heure Arrivee Reelle;Retard Arrivee (min);Heure Descente Officielle;Heure Descente Reelle;Retard Descente (min);Retard Global Jour (min);Motif Absence / Justificatif\n";
    monthAttendances.forEach(att => {
      const memberUser = users.find(u => u.id === att.staffId);
      const isAbs = att.status === 'absent' || att.justification?.startsWith('[ABSENCE]');
      const arrD = att.arrivalDelayMinutes ?? att.lateMinutes ?? 0;
      const depD = att.departureDelayMinutes ?? att.earlyDepartureMinutes ?? 0;
      const globD = att.totalDailyDelayMinutes ?? (arrD + depD);

      csvContent += `${att.staffId};"${memberUser?.name || 'Inconnu'}";"${staffStatsMap[att.staffId]?.role || 'Employé'}";${att.date};${isAbs ? 'ABSENT' : att.status || 'présent'};${att.period};${att.officialStartTime || '-'};${att.actualArrivalTime || '-'};${arrD};${att.officialEndTime || '-'};${att.actualDepartureTime || '-'};${depD};${globD};"${att.justification || ''}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rapport_pointage_${establishmentName.replace(/\s+/g, '_')}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate PDF Report using jsPDF
  const handleGeneratePDF = (targetMonth = selectedMonth) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header styling
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`RAPPORT MENSUEL DE POINTAGE & PAIE`, 15, 15);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Établissement : ${establishmentName} | Mois : ${targetMonth}`, 15, 25);

    // Summary KPI section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Synthèse Globale de Présence & Retards', 15, 48);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`- Effectif total actif : ${staffMembers.length} employés`, 20, 56);
    doc.text(`- Retard global cumulé du mois : ${totalGlobalLateMinutes} minutes (${(totalGlobalLateMinutes / 60).toFixed(1)} h)`, 20, 63);
    doc.text(`- Total absences enregistrées : ${totalAbsencesMonth} jour(s)`, 20, 70);
    doc.text(`- Note moyenne globale personnel : ${avgStaffRating} / 5 étoiles`, 20, 77);

    // Staff stats breakdown
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Détail par Employé & Calcul de Paie / Sanctions', 15, 92);

    let startY = 100;
    doc.setFontSize(8);
    doc.setFillColor(241, 245, 249);
    doc.rect(15, startY, pageWidth - 30, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Nom / Rôle', 18, startY + 5);
    doc.text('Shifts', 75, startY + 5);
    doc.text('Absences', 95, startY + 5);
    doc.text('Retard Global', 120, startY + 5);
    doc.text('Note', 155, startY + 5);
    doc.text('Ajustement Paie', 172, startY + 5);

    startY += 8;
    doc.setFont('helvetica', 'normal');

    Object.entries(staffStatsMap).forEach(([_, stats]) => {
      if (startY > 270) {
        doc.addPage();
        startY = 20;
      }
      doc.text(`${stats.name} (${stats.role})`, 18, startY + 6);
      doc.text(`${stats.shiftsCount}`, 75, startY + 6);
      doc.text(`${stats.absencesCount} j`, 95, startY + 6);
      doc.text(`${stats.totalGlobalDelay} min`, 120, startY + 6);
      doc.text(`${stats.avgRating.toFixed(1)}/5`, 155, startY + 6);
      const bsStr = `${stats.calculatedBonusOrSanction.type === 'bonus' ? '+' : '-'}${stats.calculatedBonusOrSanction.amount}F`;
      doc.text(bsStr, 172, startY + 6);

      startY += 8;
    });

    doc.save(`Rapport_Pointage_${establishmentName.replace(/\s+/g, '_')}_${targetMonth}.pdf`);
    setSuccessMsg(`Rapport PDF mensuel (${targetMonth}) généré avec succès !`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Days in selected month for interactive calendar grid
  const [year, monthNum] = selectedMonth.split('-').map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => {
    const dayNumVal = i + 1;
    const dayStr = dayNumVal < 10 ? `0${dayNumVal}` : `${dayNumVal}`;
    return `${selectedMonth}-${dayStr}`;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-sm">
        <div>
          <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
            <span>📊</span> Tableau de bord RH & Paie (Maquis / Boîte de Nuit)
          </h3>
          <p className="text-xs text-gray-500 font-medium mt-0.5">
            Suivi des shifts (matinée/soirée), retards, départs anticipés, avis clients et calcul de paie pour {establishmentName}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowOnboardingModal(true)}
            className="px-3 py-2 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
            title="Guide pour les nouveaux employés"
          >
            <HelpCircle className="w-4 h-4 text-amber-600" /> Guide Employé
          </button>

          <input
            type="month"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
          />

          <select
            value={selectedStaffId}
            onChange={e => setSelectedStaffId(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
          >
            <option value="all">Tous les employés</option>
            {staffMembers.map(m => {
              const u = users.find(user => user.id === (m.type === 'client_join' ? m.initiatorId : m.targetId));
              return (
                <option key={m.id} value={u?.id || m.targetId}>
                  {u?.name || 'Employé'} ({m.isDJ ? 'DJ' : m.requestedRole})
                </option>
              );
            })}
          </select>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Pointage
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" /> CSV
          </button>

          <button
            type="button"
            onClick={() => handleGeneratePDF()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4" /> Rapport PDF
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-xs font-bold border border-emerald-200 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Automated Push Notification Banner for Pending Justifications with Photo */}
      {pendingPhotoJustifications.length > 0 && (
        <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900/50 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 animate-bounce">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-black text-xs text-purple-900 dark:text-purple-200">
                🔔 Notification Push au Gérant : {pendingPhotoJustifications.length} justificatif(s) avec photo en attente
              </h5>
              <p className="text-[11px] text-purple-700 dark:text-purple-400">
                Des employés ont téléchargé des photos de justificatif de retard. Vérifiez les pointages pour valider rapidement.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveViewMode('list')}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
          >
            Examiner les justificatifs
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs for RH Modes */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3 overflow-x-auto">
        {[
          { id: 'list', label: '📋 Liste des Pointages', icon: Clock },
          { id: 'calendar', label: '🗓️ Calendrier Interactif', icon: CalendarIcon },
          { id: 'reviews', label: '⭐ Avis & Notes Employés', icon: Star },
          { id: 'payroll', label: '💰 Paie & Bonus / Sanctions', icon: DollarSign },
          { id: 'archive', label: '🗄️ Archives & Rapports', icon: Archive },
        ].map(tab => {
          const IconComp = tab.icon;
          const isActive = activeViewMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveViewMode(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive 
                  ? 'bg-orange-600 text-white shadow-sm' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <IconComp className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Automated Alerts Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-3xl p-5 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center flex-shrink-0">
              <BellRing className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-amber-900 dark:text-amber-200">
                Centre d'Alertes RH Automatiques ({flaggedStaff.length} alerte{flaggedStaff.length > 1 ? 's' : ''})
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Employés dépassant le seuil de {lateThresholdMinutes} min de retard ou {incidentThresholdCount} incidents pour {selectedMonth}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowConfigAlerts(!showConfigAlerts)}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm self-start sm:self-auto"
          >
            {showConfigAlerts ? 'Masquer les seuils' : '⚙️ Configurer les seuils'}
          </button>
        </div>

        {showConfigAlerts && (
          <div className="p-4 bg-white dark:bg-gray-900 rounded-2xl border border-amber-200 dark:border-amber-900/50 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                Seuil cumulé de retards (minutes)
              </label>
              <input
                type="number"
                value={lateThresholdMinutes}
                onChange={e => setLateThresholdMinutes(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                Seuil d'incidents (retards/départs)
              </label>
              <input
                type="number"
                value={incidentThresholdCount}
                onChange={e => setIncidentThresholdCount(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
              />
            </div>
          </div>
        )}

        {flaggedStaff.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {flaggedStaff.map(([staffId, stats]) => (
              <div key={staffId} className="p-3.5 bg-white dark:bg-gray-900 rounded-2xl border border-red-200 dark:border-red-900/40 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-black text-xs text-gray-900 dark:text-white">{stats.name}</span>
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-black uppercase">
                    {stats.role}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400">
                  <span>Retard cumulé : <strong className="text-orange-600">{stats.totalLate} min</strong></span>
                  <span>Incidents : <strong className="text-red-600">{stats.incidentsCount}</strong></span>
                </div>
                <div className="text-[10px] font-bold text-red-600 flex items-center gap-1 pt-1 border-t border-gray-100 dark:border-gray-800">
                  <AlertTriangle className="w-3.5 h-3.5" /> Seuil d'alerte dépassé ce mois
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KPI Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Effectif Actif</span>
            <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{staffMembers.length} employés</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center text-orange-600 font-black">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Retards Globaux</span>
            <p className="text-2xl font-black text-orange-600 mt-1">{totalGlobalLateMinutes} min</p>
            <span className="text-[10px] font-medium text-gray-400">Arrivées + Descentes</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 font-black">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Absences Signalées</span>
            <p className="text-2xl font-black text-red-600 mt-1">{totalAbsencesMonth} jour(s)</p>
            <span className="text-[10px] font-medium text-gray-400">Pour le mois</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 font-black">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Note Moyenne RH</span>
            <p className="text-2xl font-black text-amber-500 mt-1">★ {avgStaffRating}/5</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-yellow-50 dark:bg-yellow-950/50 flex items-center justify-center text-yellow-600 font-black">
            <Award className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: LIST TABLE */}
      {activeViewMode === 'list' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">
                Liste des Pointages ({selectedMonth})
              </h4>
              <p className="text-xs text-gray-400">Suivi détaillé des heures d'arrivée, de descente, retards globaux et absences.</p>
            </div>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              {monthAttendances.length} entrée(s)
            </span>
          </div>

          {monthAttendances.length === 0 ? (
            <div className="p-10 bg-gray-50 dark:bg-gray-800/40 rounded-2xl text-center space-y-2">
              <CalendarIcon className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-gray-400">Aucun pointage enregistré pour le mois sélectionné.</p>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
              >
                + Enregistrer un pointage
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 dark:bg-gray-800/60 text-gray-500 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Employé</th>
                    <th className="p-3">Statut & Shift</th>
                    <th className="p-3">Début / Arrivée</th>
                    <th className="p-3">Descente / Départ</th>
                    <th className="p-3">Retard Global</th>
                    <th className="p-3">Justificatif / Photo</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {monthAttendances.map(att => {
                    const memberUser = users.find(u => u.id === att.staffId);
                    const isAbs = att.status === 'absent' || att.justification?.startsWith('[ABSENCE]');
                    const arrD = att.arrivalDelayMinutes ?? att.lateMinutes ?? 0;
                    const depD = att.departureDelayMinutes ?? att.earlyDepartureMinutes ?? 0;
                    const globD = att.totalDailyDelayMinutes ?? (arrD + depD);

                    return (
                      <tr key={att.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all">
                        <td className="p-3 font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-orange-500" />
                          {att.date}
                        </td>
                        <td className="p-3">
                          <div className="font-bold text-gray-800 dark:text-gray-200">{memberUser?.name || 'Employé inconnu'}</div>
                          <span className="text-[10px] text-gray-400 font-semibold">{staffStatsMap[att.staffId]?.role || 'Employé'}</span>
                        </td>
                        <td className="p-3">
                          {isAbs ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-100 text-red-700">
                              🚫 ABSENT
                            </span>
                          ) : (
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              att.period === 'soirée' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {att.period === 'soirée' ? '🌙 Soirée' : '☀️ Matinée'}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {isAbs ? (
                            <span className="text-gray-400">-</span>
                          ) : (
                            <div>
                              <div className="font-semibold text-gray-700 dark:text-gray-300">
                                Off: {att.officialStartTime || '-'} | Arr: {att.actualArrivalTime || '-'}
                              </div>
                              <span className={`text-[10px] font-bold ${arrD > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                {arrD > 0 ? `Retard: +${arrD} min` : 'A l\'heure'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          {isAbs ? (
                            <span className="text-gray-400">-</span>
                          ) : (
                            <div>
                              <div className="font-semibold text-gray-700 dark:text-gray-300">
                                Off: {att.officialEndTime || '-'} | Dep: {att.actualDepartureTime || '-'}
                              </div>
                              <span className={`text-[10px] font-bold ${depD > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {depD > 0 ? `Retard descente: +${depD} min` : 'Conforme'}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-black text-xs">
                          {isAbs ? (
                            <span className="text-red-600">Non pointé</span>
                          ) : globD > 0 ? (
                            <span className="px-2 py-1 rounded-lg bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300">
                              ⏱️ {globD} min
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-bold">0 min (Parfait)</span>
                          )}
                        </td>
                        <td className="p-3 text-gray-500 space-y-1">
                          <div className="italic text-[11px]">{att.justification || 'Aucun'}</div>
                          {att.justificationPhotoUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewPhoto(att.justificationPhotoUrl!)}
                              className="text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <ImageIcon className="w-3 h-3" /> Photo justificative
                            </button>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={async () => {
                              if (confirm("Voulez-vous supprimer ce pointage ?")) {
                                await deleteStaffAttendance(att.id);
                                setSuccessMsg("Pointage supprimé avec succès.");
                                setTimeout(() => setSuccessMsg(null), 3000);
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-all cursor-pointer"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: INTERACTIVE CALENDAR GRID */}
      {activeViewMode === 'calendar' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 p-5 shadow-sm space-y-4">
          <div>
            <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">
              Calendrier Interactif des Shifts & Anomalies ({selectedMonth})
            </h4>
            <p className="text-xs text-gray-400">Visualisez rapidement chaque jour du mois et les shifts de vos équipes en boîte/maquis.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {monthDays.map(dateStr => {
              const dayAtts = staffAttendances.filter(a => a.establishmentId === establishmentId && a.date === dateStr);
              const hasLates = dayAtts.some(a => a.lateMinutes > 0 || a.earlyDepartureMinutes > 0);
              const hasSoiree = dayAtts.some(a => a.period === 'soirée');
              const hasMatinee = dayAtts.some(a => a.period === 'matinée');

              return (
                <div 
                  key={dateStr}
                  className={`p-3 rounded-2xl border transition-all flex flex-col justify-between min-h-[100px] ${
                    dayAtts.length > 0 
                      ? hasLates 
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-900' 
                        : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-900'
                      : 'bg-gray-50 dark:bg-gray-800/40 border-gray-150 dark:border-gray-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-gray-900 dark:text-white">
                      {dateStr.split('-')[2]}
                    </span>
                    <span className="text-[10px] font-bold text-gray-400">
                      {dayAtts.length} shift(s)
                    </span>
                  </div>

                  <div className="space-y-1 my-2">
                    {hasSoiree && (
                      <span className="inline-block px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[9px] font-black uppercase mr-1">
                        🌙 Soirée
                      </span>
                    )}
                    {hasMatinee && (
                      <span className="inline-block px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-black uppercase">
                        ☀️ Matinée
                      </span>
                    )}
                  </div>

                  {hasLates ? (
                    <span className="text-[9px] font-black text-red-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Retard / Incident
                    </span>
                  ) : dayAtts.length > 0 ? (
                    <span className="text-[9px] font-black text-emerald-600 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> RAS / Ponctuel
                    </span>
                  ) : (
                    <span className="text-[9px] text-gray-400 italic">Aucun pointage</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW MODE 3: REVIEWS & NOTES */}
      {activeViewMode === 'reviews' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 p-5 shadow-sm space-y-4">
          <div>
            <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">
              Avis Clients sur les Travailleurs & Validation Manager
            </h4>
            <p className="text-xs text-gray-400">Validez ou invalidez les avis laissés par les clients et notez directement les employés.</p>
          </div>

          {estStaffReviews.length === 0 ? (
            <div className="p-10 bg-gray-50 dark:bg-gray-800/40 rounded-2xl text-center space-y-2">
              <Star className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-gray-400">Aucun avis client enregistré pour le personnel de cet établissement.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {estStaffReviews.map(rev => {
                const clientObj = users.find(u => u.id === rev.clientId);
                const staffObj = users.find(u => u.id === rev.staffId);

                return (
                  <div key={rev.id} className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-150 dark:border-gray-800 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-gray-900 dark:text-white">
                            Travailleur : {staffObj?.name || 'Employé'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            rev.status === 'valide' ? 'bg-emerald-100 text-emerald-700' :
                            rev.status === 'invalide' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {rev.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Client : <strong>{clientObj?.name || 'Client anonyme'}</strong> • Date : {rev.date?.slice(0, 10)}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 text-amber-500 font-black text-xs">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                        <span className="ml-1 text-gray-700 dark:text-gray-300">({rev.rating}/5)</span>
                      </div>
                    </div>

                    <p className="text-xs text-gray-700 dark:text-gray-300 italic bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                      "{rev.comment}"
                    </p>

                    {/* Validation controls */}
                    <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
                      <input
                        type="text"
                        placeholder="Note du gérant..."
                        value={reviewNoteInput[rev.id] !== undefined ? reviewNoteInput[rev.id] : (rev.managerNote || '')}
                        onChange={e => setReviewNoteInput({ ...reviewNoteInput, [rev.id]: e.target.value })}
                        className="flex-1 min-w-[200px] px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs"
                      />

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            await updateStaffReviewStatus(rev.id, 'valide', reviewNoteInput[rev.id] !== undefined ? reviewNoteInput[rev.id] : rev.managerNote);
                            setSuccessMsg("Avis validé avec succès !");
                            setTimeout(() => setSuccessMsg(null), 3000);
                          }}
                          className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Valider
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            await updateStaffReviewStatus(rev.id, 'invalide', reviewNoteInput[rev.id] !== undefined ? reviewNoteInput[rev.id] : rev.managerNote);
                            setSuccessMsg("Avis invalidé.");
                            setTimeout(() => setSuccessMsg(null), 3000);
                          }}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Invalider
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 4: PAYROLL & AUTOMATIC BONUS / SANCTION */}
      {activeViewMode === 'payroll' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 p-5 shadow-sm space-y-4">
          <div>
            <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">
              Calcul Automatique de Paie, Bonus & Sanctions Pécuniaires ({selectedMonth})
            </h4>
            <p className="text-xs text-gray-400">Algorithme basé sur les heures de présence, les retards et la note moyenne du travailleur.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(staffStatsMap).map(([staffId, stats]) => (
              <div key={staffId} className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-150 dark:border-gray-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-black text-xs text-gray-900 dark:text-white text-base block">{stats.name}</span>
                    <span className="text-[10px] font-bold text-orange-600 uppercase">{stats.role}</span>
                  </div>
                  <span className="text-xs font-black text-amber-500 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-full">
                    ★ {stats.avgRating.toFixed(1)} / 5
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center py-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Shifts</span>
                    <span className="font-black text-xs text-gray-900 dark:text-white">{stats.shiftsCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Retards</span>
                    <span className="font-black text-xs text-orange-600">{stats.totalLate} min</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase block">Incidents</span>
                    <span className="font-black text-xs text-red-600">{stats.incidentsCount}</span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border ${
                  stats.calculatedBonusOrSanction.type === 'bonus' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 text-emerald-800 dark:text-emerald-300' 
                    : 'bg-red-50 dark:bg-red-950/30 border-red-200 text-red-800 dark:text-red-300'
                }`}>
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="flex items-center gap-1">
                      {stats.calculatedBonusOrSanction.type === 'bonus' ? <Sparkles className="w-4 h-4 text-emerald-600" /> : <ShieldAlert className="w-4 h-4 text-red-600" />}
                      {stats.calculatedBonusOrSanction.type === 'bonus' ? 'Prime recommandée' : 'Sanction pécuniaire'}
                    </span>
                    <span className="text-sm">
                      {stats.calculatedBonusOrSanction.type === 'bonus' ? '+' : '-'}{stats.calculatedBonusOrSanction.amount.toLocaleString()} FCFA
                    </span>
                  </div>
                  <p className="text-[11px] mt-1 font-medium opacity-90">
                    {stats.calculatedBonusOrSanction.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW MODE 5: ARCHIVES & MONTHLY PDF REPORTS */}
      {activeViewMode === 'archive' && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-150 dark:border-gray-800 p-5 shadow-sm space-y-4">
          <div>
            <h4 className="font-black text-sm text-gray-900 dark:text-white uppercase tracking-wider">
              🗄️ Archives & Historique des Rapports Mensuels
            </h4>
            <p className="text-xs text-gray-400">Accédez aux données de présence et téléchargez les rapports PDF des mois précédents.</p>
          </div>

          {archiveMonthsSet.length === 0 ? (
            <div className="p-10 bg-gray-50 dark:bg-gray-800/40 rounded-2xl text-center space-y-2">
              <Archive className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-gray-400">Aucune archive mensuelle disponible pour l'instant.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {archiveMonthsSet.map(mStr => {
                const countAtts = allEstAttendances.filter(a => a.date.startsWith(mStr)).length;
                return (
                  <div key={mStr} className="p-4 bg-gray-50 dark:bg-gray-800/40 rounded-2xl border border-gray-150 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h5 className="font-black text-sm text-gray-900 dark:text-white">
                        Mois : {mStr} (Année {mStr.split('-')[0]})
                      </h5>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {countAtts} pointage(s) enregistrés dans les archives.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMonth(mStr);
                          setActiveViewMode('list');
                        }}
                        className="px-3.5 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Voir les données
                      </button>
                      <button
                        type="button"
                        onClick={() => handleGeneratePDF(mStr)}
                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <FileText className="w-4 h-4" /> Télécharger PDF
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Onboarding Modal for New Staff */}
      {showOnboardingModal && (
        <div className="fixed inset-0 bg-black/70 z-[140] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setShowOnboardingModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-6 space-y-4 relative shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span>👋</span> Guide d'Accueil pour les Nouveaux Employés
              </h3>
              <button 
                type="button" 
                onClick={() => setShowOnboardingModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-700 dark:text-gray-300">
              <div className="p-3 bg-orange-50 dark:bg-orange-950/40 rounded-2xl border border-orange-200 dark:border-orange-900 space-y-1">
                <h5 className="font-black text-orange-800 dark:text-orange-200">1. Suivi de vos Shifts & Pointages</h5>
                <p>Chaque jour de travail (matinée ou soirée en maquis/boîte), votre présence et vos éventuels retards sont enregistrés par le gérant ou l'application.</p>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-2xl border border-purple-200 dark:border-purple-900 space-y-1">
                <h5 className="font-black text-purple-800 dark:text-purple-200">2. Soumission de Justificatifs avec Photo</h5>
                <p>En cas de retard ou de départ anticipé, vous pouvez joindre une photo justificative (panne, transport, etc.) qui avertira instantanément le gérant via une notification push pour validation rapide.</p>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-900 space-y-1">
                <h5 className="font-black text-emerald-800 dark:text-emerald-200">3. Statistiques & Primes / Bonus</h5>
                <p>Consultez vos notes clients et votre historique de ponctualité pour décrocher les primes d'excellence mensuelles !</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowOnboardingModal(false)}
              className="w-full py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
            >
              J'ai compris ! Commencer
            </button>
          </div>
        </div>
      )}

      {/* Add Attendance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span>⏱️</span> Enregistrer un Pointage ou une Absence
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-400"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-gray-500">Sélectionnez la date, l'employé, les heures de travail officielles et réelles pour calculer le retard global.</p>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <div className="space-y-3">
              {/* Date & Absence toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Date du jour</label>
                  <input
                    type="date"
                    value={attDate}
                    onChange={e => setAttDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Employé (Serveur, DJ, Caissier...)</label>
                  <select
                    value={attStaffId}
                    onChange={e => setAttStaffId(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                  >
                    <option value="">-- Choisir un employé --</option>
                    {staffMembers.map(m => {
                      const u = users.find(user => user.id === (m.type === 'client_join' ? m.initiatorId : m.targetId));
                      const roleLabel = m.isDJ ? 'DJ' : m.isCaissier ? 'Caissier' : ((m as any).isServeur || m.requestedRole === 'serveur') ? 'Serveur' : (m.requestedRole || 'Employé');
                      return (
                        <option key={m.id} value={u?.id || m.targetId}>
                          {u?.name || 'Employé'} ({roleLabel})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Toggle Presence vs Absence */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-gray-900 dark:text-white block">Statut du jour</span>
                  <span className="text-[10px] text-gray-400">Présence aux heures de travail ou absence</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAttIsAbsent(false)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      !attIsAbsent ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    Présent
                  </button>
                  <button
                    type="button"
                    onClick={() => setAttIsAbsent(true)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      attIsAbsent ? 'bg-red-600 text-white shadow-sm' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    Signaler Absent
                  </button>
                </div>
              </div>

              {attIsAbsent ? (
                <div className="p-3 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-900 space-y-2">
                  <label className="block text-xs font-bold text-red-800 dark:text-red-200">Motif de l'absence</label>
                  <select
                    value={attAbsenceReason}
                    onChange={e => setAttAbsenceReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                  >
                    <option value="Non justifiée">Non justifiée</option>
                    <option value="Maladie">Maladie / Santé</option>
                    <option value="Permission">Permission exceptionnelle</option>
                    <option value="Congé / Repos">Congé / Repos statutaire</option>
                  </select>
                </div>
              ) : (
                <>
                  {/* Shift selection */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Période (Shift)</label>
                    <select
                      value={attPeriod}
                      onChange={e => {
                        const newP = e.target.value as 'matinée' | 'soirée';
                        setAttPeriod(newP);
                        if (newP === 'matinée') {
                          setAttOfficialStartTime('08:00');
                          setAttActualArrivalTime('08:00');
                          setAttOfficialEndTime('17:00');
                          setAttActualDepartureTime('17:00');
                        } else {
                          setAttOfficialStartTime('20:00');
                          setAttActualArrivalTime('20:00');
                          setAttOfficialEndTime('04:00');
                          setAttActualDepartureTime('04:00');
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                    >
                      <option value="soirée">🌙 Soirée / Nuit (Boîte / Maquis)</option>
                      <option value="matinée">☀️ Matinée / Journée</option>
                    </select>
                  </div>

                  {/* Arrival calculation section */}
                  <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/50 space-y-2">
                    <span className="text-xs font-black text-amber-800 dark:text-amber-200 block">1. Pointage de Prise de Service (Arrivée)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400">Heure démarrage travail</label>
                        <input
                          type="time"
                          value={attOfficialStartTime}
                          onChange={e => setAttOfficialStartTime(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400">Heure d'arrivée employé</label>
                        <input
                          type="time"
                          value={attActualArrivalTime}
                          onChange={e => setAttActualArrivalTime(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                        />
                      </div>
                    </div>
                    <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center justify-between pt-1">
                      <span>Retard à l'arrivée calculé :</span>
                      <span className="px-2 py-0.5 bg-amber-200 dark:bg-amber-900 rounded-lg">
                        {liveArrivalDelay > 0 ? `+${liveArrivalDelay} min` : '0 min (À l\'heure)'}
                      </span>
                    </div>
                  </div>

                  {/* Departure calculation section */}
                  <div className="p-3 bg-purple-50/60 dark:bg-purple-950/30 rounded-2xl border border-purple-200 dark:border-purple-900/50 space-y-2">
                    <span className="text-xs font-black text-purple-800 dark:text-purple-200 block">2. Pointage de Fin de Service (Descente)</span>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400">Heure descente travail</label>
                        <input
                          type="time"
                          value={attOfficialEndTime}
                          onChange={e => setAttOfficialEndTime(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400">Heure descente employé</label>
                        <input
                          type="time"
                          value={attActualDepartureTime}
                          onChange={e => setAttActualDepartureTime(e.target.value)}
                          className="w-full px-2 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold"
                        />
                      </div>
                    </div>
                    <div className="text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center justify-between pt-1">
                      <span>Retard à la descente / Départ précoce :</span>
                      <span className="px-2 py-0.5 bg-purple-200 dark:bg-purple-900 rounded-lg">
                        {liveDepartureDelay > 0 ? `+${liveDepartureDelay} min` : '0 min (Conforme)'}
                      </span>
                    </div>
                  </div>

                  {/* Total Daily Delay Summary */}
                  <div className="p-3 bg-orange-100 dark:bg-orange-950/60 rounded-2xl border border-orange-300 dark:border-orange-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-orange-900 dark:text-orange-200 block">⏱️ Retard Global du Jour</span>
                      <span className="text-[10px] text-orange-700 dark:text-orange-300">Cumul retard arrivée + descente</span>
                    </div>
                    <span className="text-sm font-black px-3 py-1 bg-orange-600 text-white rounded-xl shadow-sm">
                      {liveGlobalDelay} min
                    </span>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Justificatif / Remarque</label>
                <input
                  type="text"
                  placeholder="Ex: Panne de transport, justificatif médical..."
                  value={attJustification}
                  onChange={e => setAttJustification(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">URL Photo Justificative (Optionnel)</label>
                <input
                  type="url"
                  placeholder="https://... (lien photo)"
                  value={attPhotoUrl}
                  onChange={e => setAttPhotoUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={async () => {
                  if (!attStaffId) {
                    setErrorMsg("Veuillez sélectionner un employé.");
                    return;
                  }
                  try {
                    const finalJust = attIsAbsent 
                      ? `[ABSENCE] Motif: ${attAbsenceReason}${attJustification ? ' - ' + attJustification : ''}`
                      : attJustification;

                    await createStaffAttendance({
                      establishmentId,
                      staffId: attStaffId,
                      date: attDate,
                      period: attPeriod,
                      officialStartTime: attOfficialStartTime,
                      actualArrivalTime: attActualArrivalTime,
                      arrivalDelayMinutes: liveArrivalDelay,
                      officialEndTime: attOfficialEndTime,
                      actualDepartureTime: attActualDepartureTime,
                      departureDelayMinutes: liveDepartureDelay,
                      totalDailyDelayMinutes: liveGlobalDelay,
                      status: attIsAbsent ? 'absent' : (liveGlobalDelay > 0 ? 'retard' : 'present'),
                      absenceReason: attIsAbsent ? attAbsenceReason : undefined,
                      lateMinutes: liveArrivalDelay,
                      earlyDepartureMinutes: liveDepartureDelay,
                      justification: finalJust,
                      justificationPhotoUrl: attPhotoUrl
                    });

                    setSuccessMsg(attIsAbsent ? "Absence enregistrée et comptabilisée !" : `Pointage enregistré ! Retard global du jour : ${liveGlobalDelay} minutes.`);
                    setShowAddModal(false);
                    setAttJustification('');
                    setAttPhotoUrl('');
                    setErrorMsg(null);
                    setTimeout(() => setSuccessMsg(null), 4000);
                  } catch (err) {
                    console.error(err);
                    setErrorMsg("Erreur lors de l'enregistrement.");
                  }
                }}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-xs transition-all cursor-pointer shadow-sm"
              >
                Valider & Enregistrer
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold py-3 rounded-xl text-xs cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 bg-black/80 z-[150] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in" onClick={() => setPreviewPhoto(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full p-4 space-y-3 relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-gray-900 dark:text-white">Photo Justificative</h4>
              <button 
                type="button" 
                onClick={() => setPreviewPhoto(null)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                ✕
              </button>
            </div>
            <img src={previewPhoto} alt="Justificatif" className="w-full max-h-[400px] object-cover rounded-2xl" />
          </div>
        </div>
      )}
    </div>
  );
}
