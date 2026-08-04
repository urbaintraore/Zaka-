import React, { useState } from 'react';
import { X, BookOpen, Star, Sparkles, Shield, DollarSign, Users, Info, Award } from 'lucide-react';

interface UserGuideModalProps {
  onClose: () => void;
}

type GuideTab = 'presentation' | 'monetization' | 'client' | 'gerant' | 'dj' | 'entreprise' | 'admin';

export function UserGuideModal({ onClose }: UserGuideModalProps) {
  const [activeTab, setActiveTab] = useState<GuideTab>('presentation');

  return (
    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-950 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-gray-150 dark:border-gray-900 bg-gradient-to-r from-orange-500 to-red-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-black">Zaka+ : Guide & Présentation</h2>
              <p className="text-xs text-orange-100 font-semibold mt-0.5">Le compagnon ultime de la vie nocturne au Burkina Faso</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-1 p-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-150 dark:border-gray-900 overflow-x-auto scrollbar-none flex-shrink-0">
          <button
            onClick={() => setActiveTab('presentation')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'presentation'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            Présentation & Impact
          </button>

          <button
            onClick={() => setActiveTab('monetization')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'monetization'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Monétisation
          </button>

          <button
            onClick={() => setActiveTab('client')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'client'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Profil Client
          </button>

          <button
            onClick={() => setActiveTab('gerant')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'gerant'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Profil Gérant
          </button>

          <button
            onClick={() => setActiveTab('dj')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dj'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Profil DJ
          </button>

          <button
            onClick={() => setActiveTab('entreprise')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'entreprise'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Profil Entreprise
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            Profil Admin
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          
          {/* TAB 1: PRESENTATION & SOCIAL UTILITY */}
          {activeTab === 'presentation' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-250">
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight border-b pb-2">
                Le Projet Zaka+ : Présentation & Vision
              </h3>
              <p>
                <strong>Zaka+</strong> (Zaka signifiant « maison » ou « cour » en langue locale) est la plateforme de référence structurant, sécurisant et dynamisant la vie nocturne et les établissements de loisirs au <strong>Burkina Faso</strong>.
              </p>
              
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 rounded-2xl flex flex-col gap-2">
                <h4 className="font-bold text-orange-800 dark:text-orange-400 text-xs uppercase tracking-wider">
                  Impact & Utilité Sociale pour le Burkina Faso 🇧🇫
                </h4>
                <ul className="list-disc pl-4 text-xs text-orange-950 dark:text-orange-300 flex flex-col gap-1.5 font-medium">
                  <li>
                    <strong>Sécurité & Orientation :</strong> Permet aux fêtards de repérer instantanément les établissements ouverts, sécurisés et validés par l'administration.
                  </li>
                  <li>
                    <strong>Promotion Culturelle :</strong> Valorise les artistes locaux, les troupes de danse traditionnelles et modernes, et les DJs du pays à travers des publications régulières d'événements.
                  </li>
                  <li>
                    <strong>Soutien à l'Économie Locale :</strong> Dynamise l'activité économique de nuit des maquis, bars, restaurants et salons de coiffure, créant d'importants gisements d'emplois pour la jeunesse burkinabè.
                  </li>
                  <li>
                    <strong>Carnet de Voyage Nocturne :</strong> Digitalise l'expérience festive grâce à des points de fidélité, des défis ludiques et la notation transparente des établissements et de leur personnel.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 2: MONETIZATION POTENTIAL */}
          {activeTab === 'monetization' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-250">
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight border-b pb-2">
                Gisement de Monétisation
              </h3>
              <p>
                La plateforme Zaka+ offre des leviers économiques innovants pour stimuler le chiffre d'affaires des professionnels de la nuit :
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl">
                  <h4 className="font-black text-emerald-800 dark:text-emerald-400 text-xs uppercase tracking-wider mb-2">
                    Pour les Gérants 🍹
                  </h4>
                  <ul className="list-disc pl-4 text-xs text-emerald-950 dark:text-emerald-300 flex flex-col gap-1 font-semibold">
                    <li>Abonnements VIP réservés aux clients ultra-fidèles.</li>
                    <li>Boost de visibilité en tête des fils d'actualités.</li>
                    <li>Réservations de tables pré-payées en ligne.</li>
                    <li>Ventes Flash exclusives via le mode "Promo Urgence".</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl">
                  <h4 className="font-black text-blue-800 dark:text-blue-400 text-xs uppercase tracking-wider mb-2">
                    Pour les Partenaires 🤝
                  </h4>
                  <ul className="list-disc pl-4 text-xs text-blue-950 dark:text-blue-300 flex flex-col gap-1 font-semibold">
                    <li>Bannières publicitaires ciblées par ville et quartier.</li>
                    <li>Sponsorisation d'événements majeurs (concerts, festivals).</li>
                    <li>Campagnes de recrutement de serveuses, barmaids et vigiles.</li>
                    <li>Intégration d'offres promotionnelles de boissons locales.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CLIENT PROFILE GUIDE */}
          {activeTab === 'client' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-250">
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight border-b pb-2">
                Profil Client : Mode d'Emploi
              </h3>
              <p>Le client est au cœur du dynamisme de Zaka+. Voici comment utiliser la plateforme :</p>
              
              <div className="flex flex-col gap-3 mt-2">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-extrabold flex items-center justify-center text-xs flex-shrink-0">1</div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Parrainage (Viralité) :</strong> Accédez à votre profil pour copier votre code unique et l'envoyer via WhatsApp. Lorsque votre filleul s'inscrit et laisse son premier avis, vous recevez tous deux <strong>+10 points</strong> !
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-extrabold flex items-center justify-center text-xs flex-shrink-0">2</div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Partage en Story 9:16 :</strong> Cliquez sur une soirée ou promo, puis sur le bouton <span className="bg-orange-50 text-orange-800 px-1 py-0.5 rounded font-black text-xs">Story 9:16</span>. La plateforme génère instantanément un visuel vertical calibré pour WhatsApp, Instagram ou Facebook avec un QR code intégré à télécharger d'un clic !
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 font-extrabold flex items-center justify-center text-xs flex-shrink-0">3</div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Fidélité & Carnet :</strong> Marquez votre visite dans un établissement pour valider votre venue, gagnez des points, complétez des défis photo et laissez des avis détaillés pour faire monter l'établissement dans le classement hebdomadaire.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GERANT PROFILE GUIDE */}
          {activeTab === 'gerant' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-250">
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight border-b pb-2">
                Profil Gérant : Mode d'Emploi
              </h3>
              <p>Vous possédez ou gérez un établissement ? Maximisez vos revenus grâce à ces outils :</p>

              <div className="flex flex-col gap-3 mt-2">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 font-extrabold flex items-center justify-center text-xs flex-shrink-0">1</div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Promo Urgence 🚨 :</strong> Lors de la publication d'un bon plan, cochez l'option "Promo Urgence" pour créer une offre éclair de 3h, 6h ou 12h. Elle sera surlignée en rouge clignotant sur la page d'accueil avec un <strong>compte à rebours en temps réel</strong> pour attirer l'attention immédiate des clients à proximité.
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 font-extrabold flex items-center justify-center text-xs flex-shrink-0">2</div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Indicateurs de Performance Hebdomadaire :</strong> Surveillez l'onglet de statistiques pour comparer vos performances d'une semaine à l'autre (avis reçus, réservations de tables acceptées, augmentation ou réduction du trafic).
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-red-100 text-red-600 font-extrabold flex items-center justify-center text-xs flex-shrink-0">3</div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Réservations & Recrutement :</strong> Traitez en temps réel les demandes de réservation de vos clients et recrutez votre staff de nuit (serveurs, barmaids, sécurité) directement en publiant des offres.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: DJ PROFILE GUIDE */}
          {activeTab === 'dj' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-250">
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight border-b pb-2">
                Profil DJ : Mode d'Emploi
              </h3>
              <p>Le DJ est le gardien de l'ambiance. Zaka+ le connecte directement aux clients :</p>

              <div className="flex flex-col gap-3 mt-2">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 font-extrabold flex items-center justify-center text-xs flex-shrink-0">1</div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Setlist Interactive :</strong> Publiez votre setlist en temps réel pour que les clients sachent quel style de musique est joué à l'instant (Coupé-Décalé, Amapiano, Afrobeat).
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 font-extrabold flex items-center justify-center text-xs flex-shrink-0">2</div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Avis DJ Dédiés :</strong> Recevez des évaluations spécifiques de la part des fêtards de la cour pour prouver votre réputation nationale et décrocher de nouveaux contrats de mix.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: PARTNER GUIDE */}
          {activeTab === 'entreprise' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-250">
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight border-b pb-2">
                Profil Entreprise Partenaire : Mode d'Emploi
              </h3>
              <p>Brasseries, distributeurs de boissons ou marques nationales, Zaka+ est votre régie publicitaire :</p>

              <div className="flex flex-col gap-3 mt-2">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-extrabold flex items-center justify-center text-xs flex-shrink-0">1</div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Partenariats de Boisson :</strong> Publiez des offres de boissons exclusives en partenariat avec des maquis spécifiques.
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-extrabold flex items-center justify-center text-xs flex-shrink-0">2</div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Annonces & Sponsorisation :</strong> Diffusez des communiqués en tête de plateforme et sponsorisez des challenges festifs pour collecter des photos créatives associées à votre marque.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: ADMIN GUIDE */}
          {activeTab === 'admin' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-250">
              <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight border-b pb-2">
                Profil Administrateur : Modération & Contrôle
              </h3>
              <p>La sécurité et l'authenticité des données sont garanties par les administrateurs :</p>

              <div className="flex flex-col gap-3 mt-2">
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 font-extrabold flex items-center justify-center text-xs flex-shrink-0">1</div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Validation des Couronnes :</strong> Auditez et validez chaque nouvel établissement burkinabè voulant rejoindre la plateforme.
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 font-extrabold flex items-center justify-center text-xs flex-shrink-0">2</div>
                  <div>
                    <strong className="text-gray-900 dark:text-white">Modération & Résolution :</strong> Supprimez les avis offensants et supervisez le bon respect de la charte de civilité festive de Zaka+.
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-150 dark:border-gray-900 bg-gray-50 dark:bg-gray-900/30 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className="py-3 px-6 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl active:scale-[0.98] transition-all cursor-pointer text-xs"
          >
            Fermer le Guide
          </button>
        </div>
      </div>
    </div>
  );
}
