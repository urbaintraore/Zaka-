import { useState, useMemo, useEffect } from 'react';
import {
  BeautySalon,
  BeautyService,
  BeautyAppointment
} from '../types';
import {
  createBeautyAppointment,
  generateWhatsAppBeautyBookingUrl
} from '../lib/beautyService';
import { useAppStore } from '../store';

export interface UseBeautyBookingOptions {
  salon: BeautySalon | null;
  services?: BeautyService[];
  preselectedServiceId?: string;
  onSuccess?: (appointment: BeautyAppointment) => void;
}

export function useBeautyBooking({
  salon,
  services = [],
  preselectedServiceId,
  onSuccess
}: UseBeautyBookingOptions) {
  const { currentUser } = useAppStore();

  // Selected state
  const [selectedServiceId, setSelectedServiceId] = useState<string>(preselectedServiceId || '');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  
  // Client details
  const [clientName, setClientName] = useState<string>(currentUser?.name || '');
  const [clientPhone, setClientPhone] = useState<string>(currentUser?.phone || '');
  const [clientNotes, setClientNotes] = useState<string>('');
  const [aDomicile, setADomicile] = useState<boolean>(false);
  const [adresseDomicile, setAdresseDomicile] = useState<string>('');

  // Status state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [createdAppointment, setCreatedAppointment] = useState<BeautyAppointment | null>(null);

  // Sync preselectedServiceId when it changes
  useEffect(() => {
    if (preselectedServiceId) {
      setSelectedServiceId(preselectedServiceId);
    } else if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [preselectedServiceId, services]);

  // Sync user info if user logs in or profile changes
  useEffect(() => {
    if (currentUser?.name && !clientName) {
      setClientName(currentUser.name);
    }
    if (currentUser?.phone && !clientPhone) {
      setClientPhone(currentUser.phone);
    }
  }, [currentUser]);

  // Selected service object
  const selectedService = useMemo<BeautyService | null>(() => {
    return services.find(s => s.id === selectedServiceId) || null;
  }, [services, selectedServiceId]);

  // Day of week in french
  const dayKey = useMemo<'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi' | 'dimanche'>(() => {
    if (!selectedDate) return 'lundi';
    const d = new Date(selectedDate + 'T00:00:00');
    const dayNum = d.getDay(); // 0 = Sunday, 1 = Monday, ...
    const days: ('dimanche' | 'lundi' | 'mardi' | 'mercredi' | 'jeudi' | 'vendredi' | 'samedi')[] = [
      'dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'
    ];
    return days[dayNum];
  }, [selectedDate]);

  // Opening hours for that day
  const daySchedule = useMemo(() => {
    if (!salon?.horairesOuverture) return { ouvert: true, ouverture: '08:30', fermeture: '19:30' };
    return salon.horairesOuverture[dayKey] || { ouvert: true, ouverture: '08:30', fermeture: '19:30' };
  }, [salon, dayKey]);

  const isClosedDay = useMemo(() => {
    return daySchedule?.ouvert === false;
  }, [daySchedule]);

  // Generate available time slots based on opening hours
  const availableTimeSlots = useMemo<string[]>(() => {
    if (!daySchedule?.ouvert) return [];

    const start = daySchedule.ouverture || '08:30';
    const end = daySchedule.fermeture || '19:30';

    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);

    const startTotalMins = startH * 60 + (startM || 0);
    const endTotalMins = endH * 60 + (endM || 0);

    const slots: string[] = [];
    const interval = 30; // 30 minutes slots

    const now = new Date();
    const isToday = selectedDate === now.toISOString().split('T')[0];
    const currentMins = now.getHours() * 60 + now.getMinutes();

    for (let m = startTotalMins; m <= endTotalMins - 30; m += interval) {
      // If today, only show future time slots (at least 30 mins buffer)
      if (isToday && m <= currentMins + 20) {
        continue;
      }

      const h = Math.floor(m / 60);
      const min = m % 60;
      const formatted = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      slots.push(formatted);
    }

    return slots;
  }, [daySchedule, selectedDate]);

  // Auto select first slot if available
  useEffect(() => {
    if (availableTimeSlots.length > 0) {
      if (!selectedTimeSlot || !availableTimeSlots.includes(selectedTimeSlot)) {
        setSelectedTimeSlot(availableTimeSlots[0]);
      }
    } else {
      setSelectedTimeSlot('');
    }
  }, [availableTimeSlots]);

  // WhatsApp confirmation link
  const whatsappUrl = useMemo(() => {
    if (!salon?.whatsapp && !salon?.telephone) return '';
    return generateWhatsAppBeautyBookingUrl(
      salon.whatsapp || salon.telephone,
      salon.nom,
      selectedService?.nom || 'Prestation beauté',
      selectedDate,
      selectedTimeSlot,
      clientName
    );
  }, [salon, selectedService, selectedDate, selectedTimeSlot, clientName]);

  // Submit booking
  const submitBooking = async (): Promise<BeautyAppointment | null> => {
    if (!salon) {
      setError("Aucun salon sélectionné.");
      return null;
    }

    if (!selectedService) {
      setError("Veuillez sélectionner un service ou une prestation.");
      return null;
    }

    if (!selectedDate) {
      setError("Veuillez choisir une date.");
      return null;
    }

    if (!selectedTimeSlot) {
      setError("Veuillez choisir un créneau horaire disponible.");
      return null;
    }

    if (!clientName.trim()) {
      setError("Veuillez renseigner votre nom complet.");
      return null;
    }

    const cleanPhone = clientPhone.replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 8) {
      setError("Veuillez entrer un numéro de téléphone valide (ex: 70 00 00 00).");
      return null;
    }

    if (aDomicile && !adresseDomicile.trim()) {
      setError("Veuillez spécifier l'adresse de votre domicile ou quartier.");
      return null;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const newAppointment = await createBeautyAppointment({
        salonId: salon.id,
        serviceId: selectedService.id,
        clientId: currentUser?.id,
        nomClient: clientName.trim(),
        telephoneClient: clientPhone.trim(),
        dateRdv: selectedDate,
        heureRdv: selectedTimeSlot,
        statut: 'en_attente',
        notesClient: clientNotes.trim() || undefined,
        prixTotalFcfa: selectedService.prixFcfa,
        aDomicile,
        adresseDomicile: aDomicile ? adresseDomicile.trim() : undefined
      });

      setCreatedAppointment(newAppointment);
      setSuccess(true);

      if (onSuccess) {
        onSuccess(newAppointment);
      }

      return newAppointment;
    } catch (err: any) {
      console.error('[useBeautyBooking] Erreur lors de la prise de rendez-vous:', err);
      setError(err?.message || "Une erreur est survenue lors de l'enregistrement de votre rendez-vous.");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetBooking = () => {
    setSuccess(false);
    setError(null);
    setCreatedAppointment(null);
    setSelectedTimeSlot(availableTimeSlots[0] || '');
  };

  return {
    // State
    selectedServiceId,
    setSelectedServiceId,
    selectedService,
    selectedDate,
    setSelectedDate,
    selectedTimeSlot,
    setSelectedTimeSlot,
    availableTimeSlots,
    isClosedDay,
    daySchedule,

    // Client form state
    clientName,
    setClientName,
    clientPhone,
    setClientPhone,
    clientNotes,
    setClientNotes,
    aDomicile,
    setADomicile,
    adresseDomicile,
    setAdresseDomicile,

    // Status
    isSubmitting,
    error,
    success,
    createdAppointment,
    whatsappUrl,

    // Actions
    submitBooking,
    resetBooking
  };
}
