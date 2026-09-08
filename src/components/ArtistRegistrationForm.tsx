import React, { useState } from 'react';
import { Mic, Music, MapPin, Phone, MessageCircle, Image as ImageIcon, Check } from 'lucide-react';
import { ARTIST_CATEGORIES, ARTIST_GENRES } from '../types';

interface ArtistRegistrationFormProps {
  initialData?: {
    nomArtiste?: string;
    nomComplet?: string;
    categorieArtistique?: string;
    genres?: string[];
    biographie?: string;
    ville?: string;
    pays?: string;
    whatsappPro?: string;
    telephonePro?: string;
    photoProfil?: string;
    photoCouverture?: string;
  };
  onSubmit: (artistData: any) => void;
  isLoading?: boolean;
}

export const ArtistRegistrationForm: React.FC<ArtistRegistrationFormProps> = ({
  initialData = {},
  onSubmit,
  isLoading = false
}) => {
  const [nomArtiste, setNomArtiste] = useState(initialData.nomArtiste || '');
  const [nomComplet, setNomComplet] = useState(initialData.nomComplet || '');
  const [categorieArtistique, setCategorieArtistique] = useState(initialData.categorieArtistique || 'Chanteur / Chanteuse');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(initialData.genres || ['Afrobeat']);
  const [biographie, setBiographie] = useState(initialData.biographie || '');
  const [ville, setVille] = useState(initialData.ville || 'Ouagadougou');
  const [pays, setPays] = useState(initialData.pays || 'Burkina Faso');
  const [whatsappPro, setWhatsappPro] = useState(initialData.whatsappPro || '');
  const [telephonePro, setTelephonePro] = useState(initialData.telephonePro || '');
  const [photoProfil, setPhotoProfil] = useState(initialData.photoProfil || '');
  const [photoCouverture, setPhotoCouverture] = useState(initialData.photoCouverture || '');

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomArtiste.trim() || !whatsappPro.trim()) {
      alert("Veuillez renseigner le nom d'artiste et le WhatsApp professionnel.");
      return;
    }

    onSubmit({
      nomArtiste,
      nomComplet,
      categorieArtistique,
      genres: selectedGenres,
      biographie,
      ville,
      pays,
      whatsappPro,
      telephonePro,
      photoProfil,
      photoCouverture
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full bg-white dark:bg-gray-900 p-6 rounded-3xl border border-orange-100 dark:border-gray-800 shadow-sm animate-fadeIn">
      <div className="flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
        <div className="w-10 h-10 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center font-bold">
          <Mic size={20} />
        </div>
        <div>
          <h3 className="text-base font-black text-gray-900 dark:text-white">Profil Artiste ZAKA+</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Renseignez vos informations professionnelles pour les gérants et fans.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Nom d'artiste *</label>
          <input
            type="text"
            required
            placeholder="Ex: Smarty, Floby, Dez Altino..."
            value={nomArtiste}
            onChange={e => setNomArtiste(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Nom complet (État civil)</label>
          <input
            type="text"
            placeholder="Prénoms et Nom réels"
            value={nomComplet}
            onChange={e => setNomComplet(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Catégorie artistique *</label>
          <select
            value={categorieArtistique}
            onChange={e => setCategorieArtistique(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
          >
            {ARTIST_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Ville</label>
            <input
              type="text"
              value={ville}
              onChange={e => setVille(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Pays</label>
            <input
              type="text"
              value={pays}
              onChange={e => setPays(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none"
            />
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Genres & Styles musicaux</label>
        <div className="flex flex-wrap gap-1.5">
          {ARTIST_GENRES.map(genre => {
            const isSelected = selectedGenres.includes(genre);
            return (
              <button
                key={genre}
                type="button"
                onClick={() => toggleGenre(genre)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {isSelected && <Check size={12} />}
                <span>{genre}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <MessageCircle size={14} /> WhatsApp Professionnel *
          </label>
          <input
            type="tel"
            required
            placeholder="+226 70 00 00 00"
            value={whatsappPro}
            onChange={e => setWhatsappPro(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
            <Phone size={14} /> Téléphone Manager / Contact
          </label>
          <input
            type="tel"
            placeholder="+226 70 00 00 00"
            value={telephonePro}
            onChange={e => setTelephonePro(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Biographie / Présentation</label>
        <textarea
          rows={3}
          placeholder="Racontez votre parcours artistique, vos succès et vos projets..."
          value={biographie}
          onChange={e => setBiographie(e.target.value)}
          className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none focus:border-orange-500 resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Photo de profil (URL)</label>
          <input
            type="url"
            placeholder="https://..."
            value={photoProfil}
            onChange={e => setPhotoProfil(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Photo de couverture (URL)</label>
          <input
            type="url"
            placeholder="https://..."
            value={photoCouverture}
            onChange={e => setPhotoCouverture(e.target.value)}
            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-900 dark:text-white outline-none"
          />
        </div>
      </div>

      <div className="pt-2 flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-black text-xs rounded-xl shadow-md shadow-orange-600/20 cursor-pointer transition-all disabled:opacity-50"
        >
          {isLoading ? 'Enregistrement...' : 'Finaliser le compte Artiste'}
        </button>
      </div>
    </form>
  );
};
