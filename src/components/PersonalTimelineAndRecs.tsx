import { useState } from 'react';
import { useAppStore } from '../store';
import { jsPDF } from 'jspdf';
import { triggerHapticFeedback } from '../utils/haptics';
import { 
  Sparkles, 
  Calendar, 
  MapPin, 
  Download, 
  Compass, 
  Award,
  BookOpen,
  Heart,
  FileText,
  Lock,
  Edit2,
  Trash2,
  Check,
  X,
  Filter,
  Star
} from 'lucide-react';

interface TimelineItem {
  id: string;
  date: string;
  establishmentId: string;
  establishmentName: string;
  neighborhood: string;
  category: string;
  type: 'visite' | 'favori' | 'avis';
  title: string;
  rating?: number; // for review
  comment?: string; // for review
  privateNote?: string; // for visite
  originalId: string; // original Firestore ID
}

export function PersonalTimelineAndRecs() {
  const { 
    currentUser, 
    establishments, 
    favorites, 
    reviews, 
    carnetEntrees,
    updateCarnetEntryNote,
    deleteCarnetEntry
  } = useAppStore();

  const [activeFilter, setActiveFilter] = useState<'tous' | 'visite' | 'favori' | 'avis'>('tous');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!currentUser || currentUser.role !== 'client') {
    return null;
  }

  // Gather real-time data
  const userVisits = carnetEntrees ? carnetEntrees.filter(e => e.type === 'visite') : [];
  const userReviews = reviews ? reviews.filter(r => r.clientId === currentUser.id) : [];
  const userFavIds = favorites[currentUser.id] || [];

  // Calculate stats
  const totalVisits = userVisits.length;
  const totalFavorites = userFavIds.length;
  const totalReviews = userReviews.length;

  // Statistique ludique 1: Preferred neighborhood
  const neighborhoodFreq: Record<string, number> = {};
  userVisits.forEach(v => {
    const est = establishments.find(e => e.id === v.establishmentId);
    if (est && est.neighborhood) {
      neighborhoodFreq[est.neighborhood] = (neighborhoodFreq[est.neighborhood] || 0) + 1;
    }
  });
  userReviews.forEach(r => {
    const est = establishments.find(e => e.id === r.establishmentId);
    if (est && est.neighborhood) {
      neighborhoodFreq[est.neighborhood] = (neighborhoodFreq[est.neighborhood] || 0) + 1;
    }
  });

  let favoriteNeighborhood = 'Aucun quartier';
  let maxNeighborhoodCount = 0;
  Object.entries(neighborhoodFreq).forEach(([name, count]) => {
    if (count > maxNeighborhoodCount) {
      maxNeighborhoodCount = count;
      favoriteNeighborhood = name;
    }
  });

  // Statistique ludique 2: Favorite Maquis
  const visitFreq: Record<string, number> = {};
  userVisits.forEach(v => {
    visitFreq[v.establishmentId] = (visitFreq[v.establishmentId] || 0) + 1;
  });

  let favoriteMaquisName = 'Aucun maquis';
  let maxMaquisVisits = 0;
  Object.entries(visitFreq).forEach(([id, count]) => {
    const est = establishments.find(e => e.id === id);
    if (est && est.category === 'maquis' && count > maxMaquisVisits) {
      maxMaquisVisits = count;
      favoriteMaquisName = est.name;
    }
  });

  // Construct consolidated chronological timeline items
  const timelineItems: TimelineItem[] = [];

  // Add visits
  userVisits.forEach(v => {
    const est = establishments.find(e => e.id === v.establishmentId);
    timelineItems.push({
      id: `visite-${v.id}`,
      date: v.date,
      establishmentId: v.establishmentId,
      establishmentName: est ? est.name : 'Établissement inconnu',
      neighborhood: est ? est.neighborhood : 'Quartier inconnu',
      category: est ? est.category : 'autre',
      type: 'visite',
      title: 'Visite enregistrée 📍',
      privateNote: v.privateNote,
      originalId: v.id
    });
  });

  // Add reviews
  userReviews.forEach(r => {
    const est = establishments.find(e => e.id === r.establishmentId);
    timelineItems.push({
      id: `avis-${r.id}`,
      date: r.date,
      establishmentId: r.establishmentId,
      establishmentName: est ? est.name : 'Établissement inconnu',
      neighborhood: est ? est.neighborhood : 'Quartier inconnu',
      category: est ? est.category : 'autre',
      type: 'avis',
      title: 'Avis public rédigé 📝',
      rating: r.rating,
      comment: r.comment,
      originalId: r.id
    });
  });

  // Add favorites
  userFavIds.forEach(favId => {
    const est = establishments.find(e => e.id === favId);
    timelineItems.push({
      id: `favori-${favId}`,
      date: new Date().toISOString(), // Use current or default fallback date since favorites are a set
      establishmentId: favId,
      establishmentName: est ? est.name : 'Établissement inconnu',
      neighborhood: est ? est.neighborhood : 'Quartier inconnu',
      category: est ? est.category : 'autre',
      type: 'favori',
      title: 'Ajouté aux favoris ❤️',
      originalId: favId
    });
  });

  // Sort timeline items chronologically: most recent first
  // Since favorites don't have explicit timestamps, they'll stay at the top/current, which is fine
  const sortedTimeline = [...timelineItems].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Apply active category filter
  const filteredTimeline = sortedTimeline.filter(item => {
    if (activeFilter === 'tous') return true;
    return item.type === activeFilter;
  });

  // Handle saving private note
  const handleSaveNote = async (id: string) => {
    triggerHapticFeedback(20);
    await updateCarnetEntryNote(id, noteText.trim());
    setEditingNoteId(null);
    setNoteText('');
  };

  // Handle deleting private note (sets it to empty string)
  const handleDeleteNote = async (id: string) => {
    triggerHapticFeedback(10);
    if (window.confirm("Voulez-vous vraiment supprimer votre note privée ?")) {
      await updateCarnetEntryNote(id, '');
    }
  };

  // Handle deleting visit entry entirely
  const handleDeleteVisit = async (id: string) => {
    triggerHapticFeedback(40);
    await deleteCarnetEntry(id);
    setDeleteConfirmId(null);
  };

  // AI Recommendation engine
  const getAiRecommendations = () => {
    // Return recommended establishments excluding already visited if possible, or top rated
    const visitedIds = userVisits.map(v => v.establishmentId);
    const unvisited = establishments.filter(e => !visitedIds.includes(e.id) && e.status === 'valide');
    const source = unvisited.length > 0 ? unvisited : establishments;
    return source.slice(0, 2);
  };

  const recommendedEsts = getAiRecommendations();

  // Export to PDF function with real user carnet data
  const handleExportPdf = () => {
    triggerHapticFeedback(40);
    setIsGeneratingPdf(true);

    try {
      const doc = new jsPDF();
      
      // Header Styling
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(234, 88, 12); // Orange
      doc.text("MON CARNET DE SORTIES - ZAKA+", 14, 25);
      
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
      doc.text("Profil Client", 14, 47);
      
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(60);
      doc.text(`Nom complet : ${currentUser.name}`, 14, 55);
      doc.text(`Ville & Pays : ${currentUser.city}, ${currentUser.country}`, 14, 61);
      doc.text(`Points cumulés : ${currentUser.points || 0} PTS`, 14, 67);
      
      // Statistics Summary
      doc.setFontSize(14);
      doc.setTextColor(20);
      doc.setFont('Helvetica', 'bold');
      doc.text("Statistiques Personnelles", 14, 80);
      
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(60);
      doc.text(`- Nombre total de visites : ${totalVisits}`, 14, 88);
      doc.text(`- Établissements en favoris : ${totalFavorites}`, 14, 94);
      doc.text(`- Avis rédigés : ${totalReviews}`, 14, 100);
      doc.text(`- Quartier de prédilection : ${favoriteNeighborhood}`, 14, 106);
      doc.text(`- Maquis préféré : ${favoriteMaquisName}`, 14, 112);
      
      // Journal entries
      doc.setFontSize(14);
      doc.setTextColor(20);
      doc.setFont('Helvetica', 'bold');
      doc.text("Historique de mes Sorties", 14, 125);
      
      let yOffset = 133;
      const pdfEntries = sortedTimeline.slice(0, 8); // Max 8 items for a neat single page layout, or handle page breaks
      
      if (pdfEntries.length === 0) {
        doc.setFontSize(11);
        doc.setFont('Helvetica', 'italic');
        doc.text("Aucun souvenir enregistré pour le moment.", 14, yOffset);
      } else {
        pdfEntries.forEach((item, index) => {
          // If spacing goes beyond page height, break page
          if (yOffset > 240) {
            doc.addPage();
            yOffset = 25;
          }
          
          doc.setFillColor(252, 250, 247);
          doc.rect(14, yOffset, 182, 28, 'F');
          
          doc.setFontSize(11);
          doc.setTextColor(234, 88, 12);
          doc.setFont('Helvetica', 'bold');
          doc.text(`${index + 1}. ${item.establishmentName} (${item.neighborhood})`, 18, yOffset + 7);
          
          doc.setFontSize(9);
          doc.setTextColor(80);
          doc.setFont('Helvetica', 'normal');
          
          const formattedDate = new Date(item.date).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          });
          
          if (item.type === 'visite') {
            doc.text(`Type : Visite  |  Enregistrée le ${formattedDate}`, 18, yOffset + 14);
            if (item.privateNote) {
              doc.setTextColor(110, 110, 110);
              doc.setFont('Helvetica', 'italic');
              doc.text(`Note privée : "${item.privateNote}"`, 18, yOffset + 21);
            } else {
              doc.text("Aucune note privée.", 18, yOffset + 21);
            }
          } else if (item.type === 'avis') {
            doc.text(`Type : Avis Public  |  Note : ${item.rating}/5  |  Publié le ${formattedDate}`, 18, yOffset + 14);
            doc.setTextColor(110, 110, 110);
            doc.setFont('Helvetica', 'italic');
            doc.text(`Avis : "${item.comment}"`, 18, yOffset + 21);
          } else {
            doc.text(`Type : Favori  |  Ajouté à ma liste d'établissements favoris`, 18, yOffset + 14);
          }
          
          yOffset += 32;
        });
      }
      
      // Footer
      doc.setFontSize(9);
      doc.setTextColor(140);
      doc.setFont('Helvetica', 'normal');
      doc.text("Généré via ZAKA+ - Le réseau de la vie nocturne africaine.", 14, 285);
      
      doc.save(`mon_carnet_zaka_${currentUser.name.replace(/\s+/g, '_').toLowerCase()}.pdf`);
      alert("Votre carnet de sorties PDF a été téléchargé avec succès ! 📍✨");
    } catch (err) {
      console.error("Error generating carnet PDF:", err);
      alert("Une erreur est survenue lors de la génération du PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Résumé statistique */}
      <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Award className="w-5 h-5 text-orange-500" />
          <span>Tableau de Bord du Carnet</span>
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <div className="p-3 bg-orange-50/40 dark:bg-orange-950/10 border border-orange-100/50 dark:border-orange-900/10 rounded-2xl text-center">
            <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 uppercase tracking-wider block">Visites</span>
            <div className="text-lg font-black text-gray-950 dark:text-white mt-0.5">{totalVisits} 📍</div>
          </div>
          <div className="p-3 bg-red-50/40 dark:bg-red-950/10 border border-red-100/50 dark:border-red-900/10 rounded-2xl text-center">
            <span className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase tracking-wider block">Favoris</span>
            <div className="text-lg font-black text-gray-950 dark:text-white mt-0.5">{totalFavorites} ❤️</div>
          </div>
          <div className="p-3 bg-blue-50/40 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/10 rounded-2xl text-center">
            <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">Avis</span>
            <div className="text-lg font-black text-gray-950 dark:text-white mt-0.5">{totalReviews} 📝</div>
          </div>
        </div>

        {/* Ludic Stats */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-850 grid grid-cols-2 gap-3 text-[11px] font-bold text-gray-600 dark:text-gray-400">
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Maquis Préféré ce mois</span>
            <span className="text-gray-900 dark:text-white font-extrabold truncate">{favoriteMaquisName}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Quartier de prédilection</span>
            <span className="text-gray-900 dark:text-white font-extrabold truncate">{favoriteNeighborhood}</span>
          </div>
        </div>
      </div>

      {/* Timeline des Sorties */}
      <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-orange-600" />
            <span>Mon Carnet Personnel</span>
          </h3>
          <button
            onClick={handleExportPdf}
            disabled={isGeneratingPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer shadow-sm"
          >
            {isGeneratingPdf ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>Export PDF</span>
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex gap-1 overflow-x-auto hide-scrollbar pb-2 pt-1 border-b border-gray-50 dark:border-gray-850">
          {[
            { id: 'tous', label: 'Tous', count: totalVisits + totalFavorites + totalReviews },
            { id: 'visite', label: 'Visites 📍', count: totalVisits },
            { id: 'favori', label: 'Favoris ❤️', count: totalFavorites },
            { id: 'avis', label: 'Avis 📝', count: totalReviews }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => {
                triggerHapticFeedback(10);
                setActiveFilter(filter.id as any);
              }}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase transition-all whitespace-nowrap cursor-pointer shrink-0 border ${
                activeFilter === filter.id
                  ? 'bg-orange-600 border-orange-600 text-white font-black shadow-xs'
                  : 'bg-gray-50 border-gray-150 text-gray-500 hover:bg-gray-100 dark:bg-gray-900 dark:border-gray-800 dark:text-gray-400'
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        {/* Timeline Items */}
        {filteredTimeline.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 font-bold bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
            Aucun souvenir trouvé pour ce filtre.
          </div>
        ) : (
          <div className="space-y-4 relative border-l-2 border-orange-100 dark:border-orange-950 pl-4 ml-2">
            {filteredTimeline.map((item) => (
              <div key={item.id} className="relative space-y-2 bg-gray-50/70 dark:bg-gray-900/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-850">
                {/* Visual bullet indicator */}
                <div className={`absolute -left-[25px] top-4 w-3.5 h-3.5 rounded-full border-4 border-white dark:border-gray-950 ${
                  item.type === 'visite' ? 'bg-orange-500' :
                  item.type === 'favori' ? 'bg-red-500' : 'bg-blue-500'
                }`}></div>

                {/* Header info */}
                <div className="flex justify-between items-center text-[10px] font-bold text-gray-400">
                  <span className="flex items-center gap-1.5">
                    {item.type === 'visite' && <MapPin className="w-3.5 h-3.5 text-orange-500" />}
                    {item.type === 'favori' && <Heart className="w-3.5 h-3.5 text-red-500 fill-current" />}
                    {item.type === 'avis' && <FileText className="w-3.5 h-3.5 text-blue-500" />}
                    <span className="uppercase text-[9px] text-gray-500 dark:text-gray-400">{item.title}</span>
                  </span>
                  <span>
                    {item.type !== 'favori' && new Date(item.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>

                {/* Establishment details */}
                <div>
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">{item.establishmentName}</h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wide mt-0.5">
                    <span>{item.category.replace(/_/g, ' ')}</span>
                    <span>•</span>
                    <span>{item.neighborhood}</span>
                  </div>
                </div>

                {/* Conditional reviews data */}
                {item.type === 'avis' && (
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-1 bg-white/50 dark:bg-black/20 p-2.5 rounded-xl">
                    <div className="flex items-center gap-1 text-xs text-yellow-500 font-bold">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < (item.rating || 0) ? 'fill-current' : 'text-gray-200 dark:text-gray-800'}`} 
                        />
                      ))}
                      <span className="text-gray-500 dark:text-gray-400 text-[10px] ml-1">{item.rating}/5</span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-medium italic">
                      💬 "{item.comment}"
                    </p>
                  </div>
                )}

                {/* Conditional visit with private note data */}
                {item.type === 'visite' && (
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-850 space-y-2">
                    {editingNoteId === item.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={noteText}
                          onChange={e => setNoteText(e.target.value)}
                          placeholder="Ajoutez une note personnelle privée (rappel pour vous-même, ex: super cocktail, service lent)..."
                          className="w-full p-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-xs font-medium focus:border-orange-500 outline-none text-gray-900 dark:text-white"
                          maxLength={2000}
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNoteId(null);
                              setNoteText('');
                            }}
                            className="p-1 px-2.5 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-bold hover:bg-gray-200 transition-colors cursor-pointer"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveNote(item.originalId)}
                            className="p-1 px-2.5 bg-orange-600 text-white rounded-lg text-[10px] font-bold hover:bg-orange-700 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            Sauvegarder
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-3 bg-white/50 dark:bg-black/20 p-2.5 rounded-xl">
                        <div className="flex-1 min-w-0">
                          {item.privateNote ? (
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-[9px] text-gray-400 uppercase tracking-wider font-extrabold">
                                <Lock className="w-3 h-3 text-orange-500 shrink-0" />
                                <span>Note privée visible uniquement par vous</span>
                              </div>
                              <p className="text-xs text-gray-700 dark:text-gray-300 font-medium leading-relaxed italic pr-2">
                                ❝ {item.privateNote} ❞
                              </p>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNoteId(item.id);
                                setNoteText('');
                              }}
                              className="text-[10px] text-orange-600 dark:text-orange-400 font-bold uppercase flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Ajouter une note privée</span>
                            </button>
                          )}
                        </div>

                        {/* Note Action Buttons */}
                        <div className="flex gap-1 flex-shrink-0">
                          {item.privateNote && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingNoteId(item.id);
                                  setNoteText(item.privateNote || '');
                                }}
                                className="p-1.5 text-gray-400 hover:text-orange-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                title="Modifier la note privée"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteNote(item.originalId)}
                                className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                                title="Supprimer la note privée"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}

                          {/* Visit Entry Deletion */}
                          {deleteConfirmId === item.id ? (
                            <div className="flex items-center gap-1 animate-in fade-in zoom-in-95 duration-150">
                              <button
                                type="button"
                                onClick={() => handleDeleteVisit(item.originalId)}
                                className="px-2 py-1 bg-red-600 text-white rounded-md text-[9px] font-black uppercase cursor-pointer"
                              >
                                Confirmer
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(null)}
                                className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(item.id)}
                              className="p-1.5 text-gray-300 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                              title="Retirer cette visite de mon carnet"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* AI Recommendation engine */}
      <div className="bg-white dark:bg-gray-950 p-6 rounded-3xl border border-gray-150 dark:border-gray-800 shadow-sm space-y-4">
        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-500 animate-pulse" />
          <span>Recommandations Personnalisées IA</span>
        </h3>
        <p className="text-[10px] text-gray-400 font-semibold leading-relaxed">
          Recommandations d'ambiance basées sur vos quartiers préférés, vos styles habituels et les tendances en direct à Ouagadougou.
        </p>

        <div className="grid grid-cols-2 gap-3">
          {recommendedEsts.map((est) => (
            <div key={est.id} className="p-4 bg-gray-50/80 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-850 rounded-2xl space-y-1.5 flex flex-col justify-between relative overflow-hidden">
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
                <span className="text-[9px] text-yellow-500 font-black">★ {est.averageRating?.toFixed(1) || '4.5'}</span>
                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">Conseillé</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
