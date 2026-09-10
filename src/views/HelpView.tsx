import React, { useState, useMemo } from 'react';
import { 
  Search, 
  HelpCircle, 
  Calendar, 
  Bell, 
  FileSpreadsheet, 
  WifiOff, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Sparkles, 
  MessageSquare, 
  Phone, 
  Mail, 
  ExternalLink, 
  BookOpen, 
  Clock, 
  Users, 
  ShieldCheck, 
  Store,
  Layers,
  Scissors,
  DollarSign
} from 'lucide-react';
import { useAppStore } from '../store';
import { exportReservationsToCSV } from '../utils/exportReservationsCsv';
import { downloadGuidePDF } from '../utils/downloadGuide';
import { Tab } from '../components/BottomNav';
import { QuickFeedbackCard } from '../components/QuickFeedbackCard';
import { FAQComponent, FAQItem } from '../components/FAQComponent';

interface HelpViewProps {
  onNavigate?: (tab: Tab) => void;
}

export function HelpView({ onNavigate }: HelpViewProps) {
  const { currentUser, establishments, reservations } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeStep, setActiveStep] = useState<number>(1);

  const faqList: FAQItem[] = [
    // 1. ZAKA BEAUTY & SALONS
    {
      id: 'beauty-rdv',
      category: 'beauty',
      categoryLabel: 'ZAKA Beauty & Salons',
      question: 'Comment réserver un soin ou une prestation dans un salon de coiffure / beauté ?',
      tags: ['beauty', 'salon', 'coiffure', 'spa', 'barber', 'rdv', 'onglerie', 'soin'],
      profile: 'user',
      answer: (
        <div className="space-y-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
          <p>Avec le module <strong>ZAKA Beauty</strong>, prendre rendez-vous chez votre coiffeur, barbier ou institut de beauté prend moins d'une minute :</p>
          <ol className="list-decimal list-inside space-y-1.5 pl-1 font-medium">
            <li>Accédez à l'onglet <strong className="text-rose-600">Beauté & Salons</strong> depuis le menu de navigation.</li>
            <li>Explorez les salons disponibles à Ouagadougou, Bobo-Dioulasso et Koudougou avec filtres par type (Barber, Spa, Onglerie, Coiffure Femme, Make-up, Mixte).</li>
            <li>Cliquez sur <strong className="text-rose-600">« Réserver un créneau »</strong> sur le salon de votre choix.</li>
            <li>Sélectionnez la prestation (coupe, tresses, manucure, massage), choisissez la date, l'heure et l'option salon ou à domicile.</li>
            <li>Validez votre réservation. Vous pouvez également échanger directement sur WhatsApp avec le salon si souhaité.</li>
          </ol>
        </div>
      )
    },
    {
      id: 'beauty-hours-manager',
      category: 'gerants',
      categoryLabel: 'Gestion Gérant & Salons',
      question: 'Comment définir les heures d\'ouverture et les jours d\'activité de mon salon ?',
      tags: ['horaires', 'heures', 'ouverture', 'salon', 'fermeture', 'planning', 'semaine'],
      profile: 'manager',
      answer: (
        <div className="space-y-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
          <p>Chaque salon peut configurer ses créneaux d'ouverture jour par jour dans son tableau de bord :</p>
          <ul className="list-disc list-inside space-y-1.5 pl-1 font-medium">
            <li>Rendez-vous dans votre <strong>Espace Gérant Beauté</strong>, onglet <strong>« Heures d'ouverture »</strong>.</li>
            <li>Pour chaque jour du lundi au dimanche, activez l'interrupteur si le salon est ouvert ou marquez-le fermé.</li>
            <li>Indiquez l'heure d'ouverture matinale et l'heure de fermeture du soir.</li>
            <li>Cliquez sur <strong>« Enregistrer les horaires »</strong>. Les clients ne pourront réserver que pendant vos heures réelles de service.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'beauty-status-alert',
      category: 'notifications',
      categoryLabel: 'Alertes & Notifications',
      question: 'Comment les clients sont-ils prévenus si leur rendez-vous beauté est confirmé ou annulé ?',
      tags: ['notification', 'statut', 'confirmation', 'annulation', 'alerte', 'dashboard', 'push'],
      profile: 'both',
      answer: (
        <div className="space-y-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
          <p>Le système de notifications Zaka+ assure un suivi transparent et instantané :</p>
          <ul className="list-disc list-inside space-y-1.5 pl-1">
            <li><strong>Notification instantanée</strong> : Dès que le gérant valide ou annule un rendez-vous, une alerte s'affiche sur la cloche de notification et un toast apparaît à l'écran du client.</li>
            <li><strong>Tableau de bord personnel</strong> : Dans le <em>Profil</em> du client, la section <em>« Mes rendez-vous Beauté »</em> affiche l'état en temps réel (🟢 Confirmé, 🟡 En attente, 🔴 Refusé / Annulé, 🔵 Terminé) avec les notes laissées par le salon.</li>
            <li><strong>Rappel automatique 2h</strong> : 2 heures avant le soin, une notification de rappel est transmise au client.</li>
          </ul>
        </div>
      )
    },
    // 2. GESTION DES RÉSERVATIONS
    {
      id: 'res-accept',
      category: 'reservations',
      categoryLabel: 'Gestion des Réservations',
      question: 'Comment valider ou refuser une demande de réservation client ?',
      tags: ['validation', 'refus', 'confirmation', 'statut', 'client', 'table'],
      profile: 'manager',
      answer: (
        <div className="space-y-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
          <p>Dès qu'un client réserve une table dans votre établissement, vous recevez une notification en temps réel dans votre tableau de bord gérant :</p>
          <ol className="list-decimal list-inside space-y-1.5 pl-1 font-medium">
            <li>Rendez-vous dans votre <strong>Profil / Tableau de bord Gérant</strong>, puis cliquez sur l'onglet <strong className="text-orange-600">Réservations</strong>.</li>
            <li>Dans la section <em>« Demandes en attente »</em>, consultez les informations clés : nom du client, numéro de téléphone, date, heure, nombre de convives et demandes particulières.</li>
            <li>Cliquez sur <strong className="text-emerald-600">« Valider la réservation »</strong> pour confirmer la réservation. Le client recevra instantanément une notification confirmant sa table.</li>
            <li>Si vous êtes complet ou indisponible, cliquez sur <strong className="text-red-600">« Refuser »</strong> en indiquant si besoin un motif explicatif.</li>
          </ol>
        </div>
      )
    },
    {
      id: 'notif-2h',
      category: 'notifications',
      categoryLabel: 'Rappels 2h & Notifications',
      question: 'Comment fonctionne le rappel automatique par notification 2 heures avant ?',
      tags: ['rappel', '2h', 'notification', 'automatique', 'presence', 'no-show'],
      profile: 'user',
      answer: (
        <div className="space-y-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
          <p>Zaka+ intègre un <strong>moteur automatisé de rappels push</strong> pour limiter considérablement les « No-shows » :</p>
          <ul className="space-y-1.5 list-disc list-inside pl-1">
            <li>Exactement <strong>2 heures (120 minutes)</strong> avant l'heure prévue de la réservation confirmée, l'application envoie une notification push au client.</li>
            <li>La notification rappelle le nom de l'établissement, l'heure exacte et l'itinéraire.</li>
            <li>Le client peut confirmer sa présence en un clic ou signaler un léger retard au gérant.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'offline-indexeddb',
      category: 'offline',
      categoryLabel: 'Mode Hors-ligne & PWA',
      question: 'Comment fonctionne la mise en cache locale React Query et le Service Worker hors-ligne ?',
      tags: ['offline', 'cache', 'service worker', 'react query', 'connexion', 'pwa', 'images'],
      profile: 'both',
      answer: (
        <div className="space-y-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
          <p>Pour s'adapter aux variations de connectivité au Burkina Faso, Zaka+ utilise une double stratégie d'optimisation hors-ligne :</p>
          <ul className="space-y-1.5 list-disc list-inside pl-1">
            <li><strong>React Query + Cache Local</strong> : La liste des salons, tarifs et prestations est mise en cache locale. Lors d'une perte de connexion ou reconnexion instable, la liste s'affiche immédiatement en 0ms.</li>
            <li><strong>Service Worker Personnalisé</strong> : Toutes les photos de profils de salons, logos et icônes de service sont mises en cache dynamique (Cache-First) sur votre appareil.</li>
            <li><strong>Bannière Réseau</strong> : Une notification discrète vous indique le passage en mode hors-ligne sans interrompre votre navigation.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'csv-export',
      category: 'exports',
      categoryLabel: 'Exports CSV & Bilan',
      question: 'Comment exporter mes statistiques de réservations et revenus au format Excel / CSV ?',
      tags: ['csv', 'excel', 'export', 'statistiques', 'rapport', 'couverts', 'bilan', 'revenus'],
      profile: 'manager',
      answer: (
        <div className="space-y-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
          <p>Vous pouvez télécharger à tout moment un rapport analytique complet de vos activités :</p>
          <ol className="list-decimal list-inside space-y-1.5 pl-1 font-medium">
            <li>Ouvrez votre <strong>Tableau de bord Gérant</strong> ou <strong>Espace Beauté</strong>.</li>
            <li>Cliquez sur le bouton vert <strong className="text-emerald-600">« Exporter CSV »</strong> ou <strong>« Télécharger Bilan »</strong>.</li>
            <li>Un fichier CSV standard compatible Microsoft Excel, Google Sheets et LibreOffice est immédiatement généré avec les colonnes date, client, service, statut, montant FCFA et notes.</li>
          </ol>
        </div>
      )
    },
    {
      id: 'table-capacity',
      category: 'reservations',
      categoryLabel: 'Gestion des Réservations',
      question: 'Comment gérer la capacité de mon établissement et éviter le surbooking ?',
      tags: ['capacite', 'tables', 'surbooking', 'places', 'affluence'],
      profile: 'manager',
      answer: (
        <div className="space-y-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
          <p>Pour garantir une expérience optimale, vous disposez d'un contrôle total sur les flux de convives :</p>
          <ul className="space-y-1.5 list-disc list-inside pl-1">
            <li>Consultez la jauge d'affluence en temps réel et le calendrier journalier.</li>
            <li>Fixez un seuil maximal de couverts acceptables par créneau de 30 minutes.</li>
            <li>En cas de forte affluence (concerts, retransmissions de matchs), passez l'établissement en statut <em>« Sur réservation uniquement »</em>.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'tarifs-fcfa',
      category: 'paiements',
      categoryLabel: 'Paiements & Tarifs FCFA',
      question: 'Quels sont les modes de paiement supportés pour les commandes et réservations ?',
      tags: ['fcfa', 'paiement', 'orange money', 'moov', 'wave', 'especes', 'caisse'],
      profile: 'both',
      answer: (
        <div className="space-y-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
          <p>Zaka+ est conçu spécifiquement pour l'écosystème financier local en Afrique de l'Ouest :</p>
          <ul className="space-y-1.5 list-disc list-inside pl-1">
            <li><strong>Tous les prix sont affichés en Francs CFA (FCFA)</strong>.</li>
            <li>Les paiements sur place acceptent les espèces, <strong>Orange Money</strong>, <strong>Moov Money</strong> et <strong>Wave</strong>.</li>
            <li>Les caissiers peuvent enregistrer les références de transaction mobile money directement lors de la clôture des tickets de caisse.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'visibility-ratings',
      category: 'visibility',
      categoryLabel: 'Visibilité & Avis',
      question: 'Comment améliorer la note moyenne et la visibilité de mon établissement ?',
      tags: ['avis', 'notes', 'visibilite', 'etoiles', 'reputation', 'boost', 'zaka ads'],
      profile: 'manager',
      answer: (
        <div className="space-y-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
          <p>Voici les leviers essentiels pour positionner votre établissement parmi les plus populaires sur Zaka+ :</p>
          <ul className="space-y-1.5 list-disc list-inside pl-1">
            <li>Répondez rapidement aux avis clients et proposez un accueil soigné.</li>
            <li>Publiez régulièrement vos menus du jour et photos de vos créations.</li>
            <li>Utilisez la régie <strong>ZAKA Ads</strong> pour booster la visibilité de vos événements auprès des utilisateurs géolocalisés à proximité.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'theme-customization',
      category: 'general',
      categoryLabel: 'Affichage & Thème',
      question: 'Comment activer le mode sombre ou forcer le mode clair ?',
      tags: ['theme', 'sombre', 'clair', 'dark', 'mode', 'systeme'],
      profile: 'user',
      answer: (
        <div className="space-y-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
          <p>Vous pouvez personnaliser le thème d'affichage selon votre confort visuel depuis le bouton soleil/lune présent dans la barre supérieure ou dans les paramètres du profil.</p>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen pb-24 max-w-4xl mx-auto px-4 pt-4 animate-in fade-in duration-200 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-black/20 text-white border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest">
              Centre d'Aide & FAQ
            </span>
            <span className="text-xs text-orange-100 font-bold flex items-center gap-1">
              <Sparkles size={13} /> Autonomie Clients & Gérants
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Comment pouvons-nous vous aider ?
          </h1>
          <p className="text-xs sm:text-sm text-orange-100 max-w-xl leading-relaxed">
            Consultez nos guides détaillés sur les réservations de tables, les rendez-vous beauté, la gestion de caisse, le mode hors-ligne et les notifications instantanées.
          </p>
        </div>

        <div className="z-10 shrink-0 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <a
            href="#/pitch-deck"
            target="_blank"
            rel="noopener noreferrer"
            className="px-5 py-3 bg-white/20 hover:bg-white/30 text-white font-black text-xs sm:text-sm rounded-2xl backdrop-blur-md transition-all flex items-center justify-center gap-2"
          >
            <span>Pitch Deck 2026</span>
            <ExternalLink size={15} />
          </a>
        </div>
      </div>

      {/* Interactive Walkthrough: Cycle d'une Réservation */}
      <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-3xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-gray-900 dark:text-white">
                Cycle de vie d'une réservation Zaka+
              </h2>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Visualisez pas à pas le déroulement d'une réservation réussie
              </p>
            </div>
          </div>
        </div>

        {/* Step Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 mb-4 bg-gray-50 dark:bg-gray-900 p-1.5 rounded-2xl">
          {[
            { step: 1, title: '1. Demande', icon: Calendar },
            { step: 2, title: '2. Confirmation', icon: CheckCircle2 },
            { step: 3, title: '3. Rappel 2h', icon: Bell },
            { step: 4, title: '4. Accueil', icon: Users },
            { step: 5, title: '5. Bilan CSV', icon: FileSpreadsheet }
          ].map(s => (
            <button
              key={s.step}
              type="button"
              onClick={() => setActiveStep(s.step)}
              className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeStep === s.step
                  ? 'bg-orange-600 text-white shadow-xs font-black'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <s.icon className="w-3.5 h-3.5" />
              <span className="truncate">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Active Step Explainer Card */}
        <div className="p-4 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/40 text-xs">
          {activeStep === 1 && (
            <div className="space-y-1.5">
              <h4 className="font-bold text-orange-900 dark:text-orange-300 flex items-center gap-1.5 text-sm">
                <Calendar className="w-4 h-4 text-orange-600" /> Étape 1 : Le client réserve depuis l'application
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Le client choisit son établissement ou salon favori, sélectionne la date, l'heure et le nombre de convives / prestations, et ajoute ses préférences.
              </p>
            </div>
          )}
          {activeStep === 2 && (
            <div className="space-y-1.5">
              <h4 className="font-bold text-orange-900 dark:text-orange-300 flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Étape 2 : Le gérant valide la demande
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Vous recevez une notification instantanée. Dans votre espace Réservations ou Beauté, cliquez sur « Valider » en 1 clic pour attribuer la table / le créneau et notifier le client.
              </p>
            </div>
          )}
          {activeStep === 3 && (
            <div className="space-y-1.5">
              <h4 className="font-bold text-orange-900 dark:text-orange-300 flex items-center gap-1.5 text-sm">
                <Bell className="w-4 h-4 text-orange-600" /> Étape 3 : Rappel push automatique 2 heures avant
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Zaka+ envoie un rappel push directement sur le téléphone du client 2 heures avant le rendez-vous pour s'assurer de sa présence et limiter les absences.
              </p>
            </div>
          )}
          {activeStep === 4 && (
            <div className="space-y-1.5">
              <h4 className="font-bold text-orange-900 dark:text-orange-300 flex items-center gap-1.5 text-sm">
                <Users className="w-4 h-4 text-purple-600" /> Étape 4 : Accueil et prestation de service
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Le client arrive à l'heure convenue. Votre équipe l'installe immédiatement et lui propose vos prestations ou menus du jour.
              </p>
            </div>
          )}
          {activeStep === 5 && (
            <div className="space-y-1.5">
              <h4 className="font-bold text-orange-900 dark:text-orange-300 flex items-center gap-1.5 text-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Étape 5 : Analyse statistique et Export CSV
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Consultez vos graphiques de fréquentation et téléchargez en 1 clic votre rapport CSV complet pour la comptabilité et le suivi de gestion.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Search Input */}
      <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-3xl p-5 shadow-sm">
        <div className="relative">
          <Search className="w-5 h-5 text-orange-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="faq-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une question (ex: salon, validation, rdv, csv, rappel 2h, hors-ligne, fcfa...)"
            className="w-full pl-11 pr-16 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            >
              Effacer
            </button>
          )}
        </div>
      </div>

      {/* FAQ Interactive Component with Category & Audience Filter */}
      <div className="space-y-4">
        <FAQComponent
          faqList={faqList}
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          onCategorySelect={(cat) => setSelectedCategory(cat)}
          onTagClick={(tag) => setSearchQuery(tag)}
        />
      </div>

      {/* Formulaire de Feedback Rapide */}
      <div id="quick-feedback">
        <QuickFeedbackCard
          establishments={establishments}
          currentUser={currentUser}
        />
      </div>

      {/* Direct Manager Assistance / Contact Card */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-850 text-white rounded-3xl p-6 shadow-xl border border-gray-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Support Zaka+</span>
            <h3 className="text-lg font-black mt-0.5">Besoin d'un accompagnement personnalisé ?</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-lg leading-relaxed">
              Notre équipe technique et support est disponible pour vous accompagner dans la prise en main de vos réservations, vos créneaux de salon et vos bilans d'activité.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <a
              href="tel:+22670000000"
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 active:scale-95 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 shadow-md"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Appeler le support</span>
            </a>
            <a
              href="mailto:support@zaka-plus.com"
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 active:scale-95 text-gray-200 font-bold text-xs rounded-xl border border-gray-700 transition-all flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Écrire un email</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpView;
