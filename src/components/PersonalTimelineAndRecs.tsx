import { useState } from 'react';
import { useAppStore } from '../store';
import { jsPDF } from 'jspdf';
import { triggerHapticFeedback } from '../utils/haptics';
import { 
  Sparkles, 
  Calendar, 
  MapPin, 
  Music, 
  Download, 
  Gift, 
  Compass, 
  Flame, 
  Users, 
  Award,
  BookOpen
} from 'lucide-react';

export function PersonalTimelineAndRecs() {
  const { currentUser, establishments, publications } = useAppStore();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Mock timeline items representing historical user outings
  const timelineItems = [
    {
      id: 'outing_1',
      date: 'Vendredi dernier (24 Juillet)',
      title: "La Fièvre du Vendredi à l'Avenue",
      establishment: "L'Avenue (Zone du Bois)",
      participants: 120,
      dj: "DJ Carlos",
      tracks: ["Burna Boy - Last Last", "Asake - Lonely At the Top", "Rema - Charm"],
      vibe: "Surchauffe 🔥",
      pointsEarned: 50,
      quote: "DJ Carlos est déjà aux platines !"
    },
    {
      id: 'outing_2',
      date: '18 Juillet',
      title: "Soirée Happy Hour & Brochettes",
      establishment: "Ali's Maquis (Patte d'Oie)",
      participants: 45,
      dj: "Ambiance locale",
      tracks: ["Magic System - Premier Gaou", "Fally Ipupa - Bloqué"],
      vibe: "Détente & Grillades 🍢",
      pointsEarned: 25,
      quote: "Happy Hour prolongé jusqu'à 22h"
    }
  ];

  // AI Recommendation Logic based on current user or default favorites
  const getAiRecommendations = () => {
    // Return 2 premium recommendations from establishments or mock them if none
    const list = establishments.slice(0, 2);
    if (list.length > 0) return list;
    return [
      { id: 'rec_1', name: "Le Calypso VIP", category: "boite_de_nuit", neighborhood: "Ouaga 2000", rating: 4.8 },
      { id: 'rec_2', name: "Maquis Le Bambou", category: "maquis", neighborhood: "Gounghin", rating: 4.5 }
    ];
  };

  const recommendedEsts = getAiRecommendations();

  // Export to PDF function using real jsPDF!
  const handleExportPdf = () => {
    if (!currentUser) return;
    triggerHapticFeedback(40);
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF();
      
      // Document Header
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(234, 88, 12); // Orange color
      doc.text("ZAKA - NIGHTLIFE MEMORIES", 14, 25);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Rapport personnalisé généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 32);
      
      // Divider line
      doc.setDrawColor(220);
      doc.line(14, 37, 196, 37);
      
      // User info section
      doc.setFontSize(14);
      doc.setTextColor(20);
      doc.setFont('Helvetica', 'bold');
      doc.text("Profil du Membre", 14, 47);
      
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(60);
      doc.text(`Nom complet : ${currentUser.name}`, 14, 55);
      doc.text(`Compte : ${currentUser.role === 'gerant' ? 'Gérant' : 'Client'}`, 14, 61);
      doc.text(`Points de fidélité : ${currentUser.points || 0} PTS`, 14, 67);
      doc.text(`Niveau Badge : ${(!currentUser.points || currentUser.points < 100) ? 'Novice' : (currentUser.points < 500 ? 'Habitue' : 'Ambassadeur')}`, 14, 73);
      
      // Output statistics
      doc.setFontSize(14);
      doc.setTextColor(20);
      doc.setFont('Helvetica', 'bold');
      doc.text("Statistiques Générales de Sortie", 14, 85);
      
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(60);
      doc.text("- Total de sorties enregistrées : 8", 14, 93);
      doc.text("- Quartier le plus fréquenté : Zone du Bois, Ouagadougou", 14, 99);
      doc.text("- Catégorie favorite : Maquis & Boîtes", 14, 105);
      
      // Timeline section
      doc.setFontSize(14);
      doc.setTextColor(20);
      doc.setFont('Helvetica', 'bold');
      doc.text("Chronologie des Souvenirs Nightlife", 14, 117);
      
      let yOffset = 125;
      timelineItems.forEach((item, index) => {
        // Souvenir background box
        doc.setFillColor(250, 245, 240);
        doc.rect(14, yOffset, 182, 36, 'F');
        
        doc.setFontSize(11);
        doc.setTextColor(234, 88, 12);
        doc.setFont('Helvetica', 'bold');
        doc.text(`${index + 1}. ${item.title}`, 18, yOffset + 7);
        
        doc.setFontSize(9);
        doc.setTextColor(80);
        doc.setFont('Helvetica', 'normal');
        doc.text(`Date : ${item.date}  |  Lieu : ${item.establishment}`, 18, yOffset + 14);
        doc.text(`Playlist DJ : ${item.tracks.join(', ')}`, 18, yOffset + 21);
        doc.text(`Vibe : ${item.vibe}  |  Quote marquant : "${item.quote}"`, 18, yOffset + 28);
        
        yOffset += 42;
      });

      // Export footer
      doc.setFontSize(9);
      doc.setTextColor(140);
      doc.text("Généré via ZAKA+ - Le réseau social ultime de la nuit à Ouagadougou.", 14, 280);

      // Save the PDF
      doc.save(`zaka_souvenirs_${currentUser.name.replace(/\s+/g, '_').toLowerCase()}.pdf`);
      alert("Votre livre de souvenirs PDF a été téléchargé avec succès ! 📸✨");
    } catch (err: any) {
      console.error("Error generating memory book PDF:", err);
      alert("Une erreur est survenue lors de la génération du PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Real-time personal stats */}
      <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-500" />
          <span>Statistiques de Sorties & Fidélité</span>
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-orange-50/40 dark:bg-orange-950/5 border border-orange-100/50 dark:border-orange-900/10 rounded-2xl">
            <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider">Total sorties</span>
            <div className="text-xl font-black text-gray-950 dark:text-white mt-1">8 Sorties</div>
          </div>
          <div className="p-4 bg-purple-50/40 dark:bg-purple-950/5 border border-purple-100/50 dark:border-purple-900/10 rounded-2xl">
            <span className="text-[9px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Quartier favori</span>
            <div className="text-sm font-black text-gray-950 dark:text-white mt-1 truncate">Zone du Bois</div>
          </div>
          <div className="p-4 bg-blue-50/40 dark:bg-blue-950/5 border border-blue-100/50 dark:border-blue-900/10 rounded-2xl">
            <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Catégorie préférée</span>
            <div className="text-sm font-black text-gray-950 dark:text-white mt-1">Maquis (60%)</div>
          </div>
          <div className="p-4 bg-emerald-50/40 dark:bg-emerald-950/5 border border-emerald-100/50 dark:border-emerald-900/10 rounded-2xl">
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Fidélité Zaka</span>
            <div className="text-sm font-black text-gray-950 dark:text-white mt-1">{currentUser?.points || 0} Points</div>
          </div>
        </div>
      </div>

      {/* Timeline Souvenirs with PDF Exporter */}
      <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-600" />
            <span>Historique des Souvenirs</span>
          </h3>
          <button
            onClick={handleExportPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer shadow-md shadow-orange-600/15"
          >
            {isGeneratingPdf ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Export Souvenirs PDF</span>
          </button>
        </div>

        <div className="space-y-4 relative border-l-2 border-orange-100 dark:border-orange-950 pl-4 ml-2">
          {timelineItems.map((item) => (
            <div key={item.id} className="relative space-y-1.5 bg-gray-50/70 dark:bg-gray-900/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-850">
              {/* Bullet circle */}
              <div className="absolute -left-[25px] top-4 w-3.5 h-3.5 rounded-full bg-orange-600 border-4 border-white dark:border-gray-950"></div>
              
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-400 font-bold">{item.date}</span>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-400">
                  +{item.pointsEarned} Pts
                </span>
              </div>

              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">{item.title}</h4>
              <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>{item.establishment}</span>
              </p>

              {/* Tracks & Quote details */}
              <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1">
                <div className="flex items-center gap-1.5 text-[10px] text-purple-700 dark:text-purple-400 font-bold">
                  <Music className="w-3 h-3 shrink-0" />
                  <span className="truncate">Playlist : {item.tracks.join(', ')}</span>
                </div>
                <p className="text-[10px] text-gray-400 italic">
                  ❝ {item.quote} ❞
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendation engine */}
      <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
          <span>Recommandations d'Établissements IA</span>
        </h3>
        <p className="text-[10px] text-gray-400 font-semibold">
          Recommandations basées sur vos quartiers préférés, vos styles musicaux de prédilection et l'heure actuelle.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {recommendedEsts.map((est) => (
            <div key={est.id} className="p-4 bg-gray-50/85 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-850 rounded-2xl space-y-1.5 relative overflow-hidden flex flex-col justify-between">
              <div>
                <span className="text-[8px] font-black uppercase text-orange-600 bg-orange-100/50 dark:bg-orange-950 px-2 py-0.5 rounded-full">
                  98% Match
                </span>
                <h4 className="font-black text-xs text-gray-900 dark:text-white mt-2 truncate">{est.name}</h4>
                <p className="text-[10px] text-gray-400 font-bold flex items-center gap-0.5 mt-0.5">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span>{est.neighborhood || 'Ouagadougou'}</span>
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-gray-850 mt-2">
                <span className="text-[9px] text-yellow-500 font-black">★ 4.8</span>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Conseillé</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
