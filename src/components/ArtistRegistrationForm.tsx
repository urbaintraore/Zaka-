import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Role } from '../types';

export const ArtistRegistrationForm: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [formData, setFormData] = useState({
    nomArtiste: '',
    nomComplet: '',
    phone: '',
    email: '',
    password: '',
    city: 'Ouagadougou',
    country: 'Burkina Faso',
    categorie: 'Chanteur / Chanteuse',
    bio: '',
    whatsappPro: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Auth Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.nomComplet,
            role: 'artiste',
            city: formData.city,
            country: formData.country
          }
        }
      });
      if (authError) throw authError;

      // 2. Create Public User Profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user?.id,
          name: formData.nomComplet,
          email: formData.email,
          phone: formData.phone,
          role: 'artiste',
          city: formData.city,
          country: formData.country
        });
      if (profileError) throw profileError;

      // 3. Create Artist Profile
      const { error: artistError } = await supabase
        .from('artist_profiles')
        .insert({
          user_id: authData.user?.id,
          nom_artiste: formData.nomArtiste,
          categorie_artistique: formData.categorie,
          biographie: formData.bio,
          whatsapp_pro: formData.whatsappPro,
          ville: formData.city,
          pays: formData.country
        });
      if (artistError) throw artistError;

      onComplete();
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6 bg-white rounded-3xl shadow-sm border border-gray-100">
      <h2 className="text-xl font-black text-gray-900">Inscription Artiste</h2>
      {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
      <input type="text" placeholder="Nom d'artiste *" required className="w-full p-3 bg-gray-50 rounded-xl" onChange={e => setFormData({...formData, nomArtiste: e.target.value})} />
      <input type="text" placeholder="Nom complet" className="w-full p-3 bg-gray-50 rounded-xl" onChange={e => setFormData({...formData, nomComplet: e.target.value})} />
      <input type="tel" placeholder="Téléphone *" required className="w-full p-3 bg-gray-50 rounded-xl" onChange={e => setFormData({...formData, phone: e.target.value})} />
      <input type="email" placeholder="Email" className="w-full p-3 bg-gray-50 rounded-xl" onChange={e => setFormData({...formData, email: e.target.value})} />
      <input type="password" placeholder="Mot de passe *" required className="w-full p-3 bg-gray-50 rounded-xl" onChange={e => setFormData({...formData, password: e.target.value})} />
      <input type="text" placeholder="Ville *" required className="w-full p-3 bg-gray-50 rounded-xl" onChange={e => setFormData({...formData, city: e.target.value})} />
      <select className="w-full p-3 bg-gray-50 rounded-xl" onChange={e => setFormData({...formData, categorie: e.target.value})}>
        {['Chanteur / Chanteuse', 'Musicien', 'DJ', 'Groupe / Orchestre', 'Humoriste', 'Comédien', 'Danseur', 'Slameur', 'Poète', 'MC / Animateur', 'Influenceur culturel', 'Artiste visuel', 'Autre'].map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <textarea placeholder="Biographie" className="w-full p-3 bg-gray-50 rounded-xl" onChange={e => setFormData({...formData, bio: e.target.value})} />
      <button type="submit" disabled={loading} className="w-full p-4 bg-orange-600 text-white font-black rounded-xl">{loading ? 'Inscription...' : 'S\'inscrire'}</button>
    </form>
  );
};
