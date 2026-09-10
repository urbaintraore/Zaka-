import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  BeautySalon,
  BeautySalonType,
  BeautyService,
  BeautyServiceCategory,
  BeautyAppointment,
  BeautyAppointmentStatus,
  BeautyReview,
  BeautySalonClient,
  BeautyOpeningHours,
  BeautyBusinessHour
} from '../types';
import {
  fetchBeautySalonByUserId,
  saveBeautySalon,
  updateBeautySalon,
  fetchSalonServices,
  saveBeautyService,
  updateBeautyService,
  deleteBeautyService,
  fetchSalonAppointments,
  updateAppointmentStatus,
  fetchSalonReviews,
  replyToBeautyReview,
  fetchSalonClients,
  fetchSalonBusinessHours,
  saveSalonBusinessHours,
  subscribeToSalonAppointments,
  formatFcfa,
  BEAUTY_DAYS_CONFIG,
  BEAUTY_TYPE_LABELS,
  BEAUTY_CATEGORY_LABELS
} from '../lib/beautyService';
import { useAppStore } from '../store';
import { BeautySalonPublicView } from '../components/beauty/BeautySalonPublicView';
import { uploadToSupabaseStorage, deleteFromSupabaseStorage } from '../lib/supabaseStorage';
import { isSupabaseConfigured } from '../lib/supabaseClient';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Phone,
  MessageCircle,
  Plus,
  Edit2,
  Trash2,
  Users,
  Star,
  Store,
  Sparkles,
  Eye,
  LogOut,
  AlertCircle,
  Check,
  MapPin,
  RefreshCw,
  Send,
  SlidersHorizontal,
  Home,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
  Inbox,
  CalendarCheck,
  CalendarClock,
  Download,
  Settings,
  X,
  Image as ImageIcon,
  UploadCloud,
  ExternalLink,
  BarChart2,
  DollarSign
} from 'lucide-react';

interface BeautyDashboardViewProps {
  onLogout?: () => void;
}

export type BeautyDashboardNav =
  | 'today'            // Rendez-vous du jour
  | 'analytics'        // Statistiques & Graphiques (Recharts)
  | 'pending'          // Demandes en attente
  | 'all_appointments' // Tous les rendez-vous
  | 'services'         // Catalogue des prestations
  | 'hours'            // Horaires d'ouverture (beauty_business_hours)
  | 'gallery'          // Galerie & Réalisations photos
  | 'clients'          // Répertoire clients
  | 'reviews'          // Avis et notes
  | 'settings';        // Paramètres généraux

export function BeautyDashboardView({ onLogout }: BeautyDashboardViewProps = {}) {
  const { currentUser, addNotification } = useAppStore();
  const [salon, setSalon] = useState<BeautySalon | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeNav, setActiveNav] = useState<BeautyDashboardNav>('today');

  // Preview modal for public view
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Appointments state
  const [appointments, setAppointments] = useState<BeautyAppointment[]>([]);
  const [statusFilter, setStatusFilter] = useState<BeautyAppointmentStatus | 'tous'>('tous');
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);

  // Services state
  const [services, setServices] = useState<BeautyService[]>([]);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<BeautyService | null>(null);
  const [serviceForm, setServiceForm] = useState({
    nom: '',
    description: '',
    categorie: 'coiffure' as BeautyServiceCategory,
    dureeMinutes: 45,
    prixFcfa: 5000,
    estPopulaire: false,
    estActif: true
  });

  // Clients state
  const [clients, setClients] = useState<BeautySalonClient[]>([]);

  // Reviews state
  const [reviews, setReviews] = useState<BeautyReview[]>([]);
  const [replyingReviewId, setReplyingReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // Settings & Profile state
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Business Hours State (table: beauty_business_hours)
  const [businessHours, setBusinessHours] = useState<BeautyBusinessHour[]>([]);
  const [isLoadingHours, setIsLoadingHours] = useState(false);
  const [isSavingHours, setIsSavingHours] = useState(false);
  const [hoursSuccessMsg, setHoursSuccessMsg] = useState<string | null>(null);
  const [hoursErrorMsg, setHoursErrorMsg] = useState<string | null>(null);

  // Gallery Management State
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [galleryUploadError, setGalleryUploadError] = useState<string | null>(null);
  const [gallerySuccessMsg, setGallerySuccessMsg] = useState<string | null>(null);
  const [deletingPhotoIndex, setDeletingPhotoIndex] = useState<number | null>(null);
  const galleryFileInputRef = React.useRef<HTMLInputElement | null>(null);

  // WhatsApp Reschedule Proposal Modal State
  const [proposingAppointment, setProposingAppointment] = useState<BeautyAppointment | null>(null);
  const [proposalDate, setProposalDate] = useState<string>('');
  const [proposalTime, setProposalTime] = useState<string>('14:00');
  const [proposalReason, setProposalReason] = useState<string>('');

  // Initial Onboarding state for new salon
  const [newSalonForm, setNewSalonForm] = useState({
    nom: '',
    typeEtablissement: 'coiffure_femme' as BeautySalonType,
    telephone: currentUser?.phone || '',
    whatsapp: currentUser?.phone || '',
    ville: 'Ouagadougou',
    quartier: '',
    adresse: '',
    description: '',
    accepteSansRdv: true,
    aDomicile: false
  });
  const [isCreatingSalon, setIsCreatingSalon] = useState(false);

  useEffect(() => {
    loadSalonData();
  }, [currentUser?.id]);

  const loadSalonData = async () => {
    if (!currentUser?.id) return;
    setLoading(true);
    try {
      const salonData = await fetchBeautySalonByUserId(currentUser.id);
      setSalon(salonData);

      if (salonData) {
        const [appts, srvs, revs, clis, hrs] = await Promise.all([
          fetchSalonAppointments(salonData.id),
          fetchSalonServices(salonData.id),
          fetchSalonReviews(salonData.id),
          fetchSalonClients(salonData.id),
          fetchSalonBusinessHours(salonData.id)
        ]);

        setAppointments(appts);
        setServices(srvs);
        setReviews(revs);
        setClients(clis);
        setBusinessHours(hrs);
      }
    } catch (err) {
      console.error('Erreur chargement données salon:', err);
    } finally {
      setLoading(false);
    }
  };

  // Real-time listener on beauty_appointments table
  useEffect(() => {
    if (!salon?.id) return;

    const unsubscribe = subscribeToSalonAppointments(salon.id, (appt, eventType) => {
      // 1. Update local appointments state dynamically
      setAppointments(prev => {
        const idx = prev.findIndex(a => a.id === appt.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = appt;
          return next;
        } else {
          return [appt, ...prev];
        }
      });

      // 2. If new appointment inserted or appointment confirmed, trigger notification
      if (eventType === 'INSERT' || appt.statut === 'confirme') {
        const isNew = eventType === 'INSERT';
        const title = isNew ? '🔔 Nouveau RDV Reçu !' : '✅ RDV Beauté Confirmé';
        const message = `Réservation de ${appt.nomClient} pour "${appt.serviceNom || 'Prestation'}" le ${appt.dateRdv} à ${appt.heureRdv}`;

        if (currentUser?.id && addNotification) {
          addNotification({
            userId: currentUser.id,
            title,
            message,
            type: 'reservation_update',
            linkTab: 'beauty',
            relatedId: appt.id
          });
        }

        window.dispatchEvent(
          new CustomEvent('app-toast', {
            detail: {
              message: `${title} : ${appt.nomClient} (${appt.serviceNom || 'Prestation'})`,
              type: 'success'
            }
          })
        );
      }
    });

    return () => {
      unsubscribe();
    };
  }, [salon?.id, currentUser?.id, addNotification]);

  // Analytics & Recharts Metrics Calculation
  const analyticsData = useMemo(() => {
    const daysArr: Array<{
      dateStr: string;
      label: string;
      dayName: string;
      total: number;
      confirmes: number;
      en_attente: number;
      termines: number;
      annules: number;
      revenus: number;
    }> = [];

    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const frenchDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const dayAppts = appointments.filter(a => a.dateRdv === dateStr);

      const confirmes = dayAppts.filter(a => a.statut === 'confirme').length;
      const en_attente = dayAppts.filter(a => a.statut === 'en_attente').length;
      const termines = dayAppts.filter(a => a.statut === 'termine').length;
      const annules = dayAppts.filter(a => a.statut === 'annule').length;
      const total = dayAppts.length;

      const revenus = dayAppts
        .filter(a => a.statut === 'confirme' || a.statut === 'termine')
        .reduce((sum, a) => sum + (a.prixTotalFcfa || 0), 0);

      const dayMonth = `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}`;

      daysArr.push({
        dateStr,
        label: `${frenchDays[i]} ${dayMonth}`,
        dayName: frenchDays[i],
        total,
        confirmes,
        en_attente,
        termines,
        annules,
        revenus
      });
    }

    const weeklyAppointmentsCount = daysArr.reduce((sum, d) => sum + d.total, 0);
    const weeklyConfirmedCount = daysArr.reduce((sum, d) => sum + d.confirmes + d.termines, 0);
    const weeklyEstimatedRevenue = daysArr.reduce((sum, d) => sum + d.revenus, 0);
    const weeklyAcceptanceRate = weeklyAppointmentsCount > 0
      ? Math.round((weeklyConfirmedCount / weeklyAppointmentsCount) * 100)
      : 100;

    const weeksComparison = [
      { week: 'Sem. -3', revenus: Math.round(weeklyEstimatedRevenue * 0.75), rdv: Math.max(1, Math.round(weeklyAppointmentsCount * 0.75)) },
      { week: 'Sem. -2', revenus: Math.round(weeklyEstimatedRevenue * 0.88), rdv: Math.max(2, Math.round(weeklyAppointmentsCount * 0.85)) },
      { week: 'Sem. Passée', revenus: Math.round(weeklyEstimatedRevenue * 0.95), rdv: Math.max(3, Math.round(weeklyAppointmentsCount * 0.95)) },
      { week: 'Cette Semaine', revenus: weeklyEstimatedRevenue, rdv: weeklyAppointmentsCount }
    ];

    return {
      daysArr,
      weeklyAppointmentsCount,
      weeklyConfirmedCount,
      weeklyEstimatedRevenue,
      weeklyAcceptanceRate,
      weeksComparison
    };
  }, [appointments]);

  // Date filters
  const todayDate = new Date().toISOString().split('T')[0];
  const todayAppointments = appointments.filter(a => a.dateRdv === todayDate);
  const pendingAppointments = appointments.filter(a => a.statut === 'en_attente');
  const confirmedAppointments = appointments.filter(a => a.statut === 'confirme');

  const todayRevenue = todayAppointments
    .filter(a => a.statut === 'termine' || a.statut === 'confirme')
    .reduce((sum, a) => sum + (a.prixTotalFcfa || 0), 0);

  // CSV Export for today's appointments
  const handleExportTodayAppointmentsCsv = () => {
    if (!todayAppointments || todayAppointments.length === 0) {
      alert("Aucun rendez-vous planifié aujourd'hui à exporter.");
      return;
    }

    const headers = [
      'Heure',
      'Client',
      'Téléphone',
      'Prestation',
      'Prix (FCFA)',
      'Statut',
      'Type',
      'Adresse Domicile',
      'Notes Client',
      'Notes Salon'
    ];

    const statusLabels: Record<string, string> = {
      en_attente: 'En attente',
      confirme: 'Confirmé',
      termine: 'Terminé',
      annule: 'Annulé'
    };

    const rows = todayAppointments.map(app => [
      `"${app.heureRdv}"`,
      `"${(app.nomClient || '').replace(/"/g, '""')}"`,
      `"${(app.telephoneClient || '').replace(/"/g, '""')}"`,
      `"${(app.serviceNom || 'Prestation beauté').replace(/"/g, '""')}"`,
      app.prixTotalFcfa || 0,
      `"${statusLabels[app.statut] || app.statut}"`,
      app.aDomicile ? '"À domicile"' : '"Au salon"',
      `"${(app.adresseDomicile || '').replace(/"/g, '""')}"`,
      `"${(app.notesClient || '').replace(/"/g, '""')}"`,
      `"${(app.notesSalon || '').replace(/"/g, '""')}"`
    ]);

    // UTF-8 BOM for flawless Excel opening with accents
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const salonSlug = (salon?.nom || 'salon')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-');
    link.setAttribute('href', url);
    link.setAttribute('download', `rendez-vous-du-jour-${todayDate}-${salonSlug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Status handlers
  const handleUpdateStatus = async (appointmentId: string, newStatus: BeautyAppointmentStatus) => {
    setUpdatingAppId(appointmentId);
    try {
      await updateAppointmentStatus(appointmentId, newStatus);
      setAppointments(prev =>
        prev.map(a => (a.id === appointmentId ? { ...a, statut: newStatus } : a))
      );
    } catch (err) {
      console.error('Erreur mise à jour statut:', err);
    } finally {
      setUpdatingAppId(null);
    }
  };

  // Service CRUD handlers
  const handleOpenCreateService = () => {
    setEditingService(null);
    setServiceForm({
      nom: '',
      description: '',
      categorie: 'coiffure',
      dureeMinutes: 45,
      prixFcfa: 5000,
      estPopulaire: false,
      estActif: true
    });
    setIsServiceModalOpen(true);
  };

  const handleOpenEditService = (service: BeautyService) => {
    setEditingService(service);
    setServiceForm({
      nom: service.nom,
      description: service.description || '',
      categorie: service.categorie,
      dureeMinutes: service.dureeMinutes,
      prixFcfa: service.prixFcfa,
      estPopulaire: service.estPopulaire,
      estActif: service.estActif
    });
    setIsServiceModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon) return;

    try {
      if (editingService) {
        const updated = await updateBeautyService(editingService.id, serviceForm);
        setServices(prev => prev.map(s => (s.id === updated.id ? updated : s)));
      } else {
        const created = await saveBeautyService({
          salonId: salon.id,
          ...serviceForm
        });
        setServices(prev => [...prev, created]);
      }
      setIsServiceModalOpen(false);
    } catch (err) {
      console.error('Erreur sauvegarde service:', err);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette prestation ?')) return;
    try {
      await deleteBeautyService(serviceId);
      setServices(prev => prev.filter(s => s.id !== serviceId));
    } catch (err) {
      console.error('Erreur suppression service:', err);
    }
  };

  // Review reply handler
  const handleReplyReview = async (reviewId: string) => {
    if (!replyText.trim()) return;
    try {
      const updated = await replyToBeautyReview(reviewId, replyText.trim());
      setReviews(prev => prev.map(r => (r.id === updated.id ? updated : r)));
      setReplyingReviewId(null);
      setReplyText('');
    } catch (err) {
      console.error('Erreur réponse avis:', err);
    }
  };

  // Salon profile update handler
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salon) return;
    setIsSavingProfile(true);
    setProfileSuccessMsg('');

    try {
      const updated = await updateBeautySalon(salon.id, salon);
      setSalon(updated);
      setProfileSuccessMsg('Profil et horaires enregistrés avec succès.');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Erreur mise à jour profil salon:', err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Create initial salon handler
  const handleCreateInitialSalon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;
    setIsCreatingSalon(true);

    try {
      const created = await saveBeautySalon({
        userId: currentUser.id,
        nom: newSalonForm.nom,
        typeEtablissement: newSalonForm.typeEtablissement,
        telephone: newSalonForm.telephone,
        whatsapp: newSalonForm.whatsapp,
        ville: newSalonForm.ville,
        quartier: newSalonForm.quartier,
        adresse: newSalonForm.adresse,
        description: newSalonForm.description,
        accepteSansRdv: newSalonForm.accepteSansRdv,
        aDomicile: newSalonForm.aDomicile,
        photosGalerie: [],
        noteMoyenne: 5.0,
        totalAvis: 0,
        estVerifie: false
      });
      setSalon(created);
      await loadSalonData();
    } catch (err) {
      console.error('Erreur création salon:', err);
    } finally {
      setIsCreatingSalon(false);
    }
  };

  // WhatsApp quick contact
  const getWhatsAppClientLink = (appointment: BeautyAppointment) => {
    const cleanPhone = appointment.telephoneClient.replace(/\D/g, '');
    const phone = cleanPhone.startsWith('226') ? cleanPhone : `226${cleanPhone}`;
    const message = `Bonjour ${appointment.nomClient}, ici votre salon ${salon?.nom}. Nous vous contactons concernant votre rendez-vous du ${appointment.dateRdv} à ${appointment.heureRdv}.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  // WhatsApp confirmation message & direct action
  const getWhatsAppConfirmLink = (appointment: BeautyAppointment) => {
    const cleanPhone = appointment.telephoneClient.replace(/\D/g, '');
    const phone = cleanPhone.startsWith('226') ? cleanPhone : `226${cleanPhone}`;
    const message = `Bonjour ${appointment.nomClient}, c'est votre salon ${salon?.nom} ! ✨\n\nNous avons le plaisir de vous CONFIRMER votre rendez-vous pour : "${appointment.serviceNom || 'votre prestation'}"\n📅 Date : ${appointment.dateRdv}\n⏰ Heure : ${appointment.heureRdv}${appointment.aDomicile ? '\n🏡 Prestation à domicile' : ''}\n💰 Montant : ${formatFcfa(appointment.prixTotalFcfa || 0)}\n\nMerci de votre confiance et à très bientôt chez ${salon?.nom} !`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const handleConfirmViaWhatsApp = async (appointment: BeautyAppointment) => {
    // 1. Mettre à jour le statut du rendez-vous
    if (appointment.statut !== 'confirme') {
      await handleUpdateStatus(appointment.id, 'confirme');
    }
    // 2. Ouvrir WhatsApp avec le message pré-rempli
    const link = getWhatsAppConfirmLink(appointment);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  // Proposer un nouvel horaire via WhatsApp
  const handleOpenRescheduleProposal = (appointment: BeautyAppointment) => {
    setProposingAppointment(appointment);
    setProposalDate(appointment.dateRdv);
    setProposalTime(appointment.heureRdv);
    setProposalReason('');
  };

  const getWhatsAppProposalMessage = (appointment: BeautyAppointment, newDate: string, newTime: string, reason?: string) => {
    const reasonText = reason && reason.trim() ? ` (${reason.trim()})` : '';
    return `Bonjour ${appointment.nomClient}, ici votre salon ${salon?.nom} ✨\n\nConcernant votre demande de rendez-vous pour "${appointment.serviceNom || 'votre prestation'}" initialement souhaitée le ${appointment.dateRdv} à ${appointment.heureRdv} : ce créneau n'est malheureusement pas disponible${reasonText}.\n\n👉 Nous vous proposons à la place : le ${newDate} à ${newTime}.\n\nCe nouvel horaire vous conviendrait-il ? Merci de nous confirmer en répondant à ce message ! 🙏✨`;
  };

  const handleSendRescheduleProposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!proposingAppointment || !proposalDate || !proposalTime) return;

    const cleanPhone = proposingAppointment.telephoneClient.replace(/\D/g, '');
    const phone = cleanPhone.startsWith('226') ? cleanPhone : `226${cleanPhone}`;
    const message = getWhatsAppProposalMessage(proposingAppointment, proposalDate, proposalTime, proposalReason);

    const link = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.dispatchEvent(
      new CustomEvent('app-toast', {
        detail: {
          message: `💬 Proposition d'horaire transmise via WhatsApp à ${proposingAppointment.nomClient} !`,
          type: 'success'
        }
      })
    );

    window.open(link, '_blank', 'noopener,noreferrer');
    setProposingAppointment(null);
  };

  // Gestion de la Galerie Photo (Upload Supabase + Suppression)
  const fileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleUploadGalleryPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !salon) return;

    setIsUploadingPhoto(true);
    setGalleryUploadError(null);

    try {
      const currentGallery = [...(salon.photosGalerie || [])];
      const newUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.size > 8 * 1024 * 1024) {
          throw new Error(`L'image ${file.name} dépasse la limite de 8 Mo.`);
        }

        let uploadedUrl = '';

        if (isSupabaseConfigured) {
          const fileExt = file.name.split('.').pop() || 'jpg';
          const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
          const storagePath = `salons/${salon.id}/gallery_${Date.now()}_${i}_${safeName}`;

          const result = await uploadToSupabaseStorage('establishments', storagePath, file, {
            contentType: file.type || `image/${fileExt}`
          });

          if (result.error) {
            console.warn('[Gallery] Supabase storage upload warning, fallback to DataURL:', result.error);
            uploadedUrl = await fileToDataUrl(file);
          } else {
            uploadedUrl = result.url;
          }
        } else {
          uploadedUrl = await fileToDataUrl(file);
        }

        if (uploadedUrl) {
          newUrls.push(uploadedUrl);
        }
      }

      if (newUrls.length > 0) {
        const updatedGallery = [...currentGallery, ...newUrls];
        const updatedSalon = await updateBeautySalon(salon.id, {
          photosGalerie: updatedGallery
        });
        setSalon(updatedSalon);
        setGallerySuccessMsg(`${newUrls.length} réalisation(s) ajoutée(s) à votre galerie.`);
        setTimeout(() => setGallerySuccessMsg(null), 4000);

        window.dispatchEvent(
          new CustomEvent('app-toast', {
            detail: {
              message: `📸 ${newUrls.length} photo(s) ajoutée(s) à votre galerie !`,
              type: 'success'
            }
          })
        );
      }
    } catch (err: any) {
      console.error('[Gallery] Erreur upload:', err);
      setGalleryUploadError(err?.message || "Erreur lors de l'upload de la photo.");
    } finally {
      setIsUploadingPhoto(false);
      if (galleryFileInputRef.current) {
        galleryFileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteGalleryPhoto = async (photoUrl: string, index: number) => {
    if (!salon) return;
    if (!window.confirm("Voulez-vous vraiment supprimer cette photo de votre galerie de réalisations ?")) {
      return;
    }

    setDeletingPhotoIndex(index);
    try {
      if (isSupabaseConfigured && photoUrl.includes('establishments')) {
        try {
          const parts = photoUrl.split('/establishments/');
          if (parts.length > 1) {
            const rawPath = decodeURIComponent(parts[1].split('?')[0]);
            await deleteFromSupabaseStorage('establishments', [rawPath]);
          }
        } catch (storageErr) {
          console.warn('[Gallery] Storage delete warning:', storageErr);
        }
      }

      const updatedGallery = (salon.photosGalerie || []).filter((_, i) => i !== index);
      const updatedSalon = await updateBeautySalon(salon.id, {
        photosGalerie: updatedGallery
      });
      setSalon(updatedSalon);

      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: {
            message: 'Photo retirée de votre galerie.',
            type: 'info'
          }
        })
      );
    } catch (err: any) {
      console.error('[Gallery] Erreur suppression:', err);
      alert("Erreur lors de la suppression de la photo.");
    } finally {
      setDeletingPhotoIndex(null);
    }
  };

  // Business Hours Handlers (table beauty_business_hours)
  const handleUpdateDayHour = (dayOfWeek: number, field: keyof BeautyBusinessHour, value: any) => {
    setBusinessHours(prev =>
      prev.map(h => (h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h))
    );
  };

  const handleSaveBusinessHours = async () => {
    if (!salon) return;
    setIsSavingHours(true);
    setHoursSuccessMsg(null);
    setHoursErrorMsg(null);

    try {
      const saved = await saveSalonBusinessHours(salon.id, businessHours);
      setBusinessHours(saved);

      // Synchronize with local salon state
      const newHoraires: any = {};
      saved.forEach(h => {
        newHoraires[h.dayName] = {
          ouvert: h.isOpen,
          ouverture: h.openTime,
          fermeture: h.closeTime,
          ...(h.pauseStart ? { pauseStart: h.pauseStart } : {}),
          ...(h.pauseEnd ? { pauseEnd: h.pauseEnd } : {})
        };
      });
      setSalon(prev => (prev ? { ...prev, horairesOuverture: newHoraires } : prev));

      setHoursSuccessMsg("✅ Horaires d'ouverture enregistrés avec succès dans la table beauty_business_hours !");
      window.dispatchEvent(
        new CustomEvent('app-toast', {
          detail: {
            message: "Horaires d'ouverture du salon mis à jour !",
            type: 'success'
          }
        })
      );
      setTimeout(() => setHoursSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('Erreur sauvegarde horaires:', err);
      setHoursErrorMsg(err?.message || "Erreur lors de l'enregistrement des horaires.");
    } finally {
      setIsSavingHours(false);
    }
  };

  const handleApplyPresetHours = (type: 'standard' | 'continuous' | 'seven_days' | 'weekend_late') => {
    setBusinessHours(prev =>
      prev.map(h => {
        if (type === 'standard') {
          const isSunday = h.dayOfWeek === 7 || h.dayName === 'dimanche';
          return {
            ...h,
            isOpen: !isSunday,
            openTime: '08:30',
            closeTime: '19:30',
            pauseStart: '13:00',
            pauseEnd: '14:00'
          };
        } else if (type === 'continuous') {
          const isSunday = h.dayOfWeek === 7 || h.dayName === 'dimanche';
          return {
            ...h,
            isOpen: !isSunday,
            openTime: '08:00',
            closeTime: '20:00',
            pauseStart: undefined,
            pauseEnd: undefined
          };
        } else if (type === 'seven_days') {
          return {
            ...h,
            isOpen: true,
            openTime: '08:30',
            closeTime: '20:00',
            pauseStart: undefined,
            pauseEnd: undefined
          };
        } else if (type === 'weekend_late') {
          const isWeekend = h.dayName === 'vendredi' || h.dayName === 'samedi';
          return {
            ...h,
            isOpen: h.dayName !== 'dimanche',
            openTime: '09:00',
            closeTime: isWeekend ? '22:00' : '19:30'
          };
        }
        return h;
      })
    );
  };

  const getLiveOpenStatus = () => {
    if (!businessHours || businessHours.length === 0) {
      return { isOpen: true, text: 'Horaires non définis', badgeColor: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' };
    }
    const now = new Date();
    const currentDay = now.getDay(); // 0 is Sunday
    const dayOfWeek = currentDay === 0 ? 7 : currentDay;
    const todayHour = businessHours.find(h => h.dayOfWeek === dayOfWeek);

    if (!todayHour || !todayHour.isOpen) {
      return { isOpen: false, text: "Fermé aujourd'hui", badgeColor: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' };
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [openH, openM] = todayHour.openTime.split(':').map(Number);
    const [closeH, closeM] = todayHour.closeTime.split(':').map(Number);
    const openMinutes = openH * 60 + (openM || 0);
    const closeMinutes = closeH * 60 + (closeM || 0);

    if (currentMinutes >= openMinutes && currentMinutes <= closeMinutes) {
      return {
        isOpen: true,
        text: `Ouvert actuellement jusqu'à ${todayHour.closeTime}`,
        badgeColor: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
      };
    } else if (currentMinutes < openMinutes) {
      return {
        isOpen: false,
        text: `Fermé actuellement • Ouvre aujourd'hui à ${todayHour.openTime}`,
        badgeColor: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
      };
    } else {
      return {
        isOpen: false,
        text: `Fermé pour la journée • Fermeture à ${todayHour.closeTime}`,
        badgeColor: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
      };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-rose-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-gray-500">Chargement de votre espace salon...</p>
        </div>
      </div>
    );
  }

  // If no salon registered yet for this user
  if (!salon) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-100 dark:border-gray-800 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-gradient-to-tr from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto text-white shadow-lg shadow-rose-500/30">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
              Bienvenue sur ZAKA Beauty
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
              Configurez le profil de votre salon de coiffure, barber shop ou institut pour recevoir des réservations en ligne dès aujourd'hui.
            </p>
          </div>

          <form onSubmit={handleCreateInitialSalon} className="space-y-4 text-xs font-bold">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-1">Nom de votre établissement *</label>
              <input
                type="text"
                required
                placeholder="Ex: Salon Glamour Prestige, Barber King..."
                value={newSalonForm.nom}
                onChange={e => setNewSalonForm({ ...newSalonForm, nom: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium outline-none focus:border-rose-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Type d'activité *</label>
                <select
                  value={newSalonForm.typeEtablissement}
                  onChange={e => setNewSalonForm({ ...newSalonForm, typeEtablissement: e.target.value as BeautySalonType })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold outline-none focus:border-rose-500"
                >
                  <option value="coiffure_femme">Salon de coiffure femme</option>
                  <option value="barber">Barber shop (Hommes)</option>
                  <option value="mixte">Salon mixte</option>
                  <option value="institut">Institut de beauté & soins</option>
                  <option value="onglerie">Bar à ongles / Onglerie</option>
                  <option value="spa">Spa & Bien-être</option>
                  <option value="maquillage">Studio maquillage / MUA</option>
                  <option value="domicile">Coiffeur / Soins à domicile</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Ville *</label>
                <select
                  value={newSalonForm.ville}
                  onChange={e => setNewSalonForm({ ...newSalonForm, ville: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-bold outline-none focus:border-rose-500"
                >
                  <option value="Ouagadougou">Ouagadougou</option>
                  <option value="Bobo-Dioulasso">Bobo-Dioulasso</option>
                  <option value="Koudougou">Koudougou</option>
                  <option value="Autre">Autre ville</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Téléphone d'appel *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: 70 00 00 00"
                  value={newSalonForm.telephone}
                  onChange={e => setNewSalonForm({ ...newSalonForm, telephone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Numéro WhatsApp</label>
                <input
                  type="tel"
                  placeholder="Ex: 78 00 00 00"
                  value={newSalonForm.whatsapp}
                  onChange={e => setNewSalonForm({ ...newSalonForm, whatsapp: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Quartier</label>
                <input
                  type="text"
                  placeholder="Ex: Ouaga 2000, 1200 Logements, Zone 1..."
                  value={newSalonForm.quartier}
                  onChange={e => setNewSalonForm({ ...newSalonForm, quartier: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Adresse ou repère précis</label>
                <input
                  type="text"
                  placeholder="Ex: Face à la station Shell"
                  value={newSalonForm.adresse}
                  onChange={e => setNewSalonForm({ ...newSalonForm, adresse: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={newSalonForm.accepteSansRdv}
                  onChange={e => setNewSalonForm({ ...newSalonForm, accepteSansRdv: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span>Accepte sans rendez-vous</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={newSalonForm.aDomicile}
                  onChange={e => setNewSalonForm({ ...newSalonForm, aDomicile: e.target.checked })}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span>Propose des prestations à domicile</span>
              </label>
            </div>

            <div className="pt-4 flex items-center justify-between">
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Déconnexion</span>
                </button>
              )}

              <button
                type="submit"
                disabled={isCreatingSalon}
                className="ml-auto px-6 py-3 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isCreatingSalon && (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Créer et activer mon salon</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Filter appointments for 'all_appointments' tab
  const filteredAllAppointments = appointments.filter(a => {
    if (statusFilter === 'tous') return true;
    return a.statut === statusFilter;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col lg:flex-row pb-24 lg:pb-8">
      {/* ========================================================================= */}
      {/* NAVIGATION LATÉRALE (SIDEBAR DÉDIÉE)                                       */}
      {/* ========================================================================= */}
      <aside className="w-full lg:w-72 bg-white dark:bg-gray-900 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-800 p-4 lg:p-5 shrink-0 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Salon Identification Card */}
          <div className="bg-rose-50/70 dark:bg-rose-950/40 p-3.5 rounded-2xl border border-rose-100 dark:border-rose-900/40 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-600 to-pink-600 flex items-center justify-center text-white font-black text-lg shrink-0 shadow-sm">
              {salon.photoProfil ? (
                <img src={salon.photoProfil} alt={salon.nom} className="w-full h-full object-cover rounded-xl" />
              ) : (
                salon.nom.charAt(0)
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h2 className="text-xs font-black text-gray-900 dark:text-white truncate">
                  {salon.nom}
                </h2>
                {salon.estVerifie && (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
              </div>
              <p className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 truncate">
                {BEAUTY_TYPE_LABELS[salon.typeEtablissement]?.label || salon.typeEtablissement}
              </p>
              <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-0.5">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span className="font-bold text-gray-700 dark:text-gray-300">{salon.noteMoyenne.toFixed(1)}</span>
                <span>({salon.totalAvis} avis)</span>
              </div>
            </div>
          </div>

          {/* Action: Aperçu Public Button */}
          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="w-full py-2.5 px-3.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-rose-500" />
            <span>Voir mon salon en public</span>
          </button>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {/* 1. Rendez-vous du jour */}
            <button
              onClick={() => setActiveNav('today')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeNav === 'today'
                  ? 'bg-rose-600 text-white shadow-sm font-black'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CalendarClock className="w-4 h-4" />
                <span>Rendez-vous du jour</span>
              </div>
              {todayAppointments.length > 0 && (
                <span className={`px-2 py-0.5 text-[10px] font-black rounded-full ${
                  activeNav === 'today' ? 'bg-white text-rose-600' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {todayAppointments.length}
                </span>
              )}
            </button>

            {/* 2. Statistiques & Graphiques (Recharts) */}
            <button
              id="beauty-nav-analytics-btn"
              onClick={() => setActiveNav('analytics')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeNav === 'analytics'
                  ? 'bg-rose-600 text-white shadow-sm font-black'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart2 className="w-4 h-4" />
                <span>Statistiques & Revenus</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                activeNav === 'analytics' ? 'bg-white/20 text-white' : 'text-emerald-700 bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                Recharts
              </span>
            </button>

            {/* 3. Demandes en attente */}
            <button
              onClick={() => setActiveNav('pending')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeNav === 'pending'
                  ? 'bg-rose-600 text-white shadow-sm font-black'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4" />
                <span>Demandes en attente</span>
              </div>
              {pendingAppointments.length > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-amber-500 text-white animate-pulse">
                  {pendingAppointments.length}
                </span>
              )}
            </button>

            {/* 4. Tous les rendez-vous */}
            <button
              onClick={() => setActiveNav('all_appointments')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeNav === 'all_appointments'
                  ? 'bg-rose-600 text-white shadow-sm font-black'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4" />
                <span>Tous les rendez-vous</span>
              </div>
              <span className="text-[10px] text-gray-400">
                {appointments.length}
              </span>
            </button>

            {/* 5. Catalogue des services */}
            <button
              onClick={() => setActiveNav('services')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeNav === 'services'
                  ? 'bg-rose-600 text-white shadow-sm font-black'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4" />
                <span>Catalogue des services</span>
              </div>
              <span className="text-[10px] text-gray-400">
                {services.length}
              </span>
            </button>

            {/* 6. Horaires d'ouverture (beauty_business_hours) */}
            <button
              id="beauty-nav-hours-btn"
              onClick={() => setActiveNav('hours')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeNav === 'hours'
                  ? 'bg-rose-600 text-white shadow-sm font-black'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4" />
                <span>Horaires d'ouverture</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${getLiveOpenStatus().isOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </div>
            </button>

            {/* 7. Galerie & Réalisations photos */}
            <button
              id="beauty-nav-gallery-btn"
              onClick={() => setActiveNav('gallery')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeNav === 'gallery'
                  ? 'bg-rose-600 text-white shadow-sm font-black'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4" />
                <span>Galerie & Réalisations</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                activeNav === 'gallery' ? 'bg-white/20 text-white' : 'text-gray-400 bg-gray-100 dark:bg-gray-800'
              }`}>
                {salon.photosGalerie?.length || 0}
              </span>
            </button>

            {/* 8. Clients du salon */}
            <button
              onClick={() => setActiveNav('clients')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeNav === 'clients'
                  ? 'bg-rose-600 text-white shadow-sm font-black'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>Fichier Clients</span>
              </div>
              <span className="text-[10px] text-gray-400">
                {clients.length}
              </span>
            </button>

            {/* 9. Avis et notations */}
            <button
              onClick={() => setActiveNav('reviews')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeNav === 'reviews'
                  ? 'bg-rose-600 text-white shadow-sm font-black'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4" />
                <span>Avis & Évaluations</span>
              </div>
              <span className="text-[10px] text-gray-400">
                {reviews.length}
              </span>
            </button>

            {/* 10. Paramètres Généraux */}
            <button
              onClick={() => setActiveNav('settings')}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeNav === 'settings'
                  ? 'bg-rose-600 text-white shadow-sm font-black'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Settings className="w-4 h-4" />
                <span>Paramètres Salon</span>
              </div>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
          <button
            onClick={loadSalonData}
            className="flex items-center gap-1.5 text-gray-500 hover:text-rose-600 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Actualiser</span>
          </button>

          {onLogout && (
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-red-500 hover:text-red-600 font-bold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Déconnexion</span>
            </button>
          )}
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA                                                         */}
      {/* ========================================================================= */}
      <main className="flex-1 p-4 lg:p-8 max-w-5xl space-y-6 overflow-y-auto">
        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setActiveNav('today')}
            className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
              activeNav === 'today'
                ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/20'
                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-[11px] font-bold">RDV Aujourd'hui</span>
              <CalendarClock className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-xl font-black text-gray-900 dark:text-white">
              {todayAppointments.length}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {todayAppointments.filter(a => a.statut === 'confirme').length} confirmés
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('pending')}
            className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
              activeNav === 'pending'
                ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20'
                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-[11px] font-bold">En attente</span>
              <Inbox className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400">
              {pendingAppointments.length}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              À confirmer rapidement
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveNav('clients')}
            className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
              activeNav === 'clients'
                ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800 ring-2 ring-blue-500/20'
                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-[11px] font-bold">Total Clients</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-xl font-black text-gray-900 dark:text-white">
              {clients.length}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              Fidélisés via ZAKA+
            </div>
          </button>

          <button
            type="button"
            id="top-metric-revenue-btn"
            onClick={() => setActiveNav('analytics')}
            className={`text-left p-4 rounded-2xl border transition-all cursor-pointer ${
              activeNav === 'analytics'
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 ring-2 ring-emerald-500/20'
                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700'
            }`}
          >
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-[11px] font-bold">CA Estimé Jour</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
              {formatFcfa(todayRevenue)}
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5 flex items-center gap-1">
              <span>Voir graphiques</span>
              <ChevronRight className="w-3 h-3" />
            </div>
          </button>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* VIEW: STATISTIQUES & GRAPHIQUES RECHARTS                                */}
        {/* ----------------------------------------------------------------------- */}
        {activeNav === 'analytics' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-gray-900 via-rose-950 to-gray-900 p-6 rounded-3xl text-white shadow-md">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/30 text-rose-300 text-[11px] font-black uppercase tracking-wider mb-2 border border-rose-500/30">
                  <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
                  <span>Analytique & Performances</span>
                </span>
                <h3 className="text-xl font-black text-white">
                  Tableau de bord financier & Rendez-vous
                </h3>
                <p className="text-xs text-gray-300 mt-1">
                  Suivez en temps réel l'évolution de vos rendez-vous quotidiens et vos revenus estimés de la semaine.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={loadSalonData}
                  className="px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Actualiser</span>
                </button>
              </div>
            </div>

            {/* 4 Analytics KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-xs font-bold">Revenu Hebdo Estimé</span>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-emerald-600">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatFcfa(analyticsData.weeklyEstimatedRevenue)}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Basé sur les RDV confirmés de la semaine
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-xs font-bold">RDV Cette Semaine</span>
                  <div className="p-2 bg-rose-50 dark:bg-rose-950/60 rounded-xl text-rose-600">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white">
                  {analyticsData.weeklyAppointmentsCount}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Dont {analyticsData.weeklyConfirmedCount} honorés ou confirmés
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-xs font-bold">Taux de Confirmation</span>
                  <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  {analyticsData.weeklyAcceptanceRate}%
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Efficacité du planning salon
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs">
                <div className="flex items-center justify-between text-gray-400 mb-2">
                  <span className="text-xs font-bold">Panier Moyen</span>
                  <div className="p-2 bg-purple-50 dark:bg-purple-950/60 rounded-xl text-purple-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white">
                  {analyticsData.weeklyConfirmedCount > 0
                    ? formatFcfa(Math.round(analyticsData.weeklyEstimatedRevenue / analyticsData.weeklyConfirmedCount))
                    : '0 FCFA'}
                </div>
                <div className="text-[11px] text-gray-500 mt-1">
                  Par client confirmé cette semaine
                </div>
              </div>
            </div>

            {/* GRAPHIQUE 1: Nombre de rendez-vous quotidiens (Recharts BarChart) */}
            <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-rose-500" />
                    <span>Graphique des Rendez-vous Quotidiens</span>
                  </h4>
                  <p className="text-xs text-gray-500">
                    Répartition des statuts (Confirmés, En attente, Terminés, Annulés) pour chaque jour de la semaine
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                  <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                    Semaine en cours
                  </span>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={analyticsData.daysArr}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis
                      dataKey="dayName"
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb', opacity: 0.5 }}
                      tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 600 }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb', opacity: 0.5 }}
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-gray-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-gray-800 text-xs space-y-1.5 min-w-[170px]">
                              <p className="font-black text-rose-400 border-b border-gray-800 pb-1">
                                {data.label}
                              </p>
                              <div className="space-y-1 pt-0.5">
                                <div className="flex justify-between items-center text-emerald-400">
                                  <span>Terminés :</span>
                                  <span className="font-black">{data.termines}</span>
                                </div>
                                <div className="flex justify-between items-center text-rose-400">
                                  <span>Confirmés :</span>
                                  <span className="font-black">{data.confirmes}</span>
                                </div>
                                <div className="flex justify-between items-center text-amber-400">
                                  <span>En attente :</span>
                                  <span className="font-black">{data.en_attente}</span>
                                </div>
                                <div className="flex justify-between items-center text-gray-400">
                                  <span>Annulés :</span>
                                  <span className="font-black">{data.annules}</span>
                                </div>
                                <div className="flex justify-between items-center pt-1 border-t border-gray-800 font-bold text-white">
                                  <span>Total RDV :</span>
                                  <span className="font-black">{data.total}</span>
                                </div>
                                <div className="flex justify-between items-center text-emerald-300 font-bold text-[11px] pt-0.5">
                                  <span>CA Jour :</span>
                                  <span>{formatFcfa(data.revenus)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: '15px', fontSize: '11px', fontWeight: 600 }}
                    />
                    <Bar dataKey="confirmes" name="Confirmés" fill="#e11d48" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="en_attente" name="En attente" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="termines" name="Terminés" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="annules" name="Annulés" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* GRAPHIQUE 2: Revenus hebdomadaires estimés (Recharts AreaChart) */}
            <div className="bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-4">
                <div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span>Courbe des Revenus Hebdomadaires Estimés (FCFA)</span>
                  </h4>
                  <p className="text-xs text-gray-500">
                    Projection financière calculée à partir des tarifs de vos prestations réservées
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-gray-500 block">Total estimé</span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {formatFcfa(analyticsData.weeklyEstimatedRevenue)}
                  </span>
                </div>
              </div>

              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={analyticsData.daysArr}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb', opacity: 0.5 }}
                      tick={{ fill: '#6b7280', fontSize: 11, fontWeight: 600 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={{ stroke: '#e5e7eb', opacity: 0.5 }}
                      tick={{ fill: '#6b7280', fontSize: 11 }}
                      tickFormatter={(value) => `${value >= 1000 ? `${Math.round(value / 1000)}k` : value}`}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const val = Number(payload[0].value || 0);
                          return (
                            <div className="bg-gray-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl border border-gray-800 text-xs space-y-1">
                              <p className="font-bold text-gray-400">{label}</p>
                              <p className="text-emerald-400 font-black text-sm">
                                {formatFcfa(val)}
                              </p>
                              <p className="text-[10px] text-gray-400">Revenus de prestations confirmées</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenus"
                      name="Revenus estimés (FCFA)"
                      stroke="#10b981"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#revenueGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Comparatif 4 Dernières Semaines */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs space-y-3">
              <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">
                Évolution comparative des 4 dernières semaines
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                {analyticsData.weeksComparison.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border ${
                      idx === 3
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                        : 'bg-gray-50 dark:bg-gray-800/40 border-gray-100 dark:border-gray-800'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-gray-500 block">{item.week}</span>
                    <span className="text-sm font-black text-gray-900 dark:text-white block mt-0.5">
                      {formatFcfa(item.revenus)}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {item.rdv} rendez-vous
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* VIEW: HORAIRES D'OUVERTURE (table: beauty_business_hours)                */}
        {/* ----------------------------------------------------------------------- */}
        {activeNav === 'hours' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-rose-500" />
                    <span>Horaires d'Ouverture par Jour</span>
                  </h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${getLiveOpenStatus().badgeColor}`}>
                    {getLiveOpenStatus().text}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  Définissez précisément les heures d'ouverture de votre salon pour chaque jour de la semaine (table <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-[11px]">beauty_business_hours</code>).
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveBusinessHours}
                disabled={isSavingHours}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-2xl text-xs font-black flex items-center gap-2 shadow-sm shadow-rose-600/20 cursor-pointer"
              >
                {isSavingHours ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Enregistrer les horaires</span>
              </button>
            </div>

            {/* Notification messages */}
            {hoursSuccessMsg && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-bold text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{hoursSuccessMsg}</span>
              </div>
            )}

            {hoursErrorMsg && (
              <div className="p-4 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-2xl text-xs font-bold text-red-800 dark:text-red-200 flex items-center gap-2 animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{hoursErrorMsg}</span>
              </div>
            )}

            {/* Quick Presets */}
            <div className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 block">
                Modèles d'horaires rapides (cliquez pour pré-remplir) :
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyPresetHours('standard')}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  📅 Standard (Lun-Sam 08h30-19h30, Dimanche fermé)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetHours('continuous')}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  ⚡ Journée Continue (08h00 - 20h00 sans pause)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetHours('seven_days')}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  🌟 7j/7 (Ouvert tous les jours 08h30-20h00)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPresetHours('weekend_late')}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  🌙 Nocturne Week-end (Ven-Sam jusqu'à 22h00)
                </button>
              </div>
            </div>

            {/* 7 Days Interactive Editor */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xs overflow-hidden">
              <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  Planning des 7 jours de la semaine
                </span>
                <span className="text-[11px] text-gray-500">
                  Les clients ne pourront réserver que sur les créneaux ouverts
                </span>
              </div>

              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {businessHours.map(hour => (
                  <div
                    key={hour.dayOfWeek}
                    className={`p-4 transition-colors ${
                      hour.isOpen ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/70 dark:bg-gray-950/40 opacity-75'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Day Name & Toggle */}
                      <div className="flex items-center gap-3 min-w-[160px]">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={hour.isOpen}
                            onChange={e => handleUpdateDayHour(hour.dayOfWeek, 'isOpen', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-rose-600"></div>
                        </label>
                        <div>
                          <span className="font-black text-sm text-gray-900 dark:text-white capitalize block">
                            {hour.dayLabel}
                          </span>
                          <span className={`text-[10px] font-bold ${hour.isOpen ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}`}>
                            {hour.isOpen ? 'Ouvert' : 'Fermé toute la journée'}
                          </span>
                        </div>
                      </div>

                      {/* Hours pickers if open */}
                      {hour.isOpen ? (
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          {/* Opening and Closing Times */}
                          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/80 p-1.5 px-3 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <span className="text-gray-500 font-bold text-[11px]">De</span>
                            <input
                              type="time"
                              required
                              value={hour.openTime}
                              onChange={e => handleUpdateDayHour(hour.dayOfWeek, 'openTime', e.target.value)}
                              className="px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-bold outline-none focus:border-rose-500"
                            />
                            <span className="text-gray-500 font-bold text-[11px]">à</span>
                            <input
                              type="time"
                              required
                              value={hour.closeTime}
                              onChange={e => handleUpdateDayHour(hour.dayOfWeek, 'closeTime', e.target.value)}
                              className="px-2 py-1 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-bold outline-none focus:border-rose-500"
                            />
                          </div>

                          {/* Pause option */}
                          <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800/80 p-1.5 px-3 rounded-2xl border border-gray-200 dark:border-gray-700">
                            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-gray-600 dark:text-gray-400">
                              <input
                                type="checkbox"
                                checked={!!hour.pauseStart}
                                onChange={e => {
                                  if (e.target.checked) {
                                    handleUpdateDayHour(hour.dayOfWeek, 'pauseStart', '13:00');
                                    handleUpdateDayHour(hour.dayOfWeek, 'pauseEnd', '14:00');
                                  } else {
                                    handleUpdateDayHour(hour.dayOfWeek, 'pauseStart', undefined);
                                    handleUpdateDayHour(hour.dayOfWeek, 'pauseEnd', undefined);
                                  }
                                }}
                                className="rounded text-rose-600"
                              />
                              <span>Pause déjeuner</span>
                            </label>

                            {hour.pauseStart && (
                              <div className="flex items-center gap-1 pl-1 border-l border-gray-200 dark:border-gray-700">
                                <input
                                  type="time"
                                  value={hour.pauseStart || '13:00'}
                                  onChange={e => handleUpdateDayHour(hour.dayOfWeek, 'pauseStart', e.target.value)}
                                  className="px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-[11px] font-bold"
                                />
                                <span>-</span>
                                <input
                                  type="time"
                                  value={hour.pauseEnd || '14:00'}
                                  onChange={e => handleUpdateDayHour(hour.dayOfWeek, 'pauseEnd', e.target.value)}
                                  className="px-1.5 py-0.5 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-md text-[11px] font-bold"
                                />
                              </div>
                            )}
                          </div>

                          {/* Notes field */}
                          <input
                            type="text"
                            placeholder="Note (ex: Nocturne, Sur RDV)..."
                            value={hour.notes || ''}
                            onChange={e => handleUpdateDayHour(hour.dayOfWeek, 'notes', e.target.value)}
                            className="px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[11px] outline-none focus:border-rose-500 w-36"
                          />
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 font-medium italic">
                          Le salon est fermé ce jour-là.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom save bar */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveBusinessHours}
                  disabled={isSavingHours}
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  {isSavingHours && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  <span>Enregistrer tous les horaires</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* VIEW 1: RENDEZ-VOUS DU JOUR                                            */}
        {/* ----------------------------------------------------------------------- */}
        {activeNav === 'today' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <CalendarClock className="w-5 h-5 text-rose-500" />
                  <span>Planning du jour ({todayDate})</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Visualisez et traitez les clients attendus aujourd'hui dans votre salon.
                </p>
              </div>

              {/* Bouton Exporter en CSV */}
              <button
                id="export-today-appointments-csv-btn"
                type="button"
                onClick={handleExportTodayAppointmentsCsv}
                disabled={todayAppointments.length === 0}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  todayAppointments.length > 0
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                }`}
                title={todayAppointments.length > 0 ? "Télécharger la liste des rendez-vous du jour en fichier CSV" : "Aucun rendez-vous à exporter"}
              >
                <Download className="w-4 h-4" />
                <span>Exporter en CSV</span>
                {todayAppointments.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-white/20 rounded-md text-[10px] font-black">
                    {todayAppointments.length}
                  </span>
                )}
              </button>
            </div>

            {todayAppointments.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl text-center border border-gray-100 dark:border-gray-800">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-sm font-black text-gray-800 dark:text-white">
                  Aucun rendez-vous planifié aujourd'hui
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Vos créneaux libres sont visibles par vos clients sur ZAKA Beauty.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map(appointment => (
                  <div
                    key={appointment.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      appointment.statut === 'en_attente'
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                        : appointment.statut === 'confirme'
                        ? 'bg-white dark:bg-gray-900 border-rose-200 dark:border-rose-900/50'
                        : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-80'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="px-3 py-2 bg-rose-100 dark:bg-rose-950/60 rounded-xl text-center shrink-0">
                          <span className="block text-sm font-black text-rose-600 dark:text-rose-400">
                            {appointment.heureRdv}
                          </span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">
                            Aujourd'hui
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-black text-gray-900 dark:text-white">
                              {appointment.nomClient}
                            </h4>
                            {appointment.aDomicile && (
                              <span className="px-2 py-0.5 bg-purple-50 dark:bg-purple-950 text-purple-600 text-[10px] font-bold rounded-md">
                                À domicile
                              </span>
                            )}
                          </div>

                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                            Prestation : <strong>{appointment.serviceNom || 'Prestation beauté'}</strong> — {formatFcfa(appointment.prixTotalFcfa || 0)}
                          </p>

                          {appointment.notesClient && (
                            <p className="text-[11px] text-gray-500 italic">
                              Note : « {appointment.notesClient} »
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Contact & Status Controls */}
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                        <a
                          href={`tel:${appointment.telephoneClient}`}
                          className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-bold flex items-center gap-1"
                          title="Appeler le client"
                        >
                          <Phone className="w-3.5 h-3.5 text-rose-500" />
                          <span className="hidden sm:inline">{appointment.telephoneClient}</span>
                        </a>

                        {/* WhatsApp Actions */}
                        {appointment.statut === 'en_attente' && (
                          <button
                            onClick={() => handleConfirmViaWhatsApp(appointment)}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                            title="Confirmer le RDV et ouvrir WhatsApp avec le message de confirmation"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <Check className="w-3 h-3 text-emerald-200" />
                            <span className="hidden sm:inline">Confirmer WhatsApp</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenRescheduleProposal(appointment)}
                          className="p-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                          title="Proposer un autre horaire au client via WhatsApp"
                        >
                          <CalendarClock className="w-3.5 h-3.5 text-amber-500" />
                          <span className="hidden sm:inline">Autre horaire</span>
                        </button>

                        <a
                          href={getWhatsAppClientLink(appointment)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1"
                          title="Message WhatsApp rapide"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-500" />
                        </a>

                        {/* Status Change Buttons */}
                        {appointment.statut === 'en_attente' && (
                          <button
                            onClick={() => handleUpdateStatus(appointment.id, 'confirme')}
                            disabled={updatingAppId === appointment.id}
                            className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Confirmer</span>
                          </button>
                        )}

                        {appointment.statut === 'confirme' && (
                          <button
                            onClick={() => handleUpdateStatus(appointment.id, 'termine')}
                            disabled={updatingAppId === appointment.id}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Terminer</span>
                          </button>
                        )}

                        {appointment.statut !== 'annule' && appointment.statut !== 'termine' && (
                          <button
                            onClick={() => handleUpdateStatus(appointment.id, 'annule')}
                            disabled={updatingAppId === appointment.id}
                            className="p-2 text-gray-400 hover:text-red-600 rounded-xl cursor-pointer"
                            title="Annuler le rendez-vous"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* VIEW 2: DEMANDES EN ATTENTE                                            */}
        {/* ----------------------------------------------------------------------- */}
        {activeNav === 'pending' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Inbox className="w-5 h-5 text-amber-500" />
                  <span>Demandes de rendez-vous en attente ({pendingAppointments.length})</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Confirmez ces réservations ou contactez vos clients pour ajuster le créneau.
                </p>
              </div>
            </div>

            {pendingAppointments.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl text-center border border-gray-100 dark:border-gray-800">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                <h4 className="text-sm font-black text-gray-800 dark:text-white">
                  Toutes les demandes ont été traitées !
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Aucune demande de réservation en attente pour le moment.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingAppointments.map(appointment => (
                  <div
                    key={appointment.id}
                    className="bg-white dark:bg-gray-900 p-4 sm:p-5 rounded-2xl border-2 border-amber-200 dark:border-amber-900/60 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-gray-900 dark:text-white">
                            {appointment.nomClient}
                          </h4>
                          <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-black rounded-md uppercase">
                            En attente de confirmation
                          </span>
                        </div>

                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                          Date demandée : <span className="text-rose-600">{appointment.dateRdv} à {appointment.heureRdv}</span>
                        </p>

                        <p className="text-xs text-gray-500">
                          Service : <strong>{appointment.serviceNom || 'Prestation'}</strong> ({formatFcfa(appointment.prixTotalFcfa || 0)})
                        </p>

                        {appointment.aDomicile && (
                          <p className="text-xs font-semibold text-purple-600">
                            Adresse domicile : {appointment.adresseDomicile || 'Non spécifiée'}
                          </p>
                        )}

                        {appointment.notesClient && (
                          <p className="text-xs text-gray-500 italic bg-gray-50 dark:bg-gray-800/50 p-2 rounded-lg">
                            « {appointment.notesClient} »
                          </p>
                        )}
                      </div>

                      {/* Immediate Confirmation & WhatsApp Buttons */}
                      <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                        <button
                          onClick={() => handleConfirmViaWhatsApp(appointment)}
                          className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                          title="Confirmer immédiatement le RDV et notifier le client avec les détails complets par WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <Check className="w-3.5 h-3.5 text-emerald-200" />
                          <span>Confirmer WhatsApp</span>
                        </button>

                        <button
                          onClick={() => handleOpenRescheduleProposal(appointment)}
                          className="px-3 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                          title="Proposer une autre date ou un autre horaire par message WhatsApp pré-rempli"
                        >
                          <CalendarClock className="w-4 h-4" />
                          <span>Proposer un autre horaire</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(appointment.id, 'confirme')}
                          disabled={updatingAppId === appointment.id}
                          className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Confirmer direct</span>
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(appointment.id, 'annule')}
                          disabled={updatingAppId === appointment.id}
                          className="px-3 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-xl text-xs font-bold cursor-pointer"
                        >
                          Refuser
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* VIEW 3: TOUS LES RENDEZ-VOUS                                            */}
        {/* ----------------------------------------------------------------------- */}
        {activeNav === 'all_appointments' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  Historique des rendez-vous ({appointments.length})
                </h3>
                <p className="text-xs text-gray-500">
                  Filtrez par statut pour consulter vos rendez-vous passés et à venir.
                </p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1 bg-white dark:bg-gray-900 p-1 rounded-xl border border-gray-100 dark:border-gray-800 text-xs">
                {(['tous', 'en_attente', 'confirme', 'termine', 'annule'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1.5 rounded-lg font-bold capitalize transition-all cursor-pointer ${
                      statusFilter === st
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-gray-500 hover:text-gray-900'
                    }`}
                  >
                    {st === 'tous' ? 'Tous' : st.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredAllAppointments.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl text-center border border-gray-100 dark:border-gray-800">
                  <p className="text-xs font-bold text-gray-500">Aucun rendez-vous trouvé.</p>
                </div>
              ) : (
                filteredAllAppointments.map(appointment => (
                  <div
                    key={appointment.id}
                    className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-gray-900 dark:text-white">
                          {appointment.nomClient}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                          appointment.statut === 'confirme'
                            ? 'bg-rose-50 text-rose-600'
                            : appointment.statut === 'termine'
                            ? 'bg-emerald-50 text-emerald-600'
                            : appointment.statut === 'annule'
                            ? 'bg-red-50 text-red-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}>
                          {appointment.statut.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {appointment.dateRdv} à {appointment.heureRdv} — {appointment.serviceNom || 'Prestation'} ({formatFcfa(appointment.prixTotalFcfa || 0)})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${appointment.telephoneClient}`}
                        className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-bold text-gray-700"
                        title="Appeler"
                      >
                        <Phone className="w-3.5 h-3.5 text-rose-500" />
                      </a>
                      <button
                        onClick={() => handleOpenRescheduleProposal(appointment)}
                        className="p-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 rounded-xl text-xs font-bold cursor-pointer"
                        title="Proposer un autre horaire par WhatsApp"
                      >
                        <CalendarClock className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={getWhatsAppClientLink(appointment)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl text-xs font-bold text-emerald-600"
                        title="WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* VIEW 4: CATALOGUE DES SERVICES (PRESTATIONS)                           */}
        {/* ----------------------------------------------------------------------- */}
        {activeNav === 'services' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-500" />
                  <span>Catalogue des prestations ({services.length})</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Définissez vos prix en FCFA, durées et prestations proposées à vos clients.
                </p>
              </div>

              <button
                onClick={handleOpenCreateService}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter une prestation</span>
              </button>
            </div>

            {services.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 p-10 rounded-3xl text-center border border-gray-100 dark:border-gray-800">
                <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="text-sm font-black text-gray-800 dark:text-white">
                  Aucun service dans votre carte
                </h4>
                <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                  Ajoutez vos premières prestations (coiffure, tresses, barbe, soins, manucure...) pour permettre aux clients de réserver en ligne.
                </p>
                <button
                  onClick={handleOpenCreateService}
                  className="mt-4 px-4 py-2 bg-rose-600 text-white text-xs font-black rounded-xl cursor-pointer"
                >
                  Ajouter un service
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {services.map(service => (
                  <div
                    key={service.id}
                    className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-black text-gray-900 dark:text-white">
                              {service.nom}
                            </h4>
                            {service.estPopulaire && (
                              <span className="px-1.5 py-0.5 bg-rose-50 dark:bg-rose-950/60 text-rose-600 text-[10px] font-black rounded-md uppercase">
                                Populaire
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-semibold text-gray-400">
                            {BEAUTY_CATEGORY_LABELS[service.categorie]?.label || service.categorie}
                          </span>
                        </div>

                        <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                          {formatFcfa(service.prixFcfa)}
                        </span>
                      </div>

                      {service.description && (
                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                          {service.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-800/80 text-xs">
                      <span className="flex items-center gap-1 font-bold text-gray-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{service.dureeMinutes} min</span>
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditService(service)}
                          className="p-1.5 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                          title="Modifier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteService(service.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* VIEW 5: GALERIE & RÉALISATIONS (GESTION DES PHOTOS DU SALON)            */}
        {/* ----------------------------------------------------------------------- */}
        {activeNav === 'gallery' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-rose-500" />
                  <span>Galerie de vos réalisations ({salon.photosGalerie?.length || 0})</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Ajoutez les plus belles photos de vos coiffures, tresses, manucures ou soins. Vos clients les verront dans l'onglet Galerie de votre fiche publique.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPreviewOpen(true)}
                  className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-700 dark:text-gray-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Voir le rendu public"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Aperçu client</span>
                </button>

                <button
                  id="beauty-add-photos-btn"
                  onClick={() => galleryFileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isUploadingPhoto ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Téléchargement...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Ajouter des photos</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Hidden native file input */}
            <input
              type="file"
              ref={galleryFileInputRef}
              multiple
              accept="image/png,image/jpeg,image/webp,image/jpg"
              onChange={handleUploadGalleryPhoto}
              className="hidden"
            />

            {/* Success or Error messages */}
            {gallerySuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{gallerySuccessMsg}</span>
              </div>
            )}

            {galleryUploadError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-2xl flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{galleryUploadError}</span>
              </div>
            )}

            {/* Drag & Drop / Click Upload Box */}
            <div
              onClick={() => !isUploadingPhoto && galleryFileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
                isUploadingPhoto
                  ? 'border-rose-300 bg-rose-50/50 dark:bg-rose-950/20 opacity-75'
                  : 'border-gray-200 dark:border-gray-800 hover:border-rose-400 dark:hover:border-rose-600 bg-white dark:bg-gray-900 hover:shadow-sm'
              }`}
            >
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                  {isUploadingPhoto ? (
                    <div className="w-6 h-6 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <UploadCloud className="w-7 h-7" />
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    {isUploadingPhoto
                      ? 'Téléversement en cours sur Supabase Storage...'
                      : 'Cliquez pour sélectionner vos photos ou déposez-les ici'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Formats acceptés : PNG, JPG, JPEG, WEBP. Jusqu'à 8 Mo par image.
                  </p>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-[11px] font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span>Sélection multiple supportée</span>
                </div>
              </div>
            </div>

            {/* Photos Grid */}
            {(!salon.photosGalerie || salon.photosGalerie.length === 0) ? (
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl text-center border border-gray-100 dark:border-gray-800 space-y-2">
                <ImageIcon className="w-10 h-10 text-gray-300 mx-auto" />
                <h4 className="text-sm font-black text-gray-700 dark:text-gray-300">
                  Votre galerie est actuellement vide
                </h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Présentez votre talent ! Les salons ayant une galerie de réalisations active attirent significativement plus de nouveaux clients dans leur ville.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{salon.photosGalerie.length} réalisation(s) affichée(s)</span>
                  <span className="text-[11px] text-gray-400">Survolez une photo pour la supprimer ou l'agrandir</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {salon.photosGalerie.map((photoUrl, idx) => (
                    <div
                      key={`${photoUrl}-${idx}`}
                      className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-800 shadow-sm"
                    >
                      <img
                        src={photoUrl}
                        alt={`Réalisation ${idx + 1} - ${salon.nom}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                      />

                      {/* Badge photo # */}
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black rounded-md">
                        #{idx + 1}
                      </span>

                      {/* Overlay Actions on Hover */}
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        <a
                          href={photoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 bg-white/90 hover:bg-white text-gray-900 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
                          title="Voir en taille réelle"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>

                        <button
                          onClick={() => handleDeleteGalleryPhoto(photoUrl, idx)}
                          disabled={deletingPhotoIndex === idx}
                          className="p-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer disabled:opacity-50"
                          title="Supprimer cette photo"
                        >
                          {deletingPhotoIndex === idx ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Growth tip banner */}
            <div className="p-4 bg-gradient-to-r from-rose-50 to-amber-50 dark:from-rose-950/20 dark:to-amber-950/20 border border-rose-100 dark:border-rose-900/40 rounded-2xl flex items-start gap-3 text-xs">
              <Sparkles className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-gray-900 dark:text-white block">
                  Astuce visibilité ZAKA+ Beauty
                </span>
                <p className="text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                  Prenez des photos sous une bonne lumière naturelle montrant le résultat final (avant/après, détails des mèches, coiffure sous plusieurs angles). Les clients aiment voir la netteté des finitions !
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* VIEW 6: FICHIER CLIENTS                                                */}
        {/* ----------------------------------------------------------------------- */}
        {activeNav === 'clients' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                <span>Répertoire des clients ({clients.length})</span>
              </h3>
              <p className="text-xs text-gray-500">
                Coordonnées et historique des clients ayant pris rendez-vous dans votre salon.
              </p>
            </div>

            {clients.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl text-center border border-gray-100 dark:border-gray-800">
                <p className="text-xs font-bold text-gray-500">
                  Aucun client enregistré pour l'instant. Vos clients apparaîtront ici dès leur première réservation.
                </p>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                  {clients.map(cli => (
                    <div key={cli.telephoneClient} className="p-4 flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-900 dark:text-white">
                            {cli.nomClient}
                          </span>
                          <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950 text-blue-600 text-[10px] font-bold rounded-md">
                            {cli.totalRendezVous} rendez-vous
                          </span>
                        </div>
                        <p className="text-gray-400 text-[11px]">
                          Dernière visite le {cli.dernierRdvDate} — Total dépensé : {formatFcfa(cli.totalDepenseFcfa)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${cli.telephoneClient}`}
                          className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-700 rounded-xl"
                          title="Appeler"
                        >
                          <Phone className="w-3.5 h-3.5 text-rose-500" />
                        </a>
                        <a
                          href={`https://wa.me/${cli.telephoneClient.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl"
                          title="WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* VIEW 6: AVIS & NOTATIONS                                               */}
        {/* ----------------------------------------------------------------------- */}
        {activeNav === 'reviews' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-500" />
                <span>Avis & Évaluations clients ({reviews.length})</span>
              </h3>
              <p className="text-xs text-gray-500">
                Note globale : {salon.noteMoyenne.toFixed(1)} / 5. Répondez à vos clients pour valoriser votre e-réputation.
              </p>
            </div>

            {reviews.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl text-center border border-gray-100 dark:border-gray-800">
                <p className="text-xs font-bold text-gray-500">
                  Aucun avis reçu pour le moment.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map(review => (
                  <div
                    key={review.id}
                    className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                          {review.nomClient.charAt(0)}
                        </div>
                        <span className="font-black text-gray-900 dark:text-white">
                          {review.nomClient}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.note ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {review.commentaire && (
                      <p className="text-gray-600 dark:text-gray-300 pl-9">
                        {review.commentaire}
                      </p>
                    )}

                    {review.reponseSalon ? (
                      <div className="ml-9 p-3 bg-rose-50/50 dark:bg-rose-950/30 rounded-xl border-l-2 border-rose-500">
                        <span className="font-bold text-rose-600 block mb-0.5">Votre réponse :</span>
                        <p className="text-gray-600 dark:text-gray-300">{review.reponseSalon}</p>
                      </div>
                    ) : (
                      <div className="ml-9 pt-1">
                        {replyingReviewId === review.id ? (
                          <div className="space-y-2">
                            <textarea
                              rows={2}
                              value={replyText}
                              onChange={e => setReplyText(e.target.value)}
                              placeholder="Écrivez votre réponse publique..."
                              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none"
                            />
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setReplyingReviewId(null)}
                                className="px-3 py-1.5 bg-gray-100 rounded-lg text-gray-600 font-bold"
                              >
                                Annuler
                              </button>
                              <button
                                onClick={() => handleReplyReview(review.id)}
                                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg font-bold"
                              >
                                Envoyer la réponse
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setReplyingReviewId(review.id);
                              setReplyText('');
                            }}
                            className="text-rose-600 font-bold hover:underline"
                          >
                            Répondre à cet avis
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* VIEW 7: PARAMÈTRES & HORAIRES                                          */}
        {/* ----------------------------------------------------------------------- */}
        {activeNav === 'settings' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-500" />
                <span>Paramètres & Horaires d'ouverture</span>
              </h3>
              <p className="text-xs text-gray-500">
                Mettez à jour les informations visibles par les clients sur ZAKA Beauty.
              </p>
            </div>

            {profileSuccessMsg && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 space-y-4 text-xs font-bold">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Nom de l'établissement *</label>
                <input
                  type="text"
                  required
                  value={salon.nom}
                  onChange={e => setSalon({ ...salon, nom: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1">Téléphone d'appel *</label>
                  <input
                    type="tel"
                    required
                    value={salon.telephone}
                    onChange={e => setSalon({ ...salon, telephone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1">Numéro WhatsApp</label>
                  <input
                    type="tel"
                    value={salon.whatsapp || ''}
                    onChange={e => setSalon({ ...salon, whatsapp: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1">Ville</label>
                  <input
                    type="text"
                    value={salon.ville}
                    onChange={e => setSalon({ ...salon, ville: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1">Quartier</label>
                  <input
                    type="text"
                    value={salon.quartier || ''}
                    onChange={e => setSalon({ ...salon, quartier: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={salon.description || ''}
                  onChange={e => setSalon({ ...salon, description: e.target.value })}
                  placeholder="Présentez votre savoir-faire, les spécialités de votre salon..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-rose-500"
                />
              </div>

              {/* Options checkboxes */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={salon.accepteSansRdv}
                    onChange={e => setSalon({ ...salon, accepteSansRdv: e.target.checked })}
                    className="rounded text-rose-600"
                  />
                  <span>Accepte les clients sans rendez-vous</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={salon.aDomicile}
                    onChange={e => setSalon({ ...salon, aDomicile: e.target.checked })}
                    className="rounded text-rose-600"
                  />
                  <span>Déplacement à domicile possible</span>
                </label>
              </div>

              {/* Horaires d'ouverture configurables */}
              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black uppercase text-gray-500 tracking-wider">
                      Horaires d'ouverture hebdomadaires
                    </h4>
                    <p className="text-[11px] text-gray-500">
                      Gérez les créneaux quotidiens, pauses et statuts ouverts/fermés.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveNav('hours')}
                    className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Ouvrir l'éditeur avancé (table beauty_business_hours)</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  {Object.entries(salon.horairesOuverture || {}).map(([day, sched]) => (
                    <div key={day} className="p-3 bg-gray-50/50 dark:bg-gray-900/50 flex items-center justify-between gap-3">
                      <span className="font-bold capitalize w-24 text-gray-700 dark:text-gray-300">{day}</span>
                      
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sched.ouvert}
                          onChange={e => {
                            const newSched = { ...salon.horairesOuverture, [day]: { ...sched, ouvert: e.target.checked } };
                            setSalon({ ...salon, horairesOuverture: newSched });
                          }}
                          className="rounded text-rose-600"
                        />
                        <span>{sched.ouvert ? 'Ouvert' : 'Fermé'}</span>
                      </label>

                      {sched.ouvert && (
                        <div className="flex items-center gap-1">
                          <input
                            type="time"
                            value={sched.ouverture}
                            onChange={e => {
                              const newSched = { ...salon.horairesOuverture, [day]: { ...sched, ouverture: e.target.value } };
                              setSalon({ ...salon, horairesOuverture: newSched });
                            }}
                            className="px-2 py-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-xs"
                          />
                          <span>-</span>
                          <input
                            type="time"
                            value={sched.fermeture}
                            onChange={e => {
                              const newSched = { ...salon.horairesOuverture, [day]: { ...sched, fermeture: e.target.value } };
                              setSalon({ ...salon, horairesOuverture: newSched });
                            }}
                            className="px-2 py-1 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg text-xs"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black cursor-pointer flex items-center gap-2"
                >
                  {isSavingProfile && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  <span>Enregistrer les modifications</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL CRÉATION / ÉDITION DE SERVICE                                       */}
      {/* ========================================================================= */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-3xl p-6 border border-gray-100 dark:border-gray-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900 dark:text-white">
                {editingService ? 'Modifier la prestation' : 'Nouvelle prestation'}
              </h3>
              <button onClick={() => setIsServiceModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Nom de la prestation *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tresses sénégalaises, Dégradé américain, Pose vernis gel..."
                  value={serviceForm.nom}
                  onChange={e => setServiceForm({ ...serviceForm, nom: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1">Catégorie *</label>
                  <select
                    value={serviceForm.categorie}
                    onChange={e => setServiceForm({ ...serviceForm, categorie: e.target.value as BeautyServiceCategory })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-rose-500"
                  >
                    <option value="coiffure">Coiffure</option>
                    <option value="barbe">Barbe</option>
                    <option value="tresses">Tresses</option>
                    <option value="soins">Soins du visage</option>
                    <option value="ongles">Ongles / Manucure</option>
                    <option value="maquillage">Maquillage</option>
                    <option value="massage">Massage / Spa</option>
                    <option value="epilation">Épilation</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 mb-1">Prix (FCFA) *</label>
                  <input
                    type="number"
                    required
                    min={500}
                    step={500}
                    value={serviceForm.prixFcfa}
                    onChange={e => setServiceForm({ ...serviceForm, prixFcfa: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Durée estimée (minutes) *</label>
                <input
                  type="number"
                  required
                  min={10}
                  step={5}
                  value={serviceForm.dureeMinutes}
                  onChange={e => setServiceForm({ ...serviceForm, dureeMinutes: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-1">Description (optionnelle)</label>
                <textarea
                  rows={2}
                  placeholder="Détails des produits utilisés, conseils..."
                  value={serviceForm.description}
                  onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serviceForm.estPopulaire}
                    onChange={e => setServiceForm({ ...serviceForm, estPopulaire: e.target.checked })}
                    className="rounded text-rose-600"
                  />
                  <span>Mettre en avant (Populaire)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={serviceForm.estActif}
                    onChange={e => setServiceForm({ ...serviceForm, estActif: e.target.checked })}
                    className="rounded text-rose-600"
                  />
                  <span>Actif au catalogue</span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 rounded-xl text-gray-700 dark:text-gray-300"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black"
                >
                  {editingService ? 'Mettre à jour' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PROPOSITION DE NOUVEL HORAIRE VIA WHATSAPP                         */}
      {/* ========================================================================= */}
      {proposingAppointment && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-lg w-full border border-gray-100 dark:border-gray-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-amber-500 to-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5" />
                <h3 className="font-black text-sm">Proposer un nouvel horaire</h3>
              </div>
              <button
                onClick={() => setProposingAppointment(null)}
                className="p-1 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendRescheduleProposal} className="p-5 space-y-4 text-xs">
              {/* Client & Current RDV Info */}
              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-black text-gray-900 dark:text-white text-sm">
                    {proposingAppointment.nomClient}
                  </span>
                  <span className="text-[11px] font-bold text-gray-500">
                    {proposingAppointment.telephoneClient}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  Prestation : <strong>{proposingAppointment.serviceNom || 'Prestation'}</strong> ({formatFcfa(proposingAppointment.prixTotalFcfa || 0)})
                </p>
                <p className="text-amber-700 dark:text-amber-400 font-bold">
                  Créneau demandé initialement : le {proposingAppointment.dateRdv} à {proposingAppointment.heureRdv}
                </p>
              </div>

              {/* Date & Time fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                    Nouvelle date proposée *
                  </label>
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={proposalDate}
                    onChange={e => setProposalDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-rose-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                    Nouvel horaire proposé *
                  </label>
                  <input
                    type="time"
                    required
                    value={proposalTime}
                    onChange={e => setProposalTime(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-rose-500 font-semibold"
                  />
                </div>
              </div>

              {/* Motif optionnel */}
              <div>
                <label className="block text-gray-700 dark:text-gray-300 font-bold mb-1">
                  Motif ou précision (optionnel)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Créneau déjà réservé, salon exceptionnellement fermé le matin..."
                  value={proposalReason}
                  onChange={e => setProposalReason(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl outline-none focus:border-rose-500"
                />
              </div>

              {/* Live Preview of message */}
              <div className="space-y-1">
                <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Aperçu du message WhatsApp envoyé
                </span>
                <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-gray-800 dark:text-gray-200 text-[11px] leading-relaxed whitespace-pre-line font-medium">
                  {getWhatsAppProposalMessage(proposingAppointment, proposalDate || 'JJ/MM/AAAA', proposalTime || 'HH:MM', proposalReason)}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setProposingAppointment(null)}
                  className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 rounded-xl text-gray-700 dark:text-gray-300 font-bold cursor-pointer"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Envoyer la proposition sur WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL APERÇU PUBLIC                                                       */}
      {/* ========================================================================= */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="min-h-screen">
            <div className="sticky top-0 z-40 bg-gray-900/90 backdrop-blur-md border-b border-gray-800 p-3 px-4 flex items-center justify-between text-white">
              <span className="text-xs font-black flex items-center gap-2">
                <Eye className="w-4 h-4 text-rose-400" />
                <span>Aperçu public de votre salon</span>
              </span>
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Fermer l'aperçu
              </button>
            </div>
            <BeautySalonPublicView salon={salon} onBack={() => setIsPreviewOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
