import React, { useState } from 'react';
import { useAppStore } from '../store';
import { StaffAttendance, StaffReview } from '../types';
import { 
  Calendar as CalendarIcon, Download, Clock, AlertTriangle, Award, 
  Users, CheckCircle, XCircle, Plus, Trash2, BellRing, FileText, 
  Eye, Check, ShieldAlert, Star, DollarSign, Image as ImageIcon, Sparkles 
} from 'lucide-react';
import jsPDF from 'jspdf';

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
  const [activeViewMode, setActiveViewMode] = useState<'list' | 'calendar' | 'reviews' | 'payroll'>('list');
  
  // Threshold settings for alerts
  const [lateThresholdMinutes, setLateThresholdMinutes] = useState<number>(60);
  const [incidentThresholdCount, setIncidentThresholdCount] = useState<number>(3);
  const [showConfigAlerts, setShowConfigAlerts] = useState(false);

  // Modal for adding new attendance
  const [showAddModal, setShowAddModal] = useState(false);
  const [attDate, setAttDate] = useState(new Date().toISOString().split('T')[0]);
  const [attStaffId, setAttStaffId] = useState('');
  const [attPeriod, setAttPeriod] = useState<'matinée' | 'soirée'>('soirée');
  const [attLateMinutes, setAttLateMinutes] = useState('0');
  const [attEarlyMinutes, setAttEarlyMinutes] = useState('0');
  const [attJustification, setAttJustification] = useState('');
  const [attPhotoUrl, setAttPhotoUrl] = useState('');
  
  // Photo modal preview
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Review management modal state
  const [reviewNoteInput, setReviewNoteInput] = useState<Record<string, string>>({});
  const [reviewAmountInput, setReviewAmountInput] = useState<Record<string, string>>({});
  const [reviewBonusType, setReviewBonusType] = useState<Record<string, 'bonus' | 'sanction'>>({});

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Staff members in this establishment
  const staffMembers = relationshipRequests.filter(
    r => r.establishmentId === establishmentId && r.status === 'acceptee' && (r.isDJ || (r.requestedRole && r.requestedRole !== 'client'))
  );

  // Filter attendances for this establishment and selected month
  const monthAttendances = staffAttendances.filter(a => {
    const matchesEst = a.establishmentId === establishmentId;
    const matchesMonth = a.date.startsWith(selectedMonth);
    const matchesStaff = selectedStaffId === 'all' || a.staffId === selectedStaffId;
    return matchesEst && matchesMonth && matchesStaff;
  });

  // Calculate stats per staff for alerts & payroll
  const staffStatsMap: Record<string, { 
    totalLate: number; 
    totalEarly: number; 
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
    
    // Calculate worker reviews rating
    const workerReviews = staffReviews.filter(r => r.establishmentId === establishmentId && r.staffId === staffId && r.status === 'valide');
    const avgRating = workerReviews.length > 0
      ? workerReviews.reduce((sum, rev) => sum + rev.rating, 0) / workerReviews.length
      : 5.0;

    staffStatsMap[staffId] = {
      totalLate: 0,
      totalEarly: 0,
      incidentsCount: 0,
      shiftsCount: 0,
      name: u?.name || 'Employé',
      role: m.isDJ ? 'DJ' : (m.requestedRole || 'Employé'),
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
        incidentsCount: 0,
        shiftsCount: 0,
        name: u?.name || 'Employé',
        role: 'Employé',
        avgRating: 5.0,
        calculatedBonusOrSanction: { type: 'bonus', amount: 0, reason: '' }
      };
    }
    staffStatsMap[a.staffId].shiftsCount += 1;
    staffStatsMap[a.staffId].totalLate += a.lateMinutes;
    staffStatsMap[a.staffId].totalEarly += a.earlyDepartureMinutes;
    if (a.lateMinutes > 0 || a.earlyDepartureMinutes > 0) {
      staffStatsMap[a.staffId].incidentsCount += 1;
    }
  });

  // Automatically calculate pecuniary bonus or sanction based on hours/retards and rating
  Object.keys(staffStatsMap).forEach(staffId => {
    const stats = staffStatsMap[staffId];
    if (stats.totalLate === 0 && stats.totalEarly === 0 && stats.avgRating >= 4.5) {
      stats.calculatedBonusOrSanction = { type: 'bonus', amount: 25000, reason: 'Prime de ponctualité & excellence (25k FCFA)' };
    } else if (stats.totalLate > 60 || stats.incidentsCount >= 3 || stats.avgRating < 3.0) {
      const deduction = Math.min(50000, (stats.totalLate * 500) + (stats.incidentsCount * 2500));
      stats.calculatedBonusOrSanction = { type: 'sanction', amount: deduction, reason: `Retards cumulés (${stats.totalLate} min) / Incidents (${stats.incidentsCount})` };
    } else {
      stats.calculatedBonusOrSanction = { type: 'bonus', amount: 10000, reason: 'Régularité standard (10k FCFA)' };
    }
  });

  // Identify staff exceeding thresholds
  const flaggedStaff = Object.entries(staffStatsMap).filter(([_, stats]) => {
    return stats.totalLate >= lateThresholdMinutes || stats.incidentsCount >= incidentThresholdCount;
  });

  // Performance indicators
  const totalLateMinutes = monthAttendances.reduce((acc, curr) => acc + curr.lateMinutes, 0);
  const totalEarlyMinutes = monthAttendances.reduce((acc, curr) => acc + curr.earlyDepartureMinutes, 0);
  
  // Staff reviews for this establishment
  const estReviews = staffReviews.filter(r => r.establishmentId === establishmentId);
  const avgStaffRating = estReviews.filter(r => r.status === 'valide').length > 0 
    ? (estReviews.filter(r => r.status === 'valide').reduce((acc, curr) => acc + curr.rating, 0) / estReviews.filter(r => r.status === 'valide').length).toFixed(1)
    : '5.0';

  const handleExportCSV = () => {
    if (monthAttendances.length === 0) {
      alert("Aucune donnée de présence pour ce mois à exporter.");
      return;
    }
    let csvContent = "data:text/csv;charset=utf-8,ID Employe;Nom Employe;Date;Periode;Retard (min);Depart Anticipe (min);Justificatif\n";
    monthAttendances.forEach(att => {
      const memberUser = users.find(u => u.id === att.staffId);
      csvContent += `${att.staffId};"${memberUser?.name || 'Inconnu'}";${att.date};${att.period};${att.lateMinutes};${att.earlyDepartureMinutes};"${att.justification || ''}"\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tableau_de_bord_rh_${establishmentName.replace(/\s+/g, '_')}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Generate PDF Report using jsPDF
  const handleGeneratePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header styling
    doc.setFillColor(30, 41, 59); // Slate dark
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`TABLEAU DE BORD RH & PAIE`, 15, 15);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Etablissement : ${establishmentName} | Mois : ${selectedMonth}`, 15, 25);

    // Summary KPI section
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('1. Indicateurs Globaux de Performance', 15, 48);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`- Effectif Actif : ${staffMembers.length} employés`, 20, 56);
    doc.text(`- Total Retards Cumulés : ${totalLateMinutes} minutes`, 20, 63);
    doc.text(`- Total Départs Anticipés : ${totalEarlyMinutes} minutes`, 20, 70);
    doc.text(`- Note Moyenne Globale : ${avgStaffRating} / 5 étoiles`, 20, 77);

    // Staff stats breakdown
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('2. Synthèse par Employé & Paie / Bonus', 15, 92);

    let startY = 100;
    doc.setFontSize(9);
    doc.setFillColor(241, 245, 249);
    doc.rect(15, startY, pageWidth - 30, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Nom / Rôle', 18, startY + 5);
    doc.text('Shifts', 80, startY + 5);
    doc.text('Retards', 105, startY + 5);
    doc.text('Avis / Note', 135, startY + 5);
    doc.text('Bonus / Sanction Rec.', 165, startY + 5);

    startY += 8;
    doc.setFont('helvetica', 'normal');

    Object.entries(staffStatsMap).forEach(([_, stats], idx) => {
      if (startY > 270) {
        doc.addPage();
        startY = 20;
      }
      doc.text(`${stats.name} (${stats.role})`, 18, startY + 6);
      doc.text(`${stats.shiftsCount}`, 80, startY + 6);
      doc.text(`${stats.totalLate} min`, 105, startY + 6);
      doc.text(`${stats.avgRating.toFixed(1)} / 5`, 135, startY + 6);
      const bsStr = `${stats.calculatedBonusOrSanction.type === 'bonus' ? '+' : '-'}${stats.calculatedBonusOrSanction.amount}F`;
      doc.text(bsStr, 165, startY + 6);

      startY += 8;
    });

    // Save PDF
    doc.save(`Rapport_RH_${establishmentName.replace(/\s+/g, '_')}_${selectedMonth}.pdf`);
    setSuccessMsg("Rapport PDF généré et téléchargé avec succès !");
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
            onClick={handleGeneratePDF}
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

      {/* Navigation Sub-Tabs for RH Modes */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
        {[
          { id: 'list', label: '📋 Liste des Pointages', icon: Clock },
          { id: 'calendar', label: '🗓️ Calendrier Interactif', icon: CalendarIcon },
          { id: 'reviews', label: '⭐ Avis & Notes Employés', icon: Star },
          { id: 'payroll', label: '💰 Paie & Bonus / Sanctions', icon: DollarSign },
        ].map(tab => {
          const IconComp = tab.icon;
          const isActive = activeViewMode === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveViewMode(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
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
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Total Retards</span>
            <p className="text-2xl font-black text-orange-600 mt-1">{totalLateMinutes} min</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 font-black">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-150 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Départs Anticipés</span>
            <p className="text-2xl font-black text-red-600 mt-1">{totalEarlyMinutes} min</p>
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
              <p className="text-xs text-gray-400">Retrouvez le détail des shifts, retards et justificatifs photo.</p>
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
                    <th className="p-3">Période (Shift)</th>
                    <th className="p-3">Retard (arrivée)</th>
                    <th className="p-3">Départ anticipé</th>
                    <th className="p-3">Justificatif & Photo</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {monthAttendances.map(att => {
                    const memberUser = users.find(u => u.id === att.staffId);
                    return (
                      <tr key={att.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-all">
                        <td className="p-3 font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-orange-500" />
                          {att.date}
                        </td>
                        <td className="p-3 font-bold text-gray-800 dark:text-gray-200">
                          {memberUser?.name || 'Employé inconnu'}
                        </td>
                        <td className="p-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            att.period === 'soirée' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {att.period === 'soirée' ? '🌙 Soirée' : '☀️ Matinée'}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-orange-600">
                          {att.lateMinutes > 0 ? `+${att.lateMinutes} min` : 'A l\'heure'}
                        </td>
                        <td className="p-3 font-bold text-red-600">
                          {att.earlyDepartureMinutes > 0 ? `${att.earlyDepartureMinutes} min tôt` : 'Aucun'}
                        </td>
                        <td className="p-3 text-gray-500 space-y-1">
                          <div className="italic">{att.justification || 'Aucun justificatif'}</div>
                          {att.justificationPhotoUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewPhoto(att.justificationPhotoUrl!)}
                              className="text-[10px] font-bold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <ImageIcon className="w-3 h-3" /> Voir la photo justificative
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

          {estReviews.length === 0 ? (
            <div className="p-10 bg-gray-50 dark:bg-gray-800/40 rounded-2xl text-center space-y-2">
              <Star className="w-10 h-10 text-gray-300 mx-auto" />
              <p className="text-xs font-bold text-gray-400">Aucun avis client enregistré pour le personnel de cet établissement.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {estReviews.map(rev => {
                const clientObj = users.find(u => u.id === rev.clientId);
                const staffObj = users.find(u => u.id === rev.staffId);
                const isPending = rev.status === 'en_attente';

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

      {/* Add Attendance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-[120] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>⏱️</span> Enregistrer un pointage journalier
            </h3>
            <p className="text-xs text-gray-500">Précisez la période de travail (matinée ou soirée), les retards et la photo justificative.</p>

            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Employé</label>
                <select
                  value={attStaffId}
                  onChange={e => setAttStaffId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                >
                  <option value="">Sélectionner un employé</option>
                  {staffMembers.map(m => {
                    const u = users.find(user => user.id === (m.type === 'client_join' ? m.initiatorId : m.targetId));
                    return (
                      <option key={m.id} value={u?.id || m.targetId}>
                        {u?.name || 'Employé'} ({m.isDJ ? 'DJ' : m.requestedRole})
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Date</label>
                  <input
                    type="date"
                    value={attDate}
                    onChange={e => setAttDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Période (Shift)</label>
                  <select
                    value={attPeriod}
                    onChange={e => setAttPeriod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-white"
                  >
                    <option value="soirée">🌙 Soirée (Boîte / Maquis)</option>
                    <option value="matinée">☀️ Matinée / Journée</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Retard d'arrivée (min)</label>
                  <input
                    type="number"
                    min="0"
                    value={attLateMinutes}
                    onChange={e => setAttLateMinutes(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Départ anticipé (min)</label>
                  <input
                    type="number"
                    min="0"
                    value={attEarlyMinutes}
                    onChange={e => setAttEarlyMinutes(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">Justificatif textuel</label>
                <input
                  type="text"
                  placeholder="Ex: Panne de transport, embouteillage..."
                  value={attJustification}
                  onChange={e => setAttJustification(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-medium text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">URL Photo Justificative (Optionnel)</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/... (ou lien photo)"
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
                    await createStaffAttendance({
                      establishmentId,
                      staffId: attStaffId,
                      date: attDate,
                      period: attPeriod,
                      lateMinutes: Number(attLateMinutes) || 0,
                      earlyDepartureMinutes: Number(attEarlyMinutes) || 0,
                      justification: attJustification,
                      justificationPhotoUrl: attPhotoUrl
                    });
                    setSuccessMsg("Pointage journalier et justificatif enregistrés avec succès !");
                    setShowAddModal(false);
                    setAttLateMinutes('0');
                    setAttEarlyMinutes('0');
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
                Enregistrer
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
