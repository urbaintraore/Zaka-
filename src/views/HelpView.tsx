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
  Layers
} from 'lucide-react';
import { useAppStore } from '../store';
import { exportReservationsToCSV } from '../utils/exportReservationsCsv';
import { downloadGuidePDF } from '../utils/downloadGuide';
import { Tab } from '../components/BottomNav';

interface HelpViewProps {
  onNavigate?: (tab: Tab) => void;
}

interface FAQItem {
  id: string;
  category: 'reservations' | 'notifications' | 'exports' | 'offline' | 'visibility' | 'general';
  categoryLabel: string;
  question: string;
  answer: React.ReactNode;
  tags: string[];
}

export function HelpView({ onNavigate }: HelpViewProps) {
  const { currentUser, establishments, reservations } = useAppStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    'res-accept': true,
    'notif-2h': true
  });
  const [activeStep, setActiveStep] = useState<number>(1);

  const myEsts = establishments.filter(e => e.ownerId === currentUser?.id);
  const myEstIds = myEsts.map(e => e.id);

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const allOpen: Record<string, boolean> = {};
    faqList.forEach(item => {
      allOpen[item.id] = true;
    });
    setOpenItems(allOpen);
  };

  const collapseAll = () => {
    setOpenItems({});
  };

  const faqList: FAQItem[] = [
    {
      id: 'res-accept',
      category: 'reservations',
      categoryLabel: 'Gestion des Réservations',
      question: 'Comment valider ou refuser une demande de réservation client ?',
      tags: ['validation', 'refus', 'confirmation', 'statut', 'client', 'table'],
      answer: (
        <div className="space-y-3 text-sm text-gray-750 dark:text-gray-300">
          <p>
            Dès qu'un client réserve une table dans votre établissement, vous recevez une notification en temps réel dans votre tableau de bord gérant :
          </p>
          <ol className="list-decimal list-inside space-y-2 pl-1 font-medium">
            <li>
              Rendez-vous dans votre <strong>Profil / Tableau de bord Gérant</strong>, puis cliquez sur l'onglet <strong className="text-orange-600">Réservations</strong>.
            </li>
            <li>
              Dans la section <em>« Demandes en attente »</em>, consultez les informations clés : nom du client, numéro de téléphone, date, heure, nombre de convives et demandes particulières.
            </li>
            <li>
              Cliquez sur <strong className="text-emerald-600">« Valider la réservation »</strong> pour confirmer la réservation. Le client recevra instantanément une notification confirmant sa table.
            </li>
            <li>
              Si vous êtes complet ou indisponible, cliquez sur <strong className="text-red-600">« Refuser »</strong>. Vous pouvez alors renseigner un motif explicatif pour avertir poliment le client.
            </li>
          </ol>
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 rounded-xl text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span><strong>Conseil Pro :</strong> Répondez aux demandes dans un délai de 15 minutes pour maximiser la satisfaction client et fidéliser vos convives.</span>
          </div>
        </div>
      )
    },
    {
      id: 'notif-2h',
      category: 'notifications',
      categoryLabel: 'Rappels 2h & Alertes',
      question: 'Comment fonctionne le rappel automatique par notification 2 heures avant ?',
      tags: ['rappel', '2h', 'notification', 'automatique', 'presence', 'no-show'],
      answer: (
        <div className="space-y-3 text-sm text-gray-750 dark:text-gray-300">
          <p>
            Zaka+ intègre un <strong>moteur automatisé de rappels push</strong> pour limiter considérablement les « No-shows » (clients qui ne se présentent pas) :
          </p>
          <ul className="space-y-2 list-disc list-inside pl-1">
            <li>
              Exactement <strong>2 heures (120 minutes)</strong> avant l'heure prévue de la réservation confirmée, l'application envoie une notification push au client avec le nom de votre établissement et l'heure du repas.
            </li>
            <li>
              Le client peut ouvrir la notification en un clic et reconfirmer sa venue ou appeler directement votre établissement.
            </li>
            <li>
              Aucune action manuelle n'est requise de votre part : le système effectue les vérifications et calculs horaires en tâche de fond.
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'csv-export',
      category: 'exports',
      categoryLabel: 'Exports CSV & Statistiques',
      question: 'Comment exporter mes statistiques de réservations au format Excel / CSV ?',
      tags: ['csv', 'excel', 'export', 'statistiques', 'rapport', 'couverts', 'bilan'],
      answer: (
        <div className="space-y-3 text-sm text-gray-750 dark:text-gray-300">
          <p>
            Vous pouvez télécharger à tout moment un rapport analytique complet de toutes vos réservations :
          </p>
          <ol className="list-decimal list-inside space-y-2 pl-1">
            <li>Depuis votre <strong>Tableau de bord Gérant</strong> ou depuis la section <strong>Paramètres du Profil</strong>, cliquez sur le bouton <strong className="text-emerald-600">« Exporter CSV »</strong>.</li>
            <li>Le fichier généré est encodé en <strong>UTF-8 avec BOM</strong> pour s'ouvrir sans aucun problème d'accent dans Microsoft Excel, LibreOffice Calc et Numbers.</li>
            <li>
              Le fichier contient 2 sections :
              <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <li><strong>Synthèse mensuelle :</strong> total réservations, taux de confirmation (%), nombre total de couverts/personnes.</li>
                <li><strong>Tableau détaillé :</strong> listing complet avec noms, numéros de téléphone, dates, heures, statuts et demandes spécifiques.</li>
              </ul>
            </li>
          </ol>
        </div>
      )
    },
    {
      id: 'offline-indexeddb',
      category: 'offline',
      categoryLabel: 'Mode Hors-ligne (IndexedDB)',
      question: 'Comment fonctionne la consultation des établissements hors connexion avec IndexedDB ?',
      tags: ['offline', 'indexeddb', 'hors-ligne', 'cache', 'connexion', 'internet'],
      answer: (
        <div className="space-y-3 text-sm text-gray-750 dark:text-gray-300">
          <p>
            Zaka+ utilise une technologie avancée de <strong>stockage local structuré (IndexedDB)</strong> pour garantir l'accessibilité permanente des données :
          </p>
          <ul className="space-y-2 list-disc list-inside pl-1">
            <li>Tous les établissements, cartes de menus, photos et coordonnées sont sauvegardés automatiquement dans la base de données IndexedDB de votre navigateur.</li>
            <li>En cas de coupure de réseau ou de faible couverture 3G/4G, l'application bascule automatiquement sur les données stockées en cache local sans bloquer votre navigation.</li>
            <li>Dès que la connexion internet est rétablie, les informations se synchronisent automatiquement en arrière-plan avec la base de données centrale.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'table-capacity',
      category: 'reservations',
      categoryLabel: 'Gestion des Réservations',
      question: 'Comment gérer la capacité de mon établissement et éviter le surbooking ?',
      tags: ['capacite', 'tables', 'surbooking', 'places', 'affluence'],
      answer: (
        <div className="space-y-3 text-sm text-gray-750 dark:text-gray-300">
          <p>
            Pour garantir une expérience optimale, vous disposez d'un contrôle total sur les flux de convives :
          </p>
          <ul className="space-y-2 list-disc list-inside pl-1">
            <li><strong>Indicateur d'affluence en direct :</strong> Ajustez le statut de votre établissement (*Calme*, *Moyen*, *Plein*, *Complet*) depuis votre fiche.</li>
            <li><strong>Contrôle des réservations :</strong> Vous avez l'entière liberté d'accepter ou refuser chaque demande selon la disponibilité de vos tables en salle ou en terrasse.</li>
            <li><strong>Contact direct :</strong> Vous pouvez appeler ou envoyer un message au client en un clic si un ajustement d'horaire est nécessaire.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'visibility-ratings',
      category: 'visibility',
      categoryLabel: 'Visibilité & Profil',
      question: 'Comment améliorer la note moyenne et la visibilité de mon établissement ?',
      tags: ['avis', 'notes', 'visibilite', 'etoiles', 'reputation', 'boost'],
      answer: (
        <div className="space-y-3 text-sm text-gray-750 dark:text-gray-300">
          <p>
            Voici les leviers essentiels pour positionner votre établissement parmi les plus populaires sur Zaka+ :
          </p>
          <ul className="space-y-2 list-disc list-inside pl-1">
            <li><strong>Photos de haute qualité :</strong> Publiez des photos lumineuses et appétissantes de votre cadre et de vos spécialités.</li>
            <li><strong>Menu du Jour :</strong> Mettez à jour quotidiennement votre menu du jour pour apparaître dans les suggestions d'accueil.</li>
            <li><strong>Validation rapide des réservations :</strong> Les établissements réactifs bénéficient d'un meilleur engagement client et de recommandations prioritaires.</li>
            <li><strong>Incitation aux avis :</strong> Encouragez vos clients satisfaits à laisser une note 5 étoiles et un commentaire après leur visite.</li>
          </ul>
        </div>
      )
    },
    {
      id: 'theme-customization',
      category: 'general',
      categoryLabel: 'Paramètres & Affichage',
      question: 'Comment activer le mode sombre ou forcer le mode clair ?',
      tags: ['theme', 'sombre', 'clair', 'dark', 'mode', 'systeme'],
      answer: (
        <div className="space-y-3 text-sm text-gray-750 dark:text-gray-300">
          <p>
            Vous pouvez personnaliser le thème d'affichage selon votre confort visuel :
          </p>
          <ul className="space-y-2 list-disc list-inside pl-1">
            <li><strong>Depuis la barre supérieure :</strong> Cliquez sur l'icône Soleil/Lune pour basculer rapidement entre clair et sombre.</li>
            <li><strong>Depuis les Paramètres du Profil :</strong> Vous avez accès à un sélecteur à 3 options :
              <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                <li><strong>☀️ Clair :</strong> Force le mode jour lumineux.</li>
                <li><strong>🌙 Sombre :</strong> Force le mode nuit reposant pour les yeux.</li>
                <li><strong>⚙️ Auto :</strong> Synchronise automatiquement avec le mode de votre smartphone ou ordinateur.</li>
              </ul>
            </li>
          </ul>
        </div>
      )
    }
  ];

  // Filter FAQ items
  const filteredFaq = useMemo(() => {
    return faqList.filter(item => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesCategory;

      const matchesQuery = 
        item.question.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        item.tags.some(t => t.toLowerCase().includes(q));

      return matchesCategory && matchesQuery;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen pb-24 max-w-4xl mx-auto px-4 pt-4 animate-in fade-in duration-200">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-amber-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden mb-6">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-orange-200 text-xs font-black uppercase tracking-wider mb-2">
            <HelpCircle className="w-4 h-4" />
            <span>Centre d'Aide & FAQ Dynamique</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Guide d'utilisation & Outils de Réservation
          </h1>
          <p className="text-xs sm:text-sm text-orange-100 font-medium mt-2 max-w-2xl leading-relaxed">
            Trouvez instantanément toutes les réponses pour gérer vos réservations, relancer vos clients, exporter vos statistiques et tirer le meilleur parti de Zaka+.
          </p>

          {/* Quick Action Bar in Hero */}
          <div className="flex flex-wrap items-center gap-2.5 mt-5">
            <button
              type="button"
              onClick={downloadGuidePDF}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Guide Officiel PDF</span>
            </button>

            {((currentUser?.role as any) === 'gerant' || (currentUser?.role as any) === 'admin') && (
              <button
                type="button"
                onClick={() => exportReservationsToCSV({
                  reservations,
                  establishments,
                  managerEstablishmentIds: myEstIds,
                  managerName: currentUser?.name
                })}
                className="px-4 py-2 bg-emerald-500/90 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Exporter CSV</span>
              </button>
            )}

            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('profile')}
                className="px-4 py-2 bg-white text-orange-700 font-bold text-xs rounded-xl hover:bg-orange-50 transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Tableau de bord</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Walkthrough: Cycle d'une Réservation */}
      <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-3xl p-5 shadow-sm mb-6">
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
                Le client choisit son établissement favori, sélectionne la date, l'heure et le nombre de convives, et ajoute ses préférences (terrasse, climatisation, anniversaire).
              </p>
            </div>
          )}
          {activeStep === 2 && (
            <div className="space-y-1.5">
              <h4 className="font-bold text-orange-900 dark:text-orange-300 flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Étape 2 : Le gérant valide la demande
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Vous recevez une notification instantanée. Dans votre espace Réservations, cliquez sur « Valider » en 1 clic pour attribuer la table et avertir le client.
              </p>
            </div>
          )}
          {activeStep === 3 && (
            <div className="space-y-1.5">
              <h4 className="font-bold text-orange-900 dark:text-orange-300 flex items-center gap-1.5 text-sm">
                <Bell className="w-4 h-4 text-orange-600" /> Étape 3 : Rappel push automatique 2 heures avant
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Zaka+ envoie un rappel push directement sur le téléphone du client 2 heures avant le repas pour s'assurer de sa présence et limiter les absences.
              </p>
            </div>
          )}
          {activeStep === 4 && (
            <div className="space-y-1.5">
              <h4 className="font-bold text-orange-900 dark:text-orange-300 flex items-center gap-1.5 text-sm">
                <Users className="w-4 h-4 text-purple-600" /> Étape 4 : Accueil et service des convives
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Le client arrive avec son nom de réservation. Votre équipe l'installe immédiatement et lui propose votre menu du jour et vos cocktails signatures.
              </p>
            </div>
          )}
          {activeStep === 5 && (
            <div className="space-y-1.5">
              <h4 className="font-bold text-orange-900 dark:text-orange-300 flex items-center gap-1.5 text-sm">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Étape 5 : Analyse statistique et Export CSV
              </h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Consultez vos graphiques de fréquentation mensuelle et téléchargez en 1 clic votre rapport CSV complet pour la comptabilité et le suivi de gestion.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Dynamic Search & Category Filter Section */}
      <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-3xl p-5 shadow-sm mb-6">
        {/* Search input */}
        <div className="relative mb-4">
          <Search className="w-5 h-5 text-orange-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une question (ex: validation, csv, rappel 2h, hors-ligne, tables...)"
            className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none text-gray-900 dark:text-gray-100 transition-all placeholder:text-gray-400"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              Effacer
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'Toutes les questions', icon: Sparkles },
            { id: 'reservations', label: 'Réservations & Tables', icon: Calendar },
            { id: 'notifications', label: 'Rappels 2h & Notifications', icon: Bell },
            { id: 'exports', label: 'Exports CSV & Stats', icon: FileSpreadsheet },
            { id: 'offline', label: 'Mode Hors-ligne (IndexedDB)', icon: WifiOff },
            { id: 'visibility', label: 'Visibilité & Avis', icon: ShieldCheck },
            { id: 'general', label: 'Affichage & Thème', icon: Sliders }
          ].map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800'
              }`}
            >
              <cat.icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Expand / Collapse Controls */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-900 text-xs text-gray-500 dark:text-gray-400">
          <span>{filteredFaq.length} question(s) trouvée(s)</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={expandAll}
              className="hover:text-orange-600 dark:hover:text-orange-400 font-bold transition-colors cursor-pointer"
            >
              Tout déplier
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={collapseAll}
              className="hover:text-orange-600 dark:hover:text-orange-400 font-bold transition-colors cursor-pointer"
            >
              Tout replier
            </button>
          </div>
        </div>
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3 mb-8">
        {filteredFaq.length === 0 ? (
          <div className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-3xl p-8 text-center">
            <AlertCircle className="w-10 h-10 text-orange-400 mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Aucun résultat trouvé</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              Aucune question ne correspond à votre recherche « {searchQuery} ». Essayez un autre mot-clé ou sélectionnez une autre catégorie.
            </p>
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="mt-4 px-4 py-2 bg-orange-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-orange-700 transition-colors"
            >
              Réinitialiser la recherche
            </button>
          </div>
        ) : (
          filteredFaq.map(item => {
            const isOpen = !!openItems[item.id];
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-950 border border-gray-150 dark:border-gray-800 rounded-2xl overflow-hidden shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className="w-full p-4.5 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-gray-50/70 dark:hover:bg-gray-900/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5 text-xs font-black">
                      ?
                    </div>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400 block mb-0.5">
                        {item.categoryLabel}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-gray-100 leading-snug">
                        {item.question}
                      </h3>
                    </div>
                  </div>
                  <div className="p-1 rounded-lg text-gray-400 bg-gray-100 dark:bg-gray-800 shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-gray-100 dark:border-gray-900 animate-in fade-in duration-150">
                    {item.answer}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Direct Manager Assistance / Contact Card */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-850 text-white rounded-3xl p-6 shadow-xl border border-gray-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Support Gérants Zaka+</span>
            <h3 className="text-lg font-black mt-0.5">Besoin d'un accompagnement personnalisé ?</h3>
            <p className="text-xs text-gray-400 mt-1 max-w-lg leading-relaxed">
              Notre équipe technique et commerciale est à votre disposition pour vous aider à paramétrer vos tables, former votre personnel et maximiser vos réservations à Ouagadougou et Bobo-Dioulasso.
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
