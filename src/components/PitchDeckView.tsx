import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  Sparkles,
  TrendingUp,
  Users,
  Building2,
  Mic,
  Megaphone,
  Briefcase,
  Globe,
  DollarSign,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Award,
  Smartphone,
  Zap,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  MapPin,
  Heart,
  Download,
  Star,
  Calendar,
  MessageSquare,
  Tag
} from 'lucide-react';

interface PitchDeckViewProps {
  onClose?: () => void;
}

export const PitchDeckView: React.FC<PitchDeckViewProps> = ({ onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleDownload = () => {
    const doc = new jsPDF();
    let y = 20;

    // Title / Cover
    doc.setFillColor(249, 115, 22); // Orange
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("ZAKA+ | Pitch Deck Investisseurs 2026", 15, 25);

    y = 52;
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(14);
    doc.text("La Super-App Culturelle, Événementielle & Business d'Afrique", 15, y);
    
    y += 8;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Connecter les sorties, les talents, les établissements et les marques en un seul écosystème.", 15, y);

    y += 16;
    doc.setFontSize(13);
    doc.setTextColor(249, 115, 22);
    doc.text("1. Le Problème & L'Opportunité", 15, y);

    y += 8;
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    const problems = [
      "• Fragmentation de l'offre : Difficulté pour découvrir spots et soirées en temps réel.",
      "• Sous-visibilité des talents : Artistes et DJs peinent à monétiser leur art.",
      "• Gestion archaïque : Manque d'outils digitaux pour les gérants d'établissements.",
      "• Besoins publicitaires : Recherche de canaux hyper-localisés et mesurables."
    ];
    problems.forEach(p => {
      doc.text(p, 18, y);
      y += 6;
    });

    y += 8;
    doc.setFontSize(13);
    doc.setTextColor(249, 115, 22);
    doc.text("2. Bénéfices par Profil", 15, y);

    y += 8;
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    const profiles = [
      "• Client : Géolocalisation, réseau social, amis, adhésion aux établissements, avis & calendrier.",
      "• Gérant : Campagnes d'invitations, caisse & reçus, gestion des stocks, stats et promotions.",
      "• Artiste : Profil pro, biographie, liens streaming (Spotify, Apple), stories et booking.",
      "• Annonceur (ZAKA Ads) : Régie publicitaire ciblée, suivi en temps réel des performances."
    ];
    profiles.forEach(pr => {
      doc.text(pr, 18, y);
      y += 6;
    });

    y += 8;
    doc.setFontSize(13);
    doc.setTextColor(249, 115, 22);
    doc.text("3. Modèle de Monétisation", 15, y);

    y += 8;
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    const monetization = [
      "• Abonnements SaaS Pro pour les gérants et entreprises.",
      "• Régie Publicitaire (ZAKA Ads) facturée au CPM / CPC.",
      "• Commissions sur la billetterie et les contrats de booking d'artistes.",
      "• Partenariats institutionnels et touristiques."
    ];
    monetization.forEach(m => {
      doc.text(m, 18, y);
      y += 6;
    });

    y += 8;
    doc.setFontSize(13);
    doc.setTextColor(249, 115, 22);
    doc.text("4. Scalabilité & Expansion Internationale", 15, y);

    y += 8;
    doc.setFontSize(9.5);
    doc.setTextColor(60, 60, 60);
    doc.text("• Expansion rapide dans les capitales africaines (Abidjan, Dakar, Lomé, Bamako).", 18, y);
    y += 6;
    doc.text("• Architecture Cloud robuste prête pour le passage à l'échelle international.", 18, y);

    doc.save("ZAKA+_Pitch_Deck_2026.pdf");
  };

  const slides = [
    // Slide 1: Cover / Vision
    {
      title: "ZAKA+",
      subtitle: "La Super-App Culturelle, Événementielle & Business d'Afrique",
      tagline: "Connecter les sorties, les talents, les établissements et les marques en un seul écosystème numérique unifié.",
      badge: "Pitch Deck Investisseurs 2026",
      theme: "from-orange-600 via-amber-600 to-yellow-600"
    },
    // Slide 2: Le Problème & L'Opportunité
    {
      title: "Le Problème & L'Opportunité",
      subtitle: "Un marché urbain vibrant mais fragmenté",
      content: [
        {
          title: "Fragmentation de l'offre",
          desc: "Difficulté pour les citadins de découvrir en temps réel les meilleurs spots, soirées, concerts et promotions autour d'eux."
        },
        {
          title: "Sous-visibilité des talents",
          desc: "Les artistes locaux, DJs et troupes peinent à monétiser leur art et à être contactés directement par les gérants de bars/clubs."
        },
        {
          title: "Gestion hôtelière & de caisse archaïque",
          desc: "Les gérants d'établissements manquent d'outils digitaux modernes pour la gestion des stocks, des ventes, du personnel et des réservations."
        },
        {
          title: "Besoins publicitaires non ciblés",
          desc: "Les annonceurs et grandes entreprises recherchent des canaux de publicité hyper-localisés, mesurables et rentables."
        }
      ]
    },
    // Slide 3: La Solution ZAKA+
    {
      title: "La Solution ZAKA+",
      subtitle: "Un écosystème multi-profils intégré",
      content: [
        {
          title: "Plateforme Tout-en-Un",
          desc: "Une application mobile et web fluide, rapide, disponible en PWA avec géolocalisation interactive et chat en temps réel."
        },
        {
          title: "Expérience Hyper-Localisée",
          desc: "Conçue initialement à Ouagadougou (Burkina Faso) avec une architecture prête pour l'expansion panafricaine et internationale."
        },
        {
          title: "Modèle Gagnant-Gagnant",
          desc: "Chaque acteur (Client, Gérant, Annonceur, Entreprise, Artiste) dispose de son espace dédié sur-mesure."
        }
      ]
    },
    // Slide 4: Bénéfices par Profil - CLIENT
    {
      title: "Expérience Client Enrichie",
      subtitle: "Social, Social Discovery & Organisation des Sorties",
      profiles: [
        {
          icon: Users,
          role: "👤 Le Client (Grand Public)",
          features: [
            "📍 Découverte géographique : Visualisation instantanée des établissements autour de soi (carte interactive & radars).",
            "🤝 Réseau Social & Amis : Ajout d'amis, invitations directes pour les sorties et soirées.",
            "🏛️ Adhésion aux Établissements : Suivi en temps réel des publications et actus de ses spots favoris.",
            "⭐ Avis & Notations : Notes étoilées et commentaires vérifiés sur les établissements.",
            "📅 Profil & Calendrier : Gestion du calendrier personnel, statuts éphémères et partage d'expériences."
          ]
        }
      ]
    },
    // Slide 5: Bénéfices par Profil - ÉTABLISSEMENT & GÉRANT
    {
      title: "Pilier Établissements & Gérants",
      subtitle: "Outils de croissance, caisse, stocks et fidélisation",
      profiles: [
        {
          icon: Building2,
          role: "🏪 Le Gérant d'Établissement",
          features: [
            "📨 Invitations Clients : Campagnes d'invitation ciblées pour attirer du monde.",
            "💳 Caisse & Ventes : Encaissement des ventes et génération automatique de reçus.",
            "📦 Gestion des Stocks : Suivi en temps réel des consommables et inventaires.",
            "📊 Statistiques d'Activité : Tableaux de bord de performance et comptabilité mensuelle.",
            "🏷️ Promotions & Événements : Publication d'offres spéciales et gestion des réservations / bookings d'artistes."
          ]
        }
      ]
    },
    // Slide 6: ZAKA Ads & Annonceurs
    {
      title: "ZAKA Ads & Annonceurs",
      subtitle: "La régie publicitaire hyper-ciblée",
      content: [
        {
          title: "🚀 Boost de Visibilité Ciblée",
          desc: "ZAKA Ads permet aux marques, annonceurs et organisateurs d'événements de diffuser des annonces publicitaires à fort impact directement auprès des citadins actifs et géolocalisés."
        },
        {
          title: "📊 Pilotage & Analytics en Temps Réel",
          desc: "Suivi transparent des impressions, des clics, des conversions et des budgets publicitaires avec paiement sécurisé intégré."
        },
        {
          title: "💼 Opportunité pour les Entreprises",
          desc: "Les entreprises partenaires disposent d'un accès institutionnel pour gérer leurs équipes, leurs campagnes et leurs relations B2B."
        },
        {
          title: "🎤 Espace Artistes & Talents",
          desc: "Les artistes disposent de leur vitrine pro (biographie, genres, liens de streaming Spotify/Apple Music, agenda de prestations et gestion de booking)."
        }
      ]
    },
    // Slide 7: Modèle de Monétisation
    {
      title: "Modèle de Monétisation",
      subtitle: "Des sources de revenus diversifiées et scalables",
      monetization: [
        {
          title: "1. Abonnements SaaS Pro",
          desc: "Forfaits mensuels / annuels pour les gérants d'établissements et entreprises accédant aux outils avancés de caisse, stocks et comptabilité."
        },
        {
          title: "2. Régie Publicitaire (ZAKA Ads)",
          desc: "Facturation au CPM / CPC pour les campagnes publicitaires, boosts d'événements et annonces de marques partenaires."
        },
        {
          title: "3. Commissions sur Billetterie & Booking",
          desc: "Prélèvement d'un pourcentage sur les transactions de billetterie d'événements et les contrats de prestation d'artistes."
        },
        {
          title: "4. Partenariats Institutionnels",
          desc: "Accompagnement de grands groupes et offices du tourisme pour la promotion culturelle."
        }
      ]
    },
    // Slide 8: Scalabilité & Expansion Internationale
    {
      title: "Scalabilité & Expansion",
      subtitle: "Du Burkina Faso vers l'Afrique de l'Ouest et l'International",
      content: [
        {
          title: "Architecture Cloud Robuste",
          desc: "Développée sur React 18, TypeScript, Tailwind CSS, Node.js et Supabase, assurant une scalabilité horizontale instantanée."
        },
        {
          title: "Modèle Réplicable (Playbook)",
          desc: "La structure multi-villes et multi-pays permet d'ouvrir de nouvelles capitales africaines (Abidjan, Dakar, Lomé, Bamako) en quelques semaines."
        },
        {
          title: "Expérience PWA & Mobile Native",
          desc: "Accessible partout via navigateurs et applications mobiles (Capacitor), garantissant un coût d'acquisition client (CAC) réduit."
        }
      ]
    },
    // Slide 9: Conclusion & Appel à l'Investissement
    {
      title: "Rejoignez l'Aventure ZAKA+",
      subtitle: "Investissez dans le leader de la tech culturelle africaine",
      closing: "Nous levons des fonds pour accélérer notre expansion géographique, renforcer notre équipe technique et déployer notre plan marketing d'acquisition à grande échelle.",
      cta: "Contactez l'équipe fondatrice : contact@zaka-plus.com"
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(prev => prev - 1);
    }
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col justify-between p-4 sm:p-8 print:bg-white print:text-black">
      {/* Top Header Bar */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between border-b border-gray-800 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center font-black text-xl shadow-lg shadow-orange-600/30">
            Z+
          </div>
          <div>
            <span className="font-black text-lg tracking-wider bg-gradient-to-r from-orange-400 to-amber-200 bg-clip-text text-transparent">
              ZAKA+ Investor Deck
            </span>
            <span className="text-xs text-gray-400 block">Edition 2026 • Confidentiel</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownload}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-2 cursor-pointer shadow-md shadow-orange-600/20 transition-all"
            title="Télécharger le Pitch Deck en PDF"
          >
            <Download size={16} />
            <span>Télécharger / Imprimer PDF</span>
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              Fermer
            </button>
          )}
        </div>
      </div>

      {/* Main Slide Content Area */}
      <div className="max-w-5xl mx-auto w-full my-auto py-8">
        {currentSlide === 0 ? (
          // Slide 1: Cover
          <div className="text-center space-y-6 py-12 animate-fadeIn">
            <span className="px-4 py-1.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full text-xs font-black uppercase tracking-widest">
              {slide.badge}
            </span>
            <h1 className="text-4xl sm:text-7xl font-black tracking-tight bg-gradient-to-r from-orange-400 via-amber-200 to-yellow-400 bg-clip-text text-transparent">
              {slide.title}
            </h1>
            <p className="text-xl sm:text-2xl font-bold text-gray-300 max-w-3xl mx-auto">
              {slide.subtitle}
            </p>
            <p className="text-sm text-gray-400 max-w-2xl mx-auto leading-relaxed">
              {slide.tagline}
            </p>
          </div>
        ) : currentSlide === 1 || currentSlide === 2 || currentSlide === 5 || currentSlide === 7 ? (
          // Slides with grid cards
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black text-white print:text-black">{slide.title}</h2>
              <p className="text-sm text-orange-400 font-bold">{slide.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {slide.content?.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gray-900/80 border border-gray-800 p-6 rounded-3xl space-y-2 hover:border-orange-500/50 transition-all shadow-xl print:bg-gray-50 print:border-gray-300 print:text-black"
                >
                  <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center font-black text-sm">
                    {idx + 1}
                  </div>
                  <h3 className="font-black text-base text-white print:text-black">{item.title}</h3>
                  <p className="text-xs text-gray-400 leading-relaxed print:text-gray-700">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : currentSlide === 3 || currentSlide === 4 ? (
          // Slides for Profiles (Client & Gérant avec détails riches)
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black text-white">{slide.title}</h2>
              <p className="text-sm text-orange-400 font-bold">{slide.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-4 max-w-3xl mx-auto">
              {slide.profiles?.map((prof, idx) => {
                const Icon = prof.icon;
                return (
                  <div
                    key={idx}
                    className="bg-gray-900/80 border border-gray-800 p-6 sm:p-8 rounded-3xl space-y-4 hover:border-orange-500/50 transition-all shadow-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-orange-600/20 text-orange-400 flex items-center justify-center">
                        <Icon size={24} />
                      </div>
                      <h3 className="font-black text-xl text-white">{prof.role}</h3>
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-1 gap-2.5 pt-2">
                      {prof.features.map((feat, fIdx) => (
                        <li key={fIdx} className="text-xs sm:text-sm text-gray-300 flex items-start gap-2.5 bg-gray-950/60 p-3 rounded-xl border border-gray-800/80">
                          <CheckCircle2 size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        ) : currentSlide === 6 ? (
          // Slide 6: Monetization
          <div className="space-y-6 animate-fadeIn">
            <div className="text-center space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black text-white">{slide.title}</h2>
              <p className="text-sm text-orange-400 font-bold">{slide.subtitle}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
              {slide.monetization?.map((mon, idx) => (
                <div
                  key={idx}
                  className="bg-gradient-to-br from-gray-900 to-gray-900/50 border border-gray-800 p-6 rounded-3xl space-y-3 hover:border-orange-500/50 transition-all shadow-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                      <DollarSign size={20} />
                    </div>
                    <h3 className="font-black text-base text-white">{mon.title}</h3>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{mon.desc}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Slide 9: Closing
          <div className="text-center space-y-6 py-12 animate-fadeIn max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center mx-auto shadow-xl shadow-orange-600/30">
              <Sparkles size={32} />
            </div>
            <h2 className="text-4xl font-black text-white">{slide.title}</h2>
            <p className="text-xl font-bold text-orange-400">{slide.subtitle}</p>
            <p className="text-sm text-gray-300 leading-relaxed bg-gray-900 p-6 rounded-3xl border border-gray-800">
              {slide.closing}
            </p>
            <div className="pt-4">
              <span className="inline-block px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-600/30 cursor-pointer">
                {slide.cta}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation Controls */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between border-t border-gray-800 pt-4 print:hidden">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
        >
          <ChevronLeft size={16} /> Précédent
        </button>

        <div className="flex gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${
                currentSlide === idx ? 'bg-orange-500 w-6' : 'bg-gray-800'
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          disabled={currentSlide === slides.length - 1}
          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all shadow-md shadow-orange-600/20"
        >
          Suivant <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};
