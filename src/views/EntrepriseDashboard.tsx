import React, { useState } from 'react';
import { useAppStore } from '../store';
import { Building2, LogOut, CheckCircle2, MessageSquare, Megaphone, Calendar, Tag, Plus, Eye, X, Image as ImageIcon } from 'lucide-react';
import { PubType } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { RichTextEditor } from '../components/RichTextEditor';

export function EntrepriseDashboard({ onLogout }: { onLogout: () => void }) {
  const { currentUser, entreprises, publications, addPublication } = useAppStore();
  const currentEnterprise = (entreprises || []).find(e => e.id === currentUser?.id);

  // Modal States
  const [showPubModal, setShowPubModal] = useState(false);
  const [pubType, setPubType] = useState<PubType>('evenement');
  const [pubTitle, setPubTitle] = useState('');
  const [pubDesc, setPubDesc] = useState('');
  const [pubImage, setPubImage] = useState('');
  const [pubStartDate, setPubStartDate] = useState('');
  const [pubEndDate, setPubEndDate] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pubError, setPubError] = useState<string | null>(null);

  if (!currentUser || !currentEnterprise) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl shadow-sm max-w-md mx-auto mt-20 border border-gray-100">
        <Building2 className="w-16 h-16 text-orange-500 mx-auto mb-4 animate-pulse" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">Chargement de votre compte</h3>
        <p className="text-sm text-gray-500 mb-6">Récupération des informations de marque...</p>
        <button onClick={onLogout} className="px-5 py-2.5 bg-red-50 text-red-600 font-bold rounded-xl text-xs hover:bg-red-100 transition-colors">
          Déconnexion
        </button>
      </div>
    );
  }

  // Verification Pending Screen
  if (currentEnterprise.status === 'en_attente') {
    return (
      <div className="p-8 max-w-lg mx-auto mt-12 bg-white rounded-3xl shadow-md border border-amber-200 text-center">
        <div className="w-20 h-20 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Building2 className="w-10 h-10 text-amber-500 animate-pulse" />
        </div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">Validation en cours 💡</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          Merci d'avoir rejoint <strong>Zaka+</strong> ! Votre profil <strong>{currentEnterprise.name}</strong> est en attente d'approbation par notre équipe d'administration.
        </p>
        <div className="bg-amber-50/50 rounded-2xl p-4 text-left border border-amber-100 space-y-2 mb-8">
          <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider">Récapitulatif de votre demande :</h4>
          <div className="text-xs text-gray-700">
            <span className="font-extrabold text-gray-900">Secteur :</span> {currentEnterprise.sector}
          </div>
          <div className="text-xs text-gray-700">
            <span className="font-extrabold text-gray-900">Description :</span> {currentEnterprise.description}
          </div>
          {currentEnterprise.philosophy && (
            <div className="text-xs text-gray-700 pt-1 border-t border-amber-200/50">
              <span className="font-extrabold text-gray-900 block mb-0.5">Pourquoi rejoignez-vous Zaka+ ?</span>
              <p className="italic text-gray-600">"{currentEnterprise.philosophy}"</p>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mb-6">Vous recevrez un accès complet aux fonctionnalités dès que votre compte aura été activé.</p>
        <button onClick={onLogout} className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs active:scale-[0.98] transition-all cursor-pointer">
          Déconnexion
        </button>
      </div>
    );
  }

  // Filter enterprise publications
  const myPublications = publications.filter(p => p.establishmentId === currentUser.id);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        setIsUploadingImage(true);
        const base64 = await compressImage(e.target.files[0], 1200, 800, 0.7);
        setPubImage(base64);
      } catch (error) {
        console.error("Image compression error:", error);
      } finally {
        setIsUploadingImage(false);
      }
    }
  };

  const handlePubSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pubTitle || !pubDesc) {
      setPubError("Veuillez remplir les champs obligatoires.");
      return;
    }
    try {
      setIsSubmitting(false);
      setPubError(null);
      await addPublication({
        establishmentId: currentUser.id,
        type: pubType,
        title: pubTitle,
        description: pubDesc,
        imageUrl: pubImage || undefined,
        startDate: pubStartDate || undefined,
        endDate: pubEndDate || undefined,
        status: 'active'
      });
      // Reset form
      setShowPubModal(false);
      setPubTitle('');
      setPubDesc('');
      setPubImage('');
      setPubStartDate('');
      setPubEndDate('');
    } catch (err) {
      console.error(err);
      setPubError("Une erreur est survenue lors de la publication.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto pb-24">
      {/* Enterprise Header */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-amber-50 to-transparent rounded-bl-full -z-0"></div>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10">
          {currentEnterprise.logo ? (
            <img src={currentEnterprise.logo} alt={currentEnterprise.name} className="w-20 h-20 rounded-2xl object-cover border border-gray-150 shadow-xs flex-shrink-0" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-10 h-10 text-amber-500" />
            </div>
          )}
          <div className="flex-1 text-center sm:text-left min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-2xl font-black text-gray-900 leading-tight">{currentEnterprise.name}</h2>
              <span className="self-center sm:self-auto text-[10px] font-extrabold px-2.5 py-0.5 bg-amber-50 border border-amber-100 text-amber-800 rounded-full uppercase tracking-wider">
                🤝 Partenaire {currentEnterprise.sector}
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-1 max-w-md">{currentEnterprise.description}</p>
            <div className="flex items-center justify-center sm:justify-start gap-4 mt-3 text-xs font-bold text-gray-600">
              <span className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                👤 {currentEnterprise.followers?.length || 0} Abonnés
              </span>
              <span className="bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                📢 {myPublications.length} Campagnes
              </span>
            </div>
          </div>
          <button onClick={onLogout} className="p-2.5 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 border border-gray-100 hover:border-red-100 rounded-full cursor-pointer transition-all self-center sm:self-start">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-black text-gray-900">Espace Partenaire</h3>
          <p className="text-xs text-gray-500">Diffusez vos contenus et restez connecté</p>
        </div>
        <button
          onClick={() => {
            setPubType('evenement');
            setShowPubModal(true);
          }}
          className="flex items-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-2xl text-xs shadow-md active:scale-[0.98] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Créer une publication
        </button>
      </div>

      {/* Info Warning */}
      <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-800 font-bold mb-6 flex items-start gap-3">
        <span className="text-base">ℹ️</span>
        <p className="font-medium">
          En tant que profil <strong>Entreprise Partenaire</strong>, vous pouvez publier des promotions, des événements sponsorisés ou des communiqués officiels. Ces publications seront marquées d'un badge <strong className="text-amber-800 font-extrabold">Partenaire</strong> sur la carte et dans les flux des utilisateurs.
        </p>
      </div>

      {/* Publications List */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Vos publications actives ({myPublications.length})</h4>
        {myPublications.map(pub => {
          const isEvent = pub.type === 'evenement';
          const isAnnonce = pub.type === 'annonce';
          return (
            <div key={pub.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-xs hover:border-gray-200 transition-all flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                  isEvent ? 'bg-red-50 text-red-500 border-red-100' :
                  isAnnonce ? 'bg-blue-50 text-blue-500 border-blue-100' :
                  'bg-orange-50 text-orange-500 border-orange-100'
                }`}>
                  {isEvent ? <Calendar className="w-5 h-5" /> :
                   isAnnonce ? <Megaphone className="w-5 h-5" /> :
                   <Tag className="w-5 h-5" />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[9px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded ${
                      isEvent ? 'bg-red-100 text-red-800' :
                      isAnnonce ? 'bg-blue-100 text-blue-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {pub.type === 'evenement' ? 'Événement' : pub.type === 'annonce' ? 'Communiqué' : 'Promo'}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">Créé le {new Date(pub.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <h5 className="font-bold text-gray-900 mt-1 truncate">{pub.title}</h5>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-lg border border-green-100">
                  Active
                </span>
              </div>
            </div>
          );
        })}
        {myPublications.length === 0 && (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100 text-gray-500 font-medium">
            <Megaphone className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-xs">Vous n'avez pas encore publié de contenu.</p>
          </div>
        )}
      </div>

      {/* CREATE PUBLICATION MODAL */}
      {showPubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 flex-shrink-0">
              <div>
                <h3 className="text-lg font-black text-gray-900">Nouvelle publication</h3>
                <p className="text-xs text-gray-500">Mettez en avant votre marque</p>
              </div>
              <button onClick={() => setShowPubModal(false)} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePubSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-left">
              {pubError && (
                <div className="p-3.5 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl">
                  ⚠️ {pubError}
                </div>
              )}

              {/* Type Selection */}
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Type de Publication</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['evenement', 'annonce', 'promo'] as PubType[]).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPubType(type)}
                      className={`py-3.5 px-2 rounded-2xl border font-bold text-xs transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        pubType === type
                          ? 'border-orange-500 bg-orange-50/50 text-orange-800 shadow-xs'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {type === 'evenement' ? <Calendar className="w-4 h-4" /> :
                       type === 'annonce' ? <Megaphone className="w-4 h-4" /> :
                       <Tag className="w-4 h-4" />}
                      {type === 'evenement' ? 'Événement' : type === 'annonce' ? 'Communiqué' : 'Promo'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5">Titre de la publication *</label>
                <input
                  type="text"
                  required
                  placeholder={pubType === 'evenement' ? "Ex: Soirée Heineken VIP" : "Ex: Communiqué de rentrée..."}
                  value={pubTitle}
                  onChange={e => setPubTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                />
              </div>

              {/* Dates for events */}
              {pubType === 'evenement' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5">Date Début</label>
                    <input
                      type="date"
                      value={pubStartDate}
                      onChange={e => setPubStartDate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5">Date Fin</label>
                    <input
                      type="date"
                      value={pubEndDate}
                      onChange={e => setPubEndDate(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs focus:bg-white focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Image Upload */}
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5">Visuel / Affiche</label>
                <div className="flex items-center gap-4">
                  {pubImage ? (
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-gray-200 flex-shrink-0 relative group">
                      <img src={pubImage} alt="Visuel" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPubImage('')}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-16 h-16 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 hover:border-orange-500 transition-colors flex items-center justify-center cursor-pointer flex-shrink-0">
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    </label>
                  )}
                  <div className="text-xs text-gray-500">
                    {isUploadingImage ? (
                      <span className="text-orange-600 font-bold">Optimisation de l'image en cours...</span>
                    ) : (
                      "Format paysage recommandé. L'image sera automatiquement redimensionnée."
                    )}
                  </div>
                </div>
              </div>

              {/* Description RichTextEditor */}
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-1.5">Description de l'offre ou de l'événement *</label>
                <RichTextEditor value={pubDesc} onChange={setPubDesc} placeholder="Décrivez votre offre, donnez les détails ou le programme..." />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-100 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPubModal(false)}
                  className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl text-xs active:scale-[0.98] transition-all cursor-pointer text-center"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage}
                  className="flex-1 py-3.5 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-250 disabled:text-gray-400 text-white font-bold rounded-2xl text-xs shadow-md active:scale-[0.98] transition-all cursor-pointer"
                >
                  {isSubmitting ? "Publication..." : "Publier maintenant"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
